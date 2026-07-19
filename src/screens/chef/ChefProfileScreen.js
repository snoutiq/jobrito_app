import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Share,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../constants/colors";
import { resetUser, setProfileData } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage, setStoredProfile } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";
import { getChefAppointments, getChefDashboardStats, saveChefOnboarding } from "../../services/chefApi";
import { getSavedJobs } from "../../services/jobApi";
import { getApplicationHistory } from "../../services/applicationApi";

const PRIMARY_GREEN = "#153e69";

export default function ChefProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  // Appointments State (only length needed for badge)
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [stats, setStats] = useState({
    profile_views: 0,
    appointment_requests: 0,
    referrals_posted: 0,
    upcoming_consultations: 0,
    active_project_requests: 0,
  });
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);

  const displayName = profile?.name || profile?.full_name || "Chef Rajesh Kumar";
  const displayTitle = profile?.professionalTitle || profile?.preferred_role || "Culinary Consultant & Kitchen Setup Expert";
  const displayCity = profile?.city || "India & Overseas";
  const displayAvailability = profile?.availability || "Available for Consultation";

  // Refresh dashboard data on focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const fetchDashboardData = async () => {
        try {
          const [statsRes, appsRes, savedRes, appointmentsRes] = await Promise.all([
            getChefDashboardStats().catch(() => null),
            getApplicationHistory().catch(() => null),
            getSavedJobs().catch(() => null),
            getChefAppointments().catch(() => null),
          ]);

          if (!isMounted) return;

          if (statsRes?.success && statsRes.stats) {
            setStats(statsRes.stats);
          } else if (statsRes?.stats) {
            setStats(statsRes.stats);
          }
          if (appsRes?.success && appsRes.applications) {
            setApplicationsCount(appsRes.applications.length);
          }
          if (savedRes?.success && savedRes.jobs) {
            setSavedJobsCount(savedRes.jobs.length);
          }
          if (appointmentsRes) {
            const list = appointmentsRes.appointments || appointmentsRes.data || (Array.isArray(appointmentsRes) ? appointmentsRes : []);
            setAppointmentCount(list.length);
          }
        } catch (err) {
          console.warn("Failed to fetch dashboard data:", err.message || err);
        }
      };
      fetchDashboardData();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Helper to determine the company logo source URL
  const getLogoSource = () => {
    const uri = profile?.profile_photo_path || profile?.company_logo || profile?.companyLogo;
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
    CustomAlert.show(
      t("logOut", "Log Out"),
      t("logoutConfirmation", "Are you sure you want to log out?"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logOut"),
          style: "destructive",
          onPress: async () => {
            try {
              const { logout: logoutApi } = require("../../services/authApi");
              await logoutApi();
            } catch (e) {
              // ignore network logout errors
            }
            await clearAuthStorage();
            dispatch(logout());
            dispatch(resetUser());
          },
        },
      ]
    );
  };

  const handleShareProfile = async () => {
    try {
      const cuisines = profile?.cuisines?.join(", ") || profile?.cuisine_specializations?.join(", ") || "Multi Cuisine";
      const experience = profile?.experience || profile?.years_of_experience || profile?.experienceYears || "N/A";
      const operations = profile?.operations?.join(", ") || profile?.operational_expertises?.join(", ") || "Kitchen Operations";
      
      const shareText = `
🍳 *CHEF PROFESSIONAL PROFILE* 🍳
----------------------------------
👤 *Name:* Chef ${displayName}
💼 *Title:* ${displayTitle}
📍 *Location:* ${displayCity}
⏱️ *Experience:* ${experience}
🍽️ *Cuisines:* ${cuisines}
⚙️ *Operational Expertise:* ${operations}
🟢 *Status:* ${displayAvailability}
----------------------------------
🔗 View full profile & book consultation on JobRito app:
http://jobrito.com/chefs/${profile?.id || "profile"}
`;
      
      await Share.share({
        message: shareText.trim(),
      });
    } catch (error) {
      CustomAlert.show("Error", "Unable to share profile.");
    }
  };

  const handleToggleAvailability = async (value) => {
    const newStatus = value ? "Available" : "Unavailable";
    
    // 1. Update Redux store
    dispatch(setProfileData({ availability: newStatus }));
    
    // 2. Update Storage
    try {
      const updatedProfile = { ...profile, availability: newStatus };
      await setStoredProfile(updatedProfile);
    } catch (e) {
      console.warn("Failed to store updated availability locally:", e);
    }

    // 3. Update server API
    try {
      const formData = new FormData();
      formData.append("availability", newStatus);
      await saveChefOnboarding(formData);
    } catch (err) {
      console.warn("Failed to update availability on server:", err);
    }
  };

  const handleOpenCalendly = () => {
    const link = profile?.calendly_link || profile?.calendlyUrl;
    if (link) {
      const fullUrl = link.startsWith("http") ? link : `https://${link}`;
      Linking.openURL(fullUrl).catch(() => {
        CustomAlert.show("Error", "Unable to open Calendly link.");
      });
    } else {
      CustomAlert.show(t("error"), "Calendly link is not configured.");
    }
  };

  const LANGUAGE_LABELS = {
    en: "English",
    hi: "हिन्दी",
    mr: "मराठी",
    ar_AE: "العربية (UAE)",
    ar_SA: "العربية (KSA)",
    en_EU: "English (Europe)",
    ml: "മലയാളം",
    kn: "ಕನ್ನಡ",
    te: "తెలుగు",
    ta: "தமிழ்"
  };

  const currentLanguageName = LANGUAGE_LABELS[i18n.language] || "English";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("chefProfile", "Chef Profile")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            {logoSource ? (
              <Image source={logoSource} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={28} color="rgba(10, 5, 4, 0.6)" />
              </View>
            )}
            <View style={styles.profileTextInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileTitle}>{displayTitle}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(10, 5, 4, 0.6)" style={{ marginRight: 4 }} />
                <Text style={styles.locationText}>{displayCity}</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusBullet} />
                <Text style={styles.statusText}>{displayAvailability}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate("ChefProfileDetails", { chef: profile, isOwnProfile: true })}
            style={[styles.viewProfileBtn, { backgroundColor: PRIMARY_GREEN }]}
            activeOpacity={0.8}
          >
            <Text style={styles.viewProfileBtnText}>{t("chefDashboard.viewProfile", "View Profile")}</Text>
          </TouchableOpacity>
        </View>

        {/* My Activity */}
        <Text style={styles.sectionTitle}>{t("chefDashboard.myActivity")}</Text>
        <View style={styles.menuGroup}>
          {/* My Applications */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Applications")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-open-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.myApplications")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{applicationsCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* My Saved Jobs */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("SavedJobs")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bookmark-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.mySavedJobs")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{savedJobsCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* My Posted Jobs */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("MyJobs")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="share-social-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.myPostedJobs")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{stats.referrals_posted}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Appointment Requests */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("AppointmentRequests")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="calendar-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.appointmentRequests")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{stats.appointment_requests || appointmentCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Upcoming Consultations */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => CustomAlert.show("Consultations", `You have ${stats.upcoming_consultations} upcoming consultations.`)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="calendar-number-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.upcomingConsultations")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{stats.upcoming_consultations}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Profile Views */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ProfileViews")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="eye-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.profileViews", "Profile Views")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{stats.profile_views}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Active Project Requests */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ProjectRequests")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="folder-open-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.activeProjectRequests", "Active Project Requests")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{stats.active_project_requests || 0}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Professional Tools */}
        <Text style={styles.sectionTitle}>{t("chefDashboard.professionalTools")}</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleOpenCalendly}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="calendar-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.calendlyIntegration")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => CustomAlert.show("Social Links", "Social media links feature is coming soon.")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="globe-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.socialMediaLinks")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="time-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.availability")}</Text>
            </View>
            <Switch
              value={displayAvailability === "Available" || displayAvailability === "Available for Consultation"}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: "rgba(10, 5, 4, 0.15)", true: "#f2c879" }}
              thumbColor={displayAvailability === "Available" || displayAvailability === "Available for Consultation" ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.4)"}
            />
          </View>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleShareProfile}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="share-outline" size={20} color="#153e69" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("chefDashboard.shareProfile")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>
        </View>

        {/* Settings & Support */}
        <Text style={styles.sectionTitle}>{t("chefDashboard.settingsSupport")}</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Language")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="language-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("language")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.langValueText}>{currentLanguageName}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("TalentSettings")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("settingsTitle", "Settings")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("HelpSupport")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("customerSupport")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={20} color="#f57f20" style={styles.menuIcon} />
              <Text style={[styles.menuItemLabel, { color: "#f57f20" }]}>{t("logOut")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  bellButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    shadowColor: "#0a0504",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 20,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  avatarPlaceholder: {
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  profileTextInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  profileTitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 6,
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#153e69",
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: "#153e69",
    fontWeight: "700",
  },
  viewProfileBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewProfileBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 4,
  },

  fullWidthCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  fullWidthCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullWidthCardText: {
    fontSize: 12,
    color: "#0a0504",
    fontWeight: "500",
  },
  menuGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0a0504",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeContainer: {
    backgroundColor: "rgba(245, 127, 32, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#f57f20",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f2f2f3",
    marginLeft: 16,
  },
  langValueText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
});
