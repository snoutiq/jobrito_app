import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Platform } from "react-native";
import Animated, {
  useSharedValue,
  runOnJS,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics'; // Assuming expo-haptics is installed
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import SwipeCard from "./SwipeCard";
import BottomActions from "./BottomActions";
import SkeletonCard from "./SkeletonCard"; // Assuming SkeletonCard is in the same directory

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_DEVICE = SCREEN_HEIGHT < 750;

const CardStack = forwardRef(({
  applicants = [],
  onSwipe,
  onSwipeRight, // For ApplicantListScreen to update status
  onSwipeLeft, // For ApplicantListScreen to update status
  onCall,
  onPressDetails,
  onAcceptButton, // For ApplicantListScreen to update status
  onRejectButton, // For ApplicantListScreen to update status
  onIndexChange, // For ApplicantListScreen to update activeIndex
  loading = false, // From ApplicantListScreen
  onViewOtherFilters, // For empty state CTA
  onBackToJobs, // For empty state CTA
  onUndo,
  canUndo = false,
}, ref) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false); // Double-tap guard
  const [showSwipeHint, setShowSwipeHint] = useState(false); // First-time swipe hint
  const hintDismissedRef = useRef(false); // To prevent hint from reappearing immediately after dismiss

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeProgress = useSharedValue(0);
  const hintOpacity = useSharedValue(0);
  const hintTranslateY = useSharedValue(20);

  useImperativeHandle(ref, () => ({
    undo: (direction) => {
      translateX.value = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      translateY.value = 0;
      swipeProgress.value = 1;
      
      translateX.value = withSpring(0, { damping: 15, stiffness: 120 });
      swipeProgress.value = withSpring(0, { damping: 15, stiffness: 120 });
      
      setActiveIndex((prev) => Math.max(0, prev - 1));
    }
  }));

  const remainingCount = applicants.length - activeIndex;
  const hasApplicants = remainingCount > 0;
  const swipeEnabled = true;

  const handleSwipeComplete = (direction, swipedApplicant) => {
    // Notify parent to update Redux status
    if (direction === "right" && onSwipeRight) {
      onSwipeRight(swipedApplicant);
    } else if (direction === "left" && onSwipeLeft) {
      onSwipeLeft(swipedApplicant);
    }
    
    // Increment index to show the next card
    setActiveIndex((prev) => prev + 1);

    // Reset translation values instantly
    translateX.value = 0;
    translateY.value = 0;
    swipeProgress.value = 0;
    setIsAnimating(false); // Animation complete
  };

  const handleRejectPress = () => {
    if (!hasApplicants) return;
    const currentApplicant = applicants[activeIndex];
    
    translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 220 }, () => {
      runOnJS(handleSwipeComplete)("right", currentApplicant); // This will also increment activeIndex
    });
    if (onRejectButton) {
      onRejectButton(currentApplicant); // Notify ApplicantListScreen for status update
    }
    setIsAnimating(true); // Animation started
    swipeProgress.value = withTiming(1, { duration: 220 });
  };

  const handleAcceptPress = () => {
    if (!hasApplicants) return;
    const currentApplicant = applicants[activeIndex];
    
    translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 220 }, () => { // This will also increment activeIndex
      runOnJS(handleSwipeComplete)("left", currentApplicant); 
    });
    if (onAcceptButton) {
      onAcceptButton(currentApplicant); // Notify ApplicantListScreen for status update
    }
    setIsAnimating(true); // Animation started
    swipeProgress.value = withTiming(1, { duration: 220 });
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

  // FIX: reset sirf tab hoga jab applicant IDs actually change (not just array reference)
  const applicantIdsKey = applicants.map((a) => a.id).join(",");

  useEffect(() => {
    setActiveIndex(0);
    translateX.value = 0;
    translateY.value = 0;
    swipeProgress.value = 0;
    setIsAnimating(false); // Reset animation state
    if (onIndexChange) onIndexChange(0);
  }, [applicantIdsKey]); // Depend on applicantIdsKey for stable reset

  // Sync activeIndex with parent's onIndexChange
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(activeIndex);
    }
  }, [activeIndex, onIndexChange]);

  // First-time swipe hint logic
  useEffect(() => {
    const checkAndShowHint = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenSwipeHint');
        if (hasSeen === null && applicants.length > 0) {
          setShowSwipeHint(true);
          hintOpacity.value = withTiming(1, { duration: 300 });
          hintTranslateY.value = withSpring(0, { damping: 10 });
        }
      } catch (e) {
        console.error("Failed to load swipe hint flag", e);
      }
    };
    if (!hintDismissedRef.current) { // Only check if not dismissed in current session
      checkAndShowHint();
    }
  }, [applicants.length]);

  const dismissSwipeHint = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await AsyncStorage.setItem('hasSeenSwipeHint', 'true');
      hintOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setShowSwipeHint)(false);
      });
      hintTranslateY.value = withSpring(20, { damping: 10 });
      hintDismissedRef.current = true; // Mark as dismissed for current session
    } catch (e) {
      console.error("Failed to save swipe hint flag", e);
    }
  };

  const animatedHintStyle = useAnimatedStyle(() => {
    return { opacity: hintOpacity.value, transform: [{ translateY: hintTranslateY.value }] };
    });
  
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
          onUndo={onUndo}
          canUndo={canUndo}
        />
      );
    }

    return visibleCards;
  };

  // Skeleton Card for loading state
  if (loading && applicants.length === 0) {
    return (
      <View style={styles.stackContainer}>
        <SkeletonCard />
      </View>
    );
  }

  // Swipe gesture for empty state (left to right only)
  const emptyPanGesture = Gesture.Pan()
    .onEnd((event) => {
      // Swipe from left to right by at least 60px to trigger undo
      if (event.translationX > 60 && canUndo && onUndo) {
        runOnJS(onUndo)();
      }
    });

  if (!hasApplicants && !loading) { // Only show empty state if not loading and no applicants
    return (
      <GestureDetector gesture={emptyPanGesture}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="sparkles" size={48} color="#153e69" />
          </View>
          <Text style={styles.emptyTitle}>{t("allCaughtUp", "All Caught Up!")}</Text>
          {applicants.length === 0 ? (
            <Text style={styles.emptySubtitle}>
              {t("noApplicantsText", "There are no active applicants to review under this category.")}
            </Text>
          ) : (
            <Text style={styles.emptySubtitle}>
              {t("allApplicantsReviewed", "You've reviewed all applicants in this category.")}
            </Text>
          )}
          <View style={styles.emptyStateActions}>
            {canUndo && onUndo && (
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: "#f57f20", borderColor: "#f57f20", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }]} 
                onPress={onUndo}
              >
                <Ionicons name="arrow-undo" size={18} color="#ffffff" />
                <Text style={styles.emptyStateButtonText}>
                  {t("undoLastSwipe", "Undo Last Swipe")}
                </Text>
              </TouchableOpacity>
            )}
            {onViewOtherFilters ? (
              <TouchableOpacity style={styles.emptyStateButtonSecondary} onPress={onViewOtherFilters}>
                <Text style={styles.emptyStateButtonTextSecondary}>{t("viewOtherFilters", "View Other Filters")}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.emptyStateButtonSecondary} onPress={onBackToJobs}>
              <Text style={styles.emptyStateButtonTextSecondary}>{t("backToJobs", "Back to Jobs")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureDetector>
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
          onCall={handleCallPress} // Call confirmation is handled in ApplicantListScreen
          onDetails={handleDetailsPress}
          onUndo={onUndo}
          canUndo={canUndo}
          disabled={isAnimating} // Disable buttons during animation
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stackContainer: {
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    height: SCREEN_HEIGHT * 0.54,
    // Add minHeight to ensure cards aren't squished on smaller devices
    minHeight: IS_SMALL_DEVICE ? 360 : 410,
  },
  actionsWrapper: {
    width: "100%",
    marginTop: IS_SMALL_DEVICE ? 8 : 16,
    paddingBottom: IS_SMALL_DEVICE ? 8 : 16,
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
  emptyStateActions: {
    width: "100%",
    marginTop: 20,
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    backgroundColor: "#153e69",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#153e69",
  },
  emptyStateButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyStateButtonSecondary: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.2)",
  },
  emptyStateButtonTextSecondary: {
    color: "#153e69",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default CardStack;
