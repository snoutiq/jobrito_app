import apiClient from "./apiClient";

export const applyJob = async (jobId, preferredCallTime) => {
  const response = await apiClient.post(`/jobs/${jobId}/apply`, {
    preferred_call_time: preferredCallTime,
  });
  return response.data;
};

export const getApplicationHistory = async () => {
  const response = await apiClient.get("/applications/history");
  return response.data;
};
