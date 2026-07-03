import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#22C55E";

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const businessName = profile?.business_name || profile?.businessName || profile?.current_employer || profile?.company || "";
  const contactName = profile?.contact_person_name || profile?.contactName || profile?.full_name || profile?.name || "";

  // Helper to determine the company logo source URL
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

  const handlePrivacyPolicy = () => {
    Linking.openURL("https://jobrito.com/privacy-policy").catch(() => {
      CustomAlert.show("Error", "Unable to open link.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settingsTitle")}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {logoSource ? (
            <Image
              source={logoSource}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business" size={28} color="#64748B" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.businessName}>{businessName}</Text>
            <Text style={styles.contactText}>{contactName}</Text>
          </View>
        </View>

        {/* Section: Account Settings */}
        <Text style={styles.sectionTitle}>{t("accountSettings")}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("PersonalInformation")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#EEF4FF" }]}>
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.itemLabel}>{t("companyInfo")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Language")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="globe-outline" size={20} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.itemLabel}>{t("appLanguage")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ChefConnectFilters")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="people-outline" size={20} color="#F97316" />
            </View>
            <Text style={styles.itemLabel}>Chef Connect</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Section: Information & Support */}
        <Text style={styles.sectionTitle}>{t("supportLegal")}</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("HelpSupport")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#ECFEFF" }]}>
              <Ionicons name="help-circle-outline" size={20} color="#0891B2" />
            </View>
            <Text style={styles.itemLabel}>{t("helpSupport")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.7}
            onPress={handlePrivacyPolicy}
          >
            <View style={[styles.iconBox, { backgroundColor: "#F8FAFC" }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.itemLabel}>{t("privacyPolicy")}</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={() => setShowLogoutModal(true)}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>{t("logOut")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out" size={40} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>{t("logOut")}</Text>
            <Text style={styles.modalSubtitle}>{t("logoutConfirm")}</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handleLogout}
              >
                <Text style={styles.modalConfirmBtnText}>{t("logOut")}</Text>
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: "#64748B",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    minHeight: 56,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },
  modalConfirmBtn: {
    backgroundColor: "#EF4444",
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
