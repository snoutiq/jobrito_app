import React, { useMemo } from "react";
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, Platform, Linking, PixelRatio } from "react-native";
import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from 'expo-haptics'; // Import Haptics
import MatchBadge from "./MatchBadge";
import ApplicantPreview from "./ApplicantPreview";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

// High quality hospitality worker avatars
const AVATARS = [""];

export const getAvatarUrl = (id) => {
  const index = Math.abs(parseInt(id) || 0) % AVATARS.length;
  return AVATARS[index];
};

export const getAbsoluteProfilePhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  let cleanPath = path;
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.substring(1);
  }
  if (cleanPath.startsWith("backend/storage/")) {
    return `http://178.16.138.159/${cleanPath}`;
  }
  if (cleanPath.startsWith("storage/")) {
    return `http://178.16.138.159/backend/${cleanPath}`;
  }
  return `http://178.16.138.159/backend/storage/${cleanPath}`;
};

const CircularMatchProgress = ({ score = 92, size = 58, strokeWidth = 3.5 }) => {
  const normalizedScore = Math.min(Math.max(Number(score) || 0, 0), 100);
  const angle = (normalizedScore / 100) * 360;

  // Dynamic progress color based on score
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
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#0f172a" }}>
        {normalizedScore}%
      </Text>
    </View>
  );
};

export default React.memo(function SwipeCard({
  applicant = {},
  myIndex,
  activeIndex,
  swipeProgress,
  translateX,
  translateY,
  onSwipeComplete,
  onPressDetails,
  swipeEnabled = true,
  onUndo,
  canUndo = false,
  hasNext = true,
}) {
  const { t } = useTranslation();
  const isTopCard = myIndex === activeIndex;

  const chefProfile = applicant.chef_profile || applicant.chef_profile_details || applicant.user?.chef_profile || {};
  const availabilityInfo = chefProfile.availability_info || {};

  const displayName = applicant.name || applicant.full_name || applicant.user?.name || applicant.user?.full_name || t("nameNotSpecified", "Name not specified");
  const displayBio = applicant.bio || chefProfile.bio || applicant.user?.bio || "";
  
  const displayCity = applicant.city || applicant.user?.city || "";
  const displayPrefLocation = availabilityInfo.location_preference || applicant.locationPreference || applicant.location_preference || applicant.user?.location_preference || "";
  const displayExperience = applicant.experience_range || applicant.experience_years || applicant.experience || applicant.user?.experience_range || applicant.user?.experience_years || "";
  const displayCalendly = applicant.calendly_link || chefProfile.calendly_link || applicant.user?.calendly_link || "";

  const getSkillsList = () => {
    const list = applicant.skills || applicant.user?.skills || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getCuisinesList = () => {
    const list = applicant.cuisine_specialty || applicant.specialties || chefProfile.cuisine_specialty || applicant.user?.cuisine_specialty || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getRegionalList = () => {
    const list = availabilityInfo.regional_experience || applicant.regional_experience || applicant.user?.regional_experience || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getLanguagesList = () => {
    const list = availabilityInfo.languages || applicant.languages || applicant.user?.languages || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getAvailabilityStatus = () => {
    const isChef = !!(
      applicant.chef_profile ||
      applicant.chef_profile_details ||
      applicant.role?.toLowerCase() === "chef" ||
      applicant.user?.role?.toLowerCase() === "chef"
    );
    const isJobSeeker =
      !isChef ||
      applicant.role?.toLowerCase() === "job_seeker" ||
      applicant.role?.toLowerCase() === "talent" ||
      applicant.user?.role?.toLowerCase() === "job_seeker" ||
      applicant.user?.role?.toLowerCase() === "talent" ||
      applicant.user_type === "job_seeker";

    if (isJobSeeker) return "";

    return availabilityInfo.availability_status || applicant.availability_status || applicant.user?.availability_status || "";
  };

  const rawAvailStatus = String(getAvailabilityStatus()).trim();
  const isAvailableStatus =
    rawAvailStatus.toLowerCase().includes("available") &&
    !rawAvailStatus.toLowerCase().includes("not") &&
    !rawAvailStatus.toLowerCase().includes("un") &&
    !rawAvailStatus.toLowerCase().includes("employed");

  const displayAvailability = isAvailableStatus
    ? `🟢 ${rawAvailStatus}`
    : rawAvailStatus && rawAvailStatus !== "N/A"
      ? rawAvailStatus
      : "N/A";
  
  const getActiveSocials = () => {
    const list = [];
    const socials = applicant.socials || chefProfile.socials || applicant.user?.socials || {};
    
    const ln = socials.linkedin || applicant.linkedin || chefProfile.linkedin || applicant.linkedin_link || chefProfile.linkedin_link || applicant.user?.linkedin;
    if (ln && ln.trim() && ln !== "https://linkedin.com/") {
      list.push({ platform: "LinkedIn", icon: "logo-linkedin", color: "#0077b5", bgColor: "rgba(0, 119, 181, 0.1)", url: ln });
    }
    
    const ig = socials.instagram || applicant.instagram || chefProfile.instagram || applicant.instagram_link || chefProfile.instagram_link || applicant.user?.instagram;
    if (ig && ig.trim()) {
      list.push({ platform: "Instagram", icon: "logo-instagram", color: "#e1306c", bgColor: "rgba(225, 48, 108, 0.1)", url: ig });
    }
    
    const fb = socials.facebook || applicant.facebook || chefProfile.facebook || applicant.facebook_link || chefProfile.facebook_link || applicant.user?.facebook;
    if (fb && fb.trim()) {
      list.push({ platform: "Facebook", icon: "logo-facebook", color: "#1877f2", bgColor: "rgba(24, 119, 242, 0.1)", url: fb });
    }
    
    const tw = socials.twitter || applicant.twitter || chefProfile.twitter || applicant.twitter_link || chefProfile.twitter_link || applicant.twitterLink || applicant.user?.twitter;
    if (tw && tw.trim()) {
      list.push({ platform: "Twitter", icon: "logo-twitter", color: "#000000", bgColor: "rgba(10, 5, 4, 0.06)", url: tw });
    }
    
    const yt = socials.youtube || applicant.youtube || chefProfile.youtube || applicant.youtube_link || chefProfile.youtube_link || applicant.user?.youtube;
    if (yt && yt.trim()) {
      list.push({ platform: "YouTube", icon: "logo-youtube", color: "#ff0000", bgColor: "rgba(255, 0, 0, 0.08)", url: yt });
    }
    
    const web = socials.website || applicant.website || chefProfile.website || applicant.portfolio || applicant.user?.website;
    if (web && web.trim()) {
      list.push({ platform: "Website", icon: "globe-outline", color: "#153e69", bgColor: "rgba(21, 62, 105, 0.08)", url: web });
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
  
  // Preferred call time mapping for "Can interview" footer
  const preferredCallTime = applicant.preferred_call_time || applicant.user?.preferred_call_time || "";
  const displayCallback = preferredCallTime ? preferredCallTime.trim() : "";
  
  // Calculate relative applied hours / time
  const getAppliedTimeText = () => {
    if (applicant.applied_date && applicant.applied_time) {
      return `${applicant.applied_date} • ${applicant.applied_time}`;
    }
    if (applicant.applied_date_time) {
      return `${applicant.applied_date_time}`;
    }
    if (applicant.applied_time_ago) {
      return `${applicant.applied_time_ago}`;
    }
    if (applicant.applied_date) {
      return `${applicant.applied_date}`;
    }
    return t("appliedRecently", "Applied recently");
  };
  const appliedTimeText = getAppliedTimeText();

  // Load API profile_photo_path, else use fallback
  const avatarUri = applicant?.profile_photo_path || applicant?.profile_photo || applicant?.photo_url || applicant?.avatar || applicant?.avatar_url || applicant?.user?.profile_photo_path || applicant?.user?.profile_photo;

  // Match score rating (from API or prop)
  const matchScore =
    applicant?.matchScore ??
    applicant?.match_percentage ??
    applicant?.match_score ??
    applicant?.score ??
    applicant?.match?.score;

  // Pan gesture setup: horizontal image slider style (left drag = next applicant, right drag = previous applicant / undo)
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])        // activate after 8px horizontal move
        .failOffsetY([-15, 15])         // fail (give control to ScrollView) if vertical > 15px
        .enabled(isTopCard && swipeEnabled)
        .onUpdate((event) => {
          const tx = event.translationX;
          // When on first card (canUndo = false) and dragging right -> rubber-band resistance
          if (tx > 0 && !canUndo) {
            translateX.value = tx * 0.15;
            swipeProgress.value = 0;
          }
          // When on last card (hasNext = false) and dragging left -> rubber-band resistance
          else if (tx < 0 && !hasNext) {
            translateX.value = tx * 0.15;
            swipeProgress.value = 0;
          }
          // Normal drag
          else {
            translateX.value = tx;
            swipeProgress.value = Math.min(Math.abs(tx) / SWIPE_THRESHOLD, 1);
          }
          translateY.value = 0;
        })
        .onEnd((event) => {
          const velocityX = event.velocityX;
          const dragX = event.translationX;

          // 1. Swipe Left → Go to Next Applicant (only if hasNext)
          if ((dragX < -SWIPE_THRESHOLD || velocityX < -600) && hasNext) {
            // Sync exit + entry duration so they finish together (no white gap).
            const totalExitDist = SCREEN_WIDTH * 1.1;
            const alreadyTravelled = Math.min(Math.abs(dragX), totalExitDist);
            const fraction = alreadyTravelled / totalExitDist;           // 0..1
            const duration = Math.round(300 * (1 - fraction * 0.85));    // min ~45ms, max 300ms
            const safeDuration = Math.max(120, Math.min(300, duration));

            translateX.value = withTiming(
              -SCREEN_WIDTH * 1.1,
              { duration: safeDuration, easing: Easing.out(Easing.quad) },
              () => {
                if (onSwipeComplete) {
                  runOnJS(onSwipeComplete)("left", applicant);
                }
              }
            );
            // Entry animation uses SAME duration → exit & entry stay in sync
            swipeProgress.value = withTiming(1, { duration: safeDuration, easing: Easing.out(Easing.quad) });
            if (Platform.OS !== "web") {
              runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            }
          }
          // 2. Swipe Right → Go to Previous Applicant (Undo) (only if canUndo)
          else if ((dragX > SWIPE_THRESHOLD || velocityX > 600) && canUndo) {
            const totalExitDist = SCREEN_WIDTH * 1.1;
            const alreadyTravelled = Math.min(Math.abs(dragX), totalExitDist);
            const fraction = alreadyTravelled / totalExitDist;
            const safeDuration = Math.max(120, Math.min(300, Math.round(300 * (1 - fraction * 0.85))));

            translateX.value = withTiming(
              SCREEN_WIDTH * 1.1,
              { duration: safeDuration, easing: Easing.out(Easing.quad) },
              () => {
                if (onUndo) {
                  runOnJS(onUndo)();
                }
              }
            );
            swipeProgress.value = withTiming(1, { duration: safeDuration, easing: Easing.out(Easing.quad) });
            if (Platform.OS !== "web") {
              runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            }
          }
          // 3. Cancel / Snap back to center smoothly
          else {
            translateX.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.7 });
            translateY.value = 0;
            swipeProgress.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.7 });
          }
        }),
    [isTopCard, swipeEnabled, canUndo, hasNext, applicant, onSwipeComplete, onUndo]
  );

  // Animated styles for clean horizontal Image Slider interaction
  const animatedCardStyle = useAnimatedStyle(() => {
    if (isTopCard) {
      return {
        transform: [
          { translateX: translateX.value },
        ],
        zIndex: 10,
        opacity: 1,
      };
    }

    const isSecond = myIndex === activeIndex + 1;

    if (isSecond) {
      const nextX = interpolate(
        swipeProgress.value,
        [0, 1],
        [SCREEN_WIDTH - 84, 0], // Slides in smoothly from right off-screen like an image slider
        Extrapolate.CLAMP
      );
      const opacity = interpolate(
        swipeProgress.value,
        [0, 0.05, 1],
        [0, 1, 1],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ translateX: nextX }],
        opacity,
        zIndex: 5,
      };
    }

    return {
      opacity: 0,
      zIndex: 1,
    };
  });
  
  const handleQuickReject = () => {
    if (!isTopCard) return;
    translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 12 }, () => {
      runOnJS(onSwipeComplete)("left", applicant);
    });
    swipeProgress.value = withSpring(1);
  };

  const displayStatus = applicant?.status ? applicant.status.toUpperCase() : "";
  const displayRole = applicant?.preferred_role || applicant?.preference || applicant?.role || applicant?.category || applicant?.chef_profile?.preferred_role || applicant?.user?.preferred_role || "";
  const displayEmployer = applicant?.current_employer || applicant?.past_employer || applicant?.employer || chefProfile?.current_employer || applicant?.user?.current_employer || "";
  const displayAge = applicant?.age ? `${applicant.age} Years` : "";
  const displayGender = applicant?.gender || applicant?.user?.gender || chefProfile?.gender || "";
  const getEmploymentTypeString = () => {
    const raw =
      applicant?.job_type ||
      applicant?.employment_type ||
      (Array.isArray(applicant?.employment_preference) && applicant.employment_preference.length > 0
        ? applicant.employment_preference.join(", ")
        : typeof applicant?.employment_preference === "string"
        ? applicant.employment_preference
        : "") ||
      (Array.isArray(availabilityInfo?.employment_preference) && availabilityInfo.employment_preference.length > 0
        ? availabilityInfo.employment_preference.join(", ")
        : typeof availabilityInfo?.employment_preference === "string"
        ? availabilityInfo.employment_preference
        : "") ||
      (Array.isArray(chefProfile?.employment_preference) && chefProfile.employment_preference.length > 0
        ? chefProfile.employment_preference.join(", ")
        : typeof chefProfile?.employment_preference === "string"
        ? chefProfile.employment_preference
        : "") ||
      applicant?.user?.employment_type ||
      "";
    return typeof raw === "string" && raw.trim() && raw.trim() !== "N/A" ? raw.trim() : "";
  };
  const displayEmploymentType = getEmploymentTypeString();
  const displayOverseasExp = applicant?.overseas_experience || applicant?.past_overseas_experience || applicant?.overseas_work_experience || (getRegionalList().length > 0 ? "Yes" : "");
  const displayLocationPref = availabilityInfo?.location_preference || applicant?.location_preference || applicant?.locationPreference || applicant?.preferred_location || "";
  const displayBusinessType = applicant?.business_type || applicant?.business_types || (getCuisinesList().length > 0 ? getCuisinesList().slice(0, 3).join(", ") : "");

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardScrollContent}
        >
          {/* Header Card Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerTopRow}>
              {/* Avatar Photo with Online Indicator Dot */}
              <View style={styles.avatarWrapper}>
                {avatarUri ? (
                  <Image source={{ uri: getAbsoluteProfilePhotoUrl(avatarUri) }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.noAvatarBox}>
                    <Ionicons name="person" size={32} color="#cbd5e1" />
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>

              {/* Center Profile Details */}
              <View style={styles.headerCenterInfo}>
                {/* <View style={styles.topMatchBadge}>
                  <Ionicons name="star" size={11} color="#7e22ce" style={{ marginRight: 4 }} />
                  <Text style={styles.topMatchText}>{t("topMatch", "Top Match")}</Text>
                </View> */}

                <Text style={styles.candidateName} numberOfLines={1}>
                  {displayName}
                </Text>

                {displayRole ? (
                  <Text style={styles.candidateRole} numberOfLines={2}>
                    {displayRole}
                  </Text>
                ) : null}

                {(displayAge || displayGender) ? (
                  <View style={styles.metaRow}>
                    {displayAge ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color="#64748b" />
                        <Text style={styles.metaText}>{displayAge}</Text>
                      </View>
                    ) : null}
                    {displayGender ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={13} color="#64748b" />
                        <Text style={styles.metaText}>{displayGender}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {/* Right Match Circle Indicator */}
              {matchScore != null && (
                <View style={styles.matchCircleWrapper}>
                  <CircularMatchProgress score={matchScore} size={58} strokeWidth={3.5} />
                  <View style={styles.matchCircleLabelRow}>
                    <Text style={styles.matchCircleLabel}>{t("match", "Match")}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Section Divider Line */}
          <View style={styles.headerDivider} />

          {/* Structured Data Rows List (Dynamic Real Data Only) */}
          <View style={styles.dataRowsList}>
            {/* 1. Experience */}
            {displayExperience && displayExperience !== "N/A" ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="briefcase-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("experience", "Experience")}</Text>
                <Text style={styles.dataValueText}>{displayExperience}</Text>
              </View>
            ) : null}

            {/* 2. Past Employer */}
            {displayEmployer && displayEmployer !== "N/A" ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="business-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("pastEmployer", "Past Employer")}</Text>
                <Text style={styles.dataValueText} numberOfLines={1}>{displayEmployer}</Text>
              </View>
            ) : null}

            {/* 3. Employment Type */}
            {Boolean(displayEmploymentType) ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="bag-handle-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("employmentType", "Employment Type")}</Text>
                <View style={styles.purplePillBadge}>
                  <Text style={styles.purplePillText}>{displayEmploymentType}</Text>
                </View>
              </View>
            ) : null}

            {/* 4. Past Overseas Experience */}
            {displayOverseasExp && displayOverseasExp !== "N/A" ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="airplane-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("pastOverseasExp", "Past Overseas Experience")}</Text>
                {displayOverseasExp === "Yes" ? (
                  <View style={styles.greenPillBadge}>
                    <Text style={styles.greenPillText}>Yes</Text>
                  </View>
                ) : (
                  <View style={styles.grayPillBadge}>
                    <Text style={styles.grayPillText}>No</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* 5. Job Location Preference */}
            {displayLocationPref && displayLocationPref !== "N/A" ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="location-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("jobLocationPref", "Job Location Preference")}</Text>
                <Text style={styles.dataValueText}>{displayLocationPref}</Text>
              </View>
            ) : null}

            {/* 6. Business Type Interested In */}
            {displayBusinessType && displayBusinessType !== "N/A" ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="storefront-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("businessTypeInterestedIn", "Business Type Interested In")}</Text>
                <Text style={styles.dataValueText} numberOfLines={2}>{displayBusinessType}</Text>
              </View>
            ) : null}

            {/* 7. Job Role */}
            {displayRole && displayRole !== "N/A" ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="people-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("jobRole", "Job Role")}</Text>
                <Text style={styles.dataValueText}>{displayRole}</Text>
              </View>
            ) : null}

            {/* 8. Preferred Call Time */}
            {displayCallback ? (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="time-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("preferredCallTime", "Preferred Call Time")}</Text>
                <Text style={styles.dataValueText}>{displayCallback}</Text>
              </View>
            ) : null}

            {/* Cuisines (If present) */}
            {getCuisinesList().length > 0 && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="restaurant-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("cuisines", "Cuisines")}</Text>
                <Text style={styles.dataValueText} numberOfLines={2}>{getCuisinesList().join(", ")}</Text>
              </View>
            )}

            {/* Core Skills (If present) */}
            {getSkillsList().length > 0 && (
              <View style={styles.dataRow}>
                <View style={styles.dataIconCol}>
                  <Ionicons name="flash-outline" size={17} color="#153e69" />
                </View>
                <Text style={styles.dataLabel}>{t("skills", "Core Skills")}</Text>
                <Text style={styles.dataValueText} numberOfLines={2}>
                  {getSkillsList().map((s) => (typeof s === "object" ? s.name : s)).join(", ")}
                </Text>
              </View>
            )}

            {/* Professional Bio (If present) */}
            {displayBio ? (
              <View style={[styles.dataRow, { flexDirection: "column", alignItems: "flex-start", borderBottomWidth: 0, gap: 4, marginTop: 4 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="document-text-outline" size={17} color="#153e69" />
                  <Text style={styles.dataLabel}>{t("aboutMe", "Professional Bio")}</Text>
                </View>
                <Text style={[styles.dataValueText, { textAlign: "left", maxWidth: "100%", marginTop: 4, fontWeight: "500", color: "#475569" }]}>
                  {displayBio}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
});


const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },


  cardScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerSection: {
    marginBottom: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  avatarImg: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    borderWidth: 2,
    borderColor: "#f1f5f9",
  },
  noAvatarBox: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  headerCenterInfo: {
    flex: 1,
    paddingRight: 6,
  },
  topMatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  topMatchText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7e22ce",
  },
  candidateName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  candidateRole: {
    fontSize: 13.5,
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
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#475569",
  },
  matchCircleWrapper: {
    alignItems: "center",
  },
  matchCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3.5,
    borderColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  matchCircleNum: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  matchCircleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  matchCircleLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  dataRowsList: {
    gap: 2,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  dataIconCol: {
    width: 26,
    alignItems: "center",
  },
  dataLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
    color: "#475569",
    paddingRight: 8,
  },
  dataValueText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "right",
    maxWidth: "50%",
  },
  purplePillBadge: {
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  purplePillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#7e22ce",
  },
  greenPillBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  greenPillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#15803d",
  },
  grayPillText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748b",
  },
});
