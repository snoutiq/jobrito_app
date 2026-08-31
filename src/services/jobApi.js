import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";
import { getStoredProfile } from "./storage";

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

export const getSavedJobs = async (userId) => {
  let params = {};
  if (userId) {
    params.user_id = userId;
  } else {
    try {
      const profile = await getStoredProfile();
      const id = profile?.id || profile?.user_id;
      if (id) params.user_id = id;
    } catch (e) {}
  }
  const response = await apiClient.get(API_ENDPOINTS.PROFILE_SAVED, { params });
  const rawJobs = response.data?.saved_jobs || [];

  const normalized = rawJobs.map((item) => {
    const isTraining = !!item.is_training;
    const idVal = String(item.id ?? item.job_post_id);

    return {
      ...item,
      id: idVal,
      saved_id: item.saved_id,
      job_post_id: item.job_post_id || idVal,
      training_id: item.training_id,
      is_training: isTraining,
      title: item.title || "Job Opportunity",
      employer: item.company || "Company",
      company: item.company || "Company",
      salary: item.salary || (isTraining ? "Paid Stipend" : "Competitive Salary"),
      location: item.location || "Flexible",
      job_type: item.job_type || (isTraining ? "Training / Program" : "Full-time"),
      avatar: item.company_logo_url || item.logo || item.avatar || null,
      savedAt: item.saved_at || item.created_at || new Date().toISOString(),
      applied: item.applied || false,
      saved: item.saved ?? item.is_saved ?? true,
    };
  });
  return { success: true, saved_jobs: normalized };
};

export const storeJob = async (jobData) => {
  const response = await apiClient.post(API_ENDPOINTS.JOBS_STORE, jobData);
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await apiClient.post(API_ENDPOINTS.JOBS_STORE, jobData);
  return response.data;
};

export const getMyJobs = async (userId) => {
  let params = {};
  if (userId) {
    params.user_id = userId;
  } else {
    try {
      const profile = await getStoredProfile();
      const id = profile?.id || profile?.user_id;
      if (id) params.user_id = id;
    } catch (e) {}
  }
  const response = await apiClient.get(API_ENDPOINTS.MY_JOBS, { params });
  return response.data;
};

export const getDailyPostLimit = async () => {
  const response = await apiClient.get("/user/daily-posts");
  return response.data;
};
