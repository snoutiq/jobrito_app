import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, Platform, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import OtpInput from "../../components/inputs/OtpInput";
import colors from "../../constants/colors";
import { verifyOtp, requestOtp } from "../../redux/slices/authSlice";
import { setStoredProfile, setStoredRole, setEmployerOnboardingCompleted, setChefOnboardingCompleted } from "../../services/storage";

const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { loading, phone: storedPhone } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [fcmToken, setFcmToken] = useState("");
  const phone = route?.params?.phone || storedPhone;
  const role = useSelector((state) => state.auth.role);

  useEffect(() => {
    if (countdown === 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    async function fetchToken() {
      if (!Device.isDevice) {
        console.log("Must use physical device for Push Notifications");
        return;
      }
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log("Failed to get push token for push notification!");
          return;
        }
        const tokenData = await Notifications.getDevicePushTokenAsync();
        if (tokenData && tokenData.data) {
          setFcmToken(tokenData.data);
          console.log("FCM Token retrieved successfully:", tokenData.data);
        }
      } catch (error) {
        console.warn("Error retrieving FCM Token:", error);
      }
    }
    fetchToken();
  }, []);

  const maskPhone = (phoneStr) => {
    if (!phoneStr) return "";
    const cleaned = phoneStr.trim();
    if (cleaned.length <= 4) return cleaned;

    let country = "";
    let local = cleaned;
    if (cleaned.startsWith("+")) {
      if (cleaned.startsWith("+971")) {
        country = "+971";
        local = cleaned.substring(4);
      } else if (cleaned.startsWith("+91")) {
        country = "+91";
        local = cleaned.substring(3);
      } else if (cleaned.startsWith("+44")) {
        country = "+44";
        local = cleaned.substring(3);
      } else if (cleaned.startsWith("+1")) {
        country = "+1";
        local = cleaned.substring(2);
      } else {
        country = cleaned.substring(0, 3);
        local = cleaned.substring(3);
      }
    }

    const localTrimmed = local.trim();
    if (localTrimmed.length <= 4) {
      return `${country} *** *** ${localTrimmed}`;
    }
    const lastFour = localTrimmed.substring(localTrimmed.length - 4);
    return `${country} *** *** ${lastFour}`;
  };

  const formattedPhone = maskPhone(phone);

  const handleVerify = async () => {
    if (!otp.trim() || otp.trim().length < OTP_LENGTH) {
      Alert.alert(t("otp.requiredTitle"), t("otp.requiredMessage", { length: OTP_LENGTH }));
      return;
    }

    const result = await dispatch(verifyOtp({ phone, otp: otp.trim(), role, language: i18n.language, fcmToken }));
    console.log("Verify OTP API Full Response:", result);
    if (verifyOtp.fulfilled.match(result)) {
      console.log("TOKEN IN PAYLOAD:", result.payload?.token);
      const user = result.payload?.user;
      const hasCompletedOnboarding = result.payload?.hasCompletedOnboarding ?? false;
      const isEmp = role?.toLowerCase() === "employer";
      const isChef = role?.toLowerCase() === "chef" || role?.toLowerCase() === "job_seeker";

      const profileToStore = {
        ...user,
        name: user?.full_name || user?.name || user?.mobile_number || "",
        phone: user?.mobile_number || user?.phone || phone,
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

    Alert.alert(t("error"), result?.payload || t("otp.verificationFailed"));
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    const result = await dispatch(
      requestOtp({
        phone: phone.trim(),
        role,
      })
    );

    if (requestOtp.fulfilled.match(result)) {
      // Start 50 seconds countdown and do NOT show success alert
      setCountdown(50);
    } else {
      Alert.alert(t("error"), result?.payload || t("login.otpResendFailed"));
    }
  };

  return (
    <ScreenWrapper
      scroll={true}
      style={{ backgroundColor: "#f2f2f3" }}
      contentStyle={styles.content}
    >
      <View style={styles.centerContainer}>
        <Image
          source={require("../../assets/Jobrito full logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>
          {t("otp.subtitle", { length: OTP_LENGTH, phone: formattedPhone || t("otp.yourPhoneNumber") })}
        </Text>

        {/* WhatsApp Friendly Note with Human Touch */}
        <View style={styles.whatsappNote}>
          <Ionicons name="chatbubble-ellipses" size={16} color="#153e69" style={styles.whatsappNoteIcon} />
          <Text style={styles.whatsappNoteText}>{t("otp.whatsappNote")}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.otpInputContainer}>
            <OtpInput value={otp} onChangeText={setOtp} length={OTP_LENGTH} />
          </View>

          {/* Verify OTP Button */}
          <Pressable
            onPress={handleVerify}
            disabled={loading}
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? t("loading") : t("otp.verifyButton")}
            </Text>
            {!loading && <Ionicons name="chevron-forward" size={16} color="#153e69" />}
          </Pressable>
        </View>

        {/* Resend Section */}
        <View style={styles.resendWrap}>
          <Text style={styles.resendLabel}>{t("otp.didNotReceive")}</Text>
          <Pressable
            onPress={handleResend}
            disabled={countdown > 0}
            style={[styles.resendActionRow, countdown > 0 && styles.resendActionRowDisabled]}
          >
            <Ionicons
              name="refresh"
              size={13}
              color={countdown > 0 ? "rgba(10, 5, 4, 0.15)" : "#153e69"}
            />
            <Text style={[styles.resendAction, countdown > 0 && styles.resendActionDisabled]}>
              {countdown > 0
                ? `${t("otp.resendNow")} (${countdown}s)`
                : t("otp.resendNow")}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f2f2f3",
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
  },
  logoImage: {
    width: 380,
    height: 200,
    alignSelf: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  otpInputContainer: {
    marginBottom: 20,
  },
  verifyButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#153e69",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f3f5f7",
  },
  resendWrap: {
    alignItems: "center",
    gap: 8,
  },
  resendLabel: {
    color: "rgba(10, 5, 4, 0.6)",
    fontSize: 13,
  },
  resendActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resendActionRowDisabled: {
    opacity: 0.6,
  },
  resendAction: {
    color: "#153e69",
    fontSize: 14,
    fontWeight: "800",
  },
  resendActionDisabled: {
    color: "rgba(10, 5, 4, 0.15)",
  },
  whatsappNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.08)",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    marginBottom: 24,
  },
  whatsappNoteIcon: {
    marginRight: 8,
  },
  whatsappNoteText: {
    flex: 1,
    fontSize: 12,
    color: "#153e69",
    lineHeight: 18,
    fontWeight: "600",
  },
});

