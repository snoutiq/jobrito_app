import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useTranslation } from "react-i18next";
import EmptyState from "../../components/common/EmptyState";
import colors from "../../constants/colors";
import { fetchSavedJobs, toggleSaveJob } from "../../redux/slices/jobSlice";
import CallbackModal from "../../components/common/CallbackModal";
import { applyJob, fetchApplicationHistory } from "../../redux/slices/applicationSlice";

const PRIMARY_GREEN = "#153e69";

const formatSavedTime = (dateStr, t) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  
  if (diffHours === 0) return t("savedJobs.justNow", "Saved just now");
  if (diffHours < 24) return t("savedJobs.hoursAgo", "Saved {{count}}h ago", { count: diffHours });
  if (diffDays === 1) return t("savedJobs.yesterday", "Saved yesterday");
  if (diffDays < 7) return t("savedJobs.daysAgo", "Saved {{count}}d ago", { count: diffDays });
  if (diffDays >= 7 && diffDays < 14) return t("savedJobs.weeksAgo", "Saved 1w ago");
  
  const options = { day: "numeric", month: "short" };
  return t("savedJobs.onDate", "Saved {{date}}", { date: date.toLocaleDateString("en-US", options) });
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

export default function SavedJobsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const { savedJobs, feedJobs, loading } = useSelector((state) => state.job);
  const { profile } = useSelector((state) => state.user);
  const { history: applicationHistory } = useSelector((state) => state.application);

  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchSavedJobs());
      dispatch(fetchApplicationHistory());
    }, [dispatch])
  );

  const handleCall = (job) => {
    const phoneNumber =
      job.creator?.mobile_number ||
      job.mobile_number ||
      job.phone ||
      job.contact_phone ||
      job.creator?.phone ||
      "";
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      Alert.alert(
        t("error", "Error"),
        (t("couldNotOpenDialer", "Could not open dialer: ") || "Could not open dialer: ") + err.message,
      );
    });
  };

  const handleApplyPress = (job) => {
    setSelectedJob(job);
    setShowCallModal(true);
  };

  const handleUnsave = (jobId, jobTitle) => {
    Alert.alert(
      t("savedJobs.removeSavedJob", "Remove Saved Job"),
      t("savedJobs.removeConfirm", { title: jobTitle }, `Are you sure you want to remove "${jobTitle}" from your saved list?`),
      [
        { text: t("cancel", "Cancel"), style: "cancel" },
        {
          text: t("remove", "Remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(toggleSaveJob(jobId)).unwrap();
              Alert.alert(t("removed", "Removed"), t("savedJobs.removedMsg", "Job removed from saved list."));
            } catch (error) {
              Alert.alert(t("error", "Error"), error || t("savedJobs.failedToRemove", "Failed to remove job."));
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isAppliedInFeed = feedJobs.some((j) => String(j.id) === String(item.id) && j.applied);
    const isAppliedInHistory = (applicationHistory || []).some((app) => String(app.jobId) === String(item.id));
    const isApplied = item.applied || isAppliedInFeed || isAppliedInHistory || false;
    
    const jobOpenings = item.open_positions ?? item.openings ?? 0;
    const jobType =
      item.job_type ??
      item.type ??
      (item.is_training || item.category === "training"
        ? "Training / Program"
        : "Full-time");
    const savedDate = formatSavedTime(item.savedAt, t);

    const isReferral = item.category === "referral" || item.is_referral;
    const effectiveRoleSource =
      item.submitted_by_role ||
      item.posted_by_role ||
      item.active_role ||
      item.user_role ||
      item.creator?.role ||
      item.creator?.active_role ||
      "";
    const effectiveRole = effectiveRoleSource.toLowerCase();
    const normalizedRole = effectiveRole.replace(/[\s_]/g, ""); // "job_seeker" -> "jobseeker"
    const isChefOrJobSeeker = ["chef", "jobseeker", "job_seeker", "talent", "candidate"].includes(normalizedRole);
    const showApply = !isReferral && !isChefOrJobSeeker;

    const app = (applicationHistory || []).find((a) => String(a.jobId) === String(item.id));
    const statusText = app ? getDisplayStatusText(app.status, t) : null;
    const statusColors = app ? getStatusBadgeColors(app.status) : null;

    return (
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
                {item.location || "Flexible"} • {savedDate}
              </Text>
            </View>
          </View>

          {statusText && (
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border, marginRight: 6 }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                {statusText}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => handleUnsave(item.id, item.title)}
            style={styles.starBtn}
          >
            <Ionicons name="star" size={22} color="#153e69" />
          </TouchableOpacity>
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
          {item.salary ? (
            <Text style={styles.detailsText}>
              <Ionicons name="card-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
              {item.salary}
            </Text>
          ) : null}
        </View>

        <View style={styles.divider} />
        <View style={styles.actionsRow}>
          {showApply ? (
            <TouchableOpacity
              style={[styles.applyBtn, isApplied && styles.appliedBtn]}
              disabled={isApplied}
              activeOpacity={0.8}
              onPress={() => handleApplyPress(item)}
            >
              <Text style={[styles.applyBtnText, isApplied && styles.appliedBtnText]}>
                {isApplied ? t("jobDetails.applied", "✓ Applied") : t("jobDetails.applyNow", "Apply Now")}
              </Text>
              {!isApplied && (
                <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: "#f57f20" }]}
              activeOpacity={0.8}
              onPress={() => handleCall(item)}
            >
              <Ionicons name="call" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>
                {t("jobs.callNow", "Call Now")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper scroll={false} edges={["left", "right", "bottom"]} style={styles.container} contentStyle={{ padding: 0 }}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#153e69" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("savedJobs.title", "Saved Jobs")}</Text>
        </View>
      </View>

      {/* Summary Info Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {loading
            ? t("savedJobs.loadingOps", "Loading Saved Opportunities...")
            : t("savedJobs.opportunitiesCount", { count: savedJobs.length }, `${savedJobs.length} Saved Opportunities`)}
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
              title={loading ? t("loading", "Loading...") : t("savedJobs.noSavedYet", "No saved jobs yet")}
              subtitle={
                loading
                  ? t("pleaseWait", "Please wait...")
                  : t("savedJobs.bookmarkInstruction", "Jobs you bookmark will be displayed here for quick access.")
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
              await dispatch(fetchSavedJobs());
              await dispatch(fetchApplicationHistory());
              return true;
            } catch (err) {
              Alert.alert(t("jobDetails.applyError", "Application Error"), err || t("jobDetails.failedToApply", "Failed to apply to job"));
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
    backgroundColor: "#f2f2f3", // matching background color
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
  summaryBar: {
    backgroundColor: "#f2f2f3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
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
  starBtn: {
    padding: 4,
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
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#153e69",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  appliedBtn: {
    backgroundColor: "rgba(10, 5, 4, 0.2)",
  },
  applyBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  appliedBtnText: {
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
});
