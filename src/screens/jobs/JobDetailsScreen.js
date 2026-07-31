import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";
import { applyJob } from "../../redux/slices/applicationSlice";
import { fetchJobDetails } from "../../redux/slices/jobSlice";
import CallbackModal from "../../components/common/CallbackModal";

const formatPostedTime = (postedDate, t) => {
  if (!postedDate) return t("jobDetails.recently", "Recently");
  const posted = new Date(postedDate);
  if (Number.isNaN(posted.getTime()))
    return t("jobDetails.recently", "Recently");
  const diffMs = Date.now() - posted.getTime();
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return t("jobDetails.today", "Today");
  if (diffDays === 1) return t("jobDetails.oneDayAgo", "1 day ago");
  return t("jobDetails.daysAgo", "{{count}} days ago", { count: diffDays });
};

const getDisplayStatusText = (statusStr, t) => {
  if (!statusStr) return "";
  const s = statusStr.toUpperCase().trim();
  if (s === "NEW" || s === "UNDER REVIEW" || s === "UNDER_REVIEW") {
    return t("status.underProcess", "UNDER PROCESS");
  }
  if (s === "REJECT" || s === "REJECTED" || s === "DECLINED") {
    return t("status.discussionPending", "DISCUSSION PENDING");
  }
  if (s === "SHORTLISTED") {
    return t("status.shortlisted", "SHORTLISTED");
  }
  if (s === "CONTACTED") {
    return t("status.contacted", "CONTACTED");
  }
  if (s === "JOB CLOSED") {
    return t("status.jobClosed", "JOB CLOSED");
  }
  return t(`status.${s.toLowerCase()}`, s);
};

const getStatusBadgeColors = (statusStr) => {
  if (!statusStr)
    return {
      bg: "rgba(242, 200, 121, 0.06)",
      text: "#f2c879",
      border: "rgba(242, 200, 121, 0.2)",
    };
  const s = statusStr.toUpperCase().trim();
  if (s === "NEW" || s === "UNDER REVIEW" || s === "UNDER_REVIEW") {
    return {
      bg: "rgba(21, 62, 105, 0.06)",
      text: "#153e69",
      border: "rgba(21, 62, 105, 0.2)",
    };
  }
  if (s === "REJECT" || s === "REJECTED" || s === "DECLINED") {
    return {
      bg: "rgba(245, 127, 32, 0.06)",
      text: "#f57f20",
      border: "rgba(245, 127, 32, 0.2)",
    };
  }
  if (s === "SHORTLISTED" || s === "CONTACTED") {
    return {
      bg: "rgba(21, 105, 62, 0.06)",
      text: "#15693e",
      border: "rgba(21, 105, 62, 0.2)",
    };
  }
  if (s === "JOB CLOSED") {
    return {
      bg: "rgba(10, 5, 4, 0.04)",
      text: "rgba(10, 5, 4, 0.6)",
      border: "rgba(10, 5, 4, 0.15)",
    };
  }
  return {
    bg: "rgba(242, 200, 121, 0.06)",
    text: "#f2c879",
    border: "rgba(242, 200, 121, 0.2)",
  };
};

export default function JobDetailsScreen({ route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { jobDetails, loading, applyingJobId } = useSelector(
    (state) => state.job,
  );
  const { history: applicationHistory, loading: applyLoading } = useSelector(
    (state) => state.application,
  );
  const jobId = route?.params?.jobId;
  const passedJob = route?.params?.job;
  const [showCallModal, setShowCallModal] = useState(false);

  const job = useMemo(() => {
    if (passedJob && String(passedJob.id) === String(jobId)) {
      return passedJob;
    }
    if (!jobDetails || String(jobDetails.id) !== String(jobId)) {
      return null;
    }
    return jobDetails;
  }, [passedJob, jobDetails, jobId]);

  useEffect(() => {
    if (jobId && !passedJob) {
      dispatch(fetchJobDetails(jobId));
    }
  }, [dispatch, jobId, passedJob]);

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

  const title = job?.title;
  const company = job?.company;
  const location = job?.location;
  const salary = job?.salary;
  const experience =
    job?.experience ||
    job?.experience_range ||
    t("jobDetails.notSpecified", "Not Specified");
  const postedTime = formatPostedTime(job?.postedDate || job?.created_at, t);
  const jobRequirements = Array.isArray(job?.requirements)
    ? job.requirements.filter(Boolean)
    : typeof job?.requirements === "string"
      ? job.requirements
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean)
      : [];
  const jobBenefits = Array.isArray(job?.benefits)
    ? job.benefits.filter(Boolean)
    : typeof job?.benefits === "string"
      ? job.benefits
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean)
      : [];

  if (!job) {
    return (
      <ScreenWrapper edges={["left", "right", "bottom"]}>
        <Text style={styles.loading}>
          {t("jobDetails.loading", "Loading job details...")}
        </Text>
      </ScreenWrapper>
    );
  }

  const isApplied =
    job?.applied ||
    (applicationHistory || []).some(
      (app) => String(app.jobId) === String(job?.id || jobId),
    ) ||
    false;
  const isApplying = applyingJobId === job?.id || applyLoading;

  const isReferral = job?.category === "referral" || job?.is_referral;
  const effectiveRoleSource =
    job?.submitted_by_role ||
    job?.posted_by_role ||
    job?.active_role ||
    job?.user_role ||
    job?.creator?.role ||
    job?.creator?.active_role ||
    "";
  const effectiveRole = effectiveRoleSource.toLowerCase();
  const normalizedRole = effectiveRole.replace(/[\s_]/g, ""); // "job_seeker" -> "jobseeker"
  const isChefOrJobSeeker = [
    "chef",
    "jobseeker",
    "job_seeker",
    "talent",
    "candidate",
  ].includes(normalizedRole);
  const showApply = !isReferral && !isChefOrJobSeeker;

  const app = (applicationHistory || []).find(
    (a) => String(a.jobId) === String(job?.id || jobId),
  );
  const statusText = app ? getDisplayStatusText(app.status, t) : null;
  const statusColors = app ? getStatusBadgeColors(app.status) : null;

  const handleCall = () => {
    const phoneNumber =
      job?.creator?.mobile_number ||
      job?.mobile_number ||
      job?.phone ||
      job?.contact_phone ||
      job?.creator?.phone ||
      "+919876543210";
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      Alert.alert(
        t("error", "Error"),
        (t("couldNotOpenDialer", "Could not open dialer: ") ||
          "Could not open dialer: ") + err.message,
      );
    });
  };

  return (
    <ScreenWrapper
      edges={["left", "right", "bottom"]}
      contentStyle={styles.page}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.brandAvatar}>
            <Ionicons name="restaurant" size={24} color={colors.primaryDark} />
          </View>
          <View style={styles.heroTextBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.companyTitle}>{company}</Text>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
              />
            </View>
            <Text style={styles.positionTitle}>{title}</Text>
            <View style={styles.tagRow}>
              {statusText && (
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor: statusColors.bg,
                      borderWidth: 1,
                      borderColor: statusColors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: statusColors.text,
                      fontSize: 9,
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: 0.3,
                    }}
                  >
                    {statusText}
                  </Text>
                </View>
              )}
              <View style={[styles.tag, styles.tagFullTime]}>
                <Text style={styles.tagFullTimeText}>
                  {t("jobDetails.fullTime", "Full Time")}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.timeBadge}>
            <Ionicons
              name="time-outline"
              size={12}
              color="rgba(10, 5, 4, 0.6)"
            />
            <Text style={styles.timeBadgeText}>{postedTime}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons name="cash-outline" size={16} color={colors.success} />
            </View>
            <View style={styles.metaItemContent}>
              <Text style={styles.metaLabel}>
                {t("jobDetails.salary", "Salary")}
              </Text>
              <Text style={styles.metaValue}>{salary}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.metaItemContent}>
              <Text style={styles.metaLabel}>
                {t("jobDetails.location", "Location")}
              </Text>
              <Text style={styles.metaValue}>{location}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons
                name="briefcase-outline"
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.metaItemContent}>
              <Text style={styles.metaLabel}>
                {t("jobDetails.experience", "Experience")}
              </Text>
              <Text style={styles.metaValue}>{experience}</Text>
            </View>
          </View>
          {job?.contract_duration ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>
                  {t("jobDetails.contract", "Contract")}
                </Text>
                <Text style={styles.metaValue}>{job.contract_duration}</Text>
              </View>
            </View>
          ) : null}
          {job?.visa_assistance ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons
                  name="card-outline"
                  size={16}
                  color={colors.success}
                />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>
                  {t("jobDetails.visaAssistance", "Visa Assistance")}
                </Text>
                <Text style={styles.metaValue}>
                  {t("jobDetails.available", "Available")}
                </Text>
              </View>
            </View>
          ) : null}
          {job?.accommodation_available ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons
                  name="home-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>
                  {t("jobDetails.accommodation", "Accommodation")}
                </Text>
                <Text style={styles.metaValue}>
                  {t("jobDetails.provided", "Provided")}
                </Text>
              </View>
            </View>
          ) : null}
          {job?.open_positions ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={colors.success}
                />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>
                  {t("jobDetails.openPositions", "Open Positions")}
                </Text>
                <Text style={styles.metaValue}>{job.open_positions}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("jobDetails.aboutRole", "About the Role")}
        </Text>
        <Text style={styles.bodyText}>{job?.description}</Text>
      </View>

      {jobRequirements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("jobDetails.keyRequirements", "Key Requirements")}
          </Text>
          <View style={styles.requirementList}>
            {jobRequirements.map((item) => (
              <View key={item} style={styles.requirementRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.requirementText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {jobBenefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("jobDetails.benefitsPerks", "Benefits & Perks")}
          </Text>
          <View style={styles.benefitWrap}>
            {jobBenefits.map((item) => (
              <View key={item} style={styles.benefitChip}>
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.bottomSpacer} />

      <View style={styles.bottomBar}>
        {showApply ? (
          <AppButton
            title={
              isApplied
                ? t("jobDetails.applied", "✓ Applied")
                : t("jobDetails.applyNow", "Apply Now")
            }
            onPress={() => setShowCallModal(true)}
            loading={isApplying}
            disabled={isApplied || isApplying}
            style={[
              styles.applyButton,
              isApplied && { backgroundColor: "rgba(10, 5, 4, 0.4)" },
            ]}
          />
        ) : (
          <AppButton
            title={t("jobs.callNow", "Call Now")}
            onPress={handleCall}
            style={[styles.applyButton, { backgroundColor: "#f57f20" }]}
          />
        )}
        <Pressable onPress={handleShare} style={styles.chatButton}>
          <Ionicons
            name="share-social-outline"
            size={18}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <CallbackModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={async (timeSlot) => {
          try {
            await dispatch(
              applyJob({ jobId: job.id, preferredCallTime: timeSlot }),
            ).unwrap();
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  loading: {
    color: colors.mutedText,
    textAlign: "center",
    marginTop: 40,
  },
  heroCard: {
    gap: 14,
  },
  heroTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  brandAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoftBorder,
  },
  heroTextBlock: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  companyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  positionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagUrgent: {
    backgroundColor: "#FFF2E8",
  },
  tagFullTime: {
    backgroundColor: "#EEF4FF",
  },
  tagUrgentText: {
    color: "#C2410C",
    fontSize: 11,
    fontWeight: "800",
  },
  tagFullTimeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#f2f2f3",
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
  },
  metaValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  bodyText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  requirementList: {
    gap: 10,
  },
  requirementRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  requirementText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  imageCard: {
    gap: 8,
  },
  imagePlaceholder: {
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0a0504",
    alignItems: "center",
    justifyContent: "center",
  },
  dessertGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    top: -60,
    right: -40,
  },
  dessertPlate: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  dessertTop: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F59E0B",
    opacity: 0.95,
    position: "absolute",
    top: 20,
  },
  dessertBase: {
    width: 90,
    height: 46,
    borderRadius: 24,
    backgroundColor: "#f2c879",
    position: "absolute",
    bottom: 18,
  },
  imageCaption: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },
  benefitWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  benefitChip: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoftBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  benefitText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  mapCard: {
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#DDE7F5",
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapTile: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#DDE7F5",
    opacity: 0.95,
  },
  mapOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mapPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
  },
  mapText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bottomSpacer: {
    height: 6,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  applyButton: {
    flex: 1,
  },
  chatButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  metaItemContent: {
    flex: 1,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(10, 5, 4, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
});
