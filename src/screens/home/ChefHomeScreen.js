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
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import {
  fetchFeedJobs,
  toggleSaveJob,
  fetchSavedJobs,
} from "../../redux/slices/jobSlice";
import { applyJob } from "../../redux/slices/applicationSlice";
import { fetchProfile, updateProfile } from "../../redux/slices/userSlice";
import CallbackModal from "../../components/common/CallbackModal";
import AppLoader from "../../components/common/AppLoader";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEmployerNotifications } from "../../services/notificationApi";
import { getDailyPostLimit } from "../../services/jobApi";

export default function ChefHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [toastMessage, setToastMessage] = useState("");
  const [checkingLimit, setCheckingLimit] = useState(false);

  const checkPostLimitAndNavigate = async (targetScreen) => {
    if (checkingLimit) return;
    setCheckingLimit(true);
    try {
      const res = await getDailyPostLimit();
      if (res && res.success && res.can_post_today === false) {
        setToastMessage(t("dailyPostLimitComplete", "Daily job post limit completed!"));
        setTimeout(() => {
          setToastMessage("");
        }, 1000);
      } else {
        navigation.navigate(targetScreen);
      }
    } catch (err) {
      console.warn("Failed to check daily post limit:", err);
      navigation.navigate(targetScreen);
    } finally {
      setCheckingLimit(false);
    }
  };

  const { feedJobs, savedJobs, applyingJobId } = useSelector(
    (state) => state.job,
  );
  const { profile } = useSelector((state) => state.user);

  const [activeFilter, setActiveFilter] = useState("all");
  const [highlightedJobId, setHighlightedJobId] = useState(null);

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = navigation.addListener("focus", async () => {
      try {
        await dispatch(fetchProfile()).unwrap();
      } catch (err) {
        console.warn("Failed to fetch profile in background:", err);
      }

      // Fetch notifications count
      try {
        const res = await getEmployerNotifications("chef");
        const list = res?.notifications || res?.data || (Array.isArray(res) ? res : []);
        const unread = list.filter((n) => !n.is_read).length;
        if (active) {
          setUnreadNotificationsCount(unread);
        }
      } catch (err) {
        console.warn("Failed to fetch notifications on focus:", err);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigation, dispatch]);

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
        const isSavedInList = (savedJobs || []).some(
          (sj) => String(sj.id) === String(job.id),
        );
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
      Alert.alert(
        t("error", "Error"),
        error || t("failedToSaveJob", "Failed to save job."),
      );
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
    const phoneNumber =
      job.creator?.mobile_number ||
      job.mobile_number ||
      job.phone ||
      "+919876543210";
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      Alert.alert(
        t("error", "Error"),
        t("couldNotOpenDialer", "Could not open dialer: ") + err.message,
      );
    });
  };

  const handleShare = async (title, company) => {
    try {
      await Share.share({
        message: `${t("checkOutOpening", "Check out this opening on Jobrito:")} ${title} ${t("at", "at")} ${company}!`,
      });
    } catch (error) {
      Alert.alert(
        t("unableToShare", "Unable to share"),
        t("pleaseTryAgain", "Please try again."),
      );
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={styles.headerNotificationBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("EmployerNotifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color="rgba(10, 5, 4, 0.6)"
            />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => navigation.navigate("ChefProfile")}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color="rgba(10, 5, 4, 0.6)"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pagination timeline bar with pin icon */}
      <View style={styles.filterBar}>
        <Ionicons name="pin" size={18} color="#153e69" style={styles.pinIcon} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPills}
        >
          {(feedJobs || [])
            .filter((job) => job.is_pinned)
            .map((job, index) => {
              const isSelected = highlightedJobId === job.id;
              return (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillSelected,
                  ]}
                  onPress={() =>
                    setHighlightedJobId((prev) =>
                      prev === job.id ? null : job.id,
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextSelected,
                    ]}
                  >
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

          // --- UPDATED ROLE LOGIC (fallback across submitted_by_role / posted_by_role / active_role / user_role, normalized) ---
          const effectiveRoleSource =
            job.submitted_by_role ||
            job.posted_by_role ||
            job.active_role ||
            job.user_role ||
            "";
          const effectiveRole = effectiveRoleSource.toLowerCase();
          const normalizedRole = effectiveRole.replace(/[\s_]/g, ""); // "job_seeker" -> "jobseeker"
          const isChefOrJobSeeker = ["chef", "jobseeker"].includes(normalizedRole);
          const showApply = !isReferral && !isChefOrJobSeeker;

          let roleBorderColor = null;
          if (["jobseeker", "chef", "talent"].includes(normalizedRole)) {
            roleBorderColor = "#f57f20"; // Orange
          } else if (["administrator", "admin"].includes(normalizedRole)) {
            roleBorderColor = "#2e7d32"; // Green
          } else if (["employer", "agency"].includes(normalizedRole)) {
            roleBorderColor = "#f2c879"; // Yellow
          }
          // --- END OF UPDATED ROLE LOGIC ---

          return (
            <View
              key={job.id}
              style={[
                styles.card,
                roleBorderColor && {
                  borderLeftColor: roleBorderColor,
                  borderLeftWidth: 4,
                },
                isHighlighted && styles.highlightedCard,
              ]}
            >
              {/* Pinned label indicator */}
              {isPinned && (
                <View style={styles.pinnedIndicator}>
                  <Ionicons
                    name="pin"
                    size={14}
                    color="#f57f20"
                    style={{ marginRight: 4 }}
                  />
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
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color="rgba(10, 5, 4, 0.6)"
                  />
                  <Text style={styles.detailText}>
                    {t("location", "Location")}: {job.location}
                  </Text>
                </View>
                {job.salary && (
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="cash-outline"
                      size={15}
                      color="rgba(10, 5, 4, 0.6)"
                    />
                    <Text style={styles.detailText}>
                      {t("salary", "Salary")}: {job.salary}
                    </Text>
                  </View>
                )}
                {(() => {
                  const jobExp =
                    job.experience ||
                    job.experience_range ||
                    job.contract_duration;
                  return jobExp ? (
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={15}
                        color="rgba(10, 5, 4, 0.6)"
                      />
                      <Text style={styles.detailText}>
                        {t("contract", "Contract")}: {jobExp}
                      </Text>
                    </View>
                  ) : null;
                })()}
              </View>

              <Text style={styles.jobDescription}>{job.description}</Text>

              {/* Action buttons rendering */}
              <View style={styles.actionsContainer}>
                {showApply ? (
                  // employer/admin/agency: Apply Now only (no Call)
                  <TouchableOpacity
                    style={[
                      styles.textActionBtn,
                      isApplied && styles.textActionBtnApplied,
                    ]}
                    onPress={() =>
                      isApplied || isApplying ? null : handleApplyPress(job)
                    }
                    disabled={isApplied || isApplying}
                    activeOpacity={0.7}
                  >
                    {isApplying ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text
                        style={[
                          styles.textActionBtnText,
                          isApplied && styles.textActionBtnTextApplied,
                        ]}
                      >
                        {isApplied
                          ? "✓ " + t("applied", "Applied")
                          : t("applyNow", "Apply Now")}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  // chef/job_seeker/talent/referral: Call button (same size as Apply)
                  <TouchableOpacity
                    style={[styles.textActionBtn, { flexDirection: "row", gap: 6 }]}
                    onPress={() => handleCall(job)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call" size={16} color="#ffffff" />
                    <Text style={styles.textActionBtnText}>Call Now</Text>
                  </TouchableOpacity>
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

              {/* --- UPDATED LABEL LOGIC (uses effectiveRoleSource fallback) --- */}
              {effectiveRoleSource ? (
                <View
                  style={[
                    styles.poweredRibbon,
                    roleBorderColor && { borderColor: roleBorderColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.poweredRibbonText,
                      roleBorderColor && { color: roleBorderColor },
                    ]}
                  >
                    Posted By •{" "}
                    {(() => {
                      const roleDisplay = effectiveRoleSource.replace(/_/g, " ").toLowerCase();
                      if (roleDisplay === "jobseeker" || roleDisplay === "job seeker") return "TALENT";
                      return roleDisplay.toUpperCase();
                    })()}
                  </Text>
                </View>
              ) : null}
              {/* --- END OF UPDATED LABEL LOGIC --- */}
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
        onPress={() => checkPostLimitAndNavigate("Post Referral Job")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {Boolean(toastMessage) && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <CallbackModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={async (timeSlot) => {
          if (selectedJob) {
            try {
              await dispatch(
                applyJob({
                  jobId: selectedJob.id,
                  preferredCallTime: timeSlot,
                }),
              ).unwrap();
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
    width: 120,
    height: 120,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  headerRight: {
    padding: 6,
  },
  headerNotificationBtn: {
    padding: 6,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f57f20",
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
    elevation: 6,
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
  inputGroup: {
    marginBottom: 12,
    width: "100%",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#153e69",
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#0a0504",
    backgroundColor: "#ffffff",
    fontSize: 13,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    width: "100%",
  },
  modalCloseBtn: {
    padding: 4,
    marginRight: -4,
  },
  genderSelectRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "rgba(10, 5, 4, 0.1)",
    borderRadius: 3,
    marginVertical: 12,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#153e69",
    borderRadius: 3,
  },
  photoUploadCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f2f2f3",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginVertical: 16,
  },
  photoUploadImage: {
    width: "100%",
    height: "100%",
  },
  genderSelectBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  genderSelectBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  genderSelectText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  genderSelectTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  experienceOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  experienceOptionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    backgroundColor: "#ffffff",
  },
  experienceOptionBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  experienceOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  experienceOptionTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  jobTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  jobTypeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  jobTypeBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  jobTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  jobTypeTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  locationPreferenceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  locationPreferenceBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  locationPreferenceBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  locationPreferenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  locationPreferenceTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  splashLogoImage: {
    width: 350,
    height: 150,
    alignSelf: "center",
    marginBottom: 20,
  },
  poweredRibbon: {
  alignSelf: "flex-end",
  marginTop: 10,
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 20,
  backgroundColor: "#fff",
},

poweredRibbonText: {
    fontSize: 8,
    fontStyle: "italic",
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#153e69",
    textTransform: "uppercase",
  },
  toastContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(10, 5, 4, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});