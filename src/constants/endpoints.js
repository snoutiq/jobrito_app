import Constants from "expo-constants";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest2?.extra?.apiBaseUrl ||
  "http://178.16.138.159/backend/api";

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

/**
 * Centralized API Endpoints Configuration
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/login",
  VERIFY_OTP: "/verify-otp",
  REFRESH_TOKEN: "/auth/refresh",
  LOGOUT: "/logout",
  AUTH_BASIC_PROFILE: "/auth/basic-profile",

  // Profile
  PROFILE: "/profile",
  PROFILE_PERSONAL: "/profile/personal",
  PROFILE_ROLE: "/profile/role",
  PROFILE_LANGUAGE: "/profile/language",
  PROFILE_DELETE: "/profile/delete",
 
  // Feed & Jobs
  FEED: "/feed",
  JOBS: "/admin/jobs/save",
  MY_JOBS: "/my-jobs",
  JOBS_STORE: "admin/jobs/save",
  JOBS_COMMUNITY: "/jobs/community",
  PROFILE_SAVED: "/jobs/saved",
  PROFILE_APPLICATIONS: "/applications/history",

  // Chef
  CHEF_PROFILES: "/chef/profiles",
  CHEF_ONBOARDING_SAVE: "/chef/onboarding/save",
  CHEF_ONBOARDING: "/chef/onboarding",
  CHEF_APPOINTMENTS: "/chef/appointments",
  CHEF_DASHBOARD: "/chef/dashboard",
  CHEF_CONSULTATIONS_UPCOMING: "/chef/consultations/upcoming",
  CHEF_PROFILE_VIEWS: "/chef/profile-views",
  CHEF_VIEW_PROFILE: "/chef/view-profile",
  CHEF_PROJECT_REQUESTS: "/chef/project-requests",
  CHEF_AVAILABILITY_TOGGLE: "/chef/availability/toggle",

  // Employer
  EMPLOYER_DASHBOARD: "/employer_dashboard",
  EMPLOYER_JOBS: "/employer/jobs",
  EMPLOYER_CHEFS: "/employer/chefs",
  EMPLOYER_ONBOARDING_DETAIL: "/employer/onboarding/detail",
  EMPLOYER_ONBOARDING_SAVE: "/employer/onboarding/save",
  EMPLOYER_NOTIFICATIONS: "/employer/notifications",

  // Appointments
  APPOINTMENTS_BOOK: "/appointments/book",

  // Notifications
  NOTIFICATIONS_REGISTER: "/notifications/register",
  NOTIFICATIONS_SETTINGS: "/notifications/settings",
};

export default {
  API_BASE_URL,
  ...API_ENDPOINTS,
};
