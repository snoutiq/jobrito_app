import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getFeedJobs as getFeedJobsApi,
  getJobDetails as getJobDetailsApi,
  submitCommunityJob as submitCommunityJobApi,
  applyToJob as applyToJobApi,
  getSavedJobs as getSavedJobsApi,
  toggleSaveJob as toggleSaveJobApi,
  storeJob as storeJobApi,
  createJob as createJobApi,
  getMyJobs as getMyJobsApi,
} from "../../services/jobApi";

export const fetchFeedJobs = createAsyncThunk(
  "job/fetchFeedJobs",
  async (filter, { rejectWithValue }) => {
    try {
      return await getFeedJobsApi(filter);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch jobs");
    }
  },
);

export const fetchSavedJobs = createAsyncThunk(
  "job/fetchSavedJobs",
  async (_, { rejectWithValue }) => {
    try {
      return await getSavedJobsApi();
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch saved jobs");
    }
  },
);

export const toggleSaveJob = createAsyncThunk(
  "job/toggleSaveJob",
  async (jobId, { rejectWithValue }) => {
    try {
      return await toggleSaveJobApi(jobId);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to toggle save job");
    }
  },
);

export const fetchJobDetails = createAsyncThunk(
  "job/fetchJobDetails",
  async (jobId, { rejectWithValue }) => {
    try {
      return await getJobDetailsApi(jobId);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch job details");
    }
  },
);

export const submitCommunityJob = createAsyncThunk(
  "job/submitCommunityJob",
  async (data, { rejectWithValue }) => {
    try {
      return await submitCommunityJobApi(data);
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to submit community job",
      );
    }
  },
);

export const storeEmployerJob = createAsyncThunk(
  "job/storeEmployerJob",
  async (data, { rejectWithValue }) => {
    try {
      return await storeJobApi(data);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to store job");
    }
  },
);

export const createJobPost = createAsyncThunk(
  "job/createJobPost",
  async (data, { rejectWithValue }) => {
    try {
      return await createJobApi(data);
    } catch (error) {
      // Normalize error (apiClient returns a normalized error with message/status)
      const serialized = {
        message: error?.message || "Server Error",
        status: error?.status || null,
        errors: error?.errors || null,
        data: error?.data || null,
      };
      return rejectWithValue(serialized);
    }
  },
);

export const fetchMyJobs = createAsyncThunk(
  "job/fetchMyJobs",
  async (_, { rejectWithValue }) => {
    try {
      return await getMyJobsApi();
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch my jobs");
    }
  },
);

export const applyJob = createAsyncThunk(
  "job/applyJob",
  async ({ jobId, preferredCallTime }, { rejectWithValue }) => {
    try {
      return await applyToJobApi(jobId, preferredCallTime);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to apply to job");
    }
  },
);

const initialState = {
  feedJobs: [],
  savedJobs: [],
  myJobs: [],
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
        state.error = action.payload || action.error?.message;
      })
      .addCase(fetchSavedJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.savedJobs = action.payload?.jobs || [];
        state.success = true;
      })
      .addCase(fetchSavedJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
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
        state.error = action.payload || action.error?.message;
      })
      .addCase(fetchMyJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      // .addCase(fetchMyJobs.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.myJobs = action.payload?.created_jobs || action.payload || []; // Changed from .jobs to .created_jobs
      //   state.success = true;
      // })
      .addCase(fetchMyJobs.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        const createdJobs = Array.isArray(payload.created_jobs)
          ? payload.created_jobs
          : [];
        const pendingJobs = Array.isArray(payload.pending_created_jobs)
          ? payload.pending_created_jobs
          : [];
        const fallback =
          !createdJobs.length && !pendingJobs.length
            ? Array.isArray(payload)
              ? payload
              : Array.isArray(payload.jobs)
                ? payload.jobs
                : Array.isArray(payload.data)
                  ? payload.data
                  : []
            : [];

        // Merge created + pending jobs; force status "pending" if backend ever omits it
        const merged = [
          ...createdJobs,
          ...pendingJobs.map((job) => ({
            ...job,
            status: job.status || "pending",
          })),
          ...fallback,
        ];

        // De-dupe by id
        const seen = new Set();
        state.myJobs = merged.filter((job) => {
          const id = String(job.id);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        state.success = true;
      })
      .addCase(fetchMyJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
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
        state.error = action.payload || action.error?.message;
      })
      .addCase(storeEmployerJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(storeEmployerJob.fulfilled, (state, action) => {
        state.loading = false;
        state.communityJobResult = action.payload;
        state.success = true;
      })
      .addCase(storeEmployerJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })
      .addCase(createJobPost.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createJobPost.fulfilled, (state, action) => {
        state.loading = false;
        state.communityJobResult = action.payload;
        state.success = true;
      })
      .addCase(createJobPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
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
        const savedJob = state.savedJobs.find(
          (j) => String(j.id) === String(jobId),
        );
        if (savedJob) {
          savedJob.applied = true;
        }
      })
      .addCase("application/applyJob/rejected", (state, action) => {
        state.loading = false;
        state.applyingJobId = null;
        state.error = action.payload || action.error?.message;
        const errorMsg = action.payload || action.error?.message;
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
          const savedJob = state.savedJobs.find(
            (j) => String(j.id) === String(jobId),
          );
          if (savedJob) {
            savedJob.applied = true;
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
        const savedJob = state.savedJobs.find(
          (j) => String(j.id) === String(jobId),
        );
        if (savedJob) {
          savedJob.applied = true;
        }
      })
      .addCase(applyJob.rejected, (state, action) => {
        state.loading = false;
        state.applyingJobId = null;
        state.error = action.payload || action.error?.message;
        const errorMsg = action.payload || action.error?.message;
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
          const savedJob = state.savedJobs.find(
            (j) => String(j.id) === String(jobId),
          );
          if (savedJob) {
            savedJob.applied = true;
          }
        }
      })
      .addCase(toggleSaveJob.pending, (state) => {
        // Soft loading
      })
      .addCase(toggleSaveJob.fulfilled, (state, action) => {
        const jobId = action.meta.arg;
        const result = action.payload;

        // Find if job is saved in backend response or toggle locally
        const isSaved =
          result && result.hasOwnProperty("saved")
            ? result.saved
            : result && result.hasOwnProperty("status")
              ? result.status === "saved"
              : null;

        state.feedJobs = state.feedJobs.map((j) => {
          if (String(j.id) === String(jobId)) {
            const currentSaved = j.saved || j.is_saved || false;
            const finalSaved = isSaved !== null ? isSaved : !currentSaved;
            return { ...j, saved: finalSaved, is_saved: finalSaved };
          }
          return j;
        });

        // Sync state.savedJobs list
        const updatedJob = state.feedJobs.find(
          (j) => String(j.id) === String(jobId),
        );
        if (updatedJob) {
          if (updatedJob.saved) {
            if (!state.savedJobs.some((j) => String(j.id) === String(jobId))) {
              state.savedJobs.push(updatedJob);
            }
          } else {
            state.savedJobs = state.savedJobs.filter(
              (j) => String(j.id) !== String(jobId),
            );
          }
        } else {
          state.savedJobs = state.savedJobs.filter(
            (j) => String(j.id) !== String(jobId),
          );
        }
      })
      .addCase(toggleSaveJob.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearJobStatus } = jobSlice.actions;
export default jobSlice.reducer;
