import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  PixelRatio,
  TextInput,
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
import { getDailyPostLimit } from "../../services/jobApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

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

const getCategoryIconDetails = (job) => {
  const title = (job?.title || job?.job_title || job?.category || "").toLowerCase();
  if (title.includes("packer") || title.includes("pack")) {
    return { icon: "cube-outline", bg: "rgba(27, 77, 255, 0.08)", color: "#1b4dff" };
  }
  if (title.includes("baker") || title.includes("chef") || title.includes("cook")) {
    return { icon: "restaurant-outline", bg: "rgba(245, 127, 32, 0.08)", color: "#f57f20" };
  }
  if (title.includes("barista") || title.includes("cafe") || title.includes("coffee")) {
    return { icon: "cafe-outline", bg: "rgba(16, 185, 129, 0.08)", color: "#10b981" };
  }
  return { icon: "briefcase-outline", bg: "rgba(21, 62, 105, 0.08)", color: "#153e69" };
};

export default function MyJobsScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [toastMessage, setToastMessage] = useState("");
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Redux Selectors
  const employerDashboardRaw = useSelector((state) => state.employer.dashboardRaw);
  const submittedJobs = useSelector((state) => state.employer.submittedJobs);
  const myJobs = useSelector((state) => state.job.myJobs);
  const jobLoading = useSelector((state) => state.job.loading);
  const employerLoading = useSelector((state) => state.employer.loading);
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole,
  );

  const isEmployer =
    activeRole?.toLowerCase().replace(" ", "").replace("_", "") === "employer";

  const [activeTab, setActiveTab] = useState(
    route?.params?.activeTab || route?.params?.initialTab || "active"
  );
  const [localJobs, setLocalJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const checkPostLimitAndNavigate = async () => {
    if (checkingLimit) return;
    setCheckingLimit(true);
    try {
      const res = await getDailyPostLimit();
      if (res && res.success && res.can_post_today === false) {
        setToastMessage(t("dailyPostLimitComplete", "Daily job post limit completed!"));
        setTimeout(() => {
          setToastMessage("");
        }, 1000);
      } else {
        if (isEmployer) {
          navigation.navigate("Post Job");
        } else {
          navigation.navigate("Post Referral Job");
        }
      }
    } catch (err) {
      console.warn("Failed to check daily post limit:", err);
      if (isEmployer) {
        navigation.navigate("Post Job");
      } else {
        navigation.navigate("Post Referral Job");
      }
    } finally {
      setCheckingLimit(false);
    }
  };

  const getJobTypeLabel = (opt) => {
    switch (opt?.toLowerCase()) {
      case "full-time":
      case "full time":
        return t("fullTime", "Full-time");
      case "part-time":
      case "part time":
        return t("partTime", "Part-time");
      case "contract":
        return t("jobType.contract", "Contract");
      case "internship":
        return t("jobType.internship", "Internship");
      case "freelance":
        return t("freelanceChef", "Freelance");
      default:
        return opt || t("fullTime", "Full-time");
    }
  };

  const getStatusBadgeConfig = (status) => {
    const s = normalizeStatus(status);
    if (s === "approved" || s === "active") {
      return { label: t("status.approved", "APPROVED"), bg: "#e6f4ea", color: "#137333" };
    }
    if (s === "pending" || s === "new" || s === "under_review" || s === "under review") {
      return { label: t("status.pending", "PENDING"), bg: "#feefc3", color: "#b06000" };
    }
    if (s === "closed") {
      return { label: t("status.closed", "CLOSED"), bg: "#f1f3f4", color: "#5f6368" };
    }
    return { label: s.toUpperCase(), bg: "#e8effe", color: "#1b4dff" };
  };

  const jobsToShow = useMemo(() => {
    let combined = [];

    if (isEmployer) {
      if (employerDashboardRaw) {
        const created = employerDashboardRaw.created_jobs || [];
        const pending = employerDashboardRaw.pending_created_jobs || [];
        const extraJobs = employerDashboardRaw.jobs || employerDashboardRaw.data || [];
        combined = [...created, ...pending, ...extraJobs];
      }
      if (combined.length === 0 && submittedJobs && submittedJobs.length > 0) {
        combined = [...submittedJobs];
      }
      if (combined.length === 0 && myJobs && myJobs.length > 0) {
        combined = [...myJobs];
      }
    } else {
      combined = myJobs || [];
    }

    const map = new Map();
    combined.forEach((j) => {
      if (j && j.id && !map.has(String(j.id))) {
        map.set(String(j.id), j);
      }
    });

    return Array.from(map.values());
  }, [isEmployer, employerDashboardRaw, submittedJobs, myJobs]);

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
    const targetTab = route?.params?.activeTab || route?.params?.initialTab;
    if (targetTab) {
      setActiveTab(targetTab);
    }
  }, [route?.params?.activeTab, route?.params?.initialTab]);

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

  // Filter jobs by tab & search query
  const filteredSearchJobs = useMemo(() => {
    if (!searchQuery.trim()) return localJobs;
    const q = searchQuery.toLowerCase().trim();
    return localJobs.filter((job) => {
      const title = String(job.title || job.job_title || "").toLowerCase();
      const company = String(job.company || job.company_name || "").toLowerCase();
      const jobIdStr = String(job.job_id || job.id || "").toLowerCase();
      return title.includes(q) || company.includes(q) || jobIdStr.includes(q);
    });
  }, [localJobs, searchQuery]);

  const activeJobs = filteredSearchJobs.filter((job) => {
    const status = normalizeStatus(job.status);
    return status === "active" || status === "approved";
  });

  const pendingJobs = filteredSearchJobs.filter(
    (job) => {
      const status = normalizeStatus(job.status);
      return status === "pending" || status === "new" || status === "under_review" || status === "under review";
    }
  );

  const closedJobs = filteredSearchJobs.filter(
    (job) => normalizeStatus(job.status) === "closed"
  );

  const renderJobCard = (job) => {
    const jobTitle = String(job.title || job.job_title || "").trim();
    const companyName = String(job.company || job.company_name || "").trim();
    const locationStr = String(job.location || job.city || job.country || "").trim();
    const rawSalary = job.salary || job.salary_range || job.offered_salary || job.salary_display;
    const salaryStr = rawSalary && String(rawSalary).trim() ? String(rawSalary).trim() : t("notMentioned", "Not Mentioned");
    const jobOpenings = job.open_positions ?? job.openings ?? job.vacancies ?? 1;
    const rawType = job.job_type || job.type;
    const jobType = rawType ? getJobTypeLabel(rawType) : t("fullTime", "Full-time");
    const jobDate = job.created_at
      ? formatDate(job.created_at)
      : job.date_posted || job.date || "";

    const isReferral = Boolean(job.is_referral || job.isReferral || job.submitted_by_role === "candidate" || job.submitted_by_role === "chef");
    const statusConfig = getStatusBadgeConfig(job.status);
    const iconConfig = getCategoryIconDetails(job);
    const logoUrl = job.company_logo_url || job.company_logo || job.logo || null;

    // Formatted Job ID (Use exact API ID)
    const formattedJobId = job.job_id || (job.id ? `#${job.id}` : "");

    const savedCount =
      job.total_saved_count ??
      job.saves_count ??
      job.saved_count ??
      job.saved_by_users_count ??
      (Array.isArray(job.saved_by_users) ? job.saved_by_users.length : null) ??
      (Array.isArray(job.saved_users) ? job.saved_users.length : null) ??
      (Array.isArray(job.saved_by) ? job.saved_by.length : null) ??
      0;

    return (
      <TouchableOpacity
        key={String(job.id)}
        style={styles.jobCard}
        activeOpacity={0.95}
        onPress={() => {
          navigation.navigate("MyJobDetails", {
            jobId: job.id,
            job: job,
            activeTab: activeTab,
            isSubmitted: activeTab === "pending",
          });
        }}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={[styles.jobIconBox, { backgroundColor: iconConfig.bg }]}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.companyLogoImage} />
            ) : (
              <Ionicons name={iconConfig.icon} size={normalize(20)} color={iconConfig.color} />
            )}
          </View>

          <View style={styles.jobMainInfo}>
            {Boolean(jobTitle) && (
              <Text style={styles.jobTitleText} numberOfLines={1}>
                {jobTitle.toUpperCase()}
              </Text>
            )}

            {Boolean(companyName) && (
              <View style={styles.companyRow}>
                <Text style={styles.companyNameText} numberOfLines={1}>
                  {companyName}
                </Text>
                <Ionicons name="checkmark-circle" size={normalize(13)} color="#1d9bf0" style={{ marginLeft: normalize(4) }} />
              </View>
            )}

            {(Boolean(locationStr) || Boolean(jobDate)) && (
              <View style={styles.locationDateRow}>
                {Boolean(locationStr) && (
                  <>
                    <Ionicons name="location-outline" size={normalize(11)} color="rgba(10, 5, 4, 0.5)" style={{ marginRight: normalize(2) }} />
                    <Text style={styles.locationDateText} numberOfLines={1}>
                      {locationStr} {jobDate ? ` •  ` : ""}
                    </Text>
                  </>
                )}
                {Boolean(jobDate) && (
                  <Text style={styles.locationDateText} numberOfLines={1}>
                    {jobDate}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.badgesContainer}>
            {isReferral && (
              <View style={styles.referralBadge}>
                <Text style={styles.referralBadgeText}>{t("referral", "REFERRAL")}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            {activeTab !== "pending" && normalizeStatus(job.status) !== "pending" && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>
                  {t("favoriteJobBadge", "Favorite: {{count}}", { count: savedCount })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Metadata Row (No top border line) */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={normalize(13)} color="rgba(10, 5, 4, 0.55)" />
            <Text style={styles.metaItemText}>
              {jobOpenings} {jobOpenings === 1 ? t("opening", "Opening") : t("openings", "Openings")}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="briefcase-outline" size={normalize(13)} color="rgba(10, 5, 4, 0.55)" />
            <Text style={styles.metaItemText}>{jobType}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="card-outline" size={normalize(13)} color="rgba(10, 5, 4, 0.55)" />
            <Text style={styles.metaItemText}>{salaryStr}</Text>
          </View>
        </View>

        {/* Card Footer Row */}
        <View style={styles.cardFooterRow}>
          {Boolean(formattedJobId) && (
            <Text style={styles.jobIdText}>
              {t("jobId", "Job ID")}: <Text style={styles.jobIdValue}>{formattedJobId}</Text>
            </Text>
          )}

          {isEmployer && (
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate("ApplicantList", {
                  jobId: job.id,
                  jobTitle: jobTitle || job.title,
                });
              }}
            >
              <Text style={styles.viewDetailsBtnText}>{t("viewTalent", "View Talent")}</Text>
              <Ionicons name="arrow-forward" size={normalize(13)} color="#153e69" style={{ marginLeft: normalize(4) }} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = (jobLoading || employerLoading) && !refreshing;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate(isEmployer ? "EmployerHome" : "Tabs");
              }
            }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={normalize(22)} color="#0a0504" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>
              {!isEmployer ? t("myJobReferrals", "MY JOB REFERRALS") : t("myJobs", "MY JOBS")}
            </Text>
            {!isEmployer && (
              <Text style={styles.headerSubtitle}>
                {t("myJobReferralsSubtitle", "Jobs you have shared with the community")}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ALL JOB STATUS Tabs Container */}
      <View style={styles.tabCardContainer}>
        <Text style={styles.tabCardHeaderTitle}>
          {t("allJobStatus", "ALL JOB STATUS")}
        </Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "active" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("active")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" && styles.tabTextActive,
              ]}
            >
              {t("active", "Active")} ({activeJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "pending" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("pending")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" && styles.tabTextActive,
              ]}
            >
              {t("submitted", "Submitted")} ({pendingJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "closed" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("closed")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "closed" && styles.tabTextActive,
              ]}
            >
              {t("closed", "Closed")} ({closedJobs.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={normalize(18)}
          color={isSearchFocused ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.4)"}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={t("searchPlaceholder", "Search by Job Title or Job ID")}
          placeholderTextColor="rgba(10, 5, 4, 0.4)"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {Boolean(searchQuery) && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={normalize(18)} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
        )}
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
                <EmptyState message={t("noActiveJobs", "No active jobs found")} />
              ) : (
                activeJobs.map((job) => renderJobCard(job))
              )}
            </>
          )}

          {activeTab === "pending" && (
            <>
              <View style={styles.tabSubheadingBanner}>
                <Ionicons
                  name="information-circle"
                  size={normalize(16)}
                  color="#f57f20"
                  style={{ marginRight: normalize(6), marginTop: 1 }}
                />
                <Text style={styles.tabSubheadingText}>
                  {t(
                    "pendingReviewSubheading",
                    "These job postings are currently being reviewed by admin and will be published in feed shortly."
                  )}
                </Text>
              </View>
              {pendingJobs.length === 0 ? (
                <EmptyState message={t("noPendingJobs", "No pending jobs found")} />
              ) : (
                pendingJobs.map((job) => renderJobCard(job))
              )}
            </>
          )}

          {activeTab === "closed" && (
            <>
              {closedJobs.length === 0 ? (
                <EmptyState message={t("noClosedJobs", "No closed jobs found")} />
              ) : (
                closedJobs.map((job) => renderJobCard(job))
              )}
            </>
          )}

          {/* Bottom Referral / Share Card Banner for Talent & Chef Side */}
          {!isEmployer && (
            <View style={styles.shareBannerCard}>
              <View style={styles.shareBannerLeft}>
                <View style={styles.shareBannerIconBox}>
                  <Ionicons name="people" size={normalize(18)} color="#153e69" />
                </View>
                <View style={styles.shareBannerTextContainer}>
                  <Text style={styles.shareBannerTitle}>
                    {t("shareMoreJobsTitle", "Share more job opportunities!")}
                  </Text>
                  <Text style={styles.shareBannerSubtitle}>
                    {t("shareMoreJobsSub", "Help your network grow by sharing verified job openings.")}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.shareJobBtn}
                onPress={checkPostLimitAndNavigate}
                activeOpacity={0.8}
              >
                <Text style={styles.shareJobBtnText}>{t("shareAJob", "SHARE A JOB")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Action Button for Employer */}
      {isEmployer && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: PRIMARY_GREEN }]}
          activeOpacity={0.8}
          onPress={checkPostLimitAndNavigate}
        >
          <Ionicons name="add" size={normalize(24)} color="#fff" />
        </TouchableOpacity>
      )}

      {Boolean(toastMessage) && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function EmptyState({ message }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={normalize(40)} color="rgba(10, 5, 4, 0.15)" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    marginRight: normalize(10),
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0a0504",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: normalize(10.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
    marginTop: 1,
  },
  tabCardContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(12),
    paddingTop: normalize(8),
    paddingBottom: normalize(8),
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  tabCardHeaderTitle: {
    fontSize: normalize(9.5),
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: normalize(4),
  },
  tabContainer: {
    flexDirection: "row",
    gap: normalize(6),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    backgroundColor: "#f8fafc",
  },
  tabButtonActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  tabText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f4f9",
    marginHorizontal: normalize(12),
    marginTop: normalize(10),
    marginBottom: normalize(4),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(12),
    height: normalize(44),
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  searchContainerFocused: {
    backgroundColor: "#ffffff",
    borderColor: PRIMARY_GREEN,
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchIcon: {
    marginRight: normalize(8),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(12.5),
    color: "#0a0504",
    padding: 0,
    height: "100%",
  },
  scrollContent: {
    padding: normalize(12),
    paddingBottom: normalize(80),
  },
  jobCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(12),
    padding: normalize(12),
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    marginBottom: normalize(10),
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  jobIconBox: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  companyLogoImage: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
  },
  jobMainInfo: {
    flex: 1,
    marginRight: normalize(6),
  },
  jobTitleText: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0d2b52",
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  companyNameText: {
    fontSize: normalize(11.5),
    fontWeight: "600",
    color: "#475569",
    flexShrink: 1,
  },
  locationDateRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  locationDateText: {
    fontSize: normalize(10.5),
    color: "#64748b",
    fontWeight: "500",
    flexShrink: 1,
  },
  badgesContainer: {
    alignItems: "flex-end",
    gap: normalize(3),
  },
  referralBadge: {
    backgroundColor: "#e8effe",
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(4),
  },
  referralBadgeText: {
    fontSize: normalize(8.5),
    fontWeight: "800",
    color: "#3b82f6",
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(4),
  },
  statusBadgeText: {
    fontSize: normalize(8.5),
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(4),
  },
  savedBadgeText: {
    fontSize: normalize(8.5),
    fontWeight: "700",
    color: "#153e69",
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: normalize(8),
    paddingTop: normalize(4),
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(3),
  },
  metaItemText: {
    fontSize: normalize(10.5),
    color: "#475569",
    fontWeight: "600",
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: normalize(8),
    paddingTop: normalize(8),
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  jobIdText: {
    fontSize: normalize(10.5),
    color: "#64748b",
    fontWeight: "500",
  },
  jobIdValue: {
    color: "#153e69",
    fontWeight: "700",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(5),
    borderRadius: normalize(6),
    borderWidth: 1,
    borderColor: "#153e69",
    backgroundColor: "#ffffff",
  },
  viewDetailsBtnText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#153e69",
  },

  // Bottom Referral Banner
  shareBannerCard: {
    backgroundColor: "#eff6ff",
    borderRadius: normalize(12),
    padding: normalize(10),
    marginTop: normalize(8),
    marginBottom: normalize(12),
    borderWidth: 1,
    borderColor: "#dbeafe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shareBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: normalize(8),
  },
  shareBannerIconBox: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(8),
  },
  shareBannerTextContainer: {
    flex: 1,
  },
  shareBannerTitle: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: 1,
  },
  shareBannerSubtitle: {
    fontSize: normalize(10),
    color: "#3b82f6",
    fontWeight: "500",
    lineHeight: normalize(13),
  },
  shareJobBtn: {
    backgroundColor: "#1d4ed8",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(7),
    borderRadius: normalize(8),
  },
  shareJobBtnText: {
    color: "#ffffff",
    fontSize: normalize(10),
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  tabSubheadingBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(245, 127, 32, 0.08)",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(8),
    borderRadius: normalize(8),
    alignItems: "flex-start",
    marginBottom: normalize(10),
    borderWidth: 1,
    borderColor: "rgba(245, 127, 32, 0.2)",
  },
  tabSubheadingText: {
    flex: 1,
    fontSize: normalize(11),
    color: "#0a0504",
    lineHeight: normalize(15),
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(60),
    gap: normalize(10),
  },
  emptyText: {
    fontSize: normalize(12),
    color: "rgba(10, 5, 4, 0.4)",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(80),
    gap: normalize(10),
  },
  loadingText: {
    fontSize: normalize(13),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: normalize(20),
    right: normalize(20),
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  toastContainer: {
    position: "absolute",
    bottom: normalize(80),
    left: normalize(16),
    right: normalize(16),
    backgroundColor: "rgba(10, 5, 4, 0.9)",
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  toastText: {
    color: "#ffffff",
    fontSize: normalize(13),
    fontWeight: "600",
    textAlign: "center",
  },
});


