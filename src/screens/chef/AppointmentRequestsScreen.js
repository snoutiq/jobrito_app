import React, { useState, useEffect, useCallback } from "react";
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
import colors from "../../constants/colors";
import { getChefAppointments, updateChefAppointmentStatus } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY = "#153e69";
const SECONDARY = "#f2f2f3";
const WARM_GOLD = "#f2c879";
const EMBER_ORANGE = "#f57f20";
const NEUTRAL = "#0a0504";

export default function AppointmentRequestsScreen({ navigation }) {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "pending", "confirmed", "declined"
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAppointments = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await getChefAppointments();
      const list = res?.appointments || res?.data || (Array.isArray(res) ? res : []);
      setAppointments(list);
    } catch (err) {
      console.warn("Failed to fetch appointments:", err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      await updateChefAppointmentStatus(id, newStatus);
      setAppointments((prev) =>
        prev.map((item) =>
          String(item.id) === String(id) ? { ...item, status: newStatus } : item
        )
      );
      CustomAlert.show(
        t("success", "Success"),
        newStatus === "confirmed"
          ? t("appointmentConfirmedMsg", "Appointment request accepted!")
          : t("appointmentDeclinedMsg", "Appointment request declined.")
      );
    } catch (error) {
      CustomAlert.show(t("error", "Error"), error?.message || "Failed to update appointment status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter Logic
  const filteredAppointments = appointments.filter((item) => {
    const status = String(item.status || "pending").toLowerCase();
    if (activeTab === "all") return true;
    if (activeTab === "pending") return status === "pending" || status === "new";
    if (activeTab === "confirmed") return status === "confirmed" || status === "scheduled" || status === "approved";
    if (activeTab === "declined") return status === "declined" || status === "cancelled" || status === "rejected";
    return true;
  });

  // Counters
  const pendingCount = appointments.filter((item) => {
    const s = String(item.status || "pending").toLowerCase();
    return s === "pending" || s === "new";
  }).length;

  const confirmedCount = appointments.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    return s === "confirmed" || s === "scheduled" || s === "approved";
  }).length;

  const declinedCount = appointments.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    return s === "declined" || s === "cancelled" || s === "rejected";
  }).length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={NEUTRAL} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{t("appointmentRequestsTitle", "Appointment Requests")}</Text>
          {appointments.length > 0 && (
            <View style={styles.headerCountBadge}>
              <Text style={styles.headerCountText}>{appointments.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => fetchAppointments(true)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Summary Metric Cards Header */}
      <View style={styles.summaryBar}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: "rgba(21, 62, 105, 0.08)" }]}>
            <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
          </View>
          <View>
            <Text style={styles.metricNumber}>{appointments.length}</Text>
            <Text style={styles.metricLabel}>{t("total", "Total")}</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: "rgba(242, 200, 121, 0.18)" }]}>
            <Ionicons name="hourglass-outline" size={16} color="#b8860b" />
          </View>
          <View>
            <Text style={styles.metricNumber}>{pendingCount}</Text>
            <Text style={styles.metricLabel}>{t("pending", "Pending")}</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: "rgba(34, 197, 94, 0.12)" }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#15803d" />
          </View>
          <View>
            <Text style={styles.metricNumber}>{confirmedCount}</Text>
            <Text style={styles.metricLabel}>{t("confirmed", "Confirmed")}</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs Bar */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === "all" && styles.tabChipActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
              {t("all", "All")} ({appointments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === "pending" && styles.tabChipActive]}
            onPress={() => setActiveTab("pending")}
          >
            <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
              {t("pending", "Pending")} ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === "confirmed" && styles.tabChipActive]}
            onPress={() => setActiveTab("confirmed")}
          >
            <Text style={[styles.tabText, activeTab === "confirmed" && styles.tabTextActive]}>
              {t("confirmed", "Confirmed")} ({confirmedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === "declined" && styles.tabChipActive]}
            onPress={() => setActiveTab("declined")}
          >
            <Text style={[styles.tabText, activeTab === "declined" && styles.tabTextActive]}>
              {t("declined", "Declined")} ({declinedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main List Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>{t("loadingAppointments", "Loading appointment requests...")}</Text>
        </View>
      ) : filteredAppointments.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} colors={[PRIMARY]} />}
        >
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar-outline" size={48} color={PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>{t("noRequestsTitle", "No Requests Found")}</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "all"
              ? t("noRequestsSubtitle", "Recruiters and employers will schedule consultation calls with you here.")
              : t("noFilteredRequestsSubtitle", "There are no appointment requests in this category.")}
          </Text>
          <TouchableOpacity style={styles.emptyRefreshBtn} onPress={() => fetchAppointments(true)}>
            <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.emptyRefreshBtnText}>{t("refreshList", "Refresh List")}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} colors={[PRIMARY]} />}
        >
          {filteredAppointments.map((item, index) => {
            const clientName =
              item.employer_name ||
              item.employer?.business_name ||
              item.employer?.contact_name ||
              item.user?.name ||
              item.client_name ||
              "Recruiter / Employer";
            
            const initials = clientName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const phone = item.employer_phone || item.employer?.contact_phone || item.user?.mobile_number || item.phone || item.mobile_number || "";
            const email = item.employer_email || item.employer?.contact_email || item.user?.email || item.email || "";
            const purpose = item.purpose || "";
            const status = String(item.status || "pending").toLowerCase();
            const isItemLoading = actionLoadingId === item.id;

            // Format Date
            let dateStr = "";
            if (item.meeting_date) {
              dateStr = item.meeting_date;
            } else if (item.created_at) {
              try {
                dateStr = isNaN(Date.parse(item.created_at)) ? item.created_at : new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              } catch (e) {
                dateStr = item.created_at;
              }
            } else {
              dateStr = "Recent";
            }

            const slot = item.meeting_time || item.preferred_call_time || item.time_slot || item.time || "Not specified";

            // Status Styling
            let badgeBg = "rgba(242, 200, 121, 0.18)";
            let badgeText = "#b8860b";
            let badgeIcon = "hourglass-outline";
            let statusLabel = "PENDING";

            if (status === "confirmed" || status === "scheduled" || status === "approved") {
              badgeBg = "rgba(34, 197, 94, 0.12)";
              badgeText = "#15803d";
              badgeIcon = "checkmark-circle-outline";
              statusLabel = "CONFIRMED";
            } else if (status === "declined" || status === "cancelled" || status === "rejected") {
              badgeBg = "rgba(245, 127, 32, 0.12)";
              badgeText = EMBER_ORANGE;
              badgeIcon = "close-circle-outline";
              statusLabel = "DECLINED";
            }

            return (
              <View key={item.id || index} style={styles.appointmentCard}>
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <Text style={styles.clientNameText} numberOfLines={1}>{clientName}</Text>
                    <Text style={styles.appointmentDateText}>Requested: {dateStr}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Ionicons name={badgeIcon} size={12} color={badgeText} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: badgeText }]}>{statusLabel}</Text>
                  </View>
                </View>

                {/* Info Details Box */}
                <View style={styles.cardBody}>
                  <View style={styles.bodyDetailRow}>
                    <View style={styles.detailIconWrap}>
                      <Ionicons name="time-outline" size={15} color={PRIMARY} />
                    </View>
                    <Text style={styles.bodyDetailText}>
                      <Text style={styles.detailBold}>{t("preferredTime", "Preferred Time:")} </Text>
                      {slot}
                    </Text>
                  </View>

                  {purpose ? (
                    <View style={[styles.bodyDetailRow, { marginTop: 8 }]}>
                      <View style={styles.detailIconWrap}>
                        <Ionicons name="restaurant-outline" size={15} color={PRIMARY} />
                      </View>
                      <Text style={styles.bodyDetailText} numberOfLines={2}>
                        <Text style={styles.detailBold}>{t("purpose", "Purpose:")} </Text>
                        {purpose}
                      </Text>
                    </View>
                  ) : null}

                  {email ? (
                    <View style={[styles.bodyDetailRow, { marginTop: 8 }]}>
                      <View style={styles.detailIconWrap}>
                        <Ionicons name="mail-outline" size={15} color={PRIMARY} />
                      </View>
                      <Text style={styles.bodyDetailText} numberOfLines={1}>
                        <Text style={styles.detailBold}>{t("email", "Email:")} </Text>
                        {email}
                      </Text>
                    </View>
                  ) : null}

                  {phone ? (
                    <View style={[styles.bodyDetailRow, { marginTop: 8 }]}>
                      <View style={styles.detailIconWrap}>
                        <Ionicons name="call-outline" size={15} color={PRIMARY} />
                      </View>
                      <Text style={styles.bodyDetailText}>
                        <Text style={styles.detailBold}>{t("phone", "Phone:")} </Text>
                        {phone}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Actions Row */}
                {isItemLoading ? (
                  <View style={styles.actionLoadingRow}>
                    <ActivityIndicator size="small" color={PRIMARY} />
                    <Text style={styles.actionLoadingText}>{t("updating", "Updating status...")}</Text>
                  </View>
                ) : (
                  <View style={styles.actionsContainer}>
                    {/* Accept & Decline Buttons if Pending */}
                    {(status === "pending" || status === "new") && (
                      <View style={styles.decisionRow}>
                        <TouchableOpacity
                          style={[styles.decisionBtn, styles.acceptBtn]}
                          onPress={() => handleUpdateStatus(item.id, "confirmed")}
                        >
                          <Ionicons name="checkmark-sharp" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.decisionBtnText}>{t("accept", "Accept Request")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.decisionBtn, styles.declineBtn]}
                          onPress={() => handleUpdateStatus(item.id, "declined")}
                        >
                          <Ionicons name="close-sharp" size={16} color={EMBER_ORANGE} style={{ marginRight: 6 }} />
                          <Text style={[styles.decisionBtnText, { color: EMBER_ORANGE }]}>{t("decline", "Decline")}</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Contact Communication Buttons */}
                    <View style={styles.contactRow}>
                      {phone ? (
                        <TouchableOpacity
                          style={[styles.contactBtn, styles.callBtn]}
                          onPress={() => {
                            Linking.openURL(`tel:${phone}`).catch(() => {
                              CustomAlert.show(t("error"), "Could not open phone dialer.");
                            });
                          }}
                        >
                          <Ionicons name="call" size={15} color={PRIMARY} style={{ marginRight: 6 }} />
                          <Text style={styles.callBtnText}>{t("callRecruiter", "Call Recruiter")}</Text>
                        </TouchableOpacity>
                      ) : null}

                      {email ? (
                        <TouchableOpacity
                          style={[styles.contactBtn, styles.emailBtn, { marginLeft: phone ? 10 : 0 }]}
                          onPress={() => {
                            Linking.openURL(`mailto:${email}`).catch(() => {
                              CustomAlert.show(t("error"), "Could not open mail app.");
                            });
                          }}
                        >
                          <Ionicons name="mail" size={15} color={PRIMARY} style={{ marginRight: 6 }} />
                          <Text style={styles.emailBtnText}>{t("emailRecruiter", "Email")}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                )}
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
  appointmentCard: {
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
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
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
  actionLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
  },
  actionLoadingText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: 10,
  },
  decisionRow: {
    flexDirection: "row",
    gap: 10,
  },
  decisionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
  },
  acceptBtn: {
    backgroundColor: PRIMARY,
  },
  declineBtn: {
    backgroundColor: "rgba(245, 127, 32, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 127, 32, 0.25)",
  },
  decisionBtnText: {
    fontSize: 13,
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
  callBtn: {},
  emailBtn: {},
  callBtnText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: "700",
  },
  emailBtnText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: "700",
  },
});
