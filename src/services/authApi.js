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
