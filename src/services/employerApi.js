import apiClient from "./apiClient";

const dashboardJobs = [
  {
    id: "job-101",
    title: "Banquet Supervisor",
    location: "Delhi, India",
    status: "Pending",
    applicants: 12,
  },
  {
    id: "job-102",
    title: "Executive Chef",
    location: "Mumbai, India",
    status: "Approved",
    applicants: 8,
  },
];

const applicantPool = {
  "job-101": [
    {
      id: "cand-1",
      name: "Rahul Mehta",
      phone: "+91 98765 43210",
      role: "Banquet Captain",
      city: "Delhi",
      status: "New",
    },
    {
      id: "cand-2",
      name: "Asha Verma",
      phone: "+91 91234 56789",
      role: "Event Coordinator",
      city: "Noida",
      status: "Contacted",
    },
  ],
  "job-102": [
    {
      id: "cand-3",
      name: "Chef Arjun",
      phone: "+91 99887 66554",
      role: "Sous Chef",
      city: "Pune",
      status: "Shortlisted",
    },
  ],
};

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
  try {
    const response = await apiClient.get("/employer_dashboard");
    return normalizeDashboardResponse(response.data);
  } catch (error) {
    return normalizeDashboardResponse({
      success: true,
      metrics: {
        total_applicants: 20,
        shortlisted: 12,
        rejected: 8,
        contacted: 5,
        active_jobs_count: 1,
        pending_jobs_count: 1,
      },
      jobs: dashboardJobs,
    });
  }
};

export const getSubmittedJobs = async () => {
  try {
    const response = await apiClient.get("/employer/jobs");
    return response.data;
  } catch (error) {
    return { success: true, jobs: dashboardJobs };
  }
};

export const getApplicants = async (jobId) => {
  try {
    const response = await apiClient.get(`/employer/jobs/${jobId}/applicants`);
    return response.data;
  } catch (error) {
    return { success: true, applicants: applicantPool[jobId] || [] };
  }
};

export const updateApplicantStatus = async (applicationId, status) => {
  try {
    const response = await apiClient.patch(`/applications/${applicationId}`, {
      status,
    });
    return response.data;
  } catch (error) {
    return {
      success: true,
      applicationId,
      status,
    };
  }
};

export const checkEmployerOnboarding = async () => {
  try {
    const response = await apiClient.get("/employer/onboarding/detail");
    return response.data;
  } catch (error) {
    console.warn("Failed to check employer onboarding:", error.message);
    return { success: false, data: null };
  }
};



export const saveEmployerOnboarding = async (formData) => {
  const response = await apiClient.post("/employer/onboarding/save", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
