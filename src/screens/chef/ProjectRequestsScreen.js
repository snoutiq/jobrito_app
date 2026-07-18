import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#153e69";

export default function ProjectRequestsScreen({ navigation }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // Mock data for project requests from clients
  const [projectsList, setProjectsList] = useState([
    {
      id: "1",
      client_name: "Taj Mahal Palace (F&B Division)",
      project_title: "Consultant Menu Design (Coastal Cuisines)",
      description: "Require an expert chef to overhaul our coastal/seafood menu and train staff for a 3-week consulting project.",
      budget: "₹2,50,000",
      timeline: "3 Weeks",
      status: "Pending",
      created_at: "Today",
    },
    {
      id: "2",
      client_name: "Catering Solutions Ltd",
      project_title: "Executive Chef for High-Profile Corporate Catering",
      description: "Need an operational expert chef to manage a massive corporate dinner event with over 500 VIP guests.",
      budget: "₹85,000",
      timeline: "2 Days",
      status: "Pending",
      created_at: "Yesterday",
    },
    {
      id: "3",
      client_name: "Nirmal Group (Cloud Kitchen)",
      project_title: "Kitchen Layout & Setup Consultancy",
      description: "Looking for consultation on kitchen workflow layout, machinery selection, and recipe standardization.",
      budget: "₹1,20,000",
      timeline: "10 Days",
      status: "Accepted",
      created_at: "15 Jul 2026",
    },
  ]);

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
          onPress: () => {
            setProjectsList((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, status: actionType } : item
              )
            );
            CustomAlert.show("Success", `Project request has been ${actionType.toLowerCase()}ed.`);
          },
        },
      ]
    );
  };

  const renderProjectItem = ({ item }) => {
    let statusBg = "rgba(10, 5, 4, 0.15)";
    let statusText = "rgba(10, 5, 4, 0.6)";
    
    if (item.status === "Pending") {
      statusBg = "rgba(242, 200, 121, 0.12)";
      statusText = "#f2c879";
    } else if (item.status === "Accepted") {
      statusBg = "rgba(21, 62, 105, 0.08)";
      statusText = "#153e69";
    } else if (item.status === "Declined") {
      statusBg = "rgba(245, 127, 32, 0.08)";
      statusText = "#f57f20";
    }

    return (
      <View style={styles.projectCard}>
        <View style={styles.cardHeader}>
          <View style={styles.clientDetails}>
            <Text style={styles.clientText}>{item.client_name}</Text>
            <Text style={styles.titleText}>{item.project_title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusText }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.descText}>{item.description}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>BUDGET</Text>
            <Text style={styles.infoValue}>{item.budget}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>TIMELINE</Text>
            <Text style={styles.infoValue}>{item.timeline}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>RECEIVED</Text>
            <Text style={styles.infoValue}>{item.created_at}</Text>
          </View>
        </View>

        {item.status === "Pending" && (
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
        )}
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
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        </View>
      ) : projectsList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="folder-open-outline" size={64} color="rgba(10, 5, 4, 0.15)" />
          <Text style={styles.emptyText}>No project requests yet</Text>
        </View>
      ) : (
        <FlatList
          data={projectsList}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
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
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.4)",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0a0504",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  declineBtn: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  acceptBtn: {
    backgroundColor: "#153e69",
    borderColor: "#153e69",
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});
