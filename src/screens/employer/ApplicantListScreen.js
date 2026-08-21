import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { getMatchScore } from "../../services/employerApi";
import CardStack from "../../components/SwipeDeck/CardStack";

export default function ApplicantListScreen({ route, navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const jobId = route?.params?.jobId;
  const jobTitle = route?.params?.jobTitle || "Applicants";

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [matchScores, setMatchScores] = useState({});

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
  const shortlistedCount = applicants.filter((a) => a.status?.toLowerCase() === "shortlisted").length;
  const contactedCount = applicants.filter((a) => a.status?.toLowerCase() === "contacted").length;
  const rejectedCount = applicants.filter((a) => a.status?.toLowerCase() === "rejected").length;
  const pendingCount = applicants.filter((a) => ["new", "pending"].includes(a.status?.toLowerCase())).length;

  // Filtered list
  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const status = item.status?.toLowerCase();
      if (activeFilter === "all") return true;
      if (activeFilter === "new") return status === "new" || status === "pending";
      return status === activeFilter;
    });
  }, [applicants, activeFilter]);

  // Reset activeIndex when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeFilter]);

  const handleDetailsPress = (applicant) => {
    if (!applicant) return;
    navigation.navigate("ApplicantDetail", {
      applicantId: applicant.id,
      jobId,
      applicantItem: applicant,
    });
  };

  const filterTabs = [
    { key: "all", label: t("all", "All"), count: totalApplied, activeColor: "#153e69" },
    { key: "new", label: t("new", "New"), count: pendingCount, activeColor: "#153e69" },
    { key: "shortlisted", label: t("shortlisted", "Shortlisted"), count: shortlistedCount, activeColor: "#1b8755" },
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
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
    fontSize: 17,
    fontWeight: "700",
    color: "#0a0504",
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
