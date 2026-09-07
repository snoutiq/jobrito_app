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
  Platform,
  Dimensions,
  PixelRatio,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import colors from "../../constants/colors";
import { bookChefAppointment, recordChefProfileView, getChefProfileDetails } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";

export default function ChefProfileDetailsScreen({ navigation, route }) {
  const { t } = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (navigation && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [navigation])
  );

  const chefParam = route?.params?.chef;
  const targetChefId = route?.params?.chefId || route?.params?.id || chefParam?.id;

  const { profile: loggedInProfile } = useSelector((state) => state.user);
  const { chefs: employerChefs } = useSelector((state) => state.employer || {});

  const [fetchedChef, setFetchedChef] = useState(null);
  const [loadingChef, setLoadingChef] = useState(false);

  React.useEffect(() => {
    if (!chefParam && targetChefId) {
      const foundInStore = (employerChefs || []).find((c) => String(c.id) === String(targetChefId));
      if (foundInStore) {
        setFetchedChef(foundInStore);
      } else {
        setLoadingChef(true);
        getChefProfileDetails(targetChefId)
          .then((res) => {
            const fetched = res?.data || res?.profile || res;
            if (fetched && fetched.id) {
              setFetchedChef(fetched);
            }
          })
          .catch((err) => console.warn("Failed to fetch chef profile:", err))
          .finally(() => setLoadingChef(false));
      }
    }
  }, [targetChefId, chefParam, employerChefs]);

  const isOwnProfile = route?.params?.isOwnProfile || 
                       (loggedInProfile && String(loggedInProfile.id) === String(targetChefId)) || 
                       false;
  const chef = isOwnProfile && loggedInProfile ? loggedInProfile : (chefParam || fetchedChef);

  // Booking Modal States
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Tabs");
    }
  };

  const handleShare = async () => {
    try {
      const id = chef?.id || targetChefId;
      const shareUrl = `https://jobrito.com/chef/${id}`;
      const deepUrl = `jobrito://chef/${id}`;

      const shareMessage = `
🍳 *CHEF PROFESSIONAL PROFILE* 🍳
----------------------------------
👤 *Name:* Chef ${displayName || "Profile"}
💼 *Title:* ${displayTitle || "Chef"}
📍 *Location:* ${displayCity || "N/A"}
----------------------------------
🔗 View full profile & book consultation on Jobrito app:
${shareUrl}
(App Deep Link: ${deepUrl})
`.trim();

      const shareOptions = Platform.select({
        ios: {
          message: shareMessage,
          url: shareUrl,
          title: `Chef ${displayName || "Profile"}`,
        },
        android: {
          message: shareMessage,
          title: `Chef ${displayName || "Profile"}`,
        },
        default: {
          message: shareMessage,
        },
      });

      await Share.share(shareOptions);
    } catch (error) {
      console.warn("Share profile error:", error);
      Alert.alert("Unable to share", error?.message || "Please try again.");
    }
  };

  React.useEffect(() => {
    if (chef?.id && !isOwnProfile) {
      const isAlreadyViewed = chef.viewed || chef.is_viewed;
      if (!isAlreadyViewed) {
        recordChefProfileView(chef.id).catch(() => null);
      }
    }
  }, [chef?.id, isOwnProfile, chef?.viewed, chef?.is_viewed]);

  if (loadingChef) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        <Text style={{ marginTop: 12, color: colors.mutedText }}>{t("profileDetails.loading", "Loading chef profile...")}</Text>
      </SafeAreaView>
    );
  }

  if (!chef) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text>{t("profileDetails.notFound", "Chef profile not found.")}</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text style={{ color: PRIMARY_GREEN, marginTop: 10, fontWeight: "700" }}>{t("profileDetails.goBack", "Go Back to Home")}</Text>
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
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    let info = chef.availability_info || chefProfileObj.availability_info || chef.user?.availability_info || {};
    if (typeof info === "string") {
      try {
        info = JSON.parse(info);
      } catch (e) {
        info = {};
      }
    }
    return info || {};
  };

  const availabilityInfo = getAvailabilityInfo();

  const getDisplayTitle = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    const talentObj = chef.talent_profile || chef.job_seeker_profile || chef.user?.talent_profile || chef.user?.job_seeker_profile || {};
    return (
      chef.preferred_role ||
      chef.preference ||
      chef.professionalTitle ||
      chef.current_role ||
      chef.currentRole ||
      chef.professional_title ||
      talentObj.preferred_role ||
      chefProfileObj.preferred_role ||
      chefProfileObj.cuisine_specialty ||
      chef.cuisine_specialty ||
      (chef.role !== "chef" ? chef.role : "") ||
      ""
    );
  };

  const getDisplayCurrentLocation = () => {
    const city = chef.city || chef.current_location || chef.currentLocation || chef.user?.city || chef.user?.job_location || "";
    const country = chef.country || chef.user?.country || "";
    if (city && country && !city.toLowerCase().includes(country.toLowerCase())) {
      return `${city}, ${country}`;
    }
    return city || country || chef.job_location || chef.location_preference || "";
  };

  const getDisplayPreferredLocation = () => {
    const basePref = availabilityInfo.location_preference || chef.locationPreference || chef.location_preference || chef.job_location || "";
    let displayBase = basePref === "Both" || basePref === "Both (India & Overseas)" ? "Both (India & Overseas)" : basePref;

    const specificLoc = chef.job_location || chef.preferred_location || chef.user?.job_location || "";

    if (displayBase && specificLoc && displayBase.toLowerCase() !== specificLoc.toLowerCase()) {
      return `${displayBase} (${specificLoc})`;
    }
    return displayBase || specificLoc || "";
  };

  const getDisplayExperience = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    const talentObj = chef.talent_profile || chef.job_seeker_profile || chef.user?.talent_profile || {};
    return (
      chef.experience_range ||
      chef.experience_years ||
      chef.experienceYears ||
      chef.experience ||
      talentObj.experience_range ||
      talentObj.experience_years ||
      chefProfileObj.experience_range ||
      chef.user?.experience_range ||
      ""
    );
  };

  const getDisplayAge = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    const talentObj = chef.talent_profile || chef.job_seeker_profile || chef.user?.talent_profile || {};
    const availInfo = availabilityInfo || {};
    return (
      chef.age ||
      talentObj.age ||
      chefProfileObj.age ||
      availInfo.age ||
      chef.user?.age ||
      ""
    );
  };

  const getDisplayBio = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    return chef.bio || chefProfileObj.bio || chef.user?.bio || chef.user?.chef_profile?.bio || "";
  };

  const displayName = chef?.full_name || chef?.name || chef?.user?.full_name || chef?.user?.name || "Chef User";
  const displayTitle = getDisplayTitle();
  const displayCity = getDisplayCurrentLocation();
  const displayPrefLocation = getDisplayPreferredLocation();
  const displayExperience = getDisplayExperience();
  const displayAge = getDisplayAge();
  const displayBio = getDisplayBio();

  const getLogoSource = () => {
    const chefProfile = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef;
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
  const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef;
  const displayCalendly = chef.calendly_link || chefProfileObj.calendly_link || chef.calendlyUrl || chef.calendlyLink || chef.user?.chef_profile?.calendly_link || "";

  const getSkillsList = () => {
    if (!chef) return [];
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    const availInfo = availabilityInfo || {};

    let list =
      chef.operational_expertise ||
      chef.operational_experties ||
      chef.core_skills ||
      chef.skills ||
      chef.operations ||
      chefProfileObj.operational_expertise ||
      chefProfileObj.operational_experties ||
      chefProfileObj.core_skills ||
      chefProfileObj.skills ||
      availInfo.operational_expertise ||
      availInfo.operational_experties ||
      availInfo.core_skills ||
      availInfo.skills ||
      chef.user?.skills ||
      chef.user?.chef_profile?.operational_experties ||
      [];

    if (typeof list === "string") {
      const trimmed = list.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          list = JSON.parse(trimmed);
        } catch (e) {
          // fallback to comma split
        }
      }
    }

    if (Array.isArray(list)) {
      return list.map((x) => (typeof x === "string" ? x.trim() : String(x))).filter(Boolean);
    }
    if (typeof list === "string" && list.trim()) {
      return list.split(",").map((x) => x.trim()).filter(Boolean);
    }
    return [];
  };

  const getCuisinesList = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    const list =
      chef.cuisines ||
      chef.cuisine_specialty ||
      chef.specialties ||
      chefProfileObj.cuisine_specialty ||
      chefProfileObj.specialties ||
      chefProfileObj.cuisines ||
      chef.user?.chef_profile?.cuisine_specialty ||
      [];
    if (Array.isArray(list)) return list.filter(Boolean);
    if (typeof list === "string" && list.trim()) return list.split(",").map((x) => x.trim()).filter(Boolean);
    return [];
  };

  const getLanguagesList = () => {
    const availInfo = availabilityInfo || {};
    const list = availInfo.languages || chef.languages || chefProfileObj?.availability_info?.languages || [];
    if (Array.isArray(list)) return list.filter(Boolean);
    if (typeof list === "string" && list.trim()) return list.split(",").map((x) => x.trim()).filter(Boolean);
    return [];
  };

  const getEmploymentList = () => {
    const availInfo = availabilityInfo || {};
    const list =
      availInfo.employment_preference ||
      availInfo.employment_preferences ||
      chef.employment_preference ||
      chef.employment_preferences ||
      [];
    if (Array.isArray(list)) return list.filter(Boolean);
    if (typeof list === "string" && list.trim()) return [list];
    return [];
  };

  const getRegionalList = () => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || chef.user?.chef_profile_details || {};
    const availInfo = availabilityInfo || {};
    const list =
      availInfo.regional_experience ||
      availInfo.regionalExperience ||
      chef.regional_experience ||
      chef.regionalExperience ||
      chefProfileObj.regional_experience ||
      chefProfileObj.regionalExperience ||
      chefProfileObj.availability_info?.regional_experience ||
      [];
    if (Array.isArray(list)) return list.filter(Boolean);
    if (typeof list === "string" && list.trim()) return list.split(",").map((x) => x.trim()).filter(Boolean);
    return [];
  };

  const getAvailabilityStatus = () => {
    const availInfo = availabilityInfo || {};
    return (
      availInfo.availability_status ||
      availInfo.status ||
      chef.availability_status ||
      chef.availability ||
      chef.user?.availability_status ||
      ""
    );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("chefProfile")}</Text>
        </View>
        <View style={{ width: 32 }} />
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
                    <Text style={styles.editProfileTopText}>{t("edit", "Edit")}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {Boolean(displayTitle) && (
                <Text style={styles.chefTitle}>{t("currentRoleLabel", "Current Role:")} {displayTitle}</Text>
              )}
              
              <View style={styles.profileDetailsList}>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("currentLocationLabel", "Current Location:")} </Text>
                  <Text style={styles.detailValue}>{displayCity || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("preferredLocationLabel", "Preferred Job Location:")} </Text>
                  <Text style={styles.detailValue}>
                    {displayPrefLocation === "Both" || displayPrefLocation === "Both (India & Overseas)"
                      ? "India & Overseas"
                      : displayPrefLocation || "N/A"}
                  </Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("experienceLabel", "Experience:")} </Text>
                  <Text style={styles.detailValue}>{displayExperience || "N/A"}</Text>
                </Text>

                {Boolean(displayAge) && (
                  <Text numberOfLines={1} style={styles.detailRowText}>
                    <Text style={styles.detailLabel}>{t("ageLabel", "Age:")} </Text>
                    <Text style={styles.detailValue}>{displayAge}</Text>
                  </Text>
                )}
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("regionalExperienceLabel", "Regional Experience:")} </Text>
                  <Text style={styles.detailValue}>{getRegionalList().join(", ") || "N/A"}</Text>
                </Text>
                
                <Text numberOfLines={1} style={styles.detailRowText}>
                  <Text style={styles.detailLabel}>{t("availabilityLabel", "Availability:")} </Text>
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
                  <Text style={styles.reviewPillText}>{t(cuisine, cuisine)}</Text>
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
                  <Text style={styles.reviewPillText}>{t(op, op)}</Text>
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
                placeholder={t("purposePlaceholder", "e.g. Kitchen setup and continental menu planning")}
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
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: normalize(4),
    marginRight: normalize(8),
  },
  actionIconBtn: {
    padding: normalize(5),
    borderRadius: normalize(16),
    backgroundColor: "#f2f2f3",
    width: normalize(32),
    height: normalize(32),
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0a0504",
  },
  menuIcon: {
    padding: normalize(4),
  },
  scrollContent: {
    padding: normalize(14),
    gap: normalize(8),
    paddingBottom: normalize(34),
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(12),
    padding: normalize(10),
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
    marginBottom: normalize(6),
  },
  reviewSecTitle: {
    fontSize: normalize(13),
    fontWeight: "750",
    color: "#153e69",
    marginLeft: normalize(6),
  },
  reviewSecBioText: {
    fontSize: normalize(12),
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: normalize(16),
  },
  reviewPillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
    marginTop: normalize(4),
  },
  reviewPill: {
    backgroundColor: "rgba(21, 62, 105, 0.05)",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(5),
    borderRadius: normalize(6),
  },
  reviewPillText: {
    fontSize: normalize(11),
    color: "#153e69",
    fontWeight: "600",
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  profileInfo: {
    flex: 1,
  },
  avatarContainer: {
    width: normalize(76),
    height: normalize(76),
    borderRadius: normalize(12),
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
    marginTop: normalize(4),
    gap: 2,
  },
  detailRowText: {
    fontSize: normalize(11.5),
    lineHeight: normalize(16),
  },
  detailLabel: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.6)",
  },
  detailValue: {
    fontSize: normalize(11.5),
    fontWeight: "600",
    color: "#0a0504",
  },
  avatarPlaceholder: {
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: normalize(18),
    color: "#153e69",
    fontWeight: "800",
  },
  chefName: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  chefTitle: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#153e69",
    marginBottom: normalize(3),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 2,
    marginBottom: normalize(4),
  },
  locationText: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "550",
    lineHeight: normalize(14),
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: normalize(6),
    paddingVertical: 2,
    borderRadius: normalize(5),
  },
  greenDot: {
    width: normalize(5),
    height: normalize(5),
    borderRadius: normalize(2.5),
    marginRight: normalize(4),
  },
  statusText: {
    fontSize: normalize(10),
    fontWeight: "700",
    color: "#153e69",
  },
  mainCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    padding: normalize(14),
    marginBottom: normalize(10),
  },
  mainCardHeaderTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#153e69",
    marginBottom: normalize(10),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardSubSection: {
    marginBottom: normalize(6),
  },
  cardSubSectionInline: {
    marginBottom: normalize(10),
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
    marginVertical: normalize(10),
  },
  cardSubTitle: {
    fontSize: normalize(10.5),
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.4)",
    marginBottom: normalize(6),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeTextContainer: {
    flex: 1,
  },
  metaMetricsText: {
    fontSize: normalize(10.5),
    color: "rgba(10, 5, 4, 0.45)",
    fontWeight: "700",
    marginTop: 3,
  },
  inlineRowText: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: normalize(16),
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
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: normalize(14),
  },
  sectionTitle: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: normalize(8),
  },
  bioText: {
    fontSize: normalize(12),
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: normalize(18),
    fontWeight: "500",
  },
  infoGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: normalize(10),
  },
  infoGridBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.05)",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(8),
  },
  badgeLabel: {
    fontSize: normalize(9.5),
    color: "rgba(10, 5, 4, 0.4)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  badgeValue: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#0a0504",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
  },
  pillGrey: {
    backgroundColor: "#f2f2f3",
    borderRadius: normalize(6),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(5),
  },
  pillText: {
    fontSize: normalize(10.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  pillGreenLight: {
    backgroundColor: "#e7eff7",
    borderRadius: normalize(6),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(5),
  },
  pillTextGreen: {
    fontSize: normalize(10.5),
    color: "#153e69",
    fontWeight: "700",
  },
  pillOutline: {
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: normalize(6),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(5),
    backgroundColor: "#ffffff",
  },
  pillTextGrey: {
    fontSize: normalize(10.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  sectionTitleCap: {
    fontSize: normalize(10.5),
    fontWeight: "850",
    color: "rgba(10, 5, 4, 0.4)",
    textTransform: "uppercase",
    marginLeft: 4,
    marginTop: normalize(6),
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(10),
    marginLeft: 4,
    marginBottom: normalize(20),
    marginTop: normalize(6),
  },
  socialIconBox: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    padding: normalize(14),
    borderTopWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  appointmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: normalize(10),
    paddingVertical: normalize(12),
  },
  appointmentBtnText: {
    color: "#ffffff",
    fontSize: normalize(13),
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: normalize(16),
    maxHeight: "80%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f2f2f3",
    paddingBottom: normalize(12),
  },
  modalTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0a0504",
  },
  modalScrollBody: {
    paddingVertical: normalize(14),
  },
  modalLabel: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: normalize(8),
  },
  modalDateRow: {
    marginBottom: normalize(6),
  },
  slotPill: {
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    backgroundColor: "#ffffff",
  },
  slotPillSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  slotPillText: {
    fontSize: normalize(10.5),
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
    gap: normalize(6),
    marginBottom: normalize(6),
  },
  timeSlotCell: {
    width: "23%",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: normalize(8),
    paddingVertical: normalize(6),
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  timeSlotCellSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  timeSlotText: {
    fontSize: normalize(10.5),
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  timeSlotTextSelected: {
    color: "#153e69",
    fontWeight: "750",
  },
  noSlotsText: {
    fontSize: normalize(10.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
    paddingHorizontal: 4,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: normalize(10),
    padding: normalize(10),
    fontSize: normalize(12),
    color: "#0a0504",
    textAlignVertical: "top",
    backgroundColor: "#f2f2f3",
  },
  modalBookButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: normalize(10),
    paddingVertical: normalize(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize(8),
  },
  modalBookButtonText: {
    color: "#ffffff",
    fontSize: normalize(13),
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingCardDesc: {
    fontSize: normalize(12),
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: normalize(16),
    marginBottom: normalize(10),
  },
  calendlyButton: {
    backgroundColor: "#153e69",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(10),
    borderRadius: normalize(10),
  },
  calendlyButtonText: {
    color: "#ffffff",
    fontSize: normalize(12),
    fontWeight: "700",
  },
  editProfileTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(6),
    alignSelf: "flex-start",
  },
  editProfileTopText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#153e69",
  },
});
