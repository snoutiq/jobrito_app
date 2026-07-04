import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../constants/colors";
import { fetchSavedJobs, toggleSaveJob } from "../../redux/slices/jobSlice";
import CallbackModal from "../../components/common/CallbackModal";
import { applyJob, fetchApplicationHistory } from "../../redux/slices/applicationSlice";

const formatSavedTime = (savedAt) => {
  if (!savedAt) return "Saved recently";
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "Saved recently";
  
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  
  if (diffHours === 0) return "Saved just now";
  if (diffHours < 24) return `Saved ${diffHours}h ago`;
  if (diffDays === 1) return "Saved yesterday";
  if (diffDays < 7) return `Saved ${diffDays}d ago`;
  if (diffDays >= 7 && diffDays < 14) return "Saved 1w ago";
  
  const options = { day: "numeric", month: "short" };
  return `Saved ${date.toLocaleDateString("en-US", options)}`;
};

export default function SavedJobsScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const { savedJobs, feedJobs, loading } = useSelector((state) => state.job);
  const { profile } = useSelector((state) => state.user);
  const { history: applicationHistory } = useSelector((state) => state.application);

  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    dispatch(fetchSavedJobs());
    dispatch(fetchApplicationHistory());
  }, [dispatch]);

  const handleApplyPress = (job) => {
    setSelectedJob(job);
    setShowCallModal(true);
  };

  const handleUnsave = (jobId, jobTitle) => {
    Alert.alert(
      "Remove Saved Job",
      `Are you sure you want to remove "${jobTitle}" from your saved list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(toggleSaveJob(jobId)).unwrap();
              Alert.alert("Removed", "Job removed from saved list.");
            } catch (error) {
              Alert.alert("Error", error || "Failed to remove job.");
            }
          },
        },
      ]
    );
  };

  const displayName = profile?.name && profile.name !== "Guest User" ? profile.name : (profile?.phone || "");
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const renderItem = ({ item }) => {
    const isAppliedInFeed = feedJobs.some((j) => String(j.id) === String(item.id) && j.applied);
    const isAppliedInHistory = (applicationHistory || []).some((app) => String(app.jobId) === String(item.id));
    const isApplied = item.applied || isAppliedInFeed || isAppliedInHistory || false;
    return (
      <View style={styles.card}>
        <Pressable
          onPress={() => {
            const feedJob = feedJobs.find((j) => String(j.id) === String(item.id));
            const fullJob = feedJob || {
              ...item,
              company: item.employer,
              description: "Join our team to grow your career in the hospitality industry. We are looking for dedicated professionals.",
              requirements: [
                "Relevant experience in the required field.",
                "Good teamwork and communication skills.",
                "Willingness to work flexible hours."
              ],
              benefits: [
                "Competitive Pay & Allowances",
                "Complimentary Staff Meals",
                "Professional Training & Development"
              ],
            };
            navigation.navigate("JobDetails", { jobId: item.id, job: fullJob });
          }}
          style={styles.cardPressable}
        >
          {/* Company Logo Avatar */}
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="business-outline" size={24} color="#64748B" />
              </View>
            )}
          </View>

          {/* Details Column */}
          <View style={styles.detailsContainer}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.employer}
            </Text>

            {/* Salary and Location Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={14} color="#94A3B8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.salary || "Competitive Salary"}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color="#94A3B8" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.location || "Flexible"}
                </Text>
              </View>
            </View>

            {/* Footer Row: Apply & Time */}
            <View style={styles.cardFooter}>
              <TouchableOpacity
                onPress={() => handleApplyPress(item)}
                disabled={isApplied}
              >
                <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                  {isApplied ? "✓ Applied" : "Apply Now"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.timeText}>{formatSavedTime(item.savedAt)}</Text>
            </View>
          </View>

          {/* Star Icon (Unsave trigger) */}
          <TouchableOpacity
            onPress={() => handleUnsave(item.id, item.title)}
            style={styles.starContainer}
          >
            <Ionicons name="star" size={22} color="#22C55E" />
          </TouchableOpacity>
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false} edges={["left", "right", "bottom"]} style={styles.container} contentStyle={{ padding: 0 }}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#15803D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Jobs</Text>
        </View>
      </View>

      {/* Summary Info Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {loading
            ? "Loading Saved Opportunities..."
            : `${savedJobs.length} Saved Opportunities`}
        </Text>
      </View>

      {/* Saved Jobs List */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={savedJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={loading ? "Loading..." : "No saved jobs yet"}
              subtitle={
                loading
                  ? "Please wait..."
                  : "Jobs you bookmark will be displayed here for quick access."
              }
            />
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      <CallbackModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={async (timeSlot) => {
          if (selectedJob) {
            try {
              await dispatch(applyJob({ jobId: selectedJob.id, preferredCallTime: timeSlot })).unwrap();
              return true;
            } catch (err) {
              Alert.alert("Application Error", err || "Failed to apply to job");
              return false;
            }
          }
          return false;
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // identical background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
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
    color: "#0F172A",
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
  summaryBar: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  listContent: {
    backgroundColor: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cardPressable: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 18,
    position: "relative",
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
  detailsContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 24, // spacing to avoid overlapping the star icon
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A7B32", // green apply button matching image
  },
  appliedBtnText: {
    color: "#94A3B8",
  },
  timeText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  starContainer: {
    position: "absolute",
    top: 18,
    right: 16,
    padding: 4,
  },
});
