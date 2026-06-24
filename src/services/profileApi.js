import apiClient from "./apiClient";
import { getStoredProfile, setStoredProfile, setStoredRole } from "./storage";

export const getProfile = async () => {
  try {
    const response = await apiClient.get("/profile");
    return response.data;
  } catch (error) {
    const profile = (await getStoredProfile()) || {
      id: "user-1",
      name: "Guest User",
      email: "guest@example.com",
      city: "Mumbai",
      role: "Job Seeker",
      completionPercentage: 60,
    };
    return { success: true, profile };
  }
};

export const updateProfile = async (data) => {
  try {
    const response = await apiClient.put("/profile", data);
    return response.data;
  } catch (error) {
    const currentProfile = (await getStoredProfile()) || {};
    const profile = {
      ...currentProfile,
      ...data,
      completionPercentage: Math.min(
        100,
        (currentProfile.completionPercentage || 40) + 10
      ),
    };
    await setStoredProfile(profile);
    if (data.role) {
      await setStoredRole(data.role);
    }
    return { success: true, profile };
  }
};

export const switchRole = async (role) => {
  try {
    const response = await apiClient.post("/profile/switch-role", { role });
    return response.data;
  } catch (error) {
    await setStoredRole(role);
    const profile = (await getStoredProfile()) || {};
    const updatedProfile = {
      ...profile,
      role,
    };
    await setStoredProfile(updatedProfile);
    return {
      success: true,
      role,
      profile: updatedProfile,
    };
  }
};
