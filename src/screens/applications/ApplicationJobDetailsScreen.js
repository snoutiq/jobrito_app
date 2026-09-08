import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Dimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

export default function ApplicationJobDetailsScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [canShowMore, setCanShowMore] = useState(false);

  const handleTextLayout = (e) => {
    if (e.nativeEvent.lines.length > 3) {
      setCanShowMore(true);
    }
  };

  const params = route?.params || {};
  const rawJob = params.job || null;
  const rawApp = params.application || params.item || null;  

  const getProp = (...keys) => {
    for (const key of keys) {
      if (rawJob && rawJob[key] !== undefined && rawJob[key] !== null) return rawJob[key];
      if (rawApp && rawApp[key] !== undefined && rawApp[key] !== null) return rawApp[key];
      if (params && params[key] !== undefined && params[key] !== null) return params[key];
    }
    return null;
  };

  const formatCreatedDate = (rawDate) => {
    if (!rawDate) return "";
    if (typeof rawDate === "string" && !rawDate.includes("T") && !rawDate.includes("-")) {
      return rawDate;
    }
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return String(rawDate);
    const options = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  const companyName =
    getProp("company", "company_name", "business_name", "employer") ||
    "Sheriff’s Kitchen";

  const jobTitle =
    getProp("title", "job_title", "name") ||
    "Sous Chef";

  const rawCreatedAt =
    getProp("created_at", "createdAt", "created", "appliedOn", "applied_at", "applied_at_formatted");
    

  const postedDate =
    formatCreatedDate(rawCreatedAt) ||
    getProp("created_at_formatted", "posted_date", "postedOn") ||
    "15 May 2025";

  const rawSalaryProp = String(getProp("salary", "salary_range", "offered_salary") || "").trim();
  const salaryVal = (!rawSalaryProp || rawSalaryProp.toLowerCase().includes("stipend"))
    ? t("bestInIndustry", "Best in Industry")
    : rawSalaryProp;
  const salarySub = getProp("salary_sub") || "Competitive package";

  const locationVal =
    getProp("location", "city", "country") ||
    "Mapusa, Goa,\nIndia";

  const rawExperience =
    getProp("experience", "experience_range", "experience_level") ||
    "Mid Level";

  const experienceVal = String(rawExperience).trim();
  const hasSubInVal =
    experienceVal.includes("(") ||
    experienceVal.includes("Years") ||
    experienceVal.includes("year");
  const experienceSub = hasSubInVal ? "" : getProp("experience_sub") || "";

  const employmentTypeVal =
    getProp("job_type", "type", "employment_type") ||
    "Full Time";

  const rawCreator = getProp("posted_by", "postedby", "posted_by_user", "created_by_user", "created_by", "creator");
  const creatorName = typeof rawCreator === "string" ? rawCreator : (rawCreator?.company || rawCreator?.full_name || rawCreator?.name || rawCreator?.username || companyName || "Employer");

  const rawRole = String(
    (typeof rawCreator === "object" ? (rawCreator?.active_role || rawCreator?.active_profile || rawCreator?.role || rawCreator?.user_role) : "") ||
    getProp("active_role", "posted_by_role", "submitted_by_role", "user_role", "role") ||
    ""
  ).toLowerCase().replace(/[\s_]/g, "");

  const isAdmin =
    Boolean(getProp("is_admin_created")) ||
    rawRole === "admin" ||
    (typeof rawCreator === "object" && (rawCreator?.role === "admin" || rawCreator?.active_role === "admin"));

  const isTrainingProvider =
    rawRole === "trainingprovider" ||
    rawRole === "training_provider";

  const isReferral =
    Boolean(getProp("is_referral")) ||
    getProp("_type") === "referral_job" ||
    getProp("category") === "referral";

  const isChef = rawRole === "chef" || (typeof rawCreator === "object" && (rawCreator?.role === "chef" || rawCreator?.active_role === "chef"));

  const isTraining = Boolean(
    getProp("is_training") ||
    getProp("_type") === "training_opportunity" ||
    getProp("category") === "training"
  );

  const postedByRoleLabel = isAdmin
    ? t("admin", "Admin")
    : isTrainingProvider
    ? t("trainingProvider", "ADMIN")
    : isReferral
    ? t("referral", "Referral")
    : isChef
    ? t("chef", "Chef")
    : t("employer", "Employer");

  const postedByVal = `${t("postedBy", "Posted by")}: ${postedByRoleLabel}`;

  const fullDescription =
    getProp("description", "job_description", "summary") ||
    "No description available for this role.";

  const rawAppliedAt = getProp("applied_at", "appliedOn", "created_at");

  const rawFormatted = getProp("applied_at_formatted");
  const appliedDateStr =
    (rawFormatted ? String(rawFormatted).split(",")[0] : null) ||
    formatCreatedDate(rawAppliedAt) ||
    "";

  const rawViewedAt = getProp("viewed_at", "viewedOn", "viewed_date");

  const currentStatus = String(
    getProp("application_status", "status", "app_status") || "applied"
  ).toLowerCase().trim();

  const isViewedActive = Boolean(
    rawViewedAt ||
    getProp("viewed_at_formatted") ||
    getProp("is_viewed") ||
    ["viewed", "shortlisted", "contacted", "rejected", "hired", "accepted"].includes(currentStatus)
  );

  const isShortlisted = currentStatus === "shortlisted";
  const isContacted = currentStatus === "contacted";
  const isRejected = currentStatus === "rejected";
  const isHired = currentStatus === "hired" || currentStatus === "accepted";
  const hasActionStatus = isShortlisted || isContacted || isRejected || isHired;

  const viewedDateStr = isViewedActive
    ? (getProp("viewed_at_formatted") || formatCreatedDate(rawViewedAt) || "-")
    : "-";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${jobTitle} at ${companyName}\nCheck out this job on Jobrito! https://jobrito.com`,
      });
    } catch (error) {
      Alert.alert(t("error", "Error"), t("unableToShare", "Unable to share job."));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={normalize(22)} color="#0f2942" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]} numberOfLines={1}>
            {t("myApplicationsJobDetails", "My Applications - Job Details")}
          </Text>
        </View>

        <TouchableOpacity onPress={handleShare} style={styles.headerShareBtn} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={normalize(20)} color="#153e69" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Success Banner */}
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={normalize(20)} color="#16a34a" />
          <Text style={styles.successBannerText}>
            {t("successfullyAppliedMsg", "You have successfully applied for this job.")}
          </Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroLeftWrap}>
            <View style={styles.heroTitleWrap}>
              {!isTraining && (
                <View style={styles.companyRow}>
                  <Text style={styles.companyNameText} numberOfLines={3}>{companyName}</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={normalize(15)}
                    color="#153e69"
                    style={{ marginLeft: normalize(4) }}
                  />
                </View>
              )}
              <Text style={styles.jobTitleText} numberOfLines={3}>{jobTitle}</Text>
            </View>
          </View>

          <View style={styles.postedWrap}>
            <View style={styles.postedHeaderRow}>
              <Ionicons name="calendar-outline" size={normalize(13)} color="#64748b" />
              <Text style={styles.postedLabel}>{t("postedOn", "Posted on")}</Text>
            </View>
            <Text style={styles.postedDateText}>{postedDate}</Text>
          </View>
        </View>

        {/* 2x2 Grid Cards */}
        <View style={styles.gridContainer}>
          {/* Row 1: Salary & Location */}
          <View style={styles.gridRow}>
            {!isTraining && (
              <View style={styles.gridCard}>
                <View style={styles.gridIconCircle}>
                  <Ionicons name="wallet-outline" size={normalize(18)} color="#153e69" />
                </View>
                <View style={styles.gridTextContainer}>
                  <Text style={styles.gridLabel}>{t("salary", "Salary")}</Text>
                  <Text style={styles.gridValueBold} numberOfLines={3}>{salaryVal}</Text>
                  {Boolean(salarySub) && <Text style={styles.gridSubText}>{salarySub}</Text>}
                </View>
              </View>
            )}

            <View style={styles.gridCard}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="location-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("location", "Location")}</Text>
                <Text style={styles.gridValueBold} numberOfLines={3}>{locationVal}</Text>
              </View>
            </View>
          </View>

          {/* Row 2: Experience & Employment Type */}
          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="briefcase-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("experience", "Experience")}</Text>
                <Text style={styles.gridValueBold} numberOfLines={3}>{experienceVal}</Text>
                {Boolean(experienceSub) && <Text style={styles.gridSubText}>{experienceSub}</Text>}
              </View>
            </View>

            <View style={styles.gridCard}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="person-outline" size={normalize(18)} color="#153e69" />
              </View>
              <View style={styles.gridTextContainer}>
                <Text style={styles.gridLabel}>{t("employmentTypeLabel", "Employment Type")}</Text>
                <Text style={styles.gridValueBold} numberOfLines={3}>{employmentTypeVal}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Full Width Card: Posted by */}
        <View style={styles.fullWidthCard}>
          <View style={styles.fullWidthIconCircle}>
            <Ionicons name="business-outline" size={normalize(18)} color="#153e69" />
          </View>
          <Text style={styles.fullWidthText} numberOfLines={3}>{postedByVal}</Text>
        </View>

        {/* Job Description Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>{t("jobDescription", "Job Description")}</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={showFullDesc ? undefined : 4}
            onTextLayout={handleTextLayout}
          >
            {fullDescription}
          </Text>
          {canShowMore && (
            <TouchableOpacity
              onPress={() => setShowFullDesc((prev) => !prev)}
              activeOpacity={0.7}
              style={styles.showMoreBtn}
            >
              <Text style={styles.showMoreText}>
                {showFullDesc ? t("showLess", "Show Less") : t("showMore", "Show More")}
              </Text>
              <Ionicons
                name={showFullDesc ? "chevron-up" : "chevron-down"}
                size={normalize(15)}
                color="#153e69"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Application Status Stepper Timeline */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>{t("applicationStatus", "Application Status")}</Text>

          <View style={styles.timelineStepperContainer}>
            {/* Step 1: Applied */}
            <View style={styles.stepperItem}>
              <View style={[styles.stepperNode, styles.stepperNodeActive]}>
                <Ionicons name="checkmark" size={normalize(14)} color="#16a34a" />
              </View>
              <Text style={[styles.stepperLabel, styles.stepperLabelActive]}>
                {t("status.applied", "Applied")}
              </Text>
              <Text style={styles.stepperDate}>{appliedDateStr}</Text>
            </View>

            {/* Connecting Line 1 */}
            <View style={isViewedActive ? styles.lineSolidGreen : styles.lineSolidGray} />

            {/* Step 2: Viewed */}
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperNode,
                  isViewedActive
                    ? (isShortlisted || isContacted ? styles.stepperNodeActive : styles.stepperNodeCurrent)
                    : styles.stepperNodeDefault,
                ]}
              >
                <Ionicons
                  name={isShortlisted || isContacted ? "checkmark" : "eye-outline"}
                  size={normalize(14)}
                  color={isViewedActive ? (isShortlisted || isContacted ? "#16a34a" : "#153e69") : "#94a3b8"}
                />
              </View>
              <Text
                style={[
                  styles.stepperLabel,
                  isViewedActive
                    ? (isShortlisted || isContacted ? styles.stepperLabelActive : styles.stepperLabelCurrent)
                    : styles.stepperLabelDefault,
                ]}
              >
                {t("status.viewed", "Viewed")}
              </Text>
              <Text style={styles.stepperDate}>{viewedDateStr}</Text>
            </View>

            {/* Connecting Line 2 */}
            <View
              style={
                isShortlisted || isContacted
                  ? styles.lineSolidGreen
                  : (isRejected ? styles.lineSolidRed : (isViewedActive ? styles.lineDashedBlue : styles.lineSolidGray))
              }
            />

            {/* Step 3: In Review / Shortlisted */}
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperNode,
                  isContacted
                    ? styles.stepperNodeActive
                    : isShortlisted
                    ? styles.stepperNodeCurrent
                    : styles.stepperNodeDefault,
                ]}
              >
                <Ionicons
                  name={
                    isContacted
                      ? "checkmark"
                      : isShortlisted
                      ? "heart-outline"
                      : "time-outline"
                  }
                  size={normalize(14)}
                  color={
                    isContacted
                      ? "#16a34a"
                      : isShortlisted
                      ? "#153e69"
                      : "#94a3b8"
                  }
                />
              </View>
              <Text
                style={[
                  styles.stepperLabel,
                  isContacted
                    ? styles.stepperLabelActive
                    : isShortlisted
                    ? styles.stepperLabelCurrent
                    : styles.stepperLabelDefault,
                ]}
              >
                {isShortlisted ? t("shortlisted", "Shortlisted") : t("status.inReview", "In Review")}
              </Text>
              <Text style={styles.stepperDate}>-</Text>
            </View>

            {/* Connecting Line 3 */}
            <View
              style={
                isContacted
                  ? styles.lineSolidGreen
                  : (isRejected ? styles.lineSolidRed : styles.lineSolidGray)
              }
            />

            {/* Step 4: Contacted / Rejected */}
            <View style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperNode,
                  isRejected
                    ? styles.stepperNodeRed
                    : isContacted
                    ? styles.stepperNodeCurrent
                    : styles.stepperNodeDefault,
                ]}
              >
                <Ionicons
                  name={isRejected ? "close-circle-outline" : "call-outline"}
                  size={normalize(14)}
                  color={isRejected ? "#dc2626" : isContacted ? "#153e69" : "#94a3b8"}
                />
              </View>
              <Text
                style={[
                  styles.stepperLabel,
                  isRejected
                    ? styles.stepperLabelRed
                    : isContacted
                    ? styles.stepperLabelCurrent
                    : styles.stepperLabelDefault,
                ]}
              >
                {isRejected ? t("notAMatch", "Not A Match") : t("status.contacted", "Contacted")}
              </Text>
              <Text style={styles.stepperDate}>-</Text>
            </View>
          </View>
        </View>

        {/* What's Next? Notice Box */}
        <View style={styles.whatsNextCard}>
          <View style={styles.whatsNextIconCircle}>
            <Ionicons name="information-circle-outline" size={normalize(24)} color="#153e69" />
          </View>
          <View style={styles.whatsNextTextWrap}>
            <Text style={styles.whatsNextTitle}>{t("whatsNextTitle", "What's Next?")}</Text>
            <Text style={styles.whatsNextSub}>
              {t("whatsNextNotice", "Once the employer takes action on your application. You will be notified")}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.appliedBtn, { flex: 1 }]} disabled activeOpacity={1}>
          <Ionicons name="checkmark" size={normalize(16)} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.appliedBtnText}>{t("applied", "Applied")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: {
    padding: normalize(2),
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f2942",
    letterSpacing: 0.2,
  },
  scrollContent: {
    padding: normalize(16),
    paddingBottom: normalize(95),
    gap: normalize(14),
  },

  // Success Banner
  successBanner: {
    backgroundColor: "#eaf7ec",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
  },
  successBannerText: {
    fontSize: normalize(12.5),
    fontWeight: "600",
    color: "#1b5e20",
    flex: 1,
  },

  // Hero Section
  heroSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: normalize(4),
    gap: normalize(10),
  },
  heroLeftWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    flex: 1,
  },
  logoCircle: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
    backgroundColor: "#eff4fa",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitleWrap: {
    flex: 1,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  companyNameText: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f2942",
    flexShrink: 1,
  },
  jobTitleText: {
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#475569",
    marginTop: normalize(2),
  },
  postedWrap: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  postedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(4),
  },
  postedLabel: {
    fontSize: normalize(11),
    color: "#64748b",
    fontWeight: "500",
  },
  postedDateText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#0f2942",
    marginTop: normalize(2),
  },

  // 2x2 Grid Cards
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
    borderColor: "#eaedf1",
  },
  gridIconCircle: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(10),
    backgroundColor: "#eff4fa",
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
  gridValueBold: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#0f2942",
    lineHeight: normalize(16),
  },
  gridSubText: {
    fontSize: normalize(10),
    color: "#64748b",
    fontWeight: "500",
    marginTop: 1,
  },

  // Full Width Card
  fullWidthCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    padding: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eaedf1",
  },
  fullWidthIconCircle: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(10),
    backgroundColor: "#eff4fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  fullWidthText: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#0f2942",
    flex: 1,
    lineHeight: normalize(16),
  },

  // Section Wraps
  sectionWrap: {
    marginTop: normalize(4),
  },
  sectionHeading: {
    fontSize: normalize(15.5),
    fontWeight: "800",
    color: "#0f2942",
    marginBottom: normalize(8),
  },
  descriptionText: {
    fontSize: normalize(12.5),
    color: "#475569",
    lineHeight: normalize(18),
    fontWeight: "500",
  },
  showMoreBtn: {
    marginTop: normalize(6),
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(4),
    alignSelf: "flex-start",
    paddingVertical: normalize(4),
  },
  showMoreText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#153e69",
  },

  // Timeline Stepper
  timelineStepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(10),
    borderWidth: 1,
    borderColor: "#eaedf1",
    marginTop: normalize(2),
  },
  stepperItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
  },
  stepperNode: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(6),
  },
  stepperNodeActive: {
    backgroundColor: "#dcfce7",
  },
  stepperNodeCurrent: {
    backgroundColor: "#eff6ff",
    borderWidth: 1.5,
    borderColor: "#153e69",
  },
  stepperNodeRed: {
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#dc2626",
  },
  stepperNodeDefault: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(6),
  },
  stepperLabel: {
    fontSize: normalize(11),
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  stepperLabelActive: {
    color: "#16a34a",
  },
  stepperLabelCurrent: {
    color: "#153e69",
  },
  stepperLabelRed: {
    color: "#dc2626",
  },
  stepperLabelDefault: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 2,
    textAlign: "center",
  },
  stepperDate: {
    fontSize: normalize(9.5),
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  lineSolidGreen: {
    height: 2,
    flex: 0.4,
    backgroundColor: "#16a34a",
    marginTop: -normalize(20),
  },
  lineSolidRed: {
    height: 2,
    flex: 0.4,
    backgroundColor: "#dc2626",
    marginTop: -normalize(20),
  },
  lineDashedBlue: {
    height: 1,
    flex: 0.4,
    borderWidth: 1,
    borderColor: "#153e69",
    borderStyle: "dashed",
    marginTop: -normalize(20),
  },
  lineSolidGray: {
    height: 2,
    flex: 0.4,
    backgroundColor: "#e2e8f0",
    marginTop: -normalize(20),
  },

  // What's Next Card
  whatsNextCard: {
    backgroundColor: "#f0f6ff",
    borderRadius: normalize(14),
    padding: normalize(14),
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: normalize(10),
    marginTop: normalize(4),
  },
  whatsNextIconCircle: {
    marginTop: normalize(1),
  },
  whatsNextTextWrap: {
    flex: 1,
  },
  whatsNextTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: normalize(4),
  },
  whatsNextSub: {
    fontSize: normalize(11.5),
    fontWeight: "500",
    color: "#334155",
    lineHeight: normalize(16),
  },

  // Bottom Fixed Bar
  bottomBar: {
    position: "absolute",
    bottom: normalize(45),
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    flexDirection: "row",
    gap: normalize(12),
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  appliedBtn: {
    flex: 1,
    height: normalize(44),
    backgroundColor: "#cbd5e1",
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appliedBtnText: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#ffffff",
  },
  headerShareBtn: {
    padding: normalize(6),
    borderRadius: normalize(20),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
});
