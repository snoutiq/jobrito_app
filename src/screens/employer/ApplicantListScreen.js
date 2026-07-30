import React, { useEffect, useState, useMemo, useRef } from "react";
import { Linking, StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from 'expo-haptics'; // Assuming expo-haptics is installed
import AsyncStorage from '@react-native-async-storage/async-storage'; // Assuming @react-native-async-storage/async-storage is installed
import { useTranslation } from "react-i18next";
import { fetchEmployerDashboard, updateApplicantStatus } from "../../redux/slices/employerSlice";
import CardStack from "../../components/SwipeDeck/CardStack";

export default function ApplicantListScreen({ route, navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const jobId = route?.params?.jobId;
  const jobTitle = route?.params?.jobTitle || "Applicants";

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);

  // Undo Action States & History stack
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [lastActionDetails, setLastActionDetails] = useState(null); // { applicantId, oldStatus, newStatus, applicantName }
  const [swipeHistory, setSwipeHistory] = useState([]); // Stack of actions to support multi-undo
  const undoTimeoutRef = useRef(null);
  const cardStackRef = useRef(null);

  // Get active job and applicants from the Redux store
  const selectedJob = useSelector((state) =>
    state.employer.submittedJobs.find((j) => j.id === jobId)
  );

  const applicants = selectedJob?.applicants || [];

  // Fetch/refresh the dashboard on load
  useEffect(() => {
    // Only fetch if job details are not already loaded or if a refresh is needed
    if (!selectedJob || applicants.length === 0) {
      dispatch(fetchEmployerDashboard());
    }
  }, [dispatch]);

  // Calculate dynamic stats
  const totalApplied = applicants.length;
  const shortlistedCount = applicants.filter((a) => a.status?.toLowerCase() === "shortlisted").length;
  const contactedCount = applicants.filter((a) => a.status?.toLowerCase() === "contacted").length;
  const rejectedCount = applicants.filter((a) => a.status?.toLowerCase() === "rejected").length;
  const pendingCount = applicants.filter((a) => a.status?.toLowerCase() === "new" || a.status?.toLowerCase() === "pending").length;

  // Filter applicants
  // FIX: memoize so reference sirf tab change ho jab actual data/filter change ho,
  // har parent re-render pe naya array na bane (yehi CardStack ko baar baar reset kar raha tha)
  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const status = item.status?.toLowerCase();
      if (activeFilter === "all") return true;
      if (activeFilter === "new") return status === "new" || status === "pending";
      return status === activeFilter;
    });
  }, [applicants, activeFilter]);

  // Handle activeIndex reset when filter changes
  useEffect(() => {
    setActiveIndex(0);
    setUndoToastVisible(false); // Hide undo toast on filter change
    setSwipeHistory([]); // Clear session history when changing filters
  }, [activeFilter]);

  // Animated progress bar setup
  const progressShared = useSharedValue(0);
  const deckLength = filteredApplicants.length;

  useEffect(() => {
    const targetProgress = deckLength > 0 ? Math.min(activeIndex / deckLength, 1) : 0;
    progressShared.value = withSpring(targetProgress, { damping: 15 });
  }, [activeIndex, deckLength]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressShared.value * 100}%`,
    };
  });

  // Function to handle status update and show undo toast
  const handleStatusUpdateAndShowUndo = async (applicant, newStatus) => {
    const oldStatus = applicant.status || 'new';
    const applicantId = applicant.id || applicant.application_id;
    const applicantName = applicant.name || applicant.full_name;

    const action = { applicantId, oldStatus, newStatus, applicantName };
    
    // Add to undo history stack
    setSwipeHistory((prev) => [...prev, action]);
    setLastActionDetails(action);
    setUndoToastVisible(true);

    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    // Set new timeout to hide toast
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToastVisible(false);
    }, 5000); // 5 seconds

    try {
      await dispatch(updateApplicantStatus({ applicationId: applicantId, status: newStatus })).unwrap();
      dispatch(fetchEmployerDashboard()); // Refresh dashboard to get updated counts
    } catch (error) {
      console.error("Failed to update status:", error);
      CustomAlert.show("Error", error || "Failed to update status. Please try again.");
      // Revert states
      setUndoToastVisible(false);
      setLastActionDetails(null);
      setSwipeHistory((prev) => prev.filter((item) => item.applicantId !== applicantId));
    }
  };

  // Swipe gesture handler - only increments card stack index, does NOT update status on server
  const handleSwipeGesture = (applicant, direction) => {
    const oldStatus = applicant.status || 'new';
    const applicantId = applicant.id || applicant.application_id;
    const applicantName = applicant.name || applicant.full_name;

    const action = { applicantId, oldStatus, newStatus: oldStatus, applicantName, isSwipe: true, direction };
    
    // Add to history so rewind works, but don't call update API
    setSwipeHistory((prev) => [...prev, action]);
  };

  const handleUndo = async () => {
    if (swipeHistory.length === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (!lastAction.isSwipe) {
        // Revert status on the backend ONLY if it was a button action (not a swipe gesture)
        await dispatch(updateApplicantStatus({ applicationId: lastAction.applicantId, status: lastAction.oldStatus })).unwrap();
        dispatch(fetchEmployerDashboard()); // Refresh counts
      }
      
      // Trigger card fly-in animation inside CardStack
      const swipeDirection = lastAction.isSwipe 
        ? (lastAction.direction === "left" ? "left" : "right")
        : (lastAction.newStatus === "shortlisted" ? "left" : "right");
      
      cardStackRef.current?.undo(swipeDirection);

      // Decrement active index in parent state
      setActiveIndex((prev) => Math.max(0, prev - 1));

      // Remove last item from stack
      setSwipeHistory((prev) => prev.slice(0, -1));
    } catch (error) {
      console.error("Failed to undo status:", error);
      CustomAlert.show("Error", error || "Failed to undo action.");
    } finally {
      setUndoToastVisible(false);
      setLastActionDetails(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    }
  };

  const handleCall = (applicant) => { // This is now triggered by BottomActions
    const phoneNumber = applicant.mobile_number || applicant.phone;
    if (!phoneNumber) {
      CustomAlert.show("Error", "Phone number not available.");
      return;
    }

    CustomAlert.show(
      t("confirmCall", "Call Applicant?"),
      `${t("call", "Call")} ${applicant.name || applicant.full_name} at ${phoneNumber}?`,
      [
        { text: t("cancel", "Cancel"), style: "cancel" },
        {
          text: t("call", "Call"),
          onPress: async () => {
            if (Platform.OS !== 'web') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            Linking.openURL(`tel:${phoneNumber}`).catch(() => CustomAlert.show("Call unavailable", "Dialer could not be opened."));
            handleStatusUpdateAndShowUndo(applicant, "contacted");
          },
        },
      ]
    );
  };

  // FIX: index sync ab alag callback se, taaki onSwipe ka contract confuse na ho
  const handleIndexChange = (index) => {
    setActiveIndex(index);
  };

  const handleDetailsPress = (applicant) => {
    navigation.navigate("ApplicantDetail", { applicantId: applicant.id, jobId, applicantItem: applicant });
  };

  // Empty State CTA Handlers
  const handleBackToJobs = () => {
    navigation.goBack();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const filterTabs = [
    {
      key: "all",
      label: t("all", "All"),
      count: totalApplied,
      activeColor: "#153e69",
      inactiveBg: "rgba(21, 62, 105, 0.08)",
      inactiveBorder: "rgba(21, 62, 105, 0.18)",
      inactiveText: "#153e69",
    },
    {
      key: "new",
      label: t("new", "New"),
      count: pendingCount, // Assuming 'new' filter shows pending applicants
      activeColor: "#153e69",
      inactiveBg: "rgba(21, 62, 105, 0.08)",
      inactiveBorder: "rgba(21, 62, 105, 0.18)",
      inactiveText: "#153e69",
    },
    {
      key: "shortlisted",
      label: t("shortlisted", "Shortlisted"),
      count: shortlistedCount,
      activeColor: "#4CAF50", // Green for shortlisted
      inactiveBg: "#e7eff7",
      inactiveBorder: "#cfe0f0",
      inactiveText: "#153e69",
    },
    {
      key: "contacted",
      label: t("contacted", "Contacted"),
      count: contactedCount,
      activeColor: "#153e69", // Blue for contacted
      inactiveBg: "rgba(242, 200, 121, 0.12)",
      inactiveBorder: "rgba(242, 200, 121, 0.22)",
      inactiveText: "#f2c879",
    },
    {
      key: "rejected",
      label: t("rejected", "Rejected"),
      count: rejectedCount,
      activeColor: "#f57f20", // Orange for rejected
      inactiveBg: "rgba(245, 127, 32, 0.08)",
      inactiveBorder: "rgba(245, 127, 32, 0.18)",
      inactiveText: "#f57f20",
    },
  ];

  const currentDisplayIndex = Math.min(activeIndex + 1, deckLength);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{jobTitle}</Text>
            <Text style={styles.headerSubtitle}>
              {deckLength > 0 && activeIndex < deckLength
                ? `${t("reviewing", "Reviewing")} ${currentDisplayIndex} ${t("of", "of")} ${deckLength}`
                : t("allReviewed", "All reviewed")}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs Section */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(tab.key)}
                style={[
                  styles.filterPill,
                  isActive
                    ? { backgroundColor: tab.activeColor, borderColor: tab.activeColor }
                    : { backgroundColor: tab.inactiveBg, borderColor: tab.inactiveBorder },
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    isActive ? { color: "#ffffff" } : { color: tab.inactiveText },
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    isActive
                      ? { backgroundColor: "rgba(255, 255, 255, 0.25)" }
                      : { backgroundColor: tab.inactiveBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive ? { color: "#ffffff" } : { color: tab.inactiveText },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tinder Card Stack and Actions Container */}
      <View style={styles.deckContainer}>
        <CardStack
          ref={cardStackRef}
          key={activeFilter}
          loading={selectedJob?.loading || false} // Pass loading state
          applicants={filteredApplicants}
          onIndexChange={handleIndexChange}
          onCall={handleCall}
          onPressDetails={handleDetailsPress}
          onAcceptButton={(applicant) => handleStatusUpdateAndShowUndo(applicant, "shortlisted")}
          onRejectButton={(applicant) => handleStatusUpdateAndShowUndo(applicant, "rejected")}
          onSwipeRight={(applicant) => handleSwipeGesture(applicant, "right")}
          onSwipeLeft={(applicant) => handleSwipeGesture(applicant, "left")}
          onBackToJobs={handleBackToJobs} // For empty state CTA
          onUndo={handleUndo}
          canUndo={swipeHistory.length > 0}
        />
      </View>

      {/* Undo Toast */}
      {undoToastVisible && lastActionDetails && (
        <View style={styles.undoToastContainer}>
          <Text style={styles.undoToastText}>
            {lastActionDetails.applicantName} {t("statusUpdatedTo", "status updated to")} {lastActionDetails.newStatus}.
          </Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>{t("undo", "UNDO")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 14,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0a0504",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.45)",
    fontWeight: "700",
    marginTop: 2,
  },
  progressContainer: {
    height: 4,
    width: "100%",
    position: "relative",
    marginTop: 14,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressTrack: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(21, 62, 105, 0.1)",
  },
  progressBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#153e69",
    borderRadius: 2,
  },
  filterSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
  },
  deckContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  undoToastContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  undoToastText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  undoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  undoButtonText: {
    color: '#f57f20', // Orange color for undo
    fontWeight: 'bold',
  },
});
