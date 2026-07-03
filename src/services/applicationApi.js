import apiClient from "./apiClient";

export const applyJob = async (jobId, preferredCallTime) => {
  const response = await apiClient.post(`/jobs/${jobId}/apply`, {
    preferred_call_time: preferredCallTime,
  });
  return response.data;
};

export const getApplicationHistory = async (email) => {
  try {
    const response = await apiClient.get("/profile/applications", {
      params: { email },
    });
    const rawApps = response.data?.applications || response.data || [];
    const normalized = rawApps.map((item) => {
      const jobSource = item.job_post || item.job || item;
      return {
        id: String(item.id),
        jobId: String(jobSource.id || item.job_post_id || item.job_id || item.jobId),
        title: jobSource.title || "Job Title",
        employer: jobSource.company || jobSource.employer || "Company Name",
        avatar: jobSource.company_logo_url || jobSource.logo || jobSource.avatar || null,
        status: String(item.status || "UNDER REVIEW").toUpperCase(),
        appliedOn: item.created_at || item.applied_at || item.appliedOn || new Date().toISOString(),
        job: jobSource,
      };
    });
    return { success: true, applications: normalized };
  } catch (error) {
    console.warn("Failed to fetch application history:", error.message);
    return {
      success: false,
      applications: [],
      error: error.message
    };
  }
};
