import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pushToken: null,
  enabled: false,
  loading: false,
  error: null,
  success: false,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setPushToken: (state, action) => {
      state.pushToken = action.payload;
    },
    setNotificationEnabled: (state, action) => {
      state.enabled = action.payload;
    },
    clearNotificationStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
});

export const {
  setPushToken,
  setNotificationEnabled,
  clearNotificationStatus,
} = notificationSlice.actions;

export default notificationSlice.reducer;
