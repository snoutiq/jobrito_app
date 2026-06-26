import apiClient from "./apiClient";

export const updateLanguagePreference = async (language) => {
  try {
    const response = await apiClient.post("/profile/language", {
      selected_language: language,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update language preference:", error.response?.data || error.message);
    // We don't want to block the user if this fails, so we can fail silently
    // or return a specific error object.
    return { success: false, error: "Failed to sync language with server." };
  }
};