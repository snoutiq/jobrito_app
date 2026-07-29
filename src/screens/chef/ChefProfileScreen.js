import React, { useState, useEffect } from "react";
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
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import colors from "../../constants/colors";
import { resetUser, setProfileData, fetchProfile } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage, setStoredProfile } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";
import { getChefAppointments, getChefDashboardStats, getChefProfileViews, saveChefOnboarding, updateChefAvailability } from "../../services/chefApi";
import { getSavedJobs } from "../../services/jobApi";
import { getApplicationHistory } from "../../services/applicationApi";

const PRIMARY_GREEN = "#153e69";

export default function ChefProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const [loading, setLoading] = useState(true);

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displayName = profile?.name || profile?.full_name || "Chef Rajesh Kumar";
  const displayTitle = profile?.professionalTitle || profile?.preferred_role || "Culinary Consultant & Kitchen Setup Expert";
  
  console.log("[DEBUG ChefProfileScreen] Profile state:", JSON.stringify(profile));
  
  const displayCity = profile?.city && profile?.country 
    ? `${profile.city}, ${profile.country}`
    : profile?.city || profile?.country || "";
  const displayPrefLocation = profile?.locationPreference || profile?.location_preference || "";
  const displayExperience = profile?.experienceYears || profile?.experience_range || profile?.experience || "";

  const getRegionalList = () => {
    let list = [];
    if (profile?.availability_info && typeof profile.availability_info === "object" && !Array.isArray(profile.availability_info)) {
      list = profile.availability_info.regional_experience || [];
    } else if (profile?.regional_experience) {
      list = profile.regional_experience;
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getAvailability = () => {
    if (profile?.availability_info && typeof profile.availability_info === "object" && !Array.isArray(profile.availability_info)) {
      return profile.availability_info.availability_status || profile.availability || "Available for Consultation";
    }
    return profile?.availability || "Available for Consultation";
  };
  const displayAvailability = getAvailability();

  const isAvailable = 
    displayAvailability === "Available" || 
    displayAvailability === "Available for Consultation" || 
    displayAvailability === "Available Immediately" ||
    displayAvailability === "Available immediately";

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    
    const calendly = profile?.calendly_link || profile?.calendlyUrl || profile?.calendlyLink;
    const hasCalendly = calendly && 
                        calendly.trim().length > 0 && 
                        !/^(https?:\/\/)?(www\.)?calendly\.com\/?$/i.test(calendly.trim());

    const hasPhoto = !!(profile.profile_photo_path || profile.profile_photo);
    const hasCity = !!profile.city;
    const hasBio = !!profile.bio;
    const hasCuisines = !!(profile.cuisines || profile.cuisine_specialty);
    const hasSkills = !!(profile.operations || profile.skills);

    const isActuallyComplete = hasPhoto && hasCity && hasBio && hasCuisines && hasSkills && hasCalendly;

    if (isActuallyComplete) {
      const apiPct = profile.completeness ?? profile.profile_completeness ?? profile.completionPercentage;
      if (apiPct !== undefined && apiPct !== null && apiPct > 0) {
        return apiPct;
      }
    }

    let totalFields = 11;
    let filledFields = 0;

    if (profile?.full_name || profile?.name) filledFields++;
    if (profile?.profile_photo_path || profile?.profile_photo) filledFields++;
    if (profile?.professionalTitle || profile?.preferred_role) filledFields++;
    if (profile?.city) filledFields++;
    if (profile?.country) filledFields++;
    if (profile?.experienceYears || profile?.experience_range || profile?.experience) filledFields++;
    if (profile?.bio) filledFields++;
    
    // Languages
    const langs = profile?.languages;
    if (Array.isArray(langs) && langs.length > 0) filledFields++;
    else if (typeof langs === "string" && langs.trim().length > 0) filledFields++;

    // Cuisines
    const cuisines = profile?.cuisines || profile?.cuisine_specialty;
    if (Array.isArray(cuisines) && cuisines.length > 0) filledFields++;
    else if (typeof cuisines === "string" && cuisines.trim().length > 0) filledFields++;

    // Skills/Operations
    const ops = profile?.operations || profile?.skills;
    if (Array.isArray(ops) && ops.length > 0) filledFields++;
    else if (typeof ops === "string" && ops.trim().length > 0) filledFields++;

    // Calendly Link (Only if it's actually set and not default domain placeholder)
    if (hasCalendly) {
      filledFields++;
    }

    return Math.round((filledFields / totalFields) * 100);
  };

  const getMissedOutFields = () => {
    const missed = [];
    if (!profile?.profile_photo_path && !profile?.profile_photo) missed.push(t("profilePhoto", "Profile Photo"));
    if (!profile?.bio) missed.push(t("bio", "Bio"));
    
    const langs = profile?.languages;
    if (!langs || (Array.isArray(langs) && langs.length === 0) || (typeof langs === "string" && !langs.trim())) {
      missed.push(t("languages", "Languages"));
    }

    const cuisines = profile?.cuisines || profile?.cuisine_specialty;
    if (!cuisines || (Array.isArray(cuisines) && cuisines.length === 0) || (typeof cuisines === "string" && !cuisines.trim())) {
      missed.push(t("cuisines", "Cuisines"));
    }

    const ops = profile?.operations || profile?.skills;
    if (!ops || (Array.isArray(ops) && ops.length === 0) || (typeof ops === "string" && !ops.trim())) {
      missed.push(t("skills", "Operational Skills"));
    }

    const calendly = profile?.calendly_link || profile?.calendlyUrl || profile?.calendlyLink;
    const isCalendlyValid = calendly && 
                            calendly.trim().length > 0 && 
                            !/^(https?:\/\/)?(www\.)?calendly\.com\/?$/i.test(calendly.trim());
    if (!isCalendlyValid) {
      missed.push("Calendly");
    }
 
    return missed;
  };

  const getMissingFieldText = () => {
    if (completionPercent >= 100) return t("profile.allInfoAdded", "All information added successfully!");
    
    if (!profile?.profile_photo_path && !profile?.profile_photo) return t("profile.addPhotoAction", "Add Profile Photo");
    if (!profile?.bio) return t("profile.addBioAction", "Add Bio");
    
    const langs = profile?.languages;
    if (!langs || (Array.isArray(langs) && langs.length === 0) || (typeof langs === "string" && !langs.trim())) {
      return t("profile.addLanguagesAction", "Add Languages");
    }

    const cuisines = profile?.cuisines || profile?.cuisine_specialty;
    if (!cuisines || (Array.isArray(cuisines) && cuisines.length === 0) || (typeof cuisines === "string" && !cuisines.trim())) {
      return t("profile.addCuisinesAction", "Add Cuisines");
    }

    const ops = profile?.operations || profile?.skills;
    if (!ops || (Array.isArray(ops) && ops.length === 0) || (typeof ops === "string" && !ops.trim())) {
      return t("profile.addSkillsAction", "Add Operational Skills");
    }

    const calendly = profile?.calendly_link || profile?.calendlyUrl || profile?.calendlyLink;
    const isCalendlyValid = calendly && 
                            calendly.trim().length > 0 && 
                            !/^(https?:\/\/)?(www\.)?calendly\.com\/?$/i.test(calendly.trim());
    if (!isCalendlyValid) {
      return t("profile.addCalendlyAction", "Add Calendly Link");
    }

    return t("profile.completeProfilePrompt", "Complete your profile details");
  };

  const completionPercent = getProfileCompletionPercentage();
  const missedFields = getMissedOutFields();

  useEffect(() => {
    if (profile) {
      const pct = getProfileCompletionPercentage();
      const missed = getMissedOutFields();
      if (pct < 100 && missed.length > 0) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: t("completeProfileAlertTitle", "Complete Your Profile!"),
            body: t("completeProfileAlertBody", "Increase employer trust! Add: ") + missed.slice(0, 3).join(", "),
            sound: true,
          },
          trigger: null,
        }).catch(err => console.log("Failed to send profile completion notification:", err));
      }
    }
  }, [profile]);

  // Refresh dashboard data on focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const fetchDashboardData = async () => {
        try {
          await dispatch(fetchProfile()).unwrap();
          const [statsRes, appsRes, savedRes, appointmentsRes, viewsRes] = await Promise.all([
            getChefDashboardStats().catch(() => null),
            getApplicationHistory().catch(() => null),
            getSavedJobs().catch(() => null),
            getChefAppointments().catch(() => null),
            getChefProfileViews().catch(() => null),
          ]);

          if (!isMounted) return;

          let resolvedProfileViews = 0;
          if (viewsRes?.views && Array.isArray(viewsRes.views)) {
            resolvedProfileViews = viewsRes.total_views !== undefined ? viewsRes.total_views : viewsRes.views.length;
          } else if (statsRes?.stats?.profile_views !== undefined) {
            resolvedProfileViews = statsRes.stats.profile_views;
          }

          if (statsRes?.stats) {
            setStats({
              ...statsRes.stats,
              profile_views: resolvedProfileViews,
            });
          } else if (statsRes?.success && statsRes.stats) {
            setStats({
              ...statsRes.stats,
              profile_views: resolvedProfileViews,
            });
          } else {
            setStats((prev) => ({
              ...prev,
              profile_views: resolvedProfileViews,
            }));
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
        } finally {
          if (isMounted) {
            setLoading(false);
          }
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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const executeLogout = async () => {
    setShowLogoutModal(false);
    try {
      const { logout: logoutApi } = require("../../services/authApi");
      logoutApi().catch(() => {});
    } catch (e) {
      // ignore network logout errors
    }
    await clearAuthStorage();
    dispatch(logout());
    dispatch(resetUser());
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

    // 3. Update server API via dedicated toggle helper
    try {
      await updateChefAvailability(newStatus);
    } catch (err) {
      console.warn("Failed to update availability on server:", err);
    }
  };

  const handleOpenCalendly = () => {
    const link = profile?.calendly_link || profile?.calendlyUrl || profile?.calendlyLink;
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#153e69" />
      </SafeAreaView>
    );
  }

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
              <View style={styles.avatarContainer}>
                <Image source={logoSource} style={styles.avatarImage} resizeMode="cover" />
              </View>
            ) : (
              <View style={[styles.avatarContainer, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={28} color="rgba(10, 5, 4, 0.6)" />
              </View>
            )}
            <View style={styles.profileTextInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              {Boolean(displayTitle) && (
                <Text style={styles.profileTitle}>Current Role: {displayTitle}</Text>
              )}
              
              <View style={styles.profileDetailsList}>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Current Location: </Text>
                  <Text style={styles.detailValue}>{displayCity || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Preferred Job Location: </Text>
                  <Text style={styles.detailValue}>
                    {displayPrefLocation === "Both" || displayPrefLocation === "Both (India & Overseas)"
                      ? "India & Overseas"
                      : displayPrefLocation || "N/A"}
                  </Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Experience: </Text>
                  <Text style={styles.detailValue}>{displayExperience || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Regional Experience: </Text>
                  <Text style={styles.detailValue}>{getRegionalList().join(", ") || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Availability: </Text>
                  <Text style={styles.detailValue}>{displayAvailability || "N/A"}</Text>
                </Text>
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

        {/* Profile Completion banner */}
        {completionPercent < 100 && (
          <View style={styles.completionCardContainer}>
            <View style={styles.completionCard}>
              <View style={styles.completionHeader}>
                <Text style={styles.completionTitle}>{t("profile.profileCompletion", "Profile Completion")}</Text>
                <Text style={styles.completionPercent}>{completionPercent}%</Text>
              </View>

              {/* Clean Progress bar track */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
                </View>
              </View>

              {/* Dynamic Missing Field / Add Action */}
              <Pressable
                style={styles.addSkillsBar}
                onPress={() => navigation.navigate("ChefCompleteProfile")}
              >
                <Text style={styles.addSkillsText}>{getMissingFieldText()}</Text>
                <Ionicons 
                  name={completionPercent >= 100 ? "create-outline" : "add-circle"} 
                  size={18} 
                  color="#153e69" 
                />
              </Pressable>
            </View>
          </View>
        )}

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
              <Ionicons name="star-outline" size={20} color="#153e69" style={styles.menuIcon} />
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
        </View>

        {/* Professional Tools */}
        <Text style={styles.sectionTitle}>{t("chefDashboard.professionalTools")}</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigation.navigate("CalendlyIntegration")}>
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
            onPress={() => navigation.navigate("SocialMediaLinks")}
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
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: "rgba(10, 5, 4, 0.15)", true: "#f2c879" }}
              thumbColor={isAvailable ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.4)"}
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
              <Ionicons name="headset-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.menuIcon} />
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
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
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
                onPress={executeLogout}
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
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#153e69",
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: "#f2f2f3",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
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
    marginBottom: 4,
    lineHeight: 16,
  },
  profileDetailsList: {
    marginTop: 4,
    gap: 3,
  },
  detailRowText: {
    fontSize: 12,
    lineHeight: 18,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.5)",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.8)",
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
  completionCardContainer: {
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  completionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 20,
    padding: 16,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0a0504",
  },
  completionPercent: {
    fontSize: 13,
    fontWeight: "800",
    color: "#153e69",
  },
  progressContainer: {
    height: 6,
    marginBottom: 12,
    width: "100%",
  },
  progressBarTrack: {
    height: 6,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  addSkillsText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
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
    backgroundColor: "rgba(239, 68, 68, 0.08)",
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
    borderColor: "rgba(10, 5, 4, 0.12)",
  },
  modalConfirmButton: {
    backgroundColor: "#ef4444",
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
});
