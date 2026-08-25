import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  PixelRatio,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { ROLES } from "../../constants/roles";
import { setActiveRole } from "../../redux/slices/userSlice";
import { getStoredLanguage, setStoredRole, setSeenRoleSelection } from "../../services/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

export default function RoleSelectionScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const storedRole = useSelector((state) => state.user.activeRole);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    const checkStoredLanguage = async () => {
      const language = await getStoredLanguage();
      console.log("Language stored in AsyncStorage:", language);
    };

    checkStoredLanguage();
  }, []);

  const handleSelect = async (role) => {
    setSelectedRole(role);
    dispatch(setActiveRole(role));
    await setStoredRole(role);
    await setSeenRoleSelection();

    setTimeout(() => {
      if (role === ROLES.CHEF) {
        navigation.navigate("ChefIntroduction");
      } else {
        navigation.navigate("Login");
      }
    }, 200);
  };

  const rolesData = [
    {
      role: ROLES.CHEF,
      title: t("roleSelection.chef", "Chef Connect"),
      desc: t(
        "roleSelection.description.chef",
        "Showcase your culinary skills, experience and availability to top employers."
      ),
      icon: "restaurant-outline",
      leftBarColor: "#0f2342",
      iconBg: "#eef2ff",
      iconColor: "#0f2342",
    },
    {
      role: ROLES.JOB_SEEKER,
      title: t("roleSelection.jobseeker", "Talent"),
      desc: t(
        "roleSelection.description.jobseeker",
        "Discover exciting hospitality jobs and grow your career with leading brands."
      ),
      icon: "briefcase-outline",
      leftBarColor: "#0d9488",
      iconBg: "#e6fffa",
      iconColor: "#0d9488",
    },
    {
      role: ROLES.EMPLOYER,
      title: t("roleSelection.employer", "Hire Talent"),
      desc: t(
        "roleSelection.description.employer",
        "Post jobs and connect with skilled hospitality professionals for your kitchen."
      ),
      icon: "business-outline",
      leftBarColor: "#6366f1",
      iconBg: "#f3e8ff",
      iconColor: "#6366f1",
    },
  ];

  return (
    <ScreenWrapper
      scroll={true}
      style={{ backgroundColor: "#ffffff" }}
      contentStyle={styles.content}
    >
      {/* Top Header Section */}
      <View style={styles.headerSection}>
        {/* Orb Logo */}
        <View style={styles.logoOrbCircle}>
          <Image
            source={require("../../assets/Jobrito full logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.welcomeTitle}>
          {t("roleSelection.welcomeTitle", "Welcome to Jobrito")}
        </Text>

        {/* Decorative Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>

        {/* Subtitle */}
        <Text style={styles.welcomeSub}>
          {t(
            "roleSelection.welcomeSub",
            "Your all-in-one platform for hospitality professionals, employers and businesses."
          )}
        </Text>

        {/* Question Header */}
        <Text style={styles.howGetStarted}>
          {t("roleSelection.howGetStarted", "How would you like to get started?")}
        </Text>
      </View>

      {/* Role Selection Cards List */}
      <View style={styles.cardContainer}>
        {rolesData.map((item) => {
          const active = selectedRole === item.role;
          return (
            <Pressable
              key={item.role}
              onPress={() => handleSelect(item.role)}
              style={({ pressed }) => [
                styles.roleCard,
                pressed && { opacity: 0.92 },
                active && styles.roleCardActive,
              ]}
            >
              {/* Left Accent Bar */}
              <View style={[styles.leftAccentBar, { backgroundColor: item.leftBarColor }]} />

              {/* Card Main Body */}
              <View style={styles.cardBody}>
                {/* Icon Circle */}
                <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={normalize(22)} color={item.iconColor} />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={normalize(18)} color={item.leftBarColor} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* One Mobile Number Notice Card */}
      {/* <View style={styles.noticeCard}>
        <View style={styles.shieldIconCircle}>
          <Ionicons name="shield-checkmark" size={normalize(20)} color="#ffffff" />
        </View>
        <View style={styles.verticalWhiteDivider} />
        <View style={{ flex: 1 }}>
          <Text style={styles.noticeTitle}>
            {t("roleSelection.noticeTitle", "One mobile number. One module.")}
          </Text>
          <Text style={styles.noticeSub}>
            {t(
              "roleSelection.noticeSub",
              "Your registered mobile number cannot be used to access other modules."
            )}
          </Text>
        </View>
      </View> */}

      {/* Footer Card */}
      <View style={styles.footerCard}>
        <View style={styles.footerIconCircle}>
          <Ionicons name="business" size={normalize(18)} color="#1e40af" />
        </View>
        <View>
          <Text style={styles.footerLabel}>
            {t("roleSelection.initiativeBy", "An initiative by")}
          </Text>
          <Text style={styles.footerBrand}>
            {t("roleSelection.companyName", "HOSS GLOBAL INC., INDIA")}
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: normalize(16),
    paddingTop: normalize(10),
    paddingBottom: normalize(24),
    backgroundColor: "#ffffff",
  },

  // Header Section
  headerSection: {
    alignItems: "center",
    marginBottom: normalize(16),
  },
  logoOrbCircle: {
    width: normalize(95),
    height: normalize(95),
    borderRadius: normalize(47.5),
    backgroundColor: "#f0f7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(12),
    borderWidth: 1,
    borderColor: "#e0eeef",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  logoImage: {
    width: normalize(75),
    height: normalize(75),
  },
  welcomeTitle: {
    fontSize: normalize(24),
    fontWeight: "900",
    color: "#0f2342",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: normalize(6),
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(10),
    width: normalize(140),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#cbd5e1",
  },
  dividerDot: {
    width: normalize(5),
    height: normalize(5),
    borderRadius: normalize(2.5),
    backgroundColor: "#0f2342",
    marginHorizontal: normalize(6),
  },
  welcomeSub: {
    fontSize: normalize(12.5),
    color: "#475569",
    textAlign: "center",
    lineHeight: normalize(16.5),
    paddingHorizontal: normalize(16),
    fontWeight: "500",
    marginBottom: normalize(12),
  },
  howGetStarted: {
    fontSize: normalize(14.5),
    fontWeight: "900",
    color: "#0f2342",
    textAlign: "center",
  },

  // Card Container
  cardContainer: {
    gap: normalize(10),
    marginBottom: normalize(14),
  },
  roleCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "stretch",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  roleCardActive: {
    borderColor: "#0f2342",
    backgroundColor: "#fafcfd",
  },
  leftAccentBar: {
    width: normalize(5),
  },
  cardBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(12),
    paddingRight: normalize(14),
  },
  iconCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(12),
  },
  textContainer: {
    flex: 1,
    paddingRight: normalize(8),
  },
  cardTitle: {
    fontSize: normalize(15.5),
    fontWeight: "800",
    color: "#0f2342",
    marginBottom: normalize(2),
  },
  cardDesc: {
    fontSize: normalize(11.5),
    color: "#64748b",
    lineHeight: normalize(15.5),
  },

  // Notice Card
  noticeCard: {
    backgroundColor: "#03254c",
    borderRadius: normalize(12),
    padding: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(12),
  },
  shieldIconCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  verticalWhiteDivider: {
    width: 1,
    height: normalize(32),
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginRight: normalize(12),
  },
  noticeTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: normalize(2),
  },
  noticeSub: {
    fontSize: normalize(10.5),
    color: "#cbd5e1",
    lineHeight: normalize(14.5),
  },

  // Footer Card
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: normalize(12),
    padding: normalize(10),
    paddingHorizontal: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: "auto",
    marginBottom: normalize(4),
    width: "100%",
  },
  footerIconCircle: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  footerLabel: {
    fontSize: normalize(10.5),
    color: "#64748b",
  },
  footerBrand: {
    fontSize: normalize(11.5),
    fontWeight: "900",
    color: "#0f2342",
    letterSpacing: 0.3,
  },
});
