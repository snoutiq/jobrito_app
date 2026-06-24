import apiClient from "./apiClient";

const sampleJobs = [
  {
    id: "job-1",
    title: "Front Office Associate",
    employer: "Sunrise Hotels",
    category: "India Jobs",
    location: "Jaipur, India",
    salary: "INR 18,000 - 24,000",
    experience: "1-2 years",
    openings: 4,
    description: "Guest handling, check-in support, and hospitality service coordination.",
    postedDate: "2026-05-27",
    type: "India Jobs",
  },
  {
    id: "job-2",
    title: "Chef de Partie",
    employer: "Dubai Bay Resort",
    category: "Overseas Jobs",
    location: "Dubai, UAE",
    salary: "AED 4,500 - 6,000",
    experience: "3-5 years",
    openings: 2,
    description: "Support the kitchen team and maintain high culinary standards.",
    postedDate: "2026-05-24",
    type: "Overseas Jobs",
  },
  {
    id: "job-3",
    title: "Room Attendant Training",
    employer: "Hospitality Skill Hub",
    category: "Training Opportunities",
    location: "Pune, India",
    salary: "Stipend Available",
    experience: "Fresher",
    openings: 20,
    description: "Structured training program for entry-level hospitality professionals.",
    postedDate: "2026-05-21",
    type: "Training Opportunities",
  },
  {
    id: "job-4",
    title: "Referral: Banquet Supervisor",
    employer: "Elite Events Group",
    category: "Referral Opportunities",
    location: "Delhi, India",
    salary: "INR 28,000 - 35,000",
    experience: "2-4 years",
    openings: 1,
    description: "Trusted referral opening for banquet operations and team coordination.",
    postedDate: "2026-05-19",
    type: "Referral Opportunities",
  },
  {
    id: "job-5",
    title: "Community Kitchen Helper",
    employer: "Community Job Board",
    category: "Community Job Posts",
    location: "Ahmedabad, India",
    salary: "Negotiable",
    experience: "Any",
    openings: 8,
    description: "Short-term community job post for kitchen and service support.",
    postedDate: "2026-05-18",
    type: "Community Job Posts",
  },
];

export const getFeedJobs = async (filter) => {
  try {
    // backend exposes feed at /feed
    const response = await apiClient.get("/feed", { params: { filter } });
    // backend returns { success: true, feed: { data: [...] } }
    const jobs = response?.data?.feed?.data || [];
    return { success: true, jobs };
  } catch (error) {
    const filtered =
      filter && filter !== "All"
        ? sampleJobs.filter((job) => job.type === filter)
        : sampleJobs;
    return { success: true, jobs: filtered };
  }
};

export const applyToJob = async (jobId) => {
  try {
    const response = await apiClient.post(`/jobs/${jobId}/apply`);
    return response.data;
  } catch (error) {
    // fallback: simulate successful apply for offline/dev
    return { success: true, message: "Applied (offline)" };
  }
};

export const getJobDetails = async (jobId) => {
  try {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    const job = sampleJobs.find((item) => item.id === jobId) || sampleJobs[0];
    return { success: true, job };
  }
};

export const submitCommunityJob = async (data) => {
  try {
    const response = await apiClient.post("/jobs/community", data);
    return response.data;
  } catch (error) {
    return {
      success: true,
      status: "Pending Approval",
      job: {
        id: `community-${Date.now()}`,
        ...data,
      },
    };
  }
};

export const shareJob = async (jobId) => {
  try {
    const response = await apiClient.post(`/jobs/${jobId}/share`);
    return response.data;
  } catch (error) {
    const job = sampleJobs.find((item) => item.id === jobId);
    return {
      success: true,
      shareMessage: job
        ? `${job.title} at ${job.employer} - shared from JobConnect`
        : "Job shared from JobConnect",
    };
  }
};

export const sampleFeedJobs = sampleJobs;
