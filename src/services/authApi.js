import apiClient from "./apiClient";
import { setStoredProfile, setStoredRole, setToken } from "./storage";
import { ROLES, ROLE_API_MAP } from "../constants/roles";

const toFormUrlEncoded = (data) => {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
};

// export const requestOtp = async (phone) => {
//   try {
//     const response = await apiClient.post("/login", { phone });
//     return response.data;
//   } catch (error) {
//     return { success: true, message: "OTP sent", phone };
//   }
// };

export const requestOtp = async (phone, role) => {
  console.log('hii');
  console.log('Sending Data:', { phone, role, mappedRole: ROLE_API_MAP[role] });
      console.log(apiClient.defaults.baseURL,"ankit2");
  try {
    const response = await apiClient.post("/login", toFormUrlEncoded({
      mobile_number: phone,
      login_role: ROLE_API_MAP[role],
    }), {
      skipAuth: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
 console.log(response.data,"ankit");
    return {
      success: true,
      data: response.data,
      message: "OTP sent successfully",
    };
   
    
  } catch (error) {
    // Handle different error scenarios
    let errorMessage = "Failed to send OTP. Please try again.";
    
    if (error?.response?.status === 429) {
      errorMessage = "Too many attempts. Please try after some time.";
    } else if (error?.response?.status === 400) {
      errorMessage = error?.response?.data?.message || "Invalid phone number";
    } else if (error?.code === "ECONNABORTED") {
      errorMessage = "Request timeout. Please check your network.";
    }
    
    return {
      success: false,
      message: errorMessage,
      phone: phone,
      error: error?.response?.data,
    };
  }
};

// export const verifyOtp = async (phone, otp) => {
//   try {
//     const response = await apiClient.post("/verify-otp", { phone, otp });
//     return response.data;
//   } catch (error) {
//     return {
//       success: true,
//       verified: true,
//       phone,
//       tempSession: true,
//     };
//   }
// };

export const verifyOtp = async (phone, otp, role, language, fcmToken) => {
  console.log( phone, otp, role, language, fcmToken ,"ankit3");
  
  try {
    const response = await apiClient.post("/verify-otp", toFormUrlEncoded({
      mobile_number: phone,
      login_role: ROLE_API_MAP[role],
      otp,
      selected_language: language,
      fcm_token: fcmToken || "",
    }), {
      skipAuth: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
console.log(response);

    return {
      success: true,
      data: response.data,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("OTP verification failed:", error);
    
    let errorMessage = "Invalid OTP. Please try again.";
    
    if (error?.response?.status === 400) {
      errorMessage = error?.response?.data?.message || "Invalid or expired OTP";
    } else if (error?.response?.status === 404) {
      errorMessage = "User not found. Please check your phone number.";
    } else if (error?.response?.status === 429) {
      errorMessage = "Too many attempts. Please try after some time.";
    }
    
    return {
      success: false,
      message: errorMessage,
      phone: phone,
    };
  }
};

export const updateBasicProfile = async (data) => {
  try {
    const response = await apiClient.post("/auth/basic-profile", data);
    return response.data;
  } catch (error) {
    const profile = {
      id: "user-1",
      name: data.name,
      email: data.email || "",
      city: data.city || "Mumbai",
      phone: data.phone,
      role: data.role || ROLES.JOB_SEEKER,
      completionPercentage: 40,
    };
    await setToken("mock-jobconnect-token");
    await setStoredRole(profile.role);
    await setStoredProfile(profile);
    return {
      success: true,
      token: "mock-jobconnect-token",
      profile,
    };
  }
};

export const logout = async () => {
  try {
    const response = await apiClient.post("/logout");
    return response.data;
  } catch (error) {
    return { success: true, message: "Logged out (offline)" };
  }
};
