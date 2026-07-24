import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  ActivityIndicator,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import colors from "../../constants/colors";
import { setProfileData } from "../../redux/slices/userSlice";
import { setStoredProfile } from "../../services/storage";
import { saveChefOnboarding } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY = "#153e69";
const SECONDARY = "#f2f2f3";
const WARM_GOLD = "#f2c879";
const EMBER_ORANGE = "#f57f20";
const NEUTRAL = "#0a0504";

export default function CalendlyIntegrationScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  const [calendlyLink, setCalendlyLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(false);

  useEffect(() => {
    if (profile?.calendly_link || profile?.calendlyUrl || profile?.calendlyLink) {
      setCalendlyLink(profile.calendly_link || profile.calendlyUrl || profile.calendlyLink);
    }
  }, [profile]);

  const isConnected = Boolean(calendlyLink && calendlyLink.trim().length > 5);



  const handleSignupCalendly = () => {
    Linking.openURL("https://calendly.com/signup").catch((err) => {
      CustomAlert.show(t("error", "Error"), "Could not open browser: " + err.message);
    });
  };

  const handleSaveLink = async () => {
    if (!calendlyLink.trim()) {
      CustomAlert.show(t("error", "Error"), "Please enter your Calendly scheduling link.");
      return;
    }

    let cleaned = calendlyLink.trim().replace(/\s+/g, "");
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = "https://" + cleaned;
    }

    if (!cleaned.toLowerCase().includes("calendly.com")) {
      CustomAlert.show(
        t("warning", "Notice"),
        "The URL does not contain 'calendly.com'. Make sure it is your official Calendly scheduling link."
      );
    }

    setLoading(true);
    try {
      // 1. Dispatch Redux update
      const updatedProfilePayload = {
        ...profile,
        calendly_link: cleaned,
        calendlyUrl: cleaned,
        calendlyLink: cleaned,
      };
      dispatch(setProfileData({ calendly_link: cleaned, calendlyUrl: cleaned, calendlyLink: cleaned }));

      // 2. Local storage update
      await setStoredProfile(updatedProfilePayload);

      // 3. Backend API update
      const formData = new FormData();
      formData.append("calendly_link", cleaned);
      await saveChefOnboarding(formData).catch(() => null);

      CustomAlert.show(
        t("success", "Success"),
        "Your Calendly integration link has been saved successfully! Recruiters can now schedule direct consultations with you.",
        [
          {
            text: "Great",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to save Calendly link:", error);
      CustomAlert.show(t("error", "Error"), error?.message || "Failed to save Calendly link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={NEUTRAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("calendlyIntegration", "Calendly Integration")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.iconWrap, { backgroundColor: isConnected ? "rgba(34, 197, 94, 0.12)" : "rgba(242, 200, 121, 0.18)" }]}>
              <Ionicons
                name={isConnected ? "checkmark-circle" : "alert-circle"}
                size={28}
                color={isConnected ? "#15803d" : "#b8860b"}
              />
            </View>
            <View style={styles.statusTextInfo}>
              <Text style={styles.statusTitle}>
                {isConnected ? "Calendly Connected" : "Not Integrated Yet"}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isConnected
                  ? "Recruiters can schedule 1-on-1 calls directly into your calendar."
                  : "Link your Calendly account so employers can book consultation calls with you."}
              </Text>
            </View>
          </View>
        </View>

        {/* Input Form Section */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Calendly Scheduling Link</Text>
          <Text style={styles.formHint}>
            Example: https://calendly.com/your-name/30min
          </Text>

          <View style={[styles.inputWrapper, activeInput && styles.inputWrapperActive]}>
            <Ionicons name="link-outline" size={20} color={PRIMARY} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              placeholder="https://calendly.com/your-username"
              placeholderTextColor="rgba(10, 5, 4, 0.4)"
              value={calendlyLink}
              onChangeText={setCalendlyLink}
              onFocus={() => setActiveInput(true)}
              onBlur={() => setActiveInput(false)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {calendlyLink ? (
              <TouchableOpacity onPress={() => setCalendlyLink("")} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color="rgba(10, 5, 4, 0.4)" />
              </TouchableOpacity>
            ) : null}
          </View>



          {/* Primary Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSaveLink}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Save Calendly Link</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* How It Works Guide */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Ionicons name="information-circle-outline" size={22} color={PRIMARY} style={{ marginRight: 8 }} />
            <Text style={styles.guideTitle}>Why integrate Calendly?</Text>
          </View>
          <View style={styles.guideStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Employers and restaurant owners browse your chef profile on JobRito.
            </Text>
          </View>
          <View style={styles.guideStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              They click "Book Consultation" to view your available time slots.
            </Text>
          </View>
          <View style={styles.guideStep}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Calls are automatically synced into your Google/Outlook calendar.
            </Text>
          </View>
        </View>

        {/* Don't have an account */}
        <View style={styles.signupCard}>
          <Text style={styles.signupTitle}>Don't have a Calendly account yet?</Text>
          <Text style={styles.signupSubtitle}>
            Create a free account on Calendly in 2 minutes to get your scheduling URL.
          </Text>
          <TouchableOpacity style={styles.signupBtn} onPress={handleSignupCalendly}>
            <Ionicons name="create-outline" size={16} color={PRIMARY} style={{ marginRight: 6 }} />
            <Text style={styles.signupBtnText}>Sign Up Free on Calendly</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: NEUTRAL,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },

  // Status Card
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  statusTextInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: NEUTRAL,
    marginBottom: 3,
  },
  statusSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 17,
  },

  // Form Card
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: NEUTRAL,
    marginBottom: 2,
  },
  formHint: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.5)",
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  inputWrapperActive: {
    borderColor: PRIMARY,
    backgroundColor: "#ffffff",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: NEUTRAL,
    fontWeight: "600",
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    minHeight: 52,
    borderRadius: 12,
    gap: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 20,
  },
  saveBtnDisabled: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  // Guide Card
  guideCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    gap: 12,
  },
  guideHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: NEUTRAL,
  },
  guideStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(21, 62, 105, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: 18,
  },

  // Signup Card
  signupCard: {
    backgroundColor: "rgba(21, 62, 105, 0.05)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.15)",
    padding: 16,
    alignItems: "center",
  },
  signupTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 4,
    textAlign: "center",
  },
  signupSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 14,
  },
  signupBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.2)",
  },
  signupBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
  },
});
