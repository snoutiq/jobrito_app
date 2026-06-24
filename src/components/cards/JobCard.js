import React from "react";
import { Pressable, StyleSheet, Text, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { applyJob } from "../../redux/slices/jobSlice";

export default function JobCard({ job, onPress }) {
  const isReferral =
    job?.type === "Referral Opportunities" ||
    job?.category === "Referral Opportunities";
  const dispatch = useDispatch();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, isReferral && styles.referralCard]}
    >
      <Text style={styles.company}>{job?.employer || "Grand Hyatt Dubai"}</Text>

      <Text style={styles.title}>{job?.title}</Text>

      <Text style={styles.info}>Location: {job?.location || "Dubai, UAE"}</Text>

      {job?.salary ? <Text style={styles.info}>Salary: {job.salary}</Text> : null}

      {job?.experience ? (
        <Text style={styles.info}>Contract: {job.experience}</Text>
      ) : null}

      {job?.description ? (
        <Text style={styles.description}>{job.description}</Text>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          style={styles.applyBtn}
          onPress={async () => {
            try {
              await dispatch(applyJob(job.id)).unwrap();
              Alert.alert("Applied", "Your application was submitted.");
            } catch (err) {
              Alert.alert("Error", err?.message || "Failed to apply");
            }
          }}
        >
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>

        <Pressable style={styles.iconBtn}>
          <Ionicons name="star-outline" size={16} color="#555" />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <Pressable style={styles.linkBox}>
        <Ionicons name="link-outline" size={15} color="#444" />
        <Text style={styles.linkText}>Link copied</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  referralCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  company: {
    color: "#0A7B32",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  info: {
    fontSize: 15,
    color: "#333",
    marginBottom: 2,
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    color: "#444",
    fontStyle: "italic",
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "center",
  },
  appliedBtn: {
    backgroundColor: "#EFC29F",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  appliedText: {
    color: "#0A7B32",
    fontWeight: "700",
  },
  applyBtn: {
    backgroundColor: "#0A7B32",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyText: {
    color: "#fff",
    fontWeight: "700",
  },
  iconBtn: {
    width: 34,
    height: 34,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  linkBox: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingVertical: 10,
  },
  linkText: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#333",
  },
});
