import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "../../constants/colors";
import AppButton from "../buttons/AppButton";
import StatusBadge from "../common/StatusBadge";

export default function ApplicantCard({
  applicant,
  onCall,
  onStatusChange,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{applicant.name}</Text>
          <Text style={styles.subtitle}>{applicant.role}</Text>
          <Text style={styles.meta}>{applicant.city}</Text>
        </View>
        <StatusBadge status={applicant.status} />
      </View>

      <Text style={styles.phone}>{applicant.phone}</Text>

      <View style={styles.actions}>
        <AppButton title="Call" variant="outline" style={styles.actionButton} onPress={onCall} />
        <AppButton title="Contacted" style={styles.actionButton} onPress={() => onStatusChange("Contacted")} />
      </View>
      <View style={styles.actions}>
        <AppButton title="Shortlist" variant="outline" style={styles.actionButton} onPress={() => onStatusChange("Shortlisted")} />
        <AppButton title="Hire" variant="outline" style={styles.actionButton} onPress={() => onStatusChange("Hired")} />
        <AppButton title="Reject" variant="outline" style={styles.actionButton} onPress={() => onStatusChange("Rejected")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  meta: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  phone: {
    color: colors.text,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: 88,
  },
});
