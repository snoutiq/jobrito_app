import { Linking } from "react-native";
import { navigationRef } from "../navigation/navigationRef";

/**
 * Pure React Native Linking Prefix Configuration
 * Scheme: jobrito://
 * Web Domain: https://jobrito.com & http://jobrito.com
 */
/**
 * Pure React Native Linking Prefix Configuration
 * Scheme: jobrito://
 * Web Domain: https://jobrito.com & http://jobrito.com
 */
export const linkingConfig = {
  prefixes: ["jobrito://", "https://jobrito.com", "http://jobrito.com"],
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
 * @param {string} url - e.g. "jobrito://jobs/84" or "jobrito://my-jobs?tab=pending"
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

  // 1. Job Details: jobs/:jobId, job/:jobId or job/84
  if (
    (normalizedPath.startsWith("job/") || normalizedPath.startsWith("jobs/")) &&
    !normalizedPath.endsWith("/applicants")
  ) {
    const parts = normalizedPath.split("/");
    const jobId = parts[1] || params.jobId || params.target_id || params.id;
    if (jobId) {
      navigationRef.navigate("JobDetails", { jobId });
      return;
    }
  }

  // 2. Applicant List / Applications: applications/:applicationId or job/:jobId/applicants
  if (
    normalizedPath.startsWith("application/") ||
    normalizedPath.startsWith("applications/") ||
    (normalizedPath.startsWith("job/") && normalizedPath.endsWith("/applicants"))
  ) {
    const parts = normalizedPath.split("/");
    const targetId = parts[1] || params.applicationId || params.jobId || params.target_id;
    if (targetId) {
      navigationRef.navigate("ApplicantList", { jobId: targetId });
      return;
    }
  }

  // 3. Employer Job Details: my-job/:jobId or my-jobs/:jobId
  if (normalizedPath.startsWith("my-job/") || normalizedPath.startsWith("my-jobs/")) {
    const parts = normalizedPath.split("/");
    const jobId = parts[1] || params.jobId || params.target_id;
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
  // NOTE: Screen names in MainTabs.js are "Post Job" and "Post Referral Job" (with spaces)
  if (normalizedPath === "post-job") {
    navigationRef.navigate("Post Job");
    return;
  }
  if (normalizedPath === "post-referral-job") {
    navigationRef.navigate("Post Referral Job");
    return;
  }

  // 6. Complete Profile (Chef / Employer / Jobseeker)
  if (normalizedPath.startsWith("complete-profile") || normalizedPath === "profile_completion") {
    if (normalizedPath.includes("employer") || params.role === "employer") {
      navigationRef.navigate("EmployerCompleteProfile");
    } else {
      navigationRef.navigate("ChefCompleteProfile");
    }
    return;
  }

  // 7. Calendly Integration → CalendlyIntegrationScreen
  if (normalizedPath === "calendly") {
    navigationRef.navigate("CalendlyIntegration");
    return;
  }

  // 8. Social Media Links → SocialMediaLinksScreen
  if (normalizedPath === "social-links") {
    navigationRef.navigate("SocialMediaLinks");
    return;
  }

  // 9. Chef Profile: chef/:chefId or chefs/:chefId
  if (normalizedPath.startsWith("chef/") || normalizedPath.startsWith("chefs/")) {
    const parts = normalizedPath.split("/");
    const chefId = parts[1] || params.chefId || params.target_id || params.id;
    if (chefId) {
      navigationRef.navigate("ChefProfileDetails", { chefId });
      return;
    }
  }

  // 10. Notifications Page → EmployerNotifications screen (EmployerNotificationsScreen.js)
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

  const data = response.notification?.request?.content?.data || response.data || {};
  console.log("🔔 [Notification Response Handler Data]:", data);

  const event = String(data.event || data.type || data.screen || "").toLowerCase();
  const targetId = data.target_id || data.job_id || data.application_id || data.chef_id || data.user_id;

  const navigateTarget = (screen, navParams = {}) => {
    if (!navigationRef.isReady()) {
      const checkReady = setInterval(() => {
        if (navigationRef.isReady()) {
          clearInterval(checkReady);
          navigationRef.navigate(screen, navParams);
        }
      }, 250);
      setTimeout(() => clearInterval(checkReady), 8000);
    } else {
      navigationRef.navigate(screen, navParams);
    }
  };

  // 1. Events that carry extra payload data that a bare URL can't express (e.g. role, completeness, targetId)
  if (event === "profile_completion" || event === "complete-profile") {
    const roleLower = String(data.role || "").toLowerCase();
    const screen = roleLower === "employer" ? "EmployerCompleteProfile" : "ChefCompleteProfile";
    navigateTarget(screen, { completeness: data.completeness, userId: targetId });
    return;
  }

  // 2. Generic deep link URL (covers jobs/{id}, applications/{id}, chefs/{id}, etc.)
  const deepLink = data.deep_link || data.url || data.link;
  if (deepLink) {
    handleDeepLinkUrl(deepLink);
    return;
  }

  // 3. Fallback event mapping if no deep_link string was sent
  if (["job_created", "job_approved", "job_alert", "job_rejected", "job_detail"].includes(event) && targetId) {
    navigateTarget("JobDetails", { jobId: targetId });
    return;
  }

  if (["candidate_shortlisted", "employer_shortlisted_candidate", "application_detail"].includes(event) && targetId) {
    navigateTarget("ApplicantList", { jobId: targetId });
    return;
  }

  if (["chef_approved", "chef_detail"].includes(event) && targetId) {
    navigateTarget("ChefProfileDetails", { chefId: targetId });
    return;
  }

  // 4. Default Fallback: navigate to Notifications Screen
  navigateTarget("EmployerNotifications");
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
