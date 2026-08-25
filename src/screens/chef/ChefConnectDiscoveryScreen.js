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
  Alert,
  Linking,
  Dimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import colors from "../../constants/colors";
import { getEmployerChefs, bookChefAppointment, recordChefProfileView } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";

export default function ChefConnectDiscoveryScreen({ navigation, route }) {
  const { t } = useTranslation();
  
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState("all"); // all, freelance, full_time, part_time

  // Booking Modal States
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const activeFilters = route?.params?.filters || null;

  const handleViewFullProfile = (chef) => {
    if (chef?.id) {
      recordChefProfileView(chef.id).catch(() => null);
    }
    navigation.navigate("ChefProfileDetails", { chef });
  };

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
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};
    if (info && typeof info === "object" && !Array.isArray(info)) {
      list = info.employment_preference || info.employment_preferences || [];
    }
    if (!list || list.length === 0) {
      list = chef.employment_preference || chef.employment_preferences || chefProfileObj.employment_preference || [];
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return [];
  };

  // Helper to extract regional experience defensively
  const getRegionalList = (chef) => {
    let list = [];
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};
    if (info && typeof info === "object" && !Array.isArray(info)) {
      list = info.regional_experience || info.regionalExperience || [];
    }
    if (!list || list.length === 0) {
      list = chef.regional_experience || chef.regionalExperience || chefProfileObj.regional_experience || [];
    }
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return [list];
    return [];
  };

  // Helper to extract availability status dynamically
  const getAvailabilityStatus = (chef) => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};
    return info.availability_status || chef.availability_status || chef.availability || chefProfileObj.availability_status || "Available for Consultation";
  };

  // Filter Logic
  const filteredChefs = chefs.filter((chef) => {
    // 1. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().replace("id:", "").replace("#", "").trim();
      const matchName = (chef.full_name || chef.name || "").toLowerCase().includes(q);
      const matchCuisine = (chef.cuisine_specialty || "").toLowerCase().includes(q);
      const matchCity = (chef.city || chef.location || "").toLowerCase().includes(q);
      const matchId = chef.id ? chef.id.toString() === q : false;
      if (!matchName && !matchCuisine && !matchCity && !matchId) return false;
    }

    // 2. Quick filters
    const empPrefs = getEmploymentList(chef);
    const empPrefsLower = empPrefs.map((x) => String(x).toLowerCase());

    if (activeQuickFilter === "freelance") {
      const isFreelancer = empPrefsLower.some((x) => x.includes("freelance") || x.includes("consultant"));
      if (!isFreelancer) return false;
    } else if (activeQuickFilter === "full_time") {
      const isFullTimer = empPrefsLower.some((x) => x.includes("full") || x.includes("full_time"));
      if (!isFullTimer) return false;
    } else if (activeQuickFilter === "part_time") {
      const isPartTimer = empPrefsLower.some((x) => x.includes("part") || x.includes("part_time"));
      if (!isPartTimer) return false;
    }

    // 3. Advanced filters (from ChefConnectFiltersScreen)
    if (activeFilters) {
      // 3a. Employment Preference
      if (Array.isArray(activeFilters.employment) && activeFilters.employment.length > 0) {
        const matches = empPrefsLower.some((p) =>
          activeFilters.employment.some((filterOpt) => {
            const f = filterOpt.toLowerCase();
            return p.includes(f) || f.includes(p);
          })
        );
        if (!matches) return false;
      }

      // 3b. Experience Level
      const expList = Array.isArray(activeFilters.experienceList) && activeFilters.experienceList.length > 0
        ? activeFilters.experienceList
        : activeFilters.experience
        ? [activeFilters.experience]
        : [];
      if (expList.length > 0) {
        const chefExp = String(
          chef.experience_range || chef.experienceYears || chef.experience || ""
        ).toLowerCase();
        const matches = expList.some((f) => {
          const filterExp = f.toLowerCase();
          return chefExp.includes(filterExp) || filterExp.includes(chefExp);
        });
        if (!matches) return false;
      }

      // 3c. Cuisine Specialization
      if (Array.isArray(activeFilters.cuisines) && activeFilters.cuisines.length > 0) {
        const chefCuisine = String(chef.cuisine_specialty || chef.cuisines || chef.category || "").toLowerCase();
        const matches = activeFilters.cuisines.some((c) => {
          const filterCuisine = c.toLowerCase();
          return chefCuisine.includes(filterCuisine) || filterCuisine.includes(chefCuisine);
        });
        if (!matches) return false;
      }

      // 3d. Operational Expertise / Skills
      if (Array.isArray(activeFilters.operations) && activeFilters.operations.length > 0) {
        const skillsList = getSkillsList(chef).map((s) => String(s).toLowerCase());
        const matches = skillsList.some((s) =>
          activeFilters.operations.some((op) => {
            const filterOp = op.toLowerCase();
            return s.includes(filterOp) || filterOp.includes(s);
          })
        );
        if (!matches) return false;
      }

      // 3e. Business & Brand Development
      if (Array.isArray(activeFilters.business) && activeFilters.business.length > 0) {
        const skillsList = getSkillsList(chef).map((s) => String(s).toLowerCase());
        const matches = skillsList.some((s) =>
          activeFilters.business.some((b) => {
            const filterB = b.toLowerCase();
            return s.includes(filterB) || filterB.includes(s);
          })
        );
        if (!matches) return false;
      }

      // 3f. Regional Experience
      if (Array.isArray(activeFilters.regional) && activeFilters.regional.length > 0) {
        const regionalList = getRegionalList(chef).map((r) => String(r).toLowerCase());
        const matches = regionalList.some((r) =>
          activeFilters.regional.some((reg) => {
            const filterReg = reg.toLowerCase();
            return r.includes(filterReg) || filterReg.includes(r);
          })
        );
        if (!matches) return false;
      }

      // 3g. Location Preference
      if (Array.isArray(activeFilters.locationPreference) && activeFilters.locationPreference.length > 0) {
        const chefLocPref = String(
          chef.locationPreference || chef.location_preference || chef.preferred_location || chef.city || ""
        ).toLowerCase();
        const matches = activeFilters.locationPreference.some((loc) => {
          const filterLoc = loc.toLowerCase();
          return chefLocPref.includes(filterLoc) || filterLoc.includes(chefLocPref);
        });
        if (!matches) return false;
      }
    }

    return true;
  });

  const getSkillsList = (chef) => {
    const list = chef.skills || chef.user?.skills || chef.chef_profile?.skills || chef.chef_profile_details?.skills || chef.operations || [];
    if (Array.isArray(list)) return list;
    if (typeof list === "string") return list.split(",").map(x => x.trim());
    return [];
  };

  const getEmploymentTag = (chef) => {
    const prefs = getEmploymentList(chef);
    if (prefs.length > 0) return prefs[0];
    return "Chef";
  };

  const getDisplayTitle = (chef) => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    return (
      chef?.professionalTitle ||
      chef?.preferred_role ||
      chef?.current_role ||
      chef?.currentRole ||
      chef?.role ||
      chef?.professional_title ||
      chef?.cuisine_specialty ||
      chefProfileObj.preferred_role ||
      chefProfileObj.cuisine_specialty ||
      ""
    );
  };

  const getDisplayExperience = (chef) => {
    return chef?.experienceYears || chef?.experience_range || chef?.experience || chef?.user?.experience_range || "10+ Years";
  };

  const getDisplayPreferredLocation = (chef) => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};
    
    // 1. Get base location preference
    const basePref = info.location_preference || chef?.locationPreference || chef?.location_preference || "";
    let displayBase = basePref === "Both" || basePref === "Both (India & Overseas)" ? "Both (India & Overseas)" : basePref;

    // 2. Get specific location
    const specificLoc = chef?.job_location || chef?.preferred_location || chef?.user?.job_location || "";

    if (displayBase && specificLoc && displayBase.toLowerCase() !== specificLoc.toLowerCase()) {
      return `${displayBase} (${specificLoc})`;
    }
    return displayBase || specificLoc || "";
  };

  const getDisplayCurrentLocation = (chef) => {
    return (
      chef?.current_location ||
      chef?.currentLocation ||
      chef?.job_location ||
      chef?.city ||
      chef?.country ||
      chef?.user?.city ||
      chef?.user?.country ||
      ""
    );
  };

  const getDisplayRegionalExperience = (chef) => {
    const regional = getRegionalList(chef);
    if (regional.length > 0) return regional.join(", ");
    return chef?.regional_experience || chef?.regionalExperience || "";
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
    const url = chef?.calendly_link || chef?.calendlyUrl || chef?.calendlyLink;
    if (url && url.trim()) {
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not open Calendly link: " + err.message);
      });
    } else {
      Alert.alert(
        "Calendly Not Linked", 
        "This chef has not integrated their Calendly calendar yet. Please check their profile or contact them directly."
      );
    }
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
            <Ionicons name="arrow-back" size={24} color="#0a0504" />
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
        <Ionicons name="search-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.searchIcon} />
        <TextInput
          placeholder={t("searchPlaceholder")}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="rgba(10, 5, 4, 0.4)"
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

          <TouchableOpacity
            style={[styles.quickFilterPill, activeQuickFilter === "part_time" && styles.quickFilterPillActive]}
            onPress={() => setActiveQuickFilter("part_time")}
          >
            <Text style={[styles.quickFilterPillText, activeQuickFilter === "part_time" && styles.quickFilterPillTextActive]}>
              {t("partTime", "Part Time")}
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
          <Ionicons name="sad-outline" size={64} color="rgba(10, 5, 4, 0.15)" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>{t("noChefsFound")}</Text>
          <Text style={styles.emptySubtitle}>{t("adjustFilters")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.chefsList} showsVerticalScrollIndicator={false}>
          {filteredChefs.map((chef) => {
            const logo = getLogoSource(chef);
            const tag = getEmploymentTag(chef);
            const skills = getSkillsList(chef);
            const currentRole = getDisplayTitle(chef);
            const experience = getDisplayExperience(chef);
            const preferredLocation = getDisplayPreferredLocation(chef);
            const currentLocation = getDisplayCurrentLocation(chef);
            const regionalExperience = getDisplayRegionalExperience(chef);
            const availabilityStatus = getAvailabilityStatus(chef);
            const availabilityLabel = /notice/i.test(availabilityStatus)
              ? `${availabilityStatus} can join`
              : availabilityStatus;
            const displayCurrentLocation = currentLocation || "N/A";
            const displayPreferredLocation = preferredLocation || "N/A";
            const displayRegionalExperience = regionalExperience || "N/A";

            return (
              <View key={chef.id} style={styles.chefCard}>
                <View style={styles.cardHeaderRow}>
                  {logo ? (
                    <Image source={logo} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={24} color="rgba(10, 5, 4, 0.6)" />
                    </View>
                  )}
                  <View style={styles.chefBrief}>
                    <View style={styles.chefNameRow}>
                      <Text style={[styles.chefName, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
                        {chef.full_name || chef.name}
                      </Text>
                      <View style={styles.badgeRow}>
                        {chef.id ? (
                          <View style={styles.chefIdBadgeInline}>
                            <Text style={styles.chefIdBadgeInlineText}>ID: #{chef.id}</Text>
                          </View>
                        ) : null}
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{tag}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.currentRoleText} numberOfLines={1}>
                      {t("currentRoleLabel", "Current Role:")} <Text style={styles.detailValue}>{currentRole || "N/A"}</Text>
                    </Text>

                    <View style={styles.detailRow}>
                      <Ionicons name="home-outline" size={14} color="rgba(10, 5, 4, 0.6)" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>{t("currentLocationLabel", "Current Location:")}</Text>{" "}
                        <Text style={styles.detailValue}>{displayCurrentLocation}</Text>
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="navigate-outline" size={14} color="rgba(10, 5, 4, 0.6)" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>{t("preferredLocationLabel", "Preferred Job Location:")}</Text>{" "}
                        <Text style={styles.detailValue}>{displayPreferredLocation}</Text>
                      </Text>
                    </View>

                    {experience && (
                      <View style={styles.detailRow}>
                        <Ionicons name="briefcase-outline" size={14} color="rgba(10, 5, 4, 0.6)" />
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>{t("experienceLabel", "Experience:")}</Text>{" "}
                          <Text style={styles.detailValue}>{experience}</Text>
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Ionicons name="map-outline" size={14} color="rgba(10, 5, 4, 0.6)" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>{t("regionalExperienceLabel", "Regional Experience:")}</Text>{" "}
                        <Text style={styles.detailValue}>{displayRegionalExperience}</Text>
                      </Text>
                    </View>

                    <View style={styles.statusRow}>
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>{availabilityLabel}</Text>
                      </View>
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

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={[styles.bookBtn, styles.highlightButton]}
                    activeOpacity={0.8}
                    onPress={() => handleOpenBooking(chef)}
                  >
                    <Text style={styles.bookBtnText}>{t("bookConsultation")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.8}
                    onPress={() => handleViewFullProfile(chef)}
                  >
                    <Text style={styles.secondaryButtonText}>{t("viewFullProfile")}</Text>
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
                <Ionicons name="close" size={24} color="rgba(10, 5, 4, 0.6)" />
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
  headerTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0a0504",
  },
  menuIcon: {
    padding: normalize(4),
  },
  titleBanner: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(14),
    paddingTop: normalize(14),
    paddingBottom: normalize(6),
  },
  bannerMainTitle: {
    fontSize: normalize(18),
    fontWeight: "900",
    color: "#0a0504",
    marginBottom: normalize(3),
  },
  bannerSubtitle: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(8),
    backgroundColor: "#ffffff",
  },
  metricsText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#153e69",
  },
  advancedFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(5),
  },
  advancedFiltersText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: normalize(14),
    marginTop: normalize(10),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    paddingHorizontal: normalize(10),
  },
  searchIcon: {
    marginRight: normalize(6),
  },
  searchInput: {
    flex: 1,
    paddingVertical: normalize(8),
    fontSize: normalize(12.5),
    color: "#0a0504",
  },
  quickFiltersContainer: {
    paddingVertical: normalize(10),
    backgroundColor: "#f2f2f3",
  },
  quickFiltersList: {
    paddingHorizontal: normalize(14),
    gap: normalize(6),
  },
  quickFilterPill: {
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(18),
    backgroundColor: "rgba(10, 5, 4, 0.15)",
  },
  quickFilterPillActive: {
    backgroundColor: "#153e69",
  },
  quickFilterPillText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  quickFilterPillTextActive: {
    color: "#ffffff",
  },
  chefsList: {
    padding: normalize(14),
    gap: normalize(14),
    paddingBottom: normalize(34),
  },
  chefCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: normalize(14),
    shadowColor: "#0a0504",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    position: "relative",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  chefIdBadgeInline: {
    backgroundColor: "rgba(245, 127, 32, 0.08)",
    paddingHorizontal: normalize(6),
    paddingVertical: 2,
    borderRadius: normalize(6),
  },
  chefIdBadgeInlineText: {
    fontSize: normalize(9.5),
    fontWeight: "800",
    color: "#f57f20",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(10),
    marginRight: normalize(12),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  avatarPlaceholder: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(10),
    backgroundColor: "#f2f2f3",
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
    marginBottom: normalize(3),
  },
  chefName: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0a0504",
  },
  tagBadge: {
    backgroundColor: "#f2f2f3",
    paddingHorizontal: normalize(6),
    paddingVertical: 2,
    borderRadius: normalize(6),
  },
  tagBadgeText: {
    fontSize: normalize(9.5),
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(5),
  },
  detailText: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
  },
  detailLabel: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: normalize(11.5),
    color: "#153e69",
    fontWeight: "700",
  },
  currentRoleText: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.8)",
    fontWeight: "700",
    marginBottom: 2,
  },
  titleText: {
    fontSize: normalize(11.5),
    color: "#153e69",
    fontWeight: "700",
    marginBottom: 2,
  },
  bioText: {
    fontSize: normalize(10.5),
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: normalize(3),
    lineHeight: normalize(14),
  },
  statusRow: {
    marginTop: normalize(4),
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: normalize(6),
    paddingVertical: 2,
    borderRadius: normalize(6),
  },
  statusDot: {
    width: normalize(5),
    height: normalize(5),
    borderRadius: normalize(2.5),
    backgroundColor: PRIMARY_GREEN,
    marginRight: normalize(4),
  },
  statusText: {
    fontSize: normalize(9.5),
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(5),
    marginTop: normalize(10),
  },
  skillPill: {
    backgroundColor: "#f2f2f3",
    borderRadius: normalize(6),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(3),
  },
  skillPillText: {
    fontSize: normalize(9.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  cardActionsRow: {
    marginTop: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: normalize(8),
  },
  bookBtn: {
    borderRadius: normalize(10),
    paddingVertical: normalize(10),
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  highlightButton: {
    backgroundColor: PRIMARY_GREEN,
  },
  bookBtnText: {
    color: "#ffffff",
    fontSize: normalize(12),
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(10),
  },
  secondaryButtonText: {
    fontSize: normalize(12),
    color: "rgba(10, 5, 4, 0.7)",
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: normalize(28),
  },
  emptyTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
  },

  // Modal styling
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
  modalSubtitle: {
    fontSize: normalize(11.5),
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
    marginTop: 2,
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
});
