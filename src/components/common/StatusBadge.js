import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";

const palette = {
  New: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  Contacted: { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  Shortlisted: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  Hired: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  Rejected: { bg: "rgba(245, 127, 32, 0.12)", fg: "#f57f20" },
  Pending: { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  Approved: { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  "Pending Approval": { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  "UNDER REVIEW": { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  "SHORTLISTED": { bg: "rgba(21, 62, 105, 0.08)", fg: "#153e69" },
  "CONTACTED": { bg: "rgba(242, 200, 121, 0.12)", fg: "#f2c879" },
  "DECISION PENDING": { bg: "rgba(10, 5, 4, 0.08)", fg: "#0a0504" },
  "JOB CLOSED": { bg: "rgba(245, 127, 32, 0.12)", fg: "#f57f20" },
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const norm = String(status || "").toLowerCase().trim();
  const matchKey = Object.keys(palette).find((k) => k.toLowerCase() === norm);
  const style = (matchKey && palette[matchKey]) || { bg: "rgba(10, 5, 4, 0.15)", fg: colors.text };
  
  // Dynamic translations mapping
  const getTranslatedStatus = (s) => {
    switch (s?.toLowerCase()) {
      case "new":
        return t("status.new", "New");
      case "contacted":
        return t("status.contacted", "Contacted");
      case "shortlisted":
        return t("status.shortlisted", "Shortlisted");
      case "hired":
        return t("status.hired", "Hired");
      case "rejected":
      case "reject":
      case "declined":
        return t("status.notAMatch", "Not A Match");
      case "pending":
        return t("status.pending", "Pending");
      case "approved":
        return t("status.approved", "Approved");
      case "pending approval":
        return t("status.pendingApproval", "Pending Approval");
      case "under review":
      case "under_review":
        return t("status.underProcess", "UNDER PROCESS");
      case "decision pending":
        return t("status.decisionPending", "DECISION PENDING");
      case "discussion pending":
        return t("status.discussionPending", "DISCUSSION PENDING");
      case "job closed":
        return t("status.jobClosed", "JOB CLOSED");
      default:
        return t(`status.${s?.toLowerCase()}`, s);
    }
  };

  const displayStatus = getTranslatedStatus(matchKey || status || "");

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>{displayStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
