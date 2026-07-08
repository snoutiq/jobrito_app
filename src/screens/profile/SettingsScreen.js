import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";

const PRIMARY_GREEN = "#22C55E";

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const activeRole = useSelector((state) => state.auth.user?.active_role ?? state.user?.activeRole);
  const isEmployer = activeRole === "employer";

  const businessName =
    profile?.business_name ||
    profile?.businessName ||
    profile?.current_employer ||
    profile?.company ||
    "";
  const contactName =
    profile?.contact_person_name ||
    profile?.contactName ||
    profile?.full_name ||
    profile?.name ||
    "";
  const mobileNumber =
    profile?.mobile_number ||
    profile?.phone ||
    profile?.contact_number ||
    "";
  const email = profile?.email || profile?.contactEmail || "";
  const location = profile?.location || profile?.business_location || profile?.city || "";

  const getLogoSource = () => {
    const uri = profile?.company_logo || profile?.companyLogo || profile?.profile_photo_path;
    if (!uri) return null;
    if (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("file://") ||
      uri.startsWith("data:")
    ) {
      return { uri };
    }
    return { uri: `http://178.16.138.159/backend${uri.startsWith("/") ? "" : "/"}${uri}` };
  };

  const logoSource = getLogoSource();

  const handleLogout = () => {
    Alert.alert(
      t("logOut"),
      t("logoutConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logOut"),
          style: "destructive",
          onPress: async () => {
            try {
              const { logout: logoutApi } = require("../../services/authApi");
              await logoutApi();
            } catch (e) {
              // ignore network logout errors
            }
            await clearAuthStorage();
            dispatch(logout());
            dispatch(resetUser());
          },
        },
      ]
    );
  };

  const accountRows = [
    {
      label: "Business Name",
      value: businessName || "-",
      icon: "business-outline",
    },
    {
      label: "Contact Person",
      value: contactName || "-",
      icon: "person-outline",
    },
    {
      label: "Mobile Number",
      value: mobileNumber || "-",
      icon: "call-outline",
    },
    {
      label: "Email",
      value: email || "-",
      icon: "mail-outline",
    },
    {
      label: "Location",
      value: location || "-",
      icon: "location-outline",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {logoSource ? (
            <Image source={logoSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="business-outline" size={30} color={PRIMARY_GREEN} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{contactName || businessName || "Employer"}</Text>
            <Text style={styles.profileSub}>{businessName || "Business profile"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Business Information</Text>
        <View style={styles.sectionCard}>
          {accountRows.map((item, index) => (
            <React.Fragment key={item.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={item.icon} size={18} color={PRIMARY_GREEN} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
              {index !== accountRows.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Account Status & Activity</Text>
        <View style={styles.sectionCard}>
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="speedometer-outline" size={18} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.actionLabel}>Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.pillButton} onPress={() => navigation.navigate("Tabs")}>
              <Text style={styles.pillButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="people-outline" size={18} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.actionLabel}>Chef Connect</Text>
            </View>
            <TouchableOpacity style={styles.pillButton} onPress={() => navigation.navigate("ChefConnectFilters")}>
              <Text style={styles.pillButtonText}>View Profiles</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings & Support</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate(isEmployer ? "EmployerCompleteProfile" : "PersonalInformation", 
            isEmployer ? { isEditMode: true } : undefined)}>
            <View style={styles.menuLeft}>
              <Ionicons name="create-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate("Language")}>
            <View style={styles.menuLeft}>
              <Ionicons name="globe-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>Change Language</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate("HelpSupport")}>
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={18} color={colors.text} />
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  profileSub: {
    fontSize: 13,
    color: "#64748B",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: PRIMARY_GREEN,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  pillButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillButtonText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuText: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "600",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "700",
  },
});





