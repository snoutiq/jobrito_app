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
