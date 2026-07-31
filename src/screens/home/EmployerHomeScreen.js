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
import { getDailyPostLimit } from "../../services/jobApi";

const PRIMARY_GREEN = "#153e69";

export default function EmployerHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const { metrics, loading } = useSelector((state) => state.employer);

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

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEmployerDashboard());

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

  const onRefresh = useCallback(() => {
    dispatch(fetchEmployerDashboard());
  }, [dispatch]);

  const contactName =
    profile?.contact_person_name ||
    profile?.contactName ||
    profile?.nominee_name ||
    profile?.full_name ||
    profile?.name ||
    "";
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
            <Text style={styles.businessName}>{contactName || "Employer"}</Text>
            <Text style={styles.contactText}>{mobileNumber || "N/A"}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate("EmployerNotifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#0a0504" />
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[PRIMARY_GREEN]} />}
      >
        <View
          style={styles.mainStatsCard}
        >
          <View style={styles.statsCardHeader}>
            <View>
              <Text style={styles.statsCardLabel}>{t("allTalentApplicantsReceived")}</Text>
              <Text style={styles.statsCardValue}>{totalApplicants}</Text>
            </View>
            <View style={[styles.statsIconWrapper, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
              <Ionicons name="people" size={24} color={PRIMARY_GREEN} />
            </View>
          </View>

          <View style={styles.statsSubRow}>
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: PRIMARY_GREEN }]}>{shortlistedCount}</Text>
              <Text style={styles.subStatLabel}>{t("shortlisted")}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: "#f57f20" }]}>{rejectedCount}</Text>
              <Text style={styles.subStatLabel}>{t("rejected")}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: "#0a0504" }]}>{contactedCount}</Text>
              <Text style={styles.subStatLabel}>{t("contacted")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusMainCard}>
          <Text style={styles.statusCardTitle}>{t("jobStatus", "JOB STATUS")}</Text>
          
          <View style={styles.statusRow}>
            <TouchableOpacity 
              style={styles.statusItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate("MyJobs", { initialTab: "pending" })}
            >
              <View style={[styles.smallStatIconBox, { backgroundColor: "rgba(242, 200, 121, 0.12)" }]}>
                <Ionicons name="hourglass-outline" size={20} color="#f2c879" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>{t("pendingJobs", "Pending Jobs")}</Text>
                <Text style={styles.statusValue}>{pendingJobsCount}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.verticalStatusDivider} />

            <TouchableOpacity 
              style={styles.statusItem} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate("MyJobs", { initialTab: "active" })}
            >
              <View style={[styles.smallStatIconBox, { backgroundColor: "#EEF4FF" }]}>
                <Ionicons name="briefcase-outline" size={20} color="#153e69" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>{t("activeJobs", "Active Jobs")}</Text>
                <Text style={styles.statusValue}>{activeJobsCount}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>{t("actions")}</Text>

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
              <Text style={styles.actionTitle}>{t("postJobAction")}</Text>
              <Text style={styles.actionSubtitle}>{t("postJobActionSubtitle")}</Text>
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
              <Text style={styles.actionTitle}>{t("myJobs")}</Text>
              <Text style={styles.actionSubtitle}>{t("myJobsSubtitle")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ChefConnectFilters")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="people-outline" size={22} color="#F97316" />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionTitle}>{t("chefConnect", "Chef Connect")}</Text>
              <Text style={styles.actionSubtitle}>{t("chefConnectSubtitle", "Discover and connect with talented chefs")}</Text>
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
    marginTop: 18,
  },
  subStatItem: {
    flex: 1,
    alignItems: "center",
  },
  subStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  subStatLabel: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 4,
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
});
