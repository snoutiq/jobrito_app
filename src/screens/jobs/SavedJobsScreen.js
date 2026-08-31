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
  Dimensions,
  PixelRatio,
  Modal,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_NAVY = "#153e69";

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
    return t("status.CONTACTED", "CONTACTED");
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

const getCategoryCardIconDetails = (category, title) => {
  const tStr = (title || "").toLowerCase();
  const cStr = (category || "").toLowerCase();

  if (tStr.includes("chef") || tStr.includes("cook") || cStr.includes("kitchen")) {
    return { icon: "restaurant-outline", bg: "#e0f2fe", color: "#0284c7" };
  }
  if (tStr.includes("barista") || tStr.includes("coffee") || tStr.includes("beverage")) {
    return { icon: "cafe-outline", bg: "#dcfce7", color: "#16a34a" };
  }
  if (tStr.includes("pack") || tStr.includes("helper") || tStr.includes("clean") || tStr.includes("service")) {
    return { icon: "nutrition-outline", bg: "#ffedd5", color: "#ea580c" };
  }
  if (tStr.includes("manager") || tStr.includes("executive") || tStr.includes("lead")) {
    return { icon: "wine-outline", bg: "#f3e8ff", color: "#7e22ce" };
  }
  return { icon: "restaurant-outline", bg: "#e0f2fe", color: "#0284c7" };
};

export default function SavedJobsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const { savedJobs, feedJobs, loading } = useSelector((state) => state.job);
  const { profile } = useSelector((state) => state.user);
  const user = useSelector((state) => state.auth?.user || profile);
  const { history: applicationHistory } = useSelector((state) => state.application);

  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [jobToUnsave, setJobToUnsave] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const userId = user?.id || profile?.id;
      dispatch(fetchSavedJobs(userId));
      dispatch(fetchApplicationHistory(userId));
    }, [dispatch, user?.id, profile?.id])
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

  const handleUnsavePress = (job) => {
    setJobToUnsave(job);
    setShowUnsaveModal(true);
  };

  const confirmUnsaveJob = async () => {
    if (!jobToUnsave) return;
    const target = jobToUnsave;
    setShowUnsaveModal(false);
    setJobToUnsave(null);
    try {
      await dispatch(toggleSaveJob(target.id)).unwrap();
    } catch (error) {
      Alert.alert(t("error", "Error"), error || t("savedJobs.failedToRemove", "Failed to remove job."));
    }
  };

  const handleOpenDetails = (item) => {
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
    navigation.navigate("JobDetails", { jobId: item.id, job: fullJob, isSaved: true });
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
        : "Full-Time");
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
    const normalizedRole = effectiveRole.replace(/[\s_]/g, "");
    const isChefOrJobSeeker = ["chef", "jobseeker", "job_seeker", "talent", "candidate"].includes(normalizedRole);
    const showApply = !isReferral && !isChefOrJobSeeker;

    const app = (applicationHistory || []).find((a) => String(a.jobId) === String(item.id));
    const statusText = app ? getDisplayStatusText(app.status, t) : null;
    const statusColors = app ? getStatusBadgeColors(app.status) : null;

    return (
      <Pressable
        onPress={() => handleOpenDetails(item)}
        style={styles.jobCard}
      >
        <View style={styles.jobHeaderRow}>
          {/* Center Info */}
          <View style={styles.jobInfoColumn}>
            <Text style={styles.jobTitleText} numberOfLines={1}>{item.title}</Text>
            
            {!(item.is_training || item.category === "training" || item._type === "training_opportunity") && (
              <View style={styles.companyNameRow}>
                <Text style={styles.jobCompanyText} numberOfLines={1}>{item.employer || "Sheriff's Kitchen"}</Text>
                <Ionicons name="checkmark-circle" size={normalize(14)} color="#3b82f6" style={{ marginLeft: normalize(4) }} />
              </View>
            )}

            <Text style={styles.jobMetaLocationText} numberOfLines={1}>
              <Ionicons name="location-outline" size={normalize(12)} color="#64748b" />{" "}
              {item.location || "Flexible"} {savedDate ? `• ${savedDate}` : ""}
            </Text>

            {/* Chips Row */}
            <View style={styles.metaChipsRow}>
              <View style={styles.chipPill}>
                <Ionicons name="briefcase-outline" size={normalize(12)} color="#64748b" style={{ marginRight: normalize(4) }} />
                <Text style={styles.chipText}>{jobType}</Text>
              </View>

              {(() => {
                const isTraining = item.is_training || item.category === "training" || item._type === "training_opportunity";
                if (isTraining) return null;

                const rawSal = String(item.salary || "").trim();
                const displaySalary = (!rawSal || rawSal.toLowerCase().includes("stipend"))
                  ? t("bestInIndustry", "Best in Industry")
                  : rawSal;

                return (
                  <View style={styles.chipPill}>
                    <Ionicons name="wallet-outline" size={normalize(12)} color="#64748b" style={{ marginRight: normalize(4) }} />
                    <Text style={styles.chipText}>{displaySalary}</Text>
                  </View>
                );
              })()}

              {jobOpenings > 0 && (
                <View style={styles.chipPill}>
                  <Ionicons name="people-outline" size={normalize(12)} color="#64748b" style={{ marginRight: normalize(4) }} />
                  <Text style={styles.chipText}>{t("openings_count", { count: jobOpenings })}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right Unsave Bookmark Icon */}
          <TouchableOpacity
            onPress={() => handleUnsavePress(item)}
            style={styles.bookmarkRibbonBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="bookmark" size={normalize(22)} color={PRIMARY_NAVY} />
          </TouchableOpacity>
        </View>

        {/* Status Badge if applied */}
        {statusText && (
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
              {statusText}
            </Text>
          </View>
        )}

        {/* Footer Action Button */}
        <View style={styles.cardDivider} />
        <View style={styles.cardFooterRow}>
          {showApply ? (
            <TouchableOpacity
              style={styles.viewDetailsOutlineBtn}
              activeOpacity={0.8}
              onPress={() => handleOpenDetails(item)}
            >
              <Text style={styles.viewDetailsBtnText}>
                {t("jobDetails.viewDetails", "VIEW DETAILS")}
              </Text>
              <Ionicons name="arrow-forward" size={normalize(14)} color={PRIMARY_NAVY} style={{ marginLeft: normalize(6) }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.viewDetailsOutlineBtn, { borderColor: "#ea580c" }]}
              activeOpacity={0.8}
              onPress={() => handleCall(item)}
            >
              <Ionicons name="call-outline" size={normalize(14)} color="#ea580c" style={{ marginRight: normalize(6) }} />
              <Text style={[styles.viewDetailsBtnText, { color: "#ea580c" }]}>
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
      {/* Standard Header Row */}
      <View style={[styles.standardHeader, { paddingTop: insets.top + normalize(6) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={normalize(20)} color="#0f172a" />
          </TouchableOpacity>
          <View style={[styles.headerTextGroup, { alignItems: "center" }]}>
            <Text style={[styles.headerTitleText, { textAlign: "center" }]}>{t("profile.menu.savedJobs", "Saved Jobs")}</Text>
            <Text style={[styles.headerSubtitleText, { textAlign: "center" }]}>{t("savedJobsSubtitle", "Jobs you've saved for later")}</Text>
          </View>
          <View style={{ width: normalize(38) }} />
        </View>
      </View>

      {/* Summary Info Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryCountText}>{savedJobs.length}</Text>{" "}
          {t("savedOpportunities", "Saved Opportunities")}
        </Text>
      </View>

      {/* Saved Jobs List */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={savedJobs}
          keyExtractor={(item) => String(item.id)}
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
              const isTraining =
                selectedJob._type === "training_opportunity" ||
                selectedJob.category === "training" ||
                selectedJob.is_training;
              const payload = {
                jobId: selectedJob.id,
                preferredCallTime: timeSlot,
              };
              if (isTraining) {
                payload.is_training = 1;
              }
              await dispatch(applyJob(payload)).unwrap();

              // Auto-unsave job if it was saved
              const jobKey = String(selectedJob.id);
              const targetSaveId = isTraining
                ? (String(jobKey).startsWith("training_") ? jobKey : `training_${jobKey}`)
                : jobKey;
              try {
                await dispatch(toggleSaveJob(targetSaveId)).unwrap();
              } catch (e) {}

              return true;
            } catch (err) {
              Alert.alert(t("jobDetails.applyError", "Application Error"), err || t("jobDetails.failedToApply", "Failed to apply to job"));
              return false;
            }
          }
          return false;
        }}
      />

      {/* Unsave Confirmation Modal */}
      <Modal
        visible={showUnsaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnsaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowUnsaveModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="bookmark-outline" size={normalize(24)} color="#ea580c" />
            </View>
            
            <Text style={styles.modalTitleText}>
              {t("savedJobs.removeSavedJob", "Remove Saved Job")}
            </Text>

            <Text style={styles.modalSubtitleText}>
              {t("savedJobs.removeConfirm", { title: jobToUnsave?.title || "" }, `Are you sure you want to remove "${jobToUnsave?.title || ""}" from your saved list?`)}
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowUnsaveModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>{t("cancel", "Cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalRemoveBtn]}
                onPress={confirmUnsaveJob}
                activeOpacity={0.8}
              >
                <Text style={styles.modalRemoveBtnText}>{t("remove", "Remove")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Standard Clean Header
  standardHeader: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBackBtn: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    marginRight: normalize(12),
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSubtitleText: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#64748b",
    marginTop: normalize(1),
  },

  // Summary Info Bar
  summaryBar: {
    backgroundColor: "#f8fafc",
    paddingVertical: normalize(2),
    paddingHorizontal: normalize(16),
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryText: {
    fontSize: normalize(13),
    fontWeight: "600",
    color: "#475569",
  },
  summaryCountText: {
    fontWeight: "800",
    color: PRIMARY_NAVY,
    fontSize: normalize(14),
  },

  // List Content
  listContent: {
    paddingHorizontal: normalize(14),
    paddingTop: normalize(6),
    paddingBottom: normalize(100),
  },

  // Job Card
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    padding: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: normalize(10),
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  jobHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  jobInfoColumn: {
    flex: 1,
    marginRight: normalize(8),
  },
  jobTitleText: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(2),
  },
  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(3),
  },
  jobCompanyText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: PRIMARY_NAVY,
  },
  jobMetaLocationText: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#64748b",
    marginBottom: normalize(6),
  },

  // Chips Row
  metaChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
  },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(6),
  },
  chipText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#475569",
  },

  // Bookmark Button
  bookmarkRibbonBtn: {
    padding: normalize(2),
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(20),
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: normalize(6),
  },
  statusBadgeText: {
    fontSize: normalize(10),
    fontWeight: "800",
    textTransform: "uppercase",
  },

  // Footer & Action Button
  cardDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginTop: normalize(8),
    marginBottom: normalize(8),
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  viewDetailsOutlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: PRIMARY_NAVY,
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(8),
  },
  viewDetailsBtnText: {
    color: PRIMARY_NAVY,
    fontSize: normalize(12),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  appliedDisabledBtn: {
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  appliedDisabledBtnText: {
    color: "#94a3b8",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: normalize(20),
  },
  modalCard: {
    width: "100%",
    maxWidth: normalize(320),
    backgroundColor: "#ffffff",
    borderRadius: normalize(20),
    padding: normalize(20),
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalIconWrap: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(12),
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  modalTitleText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: normalize(6),
  },
  modalSubtitleText: {
    fontSize: normalize(13),
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    lineHeight: normalize(18),
    marginBottom: normalize(18),
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: normalize(10),
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: normalize(42),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  modalRemoveBtn: {
    backgroundColor: "#dc2626",
  },
  modalCancelBtnText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#0f172a",
  },
  modalRemoveBtnText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#ffffff",
  },
});
