import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../constants/colors";

const PRIMARY_GREEN = "#22C55E";

export default function MyJobsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'pending' | 'closed'

  // Mock Jobs Data
  const [activeJobs, setActiveJobs] = useState([
    {
      id: "job1",
      title: "Senior Head Chef",
      location: "Mumbai, India",
      date: "12 June 2026",
      openings: 5,
      type: "Full-time",
      applicationsCount: 24,
      stats: { pending: 3, shortlist: 8, contact: 6, rejected: 7 },
    },
    {
      id: "job2",
      title: "Restaurant Manager",
      location: "Mumbai, India",
      date: "12 June 2026",
      openings: 1,
      type: "Full-time",
      applicationsCount: 4,
      stats: { pending: 3, shortlist: 1, contact: 0, rejected: 0 },
    },
    {
      id: "job3",
      title: "Senior Barista",
      location: "Delhi, India",
      date: "15 June 2026",
      openings: 2,
      type: "Full-time",
      applicationsCount: 12,
      stats: { pending: 2, shortlist: 5, contact: 3, rejected: 2 },
    },
    {
      id: "job4",
      title: "Sous Chef",
      location: "Mumbai, India",
      date: "18 June 2026",
      openings: 1,
      type: "Full-time",
      applicationsCount: 6,
      stats: { pending: 1, shortlist: 3, contact: 1, rejected: 1 },
    },
  ]);

  const [pendingJobs, setPendingJobs] = useState([
    {
      id: "job5",
      title: "Line Cook",
      location: "Pune, India",
      date: "24 June 2026",
      openings: 3,
      type: "Full-time",
      applicationsCount: 0,
      stats: { pending: 0, shortlist: 0, contact: 0, rejected: 0 },
    },
  ]);

  const [closedJobs, setClosedJobs] = useState([]);

  const closeJob = (jobId) => {
    Alert.alert(
      "Close Job",
      "Are you sure you want to close this job posting?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Job",
          style: "destructive",
          onPress: () => {
            const jobToClose = activeJobs.find((j) => j.id === jobId);
            if (jobToClose) {
              setActiveJobs(activeJobs.filter((j) => j.id !== jobId));
              setClosedJobs([...closedJobs, jobToClose]);
              Alert.alert("Success", "Job has been closed.");
            }
          },
        },
      ]
    );
  };

  const deletePendingJob = (jobId) => {
    Alert.alert("Delete Draft", "Are you sure you want to delete this job posting?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setPendingJobs(pendingJobs.filter((j) => j.id !== jobId));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Jobs</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "active" && styles.tabButtonActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Active ({activeJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "pending" && styles.tabButtonActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            Pending ({pendingJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "closed" && styles.tabButtonActive]}
          onPress={() => setActiveTab("closed")}
        >
          <Text style={[styles.tabText, activeTab === "closed" && styles.tabTextActive]}>
            Closed ({closedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "active" && (
          <>
            {activeJobs.length === 0 ? (
              <EmptyState message="No active job postings." />
            ) : (
              activeJobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  {/* Job Header */}
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleWrapper}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="restaurant-outline" size={22} color={PRIMARY_GREEN} />
                      </View>
                      <View>
                        <Text style={styles.jobTitleText}>{job.title}</Text>
                        <Text style={styles.jobMetaText}>
                          <Ionicons name="location-outline" size={13} color="#64748B" /> {job.location} • {job.date}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>ACTIVE</Text>
                    </View>
                  </View>

                  {/* Openings & Type Row */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsText}>
                      <Ionicons name="people-outline" size={14} color="#64748B" /> {job.openings} Openings
                    </Text>
                    <Text style={styles.detailsText}>
                      <Ionicons name="briefcase-outline" size={14} color="#64748B" /> {job.type}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Hiring Progress */}
                  <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>
                      HIRING PROGRESS ({job.applicationsCount} TALENT APPLICATIONS RECEIVED)
                    </Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: "#3B82F6" }]}>{job.stats.pending}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: PRIMARY_GREEN }]}>{job.stats.shortlist}</Text>
                        <Text style={styles.statLabel}>Shortlist</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: "#F59E0B" }]}>{job.stats.contact}</Text>
                        <Text style={styles.statLabel}>Contact</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: "#EF4444" }]}>{job.stats.rejected}</Text>
                        <Text style={styles.statLabel}>Rejected</Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.viewTalentBtn}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate("ApplicantList", { jobId: job.id, jobTitle: job.title })
                      }
                    >
                      <Text style={styles.viewTalentBtnText}>View Talent</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.closeJobBtn}
                      activeOpacity={0.8}
                      onPress={() => closeJob(job.id)}
                    >
                      <Text style={styles.closeJobBtnText}>Close Job</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "pending" && (
          <>
            {pendingJobs.length === 0 ? (
              <EmptyState message="No pending job postings." />
            ) : (
              pendingJobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleWrapper}>
                      <View style={[styles.iconContainer, { backgroundColor: "#FEF3C7" }]}>
                        <Ionicons name="hourglass-outline" size={22} color="#D97706" />
                      </View>
                      <View>
                        <Text style={styles.jobTitleText}>{job.title}</Text>
                        <Text style={styles.jobMetaText}>
                          <Ionicons name="location-outline" size={13} color="#64748B" /> {job.location} • {job.date}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
                      <Text style={[styles.statusBadgeText, { color: "#D97706" }]}>PENDING</Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsText}>
                      <Ionicons name="people-outline" size={14} color="#64748B" /> {job.openings} Openings
                    </Text>
                    <Text style={styles.detailsText}>
                      <Ionicons name="briefcase-outline" size={14} color="#64748B" /> {job.type}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.pendingInfoCard}>
                    <Ionicons name="information-circle-outline" size={18} color="#D97706" style={{ marginRight: 8 }} />
                    <Text style={styles.pendingInfoText}>
                      This job posting is currently being reviewed by admin and will be published in feed shortly.
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.closeJobBtn, { flex: 1 }]}
                      activeOpacity={0.8}
                      onPress={() => deletePendingJob(job.id)}
                    >
                      <Text style={styles.closeJobBtnText}>Delete Posting</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "closed" && (
          <>
            {closedJobs.length === 0 ? (
              <EmptyState message="No closed job postings." />
            ) : (
              closedJobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleWrapper}>
                      <View style={[styles.iconContainer, { backgroundColor: "#F1F5F9" }]}>
                        <Ionicons name="archive-outline" size={22} color="#64748B" />
                      </View>
                      <View>
                        <Text style={styles.jobTitleText}>{job.title}</Text>
                        <Text style={styles.jobMetaText}>
                          <Ionicons name="location-outline" size={13} color="#64748B" /> {job.location} • {job.date}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "#F1F5F9" }]}>
                      <Text style={[styles.statusBadgeText, { color: "#64748B" }]}>CLOSED</Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsText}>
                      <Ionicons name="people-outline" size={14} color="#64748B" /> {job.openings} Openings
                    </Text>
                    <Text style={styles.detailsText}>
                      <Ionicons name="briefcase-outline" size={14} color="#64748B" /> {job.type}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.viewTalentBtn, { flex: 1, backgroundColor: "#E2E8F0" }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert("Reopen Job", "Would you like to reopen this job posting?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Reopen",
                            onPress: () => {
                              setClosedJobs(closedJobs.filter((j) => j.id !== job.id));
                              setActiveJobs([...activeJobs, job]);
                              Alert.alert("Success", "Job has been reopened!");
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={[styles.viewTalentBtnText, { color: "#475569" }]}>Reopen Job</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: PRIMARY_GREEN }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("Post Job")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function EmptyState({ message }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginHorizontal: 4,
    backgroundColor: "#F8FAFC",
  },
  tabButtonActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobTitleWrapper: {
    flexDirection: "row",
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F2FBF5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  jobTitleText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  jobMetaText: {
    fontSize: 11,
    color: "#64748B",
  },
  statusBadge: {
    backgroundColor: "#F2FBF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    paddingLeft: 52,
  },
  detailsText: {
    fontSize: 12,
    color: "#64748B",
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  viewTalentBtn: {
    flex: 1.5,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  viewTalentBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeJobBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  closeJobBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  pendingInfoCard: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  pendingInfoText: {
    flex: 1,
    fontSize: 11,
    color: "#92400E",
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
