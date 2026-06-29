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
    "All": "All Applications",
    "UNDER REVIEW": "Under Review",
    "SHORTLISTED": "Shortlisted",
    "CONTACTED": "Contacted",
    "DECISION PENDING": "Decision Pending",
    "JOB CLOSED": "Job Closed"
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

  const displayName = profile?.name === "Guest User" || !profile?.name ? "Guest" : profile.name;
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
            navigation.navigate("JobDetails", { jobId: item.jobId });
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
              <Ionicons name="business-outline" size={24} color="#64748B" />
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
          <View style={styles.badgeWrapper}>
            <StatusBadge status={item.status} />
          </View>
        </View>

        {/* Right content */}
        <View style={styles.rightContainer}>
          <Text style={styles.dateText}>{formatAppliedTime(item.appliedOn)}</Text>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </View>
      </Pressable>
    );
  };

  const isFilterActive = activeStatusFilter !== "All";

  return (
    <ScreenWrapper scroll={false} edges={["left", "right", "bottom"]} style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#0A7B32" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Applications</Text>
        </View>
        
        {/* Profile Avatar */}
      </View>

      {/* Search / Filter Bar */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search applications"
            placeholderTextColor="#94A3B8"
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
            color={isFilterActive ? "#0A7B32" : "#475569"}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Info Bar if active */}
      {isFilterActive && (
        <View style={styles.filterInfoBar}>
          <Text style={styles.filterInfoText}>
            Showing: <Text style={{ fontWeight: "700" }}>{statusTitles[activeStatusFilter]}</Text>
          </Text>
          <TouchableOpacity onPress={() => setActiveStatusFilter("All")}>
            <Text style={styles.resetFilterText}>Clear</Text>
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
              title={loading ? "Loading..." : "No applications found"}
              subtitle={
                loading
                  ? "Please wait..."
                  : isFilterActive || search
                  ? "Try changing your search query or status filter."
                  : "Your applied jobs will show up here."
              }
            />
          }
          ListFooterComponent={
            filteredHistory.length > 0 ? (
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  Showing last 6 months of application history
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("Home")}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

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
              <Text style={styles.modalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#475569" />
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
                      <Ionicons name="checkmark" size={20} color="#0A7B32" />
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
                <Text style={styles.clearFilterText}>Clear Filter</Text>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0A7B32", // green title matching image
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#7C3AED", // purple/pink avatar background
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterBtnActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  filterInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterInfoText: {
    fontSize: 13,
    color: "#64748B",
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },
  listContent: {
    paddingBottom: 100, // padding to clear the FAB
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
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
    backgroundColor: "#F1F5F9",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  companyName: {
    fontSize: 13,
    color: "#64748B",
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
    color: "#64748B",
  },
  footerContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E", // vibrant green FAB
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
    backgroundColor: "#FFFFFF",
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
    color: "#1E293B",
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
    backgroundColor: "#F8FAFC",
  },
  optionItemActive: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#475569",
  },
  optionTextActive: {
    color: "#0A7B32",
    fontWeight: "700",
  },
  clearFilterBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  clearFilterText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
});
