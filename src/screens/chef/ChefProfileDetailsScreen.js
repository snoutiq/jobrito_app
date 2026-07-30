import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import colors from "../../constants/colors";
import { bookChefAppointment, recordChefProfileView } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#153e69";

export default function ChefProfileDetailsScreen({ navigation, route }) {
  const { t } = useTranslation();
  const chefParam = route?.params?.chef;
  const { profile: loggedInProfile } = useSelector((state) => state.user);
  const isOwnProfile = route?.params?.isOwnProfile || 
                       (loggedInProfile && String(loggedInProfile.id) === String(chefParam?.id)) || 
                       false;
  const chef = isOwnProfile && loggedInProfile ? loggedInProfile : chefParam;

  // Booking Modal States
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleShare = async () => {
    try {
      const id = chef?.id;
      await Share.share({
        message: `Check out Chef ${displayName} on JobRito!\n\nLink: https://jobrito.com/chef/${id}`,
      });
    } catch (error) {
      Alert.alert("Unable to share", "Please try again.");
    }
  };

  React.useEffect(() => {
    if (chef?.id && !isOwnProfile) {
      recordChefProfileView(chef.id).catch(() => null);
    }
  }, [chef?.id, isOwnProfile]);

  if (!chef) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text>{t("profileDetails.notFound", "Chef profile not found.")}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: PRIMARY_GREEN, marginTop: 10, fontWeight: "700" }}>{t("profileDetails.goBack", "Go Back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleOpenBooking = () => {
    const url = displayCalendly;
    if (url && url.trim()) {
      Linking.openURL(url).catch((err) => {
        Alert.alert(t("error", "Error"), "Could not open Calendly link: " + err.message);
      });
    } else {
      Alert.alert(
        t("profileDetails.notLinked", "Calendly Not Linked"), 
        t("profileDetails.notLinkedDesc", "This chef has not integrated their Calendly calendar yet. Please contact them directly.")
      );
    }
  };

  const getAvailabilityInfo = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    return chef.availability_info || chefProfileObj.availability_info || {};
  };

  const availabilityInfo = getAvailabilityInfo();

  const getDisplayTitle = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    return (
      chef.professionalTitle ||
      chef.preferred_role ||
      chef.current_role ||
      chef.currentRole ||
      chef.role ||
      chef.professional_title ||
      chef.cuisine_specialty ||
      chefProfileObj.preferred_role ||
      chefProfileObj.cuisine_specialty ||
      ""
    );
  };

  const getDisplayCurrentLocation = () => {
    return (
      chef.current_location ||
      chef.currentLocation ||
      chef.job_location ||
      chef.city ||
      chef.country ||
      chef.user?.city ||
      chef.user?.country ||
      ""
    );
  };

  const getDisplayPreferredLocation = () => {
    // 1. Get base location preference
    const basePref = availabilityInfo.location_preference || chef.locationPreference || chef.location_preference || "";
    let displayBase = basePref === "Both" || basePref === "Both (India & Overseas)" ? "Both (India & Overseas)" : basePref;

    // 2. Get specific location
    const specificLoc = chef.job_location || chef.preferred_location || chef.user?.job_location || "";

    if (displayBase && specificLoc && displayBase.toLowerCase() !== specificLoc.toLowerCase()) {
      return `${displayBase} (${specificLoc})`;
    }
    return displayBase || specificLoc || "";
  };

  const getDisplayExperience = () => {
    return (
      chef.experienceYears ||
      chef.experience_range ||
      chef.experience ||
      chef.user?.experience_range ||
      ""
    );
  };

  const getDisplayBio = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    return chef.bio || chefProfileObj.bio || chef.user?.bio || "";
  };

  const displayName = chef.full_name || chef.name || chef.user?.full_name || chef.user?.name || "Chef User";
  const displayTitle = getDisplayTitle();
  const displayCity = getDisplayCurrentLocation();
  const displayPrefLocation = getDisplayPreferredLocation();
  const displayExperience = getDisplayExperience();
  const displayBio = getDisplayBio();

  const getLogoSource = () => {
    const chefProfile = chef.chef_profile || chef.chef_profile_details || chef;
    const uri = chef?.profile_photo_path || chef?.profile_photo || chefProfile?.profile_photo_path || chefProfile?.profile_photo || chef?.user?.profile_photo_path;
    if (!uri) return null;
    if (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("file://") ||
      uri.startsWith("data:")
    ) {
      return { uri };
    }
    return { uri: `http://178.16.138.159/backend${uri.startsWith("/") ? "" : "/"}${uri}` };
  };

  const logoSource = getLogoSource();
  const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef;
  const displayCalendly = chef.calendly_link || chefProfileObj.calendly_link || chef.calendlyUrl || chef.calendlyLink || "";

  const getSkillsList = () => {
    const list = chef.skills || chef.user?.skills || chef.chef_profile?.skills || chef.chef_profile_details?.skills || chef.operations || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getCuisinesList = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const list = chef.cuisines || chef.cuisine_specialty || chef.specialties || chefProfileObj.cuisine_specialty || chefProfileObj.specialties || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getLanguagesList = () => {
    const list = availabilityInfo.languages || chef.languages || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getEmploymentList = () => {
    const list = availabilityInfo.employment_preference || availabilityInfo.employment_preferences || chef.employment_preference || chef.employment_preferences || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return [];
  };

  const getRegionalList = () => {
    const list = availabilityInfo.regional_experience || availabilityInfo.regionalExperience || chef.regional_experience || chef.regionalExperience || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getAvailabilityStatus = () => {
    return availabilityInfo.availability_status || chef.availability_status || chef.availability || "";
  };

  const handleOpenSocialLink = (url) => {
    if (!url) return;
    let fullUrl = url.trim();
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = "https://" + fullUrl;
    }
    Linking.openURL(fullUrl).catch((err) => {
      Alert.alert("Error", "Could not open link: " + err.message);
    });
  };

  const getActiveSocials = () => {
    const list = [];
    const chefProfile = chef.chef_profile || chef.chef_profile_details || chef;
    const socials = chef.socials || chefProfile.socials || {};
    
    const ln = socials.linkedin || chef.linkedin || chefProfile.linkedin || chef.linkedin_link || chefProfile.linkedin_link;
    if (ln && ln.trim() && ln !== "https://linkedin.com/") {
      list.push({ platform: "LinkedIn", icon: "logo-linkedin", color: "#0077b5", bgColor: "rgba(0, 119, 181, 0.1)", url: ln });
    }
    
    const ig = socials.instagram || chef.instagram || chefProfile.instagram || chef.instagram_link || chefProfile.instagram_link;
    if (ig && ig.trim()) {
      list.push({ platform: "Instagram", icon: "logo-instagram", color: "#e1306c", bgColor: "rgba(225, 48, 108, 0.1)", url: ig });
    }
    
    const fb = socials.facebook || chef.facebook || chefProfile.facebook || chef.facebook_link || chefProfile.facebook_link;
    if (fb && fb.trim()) {
      list.push({ platform: "Facebook", icon: "logo-facebook", color: "#1877f2", bgColor: "rgba(24, 119, 242, 0.1)", url: fb });
    }
    
    const tw = socials.twitter || chef.twitter || chefProfile.twitter || chef.twitter_link || chefProfile.twitter_link || chef.twitterLink;
    if (tw && tw.trim()) {
      list.push({ platform: "Twitter", icon: "logo-twitter", color: "#000000", bgColor: "rgba(10, 5, 4, 0.06)", url: tw });
    }
    
    const yt = socials.youtube || chef.youtube || chefProfile.youtube || chef.youtube_link || chefProfile.youtube_link;
    if (yt && yt.trim()) {
      list.push({ platform: "YouTube", icon: "logo-youtube", color: "#ff0000", bgColor: "rgba(255, 0, 0, 0.08)", url: yt });
    }
    
    const web = socials.website || chef.website || chefProfile.website || chef.portfolio;
    if (web && web.trim()) {
      list.push({ platform: "Website", icon: "globe-outline", color: "#153e69", bgColor: "rgba(21, 62, 105, 0.08)", url: web });
    }
    
    return list;
  };

  // Check if availability_info has dynamic list of slots (e.g. [{ day: "Monday", slots: ["10:00 AM"] }])
  const getCustomSlots = () => {
    if (Array.isArray(chef.availability_info) && chef.availability_info.length > 0) {
      const first = chef.availability_info[0];
      if (first && typeof first === "object" && first.day && Array.isArray(first.slots)) {
        return chef.availability_info;
      }
    }
    return null;
  };

  const customSlots = getCustomSlots();

  // Generate fallback next 7 days for scheduler
  const getNext7Days = () => {
    const days = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = daysOfWeek[d.getDay()];
      const monthName = months[d.getMonth()];
      const dateNum = d.getDate();
      days.push(`${dayName}, ${monthName} ${dateNum}`);
    }
    return days;
  };

  const fallbackTimeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

  // Helper to determine what time slots to render based on selection
  const getTimeSlotsToRender = () => {
    if (customSlots) {
      const activeGroup = customSlots.find(d => d.day === selectedDate);
      return activeGroup ? activeGroup.slots : [];
    }
    return fallbackTimeSlots;
  };

  const timeSlotsToRender = getTimeSlotsToRender();

  const handleBookAppointment = async () => {
    if (!selectedDate) {
      CustomAlert.show(t("selectionRequired", "Selection Required"), t("selectMeetingDate", "Please select a preferred meeting date."));
      return;
    }
    if (!selectedTime) {
      CustomAlert.show(t("selectionRequired", "Selection Required"), t("selectMeetingTime", "Please select a preferred meeting time."));
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        chef_id: chef.id,
        meeting_date: selectedDate,
        meeting_time: selectedTime,
        purpose: purpose || "Kitchen setup and continental menu planning",
      };

      const res = await bookChefAppointment(payload);
      if (res?.success) {
        CustomAlert.show(
          t("success", "Success"),
          res?.message || t("appointmentBookedSuccess", "Appointment booked successfully!"),
          [
            {
              text: t("gotIt", "Got It"),
              onPress: () => {
                setBookingVisible(false);
                setPurpose("");
                setSelectedDate("");
                setSelectedTime("");
                navigation.navigate("Tabs");
              },
            },
          ]
        );
      } else {
        CustomAlert.show(t("profileDetails.failedBook", "Booking Failed"), res?.message || t("profileDetails.errorBook", "Failed to book appointment."));
      }
    } catch (error) {
      CustomAlert.show(t("profileDetails.errorBook", "Booking Error"), error.message || t("profileDetails.errorBook", "An error occurred during booking."));
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("chefProfile")}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareHeaderButton}>
          <Ionicons name="share-social-outline" size={20} color="#0a0504" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewCard}>
          {/* Header Block: Avatar & Core Info */}
          <View style={styles.profileHeaderRow}>
            {logoSource ? (
              <View style={styles.avatarContainer}>
                <Image source={logoSource} style={styles.avatarImage} resizeMode="cover" />
              </View>
            ) : (
              <View style={[styles.avatarContainer, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{displayName.substring(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.chefName}>{displayName}</Text>
                </View>
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={styles.editProfileTopBtn} 
                    onPress={() => navigation.navigate("ChefCompleteProfile")}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={16} color="#153e69" style={{ marginRight: 4 }} />
                    <Text style={styles.editProfileTopText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              {Boolean(displayTitle) && (
                <Text style={styles.chefTitle}>Current Role: {displayTitle}</Text>
              )}
              
              <View style={styles.profileDetailsList}>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Current Location: </Text>
                  <Text style={styles.detailValue}>{displayCity || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Preferred Job Location: </Text>
                  <Text style={styles.detailValue}>
                    {displayPrefLocation === "Both" || displayPrefLocation === "Both (India & Overseas)"
                      ? "India & Overseas"
                      : displayPrefLocation || "N/A"}
                  </Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Experience: </Text>
                  <Text style={styles.detailValue}>{displayExperience || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Regional Experience: </Text>
                  <Text style={styles.detailValue}>{getRegionalList().join(", ") || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>Availability: </Text>
                  <Text style={styles.detailValue}>
                    {getAvailabilityStatus() === "Available Immediately" || getAvailabilityStatus() === "Immediately Available"
                      ? "Immediately Available"
                      : getAvailabilityStatus() || "N/A"}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 1: Bio */}
        {Boolean(displayBio) && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="document-text" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("professionalSummary", "Professional Bio")}</Text>
            </View>
            <Text style={styles.reviewSecBioText}>{displayBio}</Text>
          </View>
        )}

        {/* Section 2: Cuisines */}
        {getCuisinesList().length > 0 && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="restaurant" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("cuisineExpertise", "Cuisine Specialization")}</Text>
            </View>
            <View style={styles.reviewPillContainer}>
              {getCuisinesList().map((cuisine) => (
                <View key={cuisine} style={styles.reviewPill}>
                  <Text style={styles.reviewPillText}>{cuisine}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section 3: Operational Expertise */}
        {getSkillsList().length > 0 && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="stats-chart" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("coreSkills", "Operational Expertise")}</Text>
            </View>
            <View style={styles.reviewPillContainer}>
              {getSkillsList().map((op) => (
                <View key={op} style={styles.reviewPill}>
                  <Text style={styles.reviewPillText}>{op}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section 4: Calendly Booking Card */}
        {Boolean(displayCalendly) && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="calendar-sharp" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("bookAppointment", "Book Appointment")}</Text>
            </View>
            <Text style={styles.bookingCardDesc}>
              {t("bookingDescription", "Schedule a 1-on-1 consultation or interview session directly with the chef using Calendly.")}
            </Text>
            <TouchableOpacity
              style={styles.calendlyButton}
              activeOpacity={0.8}
              onPress={handleOpenBooking}
            >
              <Ionicons name="calendar-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.calendlyButtonText}>
                {t("bookAppointment", "Book Appointment")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section 5: Social Profiles */}
        {getActiveSocials().length > 0 && (
          <View style={[styles.reviewCard, { borderWidth: 0, shadowOpacity: 0, elevation: 0 }]}>
            <View style={styles.reviewSecTitleRow}>
              <Ionicons name="link-sharp" size={18} color="#153e69" />
              <Text style={styles.reviewSecTitle}>{t("socialProfiles", "Social Profiles")}</Text>
            </View>
            <View style={styles.socialRow}>
              {getActiveSocials().map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.socialIconBox, { backgroundColor: item.bgColor }]}
                  onPress={() => handleOpenSocialLink(item.url)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={bookingVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t("bookConsultation")}</Text>
              <TouchableOpacity onPress={() => setBookingVisible(false)}>
                <Ionicons name="close" size={24} color="rgba(10, 5, 4, 0.6)" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Date selection */}
              <Text style={styles.modalLabel}>{t("selectDate")}</Text>
              <View style={styles.modalDateRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {customSlots ? (
                    customSlots.map((dayGroup) => {
                      const isSelected = selectedDate === dayGroup.day;
                      return (
                        <TouchableOpacity
                          key={dayGroup.day}
                          style={[styles.slotPill, isSelected && styles.slotPillSelected]}
                          onPress={() => {
                            setSelectedDate(dayGroup.day);
                            setSelectedTime("");
                          }}
                        >
                          <Text style={[styles.slotPillText, isSelected && styles.slotPillTextSelected]}>
                            {dayGroup.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    getNext7Days().map((day) => {
                      const isSelected = selectedDate === day;
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.slotPill, isSelected && styles.slotPillSelected]}
                          onPress={() => setSelectedDate(day)}
                        >
                          <Text style={[styles.slotPillText, isSelected && styles.slotPillTextSelected]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>

              {/* Time selection */}
              <Text style={[styles.modalLabel, { marginTop: 18 }]}>{t("selectTime")}</Text>
              <View style={styles.modalTimeGrid}>
                {timeSlotsToRender.length > 0 ? (
                  timeSlotsToRender.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.timeSlotCell, isSelected && styles.timeSlotCellSelected]}
                        onPress={() => setSelectedTime(slot)}
                      >
                        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.noSlotsText}>{t("selectDateFirst")}</Text>
                )}
              </View>

              {/* Purpose Input */}
              <Text style={[styles.modalLabel, { marginTop: 18 }]}>{t("purposeConsultation")}</Text>
              <TextInput
                placeholder="e.g. Kitchen setup and continental menu planning"
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={3}
                style={styles.modalTextInput}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
              />
            </ScrollView>

            {/* Modal Action Footer */}
            <TouchableOpacity
              style={[styles.modalBookButton, bookingLoading && { opacity: 0.7 }]}
              onPress={handleBookAppointment}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.modalBookButtonText}>{t("bookAppointment")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  shareHeaderButton: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: "#f2f2f3",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
  },
  menuIcon: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f2f2f3",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
    marginTop: 6,
    gap: 3,
  },
  detailRowText: {
    fontSize: 12,
    lineHeight: 18,
  },
  detailLabel: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0a0504",
  },
  avatarPlaceholder: {
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 22,
    color: "#153e69",
    fontWeight: "800",
  },
  chefName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  chefTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#153e69",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 2,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "550",
    lineHeight: 16,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#153e69",
  },
  mainCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    padding: 16,
    marginBottom: 12,
  },
  mainCardHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#153e69",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardSubSection: {
    marginBottom: 8,
  },
  cardSubSectionInline: {
    marginBottom: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
    marginVertical: 12,
  },
  cardSubTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.4)",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeTextContainer: {
    flex: 1,
  },
  metaMetricsText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.45)",
    fontWeight: "700",
    marginTop: 4,
  },
  inlineRowText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: 18,
  },
  inlineLabel: {
    fontWeight: "800",
    color: "#153e69",
  },
  inlineValue: {
    fontWeight: "600",
    color: "#0a0504",
  },
  inlineSeparator: {
    color: "rgba(10, 5, 4, 0.25)",
    fontWeight: "300",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 10,
  },
  bioText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 20,
    fontWeight: "500",
  },
  infoGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoGridBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  badgeLabel: {
    fontSize: 10,
    color: "rgba(10, 5, 4, 0.4)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  badgeValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0a0504",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pillGrey: {
    backgroundColor: "#f2f2f3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  pillGreenLight: {
    backgroundColor: "#e7eff7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillTextGreen: {
    fontSize: 11,
    color: "#153e69",
    fontWeight: "700",
  },
  pillOutline: {
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  pillTextGrey: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  sectionTitleCap: {
    fontSize: 11,
    fontWeight: "850",
    color: "rgba(10, 5, 4, 0.4)",
    textTransform: "uppercase",
    marginLeft: 4,
    marginTop: 8,
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginLeft: 4,
    marginBottom: 24,
    marginTop: 8,
  },
  socialIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  appointmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
  },
  appointmentBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f2f2f3",
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
  },
  modalScrollBody: {
    paddingVertical: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 10,
  },
  modalDateRow: {
    marginBottom: 8,
  },
  slotPill: {
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  slotPillSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  slotPillTextSelected: {
    color: "#153e69",
    fontWeight: "750",
  },
  modalTimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  timeSlotCell: {
    width: "23%",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  timeSlotCellSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  timeSlotTextSelected: {
    color: "#153e69",
    fontWeight: "750",
  },
  noSlotsText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
    paddingHorizontal: 4,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: "#0a0504",
    textAlignVertical: "top",
    backgroundColor: "#f2f2f3",
  },
  modalBookButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  modalBookButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingCardDesc: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
    marginBottom: 12,
  },
  calendlyButton: {
    backgroundColor: "#153e69",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  calendlyButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  editProfileTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  editProfileTopText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153e69",
  },
});
