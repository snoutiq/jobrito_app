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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { setUnreadNotificationsCount } from "../../redux/slices/userSlice";
import { getDailyPostLimit } from "../../services/jobApi";
import { getEmployerNotifications } from "../../services/notificationApi";

const PRIMARY_GREEN = "#153e69";

export default function EmployerHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const unreadNotificationsCount = useSelector((state) => state.user.unreadNotificationsCount);
  const { metrics, submittedJobs, loading } = useSelector((state) => state.employer || {});
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

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEmployerDashboard());
      getEmployerNotifications("employer")
        .then((res) => {
          const list = res?.notifications || res?.data || (Array.isArray(res) ? res : []);
          const unread = list.filter((n) => !n.is_read).length;
          dispatch(setUnreadNotificationsCount(unread));
        })
        .catch(() => null);

      const onBackPress = () => {
        // Exit the app directly when back is pressed on the Employer Home Screen
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
      const res = dispatch(fetchEmployerDashboard());
      if (res.unwrap) await res.unwrap();
      else if (res.then) await res;
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
  const cleanBusiness = rawBusiness.includes(",")
    ? rawBusiness.split(",")[0].trim()
    : rawBusiness;
  const businessName =
    cleanBusiness.length > 18 ? `${cleanBusiness.slice(0, 18).trim()}...` : cleanBusiness;

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

  const mobileNumber =
    profile?.mobile_number || profile?.phone || profile?.contact_number || "";

  const getLogoSource = () => {
    const uri = profile?.company_logo || profile?.companyLogo || profile?.profile_photo_path;
    if (!uri) return null;
    if (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("file://") ||
      uri.startsWith("data:")
    ) {
      return { uri };
    }
    return { uri: `http://178.16.138.159/backend${uri.startsWith("/") ? "" : "/"}${uri}` };
  };

  const logoSource = getLogoSource();

  const totalApplicants = metrics?.total_applicants ?? 0;
  const shortlistedCount = metrics?.shortlisted ?? 0;
  const rejectedCount = metrics?.rejected ?? 0;
  const contactedCount = metrics?.contacted ?? 0;
  const activeJobsCount = metrics?.active_jobs_count ?? 0;
  const pendingJobsCount = metrics?.pending_jobs_count ?? 0;
  const totalSavedCount =
    metrics?.total_saved_count ??
    metrics?.saved_count ??
    safeJobsArray.reduce((acc, job) => {
      const cnt =
        job?.total_saved_count ??
        job?.saves_count ??
        job?.saved_count ??
        job?.saved_by_users_count ??
        (Array.isArray(job?.saved_by_users) ? job.saved_by_users.length : null) ??
        (Array.isArray(job?.saved_users) ? job.saved_users.length : null) ??
        (Array.isArray(job?.saved_by) ? job.saved_by.length : null) ??
        0;
      return acc + (Number(cnt) || 0);
    }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {logoSource ? (
            <Image source={logoSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business" size={24} color="rgba(10, 5, 4, 0.6)" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.businessName} numberOfLines={1}>
              {[businessName, countryName].filter(Boolean).join(", ") || businessName || contactName || "Employer"}
            </Text>
            <Text style={styles.contactText} numberOfLines={1}>
              {contactName ? `${contactName} • ${t("employer", "Employer")}` : t("employer", "Employer")}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate("EmployerNotifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#0a0504" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="person-circle-outline" size={24} color="#0a0504" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_GREEN]} />}
      >
        <Text style={styles.dashboardTitle}>{t("hiringDashboard", "HIRING DASHBOARD")}</Text>

        <View style={styles.mainStatsCard}>
          <View style={styles.statsCardHeader}>
            <Text style={styles.statsCardLabel}>{t("talentApplications", "TALENT APPLICATIONS")}</Text>
          </View>

          <View style={styles.statsSubRow}>
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: PRIMARY_GREEN }]}>{shortlistedCount}</Text>
              <Text style={styles.subStatLabel}>{t("shortlisted", "Shortlisted")}</Text>
              <Text style={styles.subStatSubLabel}>{t("selected", "Selected")}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: "#f57f20" }]}>{rejectedCount}</Text>
              <Text style={styles.subStatLabel}>{t("rejected", "Rejected")}</Text>
              <Text style={styles.subStatSubLabel}>{t("declined", "Declined")}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: "#0a0504" }]}>{contactedCount}</Text>
              <Text style={styles.subStatLabel}>{t("contacted", "Contacted")}</Text>
              <Text style={styles.subStatSubLabel}>{t("connected", "Connected")}</Text>
            </View>
            {/* <View style={styles.verticalDivider} />
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: "#1b8755" }]}>{totalSavedCount}</Text>
              <Text style={styles.subStatLabel}>{t("saved", "Saved")}</Text>
              <Text style={styles.subStatSubLabel}>{t("bookmarked", "Bookmarked")}</Text>
            </View> */}
          </View>
        </View>

        <View style={styles.statusMainCard}>
          <Text style={styles.statusCardTitle}>{t("jobStatus", "JOB STATUS")}</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusColumnItem}>
              <Text style={[styles.statusColumnValue, { color: "#e65100" }]}>{pendingJobsCount}</Text>
              <Text style={styles.statusColumnLabel}>{t("submitted", "Submitted")}</Text>
              <Text style={styles.statusColumnSubLabel}>{t("forApproval", "For Approval")}</Text>
            </View>

            <View style={styles.verticalStatusDivider} />

            <View style={styles.statusColumnItem}>
              <Text style={[styles.statusColumnValue, { color: PRIMARY_GREEN }]}>{activeJobsCount}</Text>
              <Text style={styles.statusColumnLabel}>{t("active", "Active")}</Text>
              <Text style={styles.statusColumnSubLabel}>{t("published", "Published")}</Text>
            </View>

            <View style={styles.verticalStatusDivider} />

            <View style={styles.statusColumnItem}>
              <Text style={[styles.statusColumnValue, { color: "#64748b" }]}>
                {metrics?.closed_jobs_count ?? metrics?.closed_count ?? metrics?.closed ?? 0}
              </Text>
              <Text style={styles.statusColumnLabel}>{t("closed", "Closed")}</Text>
              <Text style={styles.statusColumnSubLabel}>{t("completed", "Completed")}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.dashboardTitle, { marginTop: 20, marginBottom: 12 }]}>
          {t("quickActions", "QUICK ACTIONS")}
        </Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => checkPostLimitAndNavigate("Post Job")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
              <Ionicons name="add-circle" size={26} color={PRIMARY_GREEN} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionTitle}>{t("postAJob", "Post a Job")}</Text>
              <Text style={styles.actionSubtitle}>{t("createOpeningSubtitle", "Create a new opening for your team")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("MyJobs")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#f2f2f3" }]}>
              <Ionicons name="briefcase" size={22} color="rgba(10, 5, 4, 0.6)" />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionTitle}>{t("myJobs", "My Jobs")}</Text>
              <Text style={styles.actionSubtitle}>{t("manageJobPostingsSubtitle", "Manage your job postings")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ChefConnectDiscovery")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="people-outline" size={22} color="#F97316" />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionTitle}>{t("chefConnect", "Chef Connect")}</Text>
              <Text style={styles.actionSubtitle}>{t("findChefsSubtitle", "Find and connect with chefs & consultants")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
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
    backgroundColor: "#f2f2f3",
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  avatarPlaceholder: {
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  businessName: {
    color: "#0a0504",
    fontSize: 16,
    fontWeight: "800",
  },
  contactText: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f3",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainStatsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    marginBottom: 16,
  },
  statsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statsCardLabel: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  statsCardValue: {
    color: "#0a0504",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 6,
  },
  statsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statsSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  subStatItem: {
    flex: 1,
    alignItems: "center",
  },
  subStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  dashboardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0a0504",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  subStatSubLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
    textAlign: "center",
  },
  statusColumnItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusColumnValue: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  statusColumnLabel: {
    fontSize: 12,
    color: "#0a0504",
    fontWeight: "800",
    textAlign: "center",
  },
  statusColumnSubLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
    textAlign: "center",
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
  },
  statusMainCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    marginBottom: 10,
  },
  statusCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "700",
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  verticalStatusDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginHorizontal: 12,
  },
  smallStatIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    marginLeft: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 14,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    color: "#0a0504",
    fontSize: 15,
    fontWeight: "800",
  },
  actionSubtitle: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: 12,
    marginTop: 3,
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
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e53935",
  },
});
