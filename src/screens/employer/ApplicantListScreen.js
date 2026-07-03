import React, { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ApplicantCard from "../../components/cards/ApplicantCard";
import colors from "../../constants/colors";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { useTranslation } from "react-i18next";

const PRIMARY_GREEN = "#22C55E";

export default function ApplicantListScreen({ route, navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const jobId = route?.params?.jobId;
  const jobTitle = route?.params?.jobTitle || "Applicants";

  const [activeFilter, setActiveFilter] = useState("all");

  // Get active job and applicants directly from the Redux store loaded from employer_dashboard
  const selectedJob = useSelector((state) =>
    state.employer.submittedJobs.find((j) => j.id === jobId)
  );

  const applicants = selectedJob?.applicants || [];

  // Fetch/refresh the dashboard on load
  useEffect(() => {
    dispatch(fetchEmployerDashboard());
  }, [dispatch]);

  const handleCall = (phone) => {
    if (!phone) {
      CustomAlert.show("Error", "Phone number not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      CustomAlert.show("Call unavailable", "Dialer could not be opened.");
    });
  };

  // Calculate stats for this job
  const totalApplied = applicants.length;
  const shortlistedCount = applicants.filter((a) => a.status?.toLowerCase() === "shortlisted").length;
  const contactedCount = applicants.filter((a) => a.status?.toLowerCase() === "contacted").length;
  const rejectedCount = applicants.filter((a) => a.status?.toLowerCase() === "rejected").length;
  const pendingCount = applicants.filter((a) => a.status?.toLowerCase() === "new" || a.status?.toLowerCase() === "pending").length;

  const headerStatsText = `${totalApplied} Applied | ${shortlistedCount} shortlisted | ${contactedCount} contacted | ${rejectedCount} rejected | ${pendingCount} pending`;

  // Filter applicants based on active status filter
  const filteredApplicants = applicants.filter((item) => {
    const status = item.status?.toLowerCase();
    if (activeFilter === "all") return true;
    if (activeFilter === "new") return status === "new" || status === "pending";
    return status === activeFilter;
  });

  const filterTabs = [
    {
      key: "all",
      label: t("all", "All"),
      count: totalApplied,
      activeColor: "#6366F1",
      inactiveBg: "#EEF2FF",
      inactiveBorder: "#E0E7FF",
      inactiveText: "#4F46E5",
    },
    {
      key: "new",
      label: t("new", "New"),
      count: pendingCount,
      activeColor: "#3B82F6",
      inactiveBg: "#EFF6FF",
      inactiveBorder: "#DBEAFE",
      inactiveText: "#2563EB",
    },
    {
      key: "shortlisted",
      label: t("shortlisted", "Shortlisted"),
      count: shortlistedCount,
      activeColor: "#10B981",
      inactiveBg: "#ECFDF5",
      inactiveBorder: "#D1FAE5",
      inactiveText: "#059669",
    },
    {
      key: "contacted",
      label: t("contacted", "Contacted"),
      count: contactedCount,
      activeColor: "#F59E0B",
      inactiveBg: "#FEF3C7",
      inactiveBorder: "#FEEBAD",
      inactiveText: "#D97706",
    },
    {
      key: "rejected",
      label: t("rejected", "Rejected"),
      count: rejectedCount,
      activeColor: "#EF4444",
      inactiveBg: "#FEF2F2",
      inactiveBorder: "#FEE2E2",
      inactiveText: "#DC2626",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("applicantList")}</Text>
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
                    isActive ? { color: "#FFFFFF" } : { color: tab.inactiveText },
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
                      isActive ? { color: "#FFFFFF" } : { color: tab.inactiveText },
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

      {/* Content */}
      <View style={styles.content}>
        {filteredApplicants.length > 0 ? (
          <FlatList
            data={filteredApplicants}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ApplicantCard
                applicant={item}
                onPress={() => navigation.navigate("ApplicantDetail", { applicantId: item.id, jobId })}
                onCall={() => handleCall(item.mobile_number || item.phone)}
              />
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>{t("noApplicantsCategory")}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
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
  filterPillActive: {
    backgroundColor: "#1E293B",
    borderColor: "#1E293B",
  },
  filterPillInactive: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterLabelActive: {
    color: "#FFFFFF",
  },
  filterLabelInactive: {
    color: "#475569",
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
  },
  countBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  countBadgeInactive: {
    backgroundColor: "#E2E8F0",
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
  },
  countTextActive: {
    color: "#FFFFFF",
  },
  countTextInactive: {
    color: "#475569",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
});
