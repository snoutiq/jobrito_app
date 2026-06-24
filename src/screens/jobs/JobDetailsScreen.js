import React, { useEffect, useMemo } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";
import { applyJob } from "../../redux/slices/applicationSlice";
import { fetchJobDetails } from "../../redux/slices/jobSlice";

const requirements = [
  "Proven experience as a Pastry Chef in a 5-star hotel or Michelin-starred restaurant.",
  "Exceptional skills in sugar work, chocolate tempering, and complex dessert plating.",
  "Strong leadership and team management capabilities.",
  "Food hygiene certification (Level 3 minimum).",
];

const benefits = [
  "Private Health Cover",
  "Free Staff Meals",
  "Performance Bonus",
  "Training & Development",
];

const formatPostedTime = (postedDate) => {
  if (!postedDate) return "2 hours ago";
  const posted = new Date(postedDate);
  if (Number.isNaN(posted.getTime())) return "2 hours ago";
  const diffMs = Date.now() - posted.getTime();
  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

export default function JobDetailsScreen({ route }) {
  const dispatch = useDispatch();
  const { jobDetails, loading } = useSelector((state) => state.job);
  const applyLoading = useSelector((state) => state.application.loading);
  const jobId = route?.params?.jobId;

  const job = useMemo(() => {
    if (!jobDetails || jobDetails.id !== jobId) {
      return null;
    }
    return jobDetails;
  }, [jobDetails, jobId]);

  useEffect(() => {
    if (jobId) {
      dispatch(fetchJobDetails(jobId));
    }
  }, [dispatch, jobId]);

  const handleApply = async () => {
    if (!jobId) return;
    const result = await dispatch(applyJob(jobId));
    if (applyJob.fulfilled.match(result)) {
      Alert.alert("Application submitted", "Your application is now marked as New.");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${job?.title || "Job"} at ${job?.employer || "JobConnect"}`,
      });
    } catch (error) {
      Alert.alert("Unable to share", "Please try again.");
    }
  };

  const title = job?.title || "The Grand Patisserie";
  const employer = job?.employer || "Senior Pastry Chef";
  const location = job?.location || "Mayfair, London";
  const salary = job?.salary || "$45K - £62K/yr";
  const experience = job?.experience || "5+ years";
  const postedTime = formatPostedTime(job?.postedDate);

  if (!job) {
    return (
      <ScreenWrapper>
        <Text style={styles.loading}>Loading job details...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={styles.page}>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.brandAvatar}>
            <Ionicons name="restaurant" size={24} color={colors.primaryDark} />
          </View>
          <View style={styles.heroTextBlock}>
            <View style={styles.titleRow}>
              <Text style={styles.companyTitle}>{title}</Text>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            </View>
            <Text style={styles.positionTitle}>{employer}</Text>
            <View style={styles.tagRow}>
              <View style={[styles.tag, styles.tagUrgent]}>
                <Text style={styles.tagUrgentText}>Urgent Hiring</Text>
              </View>
              <View style={[styles.tag, styles.tagFullTime]}>
                <Text style={styles.tagFullTimeText}>Full Time</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons name="cash-outline" size={16} color={colors.success} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Salary</Text>
              <Text style={styles.metaValue}>{salary}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{location}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Experience</Text>
              <Text style={styles.metaValue}>{experience}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.metaIcon}>
              <Ionicons name="time-outline" size={16} color={colors.success} />
            </View>
            <View>
              <Text style={styles.metaLabel}>Posted</Text>
              <Text style={styles.metaValue}>{postedTime}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About the Role</Text>
        <Text style={styles.bodyText}>
          We are seeking a creative and experienced Senior Pastry Chef to lead our
          dessert department. You will be responsible for designing menus,
          managing a skilled team of pastry cooks, and ensuring high standards and
          quality in presentation and taste.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Requirements</Text>
        <View style={styles.requirementList}>
          {requirements.map((item) => (
            <View key={item} style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.requirementText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.imageCard}>
        <View style={styles.imagePlaceholder}>
          <View style={styles.dessertGlow} />
          <View style={styles.dessertPlate}>
            <View style={styles.dessertTop} />
            <View style={styles.dessertBase} />
          </View>
        </View>
        <Text style={styles.imageCaption}>Example of our signature dessert menu style</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benefits & Perks</Text>
        <View style={styles.benefitWrap}>
          {benefits.map((item) => (
            <View key={item} style={styles.benefitChip}>
              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Map</Text>
        <View style={styles.mapCard}>
          <View style={styles.mapTile} />
          <View style={styles.mapOverlay}>
            <View style={styles.mapPin}>
              <Ionicons name="location" size={18} color={colors.white} />
            </View>
            <Text style={styles.mapText}>Mayfair, London</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />

      <View style={styles.bottomBar}>
        <AppButton
          title="Apply Now"
          onPress={handleApply}
          loading={loading || applyLoading}
          style={styles.applyButton}
        />
        <Pressable onPress={handleShare} style={styles.chatButton}>
          <Ionicons name="share-social-outline" size={18} color={colors.primary} />
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 1,
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
    backgroundColor: "#F8FAFC",
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
    backgroundColor: "#0F172A",
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
    backgroundColor: "#D97706",
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
});
