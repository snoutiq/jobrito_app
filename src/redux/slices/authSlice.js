import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import i18n from "../../i18n";
import {
  requestOtp as requestOtpApi,
  updateBasicProfile as updateBasicProfileApi,
  verifyOtp as verifyOtpApi,
} from "../../services/authApi";
import { setStoredLanguage, setToken } from "../../services/storage";

const resolveOnboardingFlag = (payload) =>
  payload?.has_completed_onboarding ?? payload?.hasCompletedOnboarding ?? false;

export const requestOtp = createAsyncThunk(
  "auth/requestOtp",
  async ({ phone, role }, { rejectWithValue }) => {
    try {
      const result = await requestOtpApi(phone, role);
      if (!result?.success) {
        return rejectWithValue(result?.message || "Failed to request OTP");
      }

      const payload = result?.data || result;
      if (payload?.token) {
        await setToken(payload.token);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to request OTP");
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ phone, otp, role, language, fcmToken }, { rejectWithValue }) => {
    try {
      const result = await verifyOtpApi(phone, otp, role, language, fcmToken);
      if (!result?.success) {
        return rejectWithValue(result?.message || "OTP verification failed");
      }

      const payload = result?.data || result;
      const token = payload?.token;
      const user = payload?.user || null;
      const hasCompletedOnboarding = resolveOnboardingFlag(payload);
      const message = payload?.message || "Authenticated successfully.";
      if (token) {
        await setToken(token);
      } // NOTE: language selection is handled separately in onboarding/profile flows
      return {
        token,
        user,
        hasCompletedOnboarding,
        message,
      };
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to verify OTP");
    }
  },
);

export const updateBasicProfile = createAsyncThunk(
  "auth/updateBasicProfile",
  async (data, { rejectWithValue }) => {
    try {
      const result = await updateBasicProfileApi(data);
      if (result?.token) {
        await setToken(result.token);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to update profile");
    }
  },
);

const initialState = {
  token: null,
  user: null,
  phone: "",
  role: "",
  otpRequested: false,
  otpVerified: false,
  loading: false,
  error: null,
  success: false,
  sessionResetKey: 0,
  hasCompletedOnboarding: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokenState: (state, action) => {
      state.token = action.payload;
    },
    setPhone: (state, action) => {
      state.phone = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.role = "";
      state.phone = "";
      state.otpRequested = false;
      state.otpVerified = false;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.hasCompletedOnboarding = false;
      state.sessionResetKey += 1;
    },
    clearAuthStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpRequested = true;
        state.phone = action.meta.arg.phone;
        state.role = action.meta.arg.role;
        state.success = true;

        const payload = action.payload?.data || action.payload;
        if (payload?.token && payload?.message === "Already logged in.") {
          state.token = payload.token;
          state.user = payload.user;
          state.otpVerified = true;
          state.hasCompletedOnboarding = resolveOnboardingFlag(payload) || (payload.user?.chef_profile || payload.user?.employer_profile ? true : false);
        }
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.otpVerified = true;
        state.phone = action.meta.arg.phone;
        state.role = action.meta.arg.role;
        state.token = action.payload?.token || null;
        state.user = action.payload?.user || null;
        state.hasCompletedOnboarding = action.payload?.hasCompletedOnboarding ?? false;
        state.success = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateBasicProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBasicProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token || state.token;
        state.success = true;
      })
      .addCase(updateBasicProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTokenState, setPhone, logout, clearAuthStatus } =
  authSlice.actions;
export default authSlice.reducer;