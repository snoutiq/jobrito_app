import { initializeApp, getApps, getApp } from "firebase/app";
import nativeFirebase from "@react-native-firebase/app";

// Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCWcIdYwaFawA9ZPGsCGs1mTrPbwgEJ0IU",
  authDomain: "jobrito-b30ac.firebaseapp.com",
  projectId: "jobrito-b30ac",
  storageBucket: "jobrito-b30ac.firebasestorage.app",
  messagingSenderId: "780762046907",
  appId: "1:780762046907:android:1529ab0addb32956cba49e"
};

// Initialize Firebase JS SDK (useful for web support, Firestore, or RTDB if needed)
let firebaseJsApp;
if (!getApps().length) {
  firebaseJsApp = initializeApp(firebaseConfig);
} else {
  firebaseJsApp = getApp();
}

// Native Firebase instance (recommended for native features like Push Notifications, Analytics, Crashlytics)
const firebaseNativeApp = nativeFirebase;

export {
  firebaseJsApp,
  firebaseNativeApp,
  firebaseConfig
};
