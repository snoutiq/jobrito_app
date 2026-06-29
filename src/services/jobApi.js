import apiClient from "./apiClient";

export const getFeedJobs = async (filter) => {
  const response = await apiClient.get("/feed", { params: { filter } });
  const jobs = response?.data?.feed?.data || [];
  return { success: true, jobs };
};

export const applyToJob = async (jobId, preferredCallTime) => {
  const response = await apiClient.post(`/jobs/${jobId}/apply`, {
    preferred_call_time: preferredCallTime,
  });
  return response.data;
};

export const getJobDetails = async (jobId) => {
  const response = await apiClient.get(`/jobs/${jobId}`);
  return response.data;
};

export const submitCommunityJob = async (data) => {
  const response = await apiClient.post("/jobs/community", data);
  return response.data;
};

export const shareJob = async (jobId) => {
  const response = await apiClient.post(`/jobs/${jobId}/share`);
  return response.data;
};
