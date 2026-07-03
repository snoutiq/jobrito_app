import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppButton from "../../components/buttons/AppButton";
import OtpInput from "../../components/inputs/OtpInput";
import colors from "../../constants/colors";
import { verifyOtp } from "../../redux/slices/authSlice";
import { setStoredProfile, setStoredRole, setEmployerOnboardingCompleted, setChefOnboardingCompleted } from "../../services/storage";

const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { loading, phone: storedPhone } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState("");
  const phone = route?.params?.phone || storedPhone;
  const role = useSelector((state) => state.auth.role);

  const handleVerify = async () => {
    if (!otp.trim() || otp.trim().length < OTP_LENGTH) {
      Alert.alert(t("otp.requiredTitle"), t("otp.requiredMessage", { length: OTP_LENGTH }));
      return;
    }

    const result = await dispatch(verifyOtp({ phone, otp: otp.trim(), role, language: i18n.language }));
    console.log("Verify OTP API Full Response:", result);
    if (verifyOtp.fulfilled.match(result)) {
      console.log("TOKEN IN PAYLOAD:", result.payload?.token);
      const user = result.payload?.user;
      const hasCompletedOnboarding = result.payload?.hasCompletedOnboarding ?? false;
      const isEmp = role?.toLowerCase() === "employer";
      const isChef = role?.toLowerCase() === "chef" || role?.toLowerCase() === "job_seeker";
      
      const profileToStore = {
        ...user,
        name: user?.full_name || user?.name || "Guest User",
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

      const msg = result.payload?.message || "Successfully logged in.";
      Alert.alert("Login Status", msg);
      return;
    }

    Alert.alert(t("error"), result?.payload || t("otp.verificationFailed"));
  };

  const handleResend = () => {
    Alert.alert(t("otp.resendTitle"), t("otp.resendMessage"));
  };

  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.background }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={30} color="#fff" />
        </View>
        <Text style={styles.title}>{t("otp.title")}</Text>
        <Text style={styles.subtitle}>
          {t("otp.subtitle", { length: OTP_LENGTH, phone: phone || t("otp.yourPhoneNumber") })}
        </Text>
      </View>

      <View style={styles.otpBlock}>
        <OtpInput value={otp} onChangeText={setOtp} length={OTP_LENGTH} />
        <AppButton title={t("otp.verifyButton")} onPress={handleVerify} loading={loading} />

        <View style={styles.resendWrap}>
          <Text style={styles.resendLabel}>{t("otp.didNotReceive")}</Text>
          <Text style={styles.resendAction} onPress={handleResend}>
            {t("otp.resendNow")}
          </Text>
        </View>
      </View>
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
    maxWidth: 300,
  },
  otpBlock: {
    gap: 16,
    paddingTop: 4,
  },
  resendWrap: {
    alignItems: "center",
    gap: 4,
  },
  resendLabel: {
    color: colors.mutedText,
    fontSize: 12,
  },
  resendAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
});
