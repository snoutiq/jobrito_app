import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import colors from "../../constants/colors";
import { markNotificationAsRead } from "../../services/notificationApi";

const PRIMARY_GREEN = "#153e69";

export default function NotificationDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
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
            <Ionicons name="arrow-back" size={24} color={colors.text} />
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
    const jobId = metadata.job_id || notification.job_id;
    const isEmp = String(activeRole || "").toLowerCase() === "employer";

    if (isEmp) {
      // If employer, navigate to MyJobDetails (which accepts job object)
      navigation.navigate("MyJobDetails", { 
        jobId: jobId, 
        job: { id: jobId, title: notification.title || "Job Opportunity" } 
      });
    } else {
      // If seeker/chef, navigate to standard JobDetails
      navigation.navigate("JobDetails", { jobId: jobId });
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notificationDetails", "Details")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large Centered Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconBadge, { backgroundColor: iconInfo.bg }]}>
            <Ionicons name={iconInfo.name} size={48} color={iconInfo.color} />
          </View>
        </View>

        {/* Title and Time Info */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title || "Notification Update"}</Text>
          <Text style={styles.timeText}>
            {notification.created_at_formatted || notification.created_at || notification.time_ago || t("recent", "Recent")}
          </Text>
          {notification.time_ago && (
            <Text style={styles.timeAgoText}>{notification.time_ago}</Text>
          )}
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Notification Description/Body */}
        <View style={styles.bodyContainer}>
          <Text style={styles.bodyLabel}>{t("notificationMessage", "Message")}</Text>
          <Text style={styles.bodyText}>
            {notification.body || notification.message || notification.text || "-"}
          </Text>
        </View>

        {/* Dynamic Contextual Action Buttons */}
        <View style={styles.actionsContainer}>
          {hasJobId && (
            <TouchableOpacity 
              style={styles.primaryActionButton}
              onPress={handleActionPress}
              activeOpacity={0.8}
            >
              <Ionicons name="briefcase-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>
                {t("viewJobDetails", "View Job Details")}
              </Text>
            </TouchableOpacity>
          )}

          {hasApplicationId && String(activeRole || "").toLowerCase() === "employer" && (
            <TouchableOpacity 
              style={[styles.primaryActionButton, { marginTop: 12, backgroundColor: "#f57f20" }]}
              onPress={handleViewApplicantPress}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>
                {t("viewApplicantDetails", "View Applicant Profile")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f3",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  textContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0a0504",
    textAlign: "center",
    lineHeight: 28,
  },
  timeText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 8,
    fontWeight: "500",
  },
  timeAgoText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.4)",
    marginTop: 4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.1)",
    marginVertical: 24,
  },
  bodyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    width: "100%",
  },
  bodyLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: PRIMARY_GREEN,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    color: "#0a0504",
    lineHeight: 22,
    fontWeight: "500",
  },
  actionsContainer: {
    width: "100%",
    marginTop: 30,
  },
  primaryActionButton: {
    flexDirection: "row",
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
  },
});
