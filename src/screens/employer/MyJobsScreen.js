import React, { useEffect, useState, useMemo, useRef } from "react";
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
  Pressable,
} from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployerDashboard,
  closeEmployerJob,
  markJobStatsSeen,
} from "../../redux/slices/employerSlice";
import { fetchMyJobs } from "../../redux/slices/jobSlice";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
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
  const searchInputRef = useRef(null);

  const [toastMessage, setToastMessage] = useState("");
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
  const [expandedStatsJobId, setExpandedStatsJobId] = useState(null);

  const checkIsReferralJob = (job) => {
    if (!job) return false;
    return Boolean(
      job.is_referral ||
      job.isReferral ||
      job._type === "referral_job" ||
      job.category === "referral" ||
      job.submitted_by_role === "candidate" ||
      job.submitted_by_role === "chef" ||
      job.posted_by_role === "candidate" ||
      job.posted_by_role === "chef" ||
      job.active_role === "chef" ||
      job.creator?.active_role === "chef" ||
      job.user_role === "chef"
    );
  };

  const getJobApplicantStats = (job) => {
    const applicants = Array.isArray(job?.applicants)
      ? job.applicants
      : Array.isArray(job?.applications)
      ? job.applications
      : [];

    const statsObj = job?.stats || {};

    const viewed =
      statsObj.viewed ??
      job?.viewed_count ??
      job?.viewed ??
      applicants.filter((a) => String(a?.status).toLowerCase() === "viewed").length;

    const shortlisted =
      statsObj.shortlisted ??
      job?.shortlisted_count ??
      job?.shortlisted ??
      job?.shortlist_count ??
      applicants.filter((a) => String(a?.status).toLowerCase() === "shortlisted").length;

    const contacted =
      statsObj.contacted ??
      job?.contacted_count ??
      job?.contacted ??
      applicants.filter((a) => String(a?.status).toLowerCase() === "contacted").length;

    const rejected =
      statsObj.rejected ??
      job?.rejected_count ??
      job?.rejected ??
      applicants.filter((a) => String(a?.status).toLowerCase() === "rejected").length;

    const pending =
      statsObj.new ??
      job?.pending_count ??
      job?.new_count ??
      job?.under_review_count ??
      applicants.filter((a) => ["new", "pending", "under_review", "under review"].includes(String(a?.status).toLowerCase())).length;

    const total =
      statsObj.total ??
      job?.total_applicants ??
      job?.applicants_count ??
      job?.applicant_count ??
      applicants.length;

    return { viewed, shortlisted, contacted, rejected, pending, total };
  };

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
      return { label: t("new", "NEW").toUpperCase(), bg: "#feefc3", color: "#b06000" };
    }
    if (s === "closed" || s === "completed") {
      return { label: t("completed", "COMPLETED").toUpperCase(), bg: "#f1f3f4", color: "#5f6368" };
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
      combined = [...(myJobs || []), ...(submittedJobs || [])];
      if (employerDashboardRaw) {
        const created = employerDashboardRaw.created_jobs || [];
        const pending = employerDashboardRaw.pending_created_jobs || [];
        const extraJobs = employerDashboardRaw.jobs || employerDashboardRaw.data || [];
        combined = [...combined, ...created, ...pending, ...extraJobs];
      }
    }

    const map = new Map();
    combined.forEach((j, index) => {
      if (j) {
        const key = String(j.id || j.job_id || `job_index_${index}`);
        if (!map.has(key)) {
          map.set(key, j);
        }
      }
    });

    return Array.from(map.values());
  }, [isEmployer, employerDashboardRaw, submittedJobs, myJobs]);



  const fetchAllData = React.useCallback(() => {
    dispatch(fetchEmployerDashboard());
    dispatch(fetchMyJobs());
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

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
        await dispatch(fetchEmployerDashboard()).unwrap().catch(() => {});
      }
      await dispatch(fetchMyJobs()).unwrap().catch(() => {});
    } catch (e) {
      console.error("Failed to refresh jobs list:", e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, isEmployer]);

  // Filter jobs by tab & search query
  const filteredSearchJobs = useMemo(() => {
    const list = jobsToShow || [];
    if (!searchQuery || !searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.startsWith("#") ? q.slice(1) : q;

    return list.filter((job) => {
      const title = String(job.title || job.job_title || job.name || "").toLowerCase();
      const company = String(job.company || job.company_name || "").toLowerCase();
      const rawJobId = String(job.job_id || job.id || "").toLowerCase();
      const cleanJobId = rawJobId.startsWith("#") ? rawJobId.slice(1) : rawJobId;
      const location = String(job.location || job.city || job.country || "").toLowerCase();
      const status = String(job.status || "").toLowerCase();
      const category = String(job.category || job.business_type || "").toLowerCase();
      
      return (
        title.includes(q) ||
        company.includes(q) ||
        rawJobId.includes(q) ||
        cleanJobId.includes(cleanQ) ||
        location.includes(q) ||
        status.includes(q) ||
        category.includes(q)
      );
    });
  }, [jobsToShow, searchQuery]);

  const activeJobs = filteredSearchJobs.filter((job) => {
    const status = normalizeStatus(job.status || "active");
    return status === "active" || status === "approved" || status === "published" || status === "";
  });

  const pendingJobs = filteredSearchJobs.filter(
    (job) => {
      const status = normalizeStatus(job.status);
      return status === "pending" || status === "new" || status === "under_review" || status === "under review";
    }
  );

  const closedJobs = filteredSearchJobs.filter(
    (job) => {
      const status = normalizeStatus(job.status);
      return status === "closed" || status === "completed";
    }
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

    const isReferral = checkIsReferralJob(job);
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

    const stats = getJobApplicantStats(job);
    const isStatsExpanded = expandedStatsJobId === job.id;

    return (
      <TouchableOpacity
        key={String(job.id)}
        style={styles.jobCard}
        activeOpacity={0.95}
        onPress={() => {
          navigation.navigate("MyPostJobsDetails", {
            jobId: job.id,
            job: job,
            activeTab: activeTab,
            isSubmitted: activeTab === "pending",
          });
        }}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
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
            {isEmployer && isReferral && (
              <View style={styles.referralBadge}>
                <Text style={styles.referralBadgeText}>{t("referral", "REFERRAL")}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
            {isEmployer && activeTab !== "pending" && normalizeStatus(job.status) !== "pending" && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>
                  {t("savedJobBadge", "Saved: {{count}}", { count: savedCount })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Dropdown Stats Breakdown Section */}
        {isEmployer && isStatsExpanded && (
          <View style={styles.statsDropdownBox}>
            <Text style={styles.statsDropdownHeader}>
              📊 {t("applicationStatus", "Application Status")}
            </Text>
            <View style={styles.statsGridRow}>
              <TouchableOpacity
                style={[styles.statsBadgeCard, { backgroundColor: "#feefc3", borderColor: "#f9ab00" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate("ApplicantList", {
                    jobId: job.id,
                    jobTitle: jobTitle || job.title,
                    initialFilter: "new",
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.statsBadgeNum, { color: "#b06000" }]}>{stats.pending}</Text>
                <Text style={[styles.statsBadgeLabel, { color: "#b06000" }]}>{t("new", "New")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statsBadgeCard, { backgroundColor: "#e6f4ea", borderColor: "#34a853" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate("ApplicantList", {
                    jobId: job.id,
                    jobTitle: jobTitle || job.title,
                    initialFilter: "viewed",
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.statsBadgeNum, { color: "#137333" }]}>{stats.viewed}</Text>
                <Text style={[styles.statsBadgeLabel, { color: "#137333" }]}>{t("viewed", "Viewed")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statsBadgeCard, { backgroundColor: "#e8f0fe", borderColor: "#1a73e8" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate("ApplicantList", {
                    jobId: job.id,
                    jobTitle: jobTitle || job.title,
                    initialFilter: "contacted",
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.statsBadgeNum, { color: "#1a73e8" }]}>{stats.contacted}</Text>
                <Text style={[styles.statsBadgeLabel, { color: "#1a73e8" }]}>{t("contacted", "Contacted")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statsBadgeCard, { backgroundColor: "#fce8e6", borderColor: "#ea4335" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate("ApplicantList", {
                    jobId: job.id,
                    jobTitle: jobTitle || job.title,
                    initialFilter: "rejected",
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.statsBadgeNum, { color: "#c5221f" }]}>{stats.rejected}</Text>
                <Text style={[styles.statsBadgeLabel, { color: "#c5221f" }]}>{t("rejected", "Rejected")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(8) }}>
            {Boolean(formattedJobId) && (
              <Text style={styles.jobIdText}>
                {t("jobId", "Job ID")}: <Text style={styles.jobIdValue}>{formattedJobId}</Text>
              </Text>
            )}

            {!isEmployer && isReferral && (
              <View style={styles.referralBadge}>
                <Text style={styles.referralBadgeText}>{t("referral", "REFERRAL")}</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(8) }}>
            {isEmployer && activeTab !== "pending" && normalizeStatus(job.status) !== "pending" && (
              <TouchableOpacity
                style={[styles.statsFilterIconBtn, isStatsExpanded && styles.statsFilterIconBtnActive]}
                onPress={(e) => {
                  e.stopPropagation();
                  const willExpand = expandedStatsJobId !== job.id;
                  setExpandedStatsJobId((prev) => (prev === job.id ? null : job.id));

                  if (willExpand && job.has_unseen_activity) {
                    dispatch(markJobStatsSeen(job.id));
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="stats-chart"
                  size={normalize(13)}
                  color={isStatsExpanded ? "#ffffff" : "#153e69"}
                />
                <Ionicons
                  name={isStatsExpanded ? "chevron-up" : "chevron-down"}
                  size={normalize(11)}
                  color={isStatsExpanded ? "#ffffff" : "#153e69"}
                  style={{ marginLeft: 2 }}
                />
                {Boolean(job.has_unseen_activity) && <View style={styles.statsDot} />}
              </TouchableOpacity>
            )}

            {isEmployer && activeTab === "active" && (
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
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.headerTitle, { textAlign: "center" }]}>
              {!isEmployer ? t("myJobReferrals", "MY JOB REFERRALS") : t("myJobs", "MY JOBS")}
            </Text>
            {!isEmployer && (
              <Text style={[styles.headerSubtitle, { textAlign: "center" }]}>
                {t("myJobReferralsSubtitle", "Jobs you have shared with the community")}
              </Text>
            )}
          </View>
          <View style={{ width: normalize(22) }} />
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
              {t("completed", "Completed")} ({closedJobs.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <Pressable
        style={styles.searchContainer}
        onPress={() => searchInputRef.current?.focus()}
      >
        <Ionicons
          name="search-outline"
          size={normalize(18)}
          color="rgba(10, 5, 4, 0.5)"
          style={styles.searchIcon}
        />
        <TextInput
          ref={searchInputRef}
          placeholder={t("searchPlaceholder", "Search by Job Title or Job ID")}
          placeholderTextColor="rgba(10, 5, 4, 0.4)"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {Boolean(searchQuery) && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            activeOpacity={0.7}
            style={{ padding: normalize(4) }}
          >
            <Ionicons name="close-circle" size={normalize(18)} color="rgba(10, 5, 4, 0.4)" />
          </TouchableOpacity>
        )}
      </Pressable>

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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
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
        </ScrollView>
      )}

      {/* Floating Action Button for ALL Roles */}
      <View style={styles.fabContainerWrapper}>
        {!isEmployer && (
          <View style={styles.fabTooltipCard}>
            <Text style={styles.fabTooltipTitle}>{t("postJobAsReferral", "Post a Job as Referral")}</Text>
            <Text style={styles.fabTooltipSub}>
              {activeRole?.toLowerCase().includes("chef") || true
                ? t("fiveJobsPerDay", "5 jobs per day")
                : t("oneJobPerDay", "1 job per day")}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.fabBtnCircle}
          onPress={checkPostLimitAndNavigate}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={normalize(26)} color="#ffffff" />
        </TouchableOpacity>
      </View>

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
    backgroundColor: "#ffffff",
    marginHorizontal: normalize(12),
    marginTop: normalize(10),
    marginBottom: normalize(6),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(12),
    height: normalize(44),
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
  },
  searchIcon: {
    marginRight: normalize(8),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(13),
    color: "#0a0504",
    paddingVertical: normalize(6),
    height: normalize(44),
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
  statsFilterIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.2)",
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(2),
    borderRadius: normalize(4),
    position: "relative",
  },
  statsDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: "#ea4335",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  statsFilterIconBtnActive: {
    backgroundColor: "#153e69",
    borderColor: "#153e69",
  },
  statsDropdownBox: {
    backgroundColor: "#f8fafc",
    borderRadius: normalize(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: normalize(8),
    marginTop: normalize(8),
    marginBottom: normalize(4),
  },
  statsDropdownHeader: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: normalize(6),
  },
  statsGridRow: {
    flexDirection: "row",
    gap: normalize(6),
  },
  statsBadgeCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: normalize(6),
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(4),
    alignItems: "center",
    justifyContent: "center",
  },
  statsBadgeNum: {
    fontSize: normalize(14),
    fontWeight: "800",
  },
  statsBadgeLabel: {
    fontSize: normalize(9),
    fontWeight: "700",
    marginTop: normalize(1),
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
  fabContainerWrapper: {
    position: "absolute",
    bottom: normalize(20),
    right: normalize(16),
    alignItems: "flex-end",
  },
  fabTooltipCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    marginBottom: normalize(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabTooltipTitle: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#153e69",
  },
  fabTooltipSub: {
    fontSize: normalize(10),
    fontWeight: "600",
    color: "#64748b",
  },
  fabBtnCircle: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#153e69",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
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


