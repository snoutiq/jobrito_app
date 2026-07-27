import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";

export const registerPushToken = async (pushToken) => {
  const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_REGISTER, {
    pushToken,
  });
  return response.data;
};

export const getNotificationSettings = async () => {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS_SETTINGS);
  return response.data;
};

export const getEmployerNotifications = async () => {
  const response = await apiClient.get(API_ENDPOINTS.EMPLOYER_NOTIFICATIONS);
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await apiClient.put(`${API_ENDPOINTS.EMPLOYER_NOTIFICATIONS}/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.put(`${API_ENDPOINTS.EMPLOYER_NOTIFICATIONS}/mark-all-read`);
  return response.data;
};
