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

export const normalizeProfile = (u) => {
  if (!u) return null;

  const root = u.user || u.profile ? u : {};
  const userObj = u.user || u.profile || u;

  const emp = userObj.employer_profile || root.employer_profile || {};
  const chef = userObj.chef_profile || userObj.chef_profile_details || root.chef_profile || root.chef_profile_details || {};

  let availability = chef.availability_info || {};
  if (typeof availability === "string") {
    try {
      availability = JSON.parse(availability);
    } catch (e) {
      availability = {};
    }
  }
  const rootAvailabilityStatus = userObj.availability_status || userObj.availability;
  if (rootAvailabilityStatus) {
    availability = {
      ...availability,
      availability_status: rootAvailabilityStatus,
    };
  }

  return {
    id: userObj.id,
    name: userObj.full_name || userObj.name || "",
    full_name: userObj.full_name || userObj.name,
    email: userObj.email,
    phone: userObj.mobile_number || userObj.phone,
    profile_photo_path: userObj.profile_photo_path,
    city: userObj.city || "",
    country: userObj.country || "",
    experience_range: userObj.experience_range || mapExperienceYears(userObj.experience_years) || "",
    experience_years: userObj.experience_years,
    preferred_role: userObj.preferred_role || "",
    professionalTitle: userObj.preferred_role || "",
    current_employer: userObj.current_employer,
    skills: Array.isArray(userObj.skills) ? userObj.skills.join(", ") : userObj.skills || "",
    completionPercentage: userObj.completeness || userObj.profile_completeness || userObj.completionPercentage || 0,
    completeness: userObj.completeness || userObj.profile_completeness || 0,
    profile_completeness: userObj.profile_completeness || userObj.completeness || 0,
    selected_language: userObj.selected_language,
    gender: userObj.gender,
    job_type: userObj.job_type || userObj.preference || "",
    location_preference: userObj.location_preference || availability.location_preference || userObj.job_location || "",
    locationPreference: userObj.location_preference || availability.location_preference || userObj.job_location || "",
    employerOnboardingCompleted: !!(userObj.employerOnboardingCompleted || userObj.has_completed_onboarding || emp.is_completed),
    chefOnboardingCompleted: !!(userObj.chefOnboardingCompleted || userObj.has_completed_onboarding || chef.approval_status),
    role: userObj.role || userObj.active_role || userObj.user_role || "",
    active_role: userObj.active_role || userObj.role || userObj.user_role || "",
    user_role: userObj.user_role || userObj.active_role || userObj.role || "",
    
    // Employer-specific profile details autofill
    business_name: emp.business_name || emp.company_name || "",
    businessName: emp.business_name || emp.company_name || "",
    company: emp.company_name || emp.business_name || "",
    industry_segment: emp.industry_segment || "",
    segment: emp.industry_segment || "",
    business_location: emp.business_location || emp.city || "",
    location: emp.business_location || emp.city || "",
    contact_person_name: emp.contact_person_name || userObj.full_name || userObj.name || "",
    contactName: emp.contact_person_name || userObj.full_name || userObj.name || "",
    business_mobile: emp.business_mobile || userObj.mobile_number || "",
    contactPhone: emp.business_mobile || userObj.mobile_number || "",
    business_email: emp.business_email || userObj.email || "",
    contactEmail: emp.business_email || userObj.email || "",
    preferred_language: emp.preferred_language || "",
    company_logo: emp.company_logo_path || emp.company_logo_url || "",
    company_logo_url: emp.company_logo_url || emp.company_logo_path || "",
    operational_locations: emp.operational_locations || [],
    locations: emp.operational_locations || [],
    nominee_name: emp.nominee_name || "",
    nominee_relationship: emp.nominee_relationship || "",
    nominee_mobile: emp.nominee_mobile || "",
    managerName: emp.nominee_name || "",
    managerRelationship: emp.nominee_relationship || "",
    managerPhone: emp.nominee_mobile || "",

    // Chef-specific profile details autofill
    cuisine_specialty: chef.cuisine_specialty || chef.specialties || "",
    specialties: chef.specialties || chef.cuisine_specialty || "",
    cuisines: chef.cuisine_specialty || chef.specialties || "",
    bio: chef.bio || "",
    calendly_link: chef.calendly_link || "",
    availability_info: availability,
    availability: userObj.availability_status || userObj.availability || "",
    availability_status: userObj.availability_status || userObj.availability || "",
    languages: availability.languages || [],
    operations: chef.operational_experties || chef.operational_expertise || userObj.skills || [],
    linkedin: (userObj.socials || root.socials || {}).linkedin || chef.linkedin_link || chef.linkedin || "",
    instagram: (userObj.socials || root.socials || {}).instagram || chef.instagram_link || chef.instagram || "",
    facebook: (userObj.socials || root.socials || {}).facebook || chef.facebook_link || chef.facebook || "",
    twitter: (userObj.socials || root.socials || {}).twitter || chef.twitter_link || chef.twitter || "",
    youtube: (userObj.socials || root.socials || {}).youtube || "",
    website: (userObj.socials || root.socials || {}).website || "",
    chef_profile: chef,
  };
};

export const getProfile = async () => {
  const response = await apiClient.get(API_ENDPOINTS.PROFILE, { cancelDuplicate: false });
  if (response.data) {
    const profile = normalizeProfile(response.data);
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
