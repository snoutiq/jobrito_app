import apiClient from "./apiClient";

const sampleJobs = [
  {
    id: "job-1",
    title: "Continental Chef Required",
    employer: "Grand Hyatt Dubai",
    category: "India Jobs",
    location: "Dubai, UAE",
    salary: "AED 3500 + Housing",
    experience: "2 Years",
    openings: 4,
    description: "Looking for professional and experienced chef to join our team.",
    postedDate: "2026-05-27",
    type: "India Jobs",
    is_pinned: false,
  },
  {
    id: "job-2",
    title: "Pastry Chef Required",
    employer: "Bombay Cafe",
    category: "Overseas Jobs",
    location: "Bandra, Mumbai",
    salary: "INR 35000 + Housing",
    experience: "2 Years",
    openings: 2,
    description: "Looking for experienced baker/chef to join our team.",
    postedDate: "2026-05-24",
    type: "Overseas Jobs",
    is_pinned: true,
  },
  {
    id: "job-3",
    title: "Kitchen Helpers (Riyadh)",
    employer: "Global Talent Overseas",
    category: "Training Opportunities",
    location: "Riyadh",
    salary: "Free Visa & Flights",
    experience: "Any",
    openings: 20,
    description: "Bulk hiring for mega-event hospitality project. Free Visa & Flights.",
    postedDate: "2026-05-21",
    type: "Training Opportunities",
    is_pinned: false,
  },
  {
    id: "job-4",
    title: "Banquet Supervisor",
    employer: "Elite Events Group",
    category: "Referral Opportunities",
    location: "Delhi, India",
    salary: "INR 28,000 - 35,000",
    experience: "2-4 years",
    openings: 1,
    description: "Trusted referral opening for banquet operations and team coordination.",
    postedDate: "2026-05-19",
    type: "Referral Opportunities",
    is_pinned: false,
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
    is_pinned: false,
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

export const applyToJob = async (jobId, preferredCallTime) => {
  try {
    const response = await apiClient.post(`/jobs/${jobId}/apply`, {
      preferred_call_time: preferredCallTime,
    });
    return response.data;
  } catch (error) {
    // fallback: simulate successful apply for offline/dev
    return { success: true, message: "Applied (offline)", preferred_call_time: preferredCallTime };
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
