import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployerDashboard,
  closeEmployerJob,
} from "../../redux/slices/employerSlice";
import { fetchMyJobs } from "../../redux/slices/jobSlice";
import { useTranslation } from "react-i18next";

const PRIMARY_GREEN = "#153e69";

const normalizeStatus = (status) => String(status || "").toLowerCase();

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function MyJobsScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux Selectors
  const submittedJobs = useSelector((state) => state.employer.submittedJobs);
  const myJobs = useSelector((state) => state.job.myJobs);
  const jobLoading = useSelector((state) => state.job.loading);
  const employerLoading = useSelector((state) => state.employer.loading);
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole,
  );

  const [activeTab, setActiveTab] = useState("active");
  const [localJobs, setLocalJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const isEmployer =
    activeRole?.toLowerCase().replace(" ", "").replace("_", "") === "employer";
  const jobsToShow = isEmployer
    ? submittedJobs?.length
      ? submittedJobs
      : myJobs || []
    : myJobs || [];

  const fetchAllData = React.useCallback(() => {
    if (isEmployer) {
      dispatch(fetchEmployerDashboard());
    }
    dispatch(fetchMyJobs());
  }, [dispatch, isEmployer]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAllData();
    });
    return unsubscribe;
  }, [navigation, fetchAllData]);

  useEffect(() => {
    setLocalJobs(jobsToShow);
  }, [jobsToShow]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (isEmployer) {
        await dispatch(fetchEmployerDashboard()).unwrap();
      }
      await dispatch(fetchMyJobs()).unwrap();
    } catch (e) {
      console.error("Failed to refresh jobs list:", e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, isEmployer]);

  const activeJobs = localJobs.filter((job) => {
    const status = normalizeStatus(job.status);
    return status === "active" || status === "approved";
  });

  const pendingJobs = localJobs.filter(
    (job) => normalizeStatus(job.status) === "pending",
  );
  const closedJobs = localJobs.filter(
    (job) => normalizeStatus(job.status) === "closed",
  );

  const getApplicationsCount = (job) =>
    job?.applicants?.length || job?.applicationsCount || 0;

  const getJobStats = (job) => {
    const applicants = job?.applicants || [];
    const countByStatus = (status) =>
      applicants.filter(
        (applicant) => normalizeStatus(applicant.status) === status,
      ).length;

    return {
      pending: countByStatus("new") || countByStatus("pending"),
      shortlist: countByStatus("shortlisted"),
      contact: countByStatus("contacted"),
      rejected: countByStatus("rejected"),
    };
  };

  const closeJob = (jobId) => {
    CustomAlert.show(
      t("closeJobConfirmTitle", "Close Job"),
      t("closeJobConfirm", "Are you sure you want to close this job posting?"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("closeJob"),
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(closeEmployerJob(jobId)).unwrap();
              CustomAlert.show(
                t("success"),
                t("jobClosed", "Job has been closed."),
              );
              fetchAllData();
            } catch (err) {
              CustomAlert.show(
                t("error"),
                err || t("failCloseJob", "Failed to close the job."),
              );
            }
          },
        },
      ],
    );
  };

  const deletePendingJob = (jobId) => {
    CustomAlert.show(
      t("deleteDraftConfirmTitle", "Delete Draft"),
      t(
        "deleteDraftConfirm",
        "Are you sure you want to delete this job posting?",
      ),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            setLocalJobs((current) =>
              current.filter((job) => String(job.id) !== String(jobId)),
            );
          },
        },
      ],
    );
  };

  const renderJobCard = (job, isActive = false) => {
    const jobOpenings = job.open_positions ?? job.openings ?? 0;
    const jobType = job.job_type ?? job.type ?? "Full-time";
    const jobDate = job.created_at
      ? formatDate(job.created_at)
      : job.date_posted || job.date || "";
    const isReferral = job.is_referral || job.isReferral;
    const stats = getJobStats(job);

    return (
      <View key={String(job.id)} style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleWrapper}>
            <View
              style={[
                styles.iconContainer,
                activeTab === "pending" && { backgroundColor: "rgba(242, 200, 121, 0.12)" },
                activeTab === "closed" && { backgroundColor: "#f2f2f3" },
              ]}
            >
              <Ionicons
                name={
                  activeTab === "pending"
                    ? "hourglass-outline"
                    : activeTab === "closed"
                      ? "archive-outline"
                      : "restaurant-outline"
                }
                size={22}
                color={
                  activeTab === "pending"
                    ? "#f2c879"
                    : activeTab === "closed"
                      ? "rgba(10, 5, 4, 0.6)"
                      : PRIMARY_GREEN
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitleText}>{job.title}</Text>
              {job.company ? (
                <Text style={styles.jobCompanyText}>{job.company}</Text>
              ) : null}
              <Text style={styles.jobMetaText}>
                <Ionicons name="location-outline" size={13} color="rgba(10, 5, 4, 0.6)" />{" "}
                {job.location || "N/A"} • {jobDate}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {isReferral && (
              <View style={styles.referralBadge}>
                <Text style={styles.referralBadgeText}>
                  {t("referral", "Referral")}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                activeTab === "pending" && { backgroundColor: "rgba(242, 200, 121, 0.12)" },
                activeTab === "closed" && { backgroundColor: "#f2f2f3" },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  activeTab === "pending" && { color: "#f2c879" },
                  activeTab === "closed" && { color: "rgba(10, 5, 4, 0.6)" },
                ]}
              >
                {(normalizeStatus(job.status) || activeTab).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailsText}>
            <Ionicons name="people-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
            {t("openings_count", { count: jobOpenings })}
          </Text>
          <Text style={styles.detailsText}>
            <Ionicons name="briefcase-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
            {jobType}
          </Text>
          {job.salary ? (
            <Text style={styles.detailsText}>
              <Ionicons name="card-outline" size={14} color="rgba(10, 5, 4, 0.6)" />{" "}
              {job.salary}
            </Text>
          ) : null}
        </View>

        {job.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.jobDescriptionText} numberOfLines={2}>
              {job.description}
            </Text>
          </View>
        ) : null}

        {isActive && !isReferral && (
          <>
            <View style={styles.divider} />
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>
                {t("hiringProgressCount", { count: getApplicationsCount(job) })}
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: "#153e69" }]}>
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
                  <Text style={[styles.statValue, { color: "#f2c879" }]}>
                    {stats.contact}
                  </Text>
                  <Text style={styles.statLabel}>{t("contacted")}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: "#f57f20" }]}>
                    {stats.rejected}
                  </Text>
                  <Text style={styles.statLabel}>{t("rejected")}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === "pending" && (
          <>
            <View style={styles.divider} />
            <View style={styles.pendingInfoCard}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#f2c879"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.pendingInfoText}>
                {t(
                  "pendingReviewMessage",
                  "This job is currently under review by our admin team.",
                )}
              </Text>
            </View>
          </>
        )}

        <View style={styles.actionsRow}>
          {isActive && !isReferral && (
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
          )}

          {isActive && isEmployer && (
            <TouchableOpacity
              style={styles.closeJobBtn}
              activeOpacity={0.8}
              onPress={() => closeJob(job.id)}
            >
              <Text style={styles.closeJobBtnText}>
                {t("closeJob", "Close Job")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const isLoading = (jobLoading || employerLoading) && !refreshing;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("allJobs", "My Posted Jobs")}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "active" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("active")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.tabTextActive,
            ]}
          >
            {t("active")} ({activeJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "pending" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.tabTextActive,
            ]}
          >
            {t("pending")} ({pendingJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "closed" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("closed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "closed" && styles.tabTextActive,
            ]}
          >
            {t("closed")} ({closedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && localJobs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>
            {t("loading", "Loading jobs...")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_GREEN]}
              tintColor={PRIMARY_GREEN}
            />
          }
        >
          {activeTab === "active" && (
            <>
              {activeJobs.length === 0 ? (
                <EmptyState
                  message={t("noActiveJobs", "No active jobs found")}
                />
              ) : (
                activeJobs.map((job) => renderJobCard(job, true))
              )}
            </>
          )}

          {activeTab === "pending" && (
            <>
              {pendingJobs.length === 0 ? (
                <EmptyState
                  message={t("noPendingJobs", "No pending jobs found")}
                />
              ) : (
                pendingJobs.map((job) => renderJobCard(job, false))
              )}
            </>
          )}

          {activeTab === "closed" && (
            <>
              {closedJobs.length === 0 ? (
                <EmptyState
                  message={t("noClosedJobs", "No closed jobs found")}
                />
              ) : (
                closedJobs.map((job) => renderJobCard(job, false))
              )}
            </>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: PRIMARY_GREEN }]}
        activeOpacity={0.8}
        onPress={() => {
          isEmployer
            ? navigation.navigate("Post Job")
            : navigation.navigate("Post Referral Job");
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function EmptyState({ message }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={48} color="rgba(10, 5, 4, 0.15)" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
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
    color: "#0a0504",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginHorizontal: 4,
    backgroundColor: "#f2f2f3",
  },
  tabButtonActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    borderRadius: 10,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  jobTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  jobCompanyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 2,
  },
  jobMetaText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
  },
  statusBadge: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  referralBadge: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  referralBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#153e69",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
    paddingLeft: 52,
  },
  detailsText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    flexDirection: "row",
    alignItems: "center",
  },
  descriptionContainer: {
    paddingLeft: 52,
    marginTop: 4,
    marginBottom: 8,
  },
  jobDescriptionText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 16,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    marginVertical: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#f2f2f3",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
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
    color: "rgba(10, 5, 4, 0.6)",
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
    color: "#ffffff",
  },
  closeJobBtn: {
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  closeJobBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
    paddingHorizontal: 16,
  },
  pendingInfoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(242, 200, 121, 0.12)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  pendingInfoText: {
    flex: 1,
    fontSize: 11,
    color: "#060401",
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.4)",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});


