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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setProfileData } from "../../redux/slices/userSlice";
import { setStoredProfile } from "../../services/storage";
import { saveChefOnboarding } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;

function normalize(size) {
  const newSize = size * scale;
  return Math.round(newSize);
}

export default function CalendlyIntegrationScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  const [calendlyLink, setCalendlyLink] = useState("https://calendly.com/");
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(false);

  useEffect(() => {
    if (profile?.calendly_link || profile?.calendlyUrl || profile?.calendlyLink) {
      setCalendlyLink(profile.calendly_link || profile.calendlyUrl || profile.calendlyLink);
    } else {
      setCalendlyLink("https://calendly.com/");
    }
  }, [profile]);

  const isConnected = Boolean(
    calendlyLink &&
    calendlyLink.trim().length > 21 &&
    calendlyLink.trim() !== "https://calendly.com/" &&
    calendlyLink.trim() !== "https://calendly.com"
  );

  const handleSignupCalendly = () => {
    Linking.openURL("https://calendly.com/signup").catch((err) => {
      CustomAlert.show(t("error", "Error"), "Could not open browser: " + err.message);
    });
  };

  const handleSaveLink = async () => {
    let cleaned = calendlyLink.trim().replace(/\s+/g, "");
    if (!cleaned || cleaned === "https://calendly.com/" || cleaned === "https://calendly.com") {
      CustomAlert.show(t("error", "Error"), t("calendly.enterLink", "Please enter your Calendly scheduling link."));
      return;
    }

    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = "https://" + cleaned;
    }

    if (!cleaned.toLowerCase().includes("calendly.com")) {
      CustomAlert.show(
        t("warning", "Notice"),
        t("calendly.invalidLink", "The URL does not contain 'calendly.com'. Make sure it is your official Calendly scheduling link.")
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
        t("calendly.successSave", "Your Calendly integration link has been saved successfully! Recruiters can now schedule direct consultations with you."),
        [
          {
            text: t("great", "Great"),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Failed to save Calendly link:", error);
      CustomAlert.show(t("error", "Error"), error?.message || t("calendly.failedSave", "Failed to save Calendly link."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtnCircle}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={normalize(20)} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerBarTitle, { textAlign: "center" }]}>{t("myProfile", "My Profile")}</Text>
        </View>
        <View style={{ width: normalize(36) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Box */}
        <View style={styles.bannerBox}>
          <View style={[styles.bannerIconCircle, isConnected && styles.bannerIconCircleConnected]}>
            <Ionicons
              name="calendar-outline"
              size={normalize(22)}
              color={isConnected ? "#16a34a" : "#d97706"}
            />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>{t("calendlyIntegration", "Calendly Integration")}</Text>
            
            {/* Status Pill Badge */}
            <View style={[styles.statusPillBadge, isConnected && styles.statusPillBadgeConnected]}>
              <Ionicons
                name={isConnected ? "checkmark-circle" : "alert-circle"}
                size={normalize(13)}
                color={isConnected ? "#15803d" : "#b45309"}
                style={{ marginRight: normalize(4) }}
              />
              <Text style={[styles.statusPillBadgeText, isConnected && styles.statusPillBadgeTextConnected]}>
                {isConnected ? t("connected", "Connected") : t("notIntegrated", "Not Integrated")}
              </Text>
            </View>

            <Text style={styles.bannerDesc}>
              {t("calendlyIntegrationDesc", "Link your Calendly account so employers and businesses can book consultation calls with you.")}
            </Text>
          </View>
        </View>

        {/* Input Form Section Card */}
        <View style={styles.mainFormCard}>
          <Text style={styles.formCardTitle}>
            {t("calendlySchedulingLinkTitle", "Calendly Scheduling Link")}
          </Text>
          <Text style={styles.formCardSub}>
            {t("calendlySchedulingLinkSub", "Enter your Calendly scheduling link (e.g. https://calendly.com/your-name/30min)")}
          </Text>

          <View style={[styles.modernInputWrapper, activeInput && styles.modernInputWrapperActive]}>
            <Ionicons name="link-outline" size={normalize(18)} color="#64748b" style={{ marginRight: normalize(8) }} />
            <TextInput
              style={styles.modernTextInput}
              placeholder={t("calendlyPlaceholder", "https://calendly.com/your-link")}
              placeholderTextColor="#94a3b8"
              value={calendlyLink}
              onChangeText={(val) => {
                const cleanVal = val.replace(/\s+/g, "");
                if (!cleanVal) {
                  setCalendlyLink("https://calendly.com/");
                  return;
                }
                if (!cleanVal.startsWith("https://calendly.com/")) {
                  if (cleanVal.startsWith("https://")) {
                    setCalendlyLink(cleanVal);
                  } else if (cleanVal.includes("calendly.com/")) {
                    setCalendlyLink("https://" + cleanVal.replace(/^https?:\/\//, ""));
                  } else {
                    setCalendlyLink("https://calendly.com/" + cleanVal.replace(/^\/+/, ""));
                  }
                } else {
                  setCalendlyLink(cleanVal);
                }
              }}
              onFocus={() => setActiveInput(true)}
              onBlur={() => setActiveInput(false)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {calendlyLink && calendlyLink !== "https://calendly.com/" ? (
              <TouchableOpacity onPress={() => setCalendlyLink("https://calendly.com/")} style={{ padding: normalize(4) }}>
                <Ionicons name="close-circle" size={normalize(18)} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Primary Save Button */}
          <TouchableOpacity
            style={[styles.saveSolidBtn, loading && styles.saveSolidBtnDisabled]}
            onPress={handleSaveLink}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: normalize(8) }}>
                <Text style={styles.saveSolidBtnText}>{t("saveCalendlyLink", "Save Calendly Link")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* How It Works Guide Card */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksHeaderRow}>
            <Ionicons name="information-circle-outline" size={normalize(22)} color="#153e69" style={{ marginRight: normalize(8) }} />
            <Text style={styles.howItWorksTitle}>{t("howItWorksTitle", "How it works?")}</Text>
          </View>

          {/* Step 1 */}
          <View style={styles.stepRowBlock}>
            <View style={styles.stepLeftCol}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumCircleText}>1</Text>
              </View>
              <View style={styles.stepDottedLine} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={styles.stepText}>
                {t("howItWorksStep1", "Employers and businesses browse your chef profile on Jobrito.")}
              </Text>
            </View>
            <View style={styles.stepRightIconCircle}>
              <Ionicons name="people-outline" size={normalize(20)} color="#153e69" />
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepRowBlock}>
            <View style={styles.stepLeftCol}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumCircleText}>2</Text>
              </View>
              <View style={styles.stepDottedLine} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={styles.stepText}>
                {t("howItWorksStep2", "They click 'Book Consultation' to view your available time slots.")}
              </Text>
            </View>
            <View style={styles.stepRightIconCircle}>
              <Ionicons name="calendar-outline" size={normalize(20)} color="#153e69" />
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepRowBlock}>
            <View style={styles.stepLeftCol}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumCircleText}>3</Text>
              </View>
            </View>
            <View style={styles.stepContentCol}>
              <Text style={styles.stepText}>
                {t("howItWorksStep3", "Calls are automatically synced into your Google/Outlook calendar.")}
              </Text>
            </View>
            <View style={styles.stepRightIconCircle}>
              <Ionicons name="sync-outline" size={normalize(20)} color="#153e69" />
            </View>
          </View>
        </View>

        {/* Don't have a Calendly Account Card */}
        <View style={styles.dontHaveAccountCard}>
          <View style={styles.dontHaveAccountTopRow}>
            <View style={styles.dontHaveIconCircle}>
              <Ionicons name="calendar-outline" size={normalize(22)} color="#4f46e5" />
            </View>
            <View style={styles.dontHaveTextCol}>
              <Text style={styles.dontHaveTitle}>
                {t("dontHaveCalendlyTitle", "Don't have a Calendly account yet?")}
              </Text>
              <Text style={styles.dontHaveSub}>
                {t("dontHaveCalendlySub", "Create a free account on Calendly in just 2 minutes to get your scheduling link.")}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignupCalendly} activeOpacity={0.85}>
            <Ionicons name="open-outline" size={normalize(16)} color="#4f46e5" style={{ marginRight: normalize(6) }} />
            <Text style={styles.signUpButtonText}>{t("signUpFreeCalendly", "Sign Up Free on Calendly")}</Text>
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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingTop: normalize(12),
    paddingBottom: normalize(14),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerBackBtnCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBarTitle: {
    fontSize: normalize(16.5),
    fontWeight: "800",
    color: "#0f172a",
  },
  scrollContent: {
    padding: normalize(16),
    gap: normalize(16),
    paddingBottom: normalize(40),
  },

  // Banner Box
  bannerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fffdf5",
    borderWidth: 1,
    borderColor: "#fef08a",
    borderRadius: normalize(18),
    padding: normalize(16),
  },
  bannerIconCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(14),
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(14),
  },
  bannerIconCircleConnected: {
    backgroundColor: "#dcfce7",
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(4),
  },
  statusPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fef3c7",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(12),
    marginBottom: normalize(6),
  },
  statusPillBadgeConnected: {
    backgroundColor: "#dcfce7",
  },
  statusPillBadgeText: {
    fontSize: normalize(11.5),
    fontWeight: "800",
    color: "#b45309",
  },
  statusPillBadgeTextConnected: {
    color: "#15803d",
  },
  bannerDesc: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#475569",
    lineHeight: normalize(18),
  },

  // Main Form Card
  mainFormCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(18),
    padding: normalize(16),
  },
  formCardTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(4),
  },
  formCardSub: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#64748b",
    lineHeight: normalize(18),
    marginBottom: normalize(14),
  },
  modernInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(14),
    height: normalize(48),
    marginBottom: normalize(16),
  },
  modernInputWrapperActive: {
    borderColor: "#153e69",
    backgroundColor: "#ffffff",
  },
  modernTextInput: {
    flex: 1,
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#0f172a",
  },

  // Save Solid Button
  saveSolidBtn: {
    width: "100%",
    backgroundColor: "#002b5c",
    borderRadius: normalize(12),
    paddingVertical: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#002b5c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveSolidBtnDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveSolidBtnText: {
    fontSize: normalize(15.5),
    fontWeight: "800",
    color: "#ffffff",
  },

  // How It Works Guide Card
  howItWorksCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(18),
    padding: normalize(16),
  },
  howItWorksHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(16),
  },
  howItWorksTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
  },
  stepRowBlock: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: normalize(54),
  },
  stepLeftCol: {
    alignItems: "center",
    marginRight: normalize(12),
    height: "100%",
  },
  stepNumCircle: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(13),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumCircleText: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#0f172a",
  },
  stepDottedLine: {
    flex: 1,
    width: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    marginVertical: normalize(4),
  },
  stepContentCol: {
    flex: 1,
    marginRight: normalize(10),
  },
  stepText: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#334155",
    lineHeight: normalize(18),
  },
  stepRightIconCircle: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  // Don't Have Account Card
  dontHaveAccountCard: {
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#e0e7ff",
    borderRadius: normalize(18),
    padding: normalize(16),
  },
  dontHaveAccountTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: normalize(14),
  },
  dontHaveIconCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(14),
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(14),
  },
  dontHaveTextCol: {
    flex: 1,
  },
  dontHaveTitle: {
    fontSize: normalize(14.5),
    fontWeight: "800",
    color: "#1e1b4b",
    marginBottom: normalize(4),
  },
  dontHaveSub: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#475569",
    lineHeight: normalize(17),
  },
  signUpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    borderRadius: normalize(12),
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
  },
  signUpButtonText: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#4f46e5",
  },
});
