import React, { useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#22C55E";

export default function EmployerHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const { metrics, submittedJobs, loading } = useSelector((state) => state.employer);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEmployerDashboard());
    }, [dispatch])
  );

  const onRefresh = React.useCallback(() => {
    dispatch(fetchEmployerDashboard());
  }, [dispatch]);

  const businessName = profile?.business_name || profile?.businessName || profile?.company || "";
  const contactName = profile?.contact_person_name || profile?.contactName || profile?.nominee_name || profile?.full_name || profile?.name || "";
  const mobile_number = profile?.mobile_number || profile?.phone || profile?.contact_number || "";
  const mobileNumber = mobile_number ? `${mobile_number}` : "N/A";

  // Helper to determine the company logo source URL
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

  // Metrics directly from API metrics
  const totalApplicants = metrics?.total_applicants ?? 0;
  const shortlistedCount = metrics?.shortlisted ?? 0;
  const rejectedCount = metrics?.rejected ?? 0;
  const contactedCount = metrics?.contacted ?? 0;
  const activeJobsCount = metrics?.active_jobs_count ?? 0;
  const pendingJobsCount = metrics?.pending_jobs_count ?? 0;

  const handleSupportPress = () => {
    navigation.navigate("HelpSupport");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {logoSource ? (
            <Image
              source={logoSource}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business" size={24} color="#64748B" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.businessName}>{contactName}</Text>
            <Text style={styles.contactText}>{mobileNumber}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => CustomAlert.show(t("notifications"), t("noNotifications"))}>
            <Ionicons name="notifications-outline" size={22} color="#1E293B" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="settings-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[PRIMARY_GREEN]} />
        }
      >

        {/* Card: All Talent Applicants Received */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("MyJobs")}
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
              <Text style={[styles.subStatValue, { color: "#EF4444" }]}>{rejectedCount}</Text>
              <Text style={styles.subStatLabel}>{t("rejected")}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.subStatItem}>
              <Text style={[styles.subStatValue, { color: "#1E293B" }]}>{contactedCount}</Text>
              <Text style={styles.subStatLabel}>{t("contacted")}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Row of small stats */}
        <View style={styles.smallStatsRow}>
          <View style={styles.smallStatCard}>
            <View style={[styles.smallStatIconBox, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="hourglass-outline" size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.smallStatLabel}>{t("pending")}</Text>
              <Text style={styles.smallStatValue}>{pendingJobsCount}</Text>
            </View>
          </View>

          <View style={styles.smallStatCard}>
            <View style={[styles.smallStatIconBox, { backgroundColor: "#EEF4FF" }]}>
              <Ionicons name="briefcase-outline" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.smallStatLabel}>{t("activeJobs")}</Text>
              <Text style={styles.smallStatValue}>{activeJobsCount}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>{t("actions")}</Text>

        {/* Action List */}
        <View style={styles.actionsContainer}>
          {/* Post Job Action */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Post Job")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
              <Ionicons name="add-circle" size={26} color={PRIMARY_GREEN} />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionTitle}>{t("postJobAction")}</Text>
              <Text style={styles.actionSubtitle}>{t("postJobActionSubtitle")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* My Jobs Action */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("MyJobs")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#F1F5F9" }]}>
              <Ionicons name="briefcase" size={22} color="#64748B" />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionTitle}>{t("myJobs")}</Text>
              <Text style={styles.actionSubtitle}>{t("myJobsSubtitle")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Chef Connect Action */}
          <TouchableOpacity
            style={styles.actionItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ChefConnectFilters")}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="people-outline" size={22} color="#F97316" />
            </View>
            <View style={styles.actionDetails}>
              <Text style={styles.actionTitle}>Chef Connect</Text>
              <Text style={styles.actionSubtitle}>Discover and connect with talented chefs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Support Button */}
      <TouchableOpacity
        style={[styles.supportFab, { backgroundColor: PRIMARY_GREEN }]}
        activeOpacity={0.8}
        onPress={handleSupportPress}
      >
        <Ionicons name="headset-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
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
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  contactText: {
    fontSize: 12,
    color: "#64748B",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
  },
  mainStatsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  statsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statsCardValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  statsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statsSubRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  subStatItem: {
    flex: 1,
    alignItems: "center",
  },
  subStatValue: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  subStatLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  verticalDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  smallStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  smallStatCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  smallStatIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  smallStatLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 1,
  },
  smallStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  actionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  supportFab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});