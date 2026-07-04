import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { requestOtp } from "../../redux/slices/authSlice";
import { ROLES } from "../../constants/roles";
import { setStoredProfile, setStoredRole, setEmployerOnboardingCompleted, setChefOnboardingCompleted } from "../../services/storage";

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const role = useSelector((state) => state.user.activeRole);

  const countries = [
    { label: "login.india", code: "+91", flag: "🇮🇳" },
    { label: "login.us", code: "+1", flag: "🇺🇸" },
    { label: "login.uk", code: "+44", flag: "🇬🇧" },
    { label: "login.unitedarabemirates", code: "+971", flag: "🇦🇪" },
  ];

  const selectedCountry = countries.find((c) => c.code === countryCode) || countries[0];

  const filteredCountries = countries.filter((item) =>
    t(item.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.includes(searchQuery)
  );

  const handleRequestOtp = async () => {
    if (!phone.trim()) {
      Alert.alert(t("login.phoneRequiredTitle"), t("login.phoneRequiredMessage"));
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
          phone: user?.mobile_number || user?.phone,
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

  return (
    <ScreenWrapper
      scroll={true}
      style={{ backgroundColor: "#F7F9FB" }}
      contentStyle={styles.content}
    >
      <View style={styles.centerContainer}>
        {/* Top Icon Wrap */}
        <View style={styles.iconOuterCircle}>
          <View style={styles.iconSquare}>
            <Ionicons name="briefcase" size={26} color="#ffffff" />
          </View>
        </View>

        {/* Hero title & subtitle */}
        <Text style={styles.title}>{t("login.title")}</Text>
        <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.label}>{t("login.phoneLabel")}</Text>

          <View style={styles.phoneInputRow}>
            {/* Country Selector Dropdown */}
            <Pressable
              onPress={() => setShowCountryModal(true)}
              style={styles.countryDropdown}
            >
              <Text style={styles.countryText}>
                {selectedCountry.flag} {selectedCountry.code}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </Pressable>

            {/* Mobile Number Input */}
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={t("login.phoneNumberPlaceholder")}
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
          </View>

          {/* Send OTP Button */}
          <Pressable
            onPress={handleRequestOtp}
            disabled={loading}
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          >
            <Text style={styles.sendButtonText}>
              {loading ? t("loading") : t("login.sendOtpButton")}
            </Text>
            {!loading && <Ionicons name="chevron-forward" size={16} color="#065f46" />}
          </Pressable>

          {/* Terms and Privacy Policy */}
          <Text style={styles.terms}>
            By continuing, you agree to JobConnect's{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCountryModal(false);
          setSearchQuery("");
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowCountryModal(false);
              setSearchQuery("");
            }}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("login.modalTitle")}</Text>

            {/* Search Filter Input */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                placeholder={t("search") || "Search country..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </Pressable>
              )}
            </View>

            {/* Scrollable list of filtered countries */}
            <ScrollView style={styles.countryListScroll} showsVerticalScrollIndicator={true}>
              <View style={styles.countryList}>
                {filteredCountries.map((item) => {
                  const active = countryCode === item.code;
                  return (
                    <Pressable
                      key={item.code}
                      onPress={() => {
                        setCountryCode(item.code);
                        setShowCountryModal(false);
                        setSearchQuery("");
                      }}
                      style={[
                        styles.countryRow,
                        active && styles.countryRowActive,
                      ]}
                    >
                      <View style={styles.countryInfo}>
                        <Text style={styles.countryFlag}>{item.flag}</Text>
                        <View>
                          <Text
                            style={[
                              styles.countryLabel,
                              active && styles.countryLabelActive,
                            ]}
                          >
                            {t(item.label)}
                          </Text>
                          <Text style={styles.countryCode}>{item.code}</Text>
                        </View>
                      </View>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#22C55E"
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
                {filteredCountries.length === 0 && (
                  <Text style={styles.noResultsText}>No countries found</Text>
                )}
              </View>
            </ScrollView>

            <Pressable
              onPress={() => {
                setShowCountryModal(false);
                setSearchQuery("");
              }}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>{t("cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F7F9FB",
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
  },
  iconOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E6F7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconSquare: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 20,
  },
  countryDropdown: {
    minWidth: 95,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  countryText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
  },
  phoneInput: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  sendButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#82eca3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#065f46",
  },
  terms: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
    textAlign: "center",
  },
  termsLink: {
    color: "#047857",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    height: "100%",
    padding: 0,
  },
  countryListScroll: {
    maxHeight: 220,
  },
  countryList: {
    gap: 8,
  },
  countryRow: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryRowActive: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryLabel: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "800",
  },
  countryLabelActive: {
    color: "#15803d",
  },
  countryCode: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  noResultsText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    marginVertical: 20,
  },
  modalCloseButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  modalCloseText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
  },
});
