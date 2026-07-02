import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getProfile as getProfileApi, switchRole as switchRoleApi, updateProfile as updateProfileApi, updateLanguagePreference } from "../../services/profileApi";
import { ROLES } from "../../constants/roles";
import { verifyOtp } from "./authSlice";

export const fetchProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await getProfileApi();
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch profile");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (data, { rejectWithValue }) => {
    try {
      return await updateProfileApi(data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to update profile");
    }
  }
);

export const switchUserRole = createAsyncThunk(
  "user/switchUserRole",
  async (role, { rejectWithValue }) => {
    try {
      return await switchRoleApi(role);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to switch role");
    }
  }
);

export const updateUserLanguage = createAsyncThunk(
  "user/updateLanguage",
  async (language, { rejectWithValue }) => {
    try {
      const response = await updateLanguagePreference(language);
      return response; // Can be used to update state if needed
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const initialState = {
  profile: {
    name: "Guest User",
    role: ROLES.JOB_SEEKER,
    completionPercentage: 60,
    employerOnboardingCompleted: false,
  },
  activeRole: ROLES.JOB_SEEKER,
  loading: false,
  error: null,
  success: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfileData: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
      state.activeRole = action.payload?.role || state.activeRole;
    },
    setActiveRole: (state, action) => {
      state.activeRole = action.payload;
      state.profile.role = action.payload;
    },
    resetUser: (state) => {
      state.profile = initialState.profile;
      state.activeRole = initialState.activeRole;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyOtp.fulfilled, (state, action) => {
        const payload = action.payload;
        if (payload) {
          const role = action.meta.arg.role;
          const isEmp = role?.toLowerCase() === "employer";
          const isChef = role?.toLowerCase() === "chef" || role?.toLowerCase() === "job_seeker";
          const hasCompleted = payload.hasCompletedOnboarding ?? false;
          
          state.profile = {
            ...state.profile,
            ...payload.user,
            employerOnboardingCompleted: isEmp ? hasCompleted : state.profile.employerOnboardingCompleted,
            chefOnboardingCompleted: isChef ? hasCompleted : state.profile.chefOnboardingCompleted,
          };
          state.activeRole = role || state.activeRole;
          
          if (payload.user) {
            state.profile.name = payload.user.full_name || payload.user.name || state.profile.name;
            state.profile.phone = payload.user.mobile_number || payload.user.phone || state.profile.phone;
          }
        }
      })
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload?.profile || state.profile;
        state.activeRole =
          action.payload?.profile?.role || state.profile.role || state.activeRole;
        state.success = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload?.profile || state.profile;
        state.activeRole = state.profile.role || state.activeRole;
        state.success = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(switchUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(switchUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRole = action.payload?.role || state.activeRole;
        state.profile.role = action.payload?.role || state.profile.role;
        state.success = true;
      })
      .addCase(switchUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle language update
      .addCase(updateUserLanguage.fulfilled, (state, action) => {
        // Language preference synced with backend.
        console.log("Language preference synced with backend.");
      })
      .addCase(updateUserLanguage.rejected, (state, action) => {
        console.error("Failed to sync language preference:", action.payload);
      })
      ;
  },
});

export const { setProfileData, setActiveRole, resetUser } = userSlice.actions;
export default userSlice.reducer;
