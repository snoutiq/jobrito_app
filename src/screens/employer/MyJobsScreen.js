import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployerDashboard, closeEmployerJob } from "../../redux/slices/employerSlice";
import { useTranslation } from "react-i18next";

const PRIMARY_GREEN = "#22C55E";

const normalizeStatus = (status) => String(status || "").toLowerCase();

export default function MyJobsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const submittedJobs = useSelector((state) => state.employer.submittedJobs);
  const [activeTab, setActiveTab] = useState("active");
  const [localJobs, setLocalJobs] = useState([]);

  useEffect(() => {
    if (!submittedJobs?.length) {
      dispatch(fetchEmployerDashboard());
      return;
    }

    setLocalJobs(submittedJobs);
  }, [dispatch, submittedJobs]);

  const activeJobs = localJobs.filter((job) => {
    const status = normalizeStatus(job.status);
    return status === "active" || status === "approved";
  });

  const pendingJobs = localJobs.filter((job) => normalizeStatus(job.status) === "pending");
  const closedJobs = localJobs.filter((job) => normalizeStatus(job.status) === "closed");

  const getApplicationsCount = (job) => job?.applicants?.length || job?.applicationsCount || 0;

  const getJobStats = (job) => {
    const applicants = job?.applicants || [];
    const countByStatus = (status) =>
      applicants.filter((applicant) => normalizeStatus(applicant.status) === status).length;

    return {
      pending: countByStatus("new") || countByStatus("pending"),
      shortlist: countByStatus("shortlisted"),
      contact: countByStatus("contacted"),
      rejected: countByStatus("rejected"),
    };
  };

  const closeJob = (jobId) => {
    CustomAlert.show("Close Job", "Are you sure you want to close this job posting?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close Job",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(closeEmployerJob(jobId)).unwrap();
            CustomAlert.show("Success", "Job has been closed.");
            dispatch(fetchEmployerDashboard());
          } catch (err) {
            CustomAlert.show("Error", err || "Failed to close the job.");
          }
        },
      },
    ]);
  };

  const deletePendingJob = (jobId) => {
    CustomAlert.show("Delete Draft", "Are you sure you want to delete this job posting?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setLocalJobs((current) =>
            current.filter((job) => String(job.id) !== String(jobId)),
          );
        },
      },
    ]);
  };

  const reopenJob = (jobId) => {
    setLocalJobs((current) =>
      current.map((job) =>
        String(job.id) === String(jobId) ? { ...job, status: "active" } : job,
      ),
    );
    CustomAlert.show("Success", "Job has been reopened!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("allJobs")}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "active" && styles.tabButtonActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            {t("active")} ({activeJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "pending" && styles.tabButtonActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            {t("pending")} ({pendingJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "closed" && styles.tabButtonActive]}
          onPress={() => setActiveTab("closed")}
        >
          <Text style={[styles.tabText, activeTab === "closed" && styles.tabTextActive]}>
            {t("closed")} ({closedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "active" && (
          <>
            {activeJobs.length === 0 ? (
              <EmptyState message={t("noActiveJobs")} />
            ) : (
              activeJobs.map((job) => {
                const stats = getJobStats(job);
                return (
                  <View key={String(job.id)} style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <View style={styles.jobTitleWrapper}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="restaurant-outline" size={22} color={PRIMARY_GREEN} />
                        </View>
                        <View>
                          <Text style={styles.jobTitleText}>{job.title}</Text>
                          <Text style={styles.jobMetaText}>
                            <Ionicons name="location-outline" size={13} color="#64748B" />{" "}
                            {job.location} • {job.date_posted || job.date}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                          {normalizeStatus(job.status).toUpperCase() || "ACTIVE"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsText}>
                        <Ionicons name="people-outline" size={14} color="#64748B" />{" "}
                        {t("openings_count", { count: job.openings || 0 })}
                      </Text>
                      <Text style={styles.detailsText}>
                        <Ionicons name="briefcase-outline" size={14} color="#64748B" />{" "}
                        {job.type || "Full-time"}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.progressSection}>
                      <Text style={styles.progressLabel}>
                        {t("hiringProgressCount", { count: getApplicationsCount(job) })}
                      </Text>
                      <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                          <Text style={[styles.statValue, { color: "#3B82F6" }]}>
                            {stats.pending}
                          </Text>
                          <Text style={styles.statLabel}>{t("pending")}</Text>
                        </View>
                        <View style={styles.statBox}>
                          <Text style={[styles.statValue, { color: PRIMARY_GREEN }]}>
                            {stats.shortlist}
                          </Text>
                          <Text style={styles.statLabel}>{t("shortlisted")}</Text>
                        </View>
                        <View style={styles.statBox}>
                          <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                            {stats.contact}
                          </Text>
                          <Text style={styles.statLabel}>{t("contacted")}</Text>
                        </View>
                        <View style={styles.statBox}>
                          <Text style={[styles.statValue, { color: "#EF4444" }]}>
                            {stats.rejected}
                          </Text>
                          <Text style={styles.statLabel}>{t("rejected")}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.viewTalentBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                          navigation.navigate("ApplicantList", {
                            jobId: job.id,
                            jobTitle: job.title,
                          })
                        }
                      >
                        <Text style={styles.viewTalentBtnText}>{t("viewTalent")}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.closeJobBtn}
                        activeOpacity={0.8}
                        onPress={() => closeJob(job.id)}
                      >
                        <Text style={styles.closeJobBtnText}>{t("closeJob")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === "pending" && (
          <>
            {pendingJobs.length === 0 ? (
              <EmptyState message={t("noPendingJobs")} />
            ) : (
              pendingJobs.map((job) => (
                <View key={String(job.id)} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleWrapper}>
                      <View style={[styles.iconContainer, { backgroundColor: "#FEF3C7" }]}>
                        <Ionicons name="hourglass-outline" size={22} color="#D97706" />
                      </View>
                      <View>
                        <Text style={styles.jobTitleText}>{job.title}</Text>
                        <Text style={styles.jobMetaText}>
                          <Ionicons name="location-outline" size={13} color="#64748B" />{" "}
                          {job.location} • {job.date_posted || job.date}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
                      <Text style={[styles.statusBadgeText, { color: "#D97706" }]}>{t("pending").toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsText}>
                      <Ionicons name="people-outline" size={14} color="#64748B" />{" "}
                      {t("openings_count", { count: job.openings || 0 })}
                    </Text>
                    <Text style={styles.detailsText}>
                      <Ionicons name="briefcase-outline" size={14} color="#64748B" />{" "}
                      {job.type || "Full-time"}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.pendingInfoCard}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color="#D97706"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.pendingInfoText}>
                      {t("pendingReviewMessage")}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.closeJobBtn, { flex: 1 }]}
                      activeOpacity={0.8}
                      onPress={() => deletePendingJob(job.id)}
                    >
                      <Text style={styles.closeJobBtnText}>{t("deletePosting")}</Text>
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
              <EmptyState message={t("noClosedJobs")} />
            ) : (
              closedJobs.map((job) => (
                <View key={String(job.id)} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleWrapper}>
                      <View style={[styles.iconContainer, { backgroundColor: "#F1F5F9" }]}>
                        <Ionicons name="archive-outline" size={22} color="#64748B" />
                      </View>
                      <View>
                        <Text style={styles.jobTitleText}>{job.title}</Text>
                        <Text style={styles.jobMetaText}>
                          <Ionicons name="location-outline" size={13} color="#64748B" />{" "}
                          {job.location} • {job.date_posted || job.date}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "#F1F5F9" }]}>
                      <Text style={[styles.statusBadgeText, { color: "#64748B" }]}>{t("closed").toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsText}>
                      <Ionicons name="people-outline" size={14} color="#64748B" />{" "}
                      {t("openings_count", { count: job.openings || 0 })}
                    </Text>
                    <Text style={styles.detailsText}>
                      <Ionicons name="briefcase-outline" size={14} color="#64748B" />{" "}
                      {job.type || "Full-time"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

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
