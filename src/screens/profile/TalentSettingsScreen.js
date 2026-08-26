import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Dimensions,
  PixelRatio,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";
import { deleteAccountApi } from "../../services/profileApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";

export default function TalentSettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const supportEmail = "jobritoapp@gmail.com";

  const handleEmail = () => {
    Linking.openURL(`mailto:${supportEmail}`).catch(() => {
      CustomAlert.show("Error", "Mail client could not be opened.");
    });
  };

  const performLogout = async () => {
    try {
      const { logout: logoutApi } = require("../../services/authApi");
      await logoutApi().catch(() => {});
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

  const handleDeleteAccount = () => {
    Alert.alert(
      t("deleteAccountTitle", "Delete Account"),
      t("deleteAccountConfirm", "Are you sure you want to permanently delete your account? This action cannot be undone."),
      [
        { text: t("cancel", "Cancel"), style: "cancel" },
        {
          text: t("delete", "Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccountApi();
            } catch (err) {
              console.warn("Delete account API failed:", err);
            }
            await performLogout();
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={normalize(22)} color={colors.text || "#0f172a"} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("settingsAndSupport", "Settings & Support")}</Text>
        </View>
        <View style={{ width: normalize(38) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Help & Support */}
        <Text style={styles.sectionTitle}>
          {t("helpAndSupport", "HELP & SUPPORT")}
        </Text>
        <View style={styles.sectionCard}>
          {/* Email Support */}
          <TouchableOpacity
            style={styles.cardRow}
            activeOpacity={0.8}
            onPress={handleEmail}
          >
            <View style={[styles.iconBox, { backgroundColor: "#e0f2fe" }]}>
              <Ionicons name="mail-outline" size={normalize(20)} color="#0284c7" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{t("emailSupport", "Email Support")}</Text>
              <Text style={styles.emailValue}>{supportEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Support Hours */}
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: "#fff7ed" }]}>
              <Ionicons name="time-outline" size={normalize(20)} color="#ea580c" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{t("supportHoursTitle", "Support Hours")}</Text>
              <Text style={styles.valueTitle}>{t("supportDays", "Monday – Saturday")}</Text>
              <Text style={styles.valueSub}>{t("supportTimings", "10:00 AM – 6:00 PM IST")}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Preferences & Account */}
        <Text style={styles.sectionTitle}>
          {t("preferencesAndAccount", "PREFERENCES & ACCOUNT")}
        </Text>
        <View style={styles.sectionCard}>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => Linking.openURL("https://jobrito.com/privacy-policy")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="shield-checkmark-outline" size={normalize(20)} color="#15803d" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{t("privacyPolicy", "Privacy Policy")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Delete Account */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="trash-outline" size={normalize(20)} color="#dc2626" />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: "#dc2626" }]}>{t("deleteAccount", "Delete Account")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={normalize(18)} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backButton: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  scrollContent: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(16),
    paddingBottom: normalize(30),
    gap: normalize(14),
  },

  // Intro Card
  introCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: normalize(16),
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  introTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(4),
  },
  introSub: {
    fontSize: normalize(13),
    color: "#64748b",
    lineHeight: normalize(18),
  },

  // Sections
  sectionTitle: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: normalize(2),
    marginLeft: normalize(4),
  },
  sectionCard: {
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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(13),
    gap: normalize(12),
  },
  iconBox: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#0f172a",
  },
  emailValue: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#0284c7",
    marginTop: normalize(1),
  },
  valueTitle: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#0f172a",
    marginTop: normalize(1),
  },
  valueSub: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#64748b",
    marginTop: normalize(1),
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: normalize(14),
  },
});
