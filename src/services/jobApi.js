import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";

export const getFeedJobs = async (filter) => {
  const response = await apiClient.get(API_ENDPOINTS.FEED, { params: { filter } });
  const jobs = response?.data?.feed?.data || [];
  return { success: true, jobs };
};

export const applyToJob = async (jobId, preferredCallTime) => {
  const response = await apiClient.post(`${API_ENDPOINTS.JOBS}/${jobId}/apply`, {
    preferred_call_time: preferredCallTime,
  });
  return response.data;
};

export const getJobDetails = async (jobId) => {
  const response = await apiClient.get(`${API_ENDPOINTS.JOBS}/${jobId}`);
  return response.data;
};

export const submitCommunityJob = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.JOBS_COMMUNITY, data);
  return response.data;
};

export const shareJob = async (jobId) => {
  const response = await apiClient.post(`${API_ENDPOINTS.JOBS}/${jobId}/share`);
  return response.data;
};

export const toggleSaveJob = async (jobId) => {
  const response = await apiClient.post(`${API_ENDPOINTS.JOBS}/${jobId}/save`);
  return response.data;
};

export const getSavedJobs = async () => {
  const response = await apiClient.get(API_ENDPOINTS.PROFILE_SAVED);
  const rawJobs = response.data?.saved_jobs || response.data?.jobs || (Array.isArray(response.data) ? response.data : []);
  const normalized = rawJobs.map((item) => {
    const jobSource = item.job || item;
    return {
      ...jobSource,
      id: String(jobSource.id || item.id),
      title: jobSource.title || "Job Opportunity",
      employer: jobSource.company || jobSource.employer || "Company",
      salary: jobSource.salary || "Competitive Salary",
      location: jobSource.location || "Flexible",
      avatar: jobSource.company_logo_url || jobSource.logo || jobSource.avatar || null,
      savedAt: item.pivot?.created_at || item.created_at || item.savedAt || new Date().toISOString(),
      applied: jobSource.applied || item.applied || false,
    };
  });
  return { success: true, jobs: normalized };
};

export const storeJob = async (jobData) => {
  const response = await apiClient.post(API_ENDPOINTS.JOBS_STORE, jobData);
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await apiClient.post(API_ENDPOINTS.JOBS, jobData);
  return response.data;
};

export const getMyJobs = async () => {
  const response = await apiClient.get(API_ENDPOINTS.MY_JOBS);
  return response.data;
};
