import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";

const PRIMARY_GREEN = "#22C55E";

export default function EmployerHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const { metrics, loading } = useSelector((state) => state.employer);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEmployerDashboard());
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
              <Ionicons name="business" size={24} color="#64748B" />
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
            <Ionicons name="notifications-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="person-circle-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[PRIMARY_GREEN]} />}
      >
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

        <View style={styles.actionsContainer}>
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
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  contactText: {
    color: "#64748B",
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
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainStatsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 16,
  },
  statsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statsCardLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  statsCardValue: {
    color: "#0F172A",
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
    color: "#64748B",
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 36,
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
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  smallStatIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  smallStatLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  smallStatValue: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  sectionTitle: {
    color: "#64748B",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  actionSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },
});
