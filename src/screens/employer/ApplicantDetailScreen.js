import React, { useState, useEffect } from "react";
import { 
  Linking,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { updateApplicantStatus, fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import * as Haptics from 'expo-haptics'; // Assuming expo-haptics is installed
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

  // Local state to manage the applicant's status for immediate UI feedback
  const [localStatus, setLocalStatus] = useState(applicant?.status);

  // Sync local state if the applicant from Redux changes
  useEffect(() => {
    setLocalStatus(applicant?.status);
  }, [applicant?.status]);

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

  const chefProfile = applicant.chef_profile || applicant.chef_profile_details || applicant.user?.chef_profile || {};
  const availabilityInfo = chefProfile.availability_info || {};

  const displayName = applicant.name || applicant.full_name || applicant.user?.name || applicant.user?.full_name || applicant.mobile_number || "";
  const displayCity = applicant.city || applicant.user?.city || "";
  const displayPrefLocation = availabilityInfo.location_preference || applicant.locationPreference || applicant.location_preference || applicant.user?.location_preference || "";
  const displayExperience = applicant.experience_range || applicant.experience_years || applicant.experience || applicant.user?.experience_range || applicant.user?.experience_years || "";
  const displayEmployer = applicant.current_company || applicant.current_employer || applicant.user?.current_employer || "";
  const displayRole = applicant.current_role || applicant.preferred_role || chefProfile.cuisine_specialty || applicant.user?.preferred_role || "";
  const displayCalendly = applicant.calendly_link || chefProfile.calendly_link || applicant.user?.calendly_link || "";
  const displayBio = applicant.bio || chefProfile.bio || applicant.user?.bio || "";
  const preferredCallTime = applicant.preferred_call_time || applicant.user?.preferred_call_time || "";
  
  const getSkillsList = () => {
    const list = applicant.skills || applicant.user?.skills || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getCuisinesList = () => {
    const list = applicant.cuisine_specialty || applicant.specialties || chefProfile.cuisine_specialty || applicant.user?.cuisine_specialty || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getRegionalList = () => {
    const list = availabilityInfo.regional_experience || applicant.regional_experience || applicant.user?.regional_experience || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getLanguagesList = () => {
    const list = availabilityInfo.languages || applicant.languages || applicant.user?.languages || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getAvailabilityStatus = () => {
    return availabilityInfo.availability_status || applicant.availability_status || applicant.user?.availability_status || "";
  };

  // Dynamic API Availability mapping, now considering localStatus
  const displayAvailability = getAvailabilityStatus() === "Available Immediately" || getAvailabilityStatus() === "Immediately Available" || getAvailabilityStatus() === "Available"
    ? "🟢 Available Immediately"
    : getAvailabilityStatus() ? `🔴 ${getAvailabilityStatus()}` : "N/A";

  const getActiveSocials = () => {
    const list = [];
    const socials = applicant.socials || chefProfile.socials || applicant.user?.socials || {};
    
    const ln = socials.linkedin || applicant.linkedin || chefProfile.linkedin || applicant.linkedin_link || chefProfile.linkedin_link || applicant.user?.linkedin;
    if (ln && ln.trim() && ln !== "https://linkedin.com/") {
      list.push({ platform: "LinkedIn", icon: "logo-linkedin", color: "#0077b5", bgColor: "rgba(0, 119, 181, 0.1)", url: ln });
    }
    
    const ig = socials.instagram || applicant.instagram || chefProfile.instagram || applicant.instagram_link || chefProfile.instagram_link || applicant.user?.instagram;
    if (ig && ig.trim()) {
      list.push({ platform: "Instagram", icon: "logo-instagram", color: "#e1306c", bgColor: "rgba(225, 48, 108, 0.1)", url: ig });
    }
    
    const fb = socials.facebook || applicant.facebook || chefProfile.facebook || applicant.facebook_link || chefProfile.facebook_link || applicant.user?.facebook;
    if (fb && fb.trim()) {
      list.push({ platform: "Facebook", icon: "logo-facebook", color: "#1877f2", bgColor: "rgba(24, 119, 242, 0.1)", url: fb });
    }
    
    const tw = socials.twitter || applicant.twitter || chefProfile.twitter || applicant.twitter_link || chefProfile.twitter_link || applicant.twitterLink || applicant.user?.twitter;
    if (tw && tw.trim()) {
      list.push({ platform: "Twitter", icon: "logo-twitter", color: "#000000", bgColor: "rgba(10, 5, 4, 0.06)", url: tw });
    }
    
    const yt = socials.youtube || applicant.youtube || chefProfile.youtube || applicant.youtube_link || chefProfile.youtube_link || applicant.user?.youtube;
    if (yt && yt.trim()) {
      list.push({ platform: "YouTube", icon: "logo-youtube", color: "#ff0000", bgColor: "rgba(255, 0, 0, 0.08)", url: yt });
    }
    
    const web = socials.website || applicant.website || chefProfile.website || applicant.portfolio || applicant.user?.website;
    if (web && web.trim()) {
      list.push({ platform: "Website", icon: "globe-outline", color: "#153e69", bgColor: "rgba(21, 62, 105, 0.08)", url: web });
    }
    
    return list;
  };

  const handleOpenSocialLink = (url) => {
    if (!url) return;
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = "https://" + fullUrl;
    }
    Linking.openURL(fullUrl).catch((err) => {
      CustomAlert.show(t("error", "Error"), "Could not open link: " + err.message);
    });
  };

  // Match score (no random generation)
  const matchScore = applicant.match_score || applicant.match?.score;

  // Real profile photo URL mapping
  const avatarUri = applicant.profile_photo_path || applicant.profile_photo;
  const avatarSource = avatarUri ? { uri: getAbsoluteProfilePhotoUrl(avatarUri) } : { uri: getAvatarUrl(applicant.id || applicant.applicant_id) };

  const handleCall = () => {
    const phoneNumber = applicant.mobile_number;
    if (!phoneNumber) {
      CustomAlert.show("Error", "Mobile number not available.");
      return;
    }

    CustomAlert.show(
      t("confirmCall", "Call Applicant?"),
      `${t("call", "Call")} ${displayName} at ${phoneNumber}?`,
      [
        {
          text: t("cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("call", "Call"),
          onPress: async () => {
            if (Platform.OS !== 'web') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            Linking.openURL(`tel:${phoneNumber}`)
              .then(() => {
                handleStatusUpdate("contacted", false);
              })
              .catch(() => {
                CustomAlert.show("Call unavailable", "Dialer could not be opened.");
              });
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    const phone = applicant.mobile_number;
    if (!phone) {
      CustomAlert.show("Error", "Mobile number not available.");
      return; // Should not happen as this button is removed.
    }
    Linking.openURL(`sms:${phone}`) // This button is removed, but keeping the function for completeness.
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
      return; // This button is removed, but keeping the function for completeness.
    }
    Linking.openURL(`mailto:${emailAddress}`)
      .catch(() => {
        CustomAlert.show("Email unavailable", "Mail client could not be opened.");
      });
  };

  const handleStatusUpdate = async (status, showAlert = true) => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(status === 'shortlisted' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
      }
      setLocalStatus(status); // Update local state immediately for instant UI feedback
      await dispatch(updateApplicantStatus({ applicationId: applicant.id || applicant.application_id, status })).unwrap();
      if (showAlert) {
        CustomAlert.show("Success", `Applicant status updated to: ${status}`);
      }
      dispatch(fetchEmployerDashboard());
    } catch (error) {
      console.error("Failed to update status:", error);
      setLocalStatus(applicant?.status); // Revert on error
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
          onPress: async () => {
            if (Platform.OS !== 'web') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            handleStatusUpdate("rejected"); // Assuming 'rejected' is a valid status
          },
        },
      ]
    );
  };

  const handleHire = () => {
    // Haptics for success handled inside handleStatusUpdate
    handleStatusUpdate("shortlisted");
  };

  const detailFields = [
    {
      label: "Applied",
      value:
        applicant.applied_date && applicant.applied_time
          ? `${applicant.applied_date} • ${applicant.applied_time}`
          : applicant.applied_date || applicant.applied_time || "",
    },
    { label: "Current Employer", value: displayEmployer },
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
          {localStatus && (
            <View 
              style={[
                styles.statusBadge, 
                localStatus === 'shortlisted' && styles.statusBadgeShortlisted,
                localStatus === 'rejected' && styles.statusBadgeRejected,
                localStatus === 'contacted' && styles.statusBadgeContacted,
              ]}
            >
              <Ionicons 
                name={localStatus === 'shortlisted' ? 'heart' : localStatus === 'rejected' ? 'close-circle' : 'call'} 
                size={12} 
                color="#ffffff" 
              />
              <Text style={styles.statusBadgeText}>
                {localStatus.charAt(0).toUpperCase() + localStatus.slice(1)}
              </Text>
            </View>
          )}
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
                {displayCity && displayCity !== "N/A" ? (
                  <Text numberOfLines={1} style={styles.detailRowText}>
                    <Text style={styles.profileInfoLabel}>Current Location: </Text>
                    <Text style={styles.profileInfoValue}>{displayCity}</Text>
                  </Text>
                ) : null}
                {displayPrefLocation && displayPrefLocation !== "N/A" ? (
                  <Text numberOfLines={1} style={styles.detailRowText}>
                    <Text style={styles.profileInfoLabel}>Preferred Job Location: </Text>
                    <Text style={styles.profileInfoValue}>
                      {displayPrefLocation === "Both" || displayPrefLocation === "Both (India & Overseas)"
                        ? "India & Overseas"
                        : displayPrefLocation}
                    </Text>
                  </Text>
                ) : null}
                {displayExperience && displayExperience !== "N/A" && displayExperience !== "0" && displayExperience !== "0 Years" ? (
                  <Text numberOfLines={1} style={styles.detailRowText}>
                    <Text style={styles.profileInfoLabel}>Experience: </Text>
                    <Text style={styles.profileInfoValue}>{displayExperience}</Text>
                  </Text>
                ) : null}
                {getRegionalList().length > 0 && getRegionalList().join(", ") !== "N/A" ? (
                  <Text numberOfLines={1} style={styles.detailRowText}>
                    <Text style={styles.profileInfoLabel}>Regional Experience: </Text>
                    <Text style={styles.profileInfoValue}>{getRegionalList().join(", ")}</Text>
                  </Text>
                ) : null}
                {getAvailabilityStatus() && getAvailabilityStatus() !== "N/A" ? (
                  <Text numberOfLines={1} style={styles.detailRowText}>
                    <Text style={styles.profileInfoLabel}>Availability: </Text>
                    <Text style={styles.profileInfoValue}>{displayAvailability}</Text>
                  </Text>
                ) : null}
                {Boolean(preferredCallTime) && preferredCallTime !== "N/A" && (
                  <Text numberOfLines={1} style={styles.detailRowText}>
                    <Text style={styles.profileInfoLabel}>Callback Time: </Text>
                    <Text style={styles.profileInfoValue}>{preferredCallTime}</Text>
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        {Boolean(displayBio) && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="document-text" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("aboutMe", "Professional Bio")}</Text>
            </View>
            <Text style={styles.reviewSecBioText}>{displayBio}</Text>
          </View>
        )}

        {/* Application Information Details List Rows */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewSecTitleRow}>
            <Ionicons name="information-circle" size={18} color="#153e69" />
            <Text style={styles.reviewSecTitle}>{t("applicationInformation", "Application Information")}</Text>
          </View>
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

        {/* Cuisines Section */}
        {getCuisinesList().length > 0 && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="restaurant" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("cuisineExpertise", "Cuisines")}</Text>
            </View>
            <View style={styles.reviewPillContainer}>
              {getCuisinesList().map((cuisine, idx) => (
                <View key={idx} style={styles.reviewPill}>
                  <Text style={styles.reviewPillText}>{cuisine}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Experience Timeline */}
        {Array.isArray(applicant.experience) && applicant.experience.length > 0 && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="briefcase" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("workExperience", "Experience History")}</Text>
            </View>
            <Timeline 
              currentEmployer={displayEmployer} 
              experienceRange={displayExperience} 
              experienceList={applicant.experience} 
            />
          </View>
        )}

        {/* Skills Chips (Dynamic, no fake skills) */}
        {getSkillsList().length > 0 ? (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="flash" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("skills", "Core Skills")}</Text>
            </View>
            <View style={styles.reviewPillContainer}>
              {getSkillsList().map((skill, idx) => {
                const skillName = typeof skill === "object" ? skill.name : skill;
                const skillLevel = typeof skill === "object" ? skill.level : null;
                return (
                  <View key={idx} style={styles.reviewPill}>
                    <Text style={styles.reviewPillText}>
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
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="ribbon" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("certifications", "Certifications")}</Text>
            </View>
            <View style={styles.reviewPillContainer}>
              {applicant.certificates.map((cert, idx) => (
                <View key={idx} style={[styles.reviewPill, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
                  <Ionicons name="ribbon-outline" size={12} color="#153e69" />
                  <Text style={styles.reviewPillText}>
                    {cert.name || cert} {cert.issuer ? `(${cert.issuer})` : ""}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}



        {/* Calendly Booking Card */}
        {Boolean(displayCalendly) && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="calendar" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("scheduleInterview", "Book Interview")}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleOpenSocialLink(displayCalendly)}
              activeOpacity={0.8}
              style={styles.calendlyBtn}
            >
              <Ionicons name="calendar-outline" size={16} color="#ffffff" />
              <Text style={styles.calendlyBtnText}>{t("bookWithCalendly", "Schedule via Calendly")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Social Profiles */}
        {getActiveSocials().length > 0 && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="share-social" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("socialProfiles", "Social Links")}</Text>
            </View>
            <View style={styles.socialRow}>
              {getActiveSocials().map((soc, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleOpenSocialLink(soc.url)}
                  style={[styles.socialIconBtn, { backgroundColor: soc.bgColor }]}
                >
                  <Ionicons name={soc.icon} size={22} color={soc.color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={styles.stickyFooter}>
        {/* Shortlist (Accept) Button */}
        <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={handleHire} activeOpacity={0.8}>
          <Ionicons name="heart" size={28} color="#4CAF50" />
        </TouchableOpacity>

        {/* Call Button (now large) */}
        <TouchableOpacity style={[styles.btn, styles.btnCall]} onPress={handleCall} activeOpacity={0.7}>
          <Ionicons name="call" size={28} color="#153e69" />
        </TouchableOpacity>

        {/* Reject Button */}
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={handleReject} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color="#f57f20" />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 10,
    position: 'relative', // Needed for absolute positioning of the badge
  },
  statusBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    gap: 5,
    zIndex: 1,
  },
  statusBadgeShortlisted: {
    backgroundColor: '#4CAF50', // Green for shortlisted
  },
  statusBadgeRejected: {
    backgroundColor: '#f57f20', // Orange for rejected
  },
  statusBadgeContacted: {
    backgroundColor: '#153e69', // Blue for contacted
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
  reviewSecTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewSecTitle: {
    fontSize: 14,
    fontWeight: "750",
    color: "#153e69",
    marginLeft: 8,
  },
  reviewSecBioText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: 18,
  },
  reviewPillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  reviewPill: {
    backgroundColor: "rgba(21, 62, 105, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewPillText: {
    fontSize: 12,
    color: "#153e69",
    fontWeight: "600",
  },
  calendlyBtn: {
    backgroundColor: "#f57f20",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
  },
  calendlyBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  socialIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
