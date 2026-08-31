import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";
import { getStoredProfile } from "./storage";

const normalizeDashboardResponse = (payload = {}) => {
  const metrics = payload.metrics || {};
  const jobs = payload.jobs || [];

  return {
    ...payload,
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
    created_jobs: payload.created_jobs || [],
    pending_created_jobs: payload.pending_created_jobs || [],
    submittedJobs: payload.created_jobs || jobs,
    jobs,
  };
};

export const getEmployerDashboard = async (userId) => {
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
  const response = await apiClient.get(API_ENDPOINTS.EMPLOYER_DASHBOARD, { params });
  return normalizeDashboardResponse(response.data);
};

export const getSubmittedJobs = async () => {
  const response = await apiClient.get(API_ENDPOINTS.EMPLOYER_JOBS);
  return response.data;
};

export const getApplicants = async (jobId) => {
  const response = await apiClient.get(`${API_ENDPOINTS.EMPLOYER_JOBS}/${jobId}/applicants`);
  return response.data;
};

export const updateApplicantStatus = async (applicationId, status) => {
  const response = await apiClient.post(`/applicants/${applicationId}/status`, {
    status,
  });
  return response.data;
};

export const checkEmployerOnboarding = async () => {
  const response = await apiClient.get(API_ENDPOINTS.EMPLOYER_ONBOARDING_DETAIL);
  return response.data;
};

export const saveEmployerOnboarding = async (formData) => {
  const response = await apiClient.post(API_ENDPOINTS.EMPLOYER_ONBOARDING_SAVE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const closeJob = async (jobId) => {
  const response = await apiClient.post(`${API_ENDPOINTS.JOBS}/${jobId}/close`);
  return response.data;
};

export const getMatchScore = async (applicationId) => {
  const response = await apiClient.post("/applications/match-score", {
    application_id: applicationId,
  });
  return response.data;
};

export const markApplicationViewed = async (applicationId) => {
  if (!applicationId) return;
  try {
    const response = await apiClient.post(`/employer/applications/${applicationId}/view`);
    return response.data;
  } catch (error) {
    console.warn("Failed to mark application as viewed:", error?.message || error);
  }
};

export const markJobStatsSeen = async (jobId) => {
  const response = await apiClient.post(`/jobs/${jobId}/mark-stats-seen`);
  return response.data;
};

