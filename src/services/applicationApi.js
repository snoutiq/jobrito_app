import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";

export const applyJob = async (jobId, preferredCallTime) => {
  const response = await apiClient.post(`${API_ENDPOINTS.JOBS}/${jobId}/apply`, {
    preferred_call_time: preferredCallTime,
  });
  return response.data;
};

export const getApplicationHistory = async (email) => {
  const response = await apiClient.get(API_ENDPOINTS.PROFILE_APPLICATIONS, {
    params: { email },
  });
  const rawApps = response.data?.applications || response.data || [];
  const normalized = rawApps.map((item) => {
    const jobSource = item.job_post || item.job || item;
    return {
      id: String(item.id),
      jobId: String(jobSource.id || item.job_post_id || item.job_id || item.jobId),
      title: jobSource.title || "Job Opportunity",
      employer: jobSource.company || jobSource.employer || "Company Name",
      avatar: jobSource.company_logo_url || jobSource.logo || jobSource.avatar || null,
      status: String(item.status || "UNDER REVIEW").toUpperCase(),
      appliedOn: item.created_at || item.applied_at || item.appliedOn || new Date().toISOString(),
      job: jobSource,
    };
  });
  return { success: true, applications: normalized };
};
