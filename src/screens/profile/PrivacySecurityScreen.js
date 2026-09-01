import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import colors from "../../constants/colors";
import { deleteAccountApi } from "../../services/profileApi";
import { clearAuthStorage } from "../../services/storage";
import { logout } from "../../redux/slices/authSlice";
import { resetUser } from "../../redux/slices/userSlice";

const PRIMARY_GREEN = "#153e69";

export default function PrivacySecurityScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenPrivacy = () => {
    Linking.openURL("https://jobrito.com/privacy-policy").catch(() => null);
  };

  const handleOpenTerms = () => {
    Linking.openURL("https://jobrito.com/terms-and-conditions").catch(() => null);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAccountApi();
    } catch (err) {
      console.warn("Delete account API failed, proceeding with local logout", err);
    } finally {
      await clearAuthStorage();
      dispatch(logout());
      dispatch(resetUser());
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("privacyAndSecurity", "PRIVACY & SECURITY")}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.sectionCard}>
          {/* Point 1: Privacy Settings */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleOpenPrivacy}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY_GREEN} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.titleText}>{t("privacySettings", "Privacy Settings")}</Text>
                <Text style={styles.subText}>{t("readPrivacyPolicyHere", "Read Jobrito Private Policy Here.")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Point 2: Terms & Condition */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleOpenTerms}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_GREEN} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.titleText}>{t("termsAndCondition", "Terms & Condition")}</Text>
                <Text style={styles.subText}>{t("reviewInfoProvided", "Review information you have provided.")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Point 3: Delete Account */}
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => setShowDeleteModal(true)}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.titleText, { color: "#DC2626" }]}>{t("deleteAccount", "Delete Account")}</Text>
                <Text style={styles.subText}>{t("permanentlyDeleteAccount", "Permanently delete your Jobrito account and associated data.")}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDeleteModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="trash-outline" size={24} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>{t("deleteAccount", "Delete Account")}</Text>
            <Text style={styles.modalSubtitle}>
              {t("deleteAccountConfirm", "Are you sure you want to permanently delete your account? This action cannot be undone.")}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelText}>{t("cancel", "Cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalDeleteBtn]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteText}>{isDeleting ? t("deleting", "Deleting...") : t("delete", "Delete")}</Text>
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
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
  },
  content: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0504",
  },
  subText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
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
    gap: 12,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "#f2f2f3",
  },
  modalDeleteBtn: {
    backgroundColor: "#DC2626",
  },
  cancelText: {
    fontWeight: "700",
    color: "#0a0504",
  },
  deleteText: {
    fontWeight: "700",
    color: "#ffffff",
  },
});
