import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { fetchProfile, resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { profile, activeRole } = useSelector((state) => state.user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displayName = profile?.name && profile.name !== "Guest User" ? profile.name : (profile?.phone || "");

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const completion = profile?.completionPercentage || 85;

  const normalizedRole = activeRole ? activeRole.toLowerCase().replace(" ", "") : "jobseeker";

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

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

  const handleStubAction = (titleKey) => {
    Alert.alert(t(titleKey), t("profile.stubMessage"));
  };

  const menuItems = [
    {
      label: t("profile.menu.personalInfo"),
      subtitle: t("profile.menu.personalInfoSubtitle"),
      icon: "person-outline",
      color: colors.text,
      onPress: () => navigation.navigate("CompleteProfileScreen"),
    },
    // {
    //   label: t("profile.menu.professionalInfo"),
    //   subtitle: t("profile.menu.professionalInfoSubtitle"),
    //   icon: "id-card-outline",
    //   color: colors.text,
    //   onPress: () => handleStubAction("Professional Information"),
    // },
    {
      label: t("profile.menu.myApplications"),
      subtitle: t("profile.menu.myApplicationsSubtitle"),
      icon: "document-text-outline",
      color: colors.text,
      onPress: () => navigation.navigate("Applications"),
    },
    {
      label: t("profile.menu.savedJobs"),
      subtitle: t("profile.menu.savedJobsSubtitle"),
      icon: "star-outline",
      color: colors.text,
      onPress: () => navigation.navigate("SavedJobs"),
    },
    {
      label: t("profile.menu.myPostedJobs"),
      subtitle: t("profile.menu.myPostedJobsSubtitle"),
      icon: "briefcase-outline",
      color: colors.text,
      onPress: () => {
        navigation.navigate("MyJobs");
      },
    },
    // {
    //   label: t("profile.menu.becomeEmployer"),
    //   subtitle: t("profile.menu.becomeEmployerSubtitle"),
    //   icon: "business-outline",
    //   color: colors.primary,
    //   onPress: () => navigation.navigate("RoleSwitcher"),
    // },
    // {
    //   label: t("profile.menu.becomeChef"),
    //   subtitle: t("profile.menu.becomeChefSubtitle"),
    //   icon: "restaurant-outline",
    //   color: colors.primaryDark,
    //   onPress: () => navigation.navigate("RoleSwitcher"),
    // },
    {
      label: t("profile.menu.settings"),
      subtitle: t("profile.menu.settingsSubtitle"),
      icon: "settings-outline",
      color: colors.text,
      onPress: () => handleStubAction("profile.stubTitleSettings"),
    },
    {
      label: t("profile.menu.language"),
      subtitle: t("profile.menu.languageSubtitle"),
      icon: "globe-outline",
      color: colors.text,
      onPress: () => navigation.navigate("Language"),
    },
  ];

  return (
    <ScreenWrapper
      edges={["left", "right", "bottom"]}
      style={{ backgroundColor: "#fff" }}
      contentStyle={styles.page}
    >
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              {profile?.profile_photo_path ? (
                <Image
                  source={{ uri: profile.profile_photo_path }}
                  style={{ width: "100%", height: "100%", borderRadius: 35 }}
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="pencil" size={12} color="#fff" />
          </View>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {profile?.phone && <Text style={styles.phone}>{profile?.phone}</Text>}
        {profile?.email && <Text style={styles.emailText}>{profile?.email}</Text>}
        {profile?.city && <Text style={styles.cityText}>📍 {profile?.city}</Text>}
        {profile?.role && <Text style={styles.role}>{t("profile.activeRole")}: {t("roleSelection." + normalizedRole)}</Text>}

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {t("profile.profileComplete", { completion })}
            </Text>
            <Pressable onPress={() => handleStubAction("profile.stubTitleFinish")}>
              <Text style={styles.progressAction}>{t("profile.finishNow")}</Text>
            </Pressable>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${completion}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.listCard}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            style={[
              styles.row,
              index === menuItems.length - 1 && styles.rowLast,
            ]}
          >
            <View
              style={[
                styles.iconBox,
                {
                  borderColor:
                    item.color === colors.text ? "#E5EAF2" : "#EAF0FF",
                },
              ]}
            >
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7CFDA" />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => setShowLogoutModal(true)}
        style={styles.logoutRow}
      >
        <View style={[styles.iconBox, styles.logoutIconBox]}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, styles.logoutTitle]}>{t("logout")}</Text>
          <Text style={[styles.rowSubtitle, styles.logoutSubtitle]}>
            {t("profile.signOut")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.danger} />
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerFrom}>{t("profile.from")}</Text>
        <Text style={styles.footerBrand}>HOSPITALITY CO.</Text>
        <Text style={styles.footerVersion}>JobRito v4.2.1-stable</Text>
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
              <Ionicons
                name="log-out-outline"
                size={22}
                color={colors.danger}
              />
            </View>
            <Text style={styles.modalTitle}>{t("profile.logoutConfirmTitle")}</Text>
            <Text style={styles.modalText}>
              {t("profile.logoutConfirm")}
            </Text>

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
    backgroundColor: "#fff",
    paddingBottom: 14,
    gap: 14,
  },
  hero: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  avatarWrap: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: "#C7D8FF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#C7D8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: "900",
  },
  avatarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    position: "absolute",
    right: 8,
    bottom: 6,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 2,
  },
  phone: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  emailText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  cityText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  role: {
    color: colors.mutedText,
    fontSize: 12,
    textAlign: "center",
  },
  progressCard: {
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 6,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  progressLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  progressAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#D6E6FF",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  listCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 18,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    backgroundColor: "#fff",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 18,
    backgroundColor: "#fff",
  },
  logoutIconBox: {
    borderColor: "#FECACA",
  },
  logoutTitle: {
    color: colors.danger,
  },
  logoutSubtitle: {
    color: "#FCA5A5",
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    alignItems: "center",
    paddingTop: 12,
    gap: 4,
  },
  footerFrom: {
    color: colors.mutedText,
    fontSize: 11,
  },
  footerBrand: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  footerVersion: {
    color: colors.primary,
    fontSize: 11,
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
    backgroundColor: "#fff",
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
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  modalText: {
    color: colors.mutedText,
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalConfirmButton: {
    backgroundColor: colors.danger,
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
