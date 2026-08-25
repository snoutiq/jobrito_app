import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
} from "react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { profile, activeRole } = useSelector((state) => state.user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
  const logoSource = profile?.profile_photo_path || profile?.profile_photo || profile?.company_logo || profile?.companyLogo || null;

  const getDynamicCompletion = () => {
    if (!profile) return 0;
    const apiPct =
      profile.completeness ??
      profile.profile_completeness ??
      profile.completionPercentage ??
      profile.completion_percentage;
    if (apiPct !== undefined && apiPct !== null && apiPct > 0) {
      return Math.round(Number(apiPct));
    }
    let fields = 0;
    let filled = 0;
    fields++;
    if ((profile.name && profile.name !== "Guest User" && profile.name.trim()) || (profile.full_name && profile.full_name.trim())) filled++;
    fields++;
    if (profile.profile_photo_path || profile.profile_photo) filled++;
    fields++;
    if (profile.city && profile.city.trim()) filled++;
    fields++;
    if (profile.current_employer && profile.current_employer.trim()) filled++;
    return fields > 0 ? Math.round((filled / fields) * 100) : 0;
  };

  const completion = getDynamicCompletion();

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSavedJobs());
    dispatch(fetchMyJobs());
    dispatch(fetchApplicationHistory());
  }, [dispatch]);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Please grant photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0].uri;
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
      // ignore
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

  const getMissingFieldStep = () => {
    if (!profile) return 1;
    if (!profile.profile_photo_path && !profile.profile_photo) return 1;
    if (!profile.full_name || !profile.gender) return 2;
    if (!profile.experience_range || !profile.current_employer || !profile.job_type) return 3;
    if (!profile.location_preference || !profile.city) return 4;
    if (!profile.preferred_role) return 5;
    return 1;
  };

  const getMissingFieldText = () => {
    if (!profile) return t("editProfile", "Edit Profile");
    if (completion >= 90) return t("editProfile", "Edit Profile");
    if (!profile.profile_photo_path && !profile.profile_photo) return t("addProfilePhoto", "Add Profile Photo");
    return t("editProfile", "Edit Profile");
  };

  return (
    <ScreenWrapper
      edges={["left", "right", "bottom"]}
      style={{ backgroundColor: "#f8fafc" }}
      contentStyle={[styles.page]}
      scroll={true}
    >
      <View style={styles.mainContentContainer}>
        <View style={styles.heroProfileCard}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={styles.heroAvatarContainer}
              onPress={handlePickPhoto}
              activeOpacity={0.85}
            >
              {logoSource ? (
                <Image source={{ uri: logoSource }} style={styles.heroAvatarImage} resizeMode="cover" />
              ) : (
                <View style={styles.heroAvatarPlaceholder}>
                  <Ionicons name="person" size={normalize(32)} color="#94a3b8" />
                </View>
              )}
              <View style={styles.cameraBadgeIconCircle}>
                <Ionicons name="camera" size={normalize(12)} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfoColumn}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroDisplayName} numberOfLines={1}>
                  {displayName || t("profile.guestUser", "Guest User")}
                </Text>
              </View>

              {Boolean(displayTitle) && (
                <Text style={styles.heroDisplayTitle} numberOfLines={1}>
                  {displayTitle}
                </Text>
              )}

              <View style={styles.heroMetaList}>
                <View style={styles.heroMetaRow}>
                  <View style={[styles.metaIconBox, { backgroundColor: "#ffedd5" }]}>
                    <Ionicons name="location-outline" size={normalize(13)} color="#c2410c" />
                  </View>
                  <View style={styles.metaTextGroup}>
                    <Text style={styles.metaLabel}>{t("preferredLocation", "Preferred Location")}:</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {displayCity || displayPrefLocation || t("notSpecified", "Not Specified")}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroMetaRow}>
                  <View style={[styles.metaIconBox, { backgroundColor: "#dbeafe" }]}>
                    <Ionicons name="briefcase-outline" size={normalize(13)} color="#1e40af" />
                  </View>
                  <View style={styles.metaTextGroup}>
                    <Text style={styles.metaLabel}>{t("experience", "Experience")}:</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {displayExperience || t("notSpecified", "Not Specified")}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroMetaRow}>
                  <View style={[styles.metaIconBox, { backgroundColor: "#dcfce7" }]}>
                    <Ionicons name="business-outline" size={normalize(13)} color="#15803d" />
                  </View>
                  <View style={styles.metaTextGroup}>
                    <Text style={styles.metaLabel}>{t("currentEmployer", "Current Employer")}:</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {displayEmployer || t("notSpecified", "Not Specified")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

        </View>

        <View style={styles.completionCard}>
          <View style={styles.completionHeaderRow}>
            <Text style={styles.completionTitle}>{t("profileCompletion", "Profile Completion")}</Text>
            <Text style={styles.completionPercentText}>{completion}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completion}%` }]} />
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate("CompleteProfileScreen", { step: getMissingFieldStep() })}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={normalize(15)} color="#153e69" style={{ marginRight: normalize(6) }} />
            <Text style={styles.editProfileBtnText}>{getMissingFieldText()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderLabel}>{t("myJobActivity", "MY JOB ACTIVITY")}</Text>
          <View style={styles.sectionMenuCard}>
            <TouchableOpacity
              style={styles.sectionMenuItem}
              onPress={() => navigation.navigate("Applications")}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIconBox, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="send-outline" size={normalize(18)} color="#0284c7" />
              </View>
              <View style={styles.sectionMenuTextGroup}>
                <Text style={styles.sectionMenuTitle}>{t("myApplications", "My Applications")}</Text>
                <Text style={styles.sectionMenuSub}>{t("trackAppliedJobs", "Track jobs you have applied for.")}</Text>
              </View>
              <View style={styles.sectionMenuRightGroup}>
                <View style={[styles.countPillBadge, { backgroundColor: "#eff6ff" }]}>
                  <Text style={[styles.countPillText, { color: "#1e40af" }]}>{applicationsCount}</Text>
                </View>
                <Ionicons name="chevron-forward" size={normalize(16)} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            <View style={styles.sectionDividerLine} />

            <TouchableOpacity
              style={styles.sectionMenuItem}
              onPress={() => navigation.navigate("MyJobs")}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIconBox, { backgroundColor: "#ffedd5" }]}>
                <Ionicons name="people-outline" size={normalize(18)} color="#ea580c" />
              </View>
              <View style={styles.sectionMenuTextGroup}>
                <Text style={styles.sectionMenuTitle}>{t("myJobReferrals", "My Job Referrals")}</Text>
                <Text style={styles.sectionMenuSub}>{t("viewSharedJobs", "View jobs you have shared with the community.")}</Text>
              </View>
              <View style={styles.sectionMenuRightGroup}>
                <View style={[styles.countPillBadge, { backgroundColor: "#fff7ed" }]}>
                  <Text style={[styles.countPillText, { color: "#c2410c" }]}>{myJobsCount}</Text>
                </View>
                <Ionicons name="chevron-forward" size={normalize(16)} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            <View style={styles.sectionDividerLine} />

            <TouchableOpacity
              style={styles.sectionMenuItem}
              onPress={() => navigation.navigate("SavedJobs")}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIconBox, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="bookmark-outline" size={normalize(18)} color="#16a34a" />
              </View>
              <View style={styles.sectionMenuTextGroup}>
                <Text style={styles.sectionMenuTitle}>{t("profile.menu.savedJobs", "Saved Jobs")}</Text>
                <Text style={styles.sectionMenuSub}>{t("viewBookmarkedJobs", "View jobs you bookmarked for later.")}</Text>
              </View>
              <View style={styles.sectionMenuRightGroup}>
                <View style={[styles.countPillBadge, { backgroundColor: "#f0fdf4" }]}>
                  <Text style={[styles.countPillText, { color: "#15803d" }]}>{savedJobsCount}</Text>
                </View>
                <Ionicons name="chevron-forward" size={normalize(16)} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderLabel}>{t("settingsAndSupport", "SETTINGS & SUPPORT")}</Text>
          <View style={styles.sectionMenuCard}>
            <TouchableOpacity
              style={styles.sectionMenuItem}
              onPress={() => navigation.navigate("Language")}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIconBox, { backgroundColor: "#f3e8ff" }]}>
                <Ionicons name="globe-outline" size={normalize(18)} color="#7e22ce" />
              </View>
              <View style={styles.sectionMenuTextGroup}>
                <Text style={styles.sectionMenuTitle}>{t("preferredLanguage", "Preferred Language")}</Text>
                {/* <Text style={styles.sectionMenuSub}>{getLanguageLabel()}</Text> */}
              </View>
              <Ionicons name="chevron-forward" size={normalize(16)} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={styles.sectionDividerLine} />

            <TouchableOpacity
              style={styles.sectionMenuItem}
                onPress={() => navigation.navigate("PrivacySecurity")}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIconBox, { backgroundColor: "#ede9fe" }]}>
                <Ionicons name="shield-checkmark-outline" size={normalize(18)} color="#6d28d9" />
              </View>
              <View style={styles.sectionMenuTextGroup}>
                <Text style={styles.sectionMenuTitle}>{t("privacyAndSecurity", "Privacy & Security")}</Text>
                {/* <Text style={styles.sectionMenuSub}>{t("manageAccountSupport", "Manage your account, privacy and support.")}</Text> */}
              </View>
              <Ionicons name="chevron-forward" size={normalize(16)} color="#cbd5e1" />
            </TouchableOpacity>

             <View style={styles.sectionDividerLine} />

            <TouchableOpacity
              style={styles.sectionMenuItem}
              onPress={() => navigation.navigate("HelpSupport")}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIconBox, { backgroundColor: "#ede9fe" }]}>
                <Ionicons name="help-circle-outline" size={normalize(18)} color="#6d28d9" />
              </View>
              <View style={styles.sectionMenuTextGroup}>
                <Text style={styles.sectionMenuTitle}>{t("helpAndSupport", "Help & Support")}</Text>
                {/* <Text style={styles.sectionMenuSub}>{t("manageAccountSupport", "Manage your account, privacy and support.")}</Text> */}
              </View>
              <Ionicons name="chevron-forward" size={normalize(16)} color="#cbd5e1" />
            </TouchableOpacity>
    
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtnCard}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.logoutBtnIconBox}>
            <Ionicons name="exit-outline" size={normalize(18)} color="#ea580c" />
          </View>
          <Text style={styles.logoutBtnText}>{t("logOut", "Log Out")}</Text>
        </TouchableOpacity>
      </View>

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
              <Ionicons name="log-out-outline" size={normalize(22)} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>{t("profile.logoutConfirmTitle", "Logout")}</Text>
            <Text style={styles.modalText}>{t("profile.logoutConfirm", "Are you sure you want to log out?")}</Text>

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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f8fafc",
    paddingBottom: normalize(30),
  },

  // Top Header Banner
  topHeaderBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#153e69",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
  },
  headerBackBtn: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoImage: {
    width: normalize(110),
    height: normalize(32),
  },
  headerNotifBtn: {
    width: normalize(34),
    height: normalize(34),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadgeDot: {
    position: "absolute",
    top: normalize(6),
    right: normalize(6),
    width: normalize(7),
    height: normalize(7),
    borderRadius: normalize(4),
    backgroundColor: "#ea580c",
  },

  // Sub Header Title
  subHeaderSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(14),
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  subHeaderTitle: {
    fontSize: normalize(18),
    fontWeight: "800",
    color: "#0f172a",
  },

  mainContentContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },

  // Hero Profile Card
  heroProfileCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    paddingTop: normalize(16),
    paddingHorizontal: normalize(16),
    paddingBottom: normalize(12),
    marginBottom: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(14),
    marginBottom: normalize(14),
  },
  heroAvatarContainer: {
    position: "relative",
    width: normalize(76),
    height: normalize(76),
    borderRadius: normalize(38),
    borderWidth: 2,
    borderColor: "#153e69",
    padding: 2,
  },
  heroAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: normalize(36),
  },
  heroAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: normalize(36),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadgeIconCircle: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: normalize(22),
    height: normalize(22),
    borderRadius: normalize(11),
    backgroundColor: "#ea580c",
    borderWidth: 1.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfoColumn: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroDisplayName: {
    fontSize: normalize(18),
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: normalize(4),
  },
  heroDisplayTitle: {
    fontSize: normalize(13),
    fontWeight: "500",
    color: "#64748b",
    marginBottom: normalize(8),
  },
  heroMetaList: {
    gap: normalize(6),
    marginTop: normalize(4),
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  metaIconBox: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(6),
    alignItems: "center",
    justifyContent: "center",
  },
  metaTextGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(4),
    flex: 1,
  },
  metaLabel: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#64748b",
  },
  metaValue: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#0f172a",
    flexShrink: 1,
  },
  heroBottomTapBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff7ed",
    borderRadius: normalize(10),
    paddingVertical: normalize(10),
    marginTop: normalize(4),
    gap: normalize(4),
  },
  heroBottomTapText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#ea580c",
  },

  // Profile Completion Card
  completionCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    padding: normalize(14),
    marginBottom: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  completionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(8),
  },
  completionTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0f172a",
  },
  completionPercentText: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#153e69",
  },
  progressTrack: {
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: normalize(12),
  },
  progressFill: {
    height: "100%",
    borderRadius: normalize(4),
    backgroundColor: "#153e69",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#153e69",
    borderRadius: normalize(10),
    paddingVertical: normalize(8),
    backgroundColor: "#ffffff",
  },
  editProfileBtnText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#153e69",
  },

  // Menu Sections
  sectionContainer: {
    marginBottom: normalize(16),
  },
  sectionHeaderLabel: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: normalize(8),
    marginLeft: normalize(4),
  },
  sectionMenuCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(12),
    gap: normalize(12),
  },
  sectionIconBox: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  sectionMenuTextGroup: {
    flex: 1,
  },
  sectionMenuTitle: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(1),
  },
  sectionMenuSub: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#64748b",
  },
  sectionMenuRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  countPillBadge: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(12),
    minWidth: normalize(24),
    alignItems: "center",
    justifyContent: "center",
  },
  countPillText: {
    fontSize: normalize(12),
    fontWeight: "800",
  },
  sectionDividerLine: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: normalize(14),
  },

  // Logout Button
  logoutBtnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#ffedd5",
    borderRadius: normalize(14),
    paddingVertical: normalize(12),
    gap: normalize(8),
    marginTop: normalize(4),
  },
  logoutBtnIconBox: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnText: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#ea580c",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: normalize(24),
  },
  modalCard: {
    width: "100%",
    maxWidth: normalize(340),
    backgroundColor: "#ffffff",
    borderRadius: normalize(22),
    padding: normalize(20),
    alignItems: "center",
    gap: normalize(10),
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalIcon: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(16),
    backgroundColor: "rgba(245, 127, 32, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modalTitle: {
    color: "#0a0504",
    fontSize: normalize(18),
    fontWeight: "900",
    textAlign: "center",
  },
  modalText: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: normalize(13),
    lineHeight: normalize(19),
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: normalize(10),
    width: "100%",
    marginTop: normalize(6),
  },
  modalButton: {
    flex: 1,
    minHeight: normalize(46),
    borderRadius: normalize(14),
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
    fontSize: normalize(14),
    fontWeight: "800",
  },
  modalConfirmText: {
    color: "#ffffff",
    fontSize: normalize(14),
    fontWeight: "800",
  },
});
