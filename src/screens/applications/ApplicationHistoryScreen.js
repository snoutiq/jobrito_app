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

const formatAppliedTime = (appliedOn) => {
  if (!appliedOn) return "Recently";
  const date = new Date(appliedOn);
  if (Number.isNaN(date.getTime())) return "Recently";
  
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 14) return "1 week ago";
  
  // Format as "DD MMM" (e.g., "12 Oct", "30 Sep")
  const options = { day: "numeric", month: "short" };
  return date.toLocaleDateString("en-US", options);
};

export default function ApplicationHistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const { history, loading } = useSelector((state) => state.application);
  console.log("Application History:", history);
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
    return (
      <Pressable
        onPress={() => {
          if (item.jobId) {
            navigation.navigate("JobDetails", { jobId: item.jobId, job: item.job });
          }
        }}
        style={styles.row}
      >
        {/* Left company logo */}
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="business-outline" size={24} color="rgba(10, 5, 4, 0.6)" />
            </View>
          )}
        </View>

        {/* Middle content */}
        <View style={styles.infoContainer}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {item.employer}
          </Text>
          
          {/* Salary and Location Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color="rgba(10, 5, 4, 0.4)" style={{ marginRight: 2 }} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.job?.salary || "Competitive"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="rgba(10, 5, 4, 0.4)" style={{ marginRight: 2 }} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.job?.location || "Flexible"}
              </Text>
            </View>
          </View>

          <View style={styles.badgeWrapper}>
            <StatusBadge status={item.status} />
          </View>
        </View>

        {/* Right content */}
        <View style={styles.rightContainer}>
          <Text style={styles.dateText}>{formatAppliedTime(item.appliedOn)}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.15)" />
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
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#153e69", // brand primary avatar background
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.05)",
    backgroundColor: "#ffffff",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0504",
    marginBottom: 2,
  },
  companyName: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 4,
  },
  badgeWrapper: {
    alignSelf: "flex-start",
  },
  rightContainer: {
    alignItems: "flex-end",
    gap: 8,
    marginLeft: 8,
  },
  dateText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#153e69", // vibrant green FAB
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "50%",
  },
  metaText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.4)",
  },
});
