import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import StatusBadge from "../common/StatusBadge";

export default function ApplicantCard({
  applicant,
  onPress,
}) {
  const { t } = useTranslation();
  const displayName = applicant.name || t("nameNotSpecified", "Name not specified");
  const displayCity = applicant.city || "";
  const displayPhone = applicant.mobile_number || applicant.phone || "";
  const displayExperience = applicant.experience_range || "";
  const displayCuisine = applicant.cuisine_specialty || "";
  const displaySkills = Array.isArray(applicant.skills) ? applicant.skills : [];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, !applicant.name && styles.nameNotSpecified]} numberOfLines={1}>
            {displayName}
          </Text>
          {displayCity ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.infoText} numberOfLines={1}>
                {displayCity}
              </Text>
            </View>
          ) : null}
        </View>
        <StatusBadge status={applicant.status} />
      </View>

      {/* Details section containing other available API fields */}
      <View style={styles.detailsContainer}>
        {displayPhone ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color="#475569" />
            <Text style={styles.phoneText}>{displayPhone}</Text>
          </View>
        ) : null}

        {displayExperience ? (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={14} color="#475569" />
            <Text style={styles.infoText}>{t("experience", "Experience")}: {displayExperience}</Text>
          </View>
        ) : null}

        {displayCuisine ? (
          <View style={styles.infoRow}>
            <Ionicons name="restaurant-outline" size={14} color="#475569" />
            <Text style={styles.infoText}>{t("cuisine", "Cuisine")}: {displayCuisine}</Text>
          </View>
        ) : null}

        {displaySkills.length > 0 ? (
          <View style={styles.skillsContainer}>
            {displaySkills.map((skill, idx) => (
              <View key={idx} style={styles.skillPill}>
                <Text style={styles.skillPillText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.appliedDate}>
          {t("applied", "Applied")}: {applicant.applied_date || "--"}
        </Text>
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{t("viewProfile", "View profile")}</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  nameNotSpecified: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 1,
  },
  infoText: {
    color: "#64748B",
    fontSize: 13,
  },
  phoneText: {
    color: "#1E293B",
    fontWeight: "700",
    fontSize: 13,
  },
  detailsContainer: {
    gap: 6,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  skillPill: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillPillText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  body: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appliedDate: {
    color: "#94A3B8",
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    marginTop: 2,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  hintText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
});
