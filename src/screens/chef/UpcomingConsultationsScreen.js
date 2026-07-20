import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { getChefUpcomingConsultations } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY = "#153e69";
const SECONDARY = "#f2f2f3";
const WARM_GOLD = "#f2c879";
const EMBER_ORANGE = "#f57f20";
const NEUTRAL = "#0a0504";

export default function UpcomingConsultationsScreen({ navigation }) {
  const { t } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "upcoming", "today", "completed"

  const fetchConsultations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await getChefUpcomingConsultations();
      const list = res?.consultations || res?.data || (Array.isArray(res) ? res : []);
      setConsultations(list);
    } catch (err) {
      console.warn("Failed to fetch consultations:", err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConsultations();
    }, [])
  );

  // Filter Logic
  const filteredList = consultations.filter((item) => {
    const status = String(item.status || "upcoming").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return status === "upcoming" || status === "confirmed" || status === "scheduled";
    if (activeTab === "today") return item.is_today || item.meeting_date?.toLowerCase().includes("today");
    if (activeTab === "completed") return status === "completed" || status === "finished";
    return true;
  });

  const todayCount = consultations.filter((item) => item.is_today || item.meeting_date?.toLowerCase().includes("today")).length;
  const upcomingCount = consultations.filter((item) => {
    const s = String(item.status || "upcoming").toLowerCase();
    return s === "upcoming" || s === "confirmed" || s === "scheduled" || s === "pending";
  }).length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={NEUTRAL} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{t("upcomingConsultations", "Upcoming Consultations")}</Text>
          {consultations.length > 0 && (
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountText}>{consultations.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => fetchConsultations(true)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Metric Banners */}
      <View style={styles.summaryBar}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: "rgba(21, 62, 105, 0.08)" }]}>
            <Ionicons name="calendar-number-outline" size={16} color={PRIMARY} />
          </View>
          <View>
            <Text style={styles.metricNumber}>{consultations.length}</Text>
            <Text style={styles.metricLabel}>{t("total", "Total Calls")}</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: "rgba(245, 127, 32, 0.12)" }]}>
            <Ionicons name="time-outline" size={16} color={EMBER_ORANGE} />
          </View>
          <View>
            <Text style={styles.metricNumber}>{todayCount}</Text>
            <Text style={styles.metricLabel}>{t("today", "Today")}</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: "rgba(34, 197, 94, 0.12)" }]}>
            <Ionicons name="videocam-outline" size={16} color="#15803d" />
          </View>
          <View>
            <Text style={styles.metricNumber}>{upcomingCount}</Text>
            <Text style={styles.metricLabel}>{t("upcoming", "Upcoming")}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === "all" && styles.tabChipActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
              {t("all", "All")} ({consultations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === "upcoming" && styles.tabChipActive]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>
              {t("upcoming", "Upcoming")} ({upcomingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === "today" && styles.tabChipActive]}
            onPress={() => setActiveTab("today")}
          >
            <Text style={[styles.tabText, activeTab === "today" && styles.tabTextActive]}>
              {t("today", "Today")} ({todayCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>{t("loadingConsultations", "Loading upcoming consultations...")}</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchConsultations(true)} colors={[PRIMARY]} />}
        >
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar-number-outline" size={48} color={PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>{t("noConsultationsTitle", "No Consultations Found")}</Text>
          <Text style={styles.emptySubtitle}>
            {t("noConsultationsSubtitle", "When recruiters book consultation calls with you, they will appear right here.")}
          </Text>
          <TouchableOpacity style={styles.emptyRefreshBtn} onPress={() => fetchConsultations(true)}>
            <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.emptyRefreshBtnText}>{t("refreshList", "Refresh List")}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchConsultations(true)} colors={[PRIMARY]} />}
        >
          {filteredList.map((item, index) => {
            const clientName =
              item.employer_name ||
              item.employer?.business_name ||
              item.employer?.contact_name ||
              item.user?.name ||
              item.client_name ||
              "Recruiter Consultation";

            const initials = clientName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const phone = item.employer_phone || item.employer?.contact_phone || item.user?.mobile_number || item.phone || item.mobile_number || "";
            const email = item.employer_email || item.employer?.contact_email || item.user?.email || item.email || "";
            const purpose = item.purpose || item.topic || "Kitchen Setup & Consultancy Call";
            const dateStr = item.meeting_date || item.date || "Upcoming Session";
            const slot = item.meeting_time || item.time_slot || item.time || "10:00 AM - 10:30 AM";
            const meetingUrl = item.meeting_link || item.calendly_link || item.zoom_link || item.url || "";

            return (
              <View key={item.id || index} style={styles.consultCard}>
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={styles.clientNameText} numberOfLines={1}>{clientName}</Text>
                    <Text style={styles.appointmentDateText}>Date: {dateStr}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Ionicons name="videocam" size={12} color="#15803d" style={{ marginRight: 4 }} />
                    <Text style={styles.statusBadgeText}>CONFIRMED</Text>
                  </View>
                </View>

                {/* Details Box */}
                <View style={styles.cardBody}>
                  <View style={styles.bodyDetailRow}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="time-outline" size={16} color={PRIMARY} />
                    </View>
                    <Text style={styles.bodyDetailText}>
                      <Text style={styles.detailBold}>{t("time", "Time Slot:")} </Text>
                      {slot}
                    </Text>
                  </View>

                  <View style={[styles.bodyDetailRow, { marginTop: 8 }]}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="restaurant-outline" size={16} color={PRIMARY} />
                    </View>
                    <Text style={styles.bodyDetailText} numberOfLines={2}>
                      <Text style={styles.detailBold}>{t("topic", "Topic:")} </Text>
                      {purpose}
                    </Text>
                  </View>

                  {email ? (
                    <View style={[styles.bodyDetailRow, { marginTop: 8 }]}>
                      <View style={styles.detailIconWrap}>
                        <Ionicons name="mail-outline" size={16} color={PRIMARY} />
                      </View>
                      <Text style={styles.bodyDetailText} numberOfLines={1}>
                        <Text style={styles.detailBold}>{t("email", "Email:")} </Text>
                        {email}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  {meetingUrl ? (
                    <TouchableOpacity
                      style={styles.joinMeetingBtn}
                      onPress={() => {
                        Linking.openURL(meetingUrl.startsWith("http") ? meetingUrl : `https://${meetingUrl}`).catch(() => {
                          CustomAlert.show(t("error"), "Unable to open meeting link.");
                        });
                      }}
                    >
                      <Ionicons name="videocam" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.joinMeetingBtnText}>{t("joinVideoCall", "Join Video Call")}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.contactRow}>
                    {phone ? (
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => {
                          Linking.openURL(`tel:${phone}`).catch(() => {
                            CustomAlert.show(t("error"), "Could not open dialer.");
                          });
                        }}
                      >
                        <Ionicons name="call" size={15} color={PRIMARY} style={{ marginRight: 6 }} />
                        <Text style={styles.contactBtnText}>{t("callRecruiter", "Call Recruiter")}</Text>
                      </TouchableOpacity>
                    ) : null}

                    {email ? (
                      <TouchableOpacity
                        style={[styles.contactBtn, { marginLeft: phone ? 10 : 0 }]}
                        onPress={() => {
                          Linking.openURL(`mailto:${email}`).catch(() => {
                            CustomAlert.show(t("error"), "Could not open mail app.");
                          });
                        }}
                      >
                        <Ionicons name="mail" size={15} color={PRIMARY} style={{ marginRight: 6 }} />
                        <Text style={styles.contactBtnText}>{t("email", "Email")}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: NEUTRAL,
  },
  headerCountBadge: {
    backgroundColor: "rgba(21, 62, 105, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: PRIMARY,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Summary Metrics Bar
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.1)",
  },
  metricCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: NEUTRAL,
    lineHeight: 18,
  },
  metricLabel: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.5)",
    fontWeight: "600",
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(10, 5, 4, 0.1)",
  },

  // Filter Tabs
  tabsContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.1)",
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#f2f2f3",
  },
  tabChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  tabTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },

  // Scroll Content
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },

  // Center States
  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  emptyIconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: NEUTRAL,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 20,
  },
  emptyRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  emptyRefreshBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Cards
  consultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    shadowColor: "#0a0504",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(21, 62, 105, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "900",
    color: PRIMARY,
  },
  clientDetails: {
    flex: 1,
    marginRight: 8,
  },
  clientNameText: {
    fontSize: 16,
    fontWeight: "800",
    color: NEUTRAL,
    marginBottom: 2,
  },
  appointmentDateText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.5)",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803d",
  },

  // Body
  cardBody: {
    backgroundColor: "#f2f2f3",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  bodyDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIconWrap: {
    width: 22,
    marginRight: 8,
    alignItems: "center",
    marginTop: 1,
  },
  bodyDetailText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.75)",
    flex: 1,
    lineHeight: 18,
  },
  detailBold: {
    fontWeight: "700",
    color: NEUTRAL,
  },

  // Actions
  actionsContainer: {
    gap: 10,
  },
  joinMeetingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    height: 44,
    borderRadius: 12,
  },
  joinMeetingBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  contactRow: {
    flexDirection: "row",
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 12,
    backgroundColor: SECONDARY,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
  },
  contactBtnText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: "700",
  },
});
