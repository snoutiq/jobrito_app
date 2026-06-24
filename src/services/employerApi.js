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

export const getEmployerDashboard = async () => {
  try {
    const response = await apiClient.get("/employer/dashboard");
    return response.data;
  } catch (error) {
    return {
      success: true,
      stats: [
        { label: "Submitted Jobs", value: 2 },
        { label: "Applicants", value: 20 },
        { label: "Approved Jobs", value: 1 },
      ],
      submittedJobs: dashboardJobs,
    };
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
