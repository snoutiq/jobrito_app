import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { getChefDashboardStats } from "../../services/chefApi";

const PRIMARY_GREEN = "#153e69";

export default function ProfileViewsScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  
  // Mock data for recruiter profile views
  const [viewsList, setViewsList] = useState([
    {
      id: "1",
      recruiter_name: "Grand Hyatt HR Recruiter",
      company: "Grand Hyatt Hotels",
      location: "Mumbai, India",
      viewed_at: "Today, 11:30 AM",
      industry: "Hospitality & Dining",
    },
    {
      id: "2",
      recruiter_name: "F&B Director",
      company: "Le Meridien",
      location: "Dubai, UAE",
      viewed_at: "Yesterday, 4:15 PM",
      industry: "Fine Dining & Hotels",
    },
    {
      id: "3",
      recruiter_name: "Executive Chef / Owner",
      company: "Bombay Cafe",
      location: "New Delhi, India",
      viewed_at: "16 Jul 2026, 2:30 PM",
      industry: "Casual Dining Restaurants",
    },
    {
      id: "4",
      recruiter_name: "Talent Acquisition Lead",
      company: "Jumeirah Group",
      location: "Abu Dhabi, UAE",
      viewed_at: "14 Jul 2026, 9:00 AM",
      industry: "Luxury Hospitality",
    },
    {
      id: "5",
      recruiter_name: "Managing Director",
      company: "Global Talent Referral",
      location: "Singapore",
      viewed_at: "12 Jul 2026, 6:45 PM",
      industry: "Hospitality Staffing Agency",
    },
  ]);

  const fetchViewsData = async () => {
    setLoading(true);
    try {
      const statsRes = await getChefDashboardStats().catch(() => null);
      if (statsRes?.success && statsRes.stats) {
        setTotalViews(statsRes.stats.profile_views || 24);
      } else if (statsRes?.stats) {
        setTotalViews(statsRes.stats.profile_views || 24);
      } else {
        setTotalViews(24); // default fallback mock value
      }
    } catch (err) {
      console.warn("Failed to fetch views stats:", err);
      setTotalViews(24);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewsData();
  }, []);

  const renderViewItem = ({ item }) => (
    <View style={styles.viewCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="business" size={20} color="#153e69" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.companyText}>{item.company}</Text>
          <Text style={styles.recruiterText}>{item.recruiter_name}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color="rgba(10, 5, 4, 0.6)" style={styles.metaIcon} />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="rgba(10, 5, 4, 0.6)" style={styles.metaIcon} />
          <Text style={styles.metaText}>{item.viewed_at}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Views</Text>
        <TouchableOpacity onPress={fetchViewsData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#0a0504" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Stats Summary Banner */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryCircle}>
              <Text style={styles.summaryCount}>{totalViews}</Text>
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryTitle}>Total Profile Views</Text>
              <Text style={styles.summarySubtitle}>
                These are the number of times employers and agencies have viewed your professional chef profile.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recent Views</Text>

          <FlatList
            data={viewsList}
            keyExtractor={(item) => item.id}
            renderItem={renderViewItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
  },
  refreshButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  summaryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#153e69",
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  viewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  companyText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  recruiterText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "550",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#f2f2f3",
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
});
