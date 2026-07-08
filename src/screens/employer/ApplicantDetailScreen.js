import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { updateApplicantStatus, fetchEmployerDashboard } from "../../redux/slices/employerSlice";

const PRIMARY_GREEN = "#22C55E";

export default function ApplicantDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { applicantId, jobId } = route.params || {};

  // Retrieve the job and applicant details from the Redux store
  const selectedJob = useSelector((state) =>
    state.employer.submittedJobs.find((j) => j.id === jobId)
  );

  const applicant = selectedJob?.applicants?.find((a) => a.id === applicantId);

  if (!applicant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("talentDetails", "Talent Details")}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: "#64748B" }}>{t("applicantNotFound", "Applicant details not found.")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate dynamic header stats for this job
  const applicantsList = selectedJob?.applicants || [];
  const totalApplied = applicantsList.length;
  const shortlistedCount = applicantsList.filter((a) => a.status?.toLowerCase() === "shortlisted").length;
  const contactedCount = applicantsList.filter((a) => a.status?.toLowerCase() === "contacted").length;
  const rejectedCount = applicantsList.filter((a) => a.status?.toLowerCase() === "rejected").length;
  const pendingCount = applicantsList.filter((a) => a.status?.toLowerCase() === "new" || a.status?.toLowerCase() === "pending").length;

  const headerStatsText = `${totalApplied} ${t("applied")} | ${shortlistedCount} ${t("shortlisted")} | ${contactedCount} ${t("contacted")} | ${rejectedCount} ${t("rejected")} | ${pendingCount} ${t("pending")}`;

  const displayName = applicant.name || applicant.mobile_number || "";
  const displayCity = applicant.city || "";
  const displayExperience = applicant.experience_range || "--";
  const displayEmployer = applicant.current_employer || "--";
  const displayBio = applicant.bio || "";
  const displayCallback = applicant.preferred_callback_time || "--";
  const displayLanguage = applicant.preferred_language || "--";

  const handleCall = () => {
    const phone = applicant.mobile_number;
    if (!phone) {
      CustomAlert.show("Error", "Mobile number not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`)
      .then(() => {
        // Automatically update status to 'contacted' upon calling
        handleStatusUpdate("contacted");
      })
      .catch(() => {
        CustomAlert.show("Call unavailable", "Dialer could not be opened.");
      });
  };

  const handleStatusUpdate = async (status) => {
    try {
      const result = await dispatch(updateApplicantStatus({ applicationId: applicant.id, status })).unwrap();
      CustomAlert.show("Success", `Applicant status updated to: ${status}`);
      // Refresh dashboard to pull the fresh metrics and data
      dispatch(fetchEmployerDashboard());
    } catch (error) {
      console.error("Failed to update status:", error);
      CustomAlert.show("Error", error || "Failed to update status. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{displayName || t("applicantProfile")}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {selectedJob?.title || "Sales"} • {headerStatsText}
          </Text>
        </View>
      </View>
      <View style={styles.headerLine} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color="#94A3B8" />
            </View>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{displayName}</Text>
            {displayCity ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#64748B" />
                <Text style={styles.locationText}>{displayCity}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>85% {t("match", "Match")}</Text>
          </View>
        </View>

        {/* Info Grid (Experience and Employer) */}
        <View style={styles.infoGrid}>
          <View style={styles.infoGridCard}>
            <Text style={styles.infoGridLabel}>{t("experience_caps")}</Text>
            <Text style={styles.infoGridValue}>{displayExperience}</Text>
          </View>
          <View style={styles.infoGridCard}>
            <Text style={styles.infoGridLabel}>{t("currentEmployer_caps")}</Text>
            <Text style={styles.infoGridValue} numberOfLines={2}>{displayEmployer}</Text>
          </View>
        </View>

        {/* Bio Block */}
        {displayBio ? (
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>"{displayBio}"</Text>
          </View>
        ) : null}

        {/* Detailed Options List */}
        <View style={styles.detailList}>
          {displayCity ? (
            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={20} color="#64748B" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("preferredLocation")}</Text>
                <Text style={styles.detailValue}>{displayCity}</Text>
              </View>
            </View>
          ) : null}

          {displayCity ? <View style={styles.detailDivider} /> : null}

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#64748B" style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t("preferredCallback")}</Text>
              <Text style={styles.detailValue}>{displayCallback}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Ionicons name="language-outline" size={20} color="#64748B" style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t("preferredLanguage")}</Text>
              <Text style={styles.detailValue}>{displayLanguage}</Text>
            </View>
          </View>
        </View>

        {/* Skills Tag Pills */}
        <Text style={styles.sectionTitle}>{t("skills")}</Text>
        <View style={styles.pillsContainer}>
          {applicant.skills && applicant.skills.length > 0 ? (
            applicant.skills.map((skill, idx) => (
              <View key={idx} style={styles.pill}>
                <Text style={styles.pillText}>{skill}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 13, color: "#64748B", fontStyle: "italic", marginLeft: 4 }}>
              {t("noSkillsSpecified")}
            </Text>
          )}
        </View>

        {/* Job Category Pills */}
        <Text style={styles.sectionTitle}>{t("jobCategory")}</Text>
        <View style={styles.pillsContainer}>
          <View style={styles.pill}><Text style={styles.pillText}>{t("restaurantOperations", "Restaurant Operations")}</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>{t("kitchenProduction", "Kitchen Production")}</Text></View>
        </View>

        {/* Talent Specialization Pills */}
        <Text style={styles.sectionTitle}>{t("talentSpecialization")}</Text>
        <View style={styles.pillsContainer}>
          <View style={styles.pill}><Text style={styles.pillText}>{t("continentalCuisine", "Continental Cuisine")}</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>{t("italianCuisine", "Italian Cuisine")}</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>{t("bakery", "Bakery")}</Text></View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={[styles.footerRoundBtn, styles.rejectBtn]}
          onPress={() => handleStatusUpdate("rejected")}
        >
          <Ionicons name="close" size={28} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callTalentBtn}
          onPress={handleCall}
        >
          <Ionicons name="call" size={18} color="#FFFFFF" />
          <Text style={styles.callTalentText}>{t("callTalent")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerRoundBtn, styles.shortlistBtn]}
          onPress={() => handleStatusUpdate("shortlisted")}
        >
          <Ionicons name="heart" size={24} color="#0D9488" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 14,
  },
  headerLine: {
    height: 3,
    backgroundColor: PRIMARY_GREEN,
    width: "15%",
    marginLeft: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#64748B",
  },
  matchBadge: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  matchText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  infoGridCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoGridLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoGridValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E293B",
  },
  bioCard: {
    backgroundColor: "#ECFDF5",
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_GREEN,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  bioText: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#065F46",
    lineHeight: 18,
  },
  detailList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 10,
    marginTop: 10,
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  footerActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  footerRoundBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  shortlistBtn: {
    borderColor: "#0D9488",
    backgroundColor: "#F0FDFA",
  },
  callTalentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
    height: 52,
    borderRadius: 12,
    marginHorizontal: 12,
    gap: 8,
  },
  callTalentText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "600",
  },
});
