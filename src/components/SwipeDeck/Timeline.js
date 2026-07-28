import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Timeline({ currentEmployer, experienceRange, experienceList = [] }) {
  const hasRealItems = Array.isArray(experienceList) && experienceList.length > 0;

  if (!hasRealItems) {
    return (
      <View style={styles.emptyTimelineContainer}>
        <Ionicons name="briefcase-outline" size={20} color="rgba(10, 5, 4, 0.35)" />
        <Text style={styles.emptyTimelineText}>No experience history added.</Text>
      </View>
    );
  }

  // Generate timeline items based on API data
  const timelineItems = experienceList.map((item, index) => ({
    id: index + 1,
    role: item.designation || "Hospitality Specialist",
    company: item.company || "Hospitality Partner",
    period: `${item.from || ""} - ${item.to || "Present"}`,
    description: item.description || "",
    isCurrent: item.currently_working ?? (index === 0),
  }));

  return (
    <View style={styles.container}>
      {timelineItems.map((item, index) => {
        const isLast = index === timelineItems.length - 1;
        return (
          <View key={item.id} style={styles.timelineRow}>
            {/* Left line and dot indicator */}
            <View style={styles.indicatorContainer}>
              <View
                style={[
                  styles.dot,
                  item.isCurrent
                    ? styles.currentDot
                    : styles.pastDot,
                ]}
              >
                {item.isCurrent && (
                  <View style={styles.innerDot} />
                )}
              </View>
              {!isLast && <View style={styles.verticalLine} />}
            </View>

            {/* Right LinkedIn-style flat content block */}
            <View style={styles.contentBlock}>
              <Text style={styles.roleTitle}>{item.role}</Text>
              <Text style={styles.companyName}>
                {item.company} • <Text style={styles.period}>{item.period}</Text>
              </Text>
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 16,
  },
  indicatorContainer: {
    alignItems: "center",
    width: 14,
    position: "relative",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    marginTop: 4,
  },
  currentDot: {
    backgroundColor: "#153e69",
    borderWidth: 2,
    borderColor: "rgba(21, 62, 105, 0.2)",
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffffff",
  },
  pastDot: {
    backgroundColor: "rgba(10, 5, 4, 0.2)",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  verticalLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: "rgba(10, 5, 4, 0.1)",
    position: "absolute",
    top: 16,
    bottom: -16,
    zIndex: 1,
  },
  contentBlock: {
    flex: 1,
    paddingBottom: 20,
  },
  roleTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 3,
  },
  companyName: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#153e69",
    marginBottom: 6,
  },
  period: {
    color: "rgba(10, 5, 4, 0.45)",
    fontWeight: "500",
  },
  description: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.55)",
    lineHeight: 16,
  },
  emptyTimelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  emptyTimelineText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.4)",
    fontWeight: "600",
  },
});
