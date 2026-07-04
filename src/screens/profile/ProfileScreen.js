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

  const displayName = profile?.name && profile.name !== "Guest User" ? profile.name : "Chef Rajesh";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const completion = profile?.completionPercentage || 65;

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
    if (!profile) return t("profile.addSkills", "Add Skills (+10%)");

    if (!profile.profile_photo_path) {
      return t("profile.addPhotoAction", "Add Profile Photo (+10%)");
    }
    if (!profile.email) {
      return t("profile.addEmailAction", "Add Email Address (+10%)");
    }
    if (!profile.city) {
      return t("profile.addCityAction", "Add Current City (+10%)");
    }
    if (!profile.skills) {
      return t("profile.addSkillsAction", "Add Skills (+10%)");
    }
    if (!profile.current_employer) {
      return t("profile.addEmployerAction", "Add Current Employer (+10%)");
    }
    if (!profile.gender) {
      return t("profile.addGenderAction", "Add Gender (+10%)");
    }
    
    return t("profile.profileCompleteText", "Profile is complete!");
  };

  return (
    <ScreenWrapper
      edges={["left", "right", "bottom"]}
      style={{ backgroundColor: "#FFFFFF" }}
      contentStyle={[styles.page, { padding: 0, gap: 0 }]}
      scroll={true}
    >
      {/* Top Header */}
      <View style={styles.headerSection}>
        <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            {profile?.profile_photo_path ? (
              <Image
                source={{ uri: profile.profile_photo_path }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={42} color="#16A34A" />
              </View>
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userPhone}>
            {profile?.phone || "+91 98765 43210"}
          </Text>
          <Text style={styles.userTag}>{t("profile.userTag", "India & Overseas")}</Text>
        </View>
      </View>

      {/* Profile Completion Card */}
      <View style={styles.completionCardContainer}>
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>{t("profile.profileCompletion", "Profile Completion")}</Text>
            <Text style={styles.completionPercent}>{completion}%</Text>
          </View>

          {/* Progress bar with absolute marker */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${completion}%` }]} />
            </View>
            <View style={[styles.progressTooltip, { left: `${completion}%` }]}>
              <View style={styles.tooltipInner}>
                <Text style={styles.tooltipText}>T</Text>
              </View>
            </View>
          </View>

          {/* Dynamic Missing Field / Add Skills Action */}
          <Pressable
            style={styles.addSkillsBar}
            onPress={() => navigation.navigate("CompleteProfileScreen")}
          >
            <Text style={styles.addSkillsText}>{getMissingFieldText()}</Text>
            <Ionicons 
              name={completion >= 100 ? "checkmark-circle" : "add-circle"} 
              size={18} 
              color="#22C55E" 
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
              <Ionicons name="paper-plane-outline" size={18} color="#64748B" />
            </View>
            <Text style={styles.menuItemLabel}>{t("profile.menu.myApplications", "My Applications")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={[styles.badge, styles.badgeRed]}>
              <Text style={[styles.badgeText, styles.badgeTextRed]}>
                {applicationsCount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </Pressable>

        {/* Item: My Posted Jobs */}
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("MyJobs")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="megaphone-outline" size={18} color="#64748B" />
            </View>
            <Text style={styles.menuItemLabel}>{t("profile.menu.myPostedJobs", "My Posted Jobs")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeText, styles.badgeTextGreen]}>
                {myJobsCount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </Pressable>

        {/* Item: My Saved Jobs */}
        <Pressable
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => navigation.navigate("SavedJobs")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="star-outline" size={18} color="#64748B" />
            </View>
            <Text style={styles.menuItemLabel}>{t("profile.menu.savedJobs", "My Saved Jobs")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text style={[styles.badgeText, styles.badgeTextBlue]}>
                {savedJobsCount}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </Pressable>
      </View>

      {/* Screen Divider */}
      <View style={styles.screenDivider} />

      {/* Settings / Logout Section */}
      <View style={styles.menuList}>
        {/* Item: Language */}
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("Language")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="globe-outline" size={18} color="#64748B" />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuItemLabel}>{t("profile.menu.language", "Language")}</Text>
              <Text style={styles.menuItemSublabel}>{getLanguageLabel()}</Text>
            </View>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </Pressable>

        {/* Item: Logout */}
        <Pressable
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={() => setShowLogoutModal(true)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconCircle, styles.iconCircleRed]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.menuItemLabel, styles.logoutLabel]}>{t("logout", "Logout")}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </View>
        </Pressable>
      </View>

      {/* Footer version text */}
      <Text style={styles.footerVersion}>JobConnect v4.2.0</Text>

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
    backgroundColor: "#FFFFFF",
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
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: "#22C55E",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
    backgroundColor: "#F2FBF5",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 4,
  },
  userTag: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  completionCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  completionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 16,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  completionPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
  },
  progressContainer: {
    position: "relative",
    height: 38,
    justifyContent: "center",
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#047857",
  },
  progressTooltip: {
    position: "absolute",
    top: 0,
    marginLeft: -16, // center the marker pin
  },
  tooltipInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#A21CAF", // purple color matching screenshot
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  addSkillsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  addSkillsText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  menuList: {
    backgroundColor: "#FFFFFF",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleRed: {
    backgroundColor: "#FEE2E2",
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginLeft: 12,
  },
  logoutLabel: {
    color: "#EF4444",
  },
  menuTextGroup: {
    marginLeft: 12,
  },
  menuItemSublabel: {
    fontSize: 12,
    color: "#64748B",
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
    backgroundColor: "#FEE2E2",
  },
  badgeGreen: {
    backgroundColor: "#DCFCE7",
  },
  badgeBlue: {
    backgroundColor: "#DBEAFE",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "750",
  },
  badgeTextRed: {
    color: "#EF4444",
  },
  badgeTextGreen: {
    color: "#16A34A",
  },
  badgeTextBlue: {
    color: "#2563EB",
  },
  screenDivider: {
    height: 12,
    backgroundColor: "#F8FAFC",
    width: "100%",
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  footerVersion: {
    fontSize: 12,
    color: "#94A3B8",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modalTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  modalText: {
    color: "#64748B",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalConfirmButton: {
    backgroundColor: colors.danger,
  },
  modalCancelText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
