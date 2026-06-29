import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { applyJob as applyJobApi, getApplicationHistory as getApplicationHistoryApi } from "../../services/applicationApi";

export const applyJob = createAsyncThunk(
  "application/applyJob",
  async (arg, { rejectWithValue }) => {
    try {
      let jobId;
      let preferredCallTime;
      if (typeof arg === "string") {
        jobId = arg;
      } else {
        jobId = arg.jobId;
        preferredCallTime = arg.preferredCallTime;
      }
      return await applyJobApi(jobId, preferredCallTime);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to apply for job");
    }
  }
);

export const fetchApplicationHistory = createAsyncThunk(
  "application/fetchApplicationHistory",
  async (_, { rejectWithValue }) => {
    try {
      return await getApplicationHistoryApi();
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch application history");
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
