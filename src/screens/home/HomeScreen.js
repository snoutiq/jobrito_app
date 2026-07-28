import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Clipboard,
  Share,
  ActivityIndicator,
  Linking,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { fetchFeedJobs, toggleSaveJob, fetchSavedJobs } from "../../redux/slices/jobSlice";
import { applyJob } from "../../redux/slices/applicationSlice";
import CallbackModal from "../../components/common/CallbackModal";

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { feedJobs, savedJobs, applyingJobId } = useSelector((state) => state.job);
  const [activeFilter, setActiveFilter] = useState("all");
  const [highlightedJobId, setHighlightedJobId] = useState(null);

  // Pull to Refresh State
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchFeedJobs("all")).unwrap(),
        dispatch(fetchSavedJobs()).unwrap(),
      ]);
    } catch (err) {
      console.warn("Pull to refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Modals state
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Favorites, copy link states (local UI feedback overlays)
  const [favorites, setFavorites] = useState({});
  const [copiedJobId, setCopiedJobId] = useState(null);

  useEffect(() => {
    dispatch(fetchFeedJobs("all"));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSavedJobs());
  }, [dispatch]);

  useEffect(() => {
    if (feedJobs) {
      const favs = {};
      feedJobs.forEach((job) => {
        const isSavedInList = (savedJobs || []).some((sj) => String(sj.id) === String(job.id));
        favs[job.id] = job.saved || job.is_saved || isSavedInList || false;
      });
      setFavorites(favs);
    }
  }, [feedJobs, savedJobs]);

  const toggleFavorite = async (id) => {
    const isFav = !favorites[id];
    setFavorites((prev) => ({ ...prev, [id]: isFav }));

    try {
      await dispatch(toggleSaveJob(id)).unwrap();
    } catch (error) {
      // Rollback on error
      setFavorites((prev) => ({ ...prev, [id]: !isFav }));
      Alert.alert(t("error", "Error"), error || t("failedToSaveJob", "Failed to save job."));
    }
  };

  const handleApplyPress = (job) => {
    setSelectedJob(job);
    setShowCallModal(true);
  };

  const copyToClipboard = (jobId) => {
    Clipboard.setString(`https://jobrito.com/jobs/${jobId}`);
    setCopiedJobId(jobId);
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  const handleCall = (job) => {
    const phoneNumber = job.creator?.mobile_number || job.mobile_number || job.phone || "+919876543210";
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      Alert.alert(t("error", "Error"), t("couldNotOpenDialer", "Could not open dialer: ") + err.message);
    });
  };

  const handleShare = async (title, company) => {
    try {
      await Share.share({
        message: `${t("checkOutOpening", "Check out this opening on Jobrito:")} ${title} ${t("at", "at")} ${company}!`,
      });
    } catch (error) {
      Alert.alert(t("unableToShare", "Unable to share"), t("pleaseTryAgain", "Please try again."));
    }
  };

  const formatPostedTime = (postedDate) => {
    if (!postedDate) return t("today", "Today");
    const posted = new Date(postedDate);
    if (Number.isNaN(posted.getTime())) return t("today", "Today");
    const diffMs = Date.now() - posted.getTime();
    const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return t("today", "Today");
    if (diffDays === 1) return t("oneDayAgo", "1 day ago");
    return `${diffDays} ${t("daysAgo", "days ago")}`;
  };

  return (
    <ScreenWrapper contentStyle={styles.content} scroll={false}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/Jobrito Wordmark with Tagline.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="ellipsis-vertical" size={20} color="rgba(10, 5, 4, 0.6)" />
        </TouchableOpacity>
      </View>

      {/* Pagination timeline bar with pin icon */}
      <View style={styles.filterBar}>
        <Ionicons name="pin" size={18} color="#153e69" style={styles.pinIcon} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
          {(feedJobs || []).filter(job => job.is_pinned).map((job, index) => {
            const isSelected = highlightedJobId === job.id;
            return (
              <TouchableOpacity
                key={job.id}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setHighlightedJobId((prev) => (prev === job.id ? null : job.id))}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* JobList feed */}
      <ScrollView
        contentContainerStyle={styles.feedScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#153e69"]}
          />
        }
      >

        {feedJobs.map((job) => {
          const isFav = favorites[job.id] || false;
          const isApplied = job.applied || false;
          const isApplying = applyingJobId === job.id;
          const isCopied = copiedJobId === job.id;
          const isPinned = job.is_pinned || false;
          const isHighlighted = highlightedJobId === job.id;

          // Grand Hyatt and Global Talent are "Apply" jobs. Bombay Cafe is "Call & Share" referral.
          const isReferral = job.category === "referral";
          const hasMultipleActions = job.category === "overseas";

          let roleBorderColor = null;
          const role = job.submitted_by_role?.toLowerCase();
          if (role === "job_seeker" || role === "chef" || role === "talent") {
            roleBorderColor = "#f57f20"; // Orange
          } else if (role === "administrator" || role === "admin") {
            roleBorderColor = "#2e7d32"; // Green
          } else if (role === "employer" || role === "agency") {
            roleBorderColor = "#f2c879"; // Yellow
          }

          return (
            <View
              key={job.id}
              style={[
                styles.card,
                isPinned && styles.pinnedCard,
                roleBorderColor && { borderColor: roleBorderColor, borderWidth: 1.5 },
                isHighlighted && styles.highlightedCard
              ]}
            >
              {/* Pinned label indicator */}
              {isPinned && (
                <View style={styles.pinnedIndicator}>
                  <Ionicons name="pin" size={14} color="#f57f20" style={{ marginRight: 4 }} />
                  <Text style={styles.pinnedLabelText}>Pinned</Text>
                </View>
              )}

              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  {isReferral ? (
                    <Text style={styles.referralHeader}>Referral Job Post</Text>
                  ) : (
                    <Text style={styles.employerName}>{job.company}</Text>
                  )}
                  <Text style={styles.jobTitle}>{job.title}</Text>
                </View>
              </View>

              <View style={styles.detailsBlock}>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={15} color="rgba(10, 5, 4, 0.6)" />
                  <Text style={styles.detailText}>{t("location", "Location")}: {job.location}</Text>
                </View>
                {job.salary && (
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={15} color="rgba(10, 5, 4, 0.6)" />
                    <Text style={styles.detailText}>{t("salary", "Salary")}: {job.salary}</Text>
                  </View>
                )}
                {(() => {
                  const jobExp = job.experience || job.experience_range || job.contract_duration;
                  return jobExp ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={15} color="rgba(10, 5, 4, 0.6)" />
                      <Text style={styles.detailText}>{t("contract", "Contract")}: {jobExp}</Text>
                    </View>
                  ) : null;
                })()}
              </View>

              <Text style={styles.jobDescription}>{job.description}</Text>

              {/* Action buttons rendering */}
              <View style={styles.actionsContainer}>
                {isReferral ? (
                  // Referral Job: Call (Text), Copy Link (Icon), Share (Icon), Favorite (Icon)
                  <>
                    <TouchableOpacity
                      style={styles.textActionBtn}
                      onPress={() => handleCall(job)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.textActionBtnText}>{t("call", "Call")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => copyToClipboard(job.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isCopied ? "checkmark" : "link"}
                        size={18}
                        color={isCopied ? "#2e7d32" : "#153e69"}
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  // Direct/Overseas Job: Apply Now (Text), Call (Icon), Share (Icon), Favorite (Icon)
                  <>
                    <TouchableOpacity
                      style={[styles.textActionBtn, isApplied && styles.textActionBtnApplied]}
                      onPress={() => (isApplied || isApplying ? null : handleApplyPress(job))}
                      disabled={isApplied || isApplying}
                      activeOpacity={0.7}
                    >
                      {isApplying ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={[styles.textActionBtnText, isApplied && styles.textActionBtnTextApplied]}>
                          {isApplied ? "✓ " + t("applied", "Applied") : t("applyNow", "Apply Now")}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => handleCall(job)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={18} color="#153e69" />
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => handleShare(job.title, job.company)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social" size={18} color="#153e69" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => toggleFavorite(job.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isFav ? "star" : "star-outline"}
                    size={18}
                    color={isFav ? "#f2c879" : "#153e69"}
                  />
                </TouchableOpacity>
              </View>

              {job.submitted_by_role ? (
                <Text style={[styles.timeText, roleBorderColor && { color: roleBorderColor, fontWeight: "700" }]}>
                  {job.submitted_by_role.replace("_", " ").toUpperCase()}
                </Text>
              ) : null}
            </View>
          );
        })}

        {/* Bottom Informational Updates Banner */}
        {/* <View style={styles.bottomBanner}>
          <Ionicons name="sync" size={18} color="#153e69" style={{ marginRight: 10 }} />
          <Text style={styles.bottomBannerText}>
            Keep checking the feed regularly for new updates
          </Text>
        </View> */}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("Post Referral Job")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

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
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  logoContainer: {
    width: 140,
    height: 38,
    overflow: "hidden",
    justifyContent: "center",
  },
  headerLogo: {
    width: 150,
    height: 150,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  headerRight: {
    padding: 6,
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  pinIcon: {
    marginRight: 12,
  },
  filterPills: {
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillSelected: {
    backgroundColor: "#153e69",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  filterPillTextSelected: {
    color: "#ffffff",
  },
  feedScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 85,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
  },
  separatorBadge: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  separatorText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pinnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#f57f20",
  },
  highlightedCard: {
    borderColor: "#153e69",
    borderWidth: 2,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    shadowColor: "#153e69",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  pinnedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  pinnedLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f57f20",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  employerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153e69",
    marginBottom: 2,
  },
  referralHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f57f20",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "750",
    color: "#0a0504",
  },
  favBtn: {
    padding: 2,
  },
  detailsBlock: {
    backgroundColor: "#f2f2f3",
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "550",
  },
  jobDescription: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 16,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  textActionBtn: {
    flex: 1,
    height: 40,
    backgroundColor: "#153e69",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#153e69",
  },
  textActionBtnApplied: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  textActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  textActionBtnTextApplied: {
    color: "rgba(10, 5, 4, 0.6)",
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f2f2f3",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.4)",
    textAlign: "right",
    marginTop: 4,
  },
  bottomBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.18)",
    borderRadius: 10,
    padding: 12,
    justifyContent: "center",
    marginTop: 8,
  },
  bottomBannerText: {
    fontSize: 12,
    color: "#153e69",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#153e69",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
    marginBottom: 20,
  },
  slotsList: {
    gap: 10,
    marginBottom: 20,
  },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  slotItemSelected: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  slotLabelTextSelected: {
    color: "#153e69",
    fontWeight: "700",
  },
  modalConfirmBtn: {
    backgroundColor: "#153e69",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 8,
  },
  modalConfirmBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  modalSkipBtn: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSkipBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#153e69",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
