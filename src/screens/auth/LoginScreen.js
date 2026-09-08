import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  PixelRatio,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import PhoneInput from "../../components/inputs/PhoneInput";
import colors from "../../constants/colors";
import { requestOtp } from "../../redux/slices/authSlice";
import { setStoredProfile, setStoredRole, setEmployerOnboardingCompleted, setChefOnboardingCompleted } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";
const TERMS_URL = "https://jobrito.com/terms-and-conditions";
const PRIVACY_URL = "https://jobrito.com/privacy-policy";

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const handleOpenWebUrl = (url) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => {
      console.warn("Could not open URL:", err);
    });
  };
  const { loading } = useSelector((state) => state.auth);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [countryFlag, setCountryFlag] = useState("\u{1F1EE}\u{1F1F3}");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const role = useSelector((state) => state.user.activeRole);

  const countries = [
    { name: "India", code: "+91", flag: "\u{1F1EE}\u{1F1F3}", digits: 10 },
    { name: "United States", code: "+1", flag: "\u{1F1FA}\u{1F1F8}", digits: 10 },
    { name: "United Kingdom", code: "+44", flag: "\u{1F1EC}\u{1F1E7}", digits: 10 },
    { name: "United Arab Emirates", code: "+971", flag: "\u{1F1E6}\u{1F1EA}", digits: 9 },
    { name: "Saudi Arabia", code: "+966", flag: "\u{1F1F8}\u{1F1E6}", digits: 9 },
    { name: "Canada", code: "+1", flag: "\u{1F1E8}\u{1F1E6}", digits: 10 },
    { name: "Australia", code: "+61", flag: "\u{1F1E6}\u{1F1FA}", digits: 9 },
    { name: "Singapore", code: "+65", flag: "\u{1F1F8}\u{1F1EC}", digits: 8 }
  ];

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      CustomAlert.show(
        t("login.phoneRequiredTitle", "Phone Required"),
        t("login.phoneRequiredMessage", "Please enter your mobile number.")
      );
      return;
    }

    const extension = countryCode ? countryCode.replace(/\D/g, "") : "91";

    const result = await dispatch(
      requestOtp({
        phone: phone.trim(),
        role,
        extension,
      }),
    );

    if (requestOtp.fulfilled.match(result)) {
      const payload = result.payload?.data || result.payload;
      console.log("OTP requested successfully, payload received:", payload);
      if (payload?.token && payload?.message === "Already logged in.") {
        const user = payload.user;
        const hasCompletedOnboarding =
          payload.has_completed_onboarding ??
          payload.hasCompletedOnboarding ??
          (user?.chef_profile || user?.employer_profile ? true : false);
        const isEmp = role?.toLowerCase() === "employer";
        const isChef = role?.toLowerCase() === "chef" || role?.toLowerCase() === "job_seeker";

        const profileToStore = {
          ...user,
          name: user?.full_name || user?.name || user?.mobile_number || "",
          phone: user?.mobile_number || user?.phone || phone.trim(),
          role: role,
          employerOnboardingCompleted: isEmp ? hasCompletedOnboarding : false,
          chefOnboardingCompleted: isChef ? hasCompletedOnboarding : false,
        };

        await setStoredProfile(profileToStore);
        await setStoredRole(role);

        if (hasCompletedOnboarding) {
          if (isEmp) {
            await setEmployerOnboardingCompleted();
          } else if (isChef) {
            await setChefOnboardingCompleted();
          }
        }
        return;
      }

      navigation.navigate("Otp", {
        phone: phone.trim(),
        extension,
      });
      return;
    }

    let cleanErrorMsg =
      typeof result?.payload === "string"
        ? result.payload
        : result?.payload?.message ||
          result?.error?.message ||
          t("login.otpSendFailed", "Failed to send OTP. Please try again.");

    const isRoleConflict =
      cleanErrorMsg.toLowerCase().includes("role conflict") ||
      cleanErrorMsg.toLowerCase().includes("already registered");

    cleanErrorMsg = cleanErrorMsg.replace(/^Role conflict error:\s*/i, "");

    const alertTitle = isRoleConflict
      ? t("login.roleConflictTitle", "Account Already Registered")
      : t("error", "Error");

    CustomAlert.show(alertTitle, cleanErrorMsg, [
      { text: t("common.ok", "OK"), style: "default" },
    ]);
  };

  const filteredCountries = countries.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.includes(searchQuery)
  );

  const selectedCountry = countries.find(item => item.code === countryCode && item.flag === countryFlag) || countries[0];
  const targetDigits = selectedCountry?.digits || 10;
  const isPhoneValid = phone.trim().length === targetDigits;

  return (
    <ScreenWrapper
      style={{ backgroundColor: "#ffffff" }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/Jobrito full logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>{t("login.empoweringSubtitle", "Empowering the Hospitality Community")}</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>{t("login.mobileNumber", "Mobile Number")}</Text>
        <PhoneInput
          value={phone}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, "");
            if (cleaned.length <= targetDigits) setPhone(cleaned);
          }}
          prefix={countryCode}
          flag={countryFlag}
          onPrefixPress={() => {
            setSearchQuery("");
            setShowCountryModal(true);
          }}
          maxLength={targetDigits}
        />
        
        <TouchableOpacity
          onPress={handleRequestOtp}
          disabled={!isPhoneValid || loading}
          style={[styles.sendOtpButton, (!isPhoneValid || loading) && { opacity: 0.45 }]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(8) }}>
              <Text style={styles.sendOtpButtonText}>{t("login.sendOtp", "Send OTP")}</Text>
              <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        {t("login.termsPrefix", "By continuing, you agree to our")}{" "}
        <Text
          style={styles.termsLink}
          onPress={() => handleOpenWebUrl(TERMS_URL)}
        >
          {t("login.termsOfService", "Terms of Service")}
        </Text>{" "}
        {t("login.termsSuffix", "and")}{" "}
        <Text
          style={styles.termsLink}
          onPress={() => handleOpenWebUrl(PRIVACY_URL)}
        >
          {t("login.privacyPolicy", "Privacy Policy")}
        </Text>.
      </Text>

      <Modal
        visible={showCountryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCountryModal(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("login.selectCountry", "Select Country")}</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close-circle" size={normalize(26)} color="rgba(10, 5, 4, 0.4)" />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={normalize(20)} color="rgba(10, 5, 4, 0.4)" style={styles.searchIcon} />
              <TextInput
                placeholder={t("login.searchCountry", "Search country...")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInputField}
              />
            </View>

            <ScrollView style={styles.countryList} keyboardShouldPersistTaps="handled">
              {filteredCountries.map((item) => {
                const active = countryCode === item.code;
                return (
                  <Pressable
                    key={`${item.name}-${item.code}`}
                    onPress={() => {
                      setCountryCode(item.code);
                      setCountryFlag(item.flag);
                      if (phone.length > item.digits) {
                        setPhone(phone.slice(0, item.digits));
                      }
                      setShowCountryModal(false);
                    }}
                    style={[
                      styles.countryRow,
                      active && styles.countryRowActive,
                    ]}
                  >
                    <View style={styles.countryRowLeft}>
                      <Text style={styles.countryFlagText}>{item.flag}</Text>
                      <Text
                        style={[
                          styles.countryLabel,
                          active && styles.countryLabelActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.countryRowRight}>
                      <Text style={styles.countryCodeText}>{item.code}</Text>
                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={normalize(20)}
                          color={PRIMARY_GREEN}
                          style={{ marginLeft: normalize(8) }}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
              {filteredCountries.length === 0 && (
                <Text style={styles.noResultsText}>{t("login.noMatchingCountries", "No matching countries found.")}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: normalize(20),
    justifyContent: "center",
    flexGrow: 1,
    gap: normalize(20),
  },
  hero: {
    alignItems: "center",
    gap: normalize(6),
    marginBottom: normalize(8),
  },
  logoImage: {
    width: normalize(300),
    height: normalize(125),
    alignSelf: "center",
    marginBottom: normalize(8),
  },
  subtitle: {
    color: "#64748b",
    fontSize: normalize(13.5),
    textAlign: "center",
    fontWeight: "500",
  },
  inputSection: {
    gap: normalize(10),
  },
  label: {
    color: "#475569",
    fontSize: normalize(13.5),
    fontWeight: "700",
  },
  sendOtpButton: {
    backgroundColor: PRIMARY_GREEN,
    height: normalize(48),
    borderRadius: normalize(12),
    justifyContent: "center",
    alignItems: "center",
    marginTop: normalize(8),
  },
  sendOtpButtonText: {
    color: "#ffffff",
    fontSize: normalize(15),
    fontWeight: "800",
  },
  linksContainer: {
    alignItems: "center",
    gap: normalize(10),
  },
  terms: {
    color: "#64748b",
    fontSize: normalize(11.5),
    lineHeight: normalize(17),
    textAlign: "center",
    paddingHorizontal: normalize(10),
    marginTop: normalize(6),
  },
  termsLink: {
    color: PRIMARY_GREEN,
    fontWeight: "700",
  },
  footerLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(8),
    marginTop: normalize(4),
  },
  footerLinkText: {
    color: "#153e69",
    fontSize: normalize(12),
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  footerLinkDivider: {
    color: "#94a3b8",
    fontSize: normalize(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    maxHeight: "80%",
    padding: normalize(16),
    gap: normalize(10),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(4),
  },
  modalTitle: {
    color: "#0a0504",
    fontSize: normalize(17),
    fontWeight: "900",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(10),
    height: normalize(44),
    marginBottom: normalize(6),
  },
  searchIcon: {
    marginRight: normalize(8),
  },
  searchInputField: {
    flex: 1,
    fontSize: normalize(14),
    color: "#0a0504",
    paddingVertical: normalize(6),
  },
  countryList: {
    marginBottom: normalize(25),
  },
  countryRow: {
    minHeight: normalize(48),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: normalize(12),
    marginVertical: normalize(3),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryRowActive: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  countryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    flex: 1,
  },
  countryFlagText: {
    fontSize: normalize(20),
  },
  countryLabel: {
    color: "#475569",
    fontSize: normalize(13.5),
    fontWeight: "700",
  },
  countryLabelActive: {
    color: "#153e69",
  },
  countryRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCodeText: {
    color: "#64748b",
    fontSize: normalize(12.5),
    fontWeight: "600",
  },
  noResultsText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: normalize(16),
    fontSize: normalize(13),
  },
});