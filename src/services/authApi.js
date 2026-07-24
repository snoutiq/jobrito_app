import { Platform } from "react-native";
import * as Device from "expo-device";
import apiClient from "./apiClient";
import { setStoredProfile, setStoredRole, setToken } from "./storage";
import { ROLES, ROLE_API_MAP } from "../constants/roles";

const toFormUrlEncoded = (data) => {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
};

export const requestOtp = async (phone, role) => {
  try {
    const response = await apiClient.post(
      "/login",
      {
        mobile_number: phone,
        login_role: ROLE_API_MAP[role],
      },
      {
        skipAuth: true,
      },
    );

    return {
      success: true,
      data: response.data,
      message: "OTP sent successfully",
    };
  } catch (error) {
    console.error("requestOtp error details:", error);
    let errorMessage =
      error?.message || "Failed to send OTP. Please try again.";

    if (error?.status === 429) {
      errorMessage = "Too many attempts. Please try after some time.";
    } else if (error?.status === 400) {
      errorMessage = error?.message || "Invalid phone number";
    }

    return {
      success: false,
      message: errorMessage,
      phone: phone,
      error: error?.data || error,
    };
  }
};

export const verifyOtp = async (phone, otp, role, language, fcmToken) => {
  try {
    const response = await apiClient.post(
      "/verify-otp",
      {
        mobile_number: phone,
        login_role: ROLE_API_MAP[role],
        otp,
        selected_language: language,
        fcm_token: fcmToken || "",
        device_type: Platform.OS || "mobile",
        device_name: Device.modelName || Device.deviceName || "JobConnect Mobile",
      },
      {
        skipAuth: true,
      },
    );

    return {
      success: true,
      data: response.data,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("OTP verification failed error details:", error);
    let errorMessage = error?.message || "Invalid OTP. Please try again.";

    if (error?.status === 404) {
      errorMessage = "User not found. Please check your phone number.";
    } else if (error?.status === 429) {
      errorMessage = "Too many attempts. Please try after some time.";
    }

    return {
      success: false,
      message: errorMessage,
      phone: phone,
    };
  }
};

export const updateBasicProfile = async (data) => {
  try {
    const response = await apiClient.post("/auth/basic-profile", data);
    return response.data;
  } catch (error) {
    const profile = {
      id: "user-1",
      name: data.name,
      email: data.email || "",
      city: data.city || "Mumbai",
      phone: data.phone,
      role: data.role || ROLES.JOB_SEEKER,
      completionPercentage: 40,
    };
    await setToken("mock-jobconnect-token");
    await setStoredRole(profile.role);
    await setStoredProfile(profile);
    return {
      success: true,
      token: "mock-jobconnect-token",
      profile,
    };
  }
};

export const logout = async () => {
  try {
    const response = await apiClient.post("/logout");
    return response.data;
  } catch (error) {
    return { success: true, message: "Logged out (offline)" };
  }
};
