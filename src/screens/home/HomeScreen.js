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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import {
  fetchFeedJobs,
  toggleSaveJob,
  fetchSavedJobs,
} from "../../redux/slices/jobSlice";
import { applyJob } from "../../redux/slices/applicationSlice";
import { fetchProfile, updateProfile, setUnreadNotificationsCount } from "../../redux/slices/userSlice";
import CallbackModal from "../../components/common/CallbackModal";
import AppLoader from "../../components/common/AppLoader";
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
  const [highlightedJobId, setHighlightedJobId] = useState(null);
  const scrollViewRef = useRef(null);
  const jobPositions = useRef({});

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
        if (isInitialProfileLoadComplete && !hasModalBeenDismissedThisSession) {
          const userRole = profile?.role || profile?.active_role || profile?.user_role;
          const isEligibleRole = ["job_seeker", "candidate", "chef", "talent"].includes(String(userRole).toLowerCase());
          
          if (!isEligibleRole) {
            setCompletionModalVisible(false);
            return;
          }

          if (completionPercent >= 80) {
            setCompletionModalVisible(false);
            return;
          }

          const now = Date.now();
          const TWO_MINUTES = 2 * 60 * 1000;

          // Initialize first_seen_at if not present
          let firstSeenStr = await AsyncStorage.getItem("@first_seen_at");
          if (!firstSeenStr) {
            firstSeenStr = String(now);
            await AsyncStorage.setItem("@first_seen_at", firstSeenStr);
          }
          const firstSeen = parseInt(firstSeenStr, 10);

          // Fetch phase completion times
          const phase1CompStr = await AsyncStorage.getItem("@phase1_completed_at");
          const phase2CompStr = await AsyncStorage.getItem("@phase2_completed_at");

          const phase1Time = phase1CompStr ? parseInt(phase1CompStr, 10) : firstSeen;
          const phase2Time = phase2CompStr ? parseInt(phase2CompStr, 10) : firstSeen;

          if (isPhase1Incomplete) {
            setCurrentProgressStep(1);
            setCompletionModalVisible(true);
          } else {
            if (!phase1CompStr) {
              await AsyncStorage.setItem("@phase1_completed_at", String(now));
            }

            if (isPhase2Incomplete) {
              const timeSincePhase1 = now - phase1Time;
              if (timeSincePhase1 >= TWO_MINUTES) {
                setCurrentProgressStep(2);
                setCompletionModalVisible(true);
              } else {
                setCompletionModalVisible(false);
              }
            } else {
              if (!phase2CompStr) {
                await AsyncStorage.setItem("@phase2_completed_at", String(now));
              }

              if (isPhase3Incomplete) {
                const timeSincePhase2 = now - phase2Time;
                if (timeSincePhase2 >= TWO_MINUTES) {
                  setCurrentProgressStep(3);
                  setCompletionModalVisible(true);
                } else {
                  setCompletionModalVisible(false);
                }
              } else {
                setCompletionModalVisible(false);
              }
            }
          }
        }
      };
      checkModalDelayAndShow();
    }
  }, [profile, isInitialProfileLoadComplete, hasModalBeenDismissedThisSession, completionPercent]);

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

    const keyStr = String(rawId);
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

      {/* Pagination timeline bar with pin icon */}
      <View style={styles.filterBar}>
        <Ionicons name="pin" size={18} color="#153e69" style={styles.pinIcon} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPills}
        >
          {(feedJobs || [])
            .filter((job) => job.is_pinned)
            .map((job, index) => {
              const isSelected = highlightedJobId === job.id;
              return (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.filterPill,
                    isSelected && styles.filterPillSelected,
                  ]}
                  onPress={() => {
                    setHighlightedJobId((prev) =>
                      prev === job.id ? null : job.id,
                    );
                    if (scrollViewRef.current && jobPositions.current[job.id] !== undefined) {
                      scrollViewRef.current.scrollTo({
                        y: jobPositions.current[job.id],
                        animated: true,
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextSelected,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
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
        {feedJobs.map((job) => {
          const isFav = favorites[job.id] || false;
          const isApplied = job.applied || false;
          const isApplying = applyingJobId === job.id;
          const isCopied = copiedJobId === job.id;
          const isPinned = job.is_pinned || false;
          const isHighlighted = highlightedJobId === job.id;
          const isTraining = job._type === "training_opportunity";

          // Grand Hyatt and Global Talent are "Apply" jobs. Bombay Cafe is "Call & Share" referral.
          const isReferral = job.category === "referral";
          const hasMultipleActions = job.category === "overseas";

          // --- UPDATED ROLE LOGIC (fallback across submitted_by_role / posted_by_role / active_role / user_role, normalized) ---
          const effectiveRoleSource =
            job.submitted_by_role ||
            job.posted_by_role ||
            job.active_role ||
            job.user_role ||
            "";
          const effectiveRole = effectiveRoleSource.toLowerCase();
          const normalizedRole = effectiveRole.replace(/[\s_]/g, ""); // "job_seeker" -> "jobseeker"
          const isChefOrJobSeeker = ["chef", "jobseeker"].includes(normalizedRole);
          const showApply = !isReferral && !isChefOrJobSeeker;

          let roleBorderColor = null;
          if (["jobseeker", "chef", "talent"].includes(normalizedRole)) {
            roleBorderColor = "#f57f20"; // Orange
          } else if (["administrator", "admin"].includes(normalizedRole)) {
            roleBorderColor = "#2e7d32"; // Green
          } else if (["employer", "agency"].includes(normalizedRole)) {
            roleBorderColor = "#f2c879"; // Yellow
          }
          // --- END OF UPDATED ROLE LOGIC ---

          return (
            <View
              key={job.id}
              style={[
                styles.card,
                roleBorderColor && Platform.select({
                  ios: { borderColor: roleBorderColor, borderWidth: 1.5 },
                  android: { borderLeftColor: roleBorderColor, borderLeftWidth: 4 }
                }),
                isTraining && { backgroundColor: "#f2c879" },
                isHighlighted && styles.highlightedCard,
              ]}
            >
              <View onLayout={(e) => {
                jobPositions.current[job.id] = e.nativeEvent.layout.y;
              }}>
                {/* Pinned label indicator */}
              {isPinned && (
                <View style={styles.pinnedIndicator}>
                  <Ionicons
                    name="pin"
                    size={14}
                    color="#f57f20"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.pinnedLabelText}>Pinned</Text>
                </View>
              )}

              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  {isReferral ? (
                    <Text style={styles.referralHeader}>Referral Job Post</Text>
                  ) : ( 
                    <Text style={[styles.employerName, isTraining && { color: "#153e69" }]}>{job.company}</Text>
                  )}
                  <Text style={[styles.jobTitle, isTraining && { color: "#153e69" }]}>{job.title}</Text>
                </View>
              </View>

              <View style={styles.detailsBlock}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color="rgba(10, 5, 4, 0.6)"
                  />
                  <Text style={[styles.detailText, isTraining && { color: "#153e69" }]}>
                    {t("location", "Location")}: {job.location}
                  </Text>
                </View>
                {job.salary && (
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="cash-outline"
                      size={15}
                      color="rgba(10, 5, 4, 0.6)"
                    />
                    <Text style={[styles.detailText, isTraining && { color: "#153e69" }]}>
                      {t("salary", "Salary")}: {job.salary}
                    </Text>
                  </View>
                )}
                {(() => {
                  const jobExp =
                    job.experience ||
                    job.experience_range || 
                    job.duration ||
                    job.contract_duration;
                  return jobExp ? (
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={15}
                        color="rgba(10, 5, 4, 0.6)"
                      />
                      <Text style={[styles.detailText, isTraining && { color: "#153e69" }]}>
                        {t("contract", "Contract")}: {jobExp}
                      </Text>
                    </View>
                  ) : null;
                })()}
              </View>
              
              <Text style={[styles.jobDescription, isTraining && { color: "#153e69" }]}>{job.description}</Text>

              {/* Action buttons rendering */}
              <View style={styles.actionsContainer}>
                {showApply ? (
                  // employer/admin/agency: Apply Now only (no Call)
                  <TouchableOpacity
                    style={[
                      styles.textActionBtn,
                      isApplied && styles.textActionBtnApplied,
                    ]}
                    onPress={() =>
                      isApplied || isApplying ? null : handleApplyPress(job)
                    }
                    disabled={isApplied || isApplying}
                    activeOpacity={0.7}
                  >
                    {isApplying ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text
                        style={[
                          styles.textActionBtnText,
                          isApplied && styles.textActionBtnTextApplied,
                        ]}
                      >
                        {isApplied
                          ? "✓ " + t("applied", "Applied")
                          : t("applyNow", "Apply Now")}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  // chef/job_seeker/talent/referral: Call button (same size as Apply)
                  <TouchableOpacity
                    style={[styles.textActionBtn, { flexDirection: "row", gap: 6 }]}
                    onPress={() => handleCall(job)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call" size={16} color="#ffffff" />
                    <Text style={styles.textActionBtnText}>Call Now</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => handleShare(job.title, job.company, job.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-social" size={18} color="#153e69" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconActionBtn}
                  onPress={() => toggleFavorite(job.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isFav ? "star" : "star-outline"}
                    size={18}
                    color={isFav ? "#f2c879" : "#153e69"}
                  />
                </TouchableOpacity>
              </View>

              {/* --- UPDATED LABEL LOGIC (uses effectiveRoleSource fallback) --- */}
              {effectiveRoleSource ? (
                <View
                  style={[
                    styles.poweredRibbon,
                    roleBorderColor && { borderColor: roleBorderColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.poweredRibbonText,
                      roleBorderColor && { color: roleBorderColor },
                    ]}
                  >
                    Posted By •{" "}
                    {(() => {
                      const roleDisplay = effectiveRoleSource.replace(/_/g, " ").toLowerCase();
                      if (roleDisplay === "jobseeker" || roleDisplay === "job seeker") return "TALENT";
                      return roleDisplay.toUpperCase();
                    })()}
                  </Text>
                </View>
              ) : null}
              {/* --- END OF UPDATED LABEL LOGIC --- */}
              </View>
            </View>
          );
        })}

        {/* Bottom Informational Updates Banner */}
        {/* <View style={styles.bottomBanner}>
          <Ionicons name="sync" size={18} color="#153e69" style={{ marginRight: 10 }} />
          <Text style={styles.bottomBannerText}>
            Keep checking the feed regularly for new updates
          </Text>
        </View> */}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => checkPostLimitAndNavigate("Post Referral Job")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

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
              return true;
            } catch (err) {
              Alert.alert("Application Error", err || "Failed to apply to job");
              return false;
            }
          }
          return false;
        }}
      />
      {/* Profile Completion Modal Wizard */}
      <Modal
        visible={completionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setCompletionModalVisible(false);
          setHasModalBeenDismissedThisSession(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("completeProfileModalTitle", "Complete your profile")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCompletionModalVisible(false);
                  setHasModalBeenDismissedThisSession(true);
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="rgba(10, 5, 4, 0.6)"
                />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(currentProgressStep / 3) * 100}%` },
                ]}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 10 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            >
              {currentProgressStep === 1 && (
                <View>
                  <Text style={styles.inputLabel}>
                    {t("personalInfoPhotoTitle", "Personal Info & Photo")}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {t("personalInfoPhotoSubtitle", "A professional photo and profile details help recruiters find you.")}
                  </Text>

                  <View style={styles.wizardRow}>
                    {/* Left Column: Photo */}
                    <View style={styles.wizardLeftCol}>
                      <View style={{ alignSelf: "center", position: "relative" }}>
                        <TouchableOpacity
                          style={styles.photoUploadCircleCompact}
                          onPress={() => {
                            Alert.alert(
                              "Profile Photo",
                              "Select profile photo source:",
                              [
                                { text: "Camera", onPress: handleTakePhoto },
                                { text: "Gallery", onPress: handleUploadPhoto },
                                { text: "Cancel", style: "cancel" }
                              ]
                            );
                          }}
                          activeOpacity={0.8}
                        >
                          {photo ? (
                            <Image source={{ uri: photo }} style={styles.photoUploadImage} />
                          ) : (
                            <Ionicons name="person" size={36} color="rgba(10, 5, 4, 0.15)" />
                          )}
                        </TouchableOpacity>

                        {/* Side edit/add badge icon */}
                        <TouchableOpacity
                          style={styles.photoUploadBadgeCompact}
                          onPress={() => {
                            Alert.alert(
                              "Profile Photo",
                              "Select profile photo source:",
                              [
                                { text: "Camera", onPress: handleTakePhoto },
                                { text: "Gallery", onPress: handleUploadPhoto },
                                { text: "Cancel", style: "cancel" }
                              ]
                            );
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons 
                            name={photo ? "pencil" : "add"} 
                            size={12} 
                            color="#ffffff" 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Right Column: Name & Gender */}
                    <View style={styles.wizardRightCol}>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { fontSize: 11, color: "rgba(10, 5, 4, 0.6)", marginBottom: 4 }]}>{t("fullName", "Full Name")}</Text>
                        <View style={[styles.inputWrapper, { height: 42, paddingHorizontal: 10 }]}>
                          <Ionicons name="person-outline" size={16} color="rgba(10, 5, 4, 0.4)" style={styles.inputIcon} />
                          <TextInput
                            style={[styles.textInputWithIcon, { fontSize: 13 }]}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder={t("enterFullName", "Enter full name")}
                            placeholderTextColor="rgba(10, 5, 4, 0.3)"
                          />
                        </View>
                      </View>

                      <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                        <Text style={[styles.inputLabel, { fontSize: 11, color: "rgba(10, 5, 4, 0.6)", marginBottom: 4 }]}>{t("genderLabel", "Gender")}</Text>
                        <View style={[styles.genderSelectRow, { gap: 6 }]}>
                          {["Male", "Female", "Other"].map((g) => {
                            const isSelected = gender.toLowerCase() === g.toLowerCase();
                            return (
                              <TouchableOpacity
                                key={g}
                                style={[
                                  styles.genderSelectBtnCompact,
                                  isSelected && styles.genderSelectBtnActive,
                                ]}
                                onPress={() => setGender(g.toLowerCase())}
                              >
                                <Text
                                  style={[
                                    styles.genderSelectTextCompact,
                                    isSelected && styles.genderSelectTextActive,
                                  ]}
                                >
                                  {g}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { marginTop: 16 }, !fullName.trim() && { opacity: 0.5 }]}
                    disabled={!fullName.trim() || submittingProfile}
                    onPress={async () => {
                      const ok = await saveProgressStep({
                        full_name: fullName.trim(),
                        gender: gender,
                        profile_photo_path: photo,
                      });
                      if (ok) {
                        try {
                          await AsyncStorage.setItem("@phase1_completed_at", String(Date.now()));
                        } catch (err) {}
                        setCompletionModalVisible(false);
                        setSuccessModalVisible(true);
                      }
                    }}
                  >
                    {submittingProfile ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>{t("saveAndContinue", "Save & Continue")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {currentProgressStep === 2 && (
                <View>
                  <Text style={styles.inputLabel}>
                    {t("workExperienceLocationTitle", "Work Experience & Location")}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {t("workExperienceLocationSubtitle", "Share your experience and the place where you want to work.")}
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: 11, color: "rgba(10, 5, 4, 0.6)", marginBottom: 4 }]}>{t("experienceLabel", "Experience")}</Text>
                    <View style={styles.experienceOptionsRow}>
                      {["1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"].map((r) => {
                        const isSelected = experienceRange === r;
                        return (
                          <TouchableOpacity
                            key={r}
                            style={[
                              styles.experienceOptionBtn,
                              isSelected && styles.experienceOptionBtnActive,
                            ]}
                            onPress={() => setExperienceRange(r)}
                          >
                            <Text
                              style={[
                                styles.experienceOptionText,
                                isSelected && styles.experienceOptionTextActive,
                              ]}
                            >
                              {r}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, { fontSize: 11, color: "rgba(10, 5, 4, 0.6)", marginBottom: 4 }]}>{t("currentEmployerLabel", "Current Employer")}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="business-outline" size={18} color="rgba(10, 5, 4, 0.4)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInputWithIcon}
                        value={currentEmployer}
                        onChangeText={setCurrentEmployer}
                        placeholder="e.g. Self-Employed or hotel name"
                        placeholderTextColor="rgba(10, 5, 4, 0.3)"
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, { fontSize: 11, color: "rgba(10, 5, 4, 0.6)", marginBottom: 4 }]}>{t("jobPreferenceLabel", "Job Preference")}</Text>
                    <View style={styles.jobTypeRow}>
                      {["Full Time", "Part Time", ].map((t) => {
                        const isSelected = jobType === t;
                        const iconName = t === "Full Time" ? "briefcase-outline" : t === "Part Time" ? "time-outline" : "restaurant-outline";
                        return (
                          <TouchableOpacity
                            key={t}
                            style={[
                              styles.jobTypeBtn,
                              isSelected && styles.jobTypeBtnActive,
                            ]}
                            onPress={() => setJobType(t)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Ionicons
                                name={iconName}
                                size={14}
                                color={isSelected ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.5)"}
                              />
                              <Text
                                style={[
                                  styles.jobTypeText,
                                  isSelected && styles.jobTypeTextActive,
                                ]}
                              >
                                {t}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, { fontSize: 11, color: "rgba(10, 5, 4, 0.6)", marginBottom: 4 }]}>{t("preferredRegionLabel", "Preferred Region")}</Text>
                    <View style={styles.locationPreferenceRow}>
                      {["India", "Overseas", "Both"].map((p) => {
                        const isSelected = locationPreference === p;
                        const iconName = p === "India" ? "pin-outline" : p === "Overseas" ? "globe-outline" : "earth-outline";
                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.locationPreferenceBtn,
                              isSelected && styles.locationPreferenceBtnActive,
                            ]}
                            onPress={() => setLocationPreference(p)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Ionicons
                                name={iconName}
                                size={14}
                                color={isSelected ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.5)"}
                              />
                              <Text
                                style={[
                                  styles.locationPreferenceText,
                                  isSelected && styles.locationPreferenceTextActive,
                                ]}
                              >
                                {p}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, { fontSize: 11, color: "rgba(10, 5, 4, 0.6)", marginBottom: 4 }]}>{t("preferredCityLabel", "Preferred City / State")}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="location-outline" size={18} color="rgba(10, 5, 4, 0.4)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInputWithIcon}
                        value={city}
                        onChangeText={setCity}
                        placeholder="e.g. Mumbai, Dubai"
                        placeholderTextColor="rgba(10, 5, 4, 0.3)"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { marginTop: 20 }, (!experienceRange || !currentEmployer.trim() || !city.trim()) && { opacity: 0.5 }]}
                    disabled={!experienceRange || !currentEmployer.trim() || !city.trim() || submittingProfile}
                    onPress={async () => {
                      const ok = await saveProgressStep({
                        experience_range: experienceRange,
                        current_employer: currentEmployer.trim(),
                        job_type: jobType,
                        location_preference: locationPreference,
                        city: city.trim(),
                      });
                      if (ok) {
                        try {
                          await AsyncStorage.setItem("@phase2_completed_at", String(Date.now()));
                        } catch (err) {}
                        setCurrentProgressStep(3);
                      }
                    }}
                  >
                    {submittingProfile ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>{t("continue", "Continue")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {currentProgressStep === 3 && (
                <View>
                  <Text style={styles.inputLabel}>
                    {t("positionBestMatchesTitle", "Which position best matches your experience?")}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {t("positionBestMatchesSubtitle", "Select the role that defines your expertise in the hospitality industry.")}
                  </Text>

                  <View style={{ gap: 12, marginBottom: 20 }}>
                    {categories.map((item) => {
                      const isSelected = selectedCategory === item.id;
                      return (
                        <View key={item.id}>
                          <TouchableOpacity
                            style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                            onPress={() => {
                              setSelectedCategory(item.id);
                              if (selectedCategory !== item.id) {
                                setPreferredRole("");
                              }
                            }}
                            activeOpacity={0.9}
                          >
                            <View style={styles.roleCardLeft}>
                              <View style={[styles.roleIconCircle, isSelected && styles.roleIconCircleActive]}>
                                <Ionicons name={item.icon} size={20} color={PRIMARY_GREEN} />
                              </View>
                              <Text style={styles.roleCardTitle}>{item.title}</Text>
                            </View>
                            <View style={[styles.radioOutline, isSelected && styles.radioActive]}>
                              {isSelected && <View style={styles.radioDotInner} />}
                            </View>
                          </TouchableOpacity>

                          {isSelected && (
                            <Pressable
                              style={styles.inlineDropdownTrigger}
                              onPress={() => {
                                setJobTitleSearch("");
                                setJobTitleModalVisible(true);
                              }}
                            >
                              <Text style={[styles.inlineDropdownTriggerText, !preferredRole && { color: "rgba(10, 5, 4, 0.4)" }]}>
                                {preferredRole || t("selectSpecificJobTitle", "Select specific job title...")}
                              </Text>
                              <Ionicons name="chevron-down" size={18} color="rgba(10, 5, 4, 0.6)" />
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { marginTop: 20 }, !preferredRole.trim() && { opacity: 0.5 }]}
                    disabled={!preferredRole.trim() || submittingProfile}
                    onPress={async () => {
                      const ok = await saveProgressStep({
                        preferred_role: preferredRole.trim(),
                      });
                      if (ok) {
                        setCompletionModalVisible(false);
                        setSuccessModalVisible(true);
                      }
                    }}
                  >
                    {submittingProfile ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>{t("saveAndContinue", "Save & Continue")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerIcon: {
    width: 32,
    height: 32,
  },
  logoContainer: {
    width: 140,
    height: 38,
    overflow: "hidden",
    justifyContent: "center",
  },
  headerLogo: {
    width: 120,
    height: 120,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  headerRight: {
    padding: 6,
  },
  headerNotificationBtn: {
    padding: 6,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f57f20",
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  pinIcon: {
    marginRight: 12,
  },
  filterPills: {
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f2f2f3",
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillSelected: {
    backgroundColor: "#153e69",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  filterPillTextSelected: {
    color: "#ffffff",
  },
  feedScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 85,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
  },
  separatorBadge: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  separatorText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  highlightedCard: {
    borderColor: "#153e69",
    borderWidth: 2,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    shadowColor: "#153e69",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  pinnedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  pinnedLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f57f20",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  employerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153e69",
    marginBottom: 2,
  },
  referralHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f57f20",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "750",
    color: "#0a0504",
  },
  favBtn: {
    padding: 2,
  },
  detailsBlock: {
    backgroundColor: "#f2f2f3",
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "550",
  },
  jobDescription: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 16,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  textActionBtn: {
    flex: 1,
    height: 40,
    backgroundColor: "#153e69",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#153e69",
  },
  textActionBtnApplied: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  textActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  textActionBtnTextApplied: {
    color: "rgba(10, 5, 4, 0.6)",
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f2f2f3",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.4)",
    textAlign: "right",
    marginTop: 4,
  },
  bottomBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.18)",
    borderRadius: 10,
    padding: 12,
    justifyContent: "center",
    marginTop: 8,
  },
  bottomBannerText: {
    fontSize: 12,
    color: "#153e69",
    fontWeight: "600",
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
    elevation: 4,
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
});
