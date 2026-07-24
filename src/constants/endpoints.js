import Constants from "expo-constants";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest2?.extra?.apiBaseUrl ||
  "http://178.16.138.159/backend/api";

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export default {
  API_BASE_URL,
  AUTH: "/auth",
  JOBS: "/jobs",
  APPLICATIONS: "/applications",
  EMPLOYER: "/employer",
  CHEF: "/chef",
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
};
