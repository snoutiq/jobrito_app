import axios from "axios";
import { API_BASE_URL } from "../constants/endpoints";
import { getToken, removeToken } from "./storage";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    config.withCredentials = false;

    if (!config.skipAuth) {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    const fullUrl = `${config.baseURL || apiClient.defaults.baseURL || ""}${config.url}`;
    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${fullUrl}`,
      config.data ? `\nPayload: ${JSON.stringify(config.data)}` : ""
    );
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const contentType = response.headers?.["content-type"] || "";
    if (
      contentType.includes("text/html") ||
      (typeof response.data === "string" && response.data.trim().startsWith("<!DOCTYPE"))
    ) {
      const unauthorizedError = {
        message: "Session expired, please login again",
        status: 401,
      };
      return Promise.reject(unauthorizedError);
    }
    return response;
  },
  async (error) => {
    if (error?.config?.skipAuth) {
      const normalizedError = {
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
        status: error?.status || error?.response?.status || 0,
        errors: error?.response?.data?.errors || null,
        data: error?.response?.data || null,
      };
      return Promise.reject(normalizedError);
    }

    if (!error?.config?.url?.endsWith("/logout")) {
      console.error("[API Error Response]", {
        url: error?.config?.url,
        status: error?.response?.status || error?.status,
        data: error?.response?.data,
        message: error?.message,
      });
    }

    if (error?.status === 401 || error?.response?.status === 401) {
      try {
        await removeToken();
        const storeModule = require("../redux/store");
        const store = storeModule.default || storeModule;
        if (store) {
          const { logout } = require("../redux/slices/authSlice");
          store.dispatch(logout());
        }
      } catch (e) {
        console.error("Failed to handle 401 Unauthorized logout:", e);
      }
    }

    let serverMessage = error?.response?.data?.message;
    if (!serverMessage && error?.response?.data?.errors) {
      const firstErrorKey = Object.keys(error.response.data.errors)[0];
      const errorsList = error.response.data.errors[firstErrorKey];
      if (Array.isArray(errorsList) && errorsList.length > 0) {
        serverMessage = errorsList[0];
      } else if (typeof errorsList === "string") {
        serverMessage = errorsList;
      }
    }

    const normalizedError = {
      message:
        serverMessage ||
        error?.message ||
        "Something went wrong",
      status: error?.status || error?.response?.status || 0,
      errors: error?.response?.data?.errors || null,
      data: error?.response?.data || null,
    };
    return Promise.reject(normalizedError);
  }
);

export const normalizeApiError = (error) => ({
  message: error?.message || "Something went wrong",
  status: error?.status || 0,
});

export default apiClient;
