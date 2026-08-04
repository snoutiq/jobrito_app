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
  const rawJobs =
    response.data?.saved_jobs ||
    response.data?.jobs ||
    (Array.isArray(response.data) ? response.data : []);
  const normalized = rawJobs.map((item) => {
    const jobSource = item.job || item;
    const isTraining =
      (item.is_training ?? jobSource.is_training) ||
      item.category === "training" ||
      jobSource.category === "training";
    const idVal = String(item.id || jobSource.id || (isTraining ? `training_${item.training_id}` : item.job_post_id));

    return {
      ...jobSource,
      id: idVal,
      saved_id: item.saved_id,
      job_post_id: item.job_post_id || jobSource.job_post_id || idVal,
      training_id: item.training_id || jobSource.training_id,
      is_training: isTraining,
      title: jobSource.title || item.title || "Job Opportunity",
      employer:
        jobSource.company ||
        jobSource.employer ||
        item.company ||
        item.employer ||
        "Company",
      company:
        jobSource.company ||
        jobSource.employer ||
        item.company ||
        item.employer ||
        "Company",
      salary:
        jobSource.salary ||
        item.salary ||
        (isTraining ? "Paid Stipend" : "Competitive Salary"),
      location: jobSource.location || item.location || "Flexible",
      job_type:
        jobSource.job_type ||
        item.job_type ||
        (isTraining ? "Training / Program" : "Full-time"),
      avatar:
        jobSource.company_logo_url ||
        jobSource.logo ||
        jobSource.avatar ||
        item.company_logo_url ||
        item.logo ||
        item.avatar ||
        null,
      savedAt:
        item.saved_at ||
        item.pivot?.created_at ||
        item.created_at ||
        item.savedAt ||
        new Date().toISOString(),
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

export const getDailyPostLimit = async () => {
  const response = await apiClient.get("/user/daily-posts");
  return response.data;
};
