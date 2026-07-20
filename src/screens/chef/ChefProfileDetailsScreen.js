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
  const chef = route?.params?.chef;
  const { profile: loggedInProfile } = useSelector((state) => state.user);
  const isOwnProfile = route?.params?.isOwnProfile || 
                       (loggedInProfile && String(loggedInProfile.id) === String(chef?.id)) || 
                       false;

  // Booking Modal States
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  React.useEffect(() => {
    if (chef?.id && !isOwnProfile) {
      recordChefProfileView(chef.id).catch(() => null);
    }
  }, [chef?.id, isOwnProfile]);

  if (!chef) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text>Chef profile not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: PRIMARY_GREEN, marginTop: 10, fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleOpenBooking = () => {
    const url = chef?.calendly_link || chef?.calendlyUrl;
    if (url && url.trim()) {
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not open Calendly link: " + err.message);
      });
    } else {
      Alert.alert(
        "Calendly Not Linked", 
        "This chef has not integrated their Calendly calendar yet. Please contact them directly."
      );
    }
  };

  const displayName = chef.full_name || chef.name || "Chef Rajesh Kumar";
  const displayTitle = chef.cuisine_specialty || "Culinary Consultant";
  const displayCity = chef.city || "Mumbai, Maharashtra, India";
  const displayExperience = chef.experience_range || chef.experience || "10+ Years";
  const displayBio = chef.bio || "Experienced hospitality professional.";

  const getLogoSource = () => {
    const uri = chef?.profile_photo_path || chef?.profile_photo;
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

  const getSkillsList = () => {
    if (Array.isArray(chef.skills)) return chef.skills;
    if (typeof chef.skills === "string") return chef.skills.split(",").map(x => x.trim());
    return [];
  };

  const getEmploymentList = () => {
    let list = [];
    if (chef.availability_info && typeof chef.availability_info === "object" && !Array.isArray(chef.availability_info)) {
      list = chef.availability_info.employment_preference || [];
    } else if (chef.employment_preference) {
      list = chef.employment_preference;
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return ["Full Time", "Consultant"];
  };

  const getRegionalList = () => {
    let list = [];
    if (chef.availability_info && typeof chef.availability_info === "object" && !Array.isArray(chef.availability_info)) {
      list = chef.availability_info.regional_experience || [];
    } else if (chef.regional_experience) {
      list = chef.regional_experience;
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return ["UAE", "Saudi Arabia", "India"];
  };

  const getAvailabilityStatus = () => {
    if (chef.availability_info && typeof chef.availability_info === "object" && !Array.isArray(chef.availability_info)) {
      return chef.availability_info.availability_status || "Available for Consultation";
    }
    return chef.availability || "Available for Consultation";
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
      CustomAlert.show("Selection Required", "Please select a preferred meeting date.");
      return;
    }
    if (!selectedTime) {
      CustomAlert.show("Selection Required", "Please select a preferred meeting time.");
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
          "Success",
          res?.message || "Appointment booked successfully!",
          [
            {
              text: "Got It",
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
        CustomAlert.show("Booking Failed", res?.message || "Failed to book appointment.");
      }
    } catch (error) {
      CustomAlert.show("Booking Error", error.message || "An error occurred during booking.");
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Summary */}
        <View style={styles.profileHeaderCard}>
          {logoSource ? (
            <Image source={logoSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={32} color="rgba(10, 5, 4, 0.6)" />
            </View>
          )}
          <Text style={styles.chefName}>{displayName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(10, 5, 4, 0.6)" />
            <Text style={styles.locationText}>{displayCity}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.statusText}>{getAvailabilityStatus()}</Text>
          </View>
        </View>

        {/* Professional Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("professionalSummary")}</Text>
          <Text style={styles.bioText}>{displayBio}</Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGridRow}>
          <View style={styles.infoGridBadge}>
            <Ionicons name="time-outline" size={20} color="#153e69" style={{ marginBottom: 4 }} />
            <Text style={styles.badgeLabel}>{t("experience")}</Text>
            <Text style={styles.badgeValue}>{displayExperience}</Text>
          </View>
          <View style={styles.infoGridBadge}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#153e69" style={{ marginBottom: 4 }} />
            <Text style={styles.badgeLabel}>{t("identity")}</Text>
            <Text style={styles.badgeValue}>{t("verified")}</Text>
          </View>
        </View>

        {/* Employment Preference */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("employmentPreference")}</Text>
          <View style={styles.pillsContainer}>
            {getEmploymentList().map((opt, idx) => (
              <View key={idx} style={styles.pillGrey}>
                <Text style={styles.pillText}>{opt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cuisine Expertise */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("cuisineExpertise")}</Text>
          <View style={styles.pillsContainer}>
            <View style={styles.pillGreenLight}>
              <Text style={styles.pillTextGreen}>{displayTitle}</Text>
            </View>
            <View style={styles.pillGreenLight}>
              <Text style={styles.pillTextGreen}>Multi Cuisine</Text>
            </View>
          </View>
        </View>

        {/* Core Skills */}
        {getSkillsList().length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t("coreSkills")}</Text>
            <View style={styles.pillsContainer}>
              {getSkillsList().map((opt, idx) => (
                <View key={idx} style={styles.pillOutline}>
                  <Text style={styles.pillTextGrey}>{opt}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Regional Experience */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("regionalExperience")}</Text>
          <View style={styles.pillsContainer}>
            {getRegionalList().map((opt, idx) => (
              <View key={idx} style={styles.pillGrey}>
                <Text style={styles.pillText}>{opt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Social Profiles */}
        <Text style={styles.sectionTitleCap}>{t("socialProfiles")}</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialIconBox}>
            <Ionicons name="link-outline" size={20} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIconBox}>
            <Ionicons name="logo-linkedin" size={20} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIconBox}>
            <Ionicons name="mail-outline" size={20} color="rgba(10, 5, 4, 0.6)" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Get Appointment / Edit Profile Bottom Button */}
      <View style={styles.footer}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[styles.appointmentBtn, { backgroundColor: PRIMARY_GREEN }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ChefCompleteProfile")}
          >
            <Ionicons name="create-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.appointmentBtnText}>{t("editProfile", "Edit Profile")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.appointmentBtn, { backgroundColor: PRIMARY_GREEN }]}
            activeOpacity={0.8}
            onPress={handleOpenBooking}
          >
            <Ionicons name="calendar-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.appointmentBtnText}>{t("getAppointment")}</Text>
          </TouchableOpacity>
        )}
      </View>

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
    gap: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 20,
    alignItems: "center",
    shadowColor: "#0a0504",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  avatarPlaceholder: {
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  chefName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "550",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#153e69",
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#153e69",
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 12,
    alignItems: "center",
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
    gap: 12,
    marginLeft: 4,
    marginBottom: 20,
  },
  socialIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
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
});
