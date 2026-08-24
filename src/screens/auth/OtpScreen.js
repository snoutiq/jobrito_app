import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, Platform, Image, Dimensions, PixelRatio } from "react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

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

  useEffect(() => {
    setCountdown(50);
  }, []);

  const handleVerify = async (forcedOtp) => {
    const otpToVerify = typeof forcedOtp === "string" ? forcedOtp : otp;
    if (!otpToVerify.trim() || otpToVerify.trim().length < OTP_LENGTH) {
      Alert.alert(t("otp.requiredTitle", "OTP required"), t("otp.requiredMessage", { length: OTP_LENGTH }));
      return;
    }

    const result = await dispatch(verifyOtp({ phone, otp: otpToVerify.trim(), role, language: i18n.language, fcmToken }));
    console.log("Verify OTP API Full Response:", JSON.stringify(result, null, 2));
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

    Alert.alert(t("error", "Error"), result?.payload || t("otp.verificationFailed", "OTP verification failed"));
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
      setCountdown(50);
    } else {
      Alert.alert(t("error", "Error"), result?.payload || t("login.otpResendFailed", "OTP resend failed"));
    }
  };

  return (
    <ScreenWrapper
      scroll={true}
      style={{ backgroundColor: "#ffffff" }}
      contentStyle={styles.content}
    >
      <View style={styles.centerContainer}>
        <Image
          source={require("../../assets/Jobrito full logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>
          {t("otp.subtitle", { length: OTP_LENGTH, phone: formattedPhone || t("otp.yourPhoneNumber", "your phone number") })}
        </Text>

        {/* WhatsApp Friendly Note */}
        <View style={styles.whatsappNote}>
          <Ionicons name="chatbubble-ellipses" size={normalize(16)} color="#153e69" style={styles.whatsappNoteIcon} />
          <Text style={styles.whatsappNoteText}>{t("otp.whatsappNote", "Friendly tip: We sent the OTP directly to your WhatsApp to keep things fast and secure! 💬")}</Text>
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
              {loading ? t("common.loading", "Loading...") : t("otp.verifyButton", "Verify OTP")}
            </Text>
            {!loading && <Ionicons name="chevron-forward" size={normalize(16)} color="#ffffff" />}
          </Pressable>
        </View>

        {/* Resend Section */}
        <View style={styles.resendWrap}>
          <Text style={styles.resendLabel}>{t("otp.didNotReceive", "Didn't receive the code?")}</Text>
          <Pressable
            onPress={handleResend}
            disabled={countdown > 0}
            style={[styles.resendActionRow, countdown > 0 && styles.resendActionRowDisabled]}
          >
            <Ionicons
              name="refresh"
              size={normalize(13)}
              color={countdown > 0 ? "rgba(10, 5, 4, 0.2)" : "#153e69"}
            />
            <Text style={[styles.resendAction, countdown > 0 && styles.resendActionDisabled]}>
              {countdown > 0
                ? `${t("otp.resendNow", "Resend OTP now")} (${countdown}s)`
                : t("otp.resendNow", "Resend OTP now")}
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
    padding: normalize(20),
    backgroundColor: "#ffffff",
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
  },
  logoImage: {
    width: normalize(300),
    height: normalize(125),
    alignSelf: "center",
    marginBottom: normalize(14),
  },
  subtitle: {
    fontSize: normalize(13),
    color: "#64748b",
    textAlign: "center",
    lineHeight: normalize(18),
    maxWidth: normalize(310),
    marginBottom: normalize(20),
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(16),
    padding: normalize(16),
    width: "100%",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
    marginBottom: normalize(20),
  },
  otpInputContainer: {
    marginBottom: normalize(16),
  },
  verifyButton: {
    height: normalize(48),
    borderRadius: normalize(12),
    backgroundColor: "#153e69",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(6),
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#ffffff",
  },
  resendWrap: {
    alignItems: "center",
    gap: normalize(6),
  },
  resendLabel: {
    color: "#64748b",
    fontSize: normalize(12.5),
  },
  resendActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(4),
  },
  resendActionRowDisabled: {
    opacity: 0.6,
  },
  resendAction: {
    color: "#153e69",
    fontSize: normalize(13.5),
    fontWeight: "800",
  },
  resendActionDisabled: {
    color: "rgba(10, 5, 4, 0.25)",
  },
  whatsappNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: normalize(10),
    padding: normalize(10),
    paddingHorizontal: normalize(12),
    width: "100%",
    marginBottom: normalize(16),
  },
  whatsappNoteIcon: {
    marginRight: normalize(8),
  },
  whatsappNoteText: {
    flex: 1,
    fontSize: normalize(11.5),
    color: "#1e40af",
    lineHeight: normalize(16),
    fontWeight: "600",
  },
});

