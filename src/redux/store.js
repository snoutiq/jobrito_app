import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import jobReducer from "./slices/jobSlice";
import applicationReducer from "./slices/applicationSlice";
import employerReducer from "./slices/employerSlice";
import chefReducer from "./slices/chefSlice";
import notificationReducer from "./slices/notificationSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    job: jobReducer,
    application: applicationReducer,
    employer: employerReducer,
    chef: chefReducer,
    notification: notificationReducer,
  },
});

export default store;
