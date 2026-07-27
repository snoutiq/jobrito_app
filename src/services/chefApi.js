import apiClient from "./apiClient";
import { API_ENDPOINTS } from "../constants/endpoints";

export const getChefProfiles = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CHEF_PROFILES);
  return response.data;
};

export const getChefProfileDetails = async (chefId) => {
  const response = await apiClient.get(`${API_ENDPOINTS.CHEF_PROFILES}/${chefId}`);
  return response.data;
};

export const saveChefOnboarding = async (formData) => {
  const response = await apiClient.post(API_ENDPOINTS.CHEF_ONBOARDING_SAVE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getChefAppointments = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CHEF_APPOINTMENTS);
  return response.data;
};

export const getChefDashboardStats = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CHEF_DASHBOARD);
  return response.data;
};

export const getEmployerChefs = async () => {
  const response = await apiClient.get(API_ENDPOINTS.EMPLOYER_CHEFS);
  return response.data;
};

export const bookChefAppointment = async (bookingData) => {
  const response = await apiClient.post(API_ENDPOINTS.APPOINTMENTS_BOOK, bookingData);
  return response.data;
};

export const updateChefAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`${API_ENDPOINTS.CHEF_APPOINTMENTS}/${appointmentId}/status`, { status });
  return response.data;
};

export const getChefUpcomingConsultations = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CHEF_CONSULTATIONS_UPCOMING);
  return response.data;
};

export const getChefProfileViews = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CHEF_PROFILE_VIEWS);
  return response.data;
};

export const getChefProjectRequests = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CHEF_PROJECT_REQUESTS);
  return response.data;
};

export const updateChefProjectStatus = async (projectId, status) => {
  const response = await apiClient.put(`${API_ENDPOINTS.CHEF_PROJECT_REQUESTS}/${projectId}/status`, { status });
  return response.data;
};

export const updateChefAvailability = async (availabilityStatus) => {
  const response = await apiClient.post(API_ENDPOINTS.CHEF_AVAILABILITY_TOGGLE, {
    availability: availabilityStatus,
  });
  return response.data;
};

export const recordChefProfileView = async (chefId) => {
  if (!chefId) return { success: false, message: "Chef ID is required" };
  const response = await apiClient.post(`/chefs/${chefId}/view`);
  return response.data;
};
