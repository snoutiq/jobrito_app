import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import SwipeCard from "./SwipeCard";
import BottomActions from "./BottomActions";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;

export default function CardStack({
  applicants = [],
  onSwipe,
  onCall,
  onPressDetails,
}) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeProgress = useSharedValue(0);

  // Reset index when the list of applicants changes (e.g., filter is changed)
  useEffect(() => {
    setActiveIndex(0);
    translateX.value = 0;
    translateY.value = 0;
    swipeProgress.value = 0;
  }, [applicants]);

  const remainingCount = applicants.length - activeIndex;
  const hasApplicants = remainingCount > 0;
  const swipeEnabled = true;

  const handleSwipeComplete = (direction, swipedApplicant) => {
    // Notify parent to update Redux status
    if (onSwipe) {
      onSwipe(swipedApplicant, direction);
    }

    // Increment index to show the next card
    setActiveIndex((prev) => prev + 1);

    // Reset translation values instantly
    translateX.value = 0;
    translateY.value = 0;
    swipeProgress.value = 0;
  };

  const handleRejectPress = () => {
    if (!hasApplicants) return;
    const currentApplicant = applicants[activeIndex];
    
    translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 12 }, () => {
      runOnJS(handleSwipeComplete)("left", currentApplicant);
    });
    swipeProgress.value = withSpring(1);
  };

  const handleAcceptPress = () => {
    if (!hasApplicants) return;
    const currentApplicant = applicants[activeIndex];
    
    translateX.value = withSpring(SCREEN_WIDTH * 1.5, { damping: 12 }, () => {
      runOnJS(handleSwipeComplete)("right", currentApplicant);
    });
    swipeProgress.value = withSpring(1);
  };

  const handleCallPress = () => {
    if (hasApplicants && onCall) {
      onCall(applicants[activeIndex]);
    }
  };

  const handleDetailsPress = () => {
    if (hasApplicants && onPressDetails) {
      onPressDetails(applicants[activeIndex]);
    }
  };

  // Render the stacked cards (up to 3)
  const renderCards = () => {
    if (!hasApplicants) return null;

    // Show only up to 3 cards
    const visibleCards = [];
    const limit = Math.min(applicants.length, activeIndex + 3);

    // Always render visible cards within boundaries
    const renderLimit = limit;

    for (let i = renderLimit - 1; i >= activeIndex; i--) {
      const applicant = applicants[i];
      visibleCards.push(
        <SwipeCard
          key={applicant.id}
          applicant={applicant}
          myIndex={i}
          activeIndex={activeIndex}
          swipeProgress={swipeProgress}
          translateX={translateX}
          translateY={translateY}
          onSwipeComplete={handleSwipeComplete}
          onPressDetails={handleDetailsPress}
          swipeEnabled={swipeEnabled}
        />
      );
    }

    return visibleCards;
  };

  if (!hasApplicants) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="sparkles" size={48} color="#153e69" />
        </View>
        <Text style={styles.emptyTitle}>{t("allCaughtUp", "All Caught Up!")}</Text>
        <Text style={styles.emptySubtitle}>
          {t("noApplicantsText", "There are no active applicants to review under this category.")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cards Stack Container */}
      <View style={styles.stackContainer}>
        {renderCards()}
      </View>

      {/* Glass Floating Bottom Actions */}
      <View style={styles.actionsWrapper}>
        <BottomActions
          onReject={handleRejectPress}
          onAccept={handleAcceptPress}
          onCall={handleCallPress}
          onDetails={handleDetailsPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  stackContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    // Add minHeight to ensure cards aren't squished on smaller devices
    minHeight: IS_SMALL_DEVICE ? 370 : 425,
  },
  actionsWrapper: {
    width: "100%",
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.15)",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0a0504",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
