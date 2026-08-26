import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getApplicants as getApplicantsApi,
  getEmployerDashboard as getEmployerDashboardApi,
  updateApplicantStatus as updateApplicantStatusApi,
  closeJob as closeJobApi,
  markJobStatsSeen as markJobStatsSeenApi,
} from "../../services/employerApi";

export const fetchEmployerDashboard = createAsyncThunk(
  "employer/fetchEmployerDashboard",
  async (_, { rejectWithValue }) => {
    try {
      return await getEmployerDashboardApi();
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch dashboard");
    }
  }
);

export const fetchApplicants = createAsyncThunk(
  "employer/fetchApplicants",
  async (jobId, { rejectWithValue }) => {
    try {
      return await getApplicantsApi(jobId);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch applicants");
    }
  }
);

export const updateApplicantStatus = createAsyncThunk(
  "employer/updateApplicantStatus",
  async ({ applicationId, status }, { rejectWithValue }) => {
    try {
      return await updateApplicantStatusApi(applicationId, status);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to update applicant status");
    }
  }
);

export const closeEmployerJob = createAsyncThunk(
  "employer/closeEmployerJob",
  async (jobId, { rejectWithValue }) => {
    try {
      return await closeJobApi(jobId);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to close job");
    }
  }
);

export const markJobStatsSeen = createAsyncThunk(
  "employer/markJobStatsSeen",
  async (jobId, { rejectWithValue }) => {
    try {
      const res = await markJobStatsSeenApi(jobId);
      return { jobId, ...res };
    } catch (error) {
      return rejectWithValue({ jobId, error: error?.message || "Failed to mark seen" });
    }
  }
);

const patchJobInDashboard = (dashboardRaw, jobId, patch) => {
  if (!dashboardRaw) return;
  ["jobs", "created_jobs", "pending_created_jobs", "data"].forEach((key) => {
    if (Array.isArray(dashboardRaw[key])) {
      dashboardRaw[key] = dashboardRaw[key].map((j) =>
        String(j.id) === String(jobId) ? { ...j, ...patch } : j
      );
    }
  });
};

const initialState = {
  stats: [],
  metrics: {},
  submittedJobs: [],
  applicants: [],
  loading: false,
  error: null,
  success: false,
};

const employerSlice = createSlice({
  name: "employer",
  initialState,
  reducers: {
    clearEmployerStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchEmployerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardRaw = action.payload;
        state.stats = action.payload?.stats || [];
        state.metrics = action.payload?.metrics || {};
        state.submittedJobs =
          action.payload?.created_jobs ||
          action.payload?.submittedJobs ||
          action.payload?.jobs ||
          action.payload?.data ||
          [];
        state.success = true;
      })
      .addCase(fetchEmployerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchApplicants.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchApplicants.fulfilled, (state, action) => {
        state.loading = false;
        state.applicants = action.payload?.applicants || [];
        state.success = true;
      })
      .addCase(fetchApplicants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateApplicantStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateApplicantStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedStatus = action.payload?.status;
        const updatedId = action.payload?.applicationId;
        state.applicants = state.applicants.map((applicant) =>
          applicant.id === updatedId
            ? { ...applicant, status: updatedStatus }
            : applicant
        );
        state.success = true;
      })
      .addCase(updateApplicantStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(closeEmployerJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(closeEmployerJob.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(closeEmployerJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markJobStatsSeen.pending, (state, action) => {
        // Optimistic update — turant dot hata do, API response ka wait mat karo
        const jobId = action.meta.arg;
        patchJobInDashboard(state.dashboardRaw, jobId, { has_unseen_activity: false });
        state.submittedJobs = state.submittedJobs.map((j) =>
          String(j.id) === String(jobId) ? { ...j, has_unseen_activity: false } : j
        );
      })
      .addCase(markJobStatsSeen.fulfilled, (state, action) => {
        const { jobId, has_unseen_activity, last_seen_by_employer_at } = action.payload || {};
        patchJobInDashboard(state.dashboardRaw, jobId, { has_unseen_activity, last_seen_by_employer_at });
        state.submittedJobs = state.submittedJobs.map((j) =>
          String(j.id) === String(jobId) ? { ...j, has_unseen_activity, last_seen_by_employer_at } : j
        );
      })
      .addCase(markJobStatsSeen.rejected, (state, action) => {
        // Rollback — API fail hui toh dot wapas dikha do
        const jobId = action.payload?.jobId;
        if (jobId) {
          patchJobInDashboard(state.dashboardRaw, jobId, { has_unseen_activity: true });
          state.submittedJobs = state.submittedJobs.map((j) =>
            String(j.id) === String(jobId) ? { ...j, has_unseen_activity: true } : j
          );
        }
      });
  },
});

export const { clearEmployerStatus } = employerSlice.actions;
export default employerSlice.reducer;
