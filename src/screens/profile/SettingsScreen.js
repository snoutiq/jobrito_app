import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  BackHandler,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";

const PRIMARY_GREEN = "#153e69";

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const activeRole = useSelector((state) => state.auth.user?.active_role ?? state.user?.activeRole);
  const isEmployer = activeRole === "employer";
  
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const getEmployerCompletion = () => {
    if (!profile) return 0;
    if (profile.completionPercentage !== undefined && profile.completionPercentage !== null && profile.completionPercentage > 0) {
      return profile.completionPercentage;
    }
    if (profile.completeness !== undefined && profile.completeness !== null && profile.completeness > 0) {
      return profile.completeness;
    }

    let fields = 0;
    let filled = 0;

    fields++;
    if (profile.business_name || profile.businessName || profile.company) filled++;

    fields++;
    if (profile.industry_segment || profile.segment) filled++;

    fields++;
    if (profile.business_location || profile.location) filled++;

    fields++;
    if (profile.contact_person_name || profile.contactName || profile.name || profile.full_name) filled++;

    fields++;
    if (profile.business_mobile || profile.contactPhone || profile.phone) filled++;

    fields++;
    if (profile.business_email || profile.contactEmail || profile.email) filled++;

    fields++;
    if (profile.preferred_language || profile.preferredLanguage || profile.selected_language) filled++;

    fields++;
    if (profile.company_logo || profile.companyLogo || profile.profile_photo_path) filled++;

    return Math.round((filled / fields) * 100);
  };

  const getEmployerMissedFields = () => {
    const missed = [];
    if (!profile?.business_name && !profile?.businessName && !profile?.company) missed.push(t("businessName", "Business Name"));
    if (!profile?.industry_segment && !profile?.segment) missed.push(t("industrySegment", "Industry Segment"));
    if (!profile?.business_location && !profile?.location) missed.push(t("location", "HQ Location"));
    if (!profile?.contact_person_name && !profile?.contactName && !profile?.name && !profile?.full_name) missed.push(t("contactPerson", "Contact Person"));
    if (!profile?.business_mobile && !profile?.contactPhone && !profile?.phone) missed.push(t("phoneNumber", "Mobile Number"));
    if (!profile?.business_email && !profile?.contactEmail && !profile?.email) missed.push(t("emailAddress", "Email"));
    if (!profile?.preferred_language && !profile?.preferredLanguage && !profile?.selected_language) missed.push(t("language", "Language"));
    if (!profile?.company_logo && !profile?.companyLogo && !profile?.profile_photo_path) missed.push(t("companyLogo", "Company Logo"));
    return missed;
  };

  const employerCompletion = getEmployerCompletion();
  const employerMissedFields = getEmployerMissedFields();

  React.useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  const businessName =
    profile?.business_name ||
    profile?.businessName ||
    profile?.current_employer ||
    profile?.company ||
    "";
  const contactName =
    profile?.contact_person_name ||
    profile?.contactName ||
    profile?.full_name ||
    profile?.name ||
    "";
  const mobileNumber =
    profile?.mobile_number ||
    profile?.phone ||
    profile?.contact_number ||
    "";
  const email = profile?.email || profile?.contactEmail || "";
  const location = profile?.location || profile?.business_location || profile?.city || "";

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

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      const { logout: logoutApi } = require("../../services/authApi");
      await logoutApi();
    } catch (e) {
      // ignore network logout errors
    }
    await clearAuthStorage();
    dispatch(logout());
    dispatch(resetUser());
  };

  const accountRows = [
    {
      label: isEmployer ? t("postJob.businessName", "Business Name") : t("currentEmployer", "Current Employer"),
      value: businessName || "-",
      icon: "business-outline",
    },
    {
      label: isEmployer ? t("postJob.contactPerson", "Contact Person") : t("fullName", "Full Name"),
      value: contactName || "-",
      icon: "person-outline",
    },
    {
      label: t("postJob.phoneNumber", "Mobile Number"),
      value: mobileNumber || "-",
      icon: "call-outline",
    },
    {
      label: t("postJob.emailAddress", "Email"),
      value: email || "-",
      icon: "mail-outline",
    },
    {
      label: t("postJob.location", "Location"),
      value: location || "-",
      icon: "location-outline",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profileTab", "Profile")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {logoSource ? (
            <Image source={logoSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business-outline" size={30} color={PRIMARY_GREEN} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{contactName || businessName || t("guest", "Guest User")}</Text>
            <Text style={styles.profileSub}>{isEmployer ? (businessName || t("businessProfile", "Business profile")) : t("chef", "Chef")}</Text>
          </View>
        </View>

        {isEmployer && employerCompletion < 100 && (
          <TouchableOpacity
            style={styles.completionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("EmployerCompleteProfile", { isEditMode: true })}
          >
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>{t("profile.profileCompletion", "Profile Completion")}</Text>
              <Text style={styles.completionPercent}>{employerCompletion}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${employerCompletion}%` }]} />
            </View>
            {employerMissedFields.length > 0 && (
              <Text style={styles.missedText}>
                {t("missedInfoPrompt", "Add missing info:")} {employerMissedFields.join(", ")}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>
          {isEmployer ? t("postJob.businessBasics", "Business Information") : t("personalInformation", "Personal Information")}
        </Text>
        <View style={styles.sectionCard}>
          {accountRows.map((item, index) => (
            <React.Fragment key={item.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={item.icon} size={18} color={PRIMARY_GREEN} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
              {index !== accountRows.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t("accountStatusActivity", "Account Status & Activity")}</Text>
        <View style={styles.sectionCard}>
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="speedometer-outline" size={18} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.actionLabel}>{t("dashboard", "Dashboard")}</Text>
            </View>
            <TouchableOpacity style={styles.pillButton} onPress={() => navigation.navigate("Tabs")}>
              <Text style={styles.pillButtonText}>{t("postJob.goDashboard", "Go to Dashboard")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="people-outline" size={18} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.actionLabel}>{t("chefConnect", "Chef Connect")}</Text>
            </View>
            <TouchableOpacity style={styles.pillButton} onPress={() => navigation.navigate("ChefConnectFilters")}>
              <Text style={styles.pillButtonText}>{t("viewProfiles")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("chefDashboard.settingsSupport", "Settings & Support")}</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate(isEmployer ? "EmployerCompleteProfile" : "PersonalInformation", 
            isEmployer ? { isEditMode: true } : undefined)}>
            <View style={styles.menuLeft}>
              <Ionicons name="create-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>{t("editProfile", "Edit Profile")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate("Language")}>
            <View style={styles.menuLeft}>
              <Ionicons name="globe-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>{t("profile.menu.language", "Change Language")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate("HelpSupport")}>
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>{t("helpSupport", "Help & Support")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.logoutRow} onPress={() => setShowLogoutModal(true)}>
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={18} color="#f57f20" />
              <Text style={styles.logoutText}>{t("logout", "Logout")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#f57f20" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowLogoutModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>{t("profile.logoutConfirmTitle", "Logout")}</Text>
            <Text style={styles.modalText}>{t("profile.logoutConfirm", "Are you sure you want to logout?")}</Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={[styles.modalButton, styles.modalCancelButton]}
              >
                <Text style={styles.modalCancelText}>{t("cancel", "Cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                style={[styles.modalButton, styles.modalConfirmButton]}
              >
                <Text style={styles.modalConfirmText}>{t("logout", "Logout")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f3",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  avatarPlaceholder: {
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  profileSub: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: PRIMARY_GREEN,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    overflow: "hidden",
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#0a0504",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginHorizontal: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0a0504",
  },
  pillButton: {
    backgroundColor: "#f2f2f3",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillButtonText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "700",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuText: {
    fontSize: 15,
    color: "#0a0504",
    fontWeight: "600",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 15,
    color: "#f57f20",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(245, 127, 32, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modalTitle: {
    color: "#0a0504",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  modalText: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 6,
  },
  modalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalConfirmButton: {
    backgroundColor: colors.danger,
  },
  modalCancelText: {
    color: "#0a0504",
    fontSize: 14,
    fontWeight: "800",
  },
  modalConfirmText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  completionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a0504",
  },
  completionPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#153e69",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    width: "100%",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#153e69",
  },
  missedText: {
    fontSize: 12,
    color: "#f57f20",
    fontWeight: "600",
    marginTop: 8,
  },
});





