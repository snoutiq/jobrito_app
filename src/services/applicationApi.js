import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";
import { getStoredProfile } from "./storage";

export const applyJob = async (jobId, payload) => {
  // The API expects snake_case keys. The component sends camelCase.
  // We'll normalize the payload here to keep the API layer consistent.
  const apiPayload = {
    preferred_call_time: payload.preferredCallTime,
    ...(payload.is_training && { is_training: payload.is_training }),
  };
  const response = await apiClient.post(`${API_ENDPOINTS.JOBS}/${jobId}/apply`, apiPayload);
  return response.data;
};

export const getApplicationHistory = async (userArg) => {
  let params = {};
  if (typeof userArg === "object" && userArg !== null) {
    if (userArg.user_id || userArg.id) params.user_id = userArg.user_id || userArg.id;
    if (userArg.email) params.email = userArg.email;
  } else if (typeof userArg === "number" || (typeof userArg === "string" && /^\d+$/.test(userArg))) {
    params.user_id = userArg;
  } else if (typeof userArg === "string" && userArg.includes("@")) {
    params.email = userArg;
  } else {
    try {
      const profile = await getStoredProfile();
      if (profile?.id || profile?.user_id) params.user_id = profile?.id || profile?.user_id;
      if (profile?.email) params.email = profile?.email;
    } catch (e) {}
  }

  const response = await apiClient.get(API_ENDPOINTS.PROFILE_APPLICATIONS, { params });
  const rawApps = response.data?.applications || [];

  const normalized = rawApps.map((item) => {
    const isTraining = !!item.is_training;
    const jobIdVal = item.job_post_id ?? item.job_id ?? item.id;
    const appId = item.application_id ?? item.id ?? jobIdVal;

    return {
      ...item,
      id: String(appId),
      jobId: String(jobIdVal),
      title: item.title || "Job Opportunity",
      employer: item.company || "Company Name",
      avatar: item.company_logo_url || item.logo || item.avatar || null,
      status: String(item.status || item.application_status || "APPLIED").toUpperCase(),
      appliedOn: item.applied_at || item.created_at || new Date().toISOString(),
      created_at: item.created_at || item.applied_at,
      applied_at: item.applied_at || item.created_at,
      applied_at_formatted: item.applied_at_formatted,
      job: {
        ...item,
        id: String(jobIdVal),
        job_post_id: item.job_post_id,
        training_id: item.training_id ?? null,
        is_training: isTraining,
        title: item.title || "Job Opportunity",
        company: item.company || "Company Name",
        location: item.location || "Flexible",
        salary: item.salary || null,
        job_type: item.job_type || (isTraining ? "Training / Program" : "Full-time"),
        experience_range: item.experience_range || null,
        description: item.description || "",
        created_at: item.created_at || item.applied_at,
        created_by: item.created_by || item.creator || item.company,
      },
    };
  });
  return { success: true, applications: normalized };
};