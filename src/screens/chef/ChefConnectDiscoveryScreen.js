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
import { getEmployerChefs, bookChefAppointment, recordChefProfileView } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_NAVY = "#0f2342";
const PRIMARY_BLUE = "#1d4ed8";
const PRIMARY_GREEN = "#16a34a";

export default function ChefConnectDiscoveryScreen({ navigation, route }) {
  const { t } = useTranslation();
  
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState("all"); // all, freelance, full_time, contract, project_based, consultant
  const [viewedChefsMap, setViewedChefsMap] = useState({});

  // Booking Modal States
  const [bookingVisible, setBookingVisible] = useState(false);
  const [noCalendlyModalVisible, setNoCalendlyModalVisible] = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const activeFilters = route?.params?.filters || null;

  const handleViewFullProfile = (chef) => {
    if (chef?.id) {
      recordChefProfileView(chef.id).catch(() => null);
      setViewedChefsMap((prev) => ({ ...prev, [chef.id]: true }));
    }
    navigation.navigate("ChefProfileDetails", { chef });
  };

  const fetchChefs = async () => {
    setLoading(true);
    try {
      const res = await getEmployerChefs();
      const list = res?.chefs || res?.data || res?.items || res?.profiles || (Array.isArray(res) ? res : []);
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
    const uri = chef?.profile_photo_path || chef?.profile_photo || chef?.photo_url || chef?.avatar_url || chef?.avatar;
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

  const normalizeStr = (str) =>
    String(str || "")
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // Defensive extractor helpers
  const getEmploymentList = (chef) => {
    if (!chef) return [];
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};

    let list =
      info.employment_preference ||
      info.employment_preferences ||
      chefProfileObj.employment_preference ||
      chefProfileObj.employment_preferences ||
      chef.employment_preference ||
      chef.employment_preferences ||
      [];

    if (typeof list === "string") {
      try {
        if (list.trim().startsWith("[")) list = JSON.parse(list);
        else list = list.split(",").map((x) => x.trim()).filter(Boolean);
      } catch (e) {
        list = [list];
      }
    }
    if (Array.isArray(list)) return list.map(String).filter(Boolean);
    return [];
  };

  const getRegionalList = (chef) => {
    if (!chef) return [];
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};

    let list =
      info.regional_experience ||
      info.regionalExperience ||
      chefProfileObj.regional_experience ||
      chefProfileObj.regionalExperience ||
      chef.regional_experience ||
      chef.regionalExperience ||
      [];

    if (typeof list === "string") {
      try {
        if (list.trim().startsWith("[")) list = JSON.parse(list);
        else list = list.split(",").map((x) => x.trim()).filter(Boolean);
      } catch (e) {
        list = [list];
      }
    }
    if (Array.isArray(list)) return list.map(String).filter(Boolean);
    return [];
  };

  const getSkillsList = (chef) => {
    if (!chef) return [];
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};

    const rawSources = [
      chef.operational_expertise,
      chef.operational_experties,
      chef.skills,
      chef.core_skills,
      chef.bio,
      chefProfileObj.operational_expertise,
      chefProfileObj.operational_experties,
      chefProfileObj.skills,
      chefProfileObj.core_skills,
      chefProfileObj.bio,
      info.operational_expertise,
      info.operational_experties,
      info.skills,
      info.core_skills,
      chef.operations,
    ];

    let combined = [];
    rawSources.forEach((raw) => {
      if (!raw) return;
      if (Array.isArray(raw)) {
        combined.push(...raw.map(String));
      } else if (typeof raw === "string" && raw.trim()) {
        const str = raw.trim();
        if (str.startsWith("[") && str.endsWith("]")) {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) combined.push(...parsed.map(String));
          } catch (e) {
            combined.push(...str.split(",").map((x) => x.trim()));
          }
        } else {
          combined.push(...str.split(",").map((x) => x.trim()));
        }
      }
    });

    return Array.from(new Set(combined.filter(Boolean)));
  };

  const getCuisinesList = (chef) => {
    if (!chef) return [];
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};

    const rawSources = [
      chef.cuisine_specialty,
      chef.specialties,
      chef.cuisines,
      chef.category,
      chefProfileObj.cuisine_specialty,
      chefProfileObj.specialties,
      chefProfileObj.cuisines,
      chefProfileObj.category,
    ];

    let combined = [];
    rawSources.forEach((raw) => {
      if (!raw) return;
      if (Array.isArray(raw)) {
        combined.push(...raw.map(String));
      } else if (typeof raw === "string" && raw.trim()) {
        const str = raw.trim();
        if (str.startsWith("[") && str.endsWith("]")) {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) combined.push(...parsed.map(String));
          } catch (e) {
            combined.push(...str.split(",").map((x) => x.trim()));
          }
        } else {
          combined.push(...str.split(",").map((x) => x.trim()));
        }
      }
    });

    return Array.from(new Set(combined.filter(Boolean)));
  };

  const getChefExperienceYears = (chef) => {
    if (!chef) return null;
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};

    const raw =
      chef.experience_years ??
      chef.experience_range ??
      chef.total_experience ??
      chef.experienceYears ??
      chef.experience ??
      chefProfileObj.experience_years ??
      chefProfileObj.experience_range ??
      chefProfileObj.total_experience ??
      chefProfileObj.experienceYears ??
      chefProfileObj.experience;

    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw === "number") return raw;

    const str = String(raw).toLowerCase();
    const digits = str.match(/\d+/g);
    if (digits && digits.length > 0) {
      return parseInt(digits[0], 10);
    }
    return str;
  };

  // Filter Logic
  const filteredChefs = chefs.filter((chef) => {
    // 1. Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().replace("id:", "").replace("#", "").trim();
      const matchName = (chef.full_name || chef.name || "").toLowerCase().includes(q);
      const matchCuisine = (chef.cuisine_specialty || chef.specialties || "").toLowerCase().includes(q);
      const matchCity = (chef.city || chef.location || chef.country || "").toLowerCase().includes(q);
      const matchId = chef.id ? chef.id.toString() === q : false;
      if (!matchName && !matchCuisine && !matchCity && !matchId) return false;
    }

    // 2. Quick filters
    const empPrefs = getEmploymentList(chef);
    const empPrefsLower = empPrefs.map((x) => normalizeStr(x));

    if (activeQuickFilter === "freelance") {
      const isFreelancer = empPrefsLower.some((x) => x.includes("freelance") || x.includes("consultant"));
      if (!isFreelancer) return false;
    } else if (activeQuickFilter === "full_time") {
      const isFullTimer = empPrefsLower.some((x) => x.includes("full") || x.includes("full time"));
      if (!isFullTimer) return false;
    } else if (activeQuickFilter === "contract") {
      const isContractor = empPrefsLower.some((x) => x.includes("contract"));
      if (!isContractor) return false;
    } else if (activeQuickFilter === "project_based") {
      const isProject = empPrefsLower.some((x) => x.includes("project"));
      if (!isProject) return false;
    } else if (activeQuickFilter === "consultant") {
      const isConsultant = empPrefsLower.some((x) => x.includes("consultant"));
      if (!isConsultant) return false;
    }

    // 3. Advanced filters (from ChefConnectFiltersScreen)
    if (activeFilters) {
      if (Array.isArray(activeFilters.employment) && activeFilters.employment.length > 0) {
        const locPref = normalizeStr(
          chef.location_preference ||
          chef.chef_profile?.availability_info?.location_preference ||
          chef.availability_info?.location_preference
        );
        const rawEmpStr = empPrefsLower.join(" ");

        const matches = activeFilters.employment.some((filterOpt) => {
          const f = normalizeStr(filterOpt).replace(/chef/gi, "").trim();
          if (f.includes("overseas")) {
            return (
              locPref.includes("overseas") ||
              locPref.includes("both") ||
              locPref.includes("international") ||
              locPref.includes("abroad") ||
              rawEmpStr.includes("overseas")
            );
          }
          return empPrefsLower.some((p) => p.includes(f) || f.includes(p)) || rawEmpStr.includes(f);
        });
        if (!matches) return false;
      }

      const expList = Array.isArray(activeFilters.experienceList) && activeFilters.experienceList.length > 0
        ? activeFilters.experienceList
        : activeFilters.experience
        ? [activeFilters.experience]
        : [];

      if (expList.length > 0) {
        const chefExpVal = getChefExperienceYears(chef);
        const rawChefExpStr = normalizeStr(
          chef.experience_range || chef.experience_years || chef.experience || chef.chef_profile?.experience_range || ""
        );

        const matches = expList.some((filterOpt) => {
          const optStr = normalizeStr(filterOpt);

          if (typeof chefExpVal === "number") {
            if (optStr.includes("1 3")) return chefExpVal >= 1 && chefExpVal <= 3;
            if (optStr.includes("3 5")) return chefExpVal >= 3 && chefExpVal <= 5;
            if (optStr.includes("5 10")) return chefExpVal >= 5 && chefExpVal <= 10;
            if (optStr.includes("10")) return chefExpVal >= 10;
          }

          const digits = optStr.match(/\d+/g);
          if (digits && digits.length >= 2) {
            const min = parseInt(digits[0], 10);
            const max = parseInt(digits[1], 10);
            if (typeof chefExpVal === "number") return chefExpVal >= min && chefExpVal <= max;
          } else if (digits && digits.length === 1 && optStr.includes("+")) {
            const min = parseInt(digits[0], 10);
            if (typeof chefExpVal === "number") return chefExpVal >= min;
          }

          const cleanFilter = optStr.replace(/years?|\+/gi, "").trim();
          return rawChefExpStr.includes(cleanFilter) || cleanFilter.includes(rawChefExpStr);
        });

        if (!matches) return false;
      }

      if (Array.isArray(activeFilters.cuisines) && activeFilters.cuisines.length > 0) {
        const chefCuisineList = getCuisinesList(chef).map(normalizeStr);
        const rawCuisineStr = chefCuisineList.join(" ");

        const matches = activeFilters.cuisines.some((cOpt) => {
          const cleanOpt = normalizeStr(cOpt).replace(/chef/gi, "").trim();
          return (
            chefCuisineList.some((c) => c.includes(cleanOpt) || cleanOpt.includes(c)) ||
            rawCuisineStr.includes(cleanOpt)
          );
        });
        if (!matches) return false;
      }

      if (Array.isArray(activeFilters.operations) && activeFilters.operations.length > 0) {
        const chefSkillsList = getSkillsList(chef).map(normalizeStr);
        const rawSkillsStr = chefSkillsList.join(" ");

        const matches = activeFilters.operations.some((opOpt) => {
          const fullOp = normalizeStr(opOpt);
          const cleanOp = fullOp.replace(/(consultant|expert|specialist|analyst|writer|creator|development)/gi, "").trim();

          return (
            chefSkillsList.some((s) => s.includes(cleanOp) || cleanOp.includes(s) || s.includes(fullOp) || fullOp.includes(s)) ||
            rawSkillsStr.includes(cleanOp) ||
            rawSkillsStr.includes(fullOp)
          );
        });
        if (!matches) return false;
      }

      if (Array.isArray(activeFilters.business) && activeFilters.business.length > 0) {
        const chefSkillsList = getSkillsList(chef).map(normalizeStr);
        const rawSkillsStr = chefSkillsList.join(" ");

        const matches = activeFilters.business.some((bOpt) => {
          const fullB = normalizeStr(bOpt);
          const cleanB = fullB.replace(/(chef|consultant|expert|specialist|analyst|writer|creator|development)/gi, "").trim();

          return (
            chefSkillsList.some((s) => s.includes(cleanB) || cleanB.includes(s) || s.includes(fullB) || fullB.includes(s)) ||
            rawSkillsStr.includes(cleanB) ||
            rawSkillsStr.includes(fullB)
          );
        });
        if (!matches) return false;
      }

      if (Array.isArray(activeFilters.regional) && activeFilters.regional.length > 0) {
        const chefRegList = getRegionalList(chef).map(normalizeStr);
        const rawRegStr = chefRegList.join(" ");

        const matches = activeFilters.regional.some((rOpt) => {
          const fullR = normalizeStr(rOpt);
          const cleanR = fullR.replace(/experience/gi, "").trim();

          return (
            chefRegList.some((r) => r.includes(cleanR) || cleanR.includes(r) || r.includes(fullR) || fullR.includes(r)) ||
            rawRegStr.includes(cleanR) ||
            rawRegStr.includes(fullR)
          );
        });
        if (!matches) return false;
      }

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

  const isChefAvailable = (chef) => {
    if (!chef) return false;
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};

    const statusStr = String(
      info.availability_status || info.status || chef.availability_status || chef.status || chef.availability || ""
    ).toLowerCase().trim();

    if (statusStr.includes("employed") || statusStr.includes("not") || statusStr.includes("busy") || statusStr.includes("unavailable") || statusStr.includes("offline")) {
      return false;
    }
    if (statusStr.includes("available")) {
      return true;
    }
    return false;
  };

  const getDisplayTitle = (chef) => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    return (
      chef?.preferred_role ||
      chef?.current_role ||
      chef?.currentRole ||
      chef?.professionalTitle ||
      chef?.role ||
      chef?.professional_title ||
      chefProfileObj.preferred_role ||
      "Executive Chef"
    );
  };

  const getDisplayExperience = (chef) => {
    return chef?.experience_range || chef?.experienceYears || chef?.experience || chef?.user?.experience_range || "6+ Years";
  };

  const getDisplayLocation = (chef) => {
    const loc = [chef?.city, chef?.country].filter(Boolean).join(", ");
    return loc || chef?.job_location || chef?.current_location || "Mumbai, India";
  };



  const getPreferredLocationFlags = (chef) => {
    const chefProfileObj = chef.chef_profile || chef.chef_profile_details || chef.user?.chef_profile || {};
    const info = chef.availability_info || chefProfileObj.availability_info || {};
    const locPref = String(info.location_preference || chef?.location_preference || chef?.regional_experience || "").toLowerCase();

    const flags = [];
    if (locPref.includes("india") || locPref.includes("domestic") || locPref.includes("both")) {
      flags.push({ id: "india", icon: "🇮🇳" });
    }
    if (locPref.includes("saudi") || locPref.includes("gcc") || locPref.includes("gulf") || locPref.includes("bahrain") || locPref.includes("both")) {
      flags.push({ id: "saudi", icon: "🇸🇦" });
    }
    if (locPref.includes("global") || locPref.includes("overseas") || locPref.includes("international") || flags.length === 0) {
      flags.push({ id: "global", icon: "🌐" });
    }

    return flags;
  };

  const handleOpenBooking = (chef) => {
    setSelectedChef(chef);
    const url = chef?.calendly_link || chef?.calendlyUrl || chef?.calendlyLink;
    if (url && typeof url === "string" && url.trim().length > 0) {
      Linking.openURL(url.trim()).catch((err) => {
        Alert.alert(t("error", "Error"), "Could not open Calendly link: " + err.message);
      });
    } else {
      setNoCalendlyModalVisible(true);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedChef) return;
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
        chef_id: selectedChef.id,
        meeting_date: selectedDate,
        meeting_time: selectedTime,
        purpose: purpose || "Kitchen setup and menu planning consultation",
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
                setSelectedChef(null);
                setPurpose("");
                setSelectedDate("");
                setSelectedTime("");
              },
            },
          ]
        );
      } else {
        CustomAlert.show(t("bookingFailed", "Booking Failed"), res?.message || t("failedToBook", "Failed to book appointment."));
      }
    } catch (error) {
      CustomAlert.show(t("bookingError", "Booking Error"), error.message || t("bookingErrorOccurred", "An error occurred during booking."));
    } finally {
      setBookingLoading(false);
    }
  };

  const fallbackDates = ["Mon, Aug 31", "Tue, Sep 1", "Wed, Sep 2", "Thu, Sep 3", "Fri, Sep 4"];
  const fallbackTimes = ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];
  const hasActiveFilters = Boolean(
    (searchQuery && searchQuery.trim().length > 0) ||
    (activeQuickFilter && activeQuickFilter !== "all") ||
    (activeFilters && Object.values(activeFilters).some((val) => {
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "boolean") return val;
      return Boolean(val);
    }))
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={normalize(22)} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("chefConnect", "Chef Connect")}</Text>
        </View>
        <View style={{ width: normalize(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Green Hero Metrics Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBannerLeft}>
            <View style={styles.heroIconBadge}>
              <Ionicons name="people" size={normalize(18)} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroBannerTitle}>
                {t("approvedChefProfilesCount", "Approved Chef Profiles")}
              </Text>
              <Text style={styles.heroBannerSubtitle}>
                {t("connectWithVerifiedCulinary", "Connect with verified culinary experts for your business.")}
              </Text>
            </View>
          </View>
          <View style={styles.heroLogoRow}>
            <Ionicons name="restaurant-outline" size={normalize(16)} color="#153e69" style={{ marginRight: normalize(3) }} />
            <View>
              <Text style={styles.heroLogoTop}>Chef</Text>
              <Text style={styles.heroLogoSub}>Connect</Text>
            </View>
          </View>
        </View>

        {/* Search Input Container */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={normalize(18)} color="#94a3b8" style={{ marginRight: normalize(8) }} />
          <TextInput
            placeholder={t("searchChefPlaceholder", "Search by name, cuisine, or location")}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Quick Filter Pills Row */}
        <View style={styles.quickFilterScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilterList}>
            <TouchableOpacity
              style={[styles.quickPill, activeQuickFilter === "all" && styles.quickPillActive]}
              onPress={() => setActiveQuickFilter("all")}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickPillText, activeQuickFilter === "all" && styles.quickPillTextActive]}>
                {t("all", "All")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickPill, activeQuickFilter === "freelance" && styles.quickPillActive]}
              onPress={() => setActiveQuickFilter("freelance")}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickPillText, activeQuickFilter === "freelance" && styles.quickPillTextActive]}>
                {t("freelance", "Freelance")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickPill, activeQuickFilter === "full_time" && styles.quickPillActive]}
              onPress={() => setActiveQuickFilter("full_time")}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickPillText, activeQuickFilter === "full_time" && styles.quickPillTextActive]}>
                {t("fullTime", "Full Time")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickPill, activeQuickFilter === "contract" && styles.quickPillActive]}
              onPress={() => setActiveQuickFilter("contract")}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickPillText, activeQuickFilter === "contract" && styles.quickPillTextActive]}>
                {t("contract", "Contract")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickPill, activeQuickFilter === "project_based" && styles.quickPillActive]}
              onPress={() => setActiveQuickFilter("project_based")}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickPillText, activeQuickFilter === "project_based" && styles.quickPillTextActive]}>
                {t("projectBased", "Project Based")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickPill, activeQuickFilter === "consultant" && styles.quickPillActive]}
              onPress={() => setActiveQuickFilter("consultant")}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickPillText, activeQuickFilter === "consultant" && styles.quickPillTextActive]}>
                {t("consultant", "Consultant")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Total Chefs Count & Advanced Filters Row */}
        <View style={styles.advFilterBtnRow}>
          {hasActiveFilters ? (
            <Text style={styles.totalChefsCountText}>
              {t("totalChefsCount", "{{count}} Chefs Available", { count: filteredChefs.length })}
            </Text>
          ) : (
            <View />
          )}

          <TouchableOpacity
            style={styles.advFilterOutlineBtn}
            onPress={() => navigation.navigate("ChefConnectFilters", { filters: activeFilters })}
            activeOpacity={0.8}
          >
            <Ionicons name="funnel-outline" size={normalize(14)} color="#1d4ed8" style={{ marginRight: normalize(4) }} />
            <Text style={styles.advFilterOutlineBtnText}>{t("advancedFilters", "Advanced Filters")}</Text>
          </TouchableOpacity>
        </View>

        {/* Chef Cards List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#153e69" />
          </View>
        ) : filteredChefs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="restaurant-outline" size={normalize(48)} color="#cbd5e1" style={{ marginBottom: normalize(8) }} />
            <Text style={styles.emptyTitle}>{t("noChefsFound", "No Chefs Found")}</Text>
            <Text style={styles.emptySubtitle}>{t("adjustFilters", "Try adjusting your search or filter preferences.")}</Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={{
                  marginTop: normalize(12),
                  backgroundColor: "#eff6ff",
                  paddingHorizontal: normalize(16),
                  paddingVertical: normalize(8),
                  borderRadius: normalize(8),
                  borderWidth: 1,
                  borderColor: "#bfdbfe",
                }}
                onPress={() => {
                  setSearchQuery("");
                  setActiveQuickFilter("all");
                  navigation.setParams({ filters: null });
                }}
              >
                <Text style={{ fontSize: normalize(12.5), fontWeight: "700", color: "#1d4ed8" }}>
                  {t("clearAllFilters", "Clear All Filters")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.chefCardsContainer}>
            {filteredChefs.map((chef) => {
              const avatarSource = getLogoSource(chef);
              const chefName = chef.full_name || chef.name || `Chef #${chef.id}`;
              const chefTitle = getDisplayTitle(chef);
              const location = getDisplayLocation(chef);
              const experience = getDisplayExperience(chef);
              const cuisines = chef.cuisine_specialty || chef.specialties || "Indian Cuisine, Fine Dining";
              const skillsList = getSkillsList(chef);
              const visibleSkills = skillsList.slice(0, 2);
              const overflowCount = Math.max(0, skillsList.length - 2);
              const flagList = getPreferredLocationFlags(chef);
              const isViewed = viewedChefsMap[chef.id] || chef.viewed;

              return (
                <TouchableOpacity
                  key={chef.id}
                  style={styles.chefCard}
                  onPress={() => handleViewFullProfile(chef)}
                  activeOpacity={0.9}
                >
                  {/* Card Main Row */}
                  <View style={styles.cardMainRow}>
                    {/* Avatar Container with Green Online Dot */}
                    <View style={styles.avatarWrap}>
                      {avatarSource ? (
                        <Image source={avatarSource} style={styles.avatarImg} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person" size={normalize(24)} color="#94a3b8" />
                        </View>
                      )}
                      {isChefAvailable(chef) && <View style={styles.onlineGreenDot} />}
                    </View>

                    {/* Middle Info Column */}
                    <View style={styles.chefInfoCol}>
                      {/* Name Row with Checkmark */}
                      <View style={styles.nameRow}>
                        <Text style={styles.chefNameText} numberOfLines={1}>
                          {chefName}
                        </Text>
                        <Ionicons name="checkmark-circle" size={normalize(15)} color="#1d4ed8" style={{ marginLeft: normalize(4) }} />
                      </View>

                      {/* Title / Role */}
                      <Text style={styles.chefRoleText} numberOfLines={1}>
                        {chefTitle}
                      </Text>

                      {/* Meta Row 1: Location & Experience */}
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={normalize(12)} color="#64748b" style={{ marginRight: normalize(2), flexShrink: 0 }} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {location}
                        </Text>
                        <Text style={styles.metaDivider}>|</Text>
                        <Ionicons name="briefcase-outline" size={normalize(12)} color="#64748b" style={{ marginRight: normalize(2), flexShrink: 0 }} />
                        <Text style={styles.metaText} numberOfLines={1}>{experience}</Text>
                      </View>

                      {/* Meta Row 2: Rating & Cuisines */}
                      <View style={styles.metaRow}>
                        {chef?.rating ? (
                          <>
                            <Ionicons name="star" size={normalize(12)} color="#f59e0b" style={{ marginRight: normalize(2), flexShrink: 0 }} />
                            <Text style={styles.metaText}>
                              {chef.rating} {chef.reviews_count ? `(${chef.reviews_count})` : ""}
                            </Text>
                            <Text style={styles.metaDivider}>|</Text>
                          </>
                        ) : null}
                        <Ionicons name="restaurant-outline" size={normalize(12)} color="#64748b" style={{ marginRight: normalize(2), flexShrink: 0 }} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {cuisines}
                        </Text>
                      </View>
                    </View>

                    {/* Right Actions Row (Viewed & Schedule Buttons in 1 Row without border & background) */}
                    <View style={styles.actionsRow}>
                      {/* Viewed Button */}
                      <TouchableOpacity
                        style={styles.actionCircleBtn}
                        onPress={() => handleViewFullProfile(chef)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={normalize(20)}
                          color={isViewed ? "#16a34a" : "#64748b"}
                        />
                        <Text style={[styles.actionBtnLabel, isViewed && { color: "#16a34a" }]}>
                          {isViewed ? t("viewed", "Viewed") : t("notViewed", "Not Viewed")}
                        </Text>
                      </TouchableOpacity>

                      {/* Schedule Button */}
                      <TouchableOpacity
                        style={styles.actionCircleBtn}
                        onPress={() => handleOpenBooking(chef)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="calendar-outline" size={normalize(20)} color="#1d4ed8" />
                        <Text style={[styles.actionBtnLabel, { color: "#1d4ed8" }]}>
                          {t("schedule", "Schedule")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Bottom Row: Skill Pills & Preferred Location Flags */}
                  <View style={styles.cardBottomRow}>
                    {/* Skill Pills */}
                    <View style={styles.skillPillsRow}>
                      {visibleSkills.map((sk, idx) => (
                        <View key={idx} style={styles.skillPill}>
                          <Text style={styles.skillPillText}>{sk}</Text>
                        </View>
                      ))}
                      {overflowCount > 0 && (
                        <View style={[styles.skillPill, styles.overflowPill]}>
                          <Text style={styles.overflowPillText}>+{overflowCount}</Text>
                        </View>
                      )}
                    </View>

                    {/* Preferred Location Flags */}
                    <View style={styles.flagsCol}>
                      <Text style={styles.flagsLabel}>{t("preferredLocations", "Preferred Location(s)")}</Text>
                      <View style={styles.flagsRow}>
                        {flagList.map((f, fIdx) => (
                          <View key={fIdx} style={styles.flagCircle}>
                            {f.icon === "🌐" ? (
                              <Ionicons name="globe-outline" size={normalize(12)} color="#1d4ed8" />
                            ) : (
                              <Text style={{ fontSize: normalize(12) }}>{f.icon}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom Verified Shield Banner */}
        <View style={styles.verifiedShieldBanner}>
          <Ionicons name="shield-checkmark-outline" size={normalize(22)} color="#16a34a" style={{ marginRight: normalize(10) }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shieldTitle}>
              {t("allChefsVerifiedApproved", "All chefs are verified & approved")}
            </Text>
            <Text style={styles.shieldSubtitle}>
              {t("everyProfileReviewedQuality", "Every profile is carefully reviewed to ensure authenticity and quality.")}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Appointment Booking Modal */}
      <Modal
        visible={bookingVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("scheduleConsultation", "Schedule Consultation")}</Text>
              <TouchableOpacity onPress={() => setBookingVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={normalize(22)} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedChef && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalChefSummary}>
                  <Text style={styles.modalChefName}>{selectedChef.full_name || selectedChef.name}</Text>
                  <Text style={styles.modalChefRole}>{getDisplayTitle(selectedChef)}</Text>
                </View>

                {/* Date Picker */}
                <Text style={styles.inputSectionLabel}>{t("selectDate", "Select Preferred Date")}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: normalize(12) }}>
                  {fallbackDates.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dateChip, selectedDate === d && styles.dateChipSelected]}
                      onPress={() => setSelectedDate(d)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateChipText, selectedDate === d && styles.dateChipTextSelected]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Time Slot Picker */}
                <Text style={styles.inputSectionLabel}>{t("selectTime", "Select Preferred Time Slot")}</Text>
                <View style={styles.timeSlotsGrid}>
                  {fallbackTimes.map((tm) => (
                    <TouchableOpacity
                      key={tm}
                      style={[styles.timeChip, selectedTime === tm && styles.timeChipSelected]}
                      onPress={() => setSelectedTime(tm)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.timeChipText, selectedTime === tm && styles.timeChipTextSelected]}>
                        {tm}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Purpose Notes */}
                <Text style={styles.inputSectionLabel}>{t("consultationNotes", "Consultation Notes / Purpose")}</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder={t("notesPlaceholder", "e.g., Kitchen setup, menu planning, SOP review")}
                  value={purpose}
                  onChangeText={setPurpose}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />

                {/* Submit Booking */}
                <TouchableOpacity
                  style={styles.bookSubmitBtn}
                  onPress={handleBookAppointment}
                  disabled={bookingLoading}
                  activeOpacity={0.85}
                >
                  {bookingLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.bookSubmitBtnText}>{t("confirmBooking", "Confirm Booking")}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Calendly Not Linked Professional Modal */}
      <Modal
        visible={noCalendlyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoCalendlyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNoCalendlyModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { padding: normalize(16) }]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="calendar-outline" size={normalize(20)} color="#ea580c" style={{ marginRight: normalize(6) }} />
                <Text style={styles.modalTitle}>{t("calendlyNotLinkedTitle", "Calendly Schedule Unavailable")}</Text>
              </View>
              <TouchableOpacity onPress={() => setNoCalendlyModalVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={normalize(22)} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedChef && (
              <View style={{ paddingVertical: normalize(4) }}>
                {/* Chef Summary Box */}
                <View style={styles.modalChefSummary}>
                  <Text style={styles.modalChefName}>{selectedChef.full_name || selectedChef.name}</Text>
                  <Text style={styles.modalChefRole}>{getDisplayTitle(selectedChef)}</Text>
                </View>

                {/* Professional Notice Box */}
                <View style={[styles.noticeBoxOrange, { marginBottom: 0 }]}>
                  <Ionicons name="information-circle-outline" size={normalize(24)} color="#ea580c" style={{ marginRight: normalize(10) }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeBoxTitle}>{t("calendlyNotIntegrated", "Calendly Not Integrated")}</Text>
                    <Text style={styles.noticeBoxText}>
                      {t("calendlyNotLinkedNotice", "This chef has not linked their Calendly calendar for instant booking yet. You can view their full profile or contact them directly.")}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    height: normalize(52),
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
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
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  bellBtn: {
    padding: normalize(4),
    position: "relative",
  },
  bellBadgeDot: {
    position: "absolute",
    top: normalize(4),
    right: normalize(4),
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: "#16a34a",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  scrollBody: {
    padding: normalize(14),
    paddingBottom: normalize(40),
  },

  // Green Hero Metrics Banner
  heroBanner: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: normalize(12),
    padding: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(14),
  },
  heroBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  heroIconBadge: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  heroBannerTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#0f172a",
  },
  heroBannerSubtitle: {
    fontSize: normalize(10.5),
    color: "#64748b",
    marginTop: normalize(1),
  },
  heroLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: normalize(8),
  },
  heroLogoTop: {
    fontSize: normalize(10),
    fontWeight: "900",
    color: "#153e69",
    lineHeight: normalize(11),
  },
  heroLogoSub: {
    fontSize: normalize(10),
    fontWeight: "900",
    color: "#16a34a",
    lineHeight: normalize(11),
  },

  // Search Bar Container
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(10),
    height: normalize(42),
    marginBottom: normalize(12),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(12),
    color: "#0f172a",
    paddingVertical: 0,
  },
  searchFilterIconBtn: {
    padding: normalize(4),
  },

  // Quick Filter Pills
  quickFilterScrollWrap: {
    marginBottom: normalize(12),
  },
  quickFilterList: {
    flexDirection: "row",
    gap: normalize(6),
  },
  quickPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: normalize(18),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(6),
    alignItems: "center",
    justifyContent: "center",
  },
  quickPillActive: {
    backgroundColor: PRIMARY_NAVY,
  },
  quickPillText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#475569",
  },
  quickPillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // Advanced Filters Outline Button Row
  advFilterBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(12),
  },
  totalChefsCountText: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#1e293b",
  },
  advFilterOutlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
    backgroundColor: "#ffffff",
  },
  advFilterOutlineBtnText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: PRIMARY_NAVY,
  },

  // Loading & Empty States
  loadingBox: {
    paddingVertical: normalize(40),
    alignItems: "center",
  },
  emptyBox: {
    paddingVertical: normalize(40),
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: normalize(11),
    color: "#64748b",
    marginTop: normalize(2),
  },

  // Chef Cards Styling
  chefCardsContainer: {
    gap: normalize(8),
  },
  chefCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(8),
    padding: normalize(8),
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarWrap: {
    position: "relative",
    marginRight: normalize(10),
  },
  avatarImg: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
  },
  avatarPlaceholder: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineGreenDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: normalize(14),
    height: normalize(14),
    borderRadius: normalize(7),
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  // Chef Info Column
  chefInfoCol: {
    flex: 1,
    minWidth: 0,
    marginRight: normalize(8),
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  chefNameText: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0f172a",
    flexShrink: 1,
  },
  chefRoleText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#1e40af",
    marginTop: normalize(1),
    marginBottom: normalize(4),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(2),
    minWidth: 0,
  },
  metaText: {
    fontSize: normalize(10.5),
    color: "#475569",
    flexShrink: 1,
  },
  metaDivider: {
    fontSize: normalize(10.5),
    color: "#cbd5e1",
    marginHorizontal: normalize(4),
    flexShrink: 0,
  },

  // Actions Row (Right Side Buttons in 1 Row without border & bg)
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
    flexShrink: 0,
    marginLeft: normalize(4),
  },
  actionCircleBtn: {
    alignItems: "center",
    justifyContent: "center",
    padding: normalize(2),
  },
  actionBtnLabel: {
    fontSize: normalize(9),
    fontWeight: "700",
    color: "#64748b",
    marginTop: normalize(2),
  },

  // Card Bottom Row: Skill Pills & Flag Badges (NO HORIZONTAL LINE)
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: normalize(8),
  },
  skillPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
    flex: 1,
    marginRight: normalize(8),
  },
  skillPill: {
    backgroundColor: "#eff6ff",
    borderRadius: normalize(14),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
  },
  skillPillText: {
    fontSize: normalize(10.5),
    fontWeight: "600",
    color: "#1d4ed8",
  },
  overflowPill: {
    backgroundColor: "#f1f5f9",
    borderRadius: normalize(14),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
  },
  overflowPillText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#64748b",
  },

  flagsCol: {
    alignItems: "flex-end",
  },
  flagsLabel: {
    fontSize: normalize(9.5),
    color: "#64748b",
    marginBottom: normalize(2),
  },
  flagsRow: {
    flexDirection: "row",
    gap: normalize(4),
  },
  flagCircle: {
    width: normalize(22),
    height: normalize(22),
    borderRadius: normalize(11),
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom Verified Shield Banner
  verifiedShieldBanner: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: normalize(10),
    padding: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(16),
  },
  shieldTitle: {
    fontSize: normalize(12.5),
    fontWeight: "800",
    color: "#0f172a",
  },
  shieldSubtitle: {
    fontSize: normalize(10.5),
    color: "#64748b",
    marginTop: normalize(1),
  },

  // Modal Styling
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingBottom: normalize(12),
    marginBottom: normalize(12),
  },
  modalTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  modalChefSummary: {
    backgroundColor: "#f8fafc",
    borderRadius: normalize(10),
    padding: normalize(10),
    marginBottom: normalize(12),
  },
  modalChefName: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0f172a",
  },
  modalChefRole: {
    fontSize: normalize(12),
    color: "#1d4ed8",
    fontWeight: "600",
    marginTop: 1,
  },
  inputSectionLabel: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(6),
    marginTop: normalize(4),
  },
  dateChip: {
    backgroundColor: "#f1f5f9",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    marginRight: normalize(8),
  },
  dateChipSelected: {
    backgroundColor: PRIMARY_NAVY,
  },
  dateChipText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#475569",
  },
  dateChipTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
    marginBottom: normalize(12),
  },
  timeChip: {
    backgroundColor: "#f1f5f9",
    borderRadius: normalize(8),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(6),
  },
  timeChipSelected: {
    backgroundColor: PRIMARY_BLUE,
  },
  timeChipText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#475569",
  },
  timeChipTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  notesInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(8),
    padding: normalize(10),
    fontSize: normalize(12),
    color: "#0f172a",
    textAlignVertical: "top",
    marginBottom: normalize(16),
  },
  bookSubmitBtn: {
    backgroundColor: PRIMARY_NAVY,
    borderRadius: normalize(10),
    paddingVertical: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  bookSubmitBtnText: {
    color: "#ffffff",
    fontSize: normalize(13),
    fontWeight: "800",
  },

  // Notice Box & Actions
  noticeBoxOrange: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#ffedd5",
    borderRadius: normalize(12),
    padding: normalize(12),
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: normalize(16),
  },
  noticeBoxTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#9a3412",
    marginBottom: normalize(2),
  },
  noticeBoxText: {
    fontSize: normalize(11),
    color: "#c2410c",
    lineHeight: normalize(15),
  },
  noticeModalActions: {
    flexDirection: "row",
    gap: normalize(10),
  },
  noticeBtnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(10),
    paddingVertical: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  noticeBtnOutlineText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: PRIMARY_NAVY,
  },
  noticeBtnPrimary: {
    flex: 1,
    backgroundColor: PRIMARY_NAVY,
    borderRadius: normalize(10),
    paddingVertical: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  noticeBtnPrimaryText: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#ffffff",
  },
});
