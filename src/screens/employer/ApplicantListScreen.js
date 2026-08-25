import React, { useEffect, useState, useMemo, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, PixelRatio } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { getMatchScore, markApplicationViewed } from "../../services/employerApi";
import CardStack from "../../components/SwipeDeck/CardStack";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

export default function ApplicantListScreen({ route, navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const jobId = route?.params?.jobId;
  const jobTitle = route?.params?.jobTitle || "Applicants";
  const initialFilterParam = route?.params?.initialFilter || route?.params?.filter || "all";

  const [activeFilter, setActiveFilter] = useState(initialFilterParam);
  const [activeIndex, setActiveIndex] = useState(0);
  const [matchScores, setMatchScores] = useState({});

  const filterScrollViewRef = useRef(null);
  const [tabLayouts, setTabLayouts] = useState({});

  const handleTabLayout = (key, event) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => ({ ...prev, [key]: { x, width } }));
  };

  useEffect(() => {
    if (activeFilter && filterScrollViewRef.current && tabLayouts[activeFilter]) {
      const tab = tabLayouts[activeFilter];
      const scrollX = Math.max(0, tab.x - SCREEN_WIDTH / 2 + tab.width / 2);
      filterScrollViewRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [activeFilter, tabLayouts]);

  useEffect(() => {
    if (route?.params?.initialFilter) {
      setActiveFilter(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  const selectedJob = useSelector((state) =>
    state.employer.submittedJobs?.find((j) => String(j.id) === String(jobId))
  );

  const applicants = selectedJob?.applicants || [];

  // Fetch dashboard data on mount if missing
  useEffect(() => {
    if (!selectedJob || applicants.length === 0) {
      dispatch(fetchEmployerDashboard());
    }
  }, [dispatch, selectedJob, applicants.length]);

  // Fetch match score for each applicant if not already fetched
  useEffect(() => {
    applicants.forEach((applicant) => {
      const appId = applicant.id || applicant.application_id;
      if (appId && matchScores[appId] === undefined) {
        getMatchScore(appId)
          .then((res) => {
            const score =
              res?.match_percentage ??
              res?.data?.match_percentage ??
              res?.match_score ??
              res?.data?.match_score ??
              res?.score ??
              res?.data?.score;
            if (score != null) {
              setMatchScores((prev) => ({ ...prev, [appId]: score }));
            }
          })
          .catch((err) => console.error("Error fetching match score for app", appId, err));
      }
    });
  }, [applicants]);

  // Tab counts
  const totalApplied = applicants.length;
  const viewedCount = applicants.filter((a) => String(a.status)?.toLowerCase() === "viewed" || String(a.status)?.toLowerCase() === "shortlisted").length;
  const contactedCount = applicants.filter((a) => String(a.status)?.toLowerCase() === "contacted").length;
  const rejectedCount = applicants.filter((a) => String(a.status)?.toLowerCase() === "rejected").length;
  const pendingCount = applicants.filter((a) => ["new", "pending"].includes(String(a.status)?.toLowerCase())).length;

  // Filtered list
  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const status = item.status?.toLowerCase();
      if (activeFilter === "all") return true;
      if (activeFilter === "new") return status === "new" || status === "pending";
      if (activeFilter === "viewed" || activeFilter === "shortlisted") return status === "viewed" || status === "shortlisted";
      return status === activeFilter;
    });
  }, [applicants, activeFilter]);

  // Reset activeIndex when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeFilter]);

  const handleDetailsPress = (applicant) => {
    if (!applicant) return;
    const appId = applicant.application_id || applicant.id;
    if (appId) {
      markApplicationViewed(appId);
    }
    navigation.navigate("ApplicantDetail", {
      applicantId: applicant.id,
      jobId,
      applicantItem: applicant,
    });
  };

  const filterTabs = [
    { key: "all", label: t("all", "All"), count: totalApplied, activeColor: "#153e69" },
    { key: "new", label: t("new", "New"), count: pendingCount, activeColor: "#153e69" },
    { key: "viewed", label: t("viewed", "Viewed"), count: viewedCount, activeColor: "#1b8755" },
    { key: "contacted", label: t("contacted", "Contacted"), count: contactedCount, activeColor: "#153e69" },
    { key: "rejected", label: t("rejected", "Rejected"), count: rejectedCount, activeColor: "#f57f20" },
  ];

  const deckLength = filteredApplicants.length;
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

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView
          ref={filterScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onLayout={(e) => handleTabLayout(tab.key, e)}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(tab.key)}
                style={[
                  styles.filterPill,
                  isActive
                    ? { backgroundColor: tab.activeColor, borderColor: tab.activeColor }
                    : { backgroundColor: "#e7eff7", borderColor: "#cfe0f0" },
                ]}
              >
                <Text style={[styles.filterLabel, { color: isActive ? "#ffffff" : "#153e69" }]}>
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#cfe0f0" },
                  ]}
                >
                  <Text style={[styles.countText, { color: isActive ? "#ffffff" : "#153e69" }]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Card Deck */}
      <View style={styles.deckContainer}>
        <CardStack
          key={activeFilter}
          applicants={filteredApplicants}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          matchScores={matchScores}
          onPressDetails={handleDetailsPress}
          onBackToJobs={() => navigation.goBack()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
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
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0a0504",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
  },
  filterSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.06)",
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deckContainer: {
    flex: 1,
  },
});
