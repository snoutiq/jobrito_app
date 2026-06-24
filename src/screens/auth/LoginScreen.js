import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import PhoneInput from "../../components/inputs/PhoneInput";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";
import { requestOtp } from "../../redux/slices/authSlice";

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showCountryModal, setShowCountryModal] = useState(false);
 const role = useSelector((state) => state.user.activeRole);
 
  const countries = [
    { label: "login.india", code: "+91" },
    { label: "login.us", code: "+1" },
    { label: "login.uk", code: "+44" },
    { label: "login.unitedarabemirates", code: "+971" },
  ];

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
      navigation.navigate("Otp", {
        phone: phone.trim(),
      });
    }
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="briefcase" size={30} color="#fff" />
        </View>
        <Text style={styles.title}>{t("login.title")}</Text>
        <Text style={styles.subtitle}>{t("login.subtitle")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t("login.phoneLabel")}</Text>
        <PhoneInput
          value={phone}
          onChangeText={setPhone}
          prefix={countryCode}
          onPrefixPress={() => setShowCountryModal(true)}
        />
        <AppButton
          title={t("login.sendOtpButton")}
          onPress={handleRequestOtp}
          loading={loading}
        />
      </View>

      <Text style={styles.terms}>
        {t("login.termsPrefix")}{" "}
        <Text style={styles.termsLink}>{t("login.termsOfService")}</Text> {t("login.termsAnd")}{" "}
        <Text style={styles.termsLink}>{t("login.privacyPolicy")}</Text>
      </Text>

      <Modal
        visible={showCountryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCountryModal(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("login.modalTitle")}</Text>
            <View style={styles.countryList}>
              {countries.map((item) => {
                const active = countryCode === item.code;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      setCountryCode(item.code);
                      setShowCountryModal(false);
                    }}
                    style={[
                      styles.countryRow,
                      active && styles.countryRowActive,
                    ]}
                  >
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
                    {active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setShowCountryModal(false)}
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
    padding: 16,
    gap: 16,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EAF2FF",
    borderWidth: 1,
    borderColor: "#C7D8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 260,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  terms: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  countryList: {
    gap: 8,
  },
  countryRow: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryRowActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF4FF",
  },
  countryLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  countryLabelActive: {
    color: colors.primaryDark,
  },
  countryCode: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: "700",
  },
});
