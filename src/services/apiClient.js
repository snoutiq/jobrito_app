import axios from "axios";
import { API_BASE_URL } from "../constants/endpoints";
import { getToken } from "./storage";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
  (response) => response,
  (error) => {
    const normalizedError = {
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong",
      status: error?.response?.status || 0,
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
