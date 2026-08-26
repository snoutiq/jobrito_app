import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Clipboard,
  Share,
  ActivityIndicator,
  Linking,
  Image,
  RefreshControl,
  TextInput,
  Platform,
  Pressable,
  Dimensions,
  PixelRatio,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));
import {
  fetchFeedJobs,
  toggleSaveJob,
  fetchSavedJobs,
} from "../../redux/slices/jobSlice";
import { applyJob } from "../../redux/slices/applicationSlice";
import { fetchProfile, updateProfile, setUnreadNotificationsCount } from "../../redux/slices/userSlice";
import CallbackModal from "../../components/common/CallbackModal";
import AppLoader from "../../components/common/AppLoader";
import WelcomeModal, { hasWelcomeModalBeenSeen } from "../../components/common/WelcomeModal";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEmployerNotifications } from "../../services/notificationApi";
import { getDailyPostLimit } from "../../services/jobApi";
import { getProfileCompletionPercent } from "../../utils/profileCompletion";

const PRIMARY_GREEN = "#153e69";

const categoryJobTitles = {
  "Kitchen Production": [
    "Bakery Commis", "Batch Cooking Staff", "BBQ Commis", "Buffet Setup Staff", "Burger Maker", 
    "Butcher", "Catering Helper", "CDP (Chef de Partie)", "Central Kitchen Staff", "Chaat Maker", 
    "Chapati Maker", "Chicken Cutter", "Chinese Commis", "Chopping Staff", "Cleaning Staff", 
    "Coffee Maker", "Commis I", "Commis II", "Commis III", "Continental Commis", "Counter Crew", 
    "Curry Maker", "Cutting Staff", "Demi Chef de Partie", "Dishwasher", "Dispatch Staff", 
    "Dosa Maker", "Fast Food Crew", "Fish Cleaner", "Food Packing Staff", "Food Preparation Staff", 
    "Frozen Food Preparation Staff", "Fry Cook", "General Helper", "Grill Maker", "Indian Commis", 
    "Inventory Helper", "Juice Maker", "Kitchen Assistant", "Kitchen Helper", "Kitchen Steward", 
    "Line Cook", "Meat Cutter", "Naan Maker", "Order Packing Staff", "Packing Staff", 
    "Parcel Packing Staff", "Parotta Maker", "Pastry Commis", "Pizza Maker", "Prep Cook", 
    "Preparation Staff", "Production Helper", "Production Staff", "QSR Crew Member", 
    "Ready-to-Eat Production Staff", "Roti Maker", "Salad Maker", "Sandwich Maker", 
    "Service Crew", "Shawarma Maker", "Store Helper", "Tandoor Commis", "Tandoor Roti Maker", 
    "Tea Maker", "Utility Worker", "Vegetable Cutter", "Wok Cook"
  ],
  "Restaurant Operations": [
    "Restaurant Manager", "Assistant Restaurant Manager", "Outlet Manager", "Floor Supervisor", 
    "Restaurant Supervisor", "Captain", "Senior Captain", "Steward", "Senior Steward", 
    "Cashier", "Host", "Hostess", "Food Runner", "Busser", "Order Taker"
  ],
  "Café & Beverage": [
    "Café Manager", "Barista", "Senior Barista", "Coffee Master", "Tea Maker", 
    "Juice Maker", "Smoothie Specialist", "Beverage Specialist"
  ],
  "QSR & Fast Food": [
    "QSR Manager", "Shift Manager", "Counter Staff", "Crew Member", "Drive Thru Staff", 
    "Packing Staff", "Food Preparation Staff", "Fryer Operator", "Production Crew"
  ],
  "Catering & Banquet": [
    "Catering Manager", "Banquet Supervisor", "Banquet Captain", "Event Catering Coordinator", 
    "Outdoor Catering Staff", "Buffet Setup Staff", "Service Crew", "Banquet Steward"
  ]
};

const categories = [
  {
    id: "Kitchen Production",
    title: "Kitchen Production Job Titles - Community Members",
    icon: "restaurant-outline"
  },
  {
    id: "Restaurant Operations",
    title: "Restaurant Operations",
    icon: "business-outline"
  },
  {
    id: "Café & Beverage",
    title: "Café & Beverage",
    icon: "cafe-outline"
  },
  {
    id: "QSR & Fast Food",
    title: "QSR & Fast Food",
    icon: "tv-outline"
  },
  {
    id: "Catering & Banquet",
    title: "Catering & Banquet",
    icon: "settings-outline"
  }
];

const getCategoryCardIconDetails = (job) => {
  const title = (job?.title || job?.job_title || job?.category || "").toLowerCase();
  if (title.includes("training") || title.includes("program") || title.includes("course") || title.includes("academy")) {
    return { icon: "school-outline", bg: "#f3e8ff", color: "#7e22ce" };
  }
  if (title.includes("barista") || title.includes("cafe") || title.includes("coffee") || title.includes("beverage")) {
    return { icon: "cafe-outline", bg: "#dcfce7", color: "#15803d" };
  }
  if (title.includes("chef") || title.includes("cook") || title.includes("baker") || title.includes("kitchen")) {
    return { icon: "restaurant-outline", bg: "#ffedd5", color: "#c2410c" };
  }
  if (title.includes("housekeeping") || title.includes("supervisor") || title.includes("resort") || title.includes("hotel") || title.includes("manager")) {
    return { icon: "business-outline", bg: "#f3e8ff", color: "#6b21a8" };
  }
  return { icon: "briefcase-outline", bg: "#e0f2fe", color: "#0369a1" };
};

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [toastMessage, setToastMessage] = useState("");
  const [checkingLimit, setCheckingLimit] = useState(false);

  const checkPostLimitAndNavigate = async (targetScreen) => {
    if (checkingLimit) return;
    setCheckingLimit(true);
    try {
      const res = await getDailyPostLimit();
      if (res && res.success && res.can_post_today === false) {
        setToastMessage(t("dailyPostLimitComplete", "Daily job post limit completed!"));
        setTimeout(() => {
          setToastMessage("");
        }, 1000);
      } else {
        navigation.navigate(targetScreen);
      }
    } catch (err) {
      console.warn("Failed to check daily post limit:", err);
      navigation.navigate(targetScreen);
    } finally {
      setCheckingLimit(false);
    }
  };

  const { feedJobs, savedJobs, applyingJobId } = useSelector(
    (state) => state.job,
  );
  const { profile } = useSelector((state) => state.user);

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("live"); // "live", "pinned", or "training"
  const [selectedDetailsJob, setSelectedDetailsJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [highlightedJobId, setHighlightedJobId] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeCheckDone, setWelcomeCheckDone] = useState(false);
  const scrollViewRef = useRef(null);
  const jobPositions = useRef({});

  useEffect(() => {
    if (!profile?.id) return; // Wait until profile is loaded
    const checkWelcomeModal = async () => {
      const uRole = profile?.role || "talent";
      const seen = await hasWelcomeModalBeenSeen(profile.id, uRole);
      if (!seen) {
        setShowWelcomeModal(true);
      }
      setWelcomeCheckDone(true);
    };
    checkWelcomeModal();
  }, [profile?.id, profile?.role]);

  // Profile Wizard States
  const [hasModalBeenDismissedThisSession, setHasModalBeenDismissedThisSession] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [isInitialProfileLoadComplete, setIsInitialProfileLoadComplete] = useState(false);
  const [visitCount, setVisitCount] = useState(1);
  const [currentProgressStep, setCurrentProgressStep] = useState(1);

  // Form Fields State
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [experienceRange, setExperienceRange] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [jobType, setJobType] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [city, setCity] = useState("");
  const [preferredRole, setPreferredRole] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Kitchen Production");
  const [jobTitleModalVisible, setJobTitleModalVisible] = useState(false);
  const [jobTitleSearch, setJobTitleSearch] = useState("");
  const [skills, setSkills] = useState(null || "");

  // Keep track of app session visits to Home screen
  useEffect(() => {
    const checkVisitCount = async () => {
      try {
        if (!global.hasIncrementedHomeVisitThisSession) {
          global.hasIncrementedHomeVisitThisSession = true;
          const savedCountStr = await AsyncStorage.getItem("@jobconnect/home_visit_count");
          const currentCount = savedCountStr ? parseInt(savedCountStr, 10) : 0;
          const newCount = currentCount + 1;
          await AsyncStorage.setItem("@jobconnect/home_visit_count", String(newCount));
          setVisitCount(newCount);
        } else {
          const savedCountStr = await AsyncStorage.getItem("@jobconnect/home_visit_count");
          if (savedCountStr) {
            setVisitCount(parseInt(savedCountStr, 10));
          }
        }
      } catch (err) {
        console.warn("Failed to check/update home visit count:", err);
      }
    };
    checkVisitCount();
  }, []);

  const unreadNotificationsCount = useSelector((state) => state.user.unreadNotificationsCount);
  const completionPercent = getProfileCompletionPercent(profile);

  useEffect(() => {
    let active = true;
    const unsubscribe = navigation.addListener("focus", async () => {
      try {
        await dispatch(fetchProfile()).unwrap();
      } catch (err) {
        console.warn("Failed to fetch profile in background:", err);
      } finally {
        if (active) {
          setIsInitialProfileLoadComplete(true);
        }
      }

      // Fetch notifications count
      try {
        const res = await getEmployerNotifications("talent");
        const list = res?.notifications || res?.data || (Array.isArray(res) ? res : []);
        const unread = list.filter((n) => !n.is_read).length;
        if (active) {
          dispatch(setUnreadNotificationsCount(unread));
        }
      } catch (err) {
        console.warn("Failed to fetch notifications on focus:", err);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigation, dispatch]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || profile.name || "");
      setGender(profile.gender || "");
      setPhoto(profile.profile_photo_path || profile.profile_photo || null);
      setExperienceRange(profile.experience_range || "");
      setCurrentEmployer(profile.current_employer || "");
      setJobType(profile.job_type || "");
      setLocationPreference(profile.location_preference || "");
      setCity(profile.city || "");
      setPreferredRole(profile.preferred_role || "");
      setSkills(
        Array.isArray(profile.skills)
          ? profile.skills.join(", ")
          : profile.skills || ""
      );

      // Determine if profile is fully complete
      const isNameFilled = !!(profile.full_name || profile.name || "").trim() && profile.name !== "Guest User";
      const isGenderFilled = !!profile.gender;
      const isExperienceFilled = !!profile.experience_range;
      const isEmployerFilled = !!profile.current_employer;
      const isLocationFilled = !!profile.location_preference && !!profile.city;
      const isRoleFilled = !!profile.preferred_role;

      const isPhase1Incomplete = !isNameFilled || !isGenderFilled;
      const isPhase2Incomplete = !isExperienceFilled || !isEmployerFilled || !isLocationFilled;
      const isPhase3Incomplete = !isRoleFilled;

      const checkModalDelayAndShow = async () => {
        if (!welcomeCheckDone || showWelcomeModal) return; // Sequence: let Welcome Modal finish first
        if (isInitialProfileLoadComplete && !hasModalBeenDismissedThisSession) {
          const userRole = profile?.role || profile?.active_role || profile?.user_role;
          const isEligibleRole = ["job_seeker", "candidate", "chef", "talent"].includes(String(userRole).toLowerCase());
          
          if (!isEligibleRole || completionPercent >= 80) {
            setCompletionModalVisible(false);
            return;
          }

          const now = Date.now();
          const THIRTY_MINUTES = 30 * 60 * 1000;

          // Initialize first_seen_at if not present
          let firstSeenStr = await AsyncStorage.getItem("@first_seen_at");
          if (!firstSeenStr) {
            firstSeenStr = String(now);
            await AsyncStorage.setItem("@first_seen_at", firstSeenStr);
          }
          const firstSeen = parseInt(firstSeenStr, 10);
          const timeSinceFirstSeen = now - firstSeen;

          if (timeSinceFirstSeen >= THIRTY_MINUTES) {
            setCompletionModalVisible(true);
          } else {
            setCompletionModalVisible(false);
          }
        }
      };
      checkModalDelayAndShow();
    }
  }, [profile, isInitialProfileLoadComplete, hasModalBeenDismissedThisSession, completionPercent, welcomeCheckDone, showWelcomeModal]);

  const saveProgressStep = async (fieldsToUpdate) => {
    setSubmittingProfile(true);
    try {
      const fullPayload = {};
      if (fullName.trim()) fullPayload.full_name = fullName.trim();
      if (gender) fullPayload.gender = gender;
      if (photo) fullPayload.profile_photo_path = photo;
      if (experienceRange) fullPayload.experience_range = experienceRange;
      if (currentEmployer.trim()) fullPayload.current_employer = currentEmployer.trim();
      if (jobType) fullPayload.job_type = jobType;
      if (locationPreference) fullPayload.location_preference = locationPreference;
      if (city.trim()) fullPayload.city = city.trim();
      if (preferredRole.trim()) fullPayload.preferred_role = preferredRole.trim();
      if (skills.trim()) fullPayload.skills = skills.trim();

      const mergedPayload = {
        ...fullPayload,
        ...fieldsToUpdate,
      };
      await dispatch(updateProfile(mergedPayload)).unwrap();
      await dispatch(fetchProfile()).unwrap();
      return true;
    } catch (err) {
      Alert.alert(
        t("error", "Error"),
        err.message || "Failed to update profile details.",
      );
      return false;
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("mediaLibraryPermissionRequired", "Sorry, we need camera roll permissions to upload a photo.")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("cameraPermissionRequired", "Sorry, we need camera permissions to take a photo.")
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  // Pull to Refresh State
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchFeedJobs("all")).unwrap(),
        dispatch(fetchSavedJobs()).unwrap(),
      ]);
    } catch (err) {
      console.warn("Pull to refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Modals state
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Favorites, copy link states (local UI feedback overlays)
  const [favorites, setFavorites] = useState({});
  const [copiedJobId, setCopiedJobId] = useState(null);

  useEffect(() => {
    dispatch(fetchFeedJobs("all"));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSavedJobs());
  }, [dispatch]);

  useEffect(() => {
    if (!preferredRole) {
      setSelectedCategory("Kitchen Production");
      return;
    }

    const initialCat = Object.keys(categoryJobTitles).find((cat) =>
      categoryJobTitles[cat].includes(preferredRole)
    ) || "Kitchen Production";
    setSelectedCategory(initialCat);
  }, [preferredRole]);

  useEffect(() => {
    if (feedJobs) {
      const favs = {};
      feedJobs.forEach((job) => {
        const jobIdStr = String(job.id);
        const isSavedInList = (savedJobs || []).some((sj) => {
          const sjId = String(sj.id);
          return (
            sjId === jobIdStr ||
            sjId === `training_${jobIdStr}` ||
            String(sj.job_post_id) === jobIdStr
          );
        });
        favs[job.id] = job.saved || job.is_saved || isSavedInList || false;
      });
      setFavorites(favs);
    }
  }, [feedJobs, savedJobs]);

  const toggleFavorite = async (jobOrId) => {
    const job =
      typeof jobOrId === "object"
        ? jobOrId
        : feedJobs.find((j) => String(j.id) === String(jobOrId));
    const rawId = job ? job.id : jobOrId;
    const keyStr = String(rawId);

    // Guard: Applied jobs cannot be saved
    const isApplied = Boolean(job?.applied || job?.is_applied);
    if (isApplied) {
      return;
    }

    const isTraining =
      job &&
      (job.is_training ||
        job._type === "training_opportunity" ||
        job.category === "training" ||
        job.type === "training");

    let targetSaveId = rawId;
    if (isTraining) {
      if (!String(rawId).startsWith("training_")) {
        targetSaveId =
          job?.job_post_id ||
          (job?.training_id
            ? `training_${job.training_id}`
            : `training_${rawId}`);
      }
    }

    const isFav = !favorites[keyStr];
    setFavorites((prev) => ({ ...prev, [keyStr]: isFav }));

    try {
      await dispatch(toggleSaveJob(targetSaveId)).unwrap();
    } catch (error) {
      // Rollback on error
      setFavorites((prev) => ({ ...prev, [keyStr]: !isFav }));
      Alert.alert(
        t("error", "Error"),
        error || t("failedToSaveJob", "Failed to save job."),
      );
    }
  };

  const handleApplyPress = (job) => {
    setSelectedJob(job);
    setShowCallModal(true);
  };

  const copyToClipboard = (jobId) => {
    Clipboard.setString(`https://jobrito.com/jobs/${jobId}`);
    setCopiedJobId(jobId);
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  const handleCall = (job) => {
    const phoneNumber =
      job.creator?.mobile_number ||
      job.mobile_number ||
      job.phone ||
      "+919876543210";
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      Alert.alert(
        t("error", "Error"),
        t("couldNotOpenDialer", "Could not open dialer: ") + err.message,
      );
    });
  };

  const handleShare = async (title, company, jobId) => {
    try {
      await Share.share({
        message: `${t("checkOutOpening", "Check out this opening on Jobrito:")} ${title} ${t("at", "at")} ${company}!\n\nLink: https://jobrito.com/job/${jobId}`,
      });
    } catch (error) {
      Alert.alert(
        t("unableToShare", "Unable to share"),
        t("pleaseTryAgain", "Please try again."),
      );
    }
  };

  const formatPostedTime = (postedDate) => {
    if (!postedDate) return t("today", "Today");
    const posted = new Date(postedDate);
    if (Number.isNaN(posted.getTime())) return t("today", "Today");
    const diffMs = Date.now() - posted.getTime();
    const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return t("today", "Today");
    if (diffDays === 1) return t("oneDayAgo", "1 day ago");
    return `${diffDays} ${t("daysAgo", "days ago")}`;
  };

  if (!isInitialProfileLoadComplete) {
    return (
      <ScreenWrapper scroll={false} contentStyle={styles.splashContainer}>
        <Image
          source={require("../../assets/Jobrito full logo.png")}
          style={styles.splashLogoImage}
          resizeMode="contain"
        />
        <AppLoader label={t("loading", "Loading...")} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentStyle={styles.content} scroll={false}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/Jobrito Wordmark with Tagline.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            style={styles.headerNotificationBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("EmployerNotifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color="rgba(10, 5, 4, 0.6)"
            />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerRight}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color="rgba(10, 5, 4, 0.6)"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub Header Tabs (3 Tabs Space-Between) */}
      <View style={styles.tabsHeaderRow}>
        <TouchableOpacity
          style={[styles.tabHeaderItem, activeTab === "live" && styles.tabHeaderItemActive]}
          onPress={() => setActiveTab("live")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabHeaderLabel, activeTab === "live" && styles.tabHeaderLabelActive]} numberOfLines={1}>
            {t("liveJobFeed", "Live Job Feed")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabHeaderItem, activeTab === "pinned" && styles.tabHeaderItemActive]}
          onPress={() => setActiveTab("pinned")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabHeaderLabel, activeTab === "pinned" && styles.tabHeaderLabelActive]} numberOfLines={1}>
            {t("priorityPinnedJobs", "Pinned Jobs")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabHeaderItem, activeTab === "training" && styles.tabHeaderItemActive]}
          onPress={() => setActiveTab("training")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabHeaderLabel, activeTab === "training" && styles.tabHeaderLabelActive]} numberOfLines={1}>
            {t("trainingProgramTab", "Training Program")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* JobList feed */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.feedScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#153e69"]}
          />
        }
      >
        {/* Top Info Banner 1 */}
        {activeTab === "live" ? (
          <View style={styles.topInfoBanner}>
            <Ionicons name="information-circle-outline" size={normalize(18)} color="#2563eb" style={{ marginRight: normalize(8) }} />
            <Text style={styles.topInfoBannerText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {t("realTimeOpportunities", "Real-time opportunities from employers and community referrals.")}
            </Text>
          </View>
        ) : activeTab === "pinned" ? (
          <View style={[styles.topInfoBanner, { backgroundColor: "#fff7ed", borderColor: "#ffedd5" }]}>
            <Ionicons name="shield-checkmark-outline" size={normalize(18)} color="#ea580c" style={{ marginRight: normalize(8) }} />
            <Text style={[styles.topInfoBannerText, { color: "#c2410c" }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {t("pinnedJobsNotice", "Pinned jobs are priority jobs set by the Jobrito team.")}
            </Text>
          </View>
        ) : (
          <View style={[styles.topInfoBanner, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
            <Ionicons name="school-outline" size={normalize(18)} color="#15803d" style={{ marginRight: normalize(8) }} />
            <Text style={[styles.topInfoBannerText, { color: "#15803d" }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {t("trainingProgramNotice", "Certified training programs, skill workshops, and placement courses.")}
            </Text>
          </View>
        )}

        {(feedJobs || [])
          .filter((job) => {
            const isJobTraining =
              job._type === "training_opportunity" ||
              job.category === "training" ||
              Boolean(job.program_name) ||
              String(job.title || "").toLowerCase().includes("training");

            if (activeTab === "pinned") {
              return Boolean(job.is_pinned);
            }
            if (activeTab === "training") {
              return isJobTraining;
            }
            return !isJobTraining && !job.is_pinned;
          })
          .map((job) => {
            const isFav = Boolean(favorites[job.id] || favorites[String(job.id)]);
            const isApplied = job.applied || false;
            const isApplying = applyingJobId === job.id;
            const isPinned = job.is_pinned || false;
            const isTraining =
              job._type === "training_opportunity" ||
              job.category === "training" ||
              Boolean(job.program_name) ||
              String(job.title || "").toLowerCase().includes("training");
            const isReferral =
              Boolean(job.is_referral) ||
              job._type === "referral_job" ||
              job.category === "referral";

            const rawRole =
              job.creator?.active_role ||
              job.active_role ||
              job.posted_by_role ||
              job.submitted_by_role ||
              job.creator?.role ||
              "";
            const normalizedRole = rawRole.toLowerCase().replace(/[\s_]/g, "");
            const isAdmin =
              Boolean(job.is_admin_created) ||
              normalizedRole === "admin" ||
              job.posted_by_role === "admin" ||
              job.submitted_by_role === "admin" ||
              job.creator?.role === "admin" ||
              job.creator?.active_role === "admin";
            const isEmployerOrAdmin = ["employer", "admin"].includes(normalizedRole) || isAdmin;
            const isChefOrJobSeeker = ["chef", "jobseeker", "talent"].includes(normalizedRole) && !isAdmin;
            const showApply = isEmployerOrAdmin || isTraining;

            const postedByLabelText = isAdmin
              ? t("postedByAdmin", "Admin")
              : isReferral
              ? t("postedByReferral", "Referral")
              : isTraining
              ? t("postedByAcademy", "Jobrito Academy")
              : isChefOrJobSeeker
              ? (normalizedRole === "chef" ? "Chef" : t("postedByReferral", "Referral"))
              : t("postedByEmployer", "Employer");

            const iconConfig = getCategoryCardIconDetails(job);

            return (
              <View key={job.id} style={styles.modernJobCard}>
                {/* Main Card Content Row */}
                <View style={styles.cardTopRow}>
                  {/* Main Details Column */}
                  <View style={styles.cardMainContent}>
                    {isPinned && (
                      <View style={styles.pinnedTagRow}>
                        <Ionicons name="pin" size={normalize(12)} color="#f57f20" style={{ marginRight: 3 }} />
                        <Text style={styles.pinnedTagText}>Pinned</Text>
                      </View>
                    )}

                    <Text style={styles.cardJobTitle} numberOfLines={1}>
                      {job.program_name || job.title}
                    </Text>

                    <Text style={styles.cardCompanyName} numberOfLines={1}>
                      {job.provider_name || job.company || job.employer_details || (isReferral ? t("referredByCommunity", "Referred by Community Member") : t("jobritoEmployer", "Employer"))}
                    </Text>

                    {Boolean(job.location) && (
                      <View style={styles.cardLocationRow}>
                        <Ionicons name="location-outline" size={normalize(13)} color="rgba(10, 5, 4, 0.55)" style={{ marginRight: 3 }} />
                        <Text style={styles.cardLocationText} numberOfLines={1}>
                          {isTraining ? `${t("deploymentLocation", "Deployment Location")}: ${job.location}` : job.location}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Top Right Type Badge */}
                  <View style={[styles.cardTypeBadge, isTraining && { backgroundColor: "#f3e8ff", paddingVertical: normalize(4), paddingHorizontal: normalize(8) }]}>
                    {isTraining && (
                      <Text style={{ fontSize: normalize(8), fontWeight: "700", color: "#9333ea", marginBottom: 1, textTransform: "uppercase", letterSpacing: 0.3 }}>
                        {t("trainingDuration", "Training Duration")}
                      </Text>
                    )}
                    <Text style={[styles.cardTypeBadgeText, isTraining && { color: "#7e22ce" }]}>
                      {String(job.duration || job.job_type || job.type || (isTraining ? "Training Program" : "Full-time"))}
                    </Text>
                  </View>
                </View>

                {/* Horizontal Card Divider */}
                <View style={styles.cardDividerLine} />

                {/* Card Footer Actions Row */}
                <View style={styles.cardFooterRow}>
                  {/* Left: Posted By (Column Stack) */}
                  <View style={styles.postedByCol}>
                    <Text style={styles.postedByLabel}>{t("postedBy", "Posted by")}:</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}>
                      {isTraining && (
                        <Ionicons name="business" size={normalize(12)} color="#6b21a8" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.postedByBold, isTraining && { color: "#6b21a8" }]} numberOfLines={1}>
                        {postedByLabelText}
                      </Text>
                    </View>
                    {isTraining && (
                      <Text style={{ fontSize: normalize(9), color: "#64748b", marginTop: 1 }} numberOfLines={1}>
                        (Hospitality Training Agency)
                      </Text>
                    )}
                  </View>

                  {/* Right: Action Buttons */}
                  <View style={styles.cardActionGroup}>
                    <TouchableOpacity
                      style={styles.cardNavyBtn}
                      onPress={() => {
                        setSelectedDetailsJob(job);
                        setShowDetailsModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cardNavyBtnText}>
                        {t("viewUpper", "VIEW")}
                      </Text>
                    </TouchableOpacity>

                    {showApply ? (
                      <TouchableOpacity
                        style={[styles.cardOutlineBtn, isApplied && styles.cardAppliedBtn]}
                        onPress={() => isApplied || isApplying ? null : handleApplyPress(job)}
                        disabled={isApplied || isApplying}
                        activeOpacity={0.8}
                      >
                        {isApplying ? (
                          <ActivityIndicator size="small" color="#153e69" />
                        ) : (
                          <Text style={[styles.cardOutlineBtnText, isApplied && styles.cardAppliedBtnText]}>
                            {isApplied ? "✓ APPLIED" : "APPLY NOW"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : !isTraining ? (
                      <TouchableOpacity
                        style={styles.cardOutlineBtn}
                        onPress={() => handleCall(job)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="call-outline" size={normalize(13)} color="#153e69" style={{ marginRight: 3 }} />
                        <Text style={styles.cardOutlineBtnText}>CALL</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.cardSquareIconBtn}
                      onPress={() => handleShare(job.title, job.company, job.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="share-social-outline" size={normalize(16)} color="#153e69" />
                    </TouchableOpacity>

                    {!isApplied && showApply && (
                      <TouchableOpacity
                        style={[styles.cardSquareIconBtn, isFav && styles.cardSquareIconBtnActive]}
                        onPress={() => toggleFavorite(job.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isFav ? "bookmark" : "bookmark-outline"}
                          size={normalize(16)}
                          color={isFav ? "#d97706" : "#153e69"}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
      </ScrollView>

      {/* Bottom Sticky Tip Banner (Fixed at bottom: 0) */}
      <View style={styles.bottomStickyBannerBar}>
        {activeTab === "live" ? (
          <View style={[styles.topInfoBanner, styles.bottomBannerCard]}>
            <Ionicons name="bulb-outline" size={normalize(18)} color="#2563eb" style={{ marginRight: normalize(8) }} />
            <Text style={[styles.topInfoBannerText, { color: "#1e40af" }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              <Text style={{ fontWeight: "800" }}>{t("tipPrefix", "Tip:")} </Text>
              {t("referralPostTipTalent", "You can post 1 job as referral per day.")}
            </Text>
          </View>
        ) : (
          <View style={[styles.topInfoBanner, styles.bottomBannerCard]}>
            <Ionicons name="information-circle-outline" size={normalize(18)} color="#2563eb" style={{ marginRight: normalize(8) }} />
            <Text style={[styles.topInfoBannerText, { color: "#1e40af" }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              <Text style={{ fontWeight: "800" }}>{t("tipPrefix", "Tip:")} </Text>
              {t("handpickedOpportunitiesTip", "Don't miss these handpicked opportunities!")}
            </Text>
          </View>
        )}
      </View>

      {/* Floating Action Button with Referral Tooltip */}
      <View style={styles.fabContainerWrapper}>
        <View style={styles.fabTooltipCard}>
          <Text style={styles.fabTooltipTitle}>{t("postJobAsReferral", "Post a Job as Referral")}</Text>
          <Text style={styles.fabTooltipSub}>{t("oneJobPerDay", "1 job per day")}</Text>
        </View>
        <TouchableOpacity
          style={styles.fabBtnCircle}
          onPress={() => checkPostLimitAndNavigate("Post Referral Job")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={normalize(26)} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {Boolean(toastMessage) && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <CallbackModal
        visible={showCallModal}
        onClose={() => setShowCallModal(false)}
        onConfirm={async (timeSlot) => {
          if (selectedJob) {
            try {
              const payload = {
                jobId: selectedJob.id,
                preferredCallTime: timeSlot,
              };
              if (selectedJob._type === "training_opportunity") {
                payload.is_training = 1;
              }
              await dispatch(
                applyJob(payload),
              ).unwrap();
              // Auto-unsave job if it was saved
              const jobKey = String(selectedJob.id);
              if (favorites[jobKey] || (savedJobs || []).some((sj) => String(sj.id) === jobKey || String(sj.job_post_id) === jobKey || String(sj.id) === `training_${jobKey}`)) {
                setFavorites((prev) => ({ ...prev, [jobKey]: false }));
                const isTraining = selectedJob._type === "training_opportunity" || selectedJob.category === "training";
                const targetSaveId = isTraining ? (String(jobKey).startsWith("training_") ? jobKey : `training_${jobKey}`) : jobKey;
                dispatch(toggleSaveJob(targetSaveId)).unwrap().catch(() => null);
              }
              return true;
            } catch (err) {
              Alert.alert("Application Error", err || "Failed to apply to job");
              return false;
            }
          }
          return false;
        }}
      />
      {/* Profile Completion Prompt Modal (Shows after 30 minutes) */}
      <Modal
        visible={completionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setCompletionModalVisible(false);
          setHasModalBeenDismissedThisSession(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { padding: normalize(20), alignItems: "center" }]}>
            <TouchableOpacity
              onPress={() => {
                setCompletionModalVisible(false);
                setHasModalBeenDismissedThisSession(true);
              }}
              style={{ position: "absolute", top: 12, right: 12, zIndex: 10, padding: 6 }}
            >
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>

            <View
              style={{
                width: normalize(60),
                height: normalize(60),
                borderRadius: normalize(30),
                backgroundColor: "#eef2ff",
                alignItems: "center",
                justifyContent: "center",
                marginTop: normalize(10),
                marginBottom: normalize(14),
              }}
            >
              <Ionicons name="person-circle-outline" size={normalize(36)} color="#153e69" />
            </View>

            <Text style={{ fontSize: normalize(16), fontWeight: "800", color: "#0d2b52", textAlign: "center", marginBottom: normalize(8) }}>
              {t("pleaseCompleteProfileTitle", "Please Complete Your Profile")}
            </Text>

            <Text style={{ fontSize: normalize(12.5), color: "#64748b", textAlign: "center", lineHeight: normalize(18), marginBottom: normalize(16) }}>
              {t("pleaseCompleteProfileSub", "Complete your profile to unlock full features, apply for top jobs, and connect with recruiters.")}
            </Text>

            <View style={{ width: "100%", backgroundColor: "#f1f5f9", borderRadius: normalize(10), padding: normalize(10), marginBottom: normalize(18) }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: normalize(11), fontWeight: "700", color: "#475569" }}>
                  {t("profileCompleteness", "Profile Completeness")}
                </Text>
                <Text style={{ fontSize: normalize(11), fontWeight: "800", color: "#153e69" }}>
                  {completionPercent}%
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <View style={{ width: `${completionPercent}%`, height: "100%", backgroundColor: "#153e69", borderRadius: 3 }} />
              </View>
            </View>

            <TouchableOpacity
              style={{
                width: "100%",
                backgroundColor: "#153e69",
                paddingVertical: normalize(12),
                borderRadius: normalize(12),
                alignItems: "center",
                marginBottom: normalize(10),
              }}
              onPress={() => {
                setCompletionModalVisible(false);
                setHasModalBeenDismissedThisSession(true);
                const userRole = (profile?.role || profile?.active_role || profile?.user_role || "").toLowerCase();
                const targetScreen = userRole === "chef" ? "ChefCompleteProfile" : "CompleteProfileScreen";
                navigation.navigate(targetScreen);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: normalize(14), fontWeight: "700", color: "#ffffff" }}>
                {t("completeProfileNow", "Complete Profile Now")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCompletionModalVisible(false);
                setHasModalBeenDismissedThisSession(true);
              }}
              style={{ paddingVertical: normalize(6) }}
            >
              <Text style={{ fontSize: normalize(12.5), fontWeight: "600", color: "#64748b" }}>
                {t("maybeLater", "Maybe Later")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={jobTitleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setJobTitleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("selectCategoryTitle", "Select {{category}} Title", { category: selectedCategory })}</Text>
              <TouchableOpacity onPress={() => setJobTitleModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="rgba(10, 5, 4, 0.4)" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="search" size={18} color="rgba(10, 5, 4, 0.4)" style={styles.inputIcon} />
              <TextInput
                placeholder={t("searchJobTitlesPlaceholder", "Search job titles...")}
                placeholderTextColor="rgba(10, 5, 4, 0.3)"
                value={jobTitleSearch}
                onChangeText={setJobTitleSearch}
                style={styles.textInputWithIcon}
              />
            </View>

            <View style={{ maxHeight: 220, flexShrink: 1 }}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 10 }}>
                {((categoryJobTitles[selectedCategory] || []).filter((item) =>
                  item.toLowerCase().includes(jobTitleSearch.toLowerCase())
                )).map((item, idx) => (
                  <TouchableOpacity
                    key={`${item}-${idx}`}
                    style={[styles.modalItem, preferredRole === item && styles.modalItemActive]}
                    onPress={() => {
                      setPreferredRole(item);
                      setJobTitleModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, preferredRole === item && styles.modalItemTextActive]}>
                      {item}
                    </Text>
                    {preferredRole === item && <Ionicons name="checkmark" size={18} color="#153e69" />}
                  </TouchableOpacity>
                ))}
                {((categoryJobTitles[selectedCategory] || []).filter((item) =>
                  item.toLowerCase().includes(jobTitleSearch.toLowerCase())
                )).length === 0 && (
                  <Text style={styles.noResultsText}>{t("noMatchingJobTitles", "No matching job titles found.")}</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { alignItems: "center", paddingVertical: 30 },
            ]}
          >
            <View
              style={[
                styles.successIconCircle,
                { backgroundColor: "rgba(34, 197, 94, 0.1)" },
              ]}
            >
              <Ionicons name="checkmark-circle" size={54} color="#22c55e" />
            </View>
            <Text
              style={[
                styles.modalTitle,
                { textAlign: "center", marginBottom: 10 },
              ]}
            >
              {t("detailsSavedTitle", "Details Saved!")}
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { textAlign: "center", marginBottom: 20 },
              ]}
            >
              {t("detailsSavedSubtitle", "Your profile details have been saved successfully.")}
            </Text>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, { width: "100%", marginTop: 0 }]}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.modalConfirmBtnText}>
                {t("gotIt", "Got It")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POLISHED JOB / TRAINING DETAILS MODAL */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(8), flex: 1 }}>
                <View style={styles.modalHeaderIconBadge}>
                  <Ionicons
                    name={selectedDetailsJob?._type === "training_opportunity" ? "school" : "briefcase"}
                    size={normalize(16)}
                    color="#153e69"
                  />
                </View>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {selectedDetailsJob?._type === "training_opportunity"
                    ? t("trainingDetails", "Training Details")
                    : t("jobDetailsTitle", "Job Details")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.modalCloseBtnCircle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={normalize(18)} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: normalize(16) }}
            >
              {/* Hero Header Card */}
              <View style={styles.modalHeroCard}>
                <View style={styles.modalHeroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalJobTitle}>
                      {selectedDetailsJob?.program_name || selectedDetailsJob?.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: normalize(2) }}>
                      <Ionicons name="business-outline" size={normalize(12)} color="#64748b" style={{ marginRight: 4 }} />
                      <Text style={styles.modalCompanyText} numberOfLines={1}>
                        {selectedDetailsJob?.provider_name || selectedDetailsJob?.company || selectedDetailsJob?.employer_details || t("jobritoEmployer", "Employer")}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Badges Pill Row */}
                <View style={styles.modalPillRow}>
                  <View style={[styles.modalPillBadge, selectedDetailsJob?._type === "training_opportunity" ? { backgroundColor: "#f3e8ff" } : { backgroundColor: "#eff6ff" }]}>
                    <Text style={[styles.modalPillBadgeText, selectedDetailsJob?._type === "training_opportunity" ? { color: "#7e22ce" } : { color: "#1e40af" }]}>
                      {String(selectedDetailsJob?.duration || selectedDetailsJob?.job_type || selectedDetailsJob?.type || (selectedDetailsJob?._type === "training_opportunity" ? "Training Program" : "Full-time"))}
                    </Text>
                  </View>
                  {Boolean(selectedDetailsJob?.category) && (
                    <View style={[styles.modalPillBadge, { backgroundColor: "#f0fdf4" }]}>
                      <Text style={[styles.modalPillBadgeText, { color: "#15803d" }]}>
                        {String(selectedDetailsJob.category).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Key Metadata 2x2 Grid */}
                <View style={styles.modalGridContainer}>
                  <View style={styles.modalGridRow}>
                    <View style={styles.modalGridItem}>
                      <View style={[styles.gridIconCircle, { backgroundColor: "#dbeafe" }]}>
                        <Ionicons name="location" size={normalize(12)} color="#1d4ed8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalGridLabel}>{(selectedDetailsJob?._type === "training_opportunity" || selectedDetailsJob?.category === "training") ? t("deploymentLocation", "Deployment Location") : t("location", "Location")}</Text>
                        <Text style={styles.modalGridValue} numberOfLines={2}>
                          {selectedDetailsJob?.location || t("notSpecified", "Not Specified")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalGridItem}>
                      <View style={[styles.gridIconCircle, { backgroundColor: "#dcfce7" }]}>
                        <Ionicons name="briefcase" size={normalize(12)} color="#15803d" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalGridLabel}>{(selectedDetailsJob?._type === "training_opportunity" || selectedDetailsJob?.category === "training") ? t("trainingDuration", "Training Duration") : t("jobType", "Job Type / Duration")}</Text>
                        <Text style={styles.modalGridValue} numberOfLines={2}>
                          {selectedDetailsJob?.duration || selectedDetailsJob?.job_type || selectedDetailsJob?.type || t("fullTime", "Full-time")}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {(() => {
                    const salVal = (() => {
                      if (!selectedDetailsJob) return null;
                      const currency = String(selectedDetailsJob.currency || selectedDetailsJob.salary_currency || "SAR").trim();
                      const min = selectedDetailsJob.salary_min ?? selectedDetailsJob.min_salary ?? selectedDetailsJob.salaryMin;
                      const max = selectedDetailsJob.salary_max ?? selectedDetailsJob.max_salary ?? selectedDetailsJob.salaryMax;
                      if (min !== undefined && min !== null && min !== "" && max !== undefined && max !== null && max !== "") {
                        const minNum = Number(min);
                        const maxNum = Number(max);
                        if (!isNaN(minNum) && !isNaN(maxNum)) {
                          if (minNum === maxNum) return `${currency} ${minNum.toLocaleString()}`;
                          return `${currency} ${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;
                        }
                      }
                      const raw = selectedDetailsJob.salary || selectedDetailsJob.salary_range || selectedDetailsJob.offered_salary || selectedDetailsJob.salary_display;
                      if (raw && String(raw).trim()) {
                        const s = String(raw).trim();
                        const match = s.match(/^(?:([A-Za-z]{2,4})\s*)?(\d+)(?:\s*-\s*(?:([A-Za-z]{2,4})\s*)?(\d+))?$/i);
                        if (match) {
                          const curr = match[1] || match[3] || currency;
                          const v1 = Number(match[2]);
                          const v2 = match[4] ? Number(match[4]) : null;
                          if (v2 !== null) {
                            if (v1 === v2) return `${curr} ${v1.toLocaleString()}`;
                            return `${curr} ${v1.toLocaleString()} - ${v2.toLocaleString()}`;
                          }
                          return `${curr} ${v1.toLocaleString()}`;
                        }
                        return s;
                      }
                      return null;
                    })();

                    const expVal = selectedDetailsJob?.experience_range || selectedDetailsJob?.experience || selectedDetailsJob?.experience_level || null;

                    if (!salVal && !expVal) return null;

                    return (
                      <View style={styles.modalGridRow}>
                        {Boolean(salVal) && (
                          <View style={styles.modalGridItem}>
                            <View style={[styles.gridIconCircle, { backgroundColor: "#fef3c7" }]}>
                              <Ionicons name="card" size={normalize(12)} color="#b45309" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.modalGridLabel}>{t("salary", "Salary / Pay")}</Text>
                              <Text style={styles.modalGridValue} numberOfLines={2}>
                                {salVal}
                              </Text>
                            </View>
                          </View>
                        )}
                        {Boolean(expVal) && (
                          <View style={styles.modalGridItem}>
                            <View style={[styles.gridIconCircle, { backgroundColor: "#ffedd5" }]}>
                              <Ionicons name="ribbon" size={normalize(12)} color="#c2410c" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.modalGridLabel}>{t("experience", "Experience")}</Text>
                              <Text style={styles.modalGridValue} numberOfLines={2}>
                                {expVal}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>
              </View>

              {/* Skills Covered (If Training) */}
              {Boolean(selectedDetailsJob?.skills_covered) && (
                <View style={styles.modalSectionCard}>
                  <View style={styles.modalSectionHeaderRow}>
                    <Ionicons name="checkmark-circle-outline" size={normalize(16)} color="#7e22ce" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>{t("skillsCovered", "Skills Covered")}</Text>
                  </View>
                  <View style={styles.skillsTagContainer}>
                    {String(selectedDetailsJob.skills_covered).split(",").map((skill, idx) => (
                      <View key={idx} style={styles.skillPillTag}>
                        <Text style={styles.skillPillTagText}>{skill.trim()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Benefits */}
              {Boolean(selectedDetailsJob?.benefits) && (
                <View style={styles.modalSectionCard}>
                  <View style={styles.modalSectionHeaderRow}>
                    <Ionicons name="gift-outline" size={normalize(16)} color="#16a34a" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>{t("benefits", "Benefits & Perks")}</Text>
                  </View>
                  <Text style={styles.modalSectionBody}>{selectedDetailsJob.benefits}</Text>
                </View>
              )}

              {/* Description */}
              <View style={[styles.modalSectionCard, { borderLeftWidth: 3, borderLeftColor: "#153e69" }]}>
                <View style={styles.modalSectionHeaderRow}>
                  <Ionicons name="document-text-outline" size={normalize(16)} color="#153e69" style={{ marginRight: 6 }} />
                  <Text style={styles.modalSectionTitle}>{t("description", "Description")}</Text>
                </View>
                <Text style={styles.modalSectionBody}>
                  {selectedDetailsJob?.description || t("noDescription", "No detailed description provided.")}
                </Text>
              </View>


            </ScrollView>

            {/* Modal Bottom Action Button */}
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.modalCloseFooterBtn}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.modalCloseFooterBtnText}>{t("close", "Close")}</Text>
              </TouchableOpacity>

              {(() => {
                if (!selectedDetailsJob) return null;
                const modalRawRole =
                  selectedDetailsJob.creator?.active_role ||
                  selectedDetailsJob.active_role ||
                  selectedDetailsJob.posted_by_role ||
                  selectedDetailsJob.submitted_by_role ||
                  selectedDetailsJob.creator?.role ||
                  "";
                const modalRole = modalRawRole.toLowerCase().replace(/[\s_]/g, "");
                const modalIsEmployerOrAdmin = ["employer", "admin"].includes(modalRole);
                const modalIsTraining =
                  selectedDetailsJob._type === "training_opportunity" ||
                  selectedDetailsJob.category === "training";
                const modalShowApply = modalIsEmployerOrAdmin || modalIsTraining;

                if (modalShowApply) {
                  return (
                    <TouchableOpacity
                      style={[styles.modalApplyFooterBtn, selectedDetailsJob.applied && { backgroundColor: "#94a3b8" }]}
                      onPress={() => {
                        if (!selectedDetailsJob.applied) {
                          const target = selectedDetailsJob;
                          setShowDetailsModal(false);
                          handleApplyPress(target);
                        }
                      }}
                      disabled={selectedDetailsJob.applied}
                    >
                      <Text style={styles.modalApplyFooterBtnText}>
                        {selectedDetailsJob.applied ? t("applied", "✓ APPLIED") : t("applyNowUpper", "APPLY NOW")}
                      </Text>
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      style={[styles.modalApplyFooterBtn, { backgroundColor: "#153e69" }]}
                      onPress={() => {
                        const target = selectedDetailsJob;
                        setShowDetailsModal(false);
                        handleCall(target);
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="call" size={normalize(16)} color="#ffffff" />
                        <Text style={styles.modalApplyFooterBtnText}>{t("callUpper", "CALL NOW")}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* First Time Welcome Modal */}
      <WelcomeModal
        visible={showWelcomeModal}
        role={profile?.role || "talent"}
        userId={profile?.id || "guest"}
        onClose={() => setShowWelcomeModal(false)}
        onExplore={() => setShowWelcomeModal(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerIcon: {
    width: normalize(32),
    height: normalize(32),
  },
  logoContainer: {
    width: normalize(140),
    height: normalize(38),
    overflow: "hidden",
    justifyContent: "center",
  },
  headerLogo: {
    width: normalize(90),
    height: normalize(90),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  headerRight: {
    padding: normalize(6),
  },
  headerNotificationBtn: {
    padding: normalize(6),
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: normalize(4),
    right: normalize(4),
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: "#f57f20",
  },

  // Sub Header Tabs (Space Between)
  tabsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: normalize(8),
  },
  tabHeaderItem: {
    flex: 1,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(4),
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabHeaderItemActive: {
    borderBottomColor: "#153e69",
  },
  tabHeaderLabel: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  tabHeaderLabelActive: {
    color: "#153e69",
    fontWeight: "800",
  },

  // Feed Scroll Container
  feedScroll: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(6),
    paddingBottom: normalize(140),
  },

  // Top Info Banner
  topInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(9),
    marginTop: normalize(6),
    marginBottom: normalize(10),
  },
  topInfoBannerText: {
    flex: 1,
    fontSize: normalize(11.5),
    fontWeight: "600",
    color: "#1e40af",
  },
  bottomStickyBannerBar: {
    backgroundColor: "#eff6ff",
    borderTopWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
  },
  bottomBannerCard: {
    marginVertical: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  // Modern Job Card
  modernJobCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    padding: normalize(12),
    marginBottom: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: normalize(12),
  },
  cardIconBox: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(8),
    alignItems: "center",
    justifyContent: "center",
  },
  cardMainContent: {
    flex: 1,
  },
  pinnedTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(2),
  },
  pinnedTagText: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#ea580c",
  },
  cardJobTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(2),
  },
  cardCompanyName: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#475569",
    marginBottom: normalize(4),
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLocationText: {
    fontSize: normalize(11),
    fontWeight: "500",
    color: "#64748b",
  },
  cardTypeBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(12),
    alignSelf: "flex-start",
  },
  cardTypeBadgeText: {
    fontSize: normalize(10),
    fontWeight: "700",
    color: "#475569",
  },

  // Inner Banner for Training Cards
  cardInnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    borderRadius: normalize(10),
    padding: normalize(8),
    marginTop: normalize(8),
    gap: normalize(8),
  },
  cardInnerBannerIconCircle: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInnerBannerTitle: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#6b21a8",
  },
  cardInnerBannerSub: {
    fontSize: normalize(10),
    fontWeight: "500",
    color: "#7e22ce",
    lineHeight: normalize(13),
  },

  // Card Divider & Footer
  cardDividerLine: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: normalize(10),
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: normalize(4),
  },
  postedByCol: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
  },
  postedByLabel: {
    fontSize: normalize(9.5),
    color: "#64748b",
  },
  postedByText: {
    fontSize: normalize(10),
    color: "#64748b",
  },
  postedByBold: {
    fontSize: normalize(10),
    fontWeight: "800",
    color: "#0f172a",
  },
  cardActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(3),
    flexShrink: 0,
  },
  cardNavyBtn: {
    backgroundColor: "#153e69",
    borderRadius: normalize(6),
    paddingHorizontal: normalize(6),
    paddingVertical: normalize(5),
    alignItems: "center",
    justifyContent: "center",
  },
  cardNavyBtnText: {
    color: "#ffffff",
    fontSize: normalize(9.5),
    fontWeight: "800",
  },
  cardOutlineBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#153e69",
    borderRadius: normalize(6),
    paddingHorizontal: normalize(5),
    paddingVertical: normalize(5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardOutlineBtnText: {
    color: "#153e69",
    fontSize: normalize(9.5),
    fontWeight: "800",
  },
  cardAppliedBtn: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  cardAppliedBtnText: {
    color: "#64748b",
  },
  cardSquareIconBtn: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(6),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSquareIconBtnActive: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },

  // FAB Container & Tooltip
  fabContainerWrapper: {
    position: "absolute",
    bottom: normalize(20),
    right: normalize(16),
    alignItems: "flex-end",
  },
  fabTooltipCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    marginBottom: normalize(8),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabTooltipTitle: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: "#153e69",
  },
  fabTooltipSub: {
    fontSize: normalize(10),
    fontWeight: "600",
    color: "#64748b",
  },
  fabBtnCircle: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#153e69",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.55)",
    lineHeight: 19,
    marginBottom: 16,
  },
  slotsList: {
    gap: 10,
    marginBottom: 20,
  },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  slotItemSelected: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  slotLabelTextSelected: {
    color: "#153e69",
    fontWeight: "700",
  },
  modalConfirmBtn: {
    backgroundColor: "#153e69",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    marginTop: 12,
    shadowColor: "#153e69",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  modalConfirmBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  modalSkipBtn: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSkipBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#153e69",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  inputGroup: {
    marginBottom: 12,
    width: "100%",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#153e69",
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#0a0504",
    backgroundColor: "#f8fafc",
    fontSize: 14,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    width: "100%",
  },
  inputIcon: {
    marginRight: 8,
  },
  textInputWithIcon: {
    flex: 1,
    height: "100%",
    color: "#0a0504",
    fontSize: 14,
    fontWeight: "500",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    width: "100%",
  },
  modalCloseBtn: {
    padding: 4,
    marginRight: -4,
  },
  genderSelectRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "#f1f5f9",
    borderRadius: 2,
    marginVertical: 14,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#153e69",
    borderRadius: 2,
  },
  photoUploadCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoUploadBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#153e69",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  photoUploadImage: {
    width: "100%",
    height: "100%",
  },
  wizardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginVertical: 4,
  },
  wizardLeftCol: {
    width: 84,
    alignItems: "center",
  },
  wizardRightCol: {
    flex: 1,
  },
  photoUploadCircleCompact: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoUploadBadgeCompact: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#153e69",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  genderSelectBtnCompact: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  genderSelectTextCompact: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  genderSelectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  genderSelectBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  genderSelectText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  genderSelectTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  experienceOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  experienceOptionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    backgroundColor: "#ffffff",
  },
  experienceOptionBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  experienceOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  experienceOptionTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  jobTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  jobTypeBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  jobTypeBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  jobTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  jobTypeTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  locationPreferenceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  locationPreferenceBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  locationPreferenceBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  locationPreferenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  locationPreferenceTextActive: {
    color: "#153e69",
    fontWeight: "700",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 16,
    padding: 4,
    backgroundColor: "#ffffff",
  },
  roleCardSelected: {
    borderColor: "#153e69",
  },
  roleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconCircleActive: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0504",
    flex: 1,
  },
  radioOutline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(10, 5, 4, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#153e69",
  },
  radioDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#153e69",
  },
  inlineDropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 52,
    backgroundColor: "#f2f2f3",
  },
  inlineDropdownTriggerText: {
    fontSize: 14,
    color: "#0a0504",
    fontWeight: "600",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  modalItemActive: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  modalItemText: {
    fontSize: 15,
    color: "rgba(10, 5, 4, 0.6)",
  },
  modalItemTextActive: {
    color: "#153e69",
    fontWeight: "600",
  },
  noResultsText: {
    textAlign: "center",
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 20,
    fontSize: 14,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  splashLogoImage: {
    width: 300,
    height: 150,
    marginBottom: 20,
  },
  splashText: { 
    fontSize: 13,
    alignSelf: "center",
    marginBottom: 20,
  },
  poweredRibbon: {
  alignSelf: "flex-end",
  marginTop: 10,
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 20,
  backgroundColor: "#fff",
},

poweredRibbonText: {
    fontSize: 8,
    fontStyle: "italic",
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#153e69",
    textTransform: "uppercase",
  },
  toastContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(10, 5, 4, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  detailsModalContent: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: normalize(20),
    maxHeight: "85%",
    paddingHorizontal: normalize(18),
    paddingTop: normalize(16),
    paddingBottom: normalize(18),
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: normalize(12),
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: normalize(14),
  },
  modalHeaderIconBadge: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  modalCloseBtnCircle: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeroCard: {
    backgroundColor: "#f8fafc",
    borderRadius: normalize(16),
    padding: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: normalize(12),
  },
  modalHeroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalCardIconBox: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  modalJobTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: normalize(20),
  },
  modalCompanyText: {
    fontSize: normalize(13),
    fontWeight: "600",
    color: "#64748b",
  },
  modalPillRow: {
    flexDirection: "row",
    gap: normalize(6),
    marginTop: normalize(12),
  },
  modalPillBadge: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(14),
  },
  modalPillBadgeText: {
    fontSize: normalize(11),
    fontWeight: "700",
  },
  modalGridContainer: {
    marginTop: normalize(12),
    gap: normalize(8),
  },
  modalGridRow: {
    flexDirection: "row",
    gap: normalize(8),
  },
  modalGridItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(8),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    gap: normalize(8),
  },
  gridIconCircle: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(13),
    alignItems: "center",
    justifyContent: "center",
  },
  modalGridLabel: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 2,
  },
  modalGridValue: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: normalize(16),
  },
  modalSectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    padding: normalize(12),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: normalize(10),
  },
  modalSectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(6),
  },
  modalSectionTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSectionBody: {
    fontSize: normalize(13),
    color: "#475569",
    lineHeight: normalize(19),
  },
  skillsTagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(6),
    marginTop: normalize(4),
  },
  skillPillTag: {
    backgroundColor: "#f3e8ff",
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(12),
  },
  skillPillTagText: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#7e22ce",
  },
  modalFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
    paddingTop: normalize(12),
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  modalCloseFooterBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: normalize(12),
    height: normalize(44),
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseFooterBtnText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#475569",
  },
  modalApplyFooterBtn: {
    flex: 1.5,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: normalize(12),
    height: normalize(44),
    alignItems: "center",
    justifyContent: "center",
  },
  modalApplyFooterBtnText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#ffffff",
  },
});
