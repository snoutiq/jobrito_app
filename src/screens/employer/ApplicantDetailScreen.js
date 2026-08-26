import React, { useState, useEffect } from "react";
import { 
  Linking,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  PixelRatio,
  Clipboard,
} from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { updateApplicantStatus, fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import * as Haptics from 'expo-haptics';
import { getAvatarUrl, getAbsoluteProfilePhotoUrl } from "../../components/SwipeDeck/SwipeCard";
import { getMatchScore } from "../../services/employerApi";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const CircularMatchProgress = ({ score = 91, size = normalize(56), strokeWidth = 3.5 }) => {
  const normalizedScore = Math.min(Math.max(Number(score) || 0, 0), 100);
  const angle = (normalizedScore / 100) * 360;
  const progressColor =
    normalizedScore >= 80 ? "#7e22ce" : normalizedScore >= 60 ? "#2563eb" : "#ea580c";

  const halfSize = size / 2;
  const rightRotation = Math.min(angle, 180);
  const leftRotation = Math.max(0, angle - 180);

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      {/* Background Track Circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: halfSize,
          borderWidth: strokeWidth,
          borderColor: "#e2e8f0",
          position: "absolute",
        }}
      />

      {/* Right Half Progress Ring (0 to 180 deg) */}
      {angle > 0 && (
        <View
          style={{
            width: halfSize,
            height: size,
            position: "absolute",
            left: halfSize,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: progressColor,
              position: "absolute",
              left: -halfSize,
              transform: [{ rotate: `${rightRotation}deg` }],
            }}
          />
        </View>
      )}

      {/* Left Half Progress Ring (180 to 360 deg) */}
      {angle > 180 && (
        <View
          style={{
            width: halfSize,
            height: size,
            position: "absolute",
            left: 0,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: strokeWidth,
              borderColor: progressColor,
              position: "absolute",
              left: 0,
              transform: [{ rotate: `${leftRotation}deg` }],
            }}
          />
        </View>
      )}

      {/* Center Score Text */}
      <Text style={{ fontSize: normalize(13.5), fontWeight: "900", color: "#0f172a" }}>
        {normalizedScore}%
      </Text>
    </View>
  );
};

export default function ApplicantDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { applicantId, jobId } = route.params || {};

  // Retrieve the job details from the Redux store
  const selectedJob = useSelector((state) =>
    state.employer.submittedJobs.find((j) => j.id === jobId)
  );

  // Bulletproof candidate loading: fallback to the passed navigation object if redux is refreshing
  const applicant = route.params?.applicantItem || selectedJob?.applicants?.find((a) => a.id === applicantId);

  // Local state to manage the applicant's status for immediate UI feedback
  const [localStatus, setLocalStatus] = useState(applicant?.status);
  // State for match score
  const [fetchedMatchScore, setFetchedMatchScore] = useState(applicant?.match_score || applicant?.match?.score);

  // Sync local state if the applicant from Redux changes
  useEffect(() => {
    setLocalStatus(applicant?.status);
    const initialScore = applicant?.match_score ?? applicant?.match?.score ?? applicant?.match_percentage;
    if (initialScore != null) {
      setFetchedMatchScore(initialScore);
      return;
    }

    const appId = applicant?.id || applicant?.application_id || applicantId;
    if (appId && fetchedMatchScore == null) {
      let isMounted = true;
      getMatchScore(appId)
        .then((data) => {
          if (isMounted && data?.match_percentage != null) {
            setFetchedMatchScore(data.match_percentage);
          }
        })
        .catch((error) => {
          if (
            error?.name === "CanceledError" ||
            error?.message === "canceled" ||
            error?.message === "Request Cancelled" ||
            error?.errorCode === "TIMEOUT" ||
            error?.status === 499
          ) {
            return;
          }
          console.warn("Failed to fetch match score:", error?.message || error);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [applicant?.id, applicant?.application_id, applicantId]);

  if (!applicant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={normalize(22)} color="#0a0504" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("talentDetails", "Talent Details")}</Text>
          </View>
          <View style={{ width: normalize(22) }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("applicantNotFound", "Applicant details not found.")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const chefProfile = applicant.chef_profile || applicant.chef_profile_details || applicant.user?.chef_profile || {};
  const availabilityInfo = chefProfile.availability_info || applicant.availability_info || {};

  const displayName = applicant.name || applicant.full_name || applicant.user?.name || applicant.user?.full_name || applicant.mobile_number || "";
  const displayCity = applicant.city || applicant.job_location || applicant.user?.city || (applicant.country ? `${applicant.city || ""}, ${applicant.country}` : "");
  const displayPrefLocation = availabilityInfo.location_preference || applicant.locationPreference || applicant.location_preference || applicant.user?.location_preference || "";
  const displayExperience = applicant.experience_range || applicant.experience_years || applicant.experience || applicant.user?.experience_range || applicant.user?.experience_years || "";
  const displayEmployer = applicant.current_employer || applicant.current_company || applicant.user?.current_employer || "";
  const displayRole = applicant.preferred_role || applicant.preference || applicant.current_role || chefProfile.cuisine_specialty || applicant.user?.preferred_role || "";
  const displayCalendly = applicant.calendly_link || chefProfile.calendly_link || applicant.user?.calendly_link || "";
  const displayBio = applicant.bio || chefProfile.bio || applicant.user?.bio || "";
  const preferredCallTime = applicant.preferred_call_time || applicant.user?.preferred_call_time || "";

  const displayAge = applicant.age || applicant.user?.age ? `${applicant.age || applicant.user?.age} ${t("years", "Years")}` : "";
  const displayGender = applicant.gender || applicant.user?.gender || "";
  const displayProfileId = applicant.profile_id || applicant.user?.profile_id || "";
  
  const rawEmpType =
    applicant.job_type ||
    applicant.employment_type ||
    (Array.isArray(applicant.employment_preference) && applicant.employment_preference.length > 0
      ? applicant.employment_preference.join(", ")
      : typeof applicant.employment_preference === "string"
      ? applicant.employment_preference
      : "") ||
    (Array.isArray(availabilityInfo.employment_preference) && availabilityInfo.employment_preference.length > 0
      ? availabilityInfo.employment_preference.join(", ")
      : "") ||
    applicant.user?.employment_type ||
    "";
  const displayEmpType = rawEmpType && rawEmpType !== "N/A" ? rawEmpType : "";

  const displayOverseasExp =
    applicant.overseas_work_experience ||
    applicant.user?.overseas_work_experience ||
    chefProfile.overseas_work_experience ||
    "";

  const getSkillsList = () => {
    const op =
      applicant.operational_expertise ||
      applicant.operational_experties ||
      applicant.optational_expertices ||
      chefProfile.operational_expertise ||
      chefProfile.operational_experties ||
      chefProfile.optational_expertices ||
      applicant.user?.operational_expertise ||
      applicant.user?.operational_experties ||
      applicant.user?.optational_expertices;
    if (Array.isArray(op) && op.length > 0) return op;
    if (typeof op === "string" && op.trim()) return op.split(",").map((x) => x.trim());

    const list = applicant.skills || applicant.user?.skills || [];
    if (Array.isArray(list) && list.length > 0) {
      return list.map((s) => (typeof s === "object" ? s.name || s.title || String(s) : s));
    }
    if (typeof list === "string" && list.trim()) return list.split(",").map((x) => x.trim());

    return [];
  };

  const getCuisinesList = () => {
    const list =
      applicant.cuisine_specialty ||
      applicant.specialties ||
      chefProfile.cuisine_specialty ||
      chefProfile.specialties ||
      applicant.user?.cuisine_specialty ||
      applicant.user?.specialties ||
      [];
    if (Array.isArray(list) && list.length > 0) return list;
    if (typeof list === "string" && list.trim()) return list.split(",").map((x) => x.trim());
    return [];
  };

  const getRegionalList = () => {
    const list =
      availabilityInfo.regional_experience ||
      applicant.regional_experience ||
      chefProfile.regional_experience ||
      applicant.user?.regional_experience ||
      [];
    if (Array.isArray(list) && list.length > 0) return list;
    if (typeof list === "string" && list.trim()) return list.split(",").map((x) => x.trim());
    return [];
  };

  const getLanguagesList = () => {
    const list =
      availabilityInfo.languages ||
      applicant.languages ||
      chefProfile.languages ||
      applicant.user?.languages ||
      [];
    if (Array.isArray(list) && list.length > 0) return list;
    if (typeof list === "string" && list.trim()) return list.split(",").map((x) => x.trim());
    return [];
  };

  // Determine whether this is a Chef or Talent / Job Seeker
  const activeProfileStr = String(
    applicant.active_profile ||
    applicant.active_role ||
    applicant.user_role ||
    applicant.role ||
    applicant.user?.active_profile ||
    applicant.user?.active_role ||
    ""
  ).toLowerCase();

  const isChefProfile =
    (activeProfileStr === "chef" ||
      Boolean(applicant.chef_profile) ||
      Boolean(applicant.chef_profile_details) ||
      Boolean(applicant.user?.chef_profile)) &&
    activeProfileStr !== "job_seeker" &&
    activeProfileStr !== "talent";

  const getAvailabilityStatus = () => {
    // Hide Availability completely for Talent / Job Seeker side!
    if (!isChefProfile) return "";

    return (
      availabilityInfo.availability_status ||
      availabilityInfo.status ||
      applicant.availability_status ||
      applicant.user?.availability_status ||
      ""
    );
  };

  const rawAvailStatus = String(getAvailabilityStatus()).trim();
  const isAvailableStatus =
    rawAvailStatus.toLowerCase().includes("available") &&
    !rawAvailStatus.toLowerCase().includes("not") &&
    !rawAvailStatus.toLowerCase().includes("un") &&
    !rawAvailStatus.toLowerCase().includes("employed");

  const displayAvailability = isAvailableStatus
    ? t("immediately", "Immediately")
    : rawAvailStatus && rawAvailStatus !== "N/A"
      ? rawAvailStatus
      : "";

  const getActiveSocials = () => {
    const list = [];
    if (displayCalendly && displayCalendly.trim()) {
      list.push({ platform: t("calendlyLink", "Calendly Link"), icon: "calendar-outline", color: "#6366f1", url: displayCalendly });
    }

    const socials = applicant.socials || chefProfile.socials || applicant.user?.socials || {};

    const web = socials.website || applicant.website || chefProfile.website || applicant.portfolio || applicant.user?.website;
    if (web && web.trim()) {
      list.push({ platform: t("website", "Website"), icon: "globe-outline", color: "#153e69", url: web });
    }

    const ig = socials.instagram || applicant.instagram || chefProfile.instagram || applicant.instagram_link || chefProfile.instagram_link || applicant.user?.instagram;
    if (ig && ig.trim()) {
      list.push({ platform: "Instagram", icon: "logo-instagram", color: "#e1306c", url: ig });
    }

    const ln = socials.linkedin || applicant.linkedin || chefProfile.linkedin || applicant.linkedin_link || chefProfile.linkedin_link || applicant.user?.linkedin;
    if (ln && ln.trim() && ln !== "https://linkedin.com/") {
      list.push({ platform: "LinkedIn", icon: "logo-linkedin", color: "#0077b5", url: ln });
    }

    const fb = socials.facebook || applicant.facebook || chefProfile.facebook || applicant.facebook_link || chefProfile.facebook_link || applicant.user?.facebook;
    if (fb && fb.trim()) {
      list.push({ platform: "Facebook", icon: "logo-facebook", color: "#1877f2", url: fb });
    }

    const tw = socials.twitter || applicant.twitter || chefProfile.twitter || applicant.twitter_link || chefProfile.twitter_link || applicant.twitterLink || applicant.user?.twitter;
    if (tw && tw.trim()) {
      list.push({ platform: "Twitter", icon: "logo-twitter", color: "#000000", url: tw });
    }

    const yt = socials.youtube || applicant.youtube || chefProfile.youtube || applicant.youtube_link || chefProfile.youtube_link || applicant.user?.youtube;
    if (yt && yt.trim()) {
      list.push({ platform: "YouTube", icon: "logo-youtube", color: "#ff0000", url: yt });
    }

    return list;
  };

  const handleOpenSocialLink = (url) => {
    if (!url) return;
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = "https://" + fullUrl;
    }
    Linking.openURL(fullUrl).catch((err) => {
      CustomAlert.show(t("error", "Error"), "Could not open link: " + err.message);
    });
  };

  const matchScore = fetchedMatchScore;

  // Real profile photo URL mapping
  const avatarUri = applicant.profile_photo_path || applicant.profile_photo;
  const avatarSource = avatarUri
    ? { uri: getAbsoluteProfilePhotoUrl(avatarUri) }
    : { uri: getAvatarUrl(applicant.id || applicant.applicant_id) };

  const handleCall = () => {
    const phoneNumber = applicant.mobile_number;
    if (!phoneNumber) {
      CustomAlert.show(t("error", "Error"), t("mobileNumberNotAvailable", "Mobile number not available."));
      return;
    }

    CustomAlert.show(
      t("confirmCall", "Call Applicant?"),
      `${t("call", "Call")} ${displayName} at ${phoneNumber}?`,
      [
        {
          text: t("cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("call", "Call"),
          onPress: async () => {
            if (Platform.OS !== "web") {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            Linking.openURL(`tel:${phoneNumber}`)
              .then(() => {
                handleStatusUpdate("contacted", false);
              })
              .catch(() => {
                CustomAlert.show(t("callUnavailable", "Call unavailable"), t("dialerCouldNotBeOpened", "Dialer could not be opened."));
              });
          },
        },
      ]
    );
  };

  const handleStatusUpdate = async (status, showAlert = true) => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          status === "shortlisted"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      }
      setLocalStatus(status);
      await dispatch(
        updateApplicantStatus({
          applicationId: applicant.id || applicant.application_id,
          status,
        })
      ).unwrap();
      if (showAlert) {
        CustomAlert.show(t("success", "Success"), `${t("applicantStatusUpdatedTo", "Applicant status updated to:")} ${status}`);
      }
      dispatch(fetchEmployerDashboard());
    } catch (error) {
      console.error("Failed to update status:", error);
      setLocalStatus(applicant?.status);
      if (showAlert) {
        CustomAlert.show(t("error", "Error"), error || t("failedToUpdateStatus", "Failed to update status. Please try again."));
      }
    }
  };

  const handleReject = () => {
    CustomAlert.show(
      t("confirmReject", "Reject Applicant?"),
      t("rejectApplicantConfirmation", "Are you sure you want to reject this applicant? This action cannot be undone."),
      [
        {
          text: t("cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("reject", "Reject"),
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            handleStatusUpdate("rejected");
          },
        },
      ]
    );
  };

  const isShortlisted = localStatus?.toLowerCase() === "shortlisted";
  const isContacted = localStatus?.toLowerCase() === "contacted";
  const isRejected = localStatus?.toLowerCase() === "rejected";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={normalize(22)} color="#0a0504" />
        </TouchableOpacity>
        <View style={[styles.headerTextContainer, { alignItems: "center" }]}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]} numberOfLines={1}>{displayName}</Text>
          {Boolean(selectedJob?.title || displayRole) && (
            <Text style={[styles.headerSubtitle, { textAlign: "center" }]} numberOfLines={1}>
              {selectedJob?.title || displayRole}
            </Text>
          )}
        </View>
        <View style={{ width: normalize(22) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            {/* Avatar Column */}
            <View style={styles.avatarWrapper}>
              <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
              <View style={styles.onlineDot} />
            </View>

            {/* Center Information Column */}
            <View style={styles.headerCenterInfo}>
              {matchScore != null && matchScore >= 80 && (
                <View style={styles.topMatchBadge}>
                  <Ionicons name="star" size={normalize(11)} color="#7e22ce" style={{ marginRight: 3 }} />
                  <Text style={styles.topMatchText}>{t("topMatch", "Top Match")}</Text>
                </View>
              )}

              <Text style={styles.candidateName} numberOfLines={1}>{displayName}</Text>

              {Boolean(displayRole) && (
                <Text style={styles.candidateRole} numberOfLines={1}>{displayRole}</Text>
              )}

              {Boolean(displayProfileId) && (
                <TouchableOpacity
                  style={styles.profileIdRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    Clipboard.setString(displayProfileId);
                    CustomAlert.show(t("copied", "Copied"), t("profileIdCopied", "Profile ID copied to clipboard!"));
                  }}
                >
                  <Text style={styles.profileIdText}>{t("profileId", "Profile ID")}: {displayProfileId}</Text>
                  <Ionicons name="copy-outline" size={normalize(11)} color="#64748b" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}

              {/* Meta Row: Age & Gender */}
              {(Boolean(displayAge) || Boolean(displayGender)) && (
                <View style={styles.metaRow}>
                  {Boolean(displayAge) && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={normalize(12)} color="#64748b" />
                      <Text style={styles.metaText}>{displayAge}</Text>
                    </View>
                  )}
                  {Boolean(displayGender) && (
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={normalize(12)} color="#64748b" />
                      <Text style={styles.metaText}>{displayGender}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Right Match Circle Indicator */}
            {matchScore != null && (
              <View style={styles.matchCircleWrapper}>
                <CircularMatchProgress score={matchScore} size={normalize(56)} strokeWidth={3.5} />
                <View style={styles.matchCircleLabelRow}>
                  <Text style={styles.matchCircleLabel}>{t("match", "Match")}</Text>
                  <Ionicons name="information-circle-outline" size={normalize(11)} color="#64748b" style={{ marginLeft: 2 }} />
                </View>
              </View>
            )}
          </View>

          {/* Section Divider Line */}
          <View style={styles.headerDivider} />

          {/* Professional Details */}
          <Text style={styles.sectionHeaderTitle}>{t("professionalDetails", "Professional Details")}</Text>
          <View style={styles.dataRowsList}>
            {/* Current Location */}
            {Boolean(displayCity && displayCity !== "N/A") && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="location-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("currentLocation", "Current Location")}</Text>
                <Text style={styles.dataValueText}>{displayCity}</Text>
              </View>
            )}

            {/* Languages Spoken */}
            {getLanguagesList().length > 0 && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="chatbubbles-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("languagesSpoken", "Languages Spoken")}</Text>
                <Text style={styles.dataValueText} numberOfLines={2}>{getLanguagesList().join(", ")}</Text>
              </View>
            )}

            {/* Cuisine Specialization */}
            {getCuisinesList().length > 0 && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="restaurant-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("cuisineSpecialization", "Cuisine Specialization")}</Text>
                <Text style={styles.dataValueText} numberOfLines={2}>{getCuisinesList().join(", ")}</Text>
              </View>
            )}

            {/* Operational Expertise / Skills */}
            {getSkillsList().length > 0 && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="construct-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("operationalExpertise", "Operational Expertise")}</Text>
                <Text style={styles.dataValueText} numberOfLines={2}>
                  {getSkillsList().map((s) => (typeof s === "object" ? s.name : s)).join(", ")}
                </Text>
              </View>
            )}

            {/* Years of Experience */}
            {Boolean(displayExperience && displayExperience !== "N/A" && displayExperience !== "0" && displayExperience !== "0 Years") && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="briefcase-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("yearsOfExperience", "Years of Experience")}</Text>
                <Text style={styles.dataValueText}>{displayExperience}</Text>
              </View>
            )}

            {/* Regional Experience */}
            {getRegionalList().length > 0 && getRegionalList().join(", ") !== "N/A" && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="earth-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("regionalExperience", "Regional Experience")}</Text>
                <Text style={styles.dataValueText} numberOfLines={2}>{getRegionalList().join(", ")}</Text>
              </View>
            )}

            {/* Overseas Experience */}
            {Boolean(displayOverseasExp && displayOverseasExp !== "N/A") && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="airplane-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("overseasWorkExperience", "Overseas Experience")}</Text>
                <Text style={styles.dataValueText}>{displayOverseasExp}</Text>
              </View>
            )}

            {/* Job Location Preference */}
            {Boolean(displayPrefLocation && displayPrefLocation !== "N/A") && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="compass-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("jobLocationPref", "Job Location Preference")}</Text>
                <Text style={styles.dataValueText}>
                  {displayPrefLocation === "Both" || displayPrefLocation === "Both (India & Overseas)"
                    ? t("indiaAndOverseas", "India & Overseas")
                    : displayPrefLocation}
                </Text>
              </View>
            )}

            {/* Employment Preference */}
            {Boolean(displayEmpType && displayEmpType !== "N/A") && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="briefcase-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("employmentPreference", "Employment Preference")}</Text>
                <View style={styles.purplePillBadge}>
                  <Text style={styles.purplePillText}>{displayEmpType}</Text>
                </View>
              </View>
            )}

            {/* Availability */}
            {Boolean(displayAvailability) && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="time-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("availability", "Availability")}</Text>
                <View style={styles.greenPillBadge}>
                  <Text style={styles.greenPillText}>{displayAvailability}</Text>
                </View>
              </View>
            )}

            {/* Preferred Call Time */}
            {Boolean(preferredCallTime && preferredCallTime !== "N/A") && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="call-outline" size={normalize(16)} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("preferredCallTime", "Preferred Call Time")}</Text>
                <Text style={styles.dataValueText}>{preferredCallTime}</Text>
              </View>
            )}
          </View>

          {/* About Section */}
          {Boolean(displayBio) && (
            <>
              <View style={styles.headerDivider} />
              <Text style={styles.sectionHeaderTitle}>{t("about", "About")}</Text>
              <View style={[styles.dataRow, { flexDirection: "column", alignItems: "flex-start", borderBottomWidth: 0, gap: 4, marginTop: 4 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="person-outline" size={normalize(16)} color="#153e69" />
                  <Text style={styles.dataLabel}>{t("bio", "Bio")}</Text>
                </View>
                <Text style={[styles.dataValueText, { textAlign: "left", maxWidth: "100%", marginTop: 4, fontWeight: "500", color: "#334155", lineHeight: 20 }]}>
                  {displayBio}
                </Text>
              </View>
            </>
          )}

          {/* Connect & Links Section */}
          {getActiveSocials().length > 0 && (
            <>
              <View style={styles.headerDivider} />
              <Text style={styles.sectionHeaderTitle}>{t("connectAndLinks", "Connect & Links")}</Text>
              <View style={styles.dataRowsList}>
                {getActiveSocials().map((soc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.dataRow}
                    activeOpacity={0.7}
                    onPress={() => handleOpenSocialLink(soc.url)}
                  >
                    <View style={styles.dataIconCol}>
                      <Ionicons name={soc.icon} size={normalize(16)} color="#153e69" />
                    </View>
                    <Text style={styles.dataLabel}>{soc.platform}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
                      <Text style={[styles.dataValueText, { color: "#4f46e5", textDecorationLine: "underline" }]} numberOfLines={1}>
                        {soc.url.replace(/^https?:\/\//i, "")}
                      </Text>
                      <Ionicons name="open-outline" size={normalize(13)} color="#4f46e5" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={styles.stickyFooter}>
        {/* Call Button (Hidden when applicant is rejected) */}
        {!isRejected && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnCall]}
            onPress={handleCall}
            activeOpacity={0.75}
          >
            <Ionicons name="call" size={normalize(18)} color="#ffffff" />
            <Text style={styles.btnCallText}>{t("call", "Call")}</Text>
          </TouchableOpacity>
        )}

        {/* Reject Button */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.btnReject, isRejected && styles.btnDisabled]}
          onPress={handleReject}
          activeOpacity={0.75}
          disabled={isRejected}
        >
          <Ionicons name="close-circle" size={normalize(18)} color="#dc2626" />
          <Text style={styles.btnRejectText}>
            {isRejected ? t("rejected", "Rejected") : t("reject", "Reject")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: normalize(14),
    color: "#dc2626",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  backButton: {
    marginRight: normalize(10),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0a0504",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(12),
    paddingBottom: normalize(110),
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(18),
    padding: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: normalize(14),
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: normalize(10),
  },
  avatarImage: {
    width: normalize(68),
    height: normalize(68),
    borderRadius: normalize(34),
    backgroundColor: "#f8fafc",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: normalize(13),
    height: normalize(13),
    borderRadius: normalize(6.5),
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  headerCenterInfo: {
    flex: 1,
    paddingRight: normalize(4),
  },
  topMatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  topMatchText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#7e22ce",
  },
  candidateName: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  candidateRole: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#4f46e5",
    marginVertical: 2,
  },
  profileIdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  profileIdText: {
    fontSize: normalize(10.5),
    fontWeight: "600",
    color: "#64748b",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#475569",
  },
  matchCircleWrapper: {
    alignItems: "center",
  },
  matchCircleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  matchCircleLabel: {
    fontSize: normalize(10.5),
    fontWeight: "600",
    color: "#64748b",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: normalize(12),
  },
  sectionHeaderTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(10),
  },
  dataRowsList: {
    gap: normalize(8),
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dataIconCol: {
    width: normalize(24),
    alignItems: "center",
    justifyContent: "center",
  },
  dataLabel: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#64748b",
    flex: 1,
    marginLeft: normalize(4),
  },
  dataValueText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "right",
    maxWidth: "52%",
  },
  purplePillBadge: {
    backgroundColor: "#f3e8ff",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: 6,
  },
  purplePillText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#7e22ce",
  },
  greenPillBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: 6,
  },
  greenPillText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#16a34a",
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(14),
    paddingTop: normalize(10),
    paddingBottom: Platform.OS === "ios" ? normalize(26) : normalize(12),
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    gap: normalize(8),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  actionBtn: {
    flex: 1,
    height: normalize(44),
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnShortlist: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  btnShortlistText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#153e69",
  },
  btnCall: {
    backgroundColor: "#153e69",
  },
  btnCallText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#ffffff",
  },
  btnReject: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  btnRejectText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#dc2626",
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
