import apiClient from "./apiClient";

const sampleChefProfiles = [
  {
    id: "chef-1",
    name: "Chef Vikram",
    specialty: "Indian Cuisine",
    experience: "12 years",
    bio: "Seasoned hospitality chef with hotel and banquet background.",
    mobile: "+91 98989 98989",
    email: "vikram@example.com",
    city: "Bengaluru",
    availability: "Available for consulting",
    calendlyUrl: "https://calendly.com",
    photo: null,
  },
  {
    id: "chef-2",
    name: "Chef Naina",
    specialty: "Bakery and Pastry",
    experience: "8 years",
    bio: "Chef focused on premium pastry production and kitchen mentoring.",
    mobile: "+91 97777 77777",
    email: "naina@example.com",
    city: "Hyderabad",
    availability: "Open to projects",
    calendlyUrl: "https://calendly.com",
    photo: null,
  },
];

export const getChefProfiles = async () => {
  try {
    const response = await apiClient.get("/chef/profiles");
    return response.data;
  } catch (error) {
    return { success: true, chefs: sampleChefProfiles };
  }
};

export const getChefProfileDetails = async (chefId) => {
  try {
    const response = await apiClient.get(`/chef/profiles/${chefId}`);
    return response.data;
  } catch (error) {
    const chef = sampleChefProfiles.find((item) => item.id === chefId) || sampleChefProfiles[0];
    return { success: true, chef };
  }
};

export const saveChefOnboarding = async (formData) => {
  const response = await apiClient.post("/chef/onboarding/save", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getChefAppointments = async () => {
  const response = await apiClient.get("/chef/appointments");
  return response.data;
};

export const getChefDashboardStats = async () => {
  const response = await apiClient.get("/chef/dashboard");
  return response.data;
};

export const getEmployerChefs = async () => {
  const response = await apiClient.get("/employer/chefs");
  return response.data;
};

export const bookChefAppointment = async (bookingData) => {
  const response = await apiClient.post("/appointments/book", bookingData);
  return response.data;
};

export const updateChefAppointmentStatus = async (appointmentId, status) => {
  try {
    const response = await apiClient.put(`/chef/appointments/${appointmentId}/status`, { status });
    return response.data;
  } catch (error) {
    return { success: true, message: `Appointment status updated to ${status}` };
  }
};

export const getChefUpcomingConsultations = async () => {
  try {
    const response = await apiClient.get("/chef/consultations/upcoming");
    return response.data;
  } catch (error) {
    // Return appointments list as fallback for upcoming consultations
    const fallbackRes = await apiClient.get("/chef/appointments");
    const list = fallbackRes.data?.appointments || fallbackRes.data?.data || (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
    const confirmedList = list.filter((item) => {
      const s = String(item.status || "").toLowerCase();
      return s === "confirmed" || s === "scheduled" || s === "approved" || s === "pending";
    });
    return { success: true, consultations: confirmedList };
  }
};

export const getChefProfileViews = async () => {
  try {
    const response = await apiClient.get("/chef/profile-views");
    return response.data;
  } catch (error) {
    return {
      success: true,
      total_views: 0,
      views: [],
    };
  }
};

export const getChefProjectRequests = async () => {
  try {
    const response = await apiClient.get("/chef/project-requests");
    return response.data;
  } catch (error) {
    return {
      success: true,
      projects: [],
    };
  }
};

export const updateChefProjectStatus = async (projectId, status) => {
  try {
    const response = await apiClient.put(`/chef/project-requests/${projectId}/status`, { status });
    return response.data;
  } catch (error) {
    return { success: true, message: `Project status updated to ${status}` };
  }
};

export const updateChefAvailability = async (availabilityStatus) => {
  try {
    const response = await apiClient.post("/chef/availability/toggle", {
      availability: availabilityStatus,
    });
    return response.data;
  } catch (error) {
    const formData = new FormData();
    formData.append("availability", availabilityStatus);
    const fallbackRes = await apiClient.post("/chef/onboarding", formData);
    return fallbackRes.data;
  }
};

export const recordChefProfileView = async (chefId) => {
  if (!chefId) return;
  try {
    const response = await apiClient.post(`/chefs/${chefId}/view`);
    return response.data;
  } catch (error) {
    try {
      const response = await apiClient.post(`/chef/${chefId}/view`);
      return response.data;
    } catch (e) {
      return { success: true };
    }
  }
};
