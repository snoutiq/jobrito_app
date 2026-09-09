import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  BackHandler,
  Dimensions,
  PixelRatio,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { fetchProfile, setUnreadNotificationsCount } from "../../redux/slices/userSlice";
import { getDailyPostLimit } from "../../services/jobApi";
import { getEmployerNotifications } from "../../services/notificationApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";

export default function EmployerHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const unreadNotificationsCount = useSelector(
    (state) => state.user.unreadNotificationsCount
  );
  const { metrics, submittedJobs, loading } = useSelector(
    (state) => state.employer || {}
  );
  const { myJobs } = useSelector((state) => state.job || {});
  const safeJobsArray = Array.isArray(submittedJobs)
    ? submittedJobs
    : Array.isArray(myJobs)
    ? myJobs
    : [];

  const [toastMessage, setToastMessage] = useState("");
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const checkPostLimitAndNavigate = async (targetScreen) => {
    if (checkingLimit) return;
    setCheckingLimit(true);
    try {
      const res = await getDailyPostLimit();
      if (res && res.success && res.can_post_today === false) {
        setToastMessage(
          t("dailyPostLimitComplete", "Daily job post limit completed!")
        );
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

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEmployerDashboard());
      dispatch(fetchProfile());
      getEmployerNotifications("employer")
        .then((res) => {
          const list =
            res?.notifications || res?.data || (Array.isArray(res) ? res : []);
          const unread = list.filter((n) => !n.is_read).length;
          dispatch(setUnreadNotificationsCount(unread));
        })
        .catch(() => null);

      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [dispatch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        dispatch(fetchEmployerDashboard()),
        dispatch(fetchProfile()),
        getEmployerNotifications("employer")
          .then((res) => {
            const list =
              res?.notifications || res?.data || (Array.isArray(res) ? res : []);
            const unread = list.filter((n) => !n.is_read).length;
            dispatch(setUnreadNotificationsCount(unread));
          })
          .catch(() => null),
      ]);
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const contactName =
    profile?.contact_person_name ||
    profile?.contactName ||
    profile?.nominee_name ||
    profile?.full_name ||
    profile?.name ||
    "";
  const rawBusiness =
    profile?.business_name ||
    profile?.businessName ||
    profile?.company ||
    profile?.employer_profile?.business_name ||
    "";
  const businessName = rawBusiness ? rawBusiness.trim() : (contactName || "Employer");

  const rawLocation =
    profile?.country ||
    profile?.employer_profile?.country ||
    profile?.primary_location ||
    profile?.location ||
    profile?.address ||
    profile?.city ||
    (rawBusiness.includes(",") ? rawBusiness.split(",").pop().trim() : "") ||
    safeJobsArray?.[0]?.location ||
    safeJobsArray?.[0]?.country ||
    "";
  const countryName = rawLocation.includes(",")
    ? rawLocation.split(",").pop().trim()
    : rawLocation;

  const getLogoSource = () => {
    const uri =
      profile?.company_logo || profile?.companyLogo || profile?.profile_photo_path;
    if (!uri) return null;
    if (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("file://") ||
      uri.startsWith("data:")
    ) {
      return { uri };
    }
    return {
      uri: `http://178.16.138.159/backend${uri.startsWith("/") ? "" : "/"}${uri}`,
    };
  };

  const logoSource = getLogoSource();

  const newApplicantsCount = metrics?.new ?? 0;
  const totalApplicants = metrics?.total_applicants ?? 0;
  const viewedCount = metrics?.viewed ?? metrics?.viewed_count ?? 0;
  const shortlistedCount = metrics?.shortlisted ?? 0;
  const rejectedCount = metrics?.rejected ?? 0;
  const contactedCount = metrics?.contacted ?? 0;
  const activeJobsCount = metrics?.active_jobs_count ?? 0;
  const pendingJobsCount = metrics?.pending_jobs_count ?? 0;
  const closedJobsCount =
    metrics?.total_closed_jobs ??
    metrics?.closed_jobs_count ??
    metrics?.closed_jobs ??
    metrics?.closed_count ??
    metrics?.closed ??
    0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {logoSource ? (
            <Image source={logoSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business" size={normalize(22)} color="#475569" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.businessName}>
              {businessName || contactName || "Employer"}
            </Text>
            <Text style={styles.contactText} numberOfLines={1}>
              {contactName
                ? `${contactName} • ${t("employer", "Employer")}`
                : t("employer", "Employer")}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("EmployerNotifications")}
          >
            <Ionicons name="notifications-outline" size={normalize(20)} color="#1e293b" />
            {unreadNotificationsCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="person-outline" size={normalize(20)} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366f1"]}
            tintColor="#6366f1"
          />
        }
      >
        {/* Welcome Hero Section */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.welcomeText}>
              Welcome back, {contactName || "Feras"} 👋
            </Text>
            <Text style={styles.heroDashboardTitle}>
              {t("hiringDashboard", "Hiring Dashboard")}
            </Text>
          </View>

          <Image
            source={require("../../assets/employer_dashboard.png")}
            style={styles.heroDashboardImage}
            resizeMode="contain"
          />
        </View>

        {/* 1. TALENT APPLICATIONS CARD */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: "#f5f3ff" }]}>
                <Ionicons name="people-outline" size={normalize(18)} color="#5b46f6" />
              </View>
              <Text style={styles.cardHeaderTitle}>
                {t("talentApplications", "Talent Applications")}
              </Text>
            </View>
          </View>

          <View style={styles.statsGridRow}>
            {/* New Applicant */}
            <View style={styles.gridColItem}>
              <View style={[styles.statIconCircle, { backgroundColor: "#f5f3ff" }]}>
                <Ionicons name="person-add-outline" size={normalize(18)} color="#5b46f6" />
              </View>
              <Text style={[styles.statNumberText, { color: "#4338ca" }]}>
                {newApplicantsCount}
              </Text>
              <Text style={styles.statLine1}>{t("new", "New")}</Text>
              <Text style={styles.statLine2}>{t("applicants", "Applicant")}</Text>
            </View>

            <View style={styles.gridDivider} />

            {/* Viewed Applications */}
            <View style={styles.gridColItem}>
              <View style={[styles.statIconCircle, { backgroundColor: "#eff6ff" }]}>
                <Ionicons name="eye-outline" size={normalize(18)} color="#2563eb" />
              </View>
              <Text style={[styles.statNumberText, { color: "#1d4ed8" }]}>
                {viewedCount}
              </Text>
              <Text style={styles.statLine1}>{t("viewed", "Viewed")}</Text>
              <Text style={styles.statLine2}>{t("applications", "Applications")}</Text>
            </View>

            <View style={styles.gridDivider} />


            {/* Contacted Connected */}
            <View style={styles.gridColItem}>
              <View style={[styles.statIconCircle, { backgroundColor: "#ecfdf5" }]}>
                <Ionicons name="call-outline" size={normalize(18)} color="#10b981" />
              </View>
              <Text style={[styles.statNumberText, { color: "#047857" }]}>
                {contactedCount}
              </Text>
              <Text style={styles.statLine1}>{t("contacted", "Contacted")}</Text>
              <Text style={styles.statLine2}>{t("connected", "Connected")}</Text>
            </View>
             <View style={styles.gridDivider} />

                   {/* Rejected Declined */}
            <View style={styles.gridColItem}>
              <View style={[styles.statIconCircle, { backgroundColor: "#fff7ed" }]}>
                <Ionicons name="close-circle-outline" size={normalize(18)} color="#f97316" />
              </View>
              <Text style={[styles.statNumberText, { color: "#c2410c" }]}>
                {rejectedCount}
              </Text>
              <Text style={styles.statLine1}>{t("rejected", "Rejected")}</Text>
              <Text style={styles.statLine2}>{t("declined", "Declined")}</Text>
            </View>
          </View>
        </View>

        {/* 2. JOB STATUS CARD */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: "#f5f3ff" }]}>
                <Ionicons name="briefcase-outline" size={normalize(18)} color="#5b46f6" />
              </View>
              <Text style={styles.cardHeaderTitle}>{t("jobStatus", "Job Status")}</Text>
            </View>
          </View>

          <View style={styles.statsGridRow}>
            {/* Submitted For Approval */}
            <View style={styles.gridColItem}>
              <View style={[styles.statIconCircle, { backgroundColor: "#fff7ed" }]}>
                <Ionicons name="document-text-outline" size={normalize(18)} color="#ea580c" />
              </View>
              <Text style={[styles.statNumberText, { color: "#c2410c" }]}>
                {pendingJobsCount}
              </Text>
              <Text style={styles.statLine1}>{t("submitted", "Submitted")}</Text>
              <Text style={styles.statLine2}>{t("forApproval", "For Approval")}</Text>
            </View>

            <View style={styles.gridDivider} />

            {/* Active Published */}
            <View style={styles.gridColItem}>
              <View style={[styles.statIconCircle, { backgroundColor: "#eff6ff" }]}>
                <Ionicons name="paper-plane-outline" size={normalize(18)} color="#2563eb" />
              </View>
              <Text style={[styles.statNumberText, { color: "#1d4ed8" }]}>
                {activeJobsCount}
              </Text>
              <Text style={styles.statLine1}>{t("active", "Active")}</Text>
              <Text style={styles.statLine2}>{t("published", "Published")}</Text>
            </View>

            <View style={styles.gridDivider} />

            {/* Closed Completed */}
            <View style={styles.gridColItem}>
              <View style={[styles.statIconCircle, { backgroundColor: "#ecfdf5" }]}>
                <Ionicons name="checkbox-outline" size={normalize(18)} color="#10b981" />
              </View>
              <Text style={[styles.statNumberText, { color: "#047857" }]}>
                {closedJobsCount}
              </Text>
              <Text style={styles.statLine1}>{t("closed", "Closed")}</Text>
              <Text style={styles.statLine2}>{t("completed", "Completed")}</Text>
            </View>
          </View>
        </View>

        {/* 3. QUICK ACTIONS SECTION */}
        <View style={styles.quickActionsHeader}>
          <Ionicons name="flash" size={normalize(16)} color="#5b46f6" style={{ marginRight: 6 }} />
          <Text style={styles.quickActionsTitle}>
            {t("quickActions", "Quick Actions")}
          </Text>
        </View>

        <View style={styles.quickActionsList}>
          {/* Post a Job */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => checkPostLimitAndNavigate("Post Job")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#818cf8" }]}>
              <Ionicons name="document-text-outline" size={normalize(20)} color="#ffffff" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionMainTitle}>{t("postAJob", "Post a Job")}</Text>
              <Text style={styles.actionSubTitle}>
                {t("createOpeningSubtitle", "Create a new opening for your team")}
              </Text>
            </View>
            <View style={[styles.arrowCircleBtn, { backgroundColor: "#f5f3ff" }]}>
              <Ionicons name="arrow-forward" size={normalize(14)} color="#5b46f6" />
            </View>
          </TouchableOpacity>

          {/* My Jobs */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("MyJobs")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#3b82f6" }]}>
              <Ionicons name="briefcase-outline" size={normalize(20)} color="#ffffff" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionMainTitle}>{t("myJobs", "My Jobs")}</Text>
              <Text style={styles.actionSubTitle}>
                {t("manageJobPostingsSubtitle", "Manage your job postings")}
              </Text>
            </View>
            <View style={[styles.arrowCircleBtn, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="arrow-forward" size={normalize(14)} color="#2563eb" />
            </View>
          </TouchableOpacity>

          {/* Chef Connect */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ChefConnectDiscovery")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#10b981" }]}>
              <Ionicons name="people-outline" size={normalize(20)} color="#ffffff" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionMainTitle}>{t("chefConnect", "Chef Connect")}</Text>
              <Text style={styles.actionSubTitle}>
                {t("findChefsSubtitle", "Find hospitality consultants & experts")}
              </Text>
            </View>
            <View style={[styles.arrowCircleBtn, { backgroundColor: "#ecfdf5" }]}>
              <Ionicons name="arrow-forward" size={normalize(14)} color="#059669" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {Boolean(toastMessage) && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(8),
    backgroundColor: "#ffffff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    marginRight: normalize(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  avatarPlaceholder: {
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  businessName: {
    color: "#0f172a",
    fontSize: normalize(14),
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  contactText: {
    color: "#64748b",
    fontSize: normalize(10.5),
    marginTop: 1,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  headerIconBtn: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  notificationDot: {
    position: "absolute",
    top: normalize(5),
    right: normalize(5),
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
    backgroundColor: "#ef4444",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: normalize(12),
    paddingTop: normalize(8),
    paddingBottom: normalize(24),
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(8),
    paddingHorizontal: normalize(2),
  },
  heroLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 1,
  },
  heroDashboardTitle: {
    fontSize: normalize(20),
    fontWeight: "900",
    color: "#1e1b4b",
    letterSpacing: -0.4,
  },
  heroDashboardImage: {
    width: normalize(105),
    height: normalize(70),
    marginLeft: normalize(8),
  },

  /* Card Containers */
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: normalize(10),
    marginBottom: normalize(10),
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(8),
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  cardHeaderIconBox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(6),
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#0f172a",
  },

  /* Stats Grid */
  statsGridRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gridColItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconCircle: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(4),
  },
  statNumberText: {
    fontSize: normalize(15),
    fontWeight: "900",
    marginBottom: 1,
  },
  statLine1: {
    fontSize: normalize(9.5),
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  statLine2: {
    fontSize: normalize(9),
    fontWeight: "500",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 1,
  },
  gridDivider: {
    width: 1.1,
    height: normalize(34),
    backgroundColor: "#cbd5e1",
    marginHorizontal: normalize(1),
  },

  /* Quick Actions */
  quickActionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(10),
    marginBottom: normalize(8),
    paddingHorizontal: normalize(2),
  },
  quickActionsTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#0f172a",
  },
  quickActionsList: {
    gap: normalize(8),
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: normalize(10),
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.015,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconBox: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  actionTextWrap: {
    flex: 1,
  },
  actionMainTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#0f172a",
  },
  actionSubTitle: {
    fontSize: normalize(10.5),
    fontWeight: "500",
    color: "#64748b",
    marginTop: 1,
  },
  arrowCircleBtn: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(13),
    alignItems: "center",
    justifyContent: "center",
  },

  /* Toast */
  toastContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 6,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
