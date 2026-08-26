import React, { useMemo } from "react";
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, Platform, ScrollView, Linking } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

// High quality hospitality worker avatars
const AVATARS = [
  "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=180&auto=format&fit=crop&q=80", // Male Chef
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=180&auto=format&fit=crop&q=80", // Female Chef
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=180&auto=format&fit=crop&q=80", // Chef
  "https://images.unsplash.com/photo-1595273670150-db0a3e368167?w=180&auto=format&fit=crop&q=80", // Male Waiter
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=180&auto=format&fit=crop&q=80", // Female Waitress
];

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

export default React.memo(function SwipeCard({
  applicant,
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

  // Stable refs to prevent gesture re-creation mid-drag
  const onSwipeCompleteRef = React.useRef(onSwipeComplete);
  onSwipeCompleteRef.current = onSwipeComplete;

  const onUndoRef = React.useRef(onUndo);
  onUndoRef.current = onUndo;

  const applicantRef = React.useRef(applicant);
  applicantRef.current = applicant;

  // Pan gesture setup: horizontal image slider style (left drag = next applicant, right drag = previous applicant / undo)
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .enabled(isTopCard && swipeEnabled)
        .onUpdate((event) => {
          // Allow full horizontal dragging in both left and right directions
          translateX.value = event.translationX;
          translateY.value = 0;
          swipeProgress.value = Math.min(Math.abs(event.translationX) / SWIPE_THRESHOLD, 1);
        })
        .onEnd((event) => {
          const velocityX = event.velocityX;
          const dragX = event.translationX;

          // 1. Swipe Left -> Go to Next Applicant
          if (dragX < -SWIPE_THRESHOLD || velocityX < -600) {
            translateX.value = withTiming(-SCREEN_WIDTH * 1.1, { duration: 300, easing: Easing.out(Easing.quad) }, () => {
              if (onSwipeCompleteRef.current) {
                runOnJS(onSwipeCompleteRef.current)("left", applicantRef.current);
              }
            });
            swipeProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
            if (Platform.OS !== "web") {
              runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            }
          }
          // 2. Swipe Right -> Go to Previous Applicant (Undo)
          else if ((dragX > SWIPE_THRESHOLD || velocityX > 600) && canUndo) {
            translateX.value = withTiming(SCREEN_WIDTH * 1.1, { duration: 300, easing: Easing.out(Easing.quad) }, () => {
              if (onUndoRef.current) {
                runOnJS(onUndoRef.current)();
              }
            });
            swipeProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
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
    [isTopCard, swipeEnabled, canUndo]
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

  // Animated styles for the swipe hint overlay
  const animatedHintStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1, 0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  // Tinder Swipe Overlay Styles
  const likeLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const nopeLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, 0], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });
  
  const handleQuickReject = () => {
    if (!isTopCard) return;
    translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 12 }, () => {
      runOnJS(onSwipeComplete)("left", applicant);
    });
    swipeProgress.value = withSpring(1);
  };

  const displayStatus = applicant?.status ? applicant.status.toUpperCase() : "";
  const displayRole = applicant?.preference || applicant?.preferred_role || applicant?.user?.preference || applicant?.user?.preferred_role || "";
  const localStatus = applicant?.status?.toLowerCase();
  const displayEmployer = applicant?.current_employer || applicant?.user?.current_employer || "";

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        {localStatus && (
          <View 
            style={[
              styles.statusBadge, 
              localStatus === 'shortlisted' && styles.statusBadgeShortlisted,
              localStatus === 'rejected' && styles.statusBadgeRejected,
              localStatus === 'contacted' && styles.statusBadgeContacted,
              (localStatus === 'new' || localStatus === 'pending') && styles.statusBadgeNew,
            ]}
          >
            <Ionicons 
              name={localStatus === 'shortlisted' ? 'heart' : localStatus === 'rejected' ? 'close-circle' : (localStatus === 'new' || localStatus === 'pending') ? 'sparkles' : 'call'} 
              size={12} 
              color="#ffffff" 
            />
            <Text style={styles.statusBadgeText}>
              {localStatus === 'new' ? 'New' : localStatus === 'pending' ? 'Pending' : localStatus.charAt(0).toUpperCase() + localStatus.slice(1)}
            </Text>
          </View>
        )}

        {/* Match Score Badge — top-left corner */}
        {matchScore != null && (
          <MatchBadge score={matchScore} style={styles.matchBadge} />
        )}

        {/* Scrollable Card Body showing essential details */}
        <View style={styles.cardScrollContent}>
          <View style={styles.cardHeaderSpacer} />

          {/* Core Profile Header Block */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.profileHeaderRow}>
              <View style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image source={{ uri: getAbsoluteProfilePhotoUrl(avatarUri) }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.noImageContainer}>
                    <Ionicons name="person-outline" size={24} color="rgba(10, 5, 4, 0.4)" />
                    <Text style={styles.noImageText}>{t("noImage", "No Image")}</Text>
                  </View>
                )}
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.chefName}>{displayName}</Text>
                {displayRole ? (
                  <Text style={styles.chefTitle}>{displayRole}</Text>
                ) : null}
                
                <View style={styles.profileDetailsList}>
                  {displayEmployer ? (
                    <Text numberOfLines={1} style={styles.detailRowText}>
                      <Text style={styles.profileInfoLabel}>Employer: </Text>
                      <Text style={styles.profileInfoValue}>{displayEmployer}</Text>
                    </Text>
                  ) : null}
                  {displayCity && displayCity !== "N/A" ? (
                    <Text numberOfLines={1} style={styles.detailRowText}>
                      <Text style={styles.profileInfoLabel}>Location: </Text>
                      <Text style={styles.profileInfoValue}>{displayCity}</Text>
                    </Text>
                  ) : null}
                  {displayPrefLocation && displayPrefLocation !== "N/A" ? (
                    <Text numberOfLines={1} style={styles.detailRowText}>
                      <Text style={styles.profileInfoLabel}>Pref Job: </Text>
                      <Text style={styles.profileInfoValue}>
                        {displayPrefLocation === "Both" || displayPrefLocation === "Both (India & Overseas)"
                          ? "India & Overseas"
                          : displayPrefLocation}
                      </Text>
                    </Text>
                  ) : null}
                  {displayExperience && displayExperience !== "N/A" && displayExperience !== "0" && displayExperience !== "0 Years" ? (
                    <Text numberOfLines={1} style={styles.detailRowText}>
                      <Text style={styles.profileInfoLabel}>Exp: </Text>
                      <Text style={styles.profileInfoValue}>{displayExperience}</Text>
                    </Text>
                  ) : null}
                  {getAvailabilityStatus() && getAvailabilityStatus() !== "N/A" ? (
                    <Text numberOfLines={1} style={styles.detailRowText}>
                      <Text style={styles.profileInfoLabel}>Availability: </Text>
                      <Text style={styles.profileInfoValue}>{displayAvailability}</Text>
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          {/* Section 1: Professional Bio */}
          {displayBio ? (
            <View style={styles.reviewCard}>
              <View style={styles.reviewSecTitleRow}>
                <Ionicons name="document-text" size={16} color="#153e69" />
                <Text style={styles.reviewSecTitle}>{t("aboutMe", "Professional Bio")}</Text>
              </View>
              <Text style={styles.reviewSecBioText}>{displayBio}</Text>
            </View>
          ) : null}

          {/* Section 2: Cuisines */}
          {getCuisinesList().length > 0 ? (
            <View style={styles.reviewCard}>
              <View style={styles.reviewSecTitleRow}>
                <Ionicons name="restaurant" size={16} color="#153e69" />
                <Text style={styles.reviewSecTitle}>{t("cuisineExpertise", "Cuisines")}</Text>
              </View>
              <View style={styles.reviewPillContainer}>
                {getCuisinesList().map((cuisine, idx) => (
                  <View key={idx} style={styles.reviewPill}>
                    <Text style={styles.reviewPillText}>{cuisine}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Section 3: Skills */}
          {getSkillsList().length > 0 ? (
            <View style={styles.reviewCard}>
              <View style={styles.reviewSecTitleRow}>
                <Ionicons name="flash" size={16} color="#153e69" />
                <Text style={styles.reviewSecTitle}>{t("skills", "Core Skills")}</Text>
              </View>
              <View style={styles.reviewPillContainer}>
                {getSkillsList().map((skill, idx) => {
                  const skillName = typeof skill === "object" ? skill.name : skill;
                  const skillLevel = typeof skill === "object" ? skill.level : null;
                  return (
                    <View key={idx} style={styles.reviewPill}>
                      <Text style={styles.reviewPillText}>
                        {skillName}{skillLevel ? ` (${skillLevel}%)` : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>

        {/* Footer Area Block (Availability time) */}
        {displayCallback ? (
          <View style={styles.cardFooter}>
            <View style={styles.timeSection}>
              <View style={styles.timeLeft}>
                <Text style={styles.canInterviewLabel}>{t("canInterview", "Can interview")}</Text>
                <Text style={styles.canInterviewValue} numberOfLines={1}>
                  {displayCallback}
                </Text>
              </View>
              <View style={styles.timeIconWrapper}>
                <Ionicons name="time" size={16} color="rgba(10, 5, 4, 0.45)" />
              </View>
            </View>
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: "100%",
    height: "100%", // Fixed height matching container to prevent overlapping
    backgroundColor: "#ffffff",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.05)",
    overflow: "hidden",
    // Soft IOS shadows
    shadowColor: "rgba(10, 5, 4, 0.1)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    // Android Shadow
    elevation: 3,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 18,
    gap: 5,
    zIndex: 10,
  },
  matchBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopLeftRadius: 26,
    borderBottomRightRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    borderWidth: 0,
    borderRadius: 0,
  },
  statusBadgeShortlisted: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeRejected: {
    backgroundColor: '#f57f20',
  },
  statusBadgeContacted: {
    backgroundColor: '#153e69',
  },
  statusBadgeNew: {
    backgroundColor: '#153e69',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardHeaderSpacer: {
    height: 18,
  },
  cardScroll: {
    maxHeight: SCREEN_HEIGHT * 0.58,
  },
  cardScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  profileHeaderCard: {
    paddingBottom: 4,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 66,
    height: 66,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#153e69",
    overflow: "hidden",
    backgroundColor: "#f2f2f3",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  noImageText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
    textAlign: "center",
  },
  profileInfo: {
    flex: 1,
  },
  chefName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  chefTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#153e69",
    marginBottom: 4,
  },
  profileDetailsList: {
    marginTop: 2,
    gap: 2,
  },
  detailRowText: {
    fontSize: 11,
    lineHeight: 14,
  },
  profileInfoLabel: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  profileInfoValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0a0504",
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f2f2f3",
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reviewSecTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewSecTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#153e69",
    marginLeft: 6,
  },
  reviewSecBioText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: 15,
  },
  reviewPillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  reviewPill: {
    backgroundColor: "rgba(21, 62, 105, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewPillText: {
    fontSize: 11,
    color: "#153e69",
    fontWeight: "600",
  },
  cardFooter: {
    backgroundColor: "rgba(10, 5, 4, 0.02)",
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 5, 4, 0.04)",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  timeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeLeft: {
    flex: 1,
  },
  canInterviewLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.35)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  canInterviewValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0504",
  },
  timeIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(10, 5, 4, 0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#153e69",
    height: 52,
    borderRadius: 26,
    gap: 8,
    shadowColor: "rgba(21, 62, 105, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  acceptButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  likeLabelContainer: {
    position: "absolute",
    top: IS_SMALL_DEVICE ? 36 : 48,
    left: 24,
    borderWidth: 3,
    borderColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    transform: [{ rotate: "-15deg" }],
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  likeLabelText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  nopeLabelContainer: {
    position: "absolute",
    top: IS_SMALL_DEVICE ? 36 : 48,
    right: 24,
    borderWidth: 3,
    borderColor: "#f57f20",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    transform: [{ rotate: "15deg" }],
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  nopeLabelText: {
    color: "#f57f20",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  calendlyBtn: {
    backgroundColor: "#f57f20",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  calendlyBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  socialIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
