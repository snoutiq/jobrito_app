import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../constants/colors";
import { CustomAlert } from "../../components/common/CustomAlert";
import { getChefProjectRequests, updateChefProjectStatus } from "../../services/chefApi";

const PRIMARY_GREEN = "#153e69";

export default function ProjectRequestsScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [projectsList, setProjectsList] = useState([]);

  const fetchProjectRequests = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await getChefProjectRequests();
      const list = res?.projects || res?.data || (Array.isArray(res) ? res : []);
      setProjectsList(list);
    } catch (err) {
      console.warn("Failed to fetch project requests:", err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProjectRequests();
    }, [])
  );

  const handleAction = (id, actionType) => {
    const actionLabel = actionType === "Accepted" ? "Accept" : "Decline";
    CustomAlert.show(
      `${actionLabel} Request`,
      `Are you sure you want to ${actionLabel.toLowerCase()} this project request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionLabel,
          style: actionType === "Accepted" ? "default" : "destructive",
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await updateChefProjectStatus(id, actionType);
              setProjectsList((prev) =>
                prev.map((item) =>
                  String(item.id) === String(id) ? { ...item, status: actionType } : item
                )
              );
              CustomAlert.show("Success", `Project request has been ${actionType.toLowerCase()}ed.`);
            } catch (error) {
              CustomAlert.show("Error", error?.message || "Failed to update project request status.");
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const renderProjectItem = ({ item }) => {
    const status = String(item.status || "Pending").toLowerCase();
    let statusBg = "rgba(10, 5, 4, 0.15)";
    let statusText = "rgba(10, 5, 4, 0.6)";
    let displayStatus = "PENDING";
    
    if (status === "pending" || status === "new") {
      statusBg = "rgba(242, 200, 121, 0.18)";
      statusText = "#b8860b";
      displayStatus = "PENDING";
    } else if (status === "accepted" || status === "approved" || status === "confirmed") {
      statusBg = "rgba(34, 197, 94, 0.12)";
      statusText = "#15803d";
      displayStatus = "ACCEPTED";
    } else if (status === "declined" || status === "rejected" || status === "cancelled") {
      statusBg = "rgba(245, 127, 32, 0.12)";
      statusText = "#f57f20";
      displayStatus = "DECLINED";
    }

    const isItemLoading = actionLoadingId === item.id;

    return (
      <View style={styles.projectCard}>
        <View style={styles.cardHeader}>
          <View style={styles.clientDetails}>
            <Text style={styles.clientText}>{item.client_name || item.employer_name || "Recruiter / Client"}</Text>
            <Text style={styles.titleText}>{item.project_title || item.title || "Project Consultancy"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusText }]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        {item.description ? <Text style={styles.descText}>{item.description}</Text> : null}

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>BUDGET</Text>
            <Text style={styles.infoValue}>{item.budget || "Negotiable"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>TIMELINE</Text>
            <Text style={styles.infoValue}>{item.timeline || "Flexible"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>RECEIVED</Text>
            <Text style={styles.infoValue}>{item.created_at || "Recent"}</Text>
          </View>
        </View>

        {isItemLoading ? (
          <View style={styles.loadingActionRow}>
            <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            <Text style={styles.loadingActionText}>Updating request...</Text>
          </View>
        ) : (status === "pending" || status === "new") ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.declineBtn]}
              onPress={() => handleAction(item.id, "Declined")}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              onPress={() => handleAction(item.id, "Accepted")}
            >
              <Text style={styles.acceptBtnText}>Accept Request</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Requests</Text>
        <TouchableOpacity onPress={() => fetchProjectRequests(true)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#153e69" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Loading project requests...</Text>
        </View>
      ) : (
        <FlatList
          data={projectsList}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={renderProjectItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProjectRequests(true)} colors={[PRIMARY_GREEN]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="folder-open-outline" size={48} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.emptyTitle}>No Project Requests</Text>
              <Text style={styles.emptySubtitle}>
                When clients or restaurants send you project consultancy requests, they will appear here.
              </Text>
              <TouchableOpacity style={styles.emptyRefreshBtn} onPress={() => fetchProjectRequests(true)}>
                <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyRefreshBtnText}>Refresh List</Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0a0504",
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  projectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  clientDetails: {
    flex: 1,
    marginRight: 8,
  },
  clientText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#153e69",
    marginBottom: 2,
  },
  titleText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0a0504",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  descText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.65)",
    lineHeight: 18,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.4)",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0a0504",
  },
  loadingActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
  },
  loadingActionText: {
    fontSize: 13,
    color: "#153e69",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: {
    backgroundColor: "rgba(245, 127, 32, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 127, 32, 0.25)",
  },
  acceptBtn: {
    backgroundColor: "#153e69",
  },
  declineBtnText: {
    color: "#f57f20",
    fontSize: 13,
    fontWeight: "800",
  },
  acceptBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 20,
  },
  emptyRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  emptyRefreshBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
