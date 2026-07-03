import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { getEmployerChefs, bookChefAppointment } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#22C55E";

export default function ChefConnectDiscoveryScreen({ navigation, route }) {
  const { t } = useTranslation();
  
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState("all"); // all, freelance, full_time

  // Booking Modal States
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const activeFilters = route?.params?.filters || null;

  const fetchChefs = async () => {
    setLoading(true);
    try {
      const res = await getEmployerChefs();
      const list = res?.chefs || res?.data || (Array.isArray(res) ? res : []);
      setChefs(list);
    } catch (err) {
      console.warn("Failed to load chefs list:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChefs();
  }, []);

  const getLogoSource = (chef) => {
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

  // Helper to extract employment preferences defensively
  const getEmploymentList = (chef) => {
    let list = [];
    if (chef.availability_info && typeof chef.availability_info === "object" && !Array.isArray(chef.availability_info)) {
      list = chef.availability_info.employment_preference || [];
    } else if (chef.employment_preference) {
      list = chef.employment_preference;
    } else if (chef.employment_preferences) {
      list = chef.employment_preferences;
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return [];
  };

  // Helper to extract regional experience defensively
  const getRegionalList = (chef) => {
    let list = [];
    if (chef.availability_info && typeof chef.availability_info === "object" && !Array.isArray(chef.availability_info)) {
      list = chef.availability_info.regional_experience || [];
    } else if (chef.regional_experience) {
      list = chef.regional_experience;
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return [];
  };

  // Helper to extract availability status dynamically
  const getAvailabilityStatus = (chef) => {
    if (chef.availability_info && typeof chef.availability_info === "object" && !Array.isArray(chef.availability_info)) {
      return chef.availability_info.availability_status || "Available for Consultation";
    }
    return chef.availability || "Available for Consultation";
  };

  // Filter Logic
  const filteredChefs = chefs.filter((chef) => {
    // 1. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (chef.full_name || chef.name || "").toLowerCase().includes(q);
      const matchCuisine = (chef.cuisine_specialty || "").toLowerCase().includes(q);
      const matchCity = (chef.city || "").toLowerCase().includes(q);
      if (!matchName && !matchCuisine && !matchCity) return false;
    }

    // 2. Quick filters
    const empPrefs = getEmploymentList(chef);
    const empPrefsLower = empPrefs.map(x => x.toLowerCase());

    if (activeQuickFilter === "freelance") {
      const isFreelancer = empPrefsLower.some(x => x.includes("freelance") || x.includes("consultant"));
      if (!isFreelancer) return false;
    } else if (activeQuickFilter === "full_time") {
      const isFullTimer = empPrefsLower.some(x => x.includes("full time"));
      if (!isFullTimer) return false;
    }

    // 3. Advanced filters (Accordion params)
    if (activeFilters) {
      if (activeFilters.employment?.length > 0) {
        const matches = empPrefs.some(x => activeFilters.employment.includes(x));
        if (!matches) return false;
      }
      if (activeFilters.experience) {
        const matches = chef.experience_range === activeFilters.experience;
        if (!matches) return false;
      }
      if (activeFilters.cuisines?.length > 0) {
        const matches = activeFilters.cuisines.includes(chef.cuisine_specialty);
        if (!matches) return false;
      }
      if (activeFilters.operations?.length > 0) {
        const skillsList = chef.skills || [];
        const matches = skillsList.some(x => activeFilters.operations.includes(x));
        if (!matches) return false;
      }
      if (activeFilters.regional?.length > 0) {
        const regionalList = getRegionalList(chef);
        const matches = regionalList.some(x => activeFilters.regional.includes(x));
        if (!matches) return false;
      }
    }

    return true;
  });

  const getSkillsList = (chef) => {
    if (Array.isArray(chef.skills)) return chef.skills;
    if (typeof chef.skills === "string") return chef.skills.split(",").map(x => x.trim());
    return [];
  };

  const getEmploymentTag = (chef) => {
    const prefs = getEmploymentList(chef);
    if (prefs.length > 0) return prefs[0];
    return "Chef";
  };

  // Generate next 7 days for scheduler fallback
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

  // Helper to extract custom slot day/time if array structure exists
  const getCustomSlots = (chef) => {
    if (chef && Array.isArray(chef.availability_info) && chef.availability_info.length > 0) {
      const first = chef.availability_info[0];
      if (first && typeof first === "object" && first.day && Array.isArray(first.slots)) {
        return chef.availability_info;
      }
    }
    return null;
  };

  const activeCustomSlots = selectedChef ? getCustomSlots(selectedChef) : null;

  const getTimeSlotsToRender = () => {
    if (activeCustomSlots) {
      const activeGroup = activeCustomSlots.find(d => d.day === selectedDate);
      return activeGroup ? activeGroup.slots : [];
    }
    return fallbackTimeSlots;
  };

  const timeSlotsToRender = getTimeSlotsToRender();

  const handleOpenBooking = (chef) => {
    setSelectedChef(chef);
    setSelectedDate("");
    setSelectedTime("");
    setPurpose("");
    setBookingVisible(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedChef) return;
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
        chef_id: selectedChef.id,
        meeting_date: selectedDate,
        meeting_time: selectedTime,
        purpose: purpose || "Kitchen setup and continental menu planning",
      };

      const res = await bookChefAppointment(payload);
      if (res?.success) {
        CustomAlert.show(
          t("success"),
          res?.message || "Appointment booked successfully!",
          [
            {
              text: "Got It",
              onPress: () => {
                setBookingVisible(false);
                setSelectedChef(null);
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
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("chefConnect")}</Text>
        </View>
      </View>

      {/* Filters Metrics Row */}
      <View style={styles.metricsRow}>
        <Text style={styles.metricsText}>
          {filteredChefs.length} {t("approvedProfiles")}
        </Text>
        <TouchableOpacity
          style={styles.advancedFiltersBtn}
          onPress={() => navigation.navigate("ChefConnectFilters", { filters: activeFilters })}
        >
          <Ionicons name="options-outline" size={16} color={PRIMARY_GREEN} style={{ marginRight: 6 }} />
          <Text style={styles.advancedFiltersText}>{t("advancedFilters")}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          placeholder={t("searchPlaceholder")}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Quick Filters Horizontal Scrolling */}
      <View style={styles.quickFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersList}>
          <TouchableOpacity
            style={[styles.quickFilterPill, activeQuickFilter === "all" && styles.quickFilterPillActive]}
            onPress={() => setActiveQuickFilter("all")}
          >
            <Text style={[styles.quickFilterPillText, activeQuickFilter === "all" && styles.quickFilterPillTextActive]}>
              {t("allProfessionals")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterPill, activeQuickFilter === "freelance" && styles.quickFilterPillActive]}
            onPress={() => setActiveQuickFilter("freelance")}
          >
            <Text style={[styles.quickFilterPillText, activeQuickFilter === "freelance" && styles.quickFilterPillTextActive]}>
              {t("freelanceChef")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterPill, activeQuickFilter === "full_time" && styles.quickFilterPillActive]}
            onPress={() => setActiveQuickFilter("full_time")}
          >
            <Text style={[styles.quickFilterPillText, activeQuickFilter === "full_time" && styles.quickFilterPillTextActive]}>
              {t("fullTime")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        </View>
      ) : filteredChefs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="sad-outline" size={64} color="#CBD5E1" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>{t("noChefsFound")}</Text>
          <Text style={styles.emptySubtitle}>{t("adjustFilters")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.chefsList} showsVerticalScrollIndicator={false}>
          {filteredChefs.map((chef) => {
            const logo = getLogoSource(chef);
            const tag = getEmploymentTag(chef);
            const skills = getSkillsList(chef);

            return (
              <View key={chef.id} style={styles.chefCard}>
                <View style={styles.cardHeaderRow}>
                  {logo ? (
                    <Image source={logo} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={24} color="#64748B" />
                    </View>
                  )}
                  <View style={styles.chefBrief}>
                    <View style={styles.chefNameRow}>
                      <Text style={styles.chefName}>{chef.full_name || chef.name}</Text>
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>{tag}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={14} color="#64748B" />
                      <Text style={styles.detailText}>{chef.city || "Dubai, UAE"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="briefcase-outline" size={14} color="#64748B" />
                      <Text style={styles.detailText}>{chef.experience_range || "10"} {t("experience")}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="restaurant-outline" size={14} color="#15803D" />
                      <Text style={[styles.detailText, { color: "#15803D", fontWeight: "700" }]}>
                        {chef.cuisine_specialty || "Continental & Asian Fusion"}
                      </Text>
                    </View>
                  </View>
                </View>

                {skills.length > 0 && (
                  <View style={styles.skillsRow}>
                    {skills.slice(0, 3).map((s, idx) => (
                      <View key={idx} style={styles.skillPill}>
                        <Text style={styles.skillPillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.bookBtn, { backgroundColor: PRIMARY_GREEN }]}
                    activeOpacity={0.8}
                    onPress={() => handleOpenBooking(chef)}
                  >
                    <Text style={styles.bookBtnText}>{t("bookConsultation")}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.viewProfileLink}
                    onPress={() => navigation.navigate("ChefProfileDetails", { chef })}
                  >
                    <Text style={styles.viewProfileLinkText}>{t("viewFullProfile")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

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
              <View>
                <Text style={styles.modalTitle}>{t("bookConsultation")}</Text>
                {selectedChef && (
                  <Text style={styles.modalSubtitle}>{t("with")} {selectedChef.full_name || selectedChef.name}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setBookingVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Date selection */}
              <Text style={styles.modalLabel}>{t("selectDate")}</Text>
              <View style={styles.modalDateRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {activeCustomSlots ? (
                    activeCustomSlots.map((dayGroup) => {
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
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            {/* Modal Action Footer */}
            <TouchableOpacity
              style={[styles.modalBookButton, bookingLoading && { opacity: 0.7 }]}
              onPress={handleBookAppointment}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#1E293B",
  },
  menuIcon: {
    padding: 4,
  },
  titleBanner: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  bannerMainTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  metricsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  advancedFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  advancedFiltersText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1E293B",
  },
  quickFiltersContainer: {
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  quickFiltersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  quickFilterPillActive: {
    backgroundColor: "#15803D",
  },
  quickFilterPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  quickFilterPillTextActive: {
    color: "#FFFFFF",
  },
  chefsList: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  chefCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  chefBrief: {
    flex: 1,
    gap: 2,
  },
  chefNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chefName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  tagBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  skillPill: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillPillText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  cardActions: {
    marginTop: 16,
    gap: 12,
  },
  bookBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  viewProfileLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  viewProfileLinkText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
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
    borderColor: "#F1F5F9",
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  modalScrollBody: {
    paddingVertical: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 10,
  },
  modalDateRow: {
    marginBottom: 8,
  },
  slotPill: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  slotPillSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "#F0FDF4",
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  slotPillTextSelected: {
    color: "#15803D",
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
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  timeSlotCellSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "#F0FDF4",
  },
  timeSlotText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  timeSlotTextSelected: {
    color: "#15803D",
    fontWeight: "750",
  },
  noSlotsText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    paddingHorizontal: 4,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: "#1E293B",
    textAlignVertical: "top",
    backgroundColor: "#F8FAFC",
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
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
