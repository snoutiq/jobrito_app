import { Platform } from "react-native";
import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";

export const updateLanguagePreference = async (language) => {
  const response = await apiClient.post(API_ENDPOINTS.PROFILE_LANGUAGE, {
    selected_language: language,
  });
  return response.data;
};

const mapExperienceYears = (years) => {
  if (years === null || years === undefined) return "";
  const y = parseInt(years, 10);
  if (y <= 2) return "0-2 Years";
  if (y <= 5) return "3-5 Years";
  return "5+ Years";
};

const pickValue = (data, keys) => {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "";
};

const normalizeProfile = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    name: u.full_name || u.name || "",
    full_name: u.full_name || u.name,
    email: u.email,
    phone: u.mobile_number || u.phone,
    profile_photo_path: u.profile_photo_path,
    city: u.city,
    experience_range: u.experience_range || mapExperienceYears(u.experience_years) || "",
    experience_years: u.experience_years,
    preferred_role: u.preferred_role,
    current_employer: u.current_employer,
    skills: Array.isArray(u.skills) ? u.skills.join(", ") : u.skills || "",
    completionPercentage: u.completeness || u.completionPercentage || 0,
    selected_language: u.selected_language,
    gender: u.gender,
    job_type: u.job_type,
    location_preference: u.location_preference,
    employerOnboardingCompleted: !!(u.employerOnboardingCompleted || u.has_completed_onboarding),
    chefOnboardingCompleted: !!(u.chefOnboardingCompleted || u.has_completed_onboarding),
  };
};

export const getProfile = async () => {
  const response = await apiClient.get(API_ENDPOINTS.PROFILE);
  const u = response.data?.user || response.data?.profile;
  if (u) {
    const profile = normalizeProfile(u);
    return { success: true, profile };
  }
  return response.data;
};

export const updateProfile = async (data) => {
  const profilePhotoPath = pickValue(data, ["profile_photo_path", "profilePhotoPath"]);
  const isValidRemotePhoto =
    typeof profilePhotoPath === "string" &&
    (profilePhotoPath.startsWith("http://") || profilePhotoPath.startsWith("https://"));

  const formData = new FormData();
  formData.append("full_name", pickValue(data, ["full_name", "fullName", "name"]));
  formData.append("email", pickValue(data, ["email"]));
  formData.append("city", pickValue(data, ["city"]));
  formData.append("experience_range", pickValue(data, ["experience_range", "experienceRange"]));
  formData.append("preferred_role", pickValue(data, ["preferred_role", "preferredRole"]));
  formData.append("current_employer", pickValue(data, ["current_employer", "currentEmployer"]));
  formData.append("skills", pickValue(data, ["skills"]));
  formData.append("gender", pickValue(data, ["gender"]));
  formData.append("job_type", pickValue(data, ["job_type", "jobType"]));
  formData.append("location_preference", pickValue(data, ["location_preference", "locationPreference"]));

  if (profilePhotoPath) {
    if (isValidRemotePhoto) {
      formData.append("profile_photo_path", profilePhotoPath);
    } else {
      const uriParts = profilePhotoPath.split("/");
      const fileName = uriParts[uriParts.length - 1];
      const fileType = fileName.split(".").pop();
      formData.append("profile_photo_path", {
        uri: Platform.OS === "android" ? profilePhotoPath : profilePhotoPath.replace("file://", ""),
        name: fileName,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType || "png"}`,
      });
    }
  }

  const response = await apiClient.post(API_ENDPOINTS.PROFILE_PERSONAL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  const u = response.data?.user || response.data?.profile;
  if (u) {
    const profile = normalizeProfile(u);
    return { success: true, profile };
  }
  return response.data;
};

export const switchRole = async (role) => {
  const response = await apiClient.post(API_ENDPOINTS.PROFILE_ROLE, { role });
  return response.data;
};

export const deleteAccountApi = async () => {
  const response = await apiClient.delete(API_ENDPOINTS.PROFILE_DELETE);
  return response.data;
};
