import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  Linking,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CustomAlert } from "../../components/common/CustomAlert";
import { closeEmployerJob } from "../../redux/slices/employerSlice";
import { applyJob, fetchApplicationHistory } from "../../redux/slices/applicationSlice";
import { fetchJobDetails, toggleSaveJob, fetchSavedJobs } from "../../redux/slices/jobSlice";
import { getJobDetails } from "../../services/jobApi";
import CallbackModal from "../../components/common/CallbackModal";
import AppButton from "../../components/buttons/AppButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";

const normalizeStatus = (status) => String(status || "").toLowerCase();

const getCategoryIconDetails = (job) => {
  const title = (job?.title || job?.job_title || job?.category || "").toLowerCase();
  if (title.includes("packer") || title.includes("pack")) {
    return { icon: "cube-outline", bg: "rgba(27, 77, 255, 0.08)", color: "#1b4dff" };
  }
  if (title.includes("baker") || title.includes("chef") || title.includes("cook")) {
    return { icon: "restaurant-outline", bg: "rgba(245, 127, 32, 0.08)", color: "#f57f20" };
  }
  if (title.includes("barista") || title.includes("cafe") || title.includes("coffee")) {
    return { icon: "cafe-outline", bg: "rgba(10, 185, 129, 0.08)", color: "#10b981" };
  }
  return { icon: "briefcase-outline", bg: "rgba(21, 62, 105, 0.08)", color: "#153e69" };
};

const getStatusBadgeConfig = (status, t) => {
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
  return { label: (status || "APPROVED").toUpperCase(), bg: "#e6f4ea", color: "#137333" };
};

export default function JobDetailsScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole,
  );
  const isEmployer =
    activeRole?.toLowerCase().replace(" ", "").replace("_", "") === "employer";

  const { feedJobs, myJobs, savedJobs, jobDetails } = useSelector(
    (state) => state.job,
  );
  const { submittedJobs } = useSelector((state) => state.employer);
  const { history: applicationHistory } = useSelector(
    (state) => state.application,
  );

  const jobId = route?.params?.jobId || route?.params?.job?.id;
  const passedJob = route?.params?.job;

  const [showCallModal, setShowCallModal] = useState(false);
  const [directJob, setDirectJob] = useState(null);
  const [directLoading, setDirectLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchApplicationHistory());
    if (jobId) {
      dispatch(fetchJobDetails(jobId));
      if (!passedJob || !passedJob.description) {
        setDirectLoading(true);
        getJobDetails(jobId)
          .then((res) => {
            const detail =
              res?.job ||
              res?.data ||
              res?.job_details ||
              res?.job_post ||
              res?.post ||
              res?.details ||
              (res?.id ? res : null);
            if (detail) setDirectJob(detail);
          })
          .catch(() => null)
          .finally(() => setDirectLoading(false));
      }
    }
  }, [dispatch, jobId, passedJob]);

  const job = useMemo(() => {
    const targetId = String(jobId || passedJob?.id || "");
    if (directJob && String(directJob.id) === targetId) return directJob;
    if (jobDetails && String(jobDetails.id) === targetId) return jobDetails;

    const foundFeed = (feedJobs || []).find((j) => String(j.id) === targetId);
    if (foundFeed) return foundFeed;

    const foundMy = (myJobs || []).find((j) => String(j.id) === targetId);
    if (foundMy) return foundMy;

    const foundSub = (submittedJobs || []).find((j) => String(j.id) === targetId);
    if (foundSub) return foundSub;

    const foundSaved = (savedJobs || []).find((j) => String(j.id) === targetId);
    if (foundSaved) return foundSaved;

    return passedJob || directJob || jobDetails || null;
  }, [passedJob, jobDetails, directJob, feedJobs, myJobs, submittedJobs, savedJobs, jobId]);

  const handleShare = async () => {
    try {
      const id = jobId || job?.id;
      await Share.share({
        message: `${job?.title || "Job"} at ${job?.company || "Jobrito"}\n\nLink: https://jobrito.com/job/${id}`,
      });
    } catch (error) {
      Alert.alert("Unable to share", "Please try again.");
    }
  };

  const closeJob = (jobIdToClose) => {
    CustomAlert.show(
      t("areYouSure", "Are you sure?"),
      t("closeJobConfirmMsg", "Closing this job will stop new Talent applications."),
      [
        { text: t("cancel", "Cancel"), style: "cancel" },
        {
          text: t("closeJob", "Close Job"),
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(closeEmployerJob(jobIdToClose)).unwrap();
              CustomAlert.show(
                t("success", "Success"),
                t("jobClosed", "Job has been closed."),
              );
              if (navigation && navigation.canGoBack()) {
                navigation.goBack();
              }
            } catch (err) {
              CustomAlert.show(
                t("error", "Error"),
                err || t("failCloseJob", "Failed to close the job."),
              );
            }
          },
        },
      ],
    );
  };

  const isApplied = useMemo(() => {
    if (!job?.id) return false;
    return (applicationHistory || []).some(
      (app) => String(app.job_id || app.job?.id) === String(job.id),
    );
  }, [applicationHistory, job?.id]);

  if (directLoading && !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={normalize(22)} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("jobDetails.title", "JOB DETAILS")}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>{t("loading", "Loading job details...")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = String(job?.title || job?.job_title || job?.name || "").trim();
  const company = String(job?.company || job?.company_name || job?.business_name || "").trim();
  const location = String(job?.location || job?.city || job?.country || "").trim() || t("notMentioned", "Not Mentioned");

  const formatSalaryDisplay = () => {
    if (!job) return t("notMentioned", "Not Mentioned");
    const currency = String(job.currency || job.salary_currency || "SAR").trim();
    const min = job.salary_min ?? job.min_salary ?? job.salaryMin;
    const max = job.salary_max ?? job.max_salary ?? job.salaryMax;

    if (min !== undefined && min !== null && min !== "" && max !== undefined && max !== null && max !== "") {
      const minNum = Number(min);
      const maxNum = Number(max);
      if (!isNaN(minNum) && !isNaN(maxNum)) {
        if (minNum === maxNum) return `${currency} ${minNum.toLocaleString()}`;
        return `${currency} ${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;
      }
    }

    const raw = job.salary || job.salary_range || job.offered_salary || job.salary_display;
    if (raw && String(raw).trim()) {
      const s = String(raw).trim();
      const match = s.match(/^(?:([A-Za-z]{2,4})\s*)?(\d+)(?:\s*-\s*(?:([A-Za-z]{2,4})\s*)?(\d+))?$/i);
      if (match) {
        const curr = match[1] || match[3] || currency;
        const v1 = Number(match[2]);
        const v2 = match[4] ? Number(match[4]) : null;
        if (v2 !== null) {
          if (v1 === v2) return `${curr} ${v1.toLocaleString()}`;
          return `${curr} ${v1.toLocaleString()} - ${v2.toLocaleString()}`;
        }
        return `${curr} ${v1.toLocaleString()}`;
      }
      return s;
    }
    return t("notMentioned", "Not Mentioned");
  };

  const salaryStr = formatSalaryDisplay();
  const rawExp = job?.experience || job?.experience_range || job?.experience_level || job?.experience_years;
  const experienceStr = rawExp && String(rawExp).trim() ? String(rawExp).trim() : t("notSpecified", "Not Specified");
  const openings = job?.open_positions ?? job?.openings ?? job?.vacancies ?? 1;
  const rawType = job?.job_type || job?.type || "";
  const jobType = rawType ? String(rawType).toUpperCase() : t("fullTime", "FULL-TIME");
  const description = job?.description || job?.job_description || job?.summary || "";
  const statusConfig = getStatusBadgeConfig(job?.status, t);
  const iconConfig = getCategoryIconDetails(job);
  const logoUrl = job?.company_logo_url || job?.company_logo || job?.logo || null;
  const formattedJobId = job?.job_id || (job?.id ? `#${job.id}` : "");
  const contactInfo = job?.contact_info || job?.phone || job?.contact_person_phone;

  const isJobPending =
    Boolean(route?.params?.isSubmitted) ||
    route?.params?.activeTab === "pending" ||
    normalizeStatus(job?.status) === "pending" ||
    normalizeStatus(job?.status) === "new" ||
    normalizeStatus(job?.status) === "under_review" ||
    normalizeStatus(job?.status) === "under review";

  const jobRequirements = Array.isArray(job?.requirements)
    ? job.requirements.filter(Boolean)
    : typeof job?.requirements === "string"
      ? job.requirements.split("\n").map((r) => r.trim()).filter(Boolean)
      : [];

  const jobBenefits = Array.isArray(job?.benefits)
    ? job.benefits.filter(Boolean)
    : typeof job?.benefits === "string"
      ? job.benefits.split("\n").map((b) => b.trim()).filter(Boolean)
      : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Clean White Header matching design */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation && navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          style={styles.backBtnRow}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={normalize(22)} color="#0f172a" />
          <Text style={styles.backBtnText}>
            {t("backToSavedJobs", "Back to Saved Jobs")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Saved Job Top Blue Notice Banner */}
        <View style={styles.savedNoticeBanner}>
          <View style={styles.savedNoticeIconWrap}>
            <Ionicons name="bookmark" size={normalize(20)} color="#ffffff" />
          </View>
          <View style={styles.savedNoticeTextWrap}>
            <Text style={styles.savedNoticeTitle}>
              {t("savedNoticeTitle", "This job has been saved by you.")}
            </Text>
            <Text style={styles.savedNoticeSub}>
              {t("savedNoticeSub1", "If you're still interested, tap Apply.")}
            </Text>
            <Text style={styles.savedNoticeSub}>
              {t("savedNoticeSub2", "You can also share this opportunity with others.")}
            </Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroIconBox, { backgroundColor: iconConfig.bg }]}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoImage} />
            ) : (
              <Ionicons name={iconConfig.icon} size={normalize(24)} color={iconConfig.color} />
            )}
          </View>

          <View style={styles.heroInfoWrap}>
            {Boolean(company) && (
              <View style={styles.companyRow}>
                <Text style={styles.companyNameText} numberOfLines={1}>
                  {company}
                </Text>
                <Ionicons name="checkmark-circle" size={normalize(16)} color="#3b82f6" style={{ marginLeft: normalize(4) }} />
              </View>
            )}

            {Boolean(title) && (
              <Text style={styles.jobTitleText} numberOfLines={1}>
                {title}
              </Text>
            )}

            <View style={styles.metaRowInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="card-outline" size={normalize(14)} color="#64748b" />
                <Text style={styles.metaLabel}>{t("jobDetails.jobId", "JOB ID")}</Text>
                <Text style={styles.metaValueBlue}>{formattedJobId || "JR2026082101"}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={normalize(14)} color="#64748b" />
                <Text style={styles.metaLabel}>{t("postedBy", "Posted by")}</Text>
                <Text style={styles.metaValueGreen}>{t("employer", "EMPLOYER")}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2x2 Grid Container */}
        <View style={styles.gridContainer}>
          {/* Row 1: Employment Type & Location */}
          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="briefcase-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("employmentTypeLabel", "Employment Type")}</Text>
                <Text style={styles.gridValue} numberOfLines={3}>{jobType}</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="location-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("location", "Location")}</Text>
                <Text style={styles.gridValue} numberOfLines={3}>{location}</Text>
              </View>
            </View>
          </View>

          {/* Row 2: Salary & Experience */}
          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="card-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("salary", "Salary")}</Text>
                <Text style={styles.gridValue} numberOfLines={3}>{salaryStr}</Text>
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="bag-handle-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("experience", "Experience")}</Text>
                <Text style={styles.gridValue} numberOfLines={3}>{experienceStr}</Text>
              </View>
            </View>
          </View>

          {/* Row 3: Open Positions */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCard, { flex: 0.485 }]}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="people-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("openPositionsLabel", "Open Positions")}</Text>
                <Text style={styles.gridValue}>{openings}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section: About the Role */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t("aboutTheRole", "About the Role")}</Text>
          <View style={styles.sectionTitleUnderline} />
          <Text style={styles.bodyDescription}>
            {description || t("noDescription", "No description available for this role.")}
          </Text>
        </View>

        {jobRequirements.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("jobDetails.keyRequirements", "KEY REQUIREMENTS")}</Text>
            <View style={styles.sectionTitleUnderline} />
            <View style={styles.requirementList}>
              {jobRequirements.map((item) => (
                <View key={item} style={styles.requirementRow}>
                  <Ionicons name="checkmark-circle" size={normalize(16)} color="#10b981" />
                  <Text style={styles.requirementText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {jobBenefits.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("jobDetails.benefitsPerks", "BENEFITS & PERKS")}</Text>
            <View style={styles.sectionTitleUnderline} />
            <View style={styles.benefitWrap}>
              {jobBenefits.map((item) => (
                <View key={item} style={styles.benefitChip}>
                  <Text style={styles.benefitText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {isEmployer && !isJobPending ? (
        <View style={styles.employerActionsRow}>
          <TouchableOpacity
            style={styles.viewTalentBtn}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("ApplicantList", {
                jobId: job?.id,
                jobTitle: title,
              })
            }
          >
            <Text style={styles.viewTalentBtnText}>{t("viewTalent", "View Talent")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeJobBtn}
            activeOpacity={0.8}
            onPress={() => closeJob(job?.id)}
          >
            <Text style={styles.closeJobBtnText}>{t("completed", "Completed")}</Text>
          </TouchableOpacity>
        </View>
      ) : !isEmployer ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.applyBtnPrimary, isApplied && styles.appliedBtnDisabled]}
            disabled={isApplied}
            activeOpacity={0.8}
            onPress={() => setShowCallModal(true)}
          >
            <Ionicons name={isApplied ? "checkmark" : "send"} size={normalize(16)} color="#ffffff" style={{ marginRight: normalize(6) }} />
            <Text style={styles.applyBtnPrimaryText}>
              {isApplied ? String(t("applied", "APPLIED")).toUpperCase() : t("applyNow", "APPLY NOW")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtnOutline} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={normalize(16)} color="#1d4ed8" style={{ marginRight: normalize(6) }} />
            <Text style={styles.shareBtnOutlineText}>{t("share", "SHARE")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <CallbackModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={async (timeSlot) => {
          try {
            const targetJobId = job?.id || jobId;
            await dispatch(
              applyJob({ jobId: targetJobId, preferredCallTime: timeSlot }),
            ).unwrap();
            dispatch(fetchApplicationHistory());

            const isFromSaved =
              Boolean(route?.params?.isSaved) ||
              Boolean(job?.saved) ||
              Boolean(job?.is_saved) ||
              (savedJobs || []).some((sj) => String(sj.id || sj.job_post_id) === String(targetJobId));

            if (isFromSaved && targetJobId) {
              try {
                await dispatch(toggleSaveJob(targetJobId)).unwrap();
              } catch (e) {}
              dispatch(fetchSavedJobs());
            }

            return true;
          } catch (err) {
            Alert.alert(
              t("jobDetails.applyError", "Application Error"),
              err || t("jobDetails.failedToApply", "Failed to apply to job"),
            );
            return false;
          }
        }}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  backBtnText: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
  },
  scrollContent: {
    padding: normalize(16),
    paddingBottom: normalize(100),
    gap: normalize(14),
  },

  // Saved Notice Banner
  savedNoticeBanner: {
    backgroundColor: "#eff6ff",
    borderRadius: normalize(14),
    padding: normalize(14),
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(12),
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  savedNoticeIconWrap: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
  },
  savedNoticeTextWrap: {
    flex: 1,
  },
  savedNoticeTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(2),
  },
  savedNoticeSub: {
    fontSize: normalize(11.5),
    fontWeight: "500",
    color: "#475569",
    lineHeight: normalize(16),
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    padding: normalize(16),
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: normalize(12),
  },
  heroIconBox: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(14),
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: normalize(14),
  },
  heroInfoWrap: {
    flex: 1,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(2),
  },
  companyNameText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  jobTitleText: {
    fontSize: normalize(14.5),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(8),
  },
  metaRowInfo: {
    gap: normalize(4),
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  metaLabel: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 0.3,
  },
  metaValueBlue: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#153e69",
    marginLeft: normalize(4),
  },
  metaValueGreen: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#16a34a",
    marginLeft: normalize(4),
  },

  // Grid Container
  gridContainer: {
    gap: normalize(10),
  },
  gridRow: {
    flexDirection: "row",
    gap: normalize(10),
  },
  gridCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    padding: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gridIconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(12),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  gridTextContainer: {
    flex: 1,
  },
  gridLabel: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#64748b",
    marginBottom: normalize(2),
  },
  gridValue: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: normalize(16),
  },

  // Sections
  sectionContainer: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    padding: normalize(16),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionTitleUnderline: {
    width: normalize(32),
    height: 3,
    backgroundColor: "#153e69",
    borderRadius: 2,
    marginTop: normalize(4),
    marginBottom: normalize(10),
  },
  bodyDescription: {
    fontSize: normalize(13),
    color: "#475569",
    lineHeight: normalize(19),
    fontWeight: "500",
  },
  requirementList: {
    gap: normalize(8),
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  requirementText: {
    fontSize: normalize(12.5),
    color: "#334155",
    fontWeight: "600",
    flex: 1,
  },
  benefitWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(8),
  },
  benefitChip: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    borderRadius: normalize(8),
  },
  benefitText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#1d4ed8",
  },

  // Bottom Action Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    flexDirection: "row",
    gap: normalize(10),
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  applyBtnPrimary: {
    flex: 1,
    height: normalize(44),
    backgroundColor: "#1d4ed8",
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appliedBtnDisabled: {
    backgroundColor: "#94a3b8",
  },
  applyBtnPrimaryText: {
    color: "#ffffff",
    fontSize: normalize(13),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  shareBtnOutline: {
    height: normalize(44),
    paddingHorizontal: normalize(18),
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: "#1d4ed8",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtnOutlineText: {
    color: "#1d4ed8",
    fontSize: normalize(13),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  employerActionsRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    flexDirection: "row",
    gap: normalize(10),
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  viewTalentBtn: {
    flex: 1.5,
    backgroundColor: "#153e69",
    borderRadius: normalize(10),
    height: normalize(42),
    alignItems: "center",
    justifyContent: "center",
  },
  viewTalentBtnText: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#ffffff",
  },
  closeJobBtn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(10),
    height: normalize(42),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
  },
  closeJobBtnText: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#475569",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(10),
  },
  loadingText: {
    fontSize: normalize(13),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
});
