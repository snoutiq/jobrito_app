import React, { useState, useEffect } from "react";
import { Alert, Share, StyleSheet, Text, View, Linking, TouchableOpacity, Platform, BackHandler, ActivityIndicator } from "react-native";
import { getJobDetails } from "../../services/jobApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";

// API fields from /my-jobs:
// id, title, status, location, date_posted, openings, type, applicants

const getStatusBadgeColors = (statusStr) => {
  if (!statusStr) return { bg: "rgba(242, 200, 121, 0.06)", text: "#f2c879", border: "rgba(242, 200, 121, 0.2)" };
  const s = statusStr.toUpperCase().trim();
  if (s === "PENDING" || s === "UNDER REVIEW" || s === "UNDER_REVIEW" || s === "NEW") {
    return { bg: "rgba(21, 62, 105, 0.06)", text: "#153e69", border: "rgba(21, 62, 105, 0.2)" };
  }
  if (s === "REJECT" || s === "REJECTED" || s === "DECLINED") {
    return { bg: "rgba(245, 127, 32, 0.06)", text: "#f57f20", border: "rgba(245, 127, 32, 0.2)" };
  }
  if (s === "ACTIVE" || s === "SHORTLISTED" || s === "CONTACTED") {
    return { bg: "rgba(21, 105, 62, 0.06)", text: "#15693e", border: "rgba(21, 105, 62, 0.2)" };
  }
  if (s === "CLOSED" || s === "JOB CLOSED") {
    return { bg: "rgba(10, 5, 4, 0.04)", text: "rgba(10, 5, 4, 0.6)", border: "rgba(10, 5, 4, 0.15)" };
  }
  return { bg: "rgba(242, 200, 121, 0.06)", text: "#f2c879", border: "rgba(242, 200, 121, 0.2)" };
};

export default function MyJobDetailsScreen({ navigation: navProp, route }) {
  const { t } = useTranslation();
  const navigation = navProp || useNavigation();
  
  console.log("📱 [MyJobDetailsScreen] Received Route Params:", JSON.stringify(route?.params, null, 2));

  const jobId = route?.params?.jobId || route?.params?.job?.id;
  const passedJob = route?.params?.job;

  const [fetchedJob, setFetchedJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);

  useEffect(() => {
    if (jobId && (!passedJob || !passedJob.description || !passedJob.location)) {
      setLoadingJob(true);
      getJobDetails(jobId)
        .then((res) => {
          const detail = res?.job || res?.data || (res?.id ? res : null);
          if (detail) setFetchedJob(detail);
        })
        .catch((err) => console.warn("Failed to load job details:", err))
        .finally(() => setLoadingJob(false));
    }
  }, [jobId, passedJob]);

  const job = fetchedJob || passedJob;

  const handleBackPress = React.useCallback(() => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Tabs");
    }
  }, [navigation]);

  React.useEffect(() => {
    const onBackPress = () => {
      handleBackPress();
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [handleBackPress]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${job?.title || "Job"} - ${job?.location || "Jobrito"}`,
      });
    } catch (error) {
      Alert.alert("Unable to share", "Please try again.");
    }
  };

  if (loadingJob || !job) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("jobDetails.title", "Job Details")}</Text>
        </View>
        <ScreenWrapper edges={["left", "right", "bottom"]}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 }}>
            <ActivityIndicator size="large" color="#153e69" />
            <Text style={[styles.loading, { marginTop: 12 }]}>{t("jobDetails.loading", "Loading job details...")}</Text>
          </View>
        </ScreenWrapper>
      </SafeAreaView>
    );
  }

  // ✅ Map only what API actually returns
  const title       = job?.title;
  const location    = job?.location;
  const jobType     = job?.type || "Full-time";
  const openings    = job?.openings;
  const datePosted  = job?.date_posted;
  const status      = job?.status;
  const applicants  = Array.isArray(job?.applicants) ? job.applicants : [];

  // Optional fields — only shown if API returns them in future
  const company     = job?.company || job?.business_name;
  const salary      = job?.salary || job?.salary_range;
  const experience  = job?.experience || job?.experience_range;
  const description = job?.description;

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

  const statusColors = getStatusBadgeColors(status);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("jobDetails.title", "Job Details")}</Text>
      </View>

      <ScreenWrapper edges={["left", "right", "bottom"]} contentStyle={styles.page}>

      {/* ── Hero Card ── */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.brandAvatar}>
            <Ionicons name="restaurant" size={24} color={colors.primaryDark} />
          </View>
          <View style={styles.heroTextBlock}>
            {/* Company — only if returned by API */}
            {company ? (
              <View style={styles.titleRow}>
                <Text style={styles.companyTitle}>{company}</Text>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              </View>
            ) : null}

            <Text style={styles.positionTitle}>{title}</Text>

            <View style={styles.tagRow}>
              {/* Job Type tag */}
              <View style={[styles.tag, styles.tagFullTime]}>
                <Text style={styles.tagFullTimeText}>{jobType}</Text>
              </View>
              {/* Status badge */}
              {status ? (
                <View style={[styles.tag, { backgroundColor: statusColors.bg, borderWidth: 1, borderColor: statusColors.border }]}>
                  <Text style={[styles.tagFullTimeText, { color: statusColors.text }]}>
                    {status.toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Posted date */}
          {datePosted ? (
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={12} color="rgba(10, 5, 4, 0.6)" />
              <Text style={styles.timeBadgeText}>{datePosted}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Meta Grid ── */}
        <View style={styles.metaGrid}>
          {/* Location — always shown if present */}
          {location ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>{t("jobDetails.location", "Location")}</Text>
                <Text style={styles.metaValue}>{location}</Text>
              </View>
            </View>
          ) : null}

          {/* Open Positions / Openings */}
          {openings != null ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="people-outline" size={16} color={colors.success} />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>{t("jobDetails.openPositions", "Open Positions")}</Text>
                <Text style={styles.metaValue}>{openings}</Text>
              </View>
            </View>
          ) : null}

          {/* Applicants count */}
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons name="person-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.metaItemContent}>
              <Text style={styles.metaLabel}>{t("jobDetails.applicants", "Applicants")}</Text>
              <Text style={styles.metaValue}>{applicants.length}</Text>
            </View>
          </View>

          {/* Salary — only if API returns it */}
          {salary ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="cash-outline" size={16} color={colors.success} />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>{t("jobDetails.salary", "Salary")}</Text>
                <Text style={styles.metaValue}>{salary}</Text>
              </View>
            </View>
          ) : null}

          {/* Experience — only if API returns it */}
          {experience ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>{t("jobDetails.experience", "Experience")}</Text>
                <Text style={styles.metaValue}>{experience}</Text>
              </View>
            </View>
          ) : null}

          {/* Conditional extras — only if API returns them */}
          {job?.contract_duration ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>{t("jobDetails.contract", "Contract")}</Text>
                <Text style={styles.metaValue}>{job.contract_duration}</Text>
              </View>
            </View>
          ) : null}

          {job?.visa_assistance ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="card-outline" size={16} color={colors.success} />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>{t("jobDetails.visaAssistance", "Visa Assistance")}</Text>
                <Text style={styles.metaValue}>{t("jobDetails.available", "Available")}</Text>
              </View>
            </View>
          ) : null}

          {job?.accommodation_available ? (
            <View style={styles.metaItem}>
              <View style={styles.metaIcon}>
                <Ionicons name="home-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.metaItemContent}>
                <Text style={styles.metaLabel}>{t("jobDetails.accommodation", "Accommodation")}</Text>
                <Text style={styles.metaValue}>{t("jobDetails.provided", "Provided")}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Description — only if API returns it ── */}
      {description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("jobDetails.aboutRole", "About the Role")}</Text>
          <Text style={styles.bodyText}>{description}</Text>
        </View>
      ) : null}

      {/* ── Requirements ── */}
      {jobRequirements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("jobDetails.keyRequirements", "Key Requirements")}</Text>
          <View style={styles.requirementList}>
            {jobRequirements.map((item) => (
              <View key={item} style={styles.requirementRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.requirementText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Benefits ── */}
      {jobBenefits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("jobDetails.benefitsPerks", "Benefits & Perks")}</Text>
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
        <AppButton
          title={t("shareJob", "Share Job")}
          onPress={handleShare}
          style={styles.applyButton}
        />
      </View>
      </ScreenWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 6 : 10,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.1)",
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0a0504",
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
    fontSize: 15,
    fontWeight: "900",
  },
  positionTitle: {
    color: colors.text,
    fontSize: 13,
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
  tagFullTime: {
    backgroundColor: "#EEF4FF",
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
  metaItemContent: {
    flex: 1,
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
