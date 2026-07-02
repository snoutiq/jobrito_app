import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import colors from "../../constants/colors";
import { resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { clearAuthStorage } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#22C55E";

export default function ChefProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  const displayName = profile?.name || profile?.full_name || "Chef Rajesh Kumar";
  const displayTitle = profile?.professionalTitle || profile?.preferred_role || "Culinary Consultant & Kitchen Setup Expert";
  const displayCity = profile?.city || "India & Overseas";
  const displayAvailability = profile?.availability || "Available for Consultation";

  // Helper to determine the company logo source URL
  const getLogoSource = () => {
    const uri = profile?.profile_photo_path || profile?.company_logo || profile?.companyLogo;
    if (!uri) return null;
    if (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("file://") ||
      uri.startsWith("data:")
    ) {
      return { uri };
    }
    return { uri: `http://178.16.138.159${uri.startsWith("/") ? "" : "/"}${uri}` };
  };

  const logoSource = getLogoSource();

  const handleLogout = async () => {
    CustomAlert.show(
      t("logOut", "Log Out"),
      t("logoutConfirmation", "Are you sure you want to log out?"),
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

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out Chef ${displayName}'s culinary professional profile on Jobrito!`,
      });
    } catch (error) {
      CustomAlert.show("Error", "Unable to share profile.");
    }
  };

  const handleOpenCalendly = () => {
    const link = profile?.calendly_link || profile?.calendlyUrl;
    if (link) {
      const fullUrl = link.startsWith("http") ? link : `https://${link}`;
      Linking.openURL(fullUrl).catch(() => {
        CustomAlert.show("Error", "Unable to open Calendly link.");
      });
    } else {
      CustomAlert.show(t("error"), "Calendly link is not configured.");
    }
  };

  const currentLanguageName = i18n.language === "hi" ? "हिंदी" : "English";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chef Connect</Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => CustomAlert.show("Notifications", "You have no new notifications.")}
        >
          <Ionicons name="notifications-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            {logoSource ? (
              <Image source={logoSource} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={28} color="#64748B" />
              </View>
            )}
            <View style={styles.profileTextInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileTitle}>{displayTitle}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.locationText}>{displayCity}</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusBullet} />
                <Text style={styles.statusText}>{displayAvailability}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.viewProfileBtn, { backgroundColor: PRIMARY_GREEN }]}
            activeOpacity={0.8}
            onPress={() => CustomAlert.show("View Profile", "Showing profile preview...")}
          >
            <Text style={styles.viewProfileBtnText}>View Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Analytics */}
        <Text style={styles.sectionTitle}>Performance Analytics</Text>
        
        <View style={styles.analyticsGrid}>
          {/* Card 1 */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIconBox}>
              <Ionicons name="eye-outline" size={18} color="#15803D" />
            </View>
            <Text style={styles.analyticsValue}>12</Text>
            <Text style={styles.analyticsLabel}>Profile Views</Text>
          </View>

          {/* Card 2 */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIconBox}>
              <Ionicons name="calendar-outline" size={18} color="#15803D" />
            </View>
            <Text style={styles.analyticsValue}>3</Text>
            <Text style={styles.analyticsLabel}>Appointment Req.</Text>
          </View>

          {/* Card 3 */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIconBox}>
              <Ionicons name="paper-plane-outline" size={18} color="#15803D" />
            </View>
            <Text style={styles.analyticsValue}>3</Text>
            <Text style={styles.analyticsLabel}>Referrals Posted</Text>
          </View>

          {/* Card 4 */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIconBox}>
              <Ionicons name="checkmark-done-circle-outline" size={18} color="#15803D" />
            </View>
            <Text style={styles.analyticsValue}>1</Text>
            <Text style={styles.analyticsLabel}>Upcoming Consult.</Text>
          </View>
        </View>

        {/* Active Project Requests Full Row */}
        <TouchableOpacity
          style={styles.fullWidthCardRow}
          activeOpacity={0.7}
          onPress={() => CustomAlert.show("Active Projects", "You have 3 active project requests.")}
        >
          <View style={styles.fullWidthCardLeft}>
            <View style={[styles.analyticsIconBox, { marginRight: 12 }]}>
              <Ionicons name="document-text-outline" size={18} color="#15803D" />
            </View>
            <Text style={styles.fullWidthCardText}>
              <Text style={{ fontWeight: "800" }}>3</Text> Active Project Requests
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        {/* My Activity */}
        <Text style={styles.sectionTitle}>My Activity</Text>
        <View style={styles.menuGroup}>
          {/* My Applications */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Applications")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-open-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>My Applications</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>1</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* My Saved Jobs */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("SavedJobs")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bookmark-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>My Saved Jobs</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>2</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* My Posted Jobs */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("MyJobs")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="share-social-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>My Posted Jobs</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>3</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Appointment Requests */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => CustomAlert.show("Appointments", "You have 3 callback requests.")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="calendar-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>Appointment Requests</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>3</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Upcoming Consultations */}
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => CustomAlert.show("Consultations", "You have 1 upcoming consultation.")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="calendar-number-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>Upcoming Consultations</Text>
            </View>
            <View style={styles.menuItemRight}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>1</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Professional Tools */}
        <Text style={styles.sectionTitle}>Professional Tools</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleOpenCalendly}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="calendar-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>Calendly Integration</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => CustomAlert.show("Social Links", "Social media links feature is coming soon.")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="globe-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>Social Media Links</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => CustomAlert.show("Availability", `Your availability: ${displayAvailability}`)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="time-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>Availability</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleShareProfile}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="share-outline" size={20} color="#15803D" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>Share Professional Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Settings & Support */}
        <Text style={styles.sectionTitle}>Settings & Support</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Language")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="language-outline" size={20} color="#64748B" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("language")}</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.langValueText}>{currentLanguageName}</Text>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Settings")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={20} color="#64748B" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("settingsTitle")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("HelpSupport")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#64748B" style={styles.menuIcon} />
              <Text style={styles.menuItemLabel}>{t("customerSupport")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.menuIcon} />
              <Text style={[styles.menuItemLabel, { color: "#EF4444" }]}>{t("logOut")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  bellButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 20,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileTextInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  profileTitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: "#22C55E",
    fontWeight: "700",
  },
  viewProfileBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewProfileBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 4,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  analyticsCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  analyticsIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F2FBF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 2,
  },
  analyticsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  fullWidthCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  fullWidthCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullWidthCardText: {
    fontSize: 12,
    color: "#1E293B",
    fontWeight: "500",
  },
  menuGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EF4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 16,
  },
  langValueText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
});
