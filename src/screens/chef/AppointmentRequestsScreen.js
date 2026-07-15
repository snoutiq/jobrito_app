import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../constants/colors";
import { getChefAppointments } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#153e69";

export default function AppointmentRequestsScreen({ navigation }) {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await getChefAppointments();
      const list = res?.appointments || res?.data || (Array.isArray(res) ? res : []);
      setAppointments(list);
    } catch (err) {
      console.warn("Failed to fetch appointments:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchAppointments();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Requests</Text>
        <TouchableOpacity onPress={fetchAppointments} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#0a0504" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar-outline" size={64} color="rgba(10, 5, 4, 0.15)" />
          </View>
          <Text style={styles.emptyTitle}>No Requests Yet</Text>
          <Text style={styles.emptySubtitle}>
            Recruiters will schedule calls with you here when they view your profile.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {appointments.map((item, index) => {
            const clientName = item.employer_name || item.employer?.business_name || item.employer?.contact_name || item.user?.name || item.client_name || "Recruiter Request";
            const phone = item.employer_phone || item.employer?.contact_phone || item.user?.mobile_number || item.phone || item.mobile_number || "";
            const email = item.employer_email || item.employer?.contact_email || item.user?.email || item.email || "";
            const purpose = item.purpose || "";
            const status = item.status || "Pending";
            
            // Format Date
            let dateStr = "";
            if (item.meeting_date) {
              dateStr = item.meeting_date;
            } else if (item.created_at) {
              try {
                if (isNaN(Date.parse(item.created_at))) {
                  dateStr = item.created_at;
                } else {
                  dateStr = new Date(item.created_at).toLocaleDateString();
                }
              } catch (e) {
                dateStr = item.created_at;
              }
            } else {
              dateStr = "Recent";
            }

            const slot = item.meeting_time || item.preferred_call_time || item.time_slot || item.time || "Not specified";
            
            // Determine status badge color
            let statusColor = "rgba(10, 5, 4, 0.15)";
            let statusTextColor = "rgba(10, 5, 4, 0.6)";
            if (status.toLowerCase() === "pending") {
              statusColor = "rgba(242, 200, 121, 0.12)";
              statusTextColor = "#f2c879";
            } else if (status.toLowerCase() === "scheduled" || status.toLowerCase() === "confirmed") {
              statusColor = "rgba(21, 62, 105, 0.08)";
              statusTextColor = "#153e69";
            } else if (status.toLowerCase() === "completed") {
              statusColor = "rgba(21, 62, 105, 0.08)";
              statusTextColor = "#153e69";
            }

            return (
              <View key={item.id || index} style={styles.appointmentCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.clientDetails}>
                    <Text style={styles.clientNameText}>{clientName}</Text>
                    <Text style={styles.appointmentDateText}>Requested: {dateStr}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusTextColor }]}>
                      {status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.bodyDetailRow}>
                    <Ionicons name="time-outline" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginRight: 8 }} />
                    <Text style={styles.bodyDetailText}>Preferred Call Time: {slot}</Text>
                  </View>
                  {purpose ? (
                    <View style={[styles.bodyDetailRow, { marginTop: 6 }]}>
                      <Ionicons name="restaurant-outline" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginRight: 8 }} />
                      <Text style={styles.bodyDetailText} numberOfLines={2}>Purpose: {purpose}</Text>
                    </View>
                  ) : null}
                  {email ? (
                    <View style={[styles.bodyDetailRow, { marginTop: 6 }]}>
                      <Ionicons name="mail-outline" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginRight: 8 }} />
                      <Text style={styles.bodyDetailText}>Email: {email}</Text>
                    </View>
                  ) : null}
                  {phone ? (
                    <View style={[styles.bodyDetailRow, { marginTop: 6 }]}>
                      <Ionicons name="call-outline" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginRight: 8 }} />
                      <Text style={styles.bodyDetailText}>Phone: {phone}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.actionButtonsRow}>
                  {phone ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: PRIMARY_GREEN }]}
                      onPress={() => {
                        Linking.openURL(`tel:${phone}`).catch(() => {
                          CustomAlert.show("Error", "Could not open dialer.");
                        });
                      }}
                    >
                      <Ionicons name="call" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.actionBtnText}>Call Recruiter</Text>
                    </TouchableOpacity>
                  ) : null}
                  
                  {email ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#153e69", marginLeft: phone ? 10 : 0 }]}
                      onPress={() => {
                        Linking.openURL(`mailto:${email}`).catch(() => {
                          CustomAlert.show("Error", "Could not open mail client.");
                        });
                      }}
                    >
                      <Ionicons name="mail" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.actionBtnText}>Email Recruiter</Text>
                    </TouchableOpacity>
                  ) : null}
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
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
  appointmentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    shadowColor: "#0a0504",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  clientDetails: {
    flex: 1,
    marginRight: 8,
  },
  clientNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  appointmentDateText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.4)",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  cardBody: {
    backgroundColor: "#f2f2f3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bodyDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyDetailText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
  },
  callActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 10,
  },
  callActionButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  actionButtonsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 11,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
