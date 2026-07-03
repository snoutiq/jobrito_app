import apiClient from "./apiClient";

export const updateLanguagePreference = async (language) => {
  try {
    const response = await apiClient.post("/profile/language", {
      selected_language: language,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update language preference:", error.response?.data || error.message);
    return { success: false, error: "Failed to sync language with server." };
  }
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
  try {
    const response = await apiClient.get("/profile");
    // Support either response.data.user (backend live) or response.data.profile (legacy/fallback)
    const u = response.data?.user || response.data?.profile;
    if (u) {
      const profile = normalizeProfile(u);
      return { success: true, profile };
    }
    return response.data;
  } catch (error) {
    console.warn("Failed to fetch profile from server, using fallback:", error.message);
    // Return fallback profile data when API fails or is not available
    return {
      success: true,
      profile: {
        id: "user-1",
        full_name: "Alex Thompson",
        name: "Alex Thompson",
        email: "alex@hospitality.com",
        phone: "+91 98765 43210",
        profile_photo_path: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop",
        city: "London, UK",
        experience_range: "0-2 Years",
        preferred_role: "Chef",
        current_employer: "Royal Oak Cafe",
        skills: "Fine Dining, Chocolate tempering",
        completionPercentage: 85,
        role: "Chef",
        chefOnboardingCompleted: true,
      },
    };
  }
};

export const updateProfile = async (data) => {
  try {
    const profilePhotoPath = pickValue(data, ["profile_photo_path", "profilePhotoPath"]);
    const isValidRemotePhoto =
      typeof profilePhotoPath === "string" &&
      (profilePhotoPath.startsWith("http://") || profilePhotoPath.startsWith("https://"));

    const payload = {
      full_name: pickValue(data, ["full_name", "fullName", "name"]),
      email: pickValue(data, ["email"]),
      city: pickValue(data, ["city"]),
      experience_range: pickValue(data, ["experience_range", "experienceRange"]),
      preferred_role: pickValue(data, ["preferred_role", "preferredRole"]),
      current_employer: pickValue(data, ["current_employer", "currentEmployer"]),
      skills: pickValue(data, ["skills"]),
      gender: pickValue(data, ["gender"]),
      job_type: pickValue(data, ["job_type", "jobType"]),
      location_preference: pickValue(data, ["location_preference", "locationPreference"]),
    };

    if (isValidRemotePhoto) {
      payload.profile_photo_path = profilePhotoPath;
    }

    const response = await apiClient.post("/profile/personal", payload);
    const u = response.data?.user || response.data?.profile;
    if (u) {
      const profile = normalizeProfile(u);
      return { success: true, profile };
    }
    return response.data;
  } catch (error) {
    console.error("Failed to save profile to server:", error.message || error);
    throw error;
  }
};

export const switchRole = async (role) => {
  try {
    const response = await apiClient.post("/profile/role", { role });
    return response.data;
  } catch (error) {
    return {
      success: true,
      role,
    };
  }
};
