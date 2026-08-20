import axios from "axios";
import NetInfo from "@react-native-community/netinfo";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL, API_ENDPOINTS } from "../constants/endpoints";
import { getToken, getRefreshToken, setToken, setRefreshToken, clearAuthStorage, getStoredLanguage } from "./storage";

/**
 * Unified Response Normalizer Type
 * @typedef {Object} NormalizedResponse
 * @property {boolean} success - Operation success status
 * @property {number} status - HTTP status code
 * @property {string} message - Descriptive success or error message
 * @property {any} data - Extracted data payload
 * @property {any} [errors] - Nested list of validation errors
 * @property {string} [errorCode] - Internal mapped error code
 */

/**
 * Unified Error Code Enumeration
 */
export const ErrorCodes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  MAINTENANCE: "MAINTENANCE",
};

/**
 * Custom Logger Utility
 */
const Logger = {
  info: (msg, ...args) => {
    if (__DEV__) console.log(`\x1b[34m[API INFO]\x1b[0m ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    if (__DEV__) console.warn(`\x1b[33m[API WARN]\x1b[0m ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    if (__DEV__) console.error(`\x1b[31m[API ERROR]\x1b[0m ${msg}`, ...args);
  },
};

// Global active AbortControllers for cancelling duplicate concurrent requests
const activeControllers = new Map();

// Active Request Locks (Double click prevention)
const activeRequestLocks = new Set();

// Offline Request Queue persisted to AsyncStorage
const offlineQueue = [];
const MAX_QUEUE = 30;
const OFFLINE_QUEUE_KEY = "@jobconnect/offline_queue";

// API Memory Cache for GET requests (prevents memory leak with MAX_CACHE limit)
const apiCache = new Map();
const MAX_CACHE = 100;

// Token Refresh state
let isRefreshing = false;
let refreshSubscribers = [];

// Global connectivity state updated via listener
let isNetworkConnected = true;

// Initialize connectivity listener
NetInfo.addEventListener((state) => {
  const wasOffline = !isNetworkConnected;
  isNetworkConnected = !!state.isConnected;

  if (isNetworkConnected && wasOffline) {
    Logger.info("Internet connection restored. Replaying offline queue...");
    replayOfflineQueue();
  }
});

// Initial fetch of connection state
NetInfo.fetch().then((state) => {
  isNetworkConnected = !!state.isConnected;
});

/**
 * Load persisted offline queue from storage
 */
const loadOfflineQueue = async () => {
  try {
    const val = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return val ? JSON.parse(val) : [];
  } catch (e) {
    Logger.error("Failed to load offline queue from storage:", e);
    return [];
  }
};

/**
 * Save offline queue to storage (config serialize only)
 * @param {Array} queue 
 */
const saveOfflineQueue = async (queue) => {
  try {
    const serialized = queue.map((item) => ({
      url: item.config.url,
      method: item.config.method,
      data: item.config.data,
      params: item.config.params,
      headers: item.config.headers,
      metadata: item.config.metadata,
      queueOffline: item.config.queueOffline,
      lockRequest: item.config.lockRequest,
      cancelDuplicate: item.config.cancelDuplicate,
    }));
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(serialized));
  } catch (e) {
    Logger.error("Failed to save offline queue to storage:", e);
  }
};

// Load and replay saved queue on startup
loadOfflineQueue().then((saved) => {
  if (saved && saved.length > 0) {
    Logger.info(`Restored ${saved.length} pending offline request(s) from storage.`);
    saved.forEach((conf) => {
      offlineQueue.push({ config: conf, resolve: () => {}, reject: () => {} });
    });
    if (isNetworkConnected) {
      replayOfflineQueue();
    }
  }
});

/**
 * Clear all local memory caches, locks, and abort pending requests
 */
export const clearClientState = () => {
  apiCache.clear();
  offlineQueue.length = 0;
  AsyncStorage.removeItem(OFFLINE_QUEUE_KEY).catch(() => {});
  activeControllers.forEach((controller) => {
    try {
      controller.abort();
    } catch (e) {
      // Ignore abort errors
    }
  });
  activeControllers.clear();
  activeRequestLocks.clear();
  delete apiClient.defaults.headers.common["Authorization"];
  Logger.info("API Client local state cleared (Logout/Session Reset).");
};

/**
 * Set cache value with memory-leak size protection
 * @param {string} key 
 * @param {any} response 
 */
const setCacheResponse = (key, response) => {
  if (apiCache.size >= MAX_CACHE) {
    // Evict the oldest key (FIFO)
    const oldestKey = apiCache.keys().next().value;
    apiCache.delete(oldestKey);
  }
  apiCache.set(key, {
    response,
    timestamp: Date.now(),
  });
};

/**
 * Generate unique request key for identification
 * @param {import('axios').InternalAxiosRequestConfig} config 
 * @returns {string}
 */
const generateRequestKey = (config) => {
  const method = config.method || "";
  const url = config.url || "";
  const params = typeof config.params === "object" ? JSON.stringify(config.params) : "";
  const data = typeof config.data === "object" ? JSON.stringify(config.data) : "";
  return `${method}:${url}:${params}:${data}`;
};

/**
 * Clean up active controllers and locks
 * @param {import('axios').InternalAxiosRequestConfig} config 
 */
const cleanRequestState = (config) => {
  if (!config) return;
  const key = generateRequestKey(config);
  activeControllers.delete(key);

  const lockKey = `lock:${config.method}:${config.url}`;
  activeRequestLocks.delete(lockKey);
};

/**
 * Replays all queued requests in the offline queue
 */
const replayOfflineQueue = async () => {
  if (offlineQueue.length === 0) return;
  const queue = [...offlineQueue];
  offlineQueue.length = 0;
  await saveOfflineQueue([]);

  for (const item of queue) {
    try {
      Logger.info(`Replaying offline queued request: ${item.config.url}`);
      const res = await apiClient(item.config);
      item.resolve(res);
    } catch (err) {
      item.reject(err);
    }
  }
};

/**
 * Auto-refresh token if expiring in less than 2 minutes
 * Mitigates race condition by subscribing parallel requests to current refresh operation.
 */
const checkAndRefreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken, refreshErr) => {
        if (refreshErr) {
          reject(refreshErr);
        } else {
          resolve();
        }
      });
    });
  }

  try {
    const token = await getToken();
    if (!token) return;

    // Check if the token is a JWT (JWTs have exactly 3 dot-separated parts)
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Safe skip for non-JWT tokens (like Laravel Sanctum plain text tokens)
      return;
    }

    const decoded = jwtDecode(token);
    if (!decoded || !decoded.exp) return;

    const currentTime = Math.floor(Date.now() / 1000);
    // Refresh token if expiring within 120 seconds
    if (decoded.exp - currentTime < 120) {
      Logger.info("JWT expiring in < 2 minutes. Triggering proactive silent refresh...");
      await silentTokenRefresh();
    }
  } catch (e) {
    Logger.warn("Token decoding failed or token is not a valid JWT. Skipping proactive refresh.");
  }
};

/**
 * Proactive Silent Token Refresh
 */
const silentTokenRefresh = async () => {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token stored.");

    const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
      refresh_token: refreshToken,
    });

    const newToken = res.data?.token || res.data?.accessToken;
    const newRefreshToken = res.data?.refresh_token || res.data?.refreshToken;

    if (newToken) {
      await setToken(newToken);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      if (newRefreshToken) {
        await setRefreshToken(newRefreshToken);
      }
      onRefreshed(newToken);
      Logger.info("Proactive token refresh completed successfully.");
    } else {
      throw new Error("Proactive refresh response did not return a valid token.");
    }
  } catch (err) {
    const formattedErr = formatErrorResponse(err);
    onRefreshFailed(formattedErr);
    Logger.error("Proactive silent token refresh failed:", err);
  } finally {
    isRefreshing = false;
  }
};

/**
 * Subscribe callback for 401 token refresh queue
 */
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

/**
 * Handle success queue
 */
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token, null));
  refreshSubscribers = [];
};

/**
 * Handle failed queue
 */
const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((cb) => cb(null, error));
  refreshSubscribers = [];
};

/**
 * Check if the HTTP method is idempotent and safe to retry
 * @param {import('axios').InternalAxiosRequestConfig} config 
 * @returns {boolean}
 */
const isIdempotentMethod = (config) => {
  const method = config.method?.toLowerCase();
  return method === "get" || method === "head" || method === "options";
};

/**
 * Determines if request is retryable
 * @param {any} error 
 * @returns {boolean}
 */
const isRetryableError = (error) => {
  if (!error || axios.isCancel(error) || error.name === "CanceledError" || error.code === "ERR_CANCELED") {
    return false;
  }

  const config = error.config;
  if (!config || !isIdempotentMethod(config)) {
    return false; // POST, PUT, DELETE, PATCH shouldn't be retried automatically
  }

  // Network connection issue or DNS failure
  if (error.message === "Network Error" || !error.response) {
    return true;
  }

  // Request timeouts
  if (error.code === "ECONNABORTED" || error.message?.toLowerCase().includes("timeout")) {
    return true;
  }

  // Socket connection issues
  const socketErrors = ["ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "EADDRINUSE", "ECONNREFUSED"];
  if (socketErrors.includes(error.code)) {
    return true;
  }

  // Server down errors
  const status = error.response?.status;
  return status === 502 || status === 503 || status === 504;
};

/**
 * Converts any Axios or custom error into a unified response format.
 * @param {any} error 
 * @returns {NormalizedResponse}
 */
export const formatErrorResponse = (error) => {
  if (error && error.success === false && typeof error.status === "number") {
    return error;
  }

  let status = 500;
  let message = "An unknown error occurred";
  let errorCode = ErrorCodes.UNKNOWN_ERROR;
  let errorData = error;

  if (axios.isCancel(error)) {
    status = 499;
    message = "Request Cancelled";
    errorCode = ErrorCodes.TIMEOUT;
  } else if (error.response) {
    status = error.response.status;
    errorData = error.response.data;
    errorCode = ErrorCodes.SERVER_ERROR;

    if (status === 503) {
      message = "Server is under maintenance. Please try again later.";
      errorCode = ErrorCodes.MAINTENANCE;
    } else if (status === 502 || status === 504) {
      message = "Server took too long to respond.";
      errorCode = ErrorCodes.TIMEOUT;
    } else if (status === 500) {
      message = "Internal Server Error.";
    } else if (status === 401) {
      errorCode = ErrorCodes.TOKEN_EXPIRED;
    } else if (status === 422) {
      errorCode = ErrorCodes.VALIDATION_ERROR;
    }

    if (errorData) {
      if (typeof errorData === "string") {
        if (errorData.trim().startsWith("<!DOCTYPE")) {
          status = 401;
          message = "Session expired, please login again";
          errorCode = ErrorCodes.TOKEN_EXPIRED;
        } else {
          message = errorData;
        }
      } else {
        // Preserving server messages
        message = errorData.message || errorData.error || message;

        // Nested validation error lists (e.g. Laravel)
        if (errorData.errors) {
          const firstErrorKey = Object.keys(errorData.errors)[0];
          const errorsList = errorData.errors[firstErrorKey];
          if (Array.isArray(errorsList) && errorsList.length > 0) {
            message = errorsList[0];
          } else if (typeof errorsList === "string") {
            message = errorsList;
          }
        }
      }
    }
  } else if (error.request) {
    const errMsg = error.message || "";
    errorCode = ErrorCodes.NETWORK_ERROR;

    if (error.code === "ECONNABORTED" || errMsg.toLowerCase().includes("timeout")) {
      status = 408;
      message = "Server took too long to respond.";
      errorCode = ErrorCodes.TIMEOUT;
    } else if (status === 0 || errMsg.toLowerCase().includes("network error")) {
      status = 0;
      message = "Please check your internet connection.";
    } else if (errMsg.toLowerCase().includes("ssl") || errMsg.toLowerCase().includes("certificate")) {
      status = 495;
      message = "SSL handshake failed. Secure connection cannot be established.";
    } else if (error.code === "ECONNREFUSED") {
      status = 503;
      message = "Server connection refused. The server may be down.";
    } else {
      status = 0;
      message = "Please check your internet connection.";
    }
  } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
    status = 422;
    message = "Invalid JSON response format from server.";
    errorCode = ErrorCodes.VALIDATION_ERROR;
  } else if (error.message) {
    message = error.message;
  }

  return {
    success: false,
    status,
    message,
    errors: errorData?.errors || null,
    error: errorData,
    errorCode,
  };
};

/**
 * Normalizes successful Axios responses.
 * Retains original response fields to preserve compatibility while appending standardized keys.
 * @param {import('axios').AxiosResponse} response 
 * @returns {import('axios').AxiosResponse}
 */
const normalizeSuccessResponse = (response) => {
  const rawData = response.data;
  
  const normalized = {
    success: true,
    status: response.status,
    message: rawData?.message || "Success",
    errors: null,
    data: rawData?.data !== undefined ? rawData.data : rawData,
  };

  // Merge original payload keys into root of data wrapper for backward compatibility with slices
  if (rawData && typeof rawData === "object") {
    Object.assign(normalized, rawData);
  }

  response.data = normalized;
  return response;
};

// Create Axios Instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // 1. Internet Connection Check
    if (!isNetworkConnected) {
      const offlineError = {
        success: false,
        status: 0,
        message: "Please check your internet connection.",
        errorCode: ErrorCodes.NETWORK_ERROR,
        error: new Error("No Internet Connection"),
      };

      // Support offline queueing for safe requests
      if (config.queueOffline !== false && !isIdempotentMethod(config)) {
        if (offlineQueue.length >= MAX_QUEUE) {
          return Promise.reject({
            success: false,
            status: 429,
            message: "Request queue is full. Please try again later.",
            error: new Error("Offline request queue overflow"),
          });
        }
        Logger.warn(`Request to ${config.url} offline. Deferring to background sync...`);
        return new Promise(async (resolve, reject) => {
          offlineQueue.push({ config, resolve, reject });
          await saveOfflineQueue(offlineQueue);
        });
      }

      return Promise.reject(offlineError);
    }

    // 2. Request Locking Lockout (Double-Tap prevention)
    if (config.lockRequest) {
      const lockKey = `lock:${config.method}:${config.url}`;
      if (activeRequestLocks.has(lockKey)) {
        return Promise.reject({
          success: false,
          status: 429,
          message: "Request is already in progress.",
          error: new Error("Request locked due to duplicate submission"),
        });
      }
      activeRequestLocks.add(lockKey);
    }

    // 3. Cancel Duplicate Concurrent Request automatically using AbortController
    if (config.cancelDuplicate !== false) {
      const requestKey = generateRequestKey(config);
      if (activeControllers.has(requestKey)) {
        const controller = activeControllers.get(requestKey);
        try {
          controller.abort();
        } catch (e) {
          // Ignore abort errors
        }
        activeControllers.delete(requestKey);
        Logger.info(`Cancelled duplicate concurrent request: ${config.url}`);
      }

      const controller = new AbortController();
      config.signal = controller.signal;
      activeControllers.set(requestKey, controller);
    }

    // 4. GET Cache Check
    if (config.method?.toLowerCase() === "get" && config.cacheResponse) {
      const cacheKey = generateRequestKey(config);
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < (config.cacheTTL || 300000)) {
        Logger.info(`Returning cached data for: ${config.url}`);
        return Promise.resolve(cached.response);
      }
    }

    // 5. JWT Expiry Check (Proactive Refresh)
    if (!config.skipAuth) {
      await checkAndRefreshToken();
    }

    // 6. Attach Token
    if (!config.skipAuth) {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 7. Dynamic Request Timeouts
    let dynamicTimeout = config.timeout || 30000;
    if (config.url?.endsWith("/login") || config.url?.endsWith("/verify-otp")) {
      dynamicTimeout = 20000; // 20 seconds for Login/OTP
    } else if (config.headers?.["Content-Type"] === "multipart/form-data") {
      dynamicTimeout = 120000; // 120 seconds for Uploads
    }
    config.timeout = dynamicTimeout;

    // 8. Dynamic Language Header
    const lang = (await getStoredLanguage()) || "en";

    // 9. Secure Headers
    const requestId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const appVersion = Constants.expoConfig?.version || "1.0.0";
    const deviceName = Device.modelName || Device.deviceName || "Jobrito Mobile";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    config.headers["X-Request-ID"] = requestId;
    config.headers["X-Platform"] = Platform.OS;
    config.headers["X-App-Version"] = appVersion;
    config.headers["X-Device-Name"] = deviceName;
    config.headers["X-Timezone"] = timezone;
    config.headers["Accept-Language"] = lang;

    // Save Performance Start Time
    config.metadata = { startTime: Date.now() };

    console.log(`[API Request] Hitting: ${config.baseURL || ""}${config.url} [Method: ${config.method?.toUpperCase()}]`);
    if (config.data) {
      if (config.data instanceof FormData) {
        console.log("[API Request Payload] Type: FormData");
        if (config.data._parts) {
          config.data._parts.forEach(([key, val]) => {
            console.log(`  - ${key}:`, typeof val === "object" && val !== null ? JSON.stringify(val) : val);
          });
        }
      } else {
        console.log("[API Request Payload] Data:", typeof config.data === "object" ? JSON.stringify(config.data) : config.data);
      }
    }

    return config;
  },
  (error) => Promise.reject(formatErrorResponse(error))
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    cleanRequestState(response.config);

    // Performance Monitoring & Warning
    const startTime = response.config?.metadata?.startTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      if (duration > 3000) {
        Logger.warn(`Slow Response: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
      }
    }

    // GET Caching
    if (response.config?.method?.toLowerCase() === "get" && response.config?.cacheResponse) {
      const cacheKey = generateRequestKey(response.config);
      setCacheResponse(cacheKey, response);
    }

    // Detect manual logout completion to clear local state caches
    if (response.config.url?.endsWith("/logout")) {
      clearClientState();
    }

    // HTML session expire detection
    const contentType = response.headers?.["content-type"] || "";
    if (
      contentType.includes("text/html") ||
      (typeof response.data === "string" && response.data.trim().startsWith("<!DOCTYPE"))
    ) {
      return Promise.reject({
        success: false,
        status: 401,
        message: "Session expired, please login again",
        error: new Error("Session expired HTML response"),
      });
    }

    return normalizeSuccessResponse(response);
  },
  async (error) => {
    const originalRequest = error.config;
    cleanRequestState(originalRequest);

    if (originalRequest?.url?.endsWith("/logout")) {
      clearClientState();
    }

    // 1. Retry Logic with Exponential Backoff (Idempotent requests only)
    if (originalRequest && isRetryableError(error)) {
      originalRequest.retryCount = originalRequest.retryCount || 0;
      if (originalRequest.retryCount < 3) {
        originalRequest.retryCount += 1;
        const delay = Math.pow(2, originalRequest.retryCount - 1) * 1000;
        Logger.warn(`Retrying request ${originalRequest.url} (${originalRequest.retryCount}/3) after ${delay}ms...`);
        return new Promise((resolve) => setTimeout(resolve, delay)).then(() => apiClient(originalRequest));
      }
    }

    // 2. Token Refresh & Replay Queue
    const status = error.response?.status || error.status;
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (
        originalRequest.url?.includes(API_ENDPOINTS.REFRESH_TOKEN) ||
        originalRequest.url?.includes(API_ENDPOINTS.LOGIN) ||
        originalRequest.url?.includes(API_ENDPOINTS.VERIFY_OTP)
      ) {
        return Promise.reject(formatErrorResponse(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken, refreshErr) => {
            if (refreshErr) {
              reject(refreshErr);
            } else {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) throw new Error("No refresh token available");

          const refreshRes = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
            refresh_token: refreshToken,
          });

          const newToken = refreshRes.data?.token || refreshRes.data?.accessToken;
          const newRefreshToken = refreshRes.data?.refresh_token || refreshRes.data?.refreshToken;

          if (!newToken) throw new Error("Token refresh did not yield new token.");

          await setToken(newToken);
          if (newRefreshToken) {
            await setRefreshToken(newRefreshToken);
          }

          apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          onRefreshed(newToken);
          resolve(apiClient(originalRequest));
        } catch (refreshErr) {
          const formattedErr = formatErrorResponse(refreshErr);
          onRefreshFailed(formattedErr);

          const status = refreshErr.response?.status || refreshErr.status;
          const isNoRefreshToken = refreshErr.message === "No refresh token available";
          const isNetworkOrServerError = !isNoRefreshToken && (!refreshErr.response || status >= 500 || status === 408 || refreshErr.code === "ECONNABORTED");

          if (isNetworkOrServerError) {
            Logger.warn("Token refresh failed due to network or server error. Skipping auto-logout.", refreshErr);
          } else {
            Logger.error("Refresh token expired or invalid. Performing auto-logout.");

            // Telemetry
            try {
              if (typeof analytics !== "undefined" && typeof analytics === "function") {
                analytics().logEvent("token_refresh_failed", {
                  message: formattedErr.message.substring(0, 100),
                }).catch(() => {});
              }
            } catch (telemetryErr) {
              // Ignore telemetry error
            }

            await clearAuthStorage();
            clearClientState();

            try {
              const storeModule = require("../redux/store");
              const store = storeModule.default || storeModule;
              if (store) {
                const { logout } = require("../redux/slices/authSlice");
                store.dispatch(logout());
              }
            } catch (storeError) {
              Logger.warn("Could not dispatch logout:", storeError);
            }

            // Silent transition (no user alert modal)
          }

          reject(formattedErr);
        } finally {
          isRefreshing = false;
        }
      });
    }

    return Promise.reject(formatErrorResponse(error));
  }
);

export const normalizeApiError = (error) => ({
  message: error?.message || "Something went wrong",
  status: error?.status || 0,
});

export default apiClient;
