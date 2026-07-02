import apiClient from "./apiClient";

const normalizeDashboardResponse = (payload = {}) => {
  const metrics = payload.metrics || {};
  const jobs = payload.jobs || [];

  return {
    success: payload.success ?? true,
    metrics,
    stats: [
      { label: "Total Applicants", value: metrics.total_applicants ?? 0 },
      { label: "Shortlisted", value: metrics.shortlisted ?? 0 },
      { label: "Rejected", value: metrics.rejected ?? 0 },
      { label: "Contacted", value: metrics.contacted ?? 0 },
      { label: "Active Jobs", value: metrics.active_jobs_count ?? 0 },
      { label: "Pending Jobs", value: metrics.pending_jobs_count ?? 0 },
    ],
    submittedJobs: jobs,
    jobs,
  };
};

export const getEmployerDashboard = async () => {
  const response = await apiClient.get("/employer_dashboard");
  return normalizeDashboardResponse(response.data);
};

export const getSubmittedJobs = async () => {
  const response = await apiClient.get("/employer/jobs");
  return response.data;
};

export const getApplicants = async (jobId) => {
  const response = await apiClient.get(`/employer/jobs/${jobId}/applicants`);
  return response.data;
};

export const updateApplicantStatus = async (applicationId, status) => {
  const response = await apiClient.post(`/applicants/${applicationId}/status`, {
    status,
  });
  return response.data;
};

export const checkEmployerOnboarding = async () => {
  const response = await apiClient.get("/employer/onboarding/detail");
  return response.data;
};

export const saveEmployerOnboarding = async (formData) => {
  const response = await apiClient.post("/employer/onboarding/save", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const closeJob = async (jobId) => {
  const response = await apiClient.post(`/jobs/${jobId}/close`);
  return response.data;
};
