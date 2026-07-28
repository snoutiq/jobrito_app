import React from "react";
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import MatchBadge from "./MatchBadge";
import ApplicantPreview from "./ApplicantPreview";

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

export default function SwipeCard({
  applicant,
  myIndex,
  activeIndex,
  swipeProgress,
  translateX,
  translateY,
  onSwipeComplete,
  onPressDetails,
  swipeEnabled = true,
}) {
  const { t } = useTranslation();
  const isTopCard = myIndex === activeIndex;

  const displayName = applicant.name || t("nameNotSpecified", "Name not specified");
  const displayBio = applicant.bio || "";
  
  // Availability status mapping
  const displayCallback = applicant.availability_status
    ? `${applicant.is_available !== false && !applicant.availability_status.toLowerCase().includes("not") ? "🟢" : "🔴"} ${applicant.availability_status}`
    : "";
  
  // Calculate relative applied hours / time
  const getAppliedTimeText = () => {
    if (applicant.applied_date && applicant.applied_time) {
      return `${t("applied", "Applied")} ${applicant.applied_date} • ${applicant.applied_time}`;
    }
    if (applicant.applied_date_time) {
      return `${t("applied", "Applied")} ${applicant.applied_date_time}`;
    }
    if (applicant.applied_time_ago) {
      return `${t("applied", "Applied")} ${applicant.applied_time_ago}`;
    }
    if (applicant.applied_date) {
      return `${t("applied", "Applied")} ${applicant.applied_date}`;
    }
    return t("appliedRecently", "Applied recently");
  };
  const appliedTimeText = getAppliedTimeText();

  // Load API profile_photo_path, else use fallback
  const avatarUri = applicant.profile_photo_path || applicant.profile_photo;
  const avatarSource = avatarUri ? { uri: avatarUri } : { uri: getAvatarUrl(applicant.id || applicant.applicant_id) };

  // Match score rating (no random generation, hide completely if missing)
  const matchScore = applicant.match_score || applicant.match?.score;

  // Pan gesture setup with minDistance to prevent tap gesture collision
  const panGesture = Gesture.Pan()
    .minDistance(10)
    .enabled(isTopCard && swipeEnabled)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      swipeProgress.value = Math.min(Math.abs(event.translationX) / SWIPE_THRESHOLD, 1);
    })
    .onEnd((event) => {
      const velocityX = event.velocityX;
      const dragX = event.translationX;

      // Spring physics configuration for snappy momentum
      const springConfig = {
        damping: 15,
        stiffness: 110,
        mass: 0.8,
      };

      if (dragX > SWIPE_THRESHOLD || velocityX > 750) {
        // Swipe Right (Accept)
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, { ...springConfig, velocity: velocityX }, () => {
          runOnJS(onSwipeComplete)("right", applicant);
        });
        swipeProgress.value = withSpring(1, springConfig);
      } else if (dragX < -SWIPE_THRESHOLD || velocityX < -750) {
        // Swipe Left (Reject)
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { ...springConfig, velocity: velocityX }, () => {
          runOnJS(onSwipeComplete)("left", applicant);
        });
        swipeProgress.value = withSpring(1, springConfig);
      } else {
        // Snap back to center with realistic physics
        translateX.value = withSpring(0, { damping: 16, stiffness: 130, mass: 0.8 });
        translateY.value = withSpring(0, { damping: 16, stiffness: 130, mass: 0.8 });
        swipeProgress.value = withSpring(0, { damping: 16, stiffness: 130, mass: 0.8 });
      }
    });

  // Animated styles for physical card interaction
  const animatedCardStyle = useAnimatedStyle(() => {
    if (isTopCard) {
      const rotate = interpolate(
        translateX.value,
        [-SCREEN_WIDTH, SCREEN_WIDTH],
        [-15, 15],
        Extrapolate.CLAMP
      );

      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate}deg` },
        ],
        zIndex: 10,
        opacity: 1,
      };
    }

    // Background card animations (Top card: 100%, Second: 96% TranslateY 14, Third: 92% TranslateY 28)
    const isSecond = myIndex === activeIndex + 1;
    const isThird = myIndex === activeIndex + 2;

    const scale = interpolate(
      swipeProgress.value,
      [0, 1],
      [isSecond ? 0.96 : isThird ? 0.92 : 0.88, isSecond ? 1.0 : isThird ? 0.96 : 0.92],
      Extrapolate.CLAMP
    );

    const translateYOffset = interpolate(
      swipeProgress.value,
      [0, 1],
      [isSecond ? 14 : isThird ? 28 : 42, isSecond ? 0 : isThird ? 14 : 28],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      swipeProgress.value,
      [0, 1],
      [isSecond ? 0.95 : isThird ? 0.80 : 0, isSecond ? 1.0 : isThird ? 0.95 : 0.80],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale },
        { translateY: translateYOffset },
      ],
      opacity,
      zIndex: isSecond ? 5 : 1,
    };
  });

  // Tinder Swipe Overlay Styles
  const likeLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, 80], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const nopeLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-80, 0], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });

  const handleQuickReject = () => {
    if (!isTopCard) return;
    translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 12 }, () => {
      runOnJS(onSwipeComplete)("left", applicant);
    });
    swipeProgress.value = withSpring(1);
  };

  const displayStatus = applicant.status ? applicant.status.toUpperCase() : "";

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        {/* Tinder Swipe Overlay Labels */}
        {isTopCard && (
          <>
            <Animated.View style={[styles.likeLabelContainer, likeLabelStyle]}>
              <Text style={styles.likeLabelText}>{t("shortlistCaps", "SHORTLIST")}</Text>
            </Animated.View>
            <Animated.View style={[styles.nopeLabelContainer, nopeLabelStyle]}>
              <Text style={styles.nopeLabelText}>{t("rejectCaps", "REJECT")}</Text>
            </Animated.View>
          </>
        )}

        {/* Header Badges */}
        <View style={styles.cardHeader}>
          {displayStatus ? (
            <View style={[
              styles.newBadge,
              displayStatus === "SHORTLISTED" && styles.shortlistedBadge,
              displayStatus === "CONTACTED" && styles.contactedBadge,
              displayStatus === "REJECTED" && styles.rejectedBadge
            ]}>
              <Text style={styles.newBadgeText}>{displayStatus}</Text>
            </View>
          ) : (
            <View />
          )}
          {isTopCard && (
            <TouchableOpacity onPress={handleQuickReject} activeOpacity={0.7} style={styles.closeCardBtn}>
              <Ionicons name="close" size={16} color="rgba(10, 5, 4, 0.45)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Card Body (Centered avatar layout with overlapping MatchBadge) */}
        <View style={styles.profileSection}>
          <Image source={avatarSource} style={styles.avatar} />
          {matchScore ? <MatchBadge score={matchScore} style={styles.matchBadge} /> : <View style={styles.matchPlaceholder} />}
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.appliedTime}>{appliedTimeText}</Text>
        </View>

        {/* Applicant Details Checklist */}
        <ApplicantPreview applicant={applicant} />

        {/* About/Bio Section (Clean typography, no borders) */}
        {displayBio ? (
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutLabel}>{t("about", "About")}</Text>
            <Text style={styles.bioText} numberOfLines={4}>
              {displayBio}
            </Text>
          </View>
        ) : null}

        {/* Bottom Accept / View Profile Button with solid color matching the app */}
        <TouchableOpacity
          onPress={() => onPressDetails(applicant)}
          activeOpacity={0.85}
          style={styles.acceptButton}
        >
          <Text style={styles.acceptButtonText}>{t("reviewAndAccept", "Review & Accept")}</Text>
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: IS_SMALL_DEVICE ? 20 : 24,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.05)",
    // Soft IOS shadows
    shadowColor: "rgba(10, 5, 4, 0.1)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    // Android Shadow
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 28,
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: "#153e69",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  shortlistedBadge: {
    backgroundColor: "#4CAF50",
  },
  contactedBadge: {
    backgroundColor: "#f2c879",
  },
  rejectedBadge: {
    backgroundColor: "#f57f20",
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  closeCardBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(10, 5, 4, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 4,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#f2f2f3",
    borderWidth: 3,
    borderColor: "#ffffff",
    // Soft Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  matchBadge: {
    marginTop: -16,
    marginBottom: 4,
    backgroundColor: "#ffffff",
    shadowColor: "rgba(0,0,0,0.04)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  matchPlaceholder: {
    height: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0a0504",
    textAlign: "center",
    marginTop: 6,
  },
  appliedTime: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.45)",
    fontWeight: "600",
    marginTop: 2,
  },
  aboutContainer: {
    marginVertical: 12,
  },
  aboutLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.35)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.65)",
    lineHeight: 18,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#153e69",
    height: 52,
    borderRadius: 26,
    gap: 8,
    marginTop: 8,
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
});
