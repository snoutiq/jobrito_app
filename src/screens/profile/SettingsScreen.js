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
  Dimensions,
  PixelRatio,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { fetchProfile, resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

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

    const hasLogo = !!(profile.company_logo || profile.companyLogo || profile.profile_photo_path);
    const hasBusinessName = !!(profile.business_name || profile.businessName || profile.company);
    const hasSegment = !!(profile.industry_segment || profile.segment);
    const hasLocation = !!(profile.business_location || profile.location);

    const isActuallyComplete = hasLogo && hasBusinessName && hasSegment && hasLocation;

    if (isActuallyComplete) {
      if (profile.completionPercentage !== undefined && profile.completionPercentage !== null && profile.completionPercentage > 0) {
        return profile.completionPercentage;
      }
      if (profile.completeness !== undefined && profile.completeness !== null && profile.completeness > 0) {
        return profile.completeness;
      }
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

  const getMissingFieldText = () => {
    if (employerCompletion >= 100) return t("profile.allInfoAdded", "All information added successfully!");
    
    if (!profile?.business_name && !profile?.businessName && !profile?.company) {
      return t("profile.addBusinessNameAction", "Add Business Name");
    }
    if (!profile?.industry_segment && !profile?.segment) {
      return t("profile.addIndustrySegmentAction", "Add Industry Segment");
    }
    if (!profile?.business_location && !profile?.location) {
      return t("profile.addHQLocationAction", "Add HQ Location");
    }
    if (!profile?.contact_person_name && !profile?.contactName && !profile?.name && !profile?.full_name) {
      return t("profile.addContactPersonAction", "Add Contact Person");
    }
    if (!profile?.business_mobile && !profile?.contactPhone && !profile?.phone) {
      return t("profile.addPhoneNumberAction", "Add Mobile Number");
    }
    if (!profile?.business_email && !profile?.contactEmail && !profile?.email) {
      return t("profile.addEmailAddressAction", "Add Email");
    }
    if (!profile?.preferred_language && !profile?.preferredLanguage && !profile?.selected_language) {
      return t("profile.addLanguageAction", "Add Language");
    }
    if (!profile?.company_logo && !profile?.companyLogo && !profile?.profile_photo_path) {
      return t("profile.addCompanyLogoAction", "Add Company Logo");
    }
    return t("profile.completeProfilePrompt", "Complete your profile details");
  };

  const employerCompletion = getEmployerCompletion();
  const employerMissedFields = getEmployerMissedFields();

  React.useEffect(() => {
    dispatch(fetchProfile());

    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [dispatch, navigation]);

  const businessName = isEmployer
    ? (profile?.business_name || profile?.businessName || profile?.company || "")
    : (profile?.current_employer || "");

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
  const rawLocation =
    profile?.country ||
    profile?.employer_profile?.country ||
    profile?.primary_location ||
    profile?.location ||
    "";
  const countryName = rawLocation.includes(",")
    ? rawLocation.split(",").pop().trim()
    : rawLocation;
  const primaryBizLoc = profile?.business_location || profile?.employer_profile?.business_location || profile?.location || "";
  const primaryCityName = primaryBizLoc.includes(",") ? primaryBizLoc.split(",")[0].trim() : primaryBizLoc.trim();

  let allCities = [];
  if (primaryCityName) {
    allCities.push(primaryCityName);
  }

  let opLocations =
    profile?.employer_profile?.operational_locations ||
    profile?.operational_locations ||
    [];

  if (typeof opLocations === "string") {
    try {
      opLocations = JSON.parse(opLocations);
    } catch (e) {
      opLocations = [opLocations];
    }
  }

  if (Array.isArray(opLocations)) {
    opLocations.forEach((loc) => {
      const cityItem = typeof loc === "string" ? loc.split(",")[0].trim() : (loc?.city || "");
      if (cityItem && !allCities.includes(cityItem)) {
        allCities.push(cityItem);
      }
    });
  }

  const cityOnly = allCities.join(" | ");

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
      logoutApi().catch(() => {});
    } catch (e) {
      // ignore network logout errors
    }
    await clearAuthStorage();
    try {
      const { clearClientState } = require("../../services/apiClient");
      clearClientState();
    } catch (e) {
      console.warn("Failed to clear API client state:", e);
    }
    dispatch(logout());
    dispatch(resetUser());
  };

  const primaryLocationValue = allCities.length > 0 ? allCities[0] : (location || "-");
  const optionalLocationValue = allCities.length > 1 ? allCities.slice(1).join(" | ") : "";

  const accountRows = [
    {
      label: isEmployer ? t("businessName", "Business Name") : t("currentEmployer", "Current Employer"),
      value: businessName || "-",
      icon: "business-outline",
    },
    {
      label: isEmployer ? t("contactPerson", "Contact Person") : t("fullName", "Full Name"),
      value: contactName || "-",
      icon: "person-outline",
    },
    {
      label: t("phoneNumber", "Phone Number"),
      value: mobileNumber || "-",
      icon: "call-outline",
    },
    {
      label: t("email", "Email"),
      value: email || "-",
      icon: "mail-outline",
    },
    {
      label: isEmployer ? `${t("location", "Location")} (${t("primaryTag", "Primary")})` : t("location", "Location"),
      value: primaryLocationValue,
      icon: "location-outline",
    },
  ];

  if (isEmployer && optionalLocationValue) {
    accountRows.push({
      label: t("optionalLocation", "Optional Location"),
      value: optionalLocationValue,
      icon: "map-outline",
    });
  }

  const cleanBusiness = businessName.includes(",")
    ? businessName.split(",")[0].trim()
    : businessName;
  const headerBusinessName =
    cleanBusiness.length > 18 ? `${cleanBusiness.slice(0, 18).trim()}...` : cleanBusiness;

  const cardTitleText =
    [headerBusinessName, countryName].filter(Boolean).join(", ") ||
    headerBusinessName ||
    contactName ||
    t("businessProfileTitle", "Business Profile");
  const cardSubText = contactName
    ? `${contactName} • ${t("employer", "Employer")}`
    : t("employer", "Employer");

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEmployer ? t("businessProfileTitle", "Business Profile") : t("profileTab", "Profile")}
        </Text>
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
            <Text style={styles.profileName} numberOfLines={1}>
              {isEmployer ? cardTitleText : (contactName || businessName || t("guest", "Guest User"))}
            </Text>
            <Text style={styles.profileSub} numberOfLines={1}>
              {isEmployer ? cardSubText : t("chef", "Chef")}
            </Text>
          </View>
          {isEmployer && (
            <TouchableOpacity
              style={styles.editProfileIconBtn}
              onPress={() => navigation.navigate("EmployerCompleteProfile", { isEditMode: true })}
            >
              <Ionicons name="create-outline" size={22} color={PRIMARY_GREEN} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          {isEmployer ? t("businessBasics", "BUSINESS BASICS") : t("personalInformation", "Personal Information")}
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

        <Text style={styles.sectionTitle}>
          {isEmployer ? t("myJobrito", "MY JOBRITO") : t("accountStatusActivity", "Account Status & Activity")}
        </Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity 
            style={styles.menuRow} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Tabs")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="speedometer-outline" size={18} color={PRIMARY_GREEN} />
              <View>
                <Text style={styles.menuText}>{t("hiringDashboardTitle", "Hiring Dashboard")}</Text>
                <Text style={styles.menuSubText}>{t("hiringDashboardSubtitle", "View your hiring activity")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.menuRow} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ChefConnectDiscovery")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="people-outline" size={18} color={PRIMARY_GREEN} />
              <View>
                <Text style={styles.menuText}>{t("chefConnect", "Chef Connect")}</Text>
                <Text style={styles.menuSubText}>{t("findChefsConsultants", "Find Chefs & Consultants")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {t("settingsAndSupport", "SETTINGS & SUPPORT")}
        </Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate("Language")}>
            <View style={styles.menuLeft}>
              <Ionicons name="globe-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>{t("preferredLanguage", "Preferred Language")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.menuRow} 
            onPress={() => navigation.navigate("PrivacySecurity")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>{t("privacyAndSecurity", "Privacy & Security")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate("HelpSupport")}>
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>{t("helpAndSupport", "Help & Support")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.logoutRow} onPress={() => setShowLogoutModal(true)}>
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={18} color="#f57f20" />
              <Text style={styles.logoutText}>{t("logoutUpper", "LOGOUT")}</Text>
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
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  backButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f3",
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: "#0a0504",
  },
  scrollContent: {
    padding: normalize(14),
    paddingBottom: normalize(34),
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: normalize(14),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: normalize(14),
  },
  avatar: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(16),
    marginRight: normalize(12),
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
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 3,
  },
  profileSub: {
    fontSize: normalize(12),
    color: "rgba(10, 5, 4, 0.6)",
  },
  editProfileIconBtn: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: PRIMARY_GREEN,
    textTransform: "uppercase",
    marginBottom: normalize(8),
    marginLeft: 4,
    marginTop: normalize(4),
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    overflow: "hidden",
    marginBottom: normalize(14),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(12),
    gap: normalize(10),
  },
  infoIconWrap: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(10),
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: normalize(14.5),
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: normalize(13),
    color: "#0a0504",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginHorizontal: normalize(12),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(12),
    gap: normalize(10),
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    flex: 1,
  },
  actionIconWrap: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(10),
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#0a0504",
  },
  pillButton: {
    backgroundColor: "#f2f2f3",
    borderRadius: 999,
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
  },
  pillButtonText: {
    fontSize: normalize(11),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "700",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(13),
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  menuText: {
    fontSize: normalize(13.5),
    color: "#0a0504",
    fontWeight: "600",
  },
  menuSubText: {
    fontSize: normalize(11),
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(13),
  },
  logoutText: {
    fontSize: normalize(13.5),
    color: "#f57f20",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: normalize(20),
  },
  modalCard: {
    width: "100%",
    maxWidth: normalize(320),
    backgroundColor: "#ffffff",
    borderRadius: normalize(18),
    padding: normalize(16),
    alignItems: "center",
    gap: normalize(8),
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  modalIcon: {
    width: normalize(46),
    height: normalize(46),
    borderRadius: normalize(14),
    backgroundColor: "rgba(245, 127, 32, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modalTitle: {
    color: "#0a0504",
    fontSize: normalize(16),
    fontWeight: "900",
    textAlign: "center",
  },
  modalText: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: normalize(12),
    lineHeight: normalize(16),
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: normalize(8),
    width: "100%",
    marginTop: normalize(4),
  },
  modalButton: {
    flex: 1,
    minHeight: normalize(42),
    borderRadius: normalize(12),
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
    fontSize: normalize(13),
    fontWeight: "800",
  },
  modalConfirmText: {
    color: "#ffffff",
    fontSize: normalize(13),
    fontWeight: "800",
  },
  completionCardContainer: {
    paddingHorizontal: 0,
    marginBottom: normalize(16),
  },
  completionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: normalize(16),
    padding: normalize(14),
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(10),
  },
  completionTitle: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#0a0504",
  },
  completionPercent: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#153e69",
  },
  progressContainer: {
    height: normalize(6),
    marginBottom: normalize(10),
    width: "100%",
  },
  progressBarTrack: {
    height: normalize(6),
    borderRadius: 3,
    backgroundColor: "#f2f2f3",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#153e69",
  },
  addSkillsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    marginTop: normalize(4),
  },
  addSkillsText: {
    fontSize: normalize(11),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
});
