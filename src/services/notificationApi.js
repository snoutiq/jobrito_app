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
