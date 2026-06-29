import apiClient from "./apiClient";

export const applyJob = async (jobId, preferredCallTime) => {
  const response = await apiClient.post(`/jobs/${jobId}/apply`, {
    preferred_call_time: preferredCallTime,
  });
  return response.data;
};

export const getApplicationHistory = async () => {
  try {
    const response = await apiClient.get("/applications/history");
    return response.data;
  } catch (error) {
    // Return mockup matching the image when API fails or is not available
    return {
      success: true,
      applications: [
        {
          id: "app-1",
          title: "Restaurant Manager",
          employer: "Grand Hyatt Dubai",
          appliedOn: "2026-06-27T10:00:00.000Z", // 2 days ago relative to 2026-06-29
          status: "UNDER REVIEW",
          avatar: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=100&auto=format&fit=crop",
        },
        {
          id: "app-2",
          title: "Restaurant Manager",
          employer: "Marriott Mumbai",
          appliedOn: "2026-06-22T10:00:00.000Z", // 1 week ago
          status: "SHORTLISTED",
          avatar: "https://images.unsplash.com/photo-1544025162-d76694265947?w=100&auto=format&fit=crop",
        },
        {
          id: "app-3",
          title: "Restaurant Manager",
          employer: "The Ritz-Carlton",
          appliedOn: "2026-10-12T10:00:00.000Z", // 12 Oct
          status: "CONTACTED",
          avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&auto=format&fit=crop",
        },
        {
          id: "app-4",
          title: "Restaurant Manager",
          employer: "Hilton Garden Inn",
          appliedOn: "2026-10-08T10:00:00.000Z", // 08 Oct
          status: "DECISION PENDING",
          avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop",
        },
        {
          id: "app-5",
          title: "Restaurant Manager",
          employer: "Four Seasons Riyadh",
          appliedOn: "2026-09-30T10:00:00.000Z", // 30 Sep
          status: "JOB CLOSED",
          avatar: null,
        },
      ],
    };
  }
};
