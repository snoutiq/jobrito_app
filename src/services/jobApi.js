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

export const toggleSaveJob = async (jobId) => {
  const response = await apiClient.post(`/jobs/${jobId}/save`);
  return response.data;
};

export const getSavedJobs = async () => {
  try {
    const response = await apiClient.get("/profile/saved");
    // Normalize response jobs
    const rawJobs = response.data?.saved_jobs || response.data?.jobs || (Array.isArray(response.data) ? response.data : []);
    const normalized = rawJobs.map((item) => {
      const jobSource = item.job || item;
      return {
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
  } catch (error) {
    console.error("Failed to fetch saved jobs:", error.message);
    return { success: false, jobs: [], error: error.message };
  }
};

export const storeJob = async (jobData) => {
  const response = await apiClient.post("/jobs/store", jobData);
  return response.data;
};

