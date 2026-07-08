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
  TouchableOpacity
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import PhoneInput from "../../components/inputs/PhoneInput";
import colors from "../../constants/colors";
import { requestOtp } from "../../redux/slices/authSlice";
import { setStoredProfile, setStoredRole, setEmployerOnboardingCompleted, setChefOnboardingCompleted } from "../../services/storage";

const PRIMARY_GREEN = "#22C55E";

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [countryFlag, setCountryFlag] = useState("🇮🇳");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const role = useSelector((state) => state.user.activeRole);

  const countries = [
    { name: "India", code: "+91", flag: "🇮🇳" },
    { name: "United States", code: "+1", flag: "🇺🇸" },
    { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
    { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
    { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
    { name: "Canada", code: "+1", flag: "🇨🇦" },
    { name: "Australia", code: "+61", flag: "🇦🇺" },
    { name: "Singapore", code: "+65", flag: "🇸🇬" }
  ];

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      Alert.alert(t("login.phoneRequiredTitle", "Phone Required"), t("login.phoneRequiredMessage", "Please enter your mobile number."));
      return;
    }

    const result = await dispatch(
      requestOtp({
        phone: phone.trim(),
        role,
      }),
    );

    if (requestOtp.fulfilled.match(result)) {
      const payload = result.payload?.data || result.payload;
      if (payload?.token && payload?.message === "Already logged in.") {
        const user = payload.user;
        const hasCompletedOnboarding = payload.has_completed_onboarding ?? (user?.chef_profile || user?.employer_profile ? true : false);
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
      });
    }
  };

  const filteredCountries = countries.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.includes(searchQuery)
  );

  return (
    <ScreenWrapper
      style={{ backgroundColor: "#FFFFFF" }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={38} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Jobrito</Text>
        <Text style={styles.subtitle}>Empowering the Hospitality Community</Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Mobile Number</Text>
        <PhoneInput
          value={phone}
          onChangeText={(text) => {
            if (text.length <= 10) setPhone(text);
          }}
          prefix={countryCode}
          flag={countryFlag}
          onPrefixPress={() => {
            setSearchQuery("");
            setShowCountryModal(true);
          }}
        />
        
        <TouchableOpacity
          onPress={handleRequestOtp}
          disabled={loading}
          style={[styles.sendOtpButton, loading && { opacity: 0.7 }]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.sendOtpButtonText}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        {t("login.termsPrefix", "By continuing, you agree to our")}{" "}
        <Text style={styles.termsLink}>{t("login.termsOfService", "Terms of Service")}</Text>{" "}
        {t("login.termsSuffix", "and")}{" "}
        <Text style={styles.termsLink}>{t("login.privacyPolicy", "Privacy Policy")}</Text>.
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
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                placeholder="Search country..."
                placeholderTextColor="#94A3B8"
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
                          size={20}
                          color={PRIMARY_GREEN}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
              {filteredCountries.length === 0 && (
                <Text style={styles.noResultsText}>No matching countries found.</Text>
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
    padding: 24,
    justifyContent: "center",
    flexGrow: 1,
    gap: 24,
  },
  hero: {
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: PRIMARY_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    color: "#0F7A37",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
  inputSection: {
    gap: 12,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  sendOtpButton: {
    backgroundColor: PRIMARY_GREEN,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  sendOtpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  terms: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 12,
    marginTop: 8,
  },
  termsLink: {
    color: PRIMARY_GREEN,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    color: "#1E293B",
    fontSize: 18,
    fontWeight: "900",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    paddingVertical: 8,
  },
  countryList: {
    marginBottom: 10,
  },
  countryRow: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryRowActive: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "#F0FDF4",
  },
  countryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  countryFlagText: {
    fontSize: 22,
  },
  countryLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  countryLabelActive: {
    color: "#15803D",
  },
  countryRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCodeText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  noResultsText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 20,
    fontSize: 14,
  },
});

