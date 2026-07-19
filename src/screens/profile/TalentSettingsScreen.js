import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";

const PRIMARY = "#153e69";

export default function TalentSettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const performLogout = async () => {
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

  const handleDeleteAccount = () => {
    Alert.alert(
      t("deleteAccountTitle", "Delete Account"),
      t("deleteAccountConfirm", "Are you sure you want to permanently delete your account? This action cannot be undone."),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete", "Delete"),
          style: "destructive",
          onPress: () => {
            // Simulated API call with 1 second delay
            setTimeout(async () => {
              await performLogout();
              Alert.alert(t("success"), t("accountDeleted", "Your account has been deleted."));
            }, 1000);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text || "#0a0504"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settingsTitle", "Settings")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.sectionCard}>
          <TouchableOpacity 
            style={styles.menuRow} 
            onPress={() => Linking.openURL("https://jobrito.com/privacy-policy")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY} style={styles.menuIcon} />
              <Text style={styles.menuText}>{t("privacyPolicy", "Privacy Policy")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.menuRow} 
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trash-outline" size={20} color="#f57f20" style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: "#f57f20" }]}>{t("deleteAccount", "Delete Account")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#f57f20" />
          </TouchableOpacity>
        </View>
      </View>
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
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  content: {
    padding: 16,
    paddingTop: 24,
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
    paddingVertical: 18,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    marginRight: 4,
  },
  menuText: {
    fontSize: 16,
    color: "#0a0504",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginHorizontal: 16,
  },
});
