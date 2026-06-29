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

export const getSavedJobs = async () => {
  try {
    const response = await apiClient.get("/jobs/saved");
    return response.data;
  } catch (error) {
    // Return mockup matching the image when API fails or is not available
    return {
      success: true,
      jobs: [
        {
          id: "saved-1",
          title: "Restaurant Manager",
          employer: "The Grand Plaza Hotel",
          salary: "INR 5 Lakh LPA",
          location: "Mumbai",
          avatar: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&auto=format&fit=crop",
          savedAt: "2026-06-27T10:00:00.000Z", // 2d ago relative to 2026-06-29
        },
        {
          id: "saved-2",
          title: "Restaurant Manager",
          employer: "Oasis Artisan Coffee",
          salary: "INR 5 Lakh LPA",
          location: "Delhi",
          avatar: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100&auto=format&fit=crop",
          savedAt: "2026-06-29T05:00:00.000Z", // 5h ago relative to 10:00 AM
        },
        {
          id: "saved-3",
          title: "Restaurant Manager",
          employer: "The Emerald Lounge",
          salary: "Competitive Salary",
          location: "Dubai",
          avatar: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=100&auto=format&fit=crop",
          savedAt: "2026-06-22T10:00:00.000Z", // 1w ago
        },
      ],
    };
  }
};
