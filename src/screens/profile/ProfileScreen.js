import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { fetchProfile, resetUser, updateProfile } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { fetchSavedJobs, fetchMyJobs } from "../../redux/slices/jobSlice";
import { fetchApplicationHistory } from "../../redux/slices/applicationSlice";
import { clearAuthStorage } from "../../services/storage";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { profile, activeRole } = useSelector((state) => state.user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Redux counts using real data
  const savedJobsCount = useSelector((state) => state.job.savedJobs?.length) || 0;
  const myJobsCount = useSelector((state) => state.job.myJobs?.length) || 0;
  const applicationsCount = useSelector((state) => state.application?.history?.length) || 0;

  const displayName = profile?.name && profile.name !== "Guest User" ? profile.name : (profile?.full_name || "");
  const displayTitle = profile?.preferred_role || profile?.professionalTitle || profile?.designation || profile?.current_position || profile?.title || "";
  const displayCity = profile?.city && profile?.country
    ? `${profile.city}, ${profile.country}`
    : profile?.city || profile?.country || "";
  const displayPrefLocation = profile?.location_preference || profile?.locationPreference || profile?.location || "";
  const displayExperience = profile?.experience_range || profile?.experienceYears || profile?.experience || "";
  const displayEmployer = profile?.current_employer || profile?.currentEmployer || profile?.company || profile?.business_name || "";
  const displaySkills = Array.isArray(profile?.skills)
    ? profile.skills.filter(Boolean).join(", ")
    : typeof profile?.skills === "string"
    ? profile.skills.trim()
    : Array.isArray(profile?.operations)
    ? profile.operations.filter(Boolean).join(", ")
    : typeof profile?.operations === "string"
    ? profile.operations.trim()
    : "";
  const logoSource = profile?.profile_photo_path || profile?.profile_photo || profile?.company_logo || profile?.companyLogo || null;

  const initials = displayName
    ? displayName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const getDynamicCompletion = () => {
    if (!profile) return 0;
    
    const hasLogo = !!(profile.company_logo || profile.companyLogo || profile.profile_photo_path);
    const hasBusinessName = !!(profile.business_name || profile.businessName || profile.company);
    const hasSegment = !!(profile.industry_segment || profile.segment);
    const hasLocation = !!(profile.business_location || profile.location);

    const isActuallyComplete = hasLogo && hasBusinessName && hasSegment && hasLocation;

    if (isActuallyComplete) {
      const apiPct = profile.completeness ?? profile.profile_completeness ?? profile.completionPercentage;
      if (apiPct !== undefined && apiPct !== null && apiPct > 0) {
        return apiPct;
      }
    }

    let fields = 0;
    let filled = 0;
    
    // 1. Name
    fields++;
    if (profile.name && profile.name !== "Guest User" && profile.name.trim()) {
      filled++;
    } else if (profile.full_name && profile.full_name.trim()) {
      filled++;
    }
    
    // 2. Profile Photo
    fields++;
    if (profile.profile_photo_path || profile.profile_photo) {
      filled++;
    }
    
    // 3. City
    fields++;
    if (profile.city && profile.city.trim()) {
      filled++;
    }
    
    // 4. Skills
    fields++;
    const skills = profile.skills;
    if (Array.isArray(skills) && skills.length > 0) {
      filled++;
    } else if (typeof skills === "string" && skills.trim()) {
      filled++;
    }
    
    // 5. Current Employer
    fields++;
    if (profile.current_employer && profile.current_employer.trim()) {
      filled++;
    }
    
    // 6. Gender
    fields++;
    if (profile.gender && profile.gender.trim()) {
      filled++;
    }
    
    return Math.round((filled / fields) * 100);
  };
  
  const completion = getDynamicCompletion();

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSavedJobs());
    dispatch(fetchMyJobs());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.email) {
      dispatch(fetchApplicationHistory(profile.email));
    } else {
      dispatch(fetchApplicationHistory());
    }
  }, [dispatch, profile]);

  const handleAvatarPress = () => {
    Alert.alert(
      t("profile.uploadPhoto", "Upload Photo"),
      t("profile.chooseSource", "Choose an option to upload your photo"),
      [
        {
          text: t("profile.camera", "Camera"),
          onPress: handleTakePhoto,
        },
        {
          text: t("profile.library", "Gallery"),
          onPress: handlePickImage,
        },
        {
          text: t("cancel"),
          style: "cancel",
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("mediaLibraryPermissionRequired", "Sorry, we need camera roll permissions to upload a photo.")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("cameraPermissionRequired", "Sorry, we need camera permissions to take a photo.")
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  const uploadSelectedPhoto = async (uri) => {
    const payload = {
      ...profile,
      profile_photo_path: uri,
    };
    try {
      await dispatch(updateProfile(payload)).unwrap();
      dispatch(fetchProfile());
      Alert.alert("Success", "Profile photo updated successfully!");
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to update profile photo.");
    }
  };

  const handleLogout = async () => {
    try {
      const { logout: logoutApi } = require("../../services/authApi");
      await logoutApi();
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

  const getLanguageLabel = () => {
    const lang = i18n.language;
    if (lang === "hi") return "Hindi (हिंदी)";
    if (lang === "mr") return "Marathi (मराठी)";
    if (lang === "ar") return "Arabic (العربية)";
    if (lang === "ml") return "Malayalam (മലയാളം)";
    if (lang === "kn") return "Kannada (ಕನ್ನಡ)";
    if (lang === "te") return "Telugu (తెలుగు)";
    if (lang === "ta") return "Tamil (தமிழ்)";
    return "English (Device default)";
  };

  const getMissingFieldText = () => {
    if (!profile) return t("profile.addSkills", "Add Skills");

    if (completion >= 100) {
      return t("profile.editProfile", "Edit Profile");
    }

    if (!profile.profile_photo_path && !profile.profile_photo) {
      return t("profile.addPhotoAction", "Add Profile Photo");
    }
    if (!profile.city) {
      return t("profile.addCityAction", "Add Current City");
    }
    if (!profile.skills || (Array.isArray(profile.skills) && profile.skills.length === 0)) {
      return t("profile.addSkillsAction", "Add Skills");
    }
    if (!profile.current_employer) {
      return t("profile.addEmployerAction", "Add Current Employer");
    }
    if (!profile.gender) {
      return t("profile.addGenderAction", "Add Gender");
    }
    
    return t("profile.editProfile", "Edit Profile");
  };

  return (
    <ScreenWrapper
      edges={["left", "right", "bottom"]}
      style={{ backgroundColor: "#ffffff" }}
      contentStyle={[styles.page, { padding: 0, gap: 0 }]}
      scroll={true}
    >
      {/* Top Header */}
      <View style={styles.headerSection}>
      </View>

      {/* Talent Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeaderRow}>
          {logoSource ? (
            <View style={styles.avatarContainer}>
              <Image source={{ uri: logoSource }} style={styles.avatarImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={[styles.avatarContainer, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={28} color="rgba(10, 5, 4, 0.6)" />
            </View>
          )}
          <View style={styles.profileTextInfo}>
            <Text style={styles.profileName}>{displayName || t("profile.guestUser", "Guest User")}</Text>
            {displayTitle ? (
              <Text style={styles.profileTitle}>{displayTitle}</Text>
            ) : null}
            <View style={styles.profileDetailsList}>
              {displayCity ? (
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("profile.currentLocation", "Current Location:")}</Text>
                  <Text style={styles.detailValue}>{displayCity}</Text>
                </Text>
              ) : null}
              {displayExperience ? (
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("profile.experience", "Experience:")}</Text>
                  <Text style={styles.detailValue}>{displayExperience}</Text>
                </Text>
              ) : null}
              {displayEmployer ? (
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("profile.currentEmployer", "Current Employer:")}</Text>
                  <Text style={styles.detailValue}>{displayEmployer}</Text>
                </Text>
              ) : null}
              {displaySkills ? (
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("profile.skills", "Skills:")}</Text>
                  <Text style={styles.detailValue}>{displaySkills}</Text>
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* Profile Completion Card */}
      <View style={styles.completionCardContainer}>
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>{t("profile.profileCompletion", "Profile Completion")}</Text>
            <Text style={styles.completionPercent}>{completion}%</Text>
          </View>
 
          {/* Clean Progress bar track */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${completion}%` }]} />
            </View>
          </View>
 
          {/* Dynamic Missing Field / Add Skills Action */}
          <Pressable
            style={styles.addSkillsBar}
            onPress={() => navigation.navigate("CompleteProfileScreen")}
          >
            <Text style={styles.addSkillsText}>{getMissingFieldText()}</Text>
            <Ionicons 
              name={completion >= 100 ? "create-outline" : "add-circle"} 
              size={18} 
              color="#153e69" 
            />
          </Pressable>
        </View>
      </View>

      {/* Main Actions Card */}
      <View style={styles.menuList}>
        {/* Item: My Applications */}
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("Applications")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="paper-plane-outline" size={18} color="rgba(10, 5, 4, 0.6)" />
            </View>
            <Text style={styles.menuItemLabel}>{t("profile.menu.myApplications", "My Applications")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={[styles.badge, styles.badgeRed]}>
              <Text style={[styles.badgeText, styles.badgeTextRed]}>
                {applicationsCount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.15)" />
          </View>
        </Pressable>

        {/* Item: My Posted Jobs */}
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("MyJobs")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="megaphone-outline" size={18} color="rgba(10, 5, 4, 0.6)" />
            </View>
            <Text style={styles.menuItemLabel}>{t("profile.menu.myPostedJobs", "My Posted Jobs")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeText, styles.badgeTextGreen]}>
                {myJobsCount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.15)" />
          </View>
        </Pressable>

        {/* Item: My Saved Jobs */}
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("SavedJobs")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="star-outline" size={18} color="rgba(10, 5, 4, 0.6)" />
            </View>
            <Text style={styles.menuItemLabel}>{t("profile.menu.savedJobs", "My Saved Jobs")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text style={[styles.badgeText, styles.badgeTextBlue]}>
                {savedJobsCount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.15)" />
          </View>
        </Pressable>

        {/* Item: Language */}
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("Language")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="globe-outline" size={18} color="rgba(10, 5, 4, 0.6)" />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={[styles.menuItemLabel, { marginLeft: 0 }]}>{t("profile.menu.language", "Language")}</Text>
              <Text style={styles.menuItemSublabel}>{getLanguageLabel()}</Text>
            </View>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.15)" />
          </View>
        </Pressable>

        {/* Item: Settings */}
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("TalentSettings")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="settings-outline" size={18} color="rgba(10, 5, 4, 0.6)" />
            </View>
            <Text style={styles.menuItemLabel}>{t("profile.menu.settings", "Settings")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.15)" />
          </View>
        </Pressable>

        {/* Item: Logout */}
        <Pressable
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => setShowLogoutModal(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconCircle, styles.iconCircleRed]}>
              <Ionicons name="log-out-outline" size={18} color="#f57f20" />
            </View>
            <Text style={[styles.menuItemLabel, styles.logoutLabel]}>{t("logout", "Logout")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={16} color="#f57f20" />
          </View>
        </Pressable>
      </View>

      {/* Footer version text */}
      <Text style={styles.footerVersion}>JobRito v4.2.0</Text>

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
            <Text style={styles.modalTitle}>{t("profile.logoutConfirmTitle")}</Text>
            <Text style={styles.modalText}>{t("profile.logoutConfirm")}</Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                style={[styles.modalButton, styles.modalCancelButton]}
              >
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                style={[styles.modalButton, styles.modalConfirmButton]}
              >
                <Text style={styles.modalConfirmText}>{t("logout")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingBottom: 20,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "#153e69",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#153e69",
    borderWidth: 1.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
    marginBottom: 2,
  },
  userTag: {
    fontSize: 12,
    color: "#153e69",
    fontWeight: "600",
  },
  completionCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  menuList: {
    backgroundColor: "#ffffff",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleRed: {
    backgroundColor: "rgba(245, 127, 32, 0.08)",
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0a0504",
    marginLeft: 12,
  },
  logoutLabel: {
    color: "#f57f20",
  },
  menuTextGroup: {
    marginLeft: 12,
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
    marginHorizontal: 20,
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
  menuItemSublabel: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRed: {
    backgroundColor: "rgba(245, 127, 32, 0.08)",
  },
  badgeGreen: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  badgeBlue: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "750",
  },
  badgeTextRed: {
    color: "#f57f20",
  },
  badgeTextGreen: {
    color: "#153e69",
  },
  badgeTextBlue: {
    color: "#153e69",
  },
  screenDivider: {
    height: 12,
    backgroundColor: "#f2f2f3",
    width: "100%",
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  footerVersion: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.4)",
    textAlign: "center",
    marginVertical: 24,
    fontWeight: "500",
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
});
