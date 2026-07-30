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

export const getEmployerNotifications = async (role) => {
  let apiRole = "talent";
  if (role) {
    const r = role.toLowerCase().replace(/[\s_-]/g, "");
    if (r === "chef") {
      apiRole = "chef";
    } else if (r === "employer") {
      apiRole = "employer";
    }
  }
  const response = await apiClient.get(`/fcm/notifications?role=${apiRole}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await apiClient.put(`/fcm/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (role) => {
  let apiRole = "talent";
  if (role) {
    const r = role.toLowerCase().replace(/[\s_-]/g, "");
    if (r === "chef") {
      apiRole = "chef";
    } else if (r === "employer") {
      apiRole = "employer";
    }
  }
  const response = await apiClient.put(`/fcm/notifications/mark-all-read?role=${apiRole}`);
  return response.data;
};
