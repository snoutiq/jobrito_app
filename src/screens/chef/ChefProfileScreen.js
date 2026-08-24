import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  Switch,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  resetUser,
  setProfileData,
  fetchProfile,
} from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage, setStoredProfile } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";
import {
  getChefAppointments,
  getChefDashboardStats,
  getChefProfileViews,
  updateChefAvailability,
} from "../../services/chefApi";
import { getMyJobs, getSavedJobs } from "../../services/jobApi";
import { getApplicationHistory } from "../../services/applicationApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;

function normalize(size) {
  const newSize = size * scale;
  return Math.round(newSize);
}

export default function ChefProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const [loading, setLoading] = useState(true);

  // Appointments & Stats State
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
  const [postedJobsCount, setPostedJobsCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displayName =
    profile?.name || profile?.full_name || "Kevin";
  const displayTitle =
    profile?.professionalTitle ||
    profile?.preferred_role ||
    "Hospitality Consultant";

  const displayCity =
    profile?.city && profile?.country
      ? `${profile.city}, ${profile.country}`
      : profile?.city || profile?.country || "Jeddah, Saudi Arabia";

  const displayExperience =
    profile?.experienceYears ||
    profile?.experience_range ||
    profile?.experience ||
    "5–10 Years";

  const getAvailability = () => {
    if (
      profile?.availability_info &&
      typeof profile.availability_info === "object" &&
      !Array.isArray(profile.availability_info)
    ) {
      return (
        profile.availability_info.availability_status ||
        profile.availability ||
        "Currently Employed"
      );
    }
    return profile?.availability || "Currently Employed";
  };

  const availability = getAvailability();
  const displayAvailability =
    availability === "Unavailable" ? "Currently Employed" : availability;

  const isAvailable =
    availability === "Available" ||
    availability === "Available for Consultation" ||
    availability === "Available Immediately" ||
    availability === "Available immediately";

  const getProfileCompletionPercentage = () => {
    if (!profile) return 80;

    const apiPct =
      profile.completeness ??
      profile.profile_completeness ??
      profile.completionPercentage;
    if (apiPct !== undefined && apiPct !== null && apiPct > 0) {
      return Math.round(Number(apiPct));
    }

    let totalFields = 10;
    let filledFields = 0;

    if (profile?.full_name || profile?.name) filledFields++;
    if (profile?.profile_photo_path || profile?.profile_photo) filledFields++;
    if (profile?.professionalTitle || profile?.preferred_role) filledFields++;
    if (profile?.city) filledFields++;
    if (
      profile?.experienceYears ||
      profile?.experience_range ||
      profile?.experience
    )
      filledFields++;
    if (profile?.bio) filledFields++;
    if (profile?.skills || profile?.operations) filledFields++;
    if (profile?.calendly_link || profile?.calendlyUrl) filledFields++;
    if (profile?.linkedin || profile?.instagram) filledFields++;
    if (profile?.locationPreference || profile?.location_preference) filledFields++;

    const calculated = Math.round((filledFields / totalFields) * 100);
    return calculated > 0 ? calculated : 80;
  };

  const getMissingFieldStep = () => {
    if (!profile?.profile_photo_path && !profile?.profile_photo) return 1;
    if (!profile?.bio) return 3;
    if (!profile?.skills && !profile?.operations) return 2;
    if (!profile?.calendly_link && !profile?.calendlyUrl) return 4;
    return 1;
  };

  const getMissingFieldText = () => {
    if (completionPercent >= 100)
      return t("profile.allInfoAdded", "All information added successfully!");
    if (!profile?.profile_photo_path && !profile?.profile_photo)
      return t("addProfilePhoto", "Add Profile Photo");
    if (!profile?.bio) return t("profile.addBioAction", "Add Bio");
    if (!profile?.skills && !profile?.operations)
      return t("profile.addSkillsAction", "Add Operational Skills");
    return t("profile.completeProfilePrompt", "Complete your profile details");
  };

  const completionPercent = getProfileCompletionPercentage();

  // Refresh dashboard data on focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const fetchDashboardData = async () => {
        try {
          await dispatch(fetchProfile()).unwrap();
          const [
            statsRes,
            appsRes,
            savedRes,
            appointmentsRes,
            viewsRes,
            myJobsRes,
          ] = await Promise.all([
            getChefDashboardStats().catch(() => null),
            getApplicationHistory().catch(() => null),
            getSavedJobs().catch(() => null),
            getChefAppointments().catch(() => null),
            getChefProfileViews().catch(() => null),
            getMyJobs().catch(() => null),
          ]);

          if (!isMounted) return;

          if (myJobsRes) {
            const jobs =
              myJobsRes.created_jobs ||
              myJobsRes.jobs ||
              myJobsRes.data ||
              (Array.isArray(myJobsRes) ? myJobsRes : []);
            if (Array.isArray(jobs)) {
              setPostedJobsCount(jobs.length);
            }
          }

          let resolvedProfileViews = 0;
          if (viewsRes?.views && Array.isArray(viewsRes.views)) {
            resolvedProfileViews =
              viewsRes.total_views !== undefined
                ? viewsRes.total_views
                : viewsRes.views.length;
          } else if (statsRes?.stats?.profile_views !== undefined) {
            resolvedProfileViews = statsRes.stats.profile_views;
          }

          if (statsRes?.stats) {
            setStats({
              ...statsRes.stats,
              profile_views: resolvedProfileViews,
            });
          }
          if (appsRes?.success && appsRes.applications) {
            setApplicationsCount(appsRes.applications.length);
          }
          if (savedRes?.success && savedRes.jobs) {
            setSavedJobsCount(savedRes.jobs.length);
          }
          if (appointmentsRes) {
            const list =
              appointmentsRes.appointments ||
              appointmentsRes.data ||
              (Array.isArray(appointmentsRes) ? appointmentsRes : []);
            setAppointmentCount(list.length);
          }
        } catch (err) {
          console.warn("Failed to fetch dashboard data:", err.message || err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchDashboardData();
      return () => {
        isMounted = false;
      };
    }, [dispatch]),
  );

  const getLogoSource = () => {
    const uri =
      profile?.profile_photo_path ||
      profile?.profile_photo ||
      profile?.company_logo ||
      profile?.companyLogo;
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

  const handleLogout = () => setShowLogoutModal(true);

  const executeLogout = async () => {
    setShowLogoutModal(false);
    try {
      const { logout: logoutApi } = require("../../services/authApi");
      logoutApi().catch(() => {});
    } catch (e) {}
    await clearAuthStorage();
    try {
      const { clearClientState } = require("../../services/apiClient");
      clearClientState();
    } catch (e) {}
    dispatch(logout());
    dispatch(resetUser());
  };

  const handleShareProfile = async () => {
    try {
      const chefId = profile?.id || "profile";
      const shareUrl = `https://jobrito.com/chef/${chefId}`;
      const shareText = `
🍳 *CHEF PROFILE* 🍳
👤 *Name:* ${displayName}
💼 *Title:* ${displayTitle}
📍 *Location:* ${displayCity || "N/A"}
----------------------------------
🔗 View profile on Jobrito:
${shareUrl}
`.trim();

      await Share.share({ message: shareText });
    } catch (error) {
      console.warn("Share profile error:", error);
    }
  };

  const handleToggleAvailability = async (value) => {
    const newStatus = value ? "Available" : "Unavailable";
    const newAvailabilityInfo =
      profile?.availability_info &&
      typeof profile.availability_info === "object" &&
      !Array.isArray(profile.availability_info)
        ? { ...profile.availability_info, availability_status: newStatus }
        : { availability_status: newStatus };

    dispatch(
      setProfileData({
        availability: newStatus,
        availability_status: newStatus,
        availability_info: newAvailabilityInfo,
      }),
    );

    try {
      const updatedProfile = {
        ...profile,
        availability: newStatus,
        availability_status: newStatus,
        availability_info: newAvailabilityInfo,
      };
      await setStoredProfile(updatedProfile);
    } catch (e) {}

    try {
      const response = await updateChefAvailability(newStatus);
      if (response && response.success && response.user) {
        const { normalizeProfile } = require("../../services/profileApi");
        dispatch(setProfileData(normalizeProfile(response.user)));
      }
    } catch (err) {}
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
    ta: "தமிழ்",
  };

  const currentLanguageName = LANGUAGE_LABELS[i18n.language] || "English";

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#002b5c" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={normalize(22)} color="#002b5c" />
        </TouchableOpacity>

        <Text style={styles.headerBarTitle}>
          {t("chefProfileTitle", "Chef Profile")}
        </Text>

        {/* Bell Icon with Red Dot Indicator */}
        <TouchableOpacity
          onPress={() => navigation.navigate("EmployerNotifications")}
          style={styles.headerBellBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={normalize(22)} color="#002b5c" />
          <View style={styles.bellRedDot} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Divider Line Below Header */}
      <View style={styles.headerHorizontalLine} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chef Hero Card */}
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.heroTopRow}
            onPress={() =>
              navigation.navigate("ChefProfileDetails", {
                chef: profile,
                isOwnProfile: true,
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.avatarWrapper}>
              {logoSource ? (
                <Image
                  source={logoSource}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={normalize(32)} color="#a5b4fc" />
                </View>
              )}
              <View style={styles.cameraBadgeCircle}>
                <Ionicons name="camera" size={normalize(10)} color="#ffffff" />
              </View>
            </View>

            <View style={styles.heroTextCol}>
              <View style={styles.nameRow}>
                <Text style={styles.heroNameText}>{displayName}</Text>
                <View style={styles.activePillBadge}>
                  <View style={styles.greenActiveDot} />
                  <Text style={styles.activePillText}>{t("active", "Active")}</Text>
                </View>
              </View>

              <Text style={styles.heroRoleText}>{displayTitle}</Text>

              <View style={styles.jobTypePillBadge}>
                <Text style={styles.jobTypePillText}>
                  {profile?.job_type || "Freelance"}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={normalize(20)} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.heroDividerLine} />

          {/* Bottom 3 Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItemCol}>
              <View style={styles.metricTitleRow}>
                <Ionicons name="location-outline" size={normalize(15)} color="#002b5c" style={{ marginRight: normalize(3) }} />
                <Text style={styles.metricValueText} numberOfLines={1}>
                  {displayCity}
                </Text>
              </View>
              <Text style={styles.metricLabelText}>{t("currentLocation", "Current Location")}</Text>
            </View>

            <View style={styles.metricVerticalDivider} />

            <View style={styles.metricItemCol}>
              <View style={styles.metricTitleRow}>
                <Ionicons name="briefcase-outline" size={normalize(15)} color="#002b5c" style={{ marginRight: normalize(3) }} />
                <Text style={styles.metricValueText} numberOfLines={1}>
                  {displayExperience}
                </Text>
              </View>
              <Text style={styles.metricLabelText}>{t("experience", "Experience")}</Text>
            </View>

            <View style={styles.metricVerticalDivider} />

            <View style={styles.metricItemCol}>
              <View style={styles.metricTitleRow}>
                <Ionicons name="time-outline" size={normalize(15)} color="#002b5c" style={{ marginRight: normalize(3) }} />
                <Text style={styles.metricValueText} numberOfLines={1}>
                  {displayAvailability}
                </Text>
              </View>
              <Text style={styles.metricLabelText}>{t("availability", "Availability")}</Text>
            </View>
          </View>
        </View>

        {/* Profile Completion Progress Card */}
        <View style={styles.completionCardBox}>
          <View style={styles.completionTopRow}>
            <Text style={styles.completionCardTitle}>{t("profileCompletion", "Profile Completion")}</Text>
            <Text style={styles.completionCardValue}>{`${completionPercent}% Complete`}</Text>
          </View>

          <View style={styles.completionTrack}>
            <View style={[styles.completionFill, { width: `${completionPercent}%` }]} />
          </View>

          <TouchableOpacity
            style={styles.completionActionBox}
            onPress={() =>
              navigation.navigate("ChefCompleteProfile", {
                step: getMissingFieldStep(),
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.completionActionIconCircle}>
              <Ionicons name="cloud-upload-outline" size={normalize(18)} color="#002b5c" />
            </View>
            <View style={styles.completionActionTextCol}>
              <Text style={styles.completionActionTitle}>{getMissingFieldText()}</Text>
              <Text style={styles.completionActionSub}>
                {t("completeProfileVisibilitySub", "A complete profile gets more visibility")}
              </Text>
            </View>
            <View style={styles.completionArrowCircle}>
              <Ionicons name="arrow-forward" size={normalize(14)} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 1: MY ACTIVITY */}
        <Text style={styles.sectionHeadingText}>{t("myActivity", "MY ACTIVITY")}</Text>
        <View style={styles.groupMenuCard}>
          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("Applications")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="mail-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <Text style={styles.menuRowLabel}>{t("myApplications", "My Applications")}</Text>
            </View>
            <View style={styles.menuRowRight}>
              <View style={styles.badgeOrangePill}>
                <Text style={styles.badgeOrangeText}>{applicationsCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("SavedJobs")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="star-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <Text style={styles.menuRowLabel}>{t("mySavedJobs", "My Saved Jobs")}</Text>
            </View>
            <View style={styles.menuRowRight}>
              <View style={styles.badgeOrangePill}>
                <Text style={styles.badgeOrangeText}>{savedJobsCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("MyJobs")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="share-social-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <Text style={styles.menuRowLabel}>{t("myPostedJobs", "My Posted Jobs")}</Text>
            </View>
            <View style={styles.menuRowRight}>
              <View style={styles.badgeOrangePill}>
                <Text style={styles.badgeOrangeText}>{postedJobsCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("ProfileViews")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="eye-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <Text style={styles.menuRowLabel}>{t("profileViews", "Profile Views")}</Text>
            </View>
            <View style={styles.menuRowRight}>
              <View style={styles.badgeOrangePill}>
                <Text style={styles.badgeOrangeText}>{stats.profile_views}</Text>
              </View>
              <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: PROFESSIONAL TOOLS */}
        <Text style={styles.sectionHeadingText}>{t("professionalTools", "PROFESSIONAL TOOLS")}</Text>
        <View style={styles.groupMenuCard}>
          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("CalendlyIntegration")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="calendar-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuRowLabel}>{t("calendlyIntegration", "Calendly Integration")}</Text>
                <Text style={styles.menuRowSub}>Manage your scheduling link</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("SocialMediaLinks")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="globe-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuRowLabel}>{t("socialMediaLinksTitle", "Social Media Links")}</Text>
                <Text style={styles.menuRowSub}>Manage your connected accounts</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <View style={styles.menuRowItem}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="time-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuRowLabel}>{t("availability", "Availability")}</Text>
                <Text style={styles.menuRowSub}>Update your availability status</Text>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: "#cbd5e1", true: "#cbd5e1" }}
              thumbColor={isAvailable ? "#002b5c" : "#94a3b8"}
            />
          </View>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={handleShareProfile}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconCircle}>
                <Ionicons name="share-outline" size={normalize(18)} color="#002b5c" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuRowLabel}>{t("shareProfessionalProfile", "Share Professional Profile")}</Text>
                <Text style={styles.menuRowSub}>Share your profile with others</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Section 3: SETTINGS & SUPPORT */}
        <Text style={styles.sectionHeadingText}>{t("settingsAndSupport", "SETTINGS & SUPPORT")}</Text>
        <View style={styles.groupMenuCard}>
          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("Language")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: "#f1f5f9" }]}>
                <Ionicons name="language-outline" size={normalize(18)} color="#64748b" />
              </View>
              <Text style={styles.menuRowLabel}>{t("language", "Language")}</Text>
            </View>
            <View style={styles.menuRowRight}>
              <Text style={styles.langValueText}>{currentLanguageName}</Text>
              <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("TalentSettings")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: "#f1f5f9" }]}>
                <Ionicons name="settings-outline" size={normalize(18)} color="#64748b" />
              </View>
              <Text style={styles.menuRowLabel}>{t("settingsTitle", "Settings")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => navigation.navigate("HelpSupport")}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: "#f1f5f9" }]}>
                <Ionicons name="headset-outline" size={normalize(18)} color="#64748b" />
              </View>
              <Text style={styles.menuRowLabel}>{t("helpAndSupport", "Help & Support")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.menuRowDivider} />

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: "#fff7ed" }]}>
                <Ionicons name="log-out-outline" size={normalize(18)} color="#f57f20" />
              </View>
              <Text style={[styles.menuRowLabel, { color: "#f57f20" }]}>{t("logOut", "Log Out")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#94a3b8" />
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
            <View style={styles.modalIconCircle}>
              <Ionicons name="log-out-outline" size={normalize(22)} color="#f57f20" />
            </View>
            <Text style={styles.modalTitleText}>
              {t("profile.logoutConfirmTitle", "Logout")}
            </Text>
            <Text style={styles.modalSubText}>
              {t("profile.logoutConfirm", "Are you sure you want to logout?")}
            </Text>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={[styles.modalBtn, styles.modalCancelBtn]}
              >
                <Text style={styles.modalCancelBtnText}>
                  {t("cancel", "Cancel")}
                </Text>
              </Pressable>
              <Pressable
                onPress={executeLogout}
                style={[styles.modalBtn, styles.modalConfirmBtn]}
              >
                <Text style={styles.modalConfirmBtnText}>
                  {t("logout", "Logout")}
                </Text>
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
    backgroundColor: "#f7f8fd",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingTop: normalize(10),
    paddingBottom: normalize(12),
    backgroundColor: "#f7f8fd",
  },
  headerHorizontalLine: {
    height: 1,
    backgroundColor: "#e2e8f0",
    width: "100%",
  },
  headerBackBtn: {
    padding: normalize(4),
  },
  headerBarTitle: {
    fontSize: normalize(18),
    fontWeight: "700",
    color: "#0f172a",
  },
  headerBellBtn: {
    padding: normalize(4),
    position: "relative",
  },
  bellRedDot: {
    position: "absolute",
    top: normalize(3),
    right: normalize(3),
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(6),
    gap: normalize(14),
    paddingBottom: normalize(30),
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#f4f6f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(14),
    padding: normalize(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: normalize(12),
  },
  avatarImage: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: "#eef2ff",
  },
  avatarPlaceholder: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadgeCircle: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: normalize(18),
    height: normalize(18),
    borderRadius: normalize(9),
    backgroundColor: "#002b5c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  heroTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
    marginBottom: normalize(2),
  },
  heroNameText: {
    fontSize: normalize(17),
    fontWeight: "700",
    color: "#0f172a",
    flexShrink: 1,
  },
  activePillBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f4ea",
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(10),
    gap: normalize(4),
  },
  greenActiveDot: {
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
    backgroundColor: "#16a34a",
  },
  activePillText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#16a34a",
  },
  heroRoleText: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#475569",
    marginBottom: normalize(4),
  },
  jobTypePillBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(6),
  },
  jobTypePillText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#4f46e5",
  },
  heroDividerLine: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: normalize(10),
  },

  // 3 Metrics Row
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricItemCol: {
    flex: 1,
    alignItems: "flex-start",
  },
  metricTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(2),
  },
  metricValueText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#0f172a",
  },
  metricLabelText: {
    fontSize: normalize(10),
    fontWeight: "500",
    color: "#94a3b8",
  },
  metricVerticalDivider: {
    width: 1,
    height: normalize(22),
    backgroundColor: "#cbd5e1",
    marginHorizontal: normalize(6),
  },

  // Profile Completion Card
  completionCardBox: {
    backgroundColor: "#f4f6f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(14),
    padding: normalize(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  completionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(4),
  },
  completionCardTitle: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#0f172a",
  },
  completionCardValue: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#002b5c",
  },
  completionTrack: {
    height: normalize(6),
    backgroundColor: "#e2e8f0",
    borderRadius: normalize(3),
    overflow: "hidden",
    marginBottom: normalize(8),
  },
  completionFill: {
    height: "100%",
    backgroundColor: "#002b5c",
    borderRadius: normalize(3),
  },
  completionActionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: normalize(10),
    padding: normalize(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  completionActionIconCircle: {
    width: normalize(30),
    height: normalize(30),
    borderRadius: normalize(8),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(8),
  },
  completionActionTextCol: {
    flex: 1,
  },
  completionActionTitle: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(1),
  },
  completionActionSub: {
    fontSize: normalize(10.5),
    fontWeight: "500",
    color: "#64748b",
  },
  completionArrowCircle: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(13),
    backgroundColor: "#002b5c",
    alignItems: "center",
    justifyContent: "center",
  },

  // Section Heading
  sectionHeadingText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.8,
    marginTop: normalize(2),
  },

  // Group Menu Card
  groupMenuCard: {
    backgroundColor: "#f4f6f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(14),
    paddingVertical: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(7),
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconCircle: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(12),
  },
  menuTextCol: {
    flex: 1,
  },
  menuRowLabel: {
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#0f172a",
  },
  menuRowSub: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#64748b",
    marginTop: normalize(1),
  },
  menuRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  badgeOrangePill: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(10),
  },
  badgeOrangeText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#f97316",
  },
  langValueText: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#64748b",
  },
  menuRowDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: normalize(10),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: normalize(24),
  },
  modalCard: {
    width: "100%",
    maxWidth: normalize(320),
    backgroundColor: "#ffffff",
    borderRadius: normalize(20),
    padding: normalize(20),
    alignItems: "center",
    elevation: 5,
  },
  modalIconCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(12),
  },
  modalTitleText: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(6),
  },
  modalSubText: {
    fontSize: normalize(13),
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    marginBottom: normalize(18),
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: normalize(10),
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    height: normalize(42),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#f1f5f9",
  },
  modalCancelBtnText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#64748b",
  },
  modalConfirmBtn: {
    backgroundColor: "#f57f20",
  },
  modalConfirmBtnText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#ffffff",
  },
});
