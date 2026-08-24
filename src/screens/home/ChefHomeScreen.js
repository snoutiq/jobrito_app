import React, { useEffect, useState, useRef } from "react";
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
  Dimensions,
  PixelRatio,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));
import {
  fetchFeedJobs,
  toggleSaveJob,
  fetchSavedJobs,
} from "../../redux/slices/jobSlice";
import { applyJob } from "../../redux/slices/applicationSlice";
import { fetchProfile, updateProfile, setUnreadNotificationsCount } from "../../redux/slices/userSlice";
import CallbackModal from "../../components/common/CallbackModal";
import AppLoader from "../../components/common/AppLoader";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEmployerNotifications } from "../../services/notificationApi";
import { getDailyPostLimit } from "../../services/jobApi";

const getCategoryCardIconDetails = (job) => {
  const title = (job?.title || job?.job_title || job?.category || "").toLowerCase();
  if (title.includes("training") || title.includes("program") || title.includes("course") || title.includes("academy")) {
    return { icon: "school-outline", bg: "#f3e8ff", color: "#7e22ce" };
  }
  if (title.includes("barista") || title.includes("cafe") || title.includes("coffee") || title.includes("beverage")) {
    return { icon: "cafe-outline", bg: "#dcfce7", color: "#15803d" };
  }
  if (title.includes("chef") || title.includes("cook") || title.includes("baker") || title.includes("kitchen")) {
    return { icon: "restaurant-outline", bg: "#ffedd5", color: "#c2410c" };
  }
  if (title.includes("housekeeping") || title.includes("supervisor") || title.includes("resort") || title.includes("hotel") || title.includes("manager")) {
    return { icon: "business-outline", bg: "#f3e8ff", color: "#6b21a8" };
  }
  return { icon: "briefcase-outline", bg: "#e0f2fe", color: "#0369a1" };
};

export default function ChefHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [toastMessage, setToastMessage] = useState("");
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [activeTab, setActiveTab] = useState("live"); // "live" or "pinned"

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
  const scrollViewRef = useRef(null);
  const jobPositions = useRef({});

  const unreadNotificationsCount = useSelector((state) => state.user.unreadNotificationsCount);

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
          dispatch(setUnreadNotificationsCount(unread));
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
        const jobIdStr = String(job.id);
        const isSavedInList = (savedJobs || []).some((sj) => {
          const sjId = String(sj.id);
          return (
            sjId === jobIdStr ||
            sjId === `training_${jobIdStr}` ||
            String(sj.job_post_id) === jobIdStr
          );
        });
        favs[job.id] = job.saved || job.is_saved || isSavedInList || false;
      });
      setFavorites(favs);
    }
  }, [feedJobs, savedJobs]);

  const toggleFavorite = async (jobOrId) => {
    const job =
      typeof jobOrId === "object"
        ? jobOrId
        : feedJobs.find((j) => String(j.id) === String(jobOrId));
    const rawId = job ? job.id : jobOrId;
    const isTraining =
      job &&
      (job.is_training ||
        job._type === "training_opportunity" ||
        job.category === "training" ||
        job.type === "training");

    let targetSaveId = rawId;
    if (isTraining) {
      if (!String(rawId).startsWith("training_")) {
        targetSaveId =
          job?.job_post_id ||
          (job?.training_id
            ? `training_${job.training_id}`
            : `training_${rawId}`);
      }
    }

    const keyStr = String(rawId);
    const isFav = !favorites[keyStr];
    setFavorites((prev) => ({ ...prev, [keyStr]: isFav }));

    try {
      await dispatch(toggleSaveJob(targetSaveId)).unwrap();
    } catch (error) {
      // Rollback on error
      setFavorites((prev) => ({ ...prev, [keyStr]: !isFav }));
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

      {/* Sub Header Tabs */}
      <View style={styles.tabsHeaderRow}>
        <TouchableOpacity
          style={[styles.tabHeaderItem, activeTab === "live" && styles.tabHeaderItemActive]}
          onPress={() => setActiveTab("live")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabHeaderLabel, activeTab === "live" && styles.tabHeaderLabelActive]}>
            {t("liveJobFeed", "Live Job Feed")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabHeaderItem, activeTab === "pinned" && styles.tabHeaderItemActive]}
          onPress={() => setActiveTab("pinned")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabHeaderLabel, activeTab === "pinned" && styles.tabHeaderLabelActive]}>
            {t("priorityPinnedJobs", "Priority Pinned Jobs")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* JobList feed */}
      <ScrollView
        ref={scrollViewRef}
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
        {/* Top Info Banner */}
        {activeTab === "live" ? (
          <View style={styles.topInfoBanner}>
            <Ionicons name="information-circle-outline" size={normalize(18)} color="#2563eb" style={{ marginRight: normalize(8) }} />
            <Text style={styles.topInfoBannerText}>
              {t("realTimeOpportunities", "Real-time opportunities from employers and community referrals.")}
            </Text>
          </View>
        ) : (
          <View style={[styles.topInfoBanner, { backgroundColor: "#fff7ed", borderColor: "#ffedd5" }]}>
            <Ionicons name="shield-checkmark-outline" size={normalize(18)} color="#ea580c" style={{ marginRight: normalize(8) }} />
            <Text style={[styles.topInfoBannerText, { color: "#c2410c" }]}>
              {t("pinnedJobsNotice", "Pinned jobs are priority jobs set by the Jobrito team.")}
            </Text>
          </View>
        )}

        {(feedJobs || [])
          .filter((job) => (activeTab === "pinned" ? job.is_pinned : true))
          .map((job) => {
            const isFav = favorites[job.id] || false;
            const isApplied = job.applied || false;
            const isApplying = applyingJobId === job.id;
            const isPinned = job.is_pinned || false;
            const isTraining = job._type === "training_opportunity" || (job.title || "").toLowerCase().includes("training");
            const isReferral = job.category === "referral";

            const effectiveRoleSource = job.creator?.active_role || "";
            const effectiveRole = effectiveRoleSource.toLowerCase();
            const normalizedRole = effectiveRole.replace(/[\s_]/g, "");
            const isChefOrJobSeeker = ["chef", "jobseeker"].includes(normalizedRole);
            const showApply = !isReferral && !isChefOrJobSeeker;

            const iconConfig = getCategoryCardIconDetails(job);

            return (
              <View key={job.id} style={styles.modernJobCard}>
                {/* Main Card Content Row */}
                <View style={styles.cardTopRow}>
                  {/* Category Icon Box on Left */}
                  <View style={[styles.cardIconBox, { backgroundColor: iconConfig.bg }]}>
                    <Ionicons name={iconConfig.icon} size={normalize(22)} color={iconConfig.color} />
                  </View>

                  {/* Main Details Column */}
                  <View style={styles.cardMainContent}>
                    {isPinned && (
                      <View style={styles.pinnedTagRow}>
                        <Ionicons name="pin" size={normalize(12)} color="#f57f20" style={{ marginRight: 3 }} />
                        <Text style={styles.pinnedTagText}>Pinned</Text>
                      </View>
                    )}

                    <Text style={styles.cardJobTitle} numberOfLines={1}>
                      {job.title}
                    </Text>

                    <Text style={styles.cardCompanyName} numberOfLines={1}>
                      {job.company || (isReferral ? t("referredByCommunity", "Referred by Community Member") : t("jobritoEmployer", "Employer"))}
                    </Text>

                    <View style={styles.cardLocationRow}>
                      <Ionicons name="location-outline" size={normalize(13)} color="rgba(10, 5, 4, 0.55)" style={{ marginRight: 3 }} />
                      <Text style={styles.cardLocationText} numberOfLines={1}>
                        {job.location}
                      </Text>
                    </View>
                  </View>

                  {/* Top Right Type Badge */}
                  <View style={[styles.cardTypeBadge, isTraining && { backgroundColor: "#f3e8ff" }]}>
                    <Text style={[styles.cardTypeBadgeText, isTraining && { color: "#7e22ce" }]}>
                      {String(job.job_type || job.type || (isTraining ? "Training Program" : "Full-time"))}
                    </Text>
                  </View>
                </View>

                {/* Inner Banner for Training Cards */}
                {isTraining && (
                  <View style={styles.cardInnerBanner}>
                    <View style={styles.cardInnerBannerIconCircle}>
                      <Ionicons name="school" size={normalize(16)} color="#7e22ce" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardInnerBannerTitle}>Build your skills. Boost your career.</Text>
                      <Text style={styles.cardInnerBannerSub}>Join our certified training program designed for hospitality professionals.</Text>
                    </View>
                  </View>
                )}

                {/* Horizontal Card Divider */}
                <View style={styles.cardDividerLine} />

                {/* Card Footer Actions Row */}
                <View style={styles.cardFooterRow}>
                  {/* Left: Posted By */}
                  <View style={styles.postedByCol}>
                    <Ionicons
                      name={isReferral ? "people-outline" : isTraining ? "school-outline" : "business-outline"}
                      size={normalize(14)}
                      color="#2563eb"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.postedByText} numberOfLines={1}>
                      Posted by: <Text style={styles.postedByBold}>{isReferral ? "Referral" : isTraining ? "Jobrito Academy" : "Employer"}</Text>
                    </Text>
                  </View>

                  {/* Right: Action Buttons */}
                  <View style={styles.cardActionGroup}>
                    <TouchableOpacity
                      style={styles.cardNavyBtn}
                      onPress={() => navigation.navigate("JobDetails", { jobId: job.id, job })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cardNavyBtnText}>{isTraining ? "VIEW DETAILS" : "VIEW JOB"}</Text>
                    </TouchableOpacity>

                    {showApply ? (
                      <TouchableOpacity
                        style={[styles.cardOutlineBtn, isApplied && styles.cardAppliedBtn]}
                        onPress={() => isApplied || isApplying ? null : handleApplyPress(job)}
                        disabled={isApplied || isApplying}
                        activeOpacity={0.8}
                      >
                        {isApplying ? (
                          <ActivityIndicator size="small" color="#153e69" />
                        ) : (
                          <Text style={[styles.cardOutlineBtnText, isApplied && styles.cardAppliedBtnText]}>
                            {isApplied ? "✓ APPLIED" : "APPLY NOW"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.cardOutlineBtn}
                        onPress={() => handleCall(job)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="call-outline" size={normalize(13)} color="#153e69" style={{ marginRight: 3 }} />
                        <Text style={styles.cardOutlineBtnText}>CALL</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.cardSquareIconBtn}
                      onPress={() => handleShare(job.title, job.company, job.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="share-social-outline" size={normalize(16)} color="#153e69" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardSquareIconBtn}
                      onPress={() => toggleFavorite(job.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isFav ? "bookmark" : "bookmark-outline"}
                        size={normalize(16)}
                        color="#153e69"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* Floating Action Button with Referral Tooltip */}
      <View style={styles.fabContainerWrapper}>
        <View style={styles.fabTooltipCard}>
          <Text style={styles.fabTooltipTitle}>{t("postJobAsReferral", "Post a Job as Referral")}</Text>
          <Text style={styles.fabTooltipSub}>{t("oneJobPerDay", "1 job per day")}</Text>
        </View>
        <TouchableOpacity
          style={styles.fabBtnCircle}
          onPress={() => checkPostLimitAndNavigate("Post Referral Job")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={normalize(26)} color="#ffffff" />
        </TouchableOpacity>
      </View>ity>

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
              const payload = {
                jobId: selectedJob.id,
                preferredCallTime: timeSlot,
              };
              if (selectedJob._type === "training_opportunity") {
                payload.is_training = 1;
              }
              await dispatch(
                applyJob(payload),
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
    padding: normalize(6),
  },
  headerNotificationBtn: {
    padding: normalize(6),
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: normalize(4),
    right: normalize(4),
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: "#f57f20",
  },

  // Sub Header Tabs
  tabsHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabHeaderItem: {
    flex: 1,
    paddingVertical: normalize(14),
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabHeaderItemActive: {
    borderBottomColor: "#153e69",
  },
  tabHeaderLabel: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: "#64748b",
  },
  tabHeaderLabelActive: {
    color: "#153e69",
    fontWeight: "800",
  },

  // Top Info Banner
  topInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    marginVertical: normalize(12),
  },
  topInfoBannerText: {
    flex: 1,
    fontSize: normalize(13),
    fontWeight: "600",
    color: "#1e40af",
    lineHeight: normalize(17),
  },

  // Modern Job Card
  modernJobCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    padding: normalize(14),
    marginBottom: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(12),
  },
  cardIconBox: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  cardMainContent: {
    flex: 1,
  },
  pinnedTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(2),
  },
  pinnedTagText: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#ea580c",
  },
  cardJobTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(2),
  },
  cardCompanyName: {
    fontSize: normalize(13),
    fontWeight: "600",
    color: "#475569",
    marginBottom: normalize(4),
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLocationText: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#64748b",
  },
  cardTypeBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(12),
    alignSelf: "flex-start",
  },
  cardTypeBadgeText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#475569",
  },

  // Inner Banner for Training Cards
  cardInnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    borderRadius: normalize(10),
    padding: normalize(10),
    marginTop: normalize(10),
    gap: normalize(10),
  },
  cardInnerBannerIconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInnerBannerTitle: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#6b21a8",
  },
  cardInnerBannerSub: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#7e22ce",
    lineHeight: normalize(14),
  },

  // Card Divider & Footer
  cardDividerLine: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: normalize(12),
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: normalize(8),
  },
  postedByCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postedByText: {
    fontSize: normalize(11),
    color: "#64748b",
  },
  postedByBold: {
    fontWeight: "800",
    color: "#0f172a",
  },
  cardActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  cardNavyBtn: {
    backgroundColor: "#153e69",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    alignItems: "center",
    justifyContent: "center",
  },
  cardNavyBtnText: {
    color: "#ffffff",
    fontSize: normalize(11),
    fontWeight: "800",
  },
  cardOutlineBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#153e69",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardOutlineBtnText: {
    color: "#153e69",
    fontSize: normalize(11),
    fontWeight: "800",
  },
  cardAppliedBtn: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  cardAppliedBtnText: {
    color: "#64748b",
  },
  cardSquareIconBtn: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  // FAB Container & Tooltip
  fabContainerWrapper: {
    position: "absolute",
    bottom: normalize(20),
    right: normalize(16),
    alignItems: "flex-end",
  },
  fabTooltipCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    marginBottom: normalize(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabTooltipTitle: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#153e69",
  },
  fabTooltipSub: {
    fontSize: normalize(10),
    fontWeight: "600",
    color: "#64748b",
  },
  fabBtnCircle: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
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