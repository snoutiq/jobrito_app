import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import jobReducer from "./slices/jobSlice";
import applicationReducer from "./slices/applicationSlice";
import employerReducer from "./slices/employerSlice";
import chefReducer from "./slices/chefSlice";
import notificationReducer from "./slices/notificationSlice";

const appReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  job: jobReducer,
  application: applicationReducer,
  employer: employerReducer,
  chef: chefReducer,
  notification: notificationReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,
});

export default store;
