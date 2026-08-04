import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";

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

export const getApplicationHistory = async (email) => {
  const response = await apiClient.get(API_ENDPOINTS.PROFILE_APPLICATIONS, {
    params: { email },
  });
  const rawApps =
    response.data?.applications ||
    response.data?.data ||
    (Array.isArray(response.data) ? response.data : []);

  const normalized = rawApps.map((item) => {
    const isTraining = !!item.is_training;
    const jobIdVal = item.job_post_id ?? item.job_id ?? item.id;
    const appId = item.application_id ?? item.id ?? jobIdVal;

    return {
      id: String(appId),
      jobId: String(jobIdVal),
      title: item.title || "Job Opportunity",
      employer: item.company || "Company Name",
      avatar: item.company_logo_url || item.logo || item.avatar || null,
      status: String(item.status || item.application_status || "APPLIED").toUpperCase(),
      appliedOn: item.applied_at || item.created_at || new Date().toISOString(),
      job: {
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
      },
    };
  });
  return { success: true, applications: normalized };
};