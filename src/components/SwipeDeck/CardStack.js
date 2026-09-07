import React from "react";
import { StyleSheet, View, Text, Dimensions, TouchableOpacity,PixelRatio } from "react-native";
import { useSharedValue, withTiming, runOnJS, Easing } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import SwipeCard from "./SwipeCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;
const IS_LARGE_DEVICE = SCREEN_HEIGHT > 840;
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const STACK_HEIGHT = IS_SMALL_DEVICE
  ? SCREEN_HEIGHT * 0.55
  : IS_LARGE_DEVICE
  ? SCREEN_HEIGHT * 0.62
  : SCREEN_HEIGHT * 0.59;

const STACK_WIDTH = Math.min(SCREEN_WIDTH - 64, 380);

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

  // Navigation conditions
  const canUndo = activeIndex > 0;
  const hasNext = activeIndex < applicants.length - 1;

  const isUndoRef = React.useRef(false);

  // Synchronize Reanimated values AFTER React updates activeIndex state
  React.useEffect(() => {
    if (isUndoRef.current) {
      isUndoRef.current = false;
      translateX.value = -SCREEN_WIDTH * 1.1;
      translateY.value = 0;
      swipeProgress.value = 0;
      translateX.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
    } else {
      translateX.value = 0;
      translateY.value = 0;
      swipeProgress.value = 0;
    }
  }, [activeIndex]);

  // Swiping simply moves to next card — NO API CALL
  const handleSwipeComplete = React.useCallback((direction, swipedApplicant) => {
    if (setActiveIndex) {
      setActiveIndex((prev) => prev + 1);
    }
  }, [setActiveIndex]);

  // Right chevron: manually skip to the next card (same as swiping left on the card)
  const triggerManualSwipe = (direction) => {
    if (!currentApplicant) return;
    const targetX = -SCREEN_WIDTH * 1.1;
    translateX.value = withTiming(targetX, { duration: 300, easing: Easing.out(Easing.quad) }, () => {
      runOnJS(handleSwipeComplete)(direction, currentApplicant);
    });
    swipeProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
  };

  // Left chevron / Edge Undo: go BACK to the previous card with Image Slider animation
  const handleUndo = React.useCallback(() => {
    if (!canUndo || !setActiveIndex) return;
    isUndoRef.current = true;
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, [canUndo, setActiveIndex]);

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

  const isSwipeable = applicants.length > 1;

  // Render current active card and incoming next card only
  const renderCards = () => {
    const visibleCards = [];
    const limit = Math.min(applicants.length, activeIndex + 2);

    for (let i = limit - 1; i >= activeIndex; i--) {
      const applicant = applicants[i];
      if (!applicant) continue;
      const appId = applicant.id || applicant.application_id;
      const score = appId ? (matchScores[appId] ?? applicant.match_percentage ?? applicant.match_score) : null;
      const applicantWithScore = score != null ? { ...applicant, matchScore: score } : applicant;

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
          swipeEnabled={isSwipeable && hasNext}
          onUndo={handleUndo}
          canUndo={canUndo}
        />
      );
    }

    return visibleCards;
  };

  return (
    <View style={styles.container}>
      {/* Top Swipe Instruction & Counter Header */}
      <View style={styles.topSwipeHeader}>
        <View style={styles.swipeHintRow}>
          <Ionicons name="arrow-back" size={13} color="#ef4444" />
          <Text style={styles.swipeHintText}>
            Swipe <Text style={{ color: "#ef4444", fontWeight: "700" }}>left</Text> or{" "}
            <Text style={{ color: "#22c55e", fontWeight: "700" }}>right</Text> for next profile
          </Text>
          <Ionicons name="arrow-forward" size={13} color="#22c55e" />
        </View>

        <Text style={styles.topCounterText}>
          <Text style={{ color: "#6366f1", fontWeight: "800" }}>{activeIndex + 1}</Text> / {applicants.length}
        </Text>
      </View>

      <View style={styles.stackContainer}>
        {renderCards()}

        {/* Floating Side Navigation Buttons — Only show when there are multiple applicants */}
        {isSwipeable && (
          <>
            {/* Left = go back to previous card. Hidden when there's nothing to go back to. */}
            {canUndo && (
              <TouchableOpacity
                style={[styles.floatingSideBtn, styles.leftSideBtn]}
                activeOpacity={0.85}
                onPress={handleUndo}
              >
                <Ionicons name="chevron-back" size={24} color="#153e69" />
              </TouchableOpacity>
            )}

            {/* Right = skip to next card. Hidden when on the last card. */}
            {hasNext && (
              <TouchableOpacity
                style={[styles.floatingSideBtn, styles.rightSideBtn]}
                activeOpacity={0.85}
                onPress={() => triggerManualSwipe("left")}
              >
                <Ionicons name="chevron-forward" size={24} color="#153e69" />
              </TouchableOpacity>
            )}
          </>
        )}
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
    paddingTop: 2,
    paddingBottom: 8,
  },
  topSwipeHeader: {
    alignItems: "center",
    marginBottom: 2,
    gap: 2,
  },
  swipeHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swipeHintText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  topCounterText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  stackContainer: {
    width: STACK_WIDTH,
    height: STACK_HEIGHT,
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
    marginBottom: normalize(50),
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
