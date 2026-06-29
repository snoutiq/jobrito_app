import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getFeedJobs as getFeedJobsApi, getJobDetails as getJobDetailsApi, submitCommunityJob as submitCommunityJobApi, applyToJob as applyToJobApi } from "../../services/jobApi";

export const fetchFeedJobs = createAsyncThunk(
  "job/fetchFeedJobs",
  async (filter, { rejectWithValue }) => {
    try {
      return await getFeedJobsApi(filter);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch jobs");
    }
  }
);

export const fetchJobDetails = createAsyncThunk(
  "job/fetchJobDetails",
  async (jobId, { rejectWithValue }) => {
    try {
      return await getJobDetailsApi(jobId);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch job details");
    }
  }
);

export const submitCommunityJob = createAsyncThunk(
  "job/submitCommunityJob",
  async (data, { rejectWithValue }) => {
    try {
      return await submitCommunityJobApi(data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to submit community job");
    }
  }
);

export const applyJob = createAsyncThunk(
  "job/applyJob",
  async ({ jobId, preferredCallTime }, { rejectWithValue }) => {
    try {
      return await applyToJobApi(jobId, preferredCallTime);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to apply to job");
    }
  }
);

const initialState = {
  feedJobs: [],
  jobDetails: null,
  communityJobResult: null,
  loading: false,
  applyingJobId: null,
  error: null,
  success: false,
};

const jobSlice = createSlice({
  name: "job",
  initialState,
  reducers: {
    clearJobStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.communityJobResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchFeedJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.feedJobs = action.payload?.jobs || [];
        state.success = true;
      })
      .addCase(fetchFeedJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchJobDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchJobDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.jobDetails = action.payload?.job || null;
        state.success = true;
      })
      .addCase(fetchJobDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitCommunityJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitCommunityJob.fulfilled, (state, action) => {
        state.loading = false;
        state.communityJobResult = action.payload;
        state.success = true;
      })
      .addCase(submitCommunityJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // apply job handlers
    builder
      .addCase("application/applyJob/pending", (state, action) => {
        state.loading = true;
        const arg = action.meta.arg;
        state.applyingJobId = typeof arg === "string" ? arg : arg?.jobId;
        state.error = null;
        state.success = false;
      })
      .addCase("application/applyJob/fulfilled", (state, action) => {
        state.loading = false;
        state.applyingJobId = null;
        state.success = true;
        const arg = action.meta.arg;
        const jobId = typeof arg === "string" ? arg : arg?.jobId;
        const job = state.feedJobs.find((j) => j.id === jobId);
        if (job) {
          job.applied = true;
        }
        if (state.jobDetails && state.jobDetails.id === jobId) {
          state.jobDetails.applied = true;
        }
      })
      .addCase("application/applyJob/rejected", (state, action) => {
        state.loading = false;
        state.applyingJobId = null;
        state.error = action.payload;
        const errorMsg = action.payload;
        if (
          typeof errorMsg === "string" &&
          (errorMsg.toLowerCase().includes("already applied") ||
            errorMsg.toLowerCase().includes("already_applied"))
        ) {
          const arg = action.meta.arg;
          const jobId = typeof arg === "string" ? arg : arg?.jobId;
          const job = state.feedJobs.find((j) => j.id === jobId);
          if (job) {
            job.applied = true;
          }
          if (state.jobDetails && state.jobDetails.id === jobId) {
            state.jobDetails.applied = true;
          }
        }
      })
      .addCase(applyJob.pending, (state, action) => {
        state.loading = true;
        const arg = action.meta.arg;
        state.applyingJobId = typeof arg === "string" ? arg : arg?.jobId;
        state.error = null;
        state.success = false;
      })
      .addCase(applyJob.fulfilled, (state, action) => {
        state.loading = false;
        state.applyingJobId = null;
        state.success = true;
        const arg = action.meta.arg;
        const jobId = typeof arg === "string" ? arg : arg?.jobId;
        const job = state.feedJobs.find((j) => j.id === jobId);
        if (job) {
          job.applied = true;
        }
        if (state.jobDetails && state.jobDetails.id === jobId) {
          state.jobDetails.applied = true;
        }
      })
      .addCase(applyJob.rejected, (state, action) => {
        state.loading = false;
        state.applyingJobId = null;
        state.error = action.payload;
        const errorMsg = action.payload;
        if (
          typeof errorMsg === "string" &&
          (errorMsg.toLowerCase().includes("already applied") ||
            errorMsg.toLowerCase().includes("already_applied"))
        ) {
          const arg = action.meta.arg;
          const jobId = typeof arg === "string" ? arg : arg?.jobId;
          const job = state.feedJobs.find((j) => j.id === jobId);
          if (job) {
            job.applied = true;
          }
          if (state.jobDetails && state.jobDetails.id === jobId) {
            state.jobDetails.applied = true;
          }
        }
      });
  },
});

export const { clearJobStatus } = jobSlice.actions;
export default jobSlice.reducer;
