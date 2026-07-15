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

const PRIMARY_GREEN = "#153e69";

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

  const headerStatsText = `${totalApplied} ${t("applied")} | ${shortlistedCount} ${t("shortlisted")} | ${contactedCount} ${t("contacted")} | ${rejectedCount} ${t("rejected")} | ${pendingCount} ${t("pending")}`;

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
      activeColor: "#153e69",
      inactiveBg: "rgba(21, 62, 105, 0.08)",
      inactiveBorder: "rgba(21, 62, 105, 0.18)",
      inactiveText: "#153e69",
    },
    {
      key: "new",
      label: t("new", "New"),
      count: pendingCount,
      activeColor: "#153e69",
      inactiveBg: "rgba(21, 62, 105, 0.08)",
      inactiveBorder: "rgba(21, 62, 105, 0.18)",
      inactiveText: "#153e69",
    },
    {
      key: "shortlisted",
      label: t("shortlisted", "Shortlisted"),
      count: shortlistedCount,
      activeColor: "#153e69",
      inactiveBg: "#e7eff7",
      inactiveBorder: "#cfe0f0",
      inactiveText: "#153e69",
    },
    {
      key: "contacted",
      label: t("contacted", "Contacted"),
      count: contactedCount,
      activeColor: "#f2c879",
      inactiveBg: "rgba(242, 200, 121, 0.12)",
      inactiveBorder: "rgba(242, 200, 121, 0.22)",
      inactiveText: "#f2c879",
    },
    {
      key: "rejected",
      label: t("rejected", "Rejected"),
      count: rejectedCount,
      activeColor: "#f57f20",
      inactiveBg: "rgba(245, 127, 32, 0.08)",
      inactiveBorder: "rgba(245, 127, 32, 0.18)",
      inactiveText: "#f57f20",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
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
            <Ionicons name="people-outline" size={48} color="rgba(10, 5, 4, 0.4)" />
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
    backgroundColor: "#f2f2f3",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
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
    color: "#0a0504",
  },
  filterSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
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
    backgroundColor: "#0a0504",
    borderColor: "#0a0504",
  },
  filterPillInactive: {
    backgroundColor: "#f2f2f3",
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterLabelActive: {
    color: "#ffffff",
  },
  filterLabelInactive: {
    color: "rgba(10, 5, 4, 0.6)",
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
    backgroundColor: "rgba(10, 5, 4, 0.15)",
  },
  countText: {
    fontSize: 10,
    fontWeight: "800",
  },
  countTextActive: {
    color: "#ffffff",
  },
  countTextInactive: {
    color: "rgba(10, 5, 4, 0.6)",
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
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
    textAlign: "center",
  },
});
