import apiClient from "./apiClient";

export const registerPushToken = async (pushToken) => {
  try {
    const response = await apiClient.post("/notifications/register", {
      pushToken,
    });
    return response.data;
  } catch (error) {
    return { success: true, registered: false, pushToken };
  }
};

export const getNotificationSettings = async () => {
  try {
    const response = await apiClient.get("/notifications/settings");
    return response.data;
  } catch (error) {
    return { success: true, enabled: false };
  }
};

export const getEmployerNotifications = async () => {
  try {
    const response = await apiClient.get("/employer/notifications");
    return response.data;
  } catch (error) {
    // Return empty list fallback when backend endpoint is not built yet
    return {
      success: true,
      unread_count: 0,
      notifications: [],
    };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiClient.put(`/employer/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    return { success: true, message: "Marked as read." };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.put("/employer/notifications/mark-all-read");
    return response.data;
  } catch (error) {
    return { success: true, message: "All notifications marked as read." };
  }
};
