import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { getChefDashboardStats, getChefProfileViews } from "../../services/chefApi";

const PRIMARY_GREEN = "#153e69";

export default function ProfileViewsScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [viewsList, setViewsList] = useState([]);

  const fetchViewsData = async () => {
    setLoading(true);
    try {
      const [statsRes, viewsRes] = await Promise.all([
        getChefDashboardStats().catch(() => null),
        getChefProfileViews().catch(() => null),
      ]);

      if (viewsRes?.views && Array.isArray(viewsRes.views)) {
        setViewsList(viewsRes.views);
        // Correct the total_views count source of truth
        setTotalViews(viewsRes.total_views !== undefined ? viewsRes.total_views : viewsRes.views.length);
      } else if (statsRes?.stats?.profile_views !== undefined) {
        setTotalViews(statsRes.stats.profile_views);
      }
    } catch (err) {
      console.warn("Failed to fetch views stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewsData();
  }, []);

  const renderViewItem = ({ item }) => (
    <View style={styles.jobCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="business-outline" size={22} color={PRIMARY_GREEN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyText} numberOfLines={1}>{item.company}</Text>
          <Text style={styles.recruiterText} numberOfLines={1}>
            <Ionicons name="person-outline" size={13} color="rgba(10, 5, 4, 0.6)" />{" "}
            {item.recruiter_name}
          </Text>
          <Text style={styles.jobMetaText}>
            <Ionicons name="location-outline" size={13} color="rgba(10, 5, 4, 0.6)" />{" "}
            {item.location} • {item.viewed_at}
          </Text>
        </View>
      </View>
      {item.industry ? (
        <>
          <View style={styles.divider} />
          <View style={styles.detailsRow}>
            <Text style={styles.detailsText}>
              <Ionicons name="restaurant-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
              {item.industry}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <ScreenWrapper scroll={false} edges={["left", "right", "bottom"]} style={styles.container} contentStyle={{ padding: 0 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#153e69" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Views</Text>
        </View>
        <TouchableOpacity onPress={fetchViewsData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#153e69" />
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
            keyExtractor={(item, index) => item.id || String(index)}
            renderItem={renderViewItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="eye-off-outline" size={48} color={PRIMARY_GREEN} />
                </View>
                <Text style={styles.emptyTitle}>No Views Yet</Text>
                <Text style={styles.emptySubtitle}>
                  When recruiters and employers view your profile, their visit details will be logged here.
                </Text>
              </View>
            }
          />
        </View>
      )}
    </ScreenWrapper>
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
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.06)",
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
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
  },
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  companyText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  recruiterText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
    marginBottom: 2,
  },
  jobMetaText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingLeft: 54,
  },
  detailsText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    flexDirection: "row",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
});
