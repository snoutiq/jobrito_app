import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getChefProfiles as getChefProfilesApi } from "../../services/chefApi";

export const fetchChefProfiles = createAsyncThunk(
  "chef/fetchChefProfiles",
  async (_, { rejectWithValue }) => {
    try {
      return await getChefProfilesApi();
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch chef profiles");
    }
  }
);

const initialState = {
  chefs: [],
  loading: false,
  error: null,
  success: false,
};

const chefSlice = createSlice({
  name: "chef",
  initialState,
  reducers: {
    clearChefStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChefProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchChefProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.chefs = action.payload?.chefs || [];
        state.success = true;
      })
      .addCase(fetchChefProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearChefStatus } = chefSlice.actions;
export default chefSlice.reducer;
