# 🔔 Jobito - Push Notification & Deep Linking Specification

This document provides the complete API specification for **Push Notifications (FCM/Expo)** and **Deep Links** for the Jobito Mobile Application (iOS & Android).

The backend team must follow these payload structures so that when a user taps a push notification or opens a shared link, the app automatically navigates to the exact intended screen.

---

## 📌 1. Deep Link Scheme & Web Domains

The app supports two URI formats:
- **Custom App Scheme**: `jobrito://` (e.g., `jobrito://my-jobs?tab=pending`)
- **Universal / Web Links**: `https://jobrito.com/` (e.g., `https://jobrito.com/job/84`)

---

## 🚀 2. FCM Push Notification Payload Schema

When sending push notifications via Firebase Cloud Messaging (FCM) or Expo Push Service, include the `data` object containing either a `deep_link` URL or an `event` + `target_id`.

### Recommended Push Notification Payload (JSON)
```json
{
  "to": "EXPO_PUSH_TOKEN_OR_FCM_TOKEN",
  "title": "Job Approved! 🎉",
  "body": "Your Job posting 'Sous Chef' is now live for talent.",
  "data": {
    "deep_link": "jobrito://my-jobs?tab=active",
    "event": "job_approved",
    "target_id": "84",
    "role": "employer"
  }
}
```

---

## 🗺️ 3. Complete Route & Deep Link Mapping Matrix

| Notification Trigger / Use Case | App Navigation Target Screen | Deep Link URI (`deep_link`) | Web URL (`https://jobrito.com`) | Data Payload Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **New Job Posted / Approved** | `JobDetails` | `jobrito://job/{job_id}` | `https://jobrito.com/job/{job_id}` | `{"event": "job_approved", "target_id": 84}` |
| **Employer My Jobs (Pending Tab)** | `MyJobs` (Tab: `pending`) | `jobrito://my-jobs?tab=pending` | `https://jobrito.com/my-jobs?tab=pending` | `{"deep_link": "jobrito://my-jobs?tab=pending"}` |
| **Employer My Jobs (Active Tab)** | `MyJobs` (Tab: `active`) | `jobrito://my-jobs?tab=active` | `https://jobrito.com/my-jobs?tab=active` | `{"deep_link": "jobrito://my-jobs?tab=active"}` |
| **Employer My Jobs (Closed Tab)** | `MyJobs` (Tab: `closed`) | `jobrito://my-jobs?tab=closed` | `https://jobrito.com/my-jobs?tab=closed` | `{"deep_link": "jobrito://my-jobs?tab=closed"}` |
| **Candidate Applied / Applicants List** | `ApplicantList` | `jobrito://job/{job_id}/applicants` | `https://jobrito.com/job/{job_id}/applicants` | `{"event": "candidate_shortlisted", "target_id": 84}` |
| **Employer Single Job Details** | `MyJobDetails` | `jobrito://my-job/{job_id}` | `https://jobrito.com/my-job/{job_id}` | `{"deep_link": "jobrito://my-job/84"}` |
| **Chef / Talent Profile Details** | `ChefProfileDetails` | `jobrito://chef/{chef_id}` | `https://jobrito.com/chef/{chef_id}` | `{"event": "chef_detail", "target_id": 101}` |
| **Employer Profile Completion** | `EmployerCompleteProfile` | `jobrito://complete-profile/employer` | `https://jobrito.com/complete-profile/employer` | `{"event": "profile_completion", "role": "employer"}` |
| **Chef Profile Completion** | `ChefCompleteProfile` | `jobrito://complete-profile/chef` | `https://jobrito.com/complete-profile/chef` | `{"event": "profile_completion", "role": "chef"}` |
| **Post a New Job Screen** | `PostJob` | `jobrito://post-job` | `https://jobrito.com/post-job` | `{"deep_link": "jobrito://post-job"}` |
| **Post Referral Job Screen** | `PostReferralJob` | `jobrito://post-referral-job` | `https://jobrito.com/post-referral-job` | `{"deep_link": "jobrito://post-referral-job"}` |
| **Notifications Screen** | `EmployerNotifications` | `jobrito://notifications` | `https://jobrito.com/notifications` | `{"deep_link": "jobrito://notifications"}` |
| **Calendly Integration** | `CalendlyIntegration` | `jobrito://calendly` | `https://jobrito.com/calendly` | `{"deep_link": "jobrito://calendly"}` |
| **Social Links Screen** | `SocialMediaLinks` | `jobrito://social-links` | `https://jobrito.com/social-links` | `{"deep_link": "jobrito://social-links"}` |

---

## ⚙️ 4. Event-Based Trigger Configuration

If your backend sends notifications based on system events, use the following `event` strings in the `data` object:

### A. Employer Job Approved / Published
```json
{
  "title": "Job Approved!",
  "body": "Your job 'Barista' has been approved by admin.",
  "data": {
    "event": "job_approved",
    "target_id": "84",
    "deep_link": "jobrito://my-jobs?tab=active"
  }
}
```

### B. New Applicant Applied to Job
```json
{
  "title": "New Application Received!",
  "body": "John Doe applied for your 'Sous Chef' opening.",
  "data": {
    "event": "candidate_shortlisted",
    "target_id": "84",
    "deep_link": "jobrito://job/84/applicants"
  }
}
```

### C. Profile Completion Reminder
```json
{
  "title": "Complete Your Business Profile",
  "body": "Add your operational locations to start receiving applications.",
  "data": {
    "event": "profile_completion",
    "role": "employer",
    "deep_link": "jobrito://complete-profile/employer"
  }
}
```

### D. New Talent / Chef Profile Match
```json
{
  "title": "Top Chef Profile Available!",
  "body": "Check out Chef Rahul's profile for your kitchen.",
  "data": {
    "event": "chef_detail",
    "target_id": "101",
    "deep_link": "jobrito://chef/101"
  }
}
```

---

## 🧪 5. Testing Deep Links via ADB / Terminal

You can test any deep link directly on a connected device or Android emulator:

```bash
# Test opening My Jobs Pending Tab
adb shell am start -W -a android.intent.action.VIEW -d "jobrito://my-jobs?tab=pending"

# Test opening Job Details (Job ID: 84)
adb shell am start -W -a android.intent.action.VIEW -d "jobrito://job/84"

# Test opening Applicants List (Job ID: 84)
adb shell am start -W -a android.intent.action.VIEW -d "jobrito://job/84/applicants"

# Test opening Chef Profile (Chef ID: 101)
adb shell am start -W -a android.intent.action.VIEW -d "jobrito://chef/101"
```
