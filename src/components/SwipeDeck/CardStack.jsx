import React from "react";
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from "react-native";
import { useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import SwipeCard from "./SwipeCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CardStack({
  applicants = [],
  activeIndex = 0,
  setActiveIndex,
  matchScores = {},
  onPressDetails,
  onBackToJobs,
}) {
  const { t } = useTranslation();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeProgress = useSharedValue(0);

  const currentApplicant = applicants && applicants[activeIndex] ? applicants[activeIndex] : null;
  const hasApplicants = Boolean(currentApplicant && activeIndex < applicants.length);

  // Swiping simply moves to next card — NO API CALL
  const handleSwipeComplete = (direction, swipedApplicant) => {
    translateX.value = 0;
    translateY.value = 0;
    swipeProgress.value = 0;
    if (setActiveIndex) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const triggerManualSwipe = (direction) => {
    if (!currentApplicant) return;
    const targetX = direction === "right" ? SCREEN_WIDTH * 1.3 : -SCREEN_WIDTH * 1.3;
    translateX.value = withTiming(targetX, { duration: 250 }, () => {
      runOnJS(handleSwipeComplete)();
    });
  };

  // Empty State View when all cards are reviewed
  if (!hasApplicants || !currentApplicant) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="sparkles" size={48} color="#153e69" />
        </View>
        <Text style={styles.emptyTitle}>{t("noRecordsToDisplay", "No records to display")}</Text>
        {/* <Text style={styles.emptySubtitle}>
          {t("allApplicantsReviewed", "You've reviewed all applicants in this category.")}
        </Text> */}
        <TouchableOpacity style={styles.emptyStateButton} onPress={onBackToJobs}>
          <Text style={styles.emptyStateButtonText}>{t("backToMyJobs", "Back to my jobs")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render original full detail stacked cards (up to 3)
  const renderCards = () => {
    const visibleCards = [];
    const limit = Math.min(applicants.length, activeIndex + 3);

    for (let i = limit - 1; i >= activeIndex; i--) {
      const applicant = applicants[i];
      if (!applicant) continue;
      const appId = applicant.id || applicant.application_id;
      const score = appId ? (matchScores[appId] ?? applicant.match_percentage ?? applicant.match_score) : null;
      const applicantWithScore = { ...applicant, matchScore: score };

      visibleCards.push(
        <SwipeCard
          key={appId || i}
          applicant={applicantWithScore}
          myIndex={i}
          activeIndex={activeIndex}
          swipeProgress={swipeProgress}
          translateX={translateX}
          translateY={translateY}
          onSwipeComplete={handleSwipeComplete}
          onPressDetails={onPressDetails}
          swipeEnabled={true}
        />
      );
    }

    return visibleCards;
  };

  return (
    <View style={styles.container}>
      <View style={styles.stackContainer}>
        {renderCards()}

        {/* Floating Side Navigation Buttons — Positioned outside card edges */}
        <TouchableOpacity
          style={[styles.floatingSideBtn, styles.leftSideBtn]}
          activeOpacity={0.85}
          onPress={() => triggerManualSwipe("left")}
        >
          <Ionicons name="chevron-back" size={24} color="#153e69" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingSideBtn, styles.rightSideBtn]}
          activeOpacity={0.85}
          onPress={() => triggerManualSwipe("right")}
        >
          <Ionicons name="chevron-forward" size={24} color="#153e69" />
        </TouchableOpacity>
      </View>

      {/* Single View Details Button at Bottom */}
      <View style={styles.bottomActionsRow}>
        <TouchableOpacity
          style={styles.viewBtn}
          activeOpacity={0.85}
          onPress={() => onPressDetails && onPressDetails(currentApplicant)}
        >
          <Ionicons name="eye-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.viewBtnText}>{t("viewDetails", "View Details")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  stackContainer: {
    width: SCREEN_WIDTH - 84, // Reduced width for slightly narrower card
    height: SCREEN_HEIGHT * 0.58,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  floatingSideBtn: {
    position: "absolute",
    top: "46%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.15)",
  },
  leftSideBtn: {
    left: -22,
  },
  rightSideBtn: {
    right: -22,
  },
  bottomActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#153e69",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    shadowColor: "#153e69",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
    minWidth: 200,
  },
  viewBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0a0504",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: "#153e69",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 12,
  },
  emptyStateButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
