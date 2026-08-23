import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import colors from "../../constants/colors";
import { markNotificationAsRead } from "../../services/notificationApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";

export default function NotificationDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  
  console.log("📱 [NotificationDetailsScreen] Received Route Params:", JSON.stringify(route?.params, null, 2));

  const { notification, onMarkAsRead } = route.params || {};

  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole
  );

  useEffect(() => {
    // Mark as read in background if unread
    if (notification && !notification.is_read) {
      const callMarkRead = async () => {
        try {
          await markNotificationAsRead(notification.id);
          if (onMarkAsRead) {
            onMarkAsRead(notification.id);
          }
        } catch (e) {
          console.warn("Failed to mark notification as read on mount:", e);
        }
      };
      callMarkRead();
    }
  }, [notification]);

  if (!notification) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("notificationDetails", "Notification")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("noNotificationData", "No notification details found.")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const iconInfo = (() => {
    switch (notification.type?.toLowerCase()) {
      case "applicant":
      case "application":
      case "employer_shortlisted_candidate":
      case "candidate_shortlisted":
        return { name: "person-add", color: "#153e69", bg: "rgba(21, 62, 105, 0.08)" };
      case "job":
        return { name: "briefcase", color: "#15803d", bg: "rgba(21, 128, 61, 0.08)" };
      case "profile_view":
        return { name: "eye", color: "#b8860b", bg: "rgba(184, 134, 11, 0.08)" };
      case "alert":
      case "system":
        return { name: "notifications", color: "#f57f20", bg: "rgba(245, 127, 32, 0.08)" };
      default:
        return { name: "notifications", color: PRIMARY_GREEN, bg: "rgba(21, 62, 105, 0.08)" };
    }
  })();

  const metadata = notification.metadata || {};
  const hasJobId = !!(metadata.job_id || notification.job_id);
  const hasApplicationId = !!(metadata.application_id || notification.application_id);

  const handleActionPress = () => {
    const jobId = metadata.job_id || notification.job_id || notification.target_id;
    const isEmp = String(activeRole || "").toLowerCase() === "employer";

    const jobObj = {
      id: jobId,
      title: notification.title || "Job Opportunity",
      description: notification.body || notification.message || notification.text || "",
      company: metadata.company || notification.company || "",
      location: metadata.location || notification.location || "",
    };

    if (isEmp) {
      navigation.navigate("MyJobDetails", { 
        jobId: jobId, 
        job: jobObj 
      });
    } else {
      navigation.navigate("JobDetails", { 
        jobId: jobId,
        job: jobObj
      });
    }
  };

  const handleViewApplicantPress = () => {
    const applicantId = metadata.applicant_id || metadata.applicantId || notification.applicant_id;
    const applicationId = metadata.application_id || notification.application_id;
    
    navigation.navigate("ApplicantDetail", {
      applicantId: applicantId,
      applicationId: applicationId,
    });
  };

  const isUnread = !notification.is_read;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Seamless Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0a0504" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notificationDetails", "Details")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          {/* Card Top Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadgeCompact, { backgroundColor: iconInfo.bg }]}>
              <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
            </View>
            <View style={styles.headerMeta}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.categoryText, { color: iconInfo.color }]}>
                  {String(notification.type || "Update").toUpperCase()}
                </Text>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.timeText}>
                {notification.created_at_formatted || notification.created_at || notification.time_ago || t("recent", "Recent")}
              </Text>
            </View>
          </View>

          {/* Separator */}
          <View style={styles.cardSeparator} />

          {/* Title */}
          <Text style={styles.titleText}>{notification.title || "Notification Update"}</Text>

          {/* Message Body */}
          <Text style={styles.bodyText}>
            {notification.body || notification.message || notification.text || "-"}
          </Text>

          {/* Context Details (If any) */}
          {(hasJobId || hasApplicationId) && (
            <View style={styles.metaSection}>
              <Text style={styles.metaSectionTitle}>{t("associatedDetails", "Associated Details")}</Text>
              <View style={styles.metaGrid}>
                {hasJobId && (
                  <View style={styles.metaItem}>
                    <Ionicons name="briefcase-outline" size={16} color="rgba(10, 5, 4, 0.4)" />
                    <Text style={styles.metaItemText} numberOfLines={1}>
                      Job ID: #{metadata.job_id || notification.job_id}
                    </Text>
                  </View>
                )}
                {hasApplicationId && (
                  <View style={styles.metaItem}>
                    <Ionicons name="document-text-outline" size={16} color="rgba(10, 5, 4, 0.4)" />
                    <Text style={styles.metaItemText} numberOfLines={1}>
                      Application ID: #{metadata.application_id || notification.application_id}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.08)",
  },
  backButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: "#0f172a",
  },
  scrollContent: {
    padding: normalize(14),
    paddingBottom: normalize(28),
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(20),
    padding: normalize(20),
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.04)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadgeCompact: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(21),
    alignItems: "center",
    justifyContent: "center",
  },
  headerMeta: {
    marginLeft: normalize(10),
    flex: 1,
  },
  categoryText: {
    fontSize: normalize(10),
    fontWeight: "900",
    letterSpacing: 1.0,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  timeText: {
    fontSize: normalize(11),
    color: "rgba(15, 23, 42, 0.45)",
    marginTop: 2,
    fontWeight: "600",
  },
  cardSeparator: {
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    marginVertical: normalize(14),
  },
  titleText: {
    fontSize: normalize(18),
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: normalize(24),
    marginBottom: normalize(10),
  },
  bodyText: {
    fontSize: normalize(13.5),
    color: "rgba(15, 23, 42, 0.7)",
    lineHeight: normalize(21),
    fontWeight: "400",
  },
  metaSection: {
    marginTop: normalize(18),
    paddingTop: normalize(14),
    borderTopWidth: 1,
    borderTopColor: "rgba(15, 23, 42, 0.05)",
  },
  metaSectionTitle: {
    fontSize: normalize(10),
    fontWeight: "800",
    color: "rgba(15, 23, 42, 0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: normalize(8),
  },
  metaGrid: {
    gap: normalize(6),
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: normalize(7),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(8),
    gap: normalize(6),
  },
  metaItemText: {
    fontSize: normalize(11.5),
    color: "rgba(15, 23, 42, 0.65)",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: normalize(18),
  },
  emptyText: {
    fontSize: normalize(13),
    color: "rgba(15, 23, 42, 0.5)",
    textAlign: "center",
  },
});
