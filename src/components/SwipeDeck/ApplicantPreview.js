import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function ApplicantPreview({ applicant }) {
  const { t } = useTranslation();

  const displayCuisine = applicant.cuisine_specialty || "";
  const displayAvailability = applicant.availability_status || "";
  const displayExperience = applicant.experience_range || "";

  const checklistItems = [];

  if (displayCuisine) {
    checklistItems.push({
      id: "cuisine",
      icon: "checkmark-circle-outline",
      iconColor: "#4CAF50",
      label: `${t("cuisine", "Cuisine")}: ${displayCuisine}`,
    });
  }

  if (displayAvailability) {
    checklistItems.push({
      id: "availability",
      icon: "checkmark-circle-outline",
      iconColor: "#4CAF50",
      label: `${t("availability", "Availability")}: ${displayAvailability}`,
    });
  }

  if (displayExperience) {
    checklistItems.push({
      id: "experience",
      icon: "checkmark-circle-outline",
      iconColor: "#4CAF50",
      label: `${t("experience", "Experience")}: ${displayExperience}`,
    });
  }

  if (checklistItems.length === 0) return null;

  return (
    <View style={styles.container}>
      {checklistItems.map((item) => (
        <View key={item.id} style={styles.row}>
          <Ionicons name={item.icon} size={18} color={item.iconColor} />
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },
  label: {
    fontSize: 13.5,
    color: "rgba(10, 5, 4, 0.75)",
    fontWeight: "600",
    flex: 1,
  },
});
