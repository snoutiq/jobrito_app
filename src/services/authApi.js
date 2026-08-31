import { Platform } from "react-native";
import * as Device from "expo-device";
import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";
import { setStoredProfile, setStoredRole, setToken } from "./storage";
import { ROLES, ROLE_API_MAP } from "../constants/roles";

export const requestOtp = async (phone, role) => {
  const response = await apiClient.post(
    API_ENDPOINTS.LOGIN,
    {
      mobile_number: phone,
      login_role: ROLE_API_MAP[role],
    },
    {
      skipAuth: true,
      lockRequest: true,
      cancelDuplicate: true,
    },
  );

  console.log("=================== LOGIN / REQUEST OTP FULL RESPONSE ===================");
  console.log(JSON.stringify(response.data, null, 2));
  console.log("========================================================================");

  return {
    success: true,
    data: response.data,
    message: "OTP sent successfully",
  };
};

export const verifyOtp = async (phone, otp, role, language, fcmToken) => {
  const response = await apiClient.post(
    API_ENDPOINTS.VERIFY_OTP,
    {
      mobile_number: phone,
      login_role: ROLE_API_MAP[role],
      otp,
      selected_language: language,
      fcm_token: fcmToken || "",
      device_type: Platform.OS || "mobile",
      device_name: Device.modelName || Device.deviceName || "Jobrito Mobile",
    },
    {
      skipAuth: true,
      lockRequest: true,
      cancelDuplicate: true,
    },
  );

  console.log("=================== VERIFY OTP / LOGIN FULL RESPONSE ===================");
  console.log(JSON.stringify(response.data, null, 2));
  console.log("========================================================================");

  return {
    success: true,
    data: response.data,
    message: "OTP verified successfully",
  };
};

export const updateBasicProfile = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH_BASIC_PROFILE, data);
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
  return response.data;
};

export const checkUserExists = async (userId) => {
  if (!userId) return { success: false, exists: true };
  try {
    const { clearClientState } = require("./apiClient");
    const { clearAuthStorage } = require("./storage");
    console.log(`[USER_EXISTS] Checking existence for user_id=${userId}...`);
    const response = await apiClient.get(`${API_ENDPOINTS.USER_EXISTS}?user_id=${userId}`, {
      cancelDuplicate: false,
    });
    const rawData = response?.data || response;
    console.log("=================== USER EXISTS API RESPONSE ===================");
    console.log(JSON.stringify(rawData, null, 2));
    console.log("===============================================================");

    const existsVal = rawData?.exists !== undefined ? rawData.exists : rawData?.data?.exists;

    if (existsVal === false) {
      console.log(`[USER_EXISTS] user_id=${userId} exists is FALSE! Triggering auto-logout...`);
      await clearAuthStorage().catch(() => {});
      clearClientState(true);
      return { success: true, exists: false, user_id: userId };
    }
    return rawData;
  } catch (error) {
    console.warn("[USER_EXISTS] Failed to check user exists:", error);
    return { success: false, error };
  }
};
