import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { setUnreadNotificationsCount, clearUnreadNotificationsCount } from "../../redux/slices/userSlice";
import colors from "../../constants/colors";
import {
  getEmployerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationApi";

const PRIMARY_GREEN = "#153e69";

export default function EmployerNotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole,
  );
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "unread", "read"

  const fetchNotifications = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await getEmployerNotifications(activeRole);
      const list = res?.notifications || res?.data || (Array.isArray(res) ? res : []);
      setNotifications(list);
      const unread = list.filter((n) => !n.is_read).length;
      dispatch(setUnreadNotificationsCount(unread));
    } catch (err) {
      console.warn("Failed to fetch employer notifications:", err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [activeRole])
  );

  const handleMarkAsRead = (item) => {
    // 1. Mark as read locally if not already read
    if (!item.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === String(item.id) ? { ...n, is_read: true } : n))
      );
    }
    
    // 2. Navigate to details screen
    navigation.navigate("NotificationDetails", {
      notification: item,
      onMarkAsRead: (id) => {
        setNotifications((prev) =>
          prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n))
        );
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    dispatch(clearUnreadNotificationsCount());
    try {
      await markAllNotificationsAsRead(activeRole, unreadIds);
    } catch (e) {
      // ignore errors
    }
  };

  // Unread Count
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getSummaryTitle = () => {
    const roleLower = String(activeRole || "").toLowerCase();
    if (roleLower === "chef") {
      return t("chefNotifications", "Chef Notifications");
    } else if (roleLower === "talent" || roleLower === "jobseeker" || roleLower === "job_seeker") {
      return t("talentNotifications", "Talent Notifications");
    }
    return t("employerNotifications", "Employer Notifications");
  };

  const getSummaryText = () => {
    const roleLower = String(activeRole || "").toLowerCase();
    if (roleLower === "chef") {
      return t("chefNotificationsSummary", "Stay updated on consultation requests, project status, and messages.");
    } else if (roleLower === "talent" || roleLower === "jobseeker" || roleLower === "job_seeker") {
      return t("talentNotificationsSummary", "Stay updated on your job applications, shortlists, and recommendations.");
    }
    return t("employerNotificationsSummary", "Stay updated on job applications, profile views, and candidate responses.");
  };

  // Filtered List
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.is_read;
    if (activeTab === "read") return Boolean(n.is_read);
    return true;
  });

  const getNotificationIconInfo = (type) => {
    switch (type?.toLowerCase()) {
      case "applicant":
      case "application":
        return { name: "person-add", color: "#153e69" };
      case "job":
        return { name: "briefcase", color: "#15803d" };
      case "profile_view":
        return { name: "eye", color: "#b8860b" };
      case "alert":
      case "system":
        return { name: "notifications", color: "#f57f20" };
      default:
        return { name: "notifications", color: PRIMARY_GREEN };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.headerTitleRow, { flex: 1, justifyContent: "center" }]}>
          <Text style={[styles.title, { textAlign: "center" }]}>{t("notifications", "Notifications")}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={20} color={PRIMARY_GREEN} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => fetchNotifications(true)} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={20} color={PRIMARY_GREEN} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === "all" && styles.tabChipActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabChipText, activeTab === "all" && styles.tabChipTextActive]}>
            {t("all", "All")} ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === "unread" && styles.tabChipActive]}
          onPress={() => setActiveTab("unread")}
        >
          <Text style={[styles.tabChipText, activeTab === "unread" && styles.tabChipTextActive]}>
            {t("unread", "Unread")} ({unreadCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === "read" && styles.tabChipActive]}
          onPress={() => setActiveTab("read")}
        >
          <Text style={[styles.tabChipText, activeTab === "read" && styles.tabChipTextActive]}>
            {t("read", "Read")} ({notifications.length - unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>{t("loadingNotifications", "Loading notifications...")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item, index) => item.id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} colors={[PRIMARY_GREEN]} />}
          renderItem={({ item }) => {
            const isUnread = !item.is_read;
            const iconInfo = getNotificationIconInfo(item.type);

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleMarkAsRead(item)}
                style={[
                  styles.notificationCard,
                  isUnread && styles.notificationCardUnread,
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${iconInfo.color}15` }]}>
                  <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
                </View>

                <View style={styles.content}>
                  <View style={styles.row}>
                    <Text style={[styles.itemTitle, isUnread && styles.itemTitleUnread]} numberOfLines={1}>
                      {item.title || item.heading || "Notification Update"}
                    </Text>
                    <Text style={styles.time}>{item.created_at || item.time || "Recent"}</Text>
                  </View>
                  <Text style={styles.message} numberOfLines={2}>
                    {item.message || item.body || item.text}
                  </Text>
                </View>

                {isUnread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="notifications-off-outline" size={44} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === "unread"
                  ? t("noUnreadNotifications", "No unread notifications")
                  : t("noNotificationsYet", "No notifications yet")}
              </Text>
              <Text style={styles.emptyText}>
                {t("noNotificationsText", "You will see job applicant and candidate updates here.")}
              </Text>
              <TouchableOpacity style={styles.emptyRefreshBtn} onPress={() => fetchNotifications(true)}>
                <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyRefreshBtnText}>{t("refreshList", "Refresh List")}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f3",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  unreadBadge: {
    backgroundColor: "rgba(21, 62, 105, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY_GREEN,
  },
  markAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#f2f2f3",
  },
  tabChipActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  tabChipTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },

  // List Content
  listContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: "600",
  },
  summaryCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  summaryText: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },

  // Card
  notificationCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
  },
  notificationCardUnread: {
    backgroundColor: "rgba(21, 62, 105, 0.04)",
    borderColor: "rgba(21, 62, 105, 0.25)",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  itemTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  itemTitleUnread: {
    fontWeight: "800",
    color: PRIMARY_GREEN,
  },
  time: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "600",
  },
  message: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_GREEN,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
    marginBottom: 16,
  },
  emptyRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyRefreshBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
