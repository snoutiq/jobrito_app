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
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
        response,
      };
      return Promise.reject(unauthorizedError);
    }
    return response;
  },
  async (error) => {
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
    const normalizedError = {
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong",
      status: error?.status || error?.response?.status || 0,
      raw: error,
    };
    return Promise.reject(normalizedError);
  }
);

export const normalizeApiError = (error) => ({
  message: error?.message || "Something went wrong",
  status: error?.status || 0,
});

export default apiClient;
