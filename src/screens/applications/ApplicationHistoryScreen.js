import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../constants/colors";
import { fetchApplicationHistory } from "../../redux/slices/applicationSlice";

const PRIMARY_GREEN = "#153e69";

const formatAppliedTime = (appliedOn, t) => {
  if (!appliedOn) return t("applications.recently", "Recently");
  const date = new Date(appliedOn);
  if (Number.isNaN(date.getTime())) return t("applications.recently", "Recently");
  
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  
  if (diffDays === 0) return t("applications.today", "Today");
  if (diffDays === 1) return t("applications.yesterday", "Yesterday");
  if (diffDays < 7) return t("applications.daysAgo", "{{count}} days ago", { count: diffDays });
  if (diffDays >= 7 && diffDays < 14) return t("applications.weeksAgo", "1 week ago");
  
  // Format as "DD MMM" (e.g., "12 Oct", "30 Sep")
  const options = { day: "numeric", month: "short" };
  return date.toLocaleDateString("en-US", options);
};

const getDisplayStatusText = (statusStr, t) => {
  if (!statusStr) return "";
  const s = statusStr.toUpperCase().trim();
  if (s === "NEW" || s === "UNDER REVIEW" || s === "UNDER_REVIEW") {
    return t("status.underProcess", "UNDER PROCESS");
  }
  if (s === "REJECT" || s === "REJECTED" || s === "DECLINED") {
    return t("status.discussionPending", "DISCUSSION PENDING");
  }
  if (s === "SHORTLISTED") {
    return t("status.shortlisted", "SHORTLISTED");
  }
  if (s === "CONTACTED") {
    return t("status.contacted", "CONTACTED");
  }
  if (s === "JOB CLOSED") {
    return t("status.jobClosed", "JOB CLOSED");
  }
  return t(`status.${s.toLowerCase()}`, s);
};

const getStatusBadgeColors = (statusStr) => {
  if (!statusStr) return { bg: "rgba(242, 200, 121, 0.06)", text: "#f2c879", border: "rgba(242, 200, 121, 0.2)" };
  const s = statusStr.toUpperCase().trim();
  if (s === "NEW" || s === "UNDER REVIEW" || s === "UNDER_REVIEW") {
    return { bg: "rgba(21, 62, 105, 0.06)", text: "#153e69", border: "rgba(21, 62, 105, 0.2)" };
  }
  if (s === "REJECT" || s === "REJECTED" || s === "DECLINED") {
    return { bg: "rgba(245, 127, 32, 0.06)", text: "#f57f20", border: "rgba(245, 127, 32, 0.2)" };
  }
  if (s === "SHORTLISTED" || s === "CONTACTED") {
    return { bg: "rgba(21, 105, 62, 0.06)", text: "#15693e", border: "rgba(21, 105, 62, 0.2)" };
  }
  if (s === "JOB CLOSED") {
    return { bg: "rgba(10, 5, 4, 0.04)", text: "rgba(10, 5, 4, 0.6)", border: "rgba(10, 5, 4, 0.15)" };
  }
  return { bg: "rgba(242, 200, 121, 0.06)", text: "#f2c879", border: "rgba(242, 200, 121, 0.2)" };
};

export default function ApplicationHistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const { history, loading } = useSelector((state) => state.application);
  const { profile } = useSelector((state) => state.user);
  
  const [search, setSearch] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");

  const filterOptions = [
    "All",
    "UNDER REVIEW",
    "SHORTLISTED",
    "CONTACTED",
    "DECISION PENDING",
    "JOB CLOSED"
  ];

  const statusTitles = {
    "All": t("applications.status.all", "All Applications"),
    "UNDER REVIEW": t("applications.status.underReview", "Under Review"),
    "SHORTLISTED": t("applications.status.shortlisted", "Shortlisted"),
    "CONTACTED": t("applications.status.contacted", "Contacted"),
    "DECISION PENDING": t("applications.status.decisionPending", "Decision Pending"),
    "JOB CLOSED": t("applications.status.jobClosed", "Job Closed")
  };

  const handleCall = (job) => {
    const phoneNumber =
      job?.creator?.mobile_number ||
      job?.mobile_number ||
      job?.phone ||
      job?.contact_phone ||
      job?.creator?.phone ||
      "+919876543210";
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      Alert.alert(
        t("error", "Error"),
        (t("couldNotOpenDialer", "Could not open dialer: ") || "Could not open dialer: ") + err.message,
      );
    });
  };

  useEffect(() => {
    dispatch(fetchApplicationHistory());
  }, [dispatch]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    return history.filter((item) => {
      const matchesQuery =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.employer?.toLowerCase().includes(query);
      
      const matchesStatus =
        activeStatusFilter === "All" ||
        item.status?.toUpperCase() === activeStatusFilter.toUpperCase();

      return matchesQuery && matchesStatus;
    });
  }, [history, search, activeStatusFilter]);

  const displayName = profile?.name && profile.name !== "Guest User" ? profile.name : (profile?.phone || "");
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderItem = ({ item }) => {
    const jobOpenings = item.job?.open_positions ?? item.job?.openings ?? 0;
    const jobType = item.job?.job_type ?? item.job?.type ?? "Full-time";
    const appliedDate = formatAppliedTime(item.appliedOn, t);
    
    // Determine status badge color
    const displayStatus = getDisplayStatusText(item.status || "UNDER REVIEW", t);
    const statusColors = getStatusBadgeColors(item.status || "UNDER REVIEW");
    const statusBg = statusColors.bg;
    const statusTextColor = statusColors.text;

    const jobObj = item.job || {};
    const isReferral = jobObj.category === "referral" || jobObj.is_referral;
    const effectiveRoleSource =
      jobObj.submitted_by_role ||
      jobObj.posted_by_role ||
      jobObj.active_role ||
      jobObj.user_role ||
      jobObj.creator?.role ||
      jobObj.creator?.active_role ||
      item.submitted_by_role ||
      "";
    const effectiveRole = effectiveRoleSource.toLowerCase();
    const normalizedRole = effectiveRole.replace(/[\s_]/g, ""); // "job_seeker" -> "jobseeker"
    const isChefOrJobSeeker = ["chef", "jobseeker", "job_seeker", "talent", "candidate"].includes(normalizedRole);
    const showApply = !isReferral && !isChefOrJobSeeker;

    return (
      <Pressable
        onPress={() => {
          if (item.jobId) {
            navigation.navigate("JobDetails", { jobId: item.jobId, job: item.job });
          }
        }}
        style={styles.jobCard}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleWrapper}>
            <View style={styles.iconContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="restaurant-outline" size={22} color={PRIMARY_GREEN} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitleText} numberOfLines={1}>{item.title}</Text>
              {item.employer ? (
                <Text style={styles.jobCompanyText} numberOfLines={1}>{item.employer}</Text>
              ) : null}
              <Text style={styles.jobMetaText}>
                <Ionicons name="location-outline" size={13} color="rgba(10, 5, 4, 0.6)" />{" "}
                {item.job?.location || "Flexible"} • {appliedDate}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColors.border }]}>
            <Text style={[styles.statusBadgeText, { color: statusTextColor }]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          {jobOpenings > 0 && (
            <Text style={styles.detailsText}>
              <Ionicons name="people-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
              {t("openings_count", { count: jobOpenings })}
            </Text>
          )}
          <Text style={styles.detailsText}>
            <Ionicons name="briefcase-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
            {jobType}
          </Text>
          {item.job?.salary ? (
            <Text style={styles.detailsText}>
              <Ionicons name="card-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
              {item.job.salary}
            </Text>
          ) : null}
        </View>

        <View style={styles.divider} />
        <View style={styles.actionsRow}>
          {showApply ? (
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (item.jobId) {
                  navigation.navigate("JobDetails", { jobId: item.jobId, job: item.job });
                }
              }}
            >
              <Text style={styles.viewDetailsBtnText}>
                {t("applications.viewDetails", "View Details")}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.viewDetailsBtn, { backgroundColor: "#f57f20" }]}
              activeOpacity={0.8}
              onPress={() => handleCall(item.job)}
            >
              <Ionicons name="call" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.viewDetailsBtnText}>
                {t("jobs.callNow", "Call Now")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  const isFilterActive = activeStatusFilter !== "All";

  return (
    <ScreenWrapper scroll={false} edges={["left", "right", "bottom"]} style={styles.container} contentStyle={{ padding: 0 }}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#153e69" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("applications.title", "My Applications")}</Text>
        </View>
      </View>

      {/* Search / Filter Bar */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(10, 5, 4, 0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("applications.searchPlaceholder", "Search applications")}
            placeholderTextColor="rgba(10, 5, 4, 0.4)"
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, isFilterActive && styles.filterBtnActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name={isFilterActive ? "options" : "options-outline"}
            size={22}
            color={isFilterActive ? "#153e69" : "rgba(10, 5, 4, 0.6)"}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Info Bar if active */}
      {isFilterActive && (
        <View style={styles.filterInfoBar}>
          <Text style={styles.filterInfoText}>
            {t("applications.showing", "Showing: ")}<Text style={{ fontWeight: "700" }}>{statusTitles[activeStatusFilter]}</Text>
          </Text>
          <TouchableOpacity onPress={() => setActiveStatusFilter("All")}>
            <Text style={styles.resetFilterText}>{t("clear", "Clear")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Applications List */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={loading ? t("loading", "Loading...") : t("applications.noFound", "No applications found")}
              subtitle={
                loading
                  ? t("pleaseWait", "Please wait...")
                  : isFilterActive || search
                  ? t("applications.tryChangingSearch", "Try changing your search query or status filter.")
                  : t("applications.appliedJobsShowHere", "Your applied jobs will show up here.")
              }
            />
          }
          ListFooterComponent={
            filteredHistory.length > 0 ? (
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  {t("applications.showingHistoryRange", "Showing last 6 months of application history")}
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Filter Options Bottom Sheet Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFilterModal(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("applications.filterByStatus", "Filter by Status")}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="rgba(10, 5, 4, 0.6)" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.optionsList}>
              {filterOptions.map((option) => {
                const isSelected = activeStatusFilter === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionItem, isSelected && styles.optionItemActive]}
                    onPress={() => {
                      setActiveStatusFilter(option);
                      setShowFilterModal(false);
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                      {statusTitles[option]}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#153e69" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {isFilterActive && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setActiveStatusFilter("All");
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.clearFilterText}>{t("applications.clearFilter", "Clear Filter")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.06)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f2f2f3",
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0a0504",
    paddingVertical: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  filterBtnActive: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderColor: "#153e69",
  },
  filterInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f2f2f3",
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  filterInfoText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f57f20",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobTitleWrapper: {
    flexDirection: "row",
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  jobTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  jobCompanyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 2,
  },
  jobMetaText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "center",
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingLeft: 52,
  },
  detailsText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    flexDirection: "row",
    alignItems: "center",
  },
  footerContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.4)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f2f2f3",
  },
  optionItemActive: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.08)",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(10, 5, 4, 0.6)",
  },
  optionTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  clearFilterBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  clearFilterText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f57f20",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#153e69",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewDetailsBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
