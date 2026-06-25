import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";
import { logout } from "../../redux/slices/authSlice";
import { resetUser } from "../../redux/slices/userSlice";
import { clearAuthStorage } from "../../services/storage";
import { useTranslation } from "react-i18next";

export default function ChefConnectScreen({ navigation }) {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const profile = useSelector((state) => state.user.profile);

  // Get active profile data with fallbacks matching the Rajesh Kumar mockup card
  const chefName = profile?.name && profile.name !== "Guest User" ? profile.name : "Chef Rajesh Kumar";
  const chefTitle = profile?.professionalTitle || "Culinary Consultant & Kitchen Setup Expert";
  const chefLocation = profile?.country ? `${profile.city || ""}, ${profile.country}` : "India & Overseas";
  const chefAvailability = profile?.availability || "Available for Consultation";

  const handleLogout = async () => {
    Alert.alert(
      t("logout") || "Logout",
      t("profile.logoutConfirm") || "Are you sure you want to log out of JobConnect?",
      [
        { text: t("cancel") || "Cancel", style: "cancel" },
        {
          text: t("logout") || "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              const { logout: logoutApi } = require("../../services/authApi");
              await logoutApi();
            } catch (e) {
              // ignore
            }
            await clearAuthStorage();
            dispatch(logout());
            dispatch(resetUser());
          },
        },
      ]
    );
  };

  const handleViewProfile = () => {
    navigation.navigate("ChefProfile", {
      chef: {
        name: chefName,
        specialty: chefTitle,
        experience: profile?.experienceYears || "12 Years",
        city: profile?.city || "Mumbai",
        mobile: "+91 99999 88888",
        email: profile?.email || "rajesh.kumar@chefconnect.com",
        availability: chefAvailability,
        bio: profile?.bio || "Culinary consultant with years of experience setting up premium commercial kitchens.",
        calendlyUrl: "https://calendly.com/chef-rajesh",
      },
    });
  };

  const toggleLanguage = async () => {
    const currentLang = i18n.language;
    const nextLang = currentLang === "hi" ? "en" : "hi";
    await i18n.changeLanguage(nextLang);
    Alert.alert("Language / भाषा", `Language switched to ${nextLang === "hi" ? "Hindi (हिन्दी)" : "English"}`);
  };

  const handleToolAction = (toolName) => {
    Alert.alert(toolName, `Opening settings for ${toolName}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chef Connect</Text>
        <TouchableOpacity style={styles.bellBtn} onPress={() => Alert.alert("Notifications", "You have no new notifications.")}>
          <Ionicons name="notifications-outline" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfoRow}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=60"
              }}
              style={styles.profileAvatar}
            />
            <View style={styles.profileTextContainer}>
              <Text style={styles.profileName}>{chefName}</Text>
              <Text style={styles.profileTitle} numberOfLines={2}>{chefTitle}</Text>
              
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.locationText}>{chefLocation}</Text>
              </View>

              <View style={styles.statusBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.statusText}>{chefAvailability}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.viewProfileBtn} onPress={handleViewProfile} activeOpacity={0.8}>
            <Text style={styles.viewProfileBtnText}>View Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Analytics Grid */}
        <Text style={styles.sectionTitle}>Performance Analytics</Text>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Ionicons name="eye-outline" size={20} color="#15803D" style={styles.cardIcon} />
            <Text style={styles.analyticsNumber}>12</Text>
            <Text style={styles.analyticsLabel}>Profile Views</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Ionicons name="calendar-outline" size={20} color="#15803D" style={styles.cardIcon} />
            <Text style={styles.analyticsNumber}>3</Text>
            <Text style={styles.analyticsLabel}>Appointment Req.</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Ionicons name="mail-outline" size={20} color="#15803D" style={styles.cardIcon} />
            <Text style={styles.analyticsNumber}>3</Text>
            <Text style={styles.analyticsLabel}>Referrals Posted</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Ionicons name="calendar-clear-outline" size={20} color="#15803D" style={styles.cardIcon} />
            <Text style={styles.analyticsNumber}>1</Text>
            <Text style={styles.analyticsLabel}>Upcoming Consults</Text>
          </View>
        </View>

        {/* Active Project Requests Banner */}
        <TouchableOpacity style={styles.bannerCard} onPress={() => handleToolAction("Active Project Requests")}>
          <View style={styles.bannerLeft}>
            <Ionicons name="document-text-outline" size={20} color="#15803D" style={{ marginRight: 10 }} />
            <Text style={styles.bannerNumber}>3</Text>
            <Text style={styles.bannerLabel}>Active Project Requests</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        {/* My Activity Section */}
        <Text style={styles.sectionTitle}>My Activity</Text>
        <View style={styles.actionList}>
          <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate("Applications")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="bookmark-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>My Applications</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>1</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("My Saved Jobs")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="star-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>My Saved Jobs</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>2</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("My Posted Jobs")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="share-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>My Posted Jobs</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>3</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Appointment Requests")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="calendar-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Appointment Requests</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>3</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Upcoming Consultations")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="time-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Upcoming Consultations</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>1</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Professional Tools Section */}
        <Text style={styles.sectionTitle}>Professional Tools</Text>
        <View style={styles.actionList}>
          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Calendly Integration")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="calendar-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Calendly Integration</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Social Media Links")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="globe-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Social Media Links</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Availability")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="time-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Availability</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Share Professional Profile")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="share-social-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Share Professional Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Settings & Support Section */}
        <Text style={styles.sectionTitle}>Settings & Support</Text>
        <View style={styles.actionList}>
          <TouchableOpacity style={styles.listItem} onPress={toggleLanguage}>
            <View style={styles.listItemLeft}>
              <Ionicons name="language-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Language</Text>
            </View>
            <View style={styles.rightValueRow}>
              <Text style={styles.rightValueText}>{i18n.language === "hi" ? "हिन्दी" : "English"}</Text>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Settings")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="settings-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={() => handleToolAction("Help & Support")}>
            <View style={styles.listItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#15803D" style={styles.listIcon} />
              <Text style={styles.listItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.listItem} onPress={handleLogout}>
            <View style={styles.listItemLeft}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.listIcon} />
              <Text style={[styles.listItemText, { color: "#EF4444" }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#15803D",
  },
  bellBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "750",
    color: "#0F172A",
    marginBottom: 3,
  },
  profileTitle: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
    color: "#64748B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2FBF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },
  viewProfileBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  viewProfileBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "750",
    color: "#475569",
    marginBottom: 10,
    marginTop: 8,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  analyticsCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardIcon: {
    marginBottom: 8,
  },
  analyticsNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  analyticsLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "550",
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginRight: 6,
  },
  bannerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  actionList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  listIcon: {
    marginRight: 12,
  },
  listItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rightValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightValueText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "550",
  },
});
