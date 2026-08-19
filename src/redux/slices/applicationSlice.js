import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { applyJob as applyJobApi, getApplicationHistory as getApplicationHistoryApi } from "../../services/applicationApi";

// Async thunk for fetching application history
export const fetchApplicationHistory = createAsyncThunk(
  "application/fetchApplicationHistory",
  async (email, { rejectWithValue }) => {
    try {
      const response = await getApplicationHistoryApi(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch application history");
    }
  }
);

// Async thunk for applying to a job
export const applyJob = createAsyncThunk(
  "application/applyJob",
  async (arg, { dispatch, rejectWithValue }) => {
    try {
      const { jobId, ...payload } = arg;
      const response = await applyJobApi(jobId, payload);
      
      // Immediately reload GET APIs (Application History & Saved Jobs)
      try {
        const { fetchSavedJobs } = require("./jobSlice");
        dispatch(getApplicationHistory());
        dispatch(fetchSavedJobs());
      } catch (e) {
        console.warn("Failed to auto-reload saved jobs / history after apply:", e);
      }

      return { ...response, jobId };
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to apply for job");
    }
  }
);
const initialState = {
  history: [],
  lastApplication: null,
  loading: false,
  error: null,
  success: false,
};

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    clearApplicationStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.lastApplication = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(applyJob.fulfilled, (state, action) => {
        state.loading = false;
        state.lastApplication = action.payload?.application || null;
        if (state.lastApplication) {
          state.history = [state.lastApplication, ...state.history];
        }
        state.success = true;
      })
      .addCase(applyJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchApplicationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchApplicationHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload?.applications || [];
        state.success = true;
      })
      .addCase(fetchApplicationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearApplicationStatus } = applicationSlice.actions;
export default applicationSlice.reducer;
