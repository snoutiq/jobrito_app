import apiClient from "./apiClient";
import { sampleFeedJobs } from "./jobApi";

const sampleHistory = [
  {
    id: "app-1",
    jobId: "job-1",
    title: "Front Office Associate",
    employer: "Sunrise Hotels",
    appliedOn: "2026-05-29",
    status: "New",
  },
  {
    id: "app-2",
    jobId: "job-2",
    title: "Chef de Partie",
    employer: "Dubai Bay Resort",
    appliedOn: "2026-05-26",
    status: "Contacted",
  },
];

export const applyJob = async (jobId) => {
  try {
    const response = await apiClient.post(`/jobs/${jobId}/apply`);
    return response.data;
  } catch (error) {
    const job = sampleFeedJobs.find((item) => item.id === jobId) || sampleFeedJobs[0];
    return {
      success: true,
      application: {
        id: `app-${Date.now()}`,
        jobId: job.id,
        title: job.title,
        employer: job.employer,
        appliedOn: new Date().toISOString().slice(0, 10),
        status: "New",
      },
    };
  }
};

export const getApplicationHistory = async () => {
  try {
    const response = await apiClient.get("/applications/history");
    return response.data;
  } catch (error) {
    return { success: true, applications: sampleHistory };
  }
};
