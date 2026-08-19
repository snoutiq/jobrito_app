import { Linking } from "react-native";
import { navigationRef } from "../navigation/navigationRef";

/**
 * Pure React Native Linking Prefix Configuration
 * Scheme: jobrito://
 * Web Domain: https://jobrito.com & http://jobrito.com
 */
export const linkingConfig = {
  prefixes: ["jobrito://", "https://jobrito.com", "http://jobrito.com"],
  config: {
    screens: {
      // 1. Job Details (Active / Feed Job)
      JobDetails: "job/:jobId",

      // 2. Employer Job Details
      MyJobDetails: "my-job/:jobId",

      // 3. My Jobs List (Active / Pending / Closed)
      MyJobs: "my-jobs",

      // 4. Post New Job (Employer / Jobseeker)
      PostJob: "post-job",
      PostReferralJob: "post-referral-job",

      // 5. Complete Profile
      ChefCompleteProfile: "complete-profile/chef",
      EmployerCompleteProfile: "complete-profile/employer",

      // 6. Calendly Integration
      CalendlyIntegration: "calendly",

      // 7. Social Media Links
      SocialMediaLinks: "social-links",

      // 8. Chef Profile View / Share
      ChefProfileDetails: "chef/:chefId",

      // 9. Applicant List for a Job
      ApplicantList: "job/:jobId/applicants",

      // 10. Notifications List Page
      EmployerNotifications: "notifications",

      // 11. Deep Link Guide Screen
      DeepLinkGuide: "deep-links",
    },
  },
};

/**
 * Pure JS helper to parse deep link URLs without external dependencies
 */
export const parseDeepLinkUrl = (url = "") => {
  try {
    const cleanUrl = url.replace(/^(jobrito:\/\/|https?:\/\/jobrito\.com\/?|http?:\/\/jobrito\.com\/?)/i, "");
    const [pathPart, queryPart] = cleanUrl.split("?");
    const path = pathPart || "";
    const queryParams = {};

    if (queryPart) {
      queryPart.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        if (key) {
          queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : true;
        }
      });
    }

    return { path, queryParams };
  } catch (e) {
    return { path: url, queryParams: {} };
  }
};

/**
 * Handle incoming Deep Link URL programmatically
 * @param {string} url - e.g. "jobrito://job/84" or "jobrito://my-jobs?tab=pending"
 */
export const handleDeepLinkUrl = (url) => {
  if (!url) return;
  try {
    const { path, queryParams } = parseDeepLinkUrl(url);

    console.log("🔗 [DeepLink Received]:", { url, path, queryParams });

    if (!navigationRef.isReady()) {
      const checkReady = setInterval(() => {
        if (navigationRef.isReady()) {
          clearInterval(checkReady);
          executeNavigation(path, queryParams);
        }
      }, 200);
      setTimeout(() => clearInterval(checkReady), 8000);
    } else {
      executeNavigation(path, queryParams);
    }
  } catch (err) {
    console.warn("⚠️ Failed to parse deep link URL:", err);
  }
};

/**
 * Map Deep Link path to App Screens & Navigation
 */
const executeNavigation = (path, params = {}) => {
  if (!navigationRef.isReady()) return;

  const normalizedPath = path.toLowerCase().replace(/^\/+|\/+$/g, "");

  // 1. Job Details: job/:jobId or job/84
  if (normalizedPath.startsWith("job/") && !normalizedPath.endsWith("/applicants")) {
    const parts = normalizedPath.split("/");
    const jobId = parts[1] || params.jobId;
    if (jobId) {
      navigationRef.navigate("JobDetails", { jobId });
      return;
    }
  }

  // 2. Applicant List: job/:jobId/applicants
  if (normalizedPath.startsWith("job/") && normalizedPath.endsWith("/applicants")) {
    const parts = normalizedPath.split("/");
    const jobId = parts[1] || params.jobId;
    if (jobId) {
      navigationRef.navigate("ApplicantList", { jobId });
      return;
    }
  }

  // 3. Employer Job Details: my-job/:jobId
  if (normalizedPath.startsWith("my-job/")) {
    const parts = normalizedPath.split("/");
    const jobId = parts[1] || params.jobId;
    if (jobId) {
      navigationRef.navigate("MyJobDetails", { jobId });
      return;
    }
  }

  // 4. My Jobs List: my-jobs (supports ?tab=pending / ?tab=active / ?tab=closed)
  if (normalizedPath === "my-jobs") {
    const activeTab = params.tab || params.activeTab || "active";
    navigationRef.navigate("MyJobs", { activeTab });
    return;
  }

  // 5. Post Job / Post Referral Job
  if (normalizedPath === "post-job") {
    navigationRef.navigate("PostJob");
    return;
  }
  if (normalizedPath === "post-referral-job") {
    navigationRef.navigate("PostReferralJob");
    return;
  }

  // 6. Complete Profile (Chef / Employer)
  if (normalizedPath.startsWith("complete-profile")) {
    if (normalizedPath.includes("employer")) {
      navigationRef.navigate("EmployerCompleteProfile");
    } else {
      navigationRef.navigate("ChefCompleteProfile");
    }
    return;
  }

  // 7. Calendly Integration
  if (normalizedPath === "calendly") {
    navigationRef.navigate("CalendlyIntegration");
    return;
  }

  // 8. Social Media Links
  if (normalizedPath === "social-links") {
    navigationRef.navigate("SocialMediaLinks");
    return;
  }

  // 9. Chef Profile: chef/:chefId or chefs/:chefId
  if (normalizedPath.startsWith("chef/") || normalizedPath.startsWith("chefs/")) {
    const parts = normalizedPath.split("/");
    const chefId = parts[1] || params.chefId || params.id;
    if (chefId) {
      navigationRef.navigate("ChefProfileDetails", { chefId });
      return;
    }
  }

  // 10. Notifications Page
  if (normalizedPath === "notifications") {
    navigationRef.navigate("EmployerNotifications");
    return;
  }

  // 11. Deep Link Guide
  if (normalizedPath === "deep-links") {
    navigationRef.navigate("DeepLinkGuide");
    return;
  }

  // Fallback to Notifications
  navigationRef.navigate("EmployerNotifications");
};

/**
 * Notification Push Click Handler
 * Call this when a push notification is tapped
 */
export const handleNotificationResponse = (response) => {
  if (!response) return;

  const data = response.notification?.request?.content?.data || {};
  console.log("🔔 [Notification Response Handler Data]:", data);

  // 1. Direct deep link URL (e.g. data.deep_link = "jobrito://job/84" or data.url = "jobrito://calendly")
  const deepLink = data.deep_link || data.url || data.link;
  if (deepLink) {
    handleDeepLinkUrl(deepLink);
    return;
  }

  // 2. Direct screen + params payload (e.g. { screen: "JobDetails", params: { jobId: 84 } })
  if (data.screen) {
    if (!navigationRef.isReady()) {
      const checkReady = setInterval(() => {
        if (navigationRef.isReady()) {
          clearInterval(checkReady);
          navigationRef.navigate(data.screen, data.params || {});
        }
      }, 250);
      setTimeout(() => clearInterval(checkReady), 8000);
    } else {
      navigationRef.navigate(data.screen, data.params || {});
    }
    return;
  }

  // 3. Fallback: navigate to Notifications Screen
  if (navigationRef.isReady()) {
    navigationRef.navigate("EmployerNotifications");
  }
};

/**
 * List of Deep Links for Backend Developers & Testing
 */
export const DEEP_LINK_LIST = [
  {
    category: "Chef Profile Details / Share",
    url: "jobrito://chef/101",
    webUrl: "https://jobrito.com/chef/101",
    screen: "ChefProfileDetails",
    payload: { deep_link: "jobrito://chef/101" },
  },
  {
    category: "Job Details (Active Job)",
    url: "jobrito://job/84",
    webUrl: "https://jobrito.com/job/84",
    screen: "JobDetails",
    payload: { deep_link: "jobrito://job/84" },
  },
  {
    category: "My Posted Jobs (Pending Tab)",
    url: "jobrito://my-jobs?tab=pending",
    webUrl: "https://jobrito.com/my-jobs?tab=pending",
    screen: "MyJobs",
    payload: { deep_link: "jobrito://my-jobs?tab=pending" },
  },
  {
    category: "Post New Job",
    url: "jobrito://post-job",
    webUrl: "https://jobrito.com/post-job",
    screen: "PostJob",
    payload: { deep_link: "jobrito://post-job" },
  },
  {
    category: "Complete Profile (Chef)",
    url: "jobrito://complete-profile/chef",
    webUrl: "https://jobrito.com/complete-profile/chef",
    screen: "ChefCompleteProfile",
    payload: { deep_link: "jobrito://complete-profile/chef" },
  },
  {
    category: "Complete Profile (Employer)",
    url: "jobrito://complete-profile/employer",
    webUrl: "https://jobrito.com/complete-profile/employer",
    screen: "EmployerCompleteProfile",
    payload: { deep_link: "jobrito://complete-profile/employer" },
  },
  {
    category: "Calendly Integration",
    url: "jobrito://calendly",
    webUrl: "https://jobrito.com/calendly",
    screen: "CalendlyIntegration",
    payload: { deep_link: "jobrito://calendly" },
  },
  {
    category: "Social Media Links",
    url: "jobrito://social-links",
    webUrl: "https://jobrito.com/social-links",
    screen: "SocialMediaLinks",
    payload: { deep_link: "jobrito://social-links" },
  },
  {
    category: "Applicant List for Job",
    url: "jobrito://job/84/applicants",
    webUrl: "https://jobrito.com/job/84/applicants",
    screen: "ApplicantList",
    payload: { deep_link: "jobrito://job/84/applicants" },
  },
  {
    category: "Notifications Screen",
    url: "jobrito://notifications",
    webUrl: "https://jobrito.com/notifications",
    screen: "EmployerNotifications",
    payload: { deep_link: "jobrito://notifications" },
  },
];
