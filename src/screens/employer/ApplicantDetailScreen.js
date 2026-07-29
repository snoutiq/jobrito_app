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
import { getAvatarUrl, getAbsoluteProfilePhotoUrl } from "../../components/SwipeDeck/SwipeCard";
import MatchBadge from "../../components/SwipeDeck/MatchBadge";
import Timeline from "../../components/SwipeDeck/Timeline";

export default function ApplicantDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { applicantId, jobId } = route.params || {};

  // Retrieve the job details from the Redux store
  const selectedJob = useSelector((state) =>
    state.employer.submittedJobs.find((j) => j.id === jobId)
  );

  // Bulletproof candidate loading: fallback to the passed navigation object if redux is refreshing
  const applicant = route.params?.applicantItem || selectedJob?.applicants?.find((a) => a.id === applicantId);

  if (!applicant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("talentDetails", "Talent Details")}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t("applicantNotFound", "Applicant details not found.")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = applicant.name || applicant.full_name || applicant.mobile_number || "";
  const displayCity = applicant.city || "";
  const displayPrefLocation = applicant.locationPreference || applicant.location_preference || "";
  const displayExperience = applicant.experience_range || applicant.experience || "";
  const displayEmployer = applicant.current_company || applicant.current_employer || "";
  const displayRole = applicant.current_role || applicant.preferred_role || applicant.cuisine_specialty || "";
  
  // Dynamic API Availability mapping
  const displayAvailability = applicant.availability_status
    ? `${applicant.is_available !== false && !applicant.availability_status.toLowerCase().includes("not") ? "🟢" : "🔴"} ${applicant.availability_status}`
    : (applicant.is_available !== undefined ? (applicant.is_available ? "🟢 Available" : "🔴 Not Available") : "");

  // Real profile photo URL mapping
  const avatarUri = applicant.profile_photo_path || applicant.profile_photo;
  const avatarSource = avatarUri ? { uri: getAbsoluteProfilePhotoUrl(avatarUri) } : { uri: getAvatarUrl(applicant.id || applicant.applicant_id) };

  // Match score (no random generation)
  const matchScore = applicant.match_score || applicant.match?.score;

  const handleCall = () => {
    const phone = applicant.mobile_number;
    if (!phone) {
      CustomAlert.show("Error", "Mobile number not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`)
      .then(() => {
        handleStatusUpdate("contacted", false);
      })
      .catch(() => {
        CustomAlert.show("Call unavailable", "Dialer could not be opened.");
      });
  };

  const handleMessage = () => {
    const phone = applicant.mobile_number;
    if (!phone) {
      CustomAlert.show("Error", "Mobile number not available.");
      return;
    }
    Linking.openURL(`sms:${phone}`)
      .then(() => {
        handleStatusUpdate("contacted", false);
      })
      .catch(() => {
        CustomAlert.show("SMS unavailable", "Messaging app could not be opened.");
      });
  };

  const handleEmail = () => {
    const emailAddress = applicant.email;
    if (!emailAddress) {
      CustomAlert.show("Error", "Email address not available.");
      return;
    }
    Linking.openURL(`mailto:${emailAddress}`)
      .catch(() => {
        CustomAlert.show("Email unavailable", "Mail client could not be opened.");
      });
  };

  const handleStatusUpdate = async (status, showAlert = true) => {
    try {
      await dispatch(updateApplicantStatus({ applicationId: applicant.id || applicant.application_id, status })).unwrap();
      if (showAlert) {
        CustomAlert.show("Success", `Applicant status updated to: ${status}`);
      }
      dispatch(fetchEmployerDashboard());
    } catch (error) {
      console.error("Failed to update status:", error);
      if (showAlert) {
        CustomAlert.show("Error", error || "Failed to update status. Please try again.");
      }
    }
  };

  const handleReject = () => {
    CustomAlert.show(
      t("confirmReject", "Reject Applicant?"),
      t("rejectApplicantConfirmation", "Are you sure you want to reject this applicant? This action cannot be undone."),
      [
        {
          text: t("cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("reject", "Reject"),
          style: "destructive",
          onPress: () => handleStatusUpdate("rejected"), // Assuming 'rejected' is a valid status
        },
      ]
    );
  };

  const handleHire = () => {
    handleStatusUpdate("shortlisted");
  };

  const getRegionalList = () => {
    let list = [];
    if (applicant.availability_info && typeof applicant.availability_info === "object" && !Array.isArray(applicant.availability_info)) {
      list = applicant.availability_info.regional_experience || [];
    } else if (applicant.regional_experience) {
      list = applicant.regional_experience;
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return [];
  };

  const detailFields = [
    {
      label: "Applied",
      value:
        applicant.applied_date && applicant.applied_time
          ? `${applicant.applied_date} • ${applicant.applied_time}`
          : applicant.applied_date || applicant.applied_time || "",
    },
    { label: "Cuisine Specialty", value: applicant.cuisine_specialty },
    { label: "Current Employer", value: displayEmployer },
    { label: "Experience Range", value: displayExperience },
  ].filter(f => f.value !== null && f.value !== undefined && f.value !== "");

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{displayName}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {selectedJob?.title || applicant.preferred_role || "Staff"} • {t("talentProfile", "Talent Profile")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarContainer}>
              <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
            </View>
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.chefName}>{displayName}</Text>
                </View>
              </View>
              {displayRole ? (
                <Text style={styles.chefTitle}>Current Role: {displayRole}</Text>
              ) : null}
              <View style={styles.profileDetailsList}>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.profileInfoLabel}>Current Location: </Text>
                  <Text style={styles.profileInfoValue}>{displayCity || "N/A"}</Text>
                </Text>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.profileInfoLabel}>Preferred Job Location: </Text>
                  <Text style={styles.profileInfoValue}>
                    {displayPrefLocation === "Both" || displayPrefLocation === "Both (India & Overseas)"
                      ? "India & Overseas"
                      : displayPrefLocation || "N/A"}
                  </Text>
                </Text>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.profileInfoLabel}>Experience: </Text>
                  <Text style={styles.profileInfoValue}>{displayExperience || "N/A"}</Text>
                </Text>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.profileInfoLabel}>Regional Experience: </Text>
                  <Text style={styles.profileInfoValue}>{getRegionalList().join(", ") || "N/A"}</Text>
                </Text>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.profileInfoLabel}>Availability: </Text>
                  <Text style={styles.profileInfoValue}>{displayAvailability || "N/A"}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        {applicant.bio && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("aboutMe", "About Applicant")}</Text>
            <Text style={styles.aboutParagraph}>{applicant.bio}</Text>
          </View>
        )}

        {/* Application Information Details List Rows */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t("applicationInformation", "Application Information")}</Text>
          <View style={styles.detailItemCard}>
            {detailFields.map((field, idx) => {
              const isLast = idx === detailFields.length - 1;
              return (
                <View key={idx} style={[styles.detailRow, isLast && styles.noBorderRow]}>
                  <Text style={styles.detailLabel}>{field.label}</Text>
                  {field.isLink && field.onPress ? (
                    <TouchableOpacity onPress={field.onPress}>
                      <Text style={[styles.detailValue, styles.linkText]}>{field.value}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.detailValue}>{field.value}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Experience Timeline */}
        {Array.isArray(applicant.experience) && applicant.experience.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("workExperience", "Experience History")}</Text>
            <Timeline 
              currentEmployer={displayEmployer} 
              experienceRange={displayExperience} 
              experienceList={applicant.experience} 
            />
          </View>
        )}

        {/* Skills Chips (Dynamic, no fake skills) */}
        {applicant.skills && applicant.skills.length > 0 ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("skills", "Core Skills")}</Text>
            <View style={styles.pillsContainer}>
              {applicant.skills.map((skill, idx) => {
                const skillName = typeof skill === "object" ? skill.name : skill;
                const skillLevel = typeof skill === "object" ? skill.level : null;
                return (
                  <View key={idx} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>
                      {skillName}{skillLevel ? ` (${skillLevel}%)` : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Certificates Section (Dynamic, no fake certificates) */}
        {Array.isArray(applicant.certificates) && applicant.certificates.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("certifications", "Certifications")}</Text>
            {Array.isArray(applicant.certificates) && applicant.certificates.length > 0 ? (
              <View style={styles.pillsContainer}>
                {applicant.certificates.map((cert, idx) => (
                  <View key={idx} style={styles.certPill}>
                    <Ionicons name="ribbon-outline" size={16} color="#153e69" />
                    <Text style={styles.certPillText}>
                      {cert.name || cert} {cert.issuer ? `(${cert.issuer})` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTextCard}>
                <Ionicons name="ribbon-outline" size={18} color="rgba(10, 5, 4, 0.35)" />
                <Text style={styles.emptySectionText}>No certificates uploaded.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={styles.stickyFooter}>
        {/* Call Button */}
        <TouchableOpacity style={[styles.btn, styles.btnCall]} onPress={handleCall} activeOpacity={0.7}>
          <Ionicons name="call" size={20} color="#153e69" />
        </TouchableOpacity>

        {/* Reject Button */}
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={handleReject} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color="#f57f20" />
        </TouchableOpacity>

        {/* Shortlist (Accept) Button */}
        <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={handleHire} activeOpacity={0.8}>
          <Ionicons name="heart" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
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
    color: "#0a0504",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // ensure content isn't blocked by bottom action bar
  },
  profileIntroSection: {
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    marginBottom: 12,
    // Soft shadow on avatar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#ffffff",
    backgroundColor: "#e2e2e4",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0a0504",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "700",
  },
  matchBadgeDetail: {
    backgroundColor: "#ffffff",
    shadowColor: "rgba(0,0,0,0.03)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 16,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#153e69",
    overflow: "hidden",
    backgroundColor: "#f2f2f3",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  profileDetailsList: {
    marginTop: 8,
    gap: 4,
  },
  detailRowText: {
    fontSize: 12,
    lineHeight: 18,
  },
  chefName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 6,
  },
  chefTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#153e69",
    marginBottom: 8,
  },
  profileInfoLabel: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "700",
  },
  profileInfoValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0a0504",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0a0504",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    opacity: 0.5,
  },
  aboutParagraph: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: 22,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillPill: {
    backgroundColor: "#e7eff7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.15)",
  },
  skillPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153e69",
  },
  certPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.06)",
    gap: 10,
    shadowColor: "rgba(0, 0, 0, 0.02)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  certPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.75)",
  },
  detailItemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.06)",
    padding: 20,
    gap: 16,
    shadowColor: "rgba(10, 5, 4, 0.03)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.04)",
    paddingBottom: 12,
  },
  noBorderRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.45)",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0a0504",
    textAlign: "right",
  },
  linkText: {
    color: "#153e69",
    textDecorationLine: "underline",
  },
  emptyTextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
    gap: 8,
  },
  emptySectionText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.5)",
    fontWeight: "700",
  },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  btn: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "rgba(10, 5, 4, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  btnCall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderColor: "rgba(21, 62, 105, 0.15)",
  },
  btnReject: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: "#f57f20",
  },
  btnAccept: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: "#4CAF50",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
});
