import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  BackHandler,
  ActivityIndicator,
  Modal,
  Clipboard,
  Linking,
  findNodeHandle,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, setProfileData, resetUser, updateProfile } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { 
  setChefOnboardingCompleted, 
  setStoredProfile, 
  clearAuthStorage,
  getChefOnboardingStep,
  setChefOnboardingStep,
  removeChefOnboardingStep
} from "../../services/storage";
import * as ImagePicker from "expo-image-picker";
import { saveChefOnboarding } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";
import ModalPicker, { ModalPickerTrigger } from "../../components/common/ModalPicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(scale * size);

const PRIMARY_GREEN = "#047857";

const countriesList = [
  "India",
  "Saudi Arabia",
];

const citiesByCountry = {
  "India": [
    "Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", 
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Kanpur", "Nagpur", 
    "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", 
    "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", 
    "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Amritsar", "Navi Mumbai", 
    "Prayagraj (Allahabad)", "Ranchi", "Coimbatore", "Jabalpur", "Gwalior", 
    "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", 
    "Chandigarh", "Mysore", "Gurgaon", "Noida", "Jalandhar", "Bhubaneswar", 
    "Thiruvananthapuram", "Dehradun", "Shimla", "Goa", "Mangalore", "Kochi", 
    "Kozhikode", "Other"
  ],
  "Saudi Arabia": [
    "Riyadh", "Jeddah", "Mecca (Makkah)", "Medina (Madinah)", "Dammam", 
    "Khobar", "Tabuk", "Al-Ahsa", "Taif", "Khamis Mushait", "Buraidah", 
    "Jubail", "Abha", "Najran", "Yanbu", "Al Qunfudhah", "Jizan", "Ha'il", 
    "Arar", "Sakaka", "Al Bahah", "Dhahran", "Rabigh", "Al Wajh", "Unaizah", 
    "Other"
  ],
};

const commonLanguagesList = [
  "English",
  "Hindi",
  "Arabic",
  "Malayalam",
  "Tamil",
  "Urdu",
  "Bengali",
  "French",
  "Spanish"
];

const cuisinesList = [
  "Italian", "Continental", "Indian", "Chinese", 
  "Bakery", "Arabic", "Multi Cuisine", "Grill & BBQ", "Other"
];

const operationsList = [
  "Menu Engineering",
  "SOP Writing",
  "Kitchen Setup",
  "Team Training",
  "Cost Control",
  "Recipe Standardization",
  "Soft Opening Support",
  "Franchise Development",
  "Cloud Kitchen Consulting",
  "Brand Development",
  "Staff Recruitment Support",
  "Other"
];

import useKeyboardAwareScroll from "../../hooks/useKeyboardAwareScroll";

export default function ChefCompleteProfileScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const [step, setStep] = useState(() => {
    if (route?.params?.step) {
      return route.params.step;
    }
    return 1;
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  useEffect(() => {
    if (route?.params?.step) {
      setStep(route.params.step);
    }
  }, [route?.params?.step]);

  const { scrollViewRef, handleInputFocus: scrollInputFocus } = useKeyboardAwareScroll({ extraOffset: 30 });
  const bioInputRef = useRef(null);

  const handleInputFocus = (e, key) => {
    if (key) setActiveInput(key);
    scrollInputFocus(e);
  };

  // --- Step 1 State ---
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [currentCity, setCurrentCity] = useState("");
  const [country, setCountry] = useState("");
  const [languages, setLanguages] = useState(["English"]);
  const [newLanguage, setNewLanguage] = useState("");
  const [showLangInput, setShowLangInput] = useState(false);

  // Country & City Dropdown States
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const ageOptions = [
    "18-25 Years",
    "25-30 Years",
    "30-35 Years",
    "35-40 Years",
    "40+ Years"
  ];

  const professionalTitleOptions = [
    "Executive Chef",
    "Head Chef",
    "Sous Chef",
    "Pastry Chef",
    "Chef de Partie",
    "Culinary Consultant",
    "Kitchen Manager"
  ];

  // --- Step 2 State ---
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const [experienceYears, setExperienceYears] = useState("");
  const [showExpDropdown, setShowExpDropdown] = useState(false);

  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  const [showOperationsDropdown, setShowOperationsDropdown] = useState(false);
  const [customCuisine, setCustomCuisine] = useState("");
  const [customOperation, setCustomOperation] = useState("");

  const experienceOptions = [
    "1-2 Years", "2-5 Years", "5-10 Years", "10-25 Years", "25+ and above"
  ];

  // --- Step 3 State ---
  const [regionalExperience, setRegionalExperience] = useState([]);
  const [locationPreference, setLocationPreference] = useState("");
  const [employmentPreference, setEmploymentPreference] = useState([]);
  const [availability, setAvailability] = useState("");
  const [showAvailDropdown, setShowAvailDropdown] = useState(false);
  const [bio, setBio] = useState("");

  const regionalOptions = ["Saudi Arabia", "UAE", "GCC", "International", "India"];
  const locationPrefOptions = ["India", "Overseas", "Both (India & Overseas)"];
  const employmentOptions = ["Full Time", "Contract", "Freelance", "Project Based", "Consultant"];
  const availabilityOptions = ["Available Immediately", "Currently Employed"];

  // --- Step 4 State ---
  const [calendlyLink, setCalendlyLink] = useState("https://calendly.com/");
  const [isProfileInitialized, setIsProfileInitialized] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile && !isProfileInitialized) {
      if (profile.full_name || profile.name) {
        const profileName = profile.full_name || profile.name || "";
        const isPhoneLike = /^\+?\d[\d\s-]{6,}$/.test(profileName);
        if (!isPhoneLike) {
          setFullName(profileName);
        }
      }
      if (profile.age) {
        setAge(profile.age);
      }
      if (profile.profile_photo_path) {
        setPhotoUri(profile.profile_photo_path);
        setPhotoUploaded(true);
      }
      if (profile.professionalTitle || profile.preferred_role) {
        setProfessionalTitle(profile.professionalTitle || profile.preferred_role);
      }
      if (profile.city) {
        setCurrentCity(profile.city);
        if (profile.country && countriesList.includes(profile.country) && citiesByCountry[profile.country]?.includes(profile.city)) {
          setSelectedCity(profile.city);
        } else {
          setSelectedCity("Other");
        }
      }
      if (profile.country) {
        setCountry(profile.country);
        if (countriesList.includes(profile.country)) {
          setSelectedCountry(profile.country);
        } else {
          setSelectedCountry("Other");
        }
      }
      if (profile.calendly_link || profile.calendlyUrl || profile.calendlyLink) {
        setCalendlyLink(profile.calendly_link || profile.calendlyUrl || profile.calendlyLink);
      } else {
        setCalendlyLink("https://calendly.com/");
      }
      if (profile.linkedin) {
        setLinkedinLink(profile.linkedin);
        setLinkedinConnected(true);
      }
      if (profile.instagram) {
        setInstagramLink(profile.instagram);
        setInstagramConnected(true);
      }
      if (profile.facebook) {
        setFacebookLink(profile.facebook);
        setFacebookConnected(true);
      }
      if (profile.twitter) {
        setTwitterLink(profile.twitter);
        setMoreConnected(true);
        setCustomSocialLinks(prev => {
          if (!prev.some(item => item.platform.toLowerCase() === "twitter")) {
            return [...prev, { id: "twitter-init", platform: "Twitter", link: profile.twitter }];
          }
          return prev;
        });
      }

      // Cuisines loading
      let loadedCuisines = [];
      if (Array.isArray(profile.cuisines)) {
        loadedCuisines = profile.cuisines;
      } else if (typeof profile.cuisines === "string") {
        loadedCuisines = profile.cuisines.split(",").map(x => x.trim()).filter(Boolean);
      } else if (typeof profile.cuisine_specialty === "string") {
        loadedCuisines = profile.cuisine_specialty.split(",").map(x => x.trim()).filter(Boolean);
      }
      
      const matchedCuisines = [];
      let otherCuisines = [];
      loadedCuisines.forEach(c => {
        if (cuisinesList.filter(x => x !== "Other").includes(c)) {
          matchedCuisines.push(c);
        } else {
          otherCuisines.push(c);
        }
      });
      if (otherCuisines.length > 0) {
        matchedCuisines.push("Other");
        setCustomCuisine(otherCuisines.join(", "));
      }
      setSelectedCuisines(matchedCuisines);

      // Operations (Skills) loading
      let loadedOps = [];
      console.log("ChefCompleteProfileScreen - loaded profile:", JSON.stringify(profile));
      if (Array.isArray(profile.operations) && profile.operations.length > 0) {
        loadedOps = profile.operations;
      } else if (Array.isArray(profile.skills) && profile.skills.length > 0) {
        loadedOps = profile.skills;
      } else if (typeof profile.operations === "string" && profile.operations.trim().length > 0) {
        loadedOps = profile.operations.split(",").map(x => x.trim()).filter(Boolean);
      } else if (typeof profile.skills === "string" && profile.skills.trim().length > 0) {
        loadedOps = profile.skills.split(",").map(x => x.trim()).filter(Boolean);
      } else if (profile.chef_profile?.operational_experties) {
        loadedOps = profile.chef_profile.operational_experties.split(",").map(x => x.trim()).filter(Boolean);
      } else if (profile.chef_profile?.operational_expertise) {
        loadedOps = profile.chef_profile.operational_expertise.split(",").map(x => x.trim()).filter(Boolean);
      }
      console.log("ChefCompleteProfileScreen - loadedOps:", loadedOps);

      const matchedOps = [];
      let otherOps = [];
      console.log("ChefCompleteProfileScreen - processing loadedOps:", loadedOps);
      loadedOps.forEach(o => {
        let mapped = o;
        if (o === "SOP Writer") mapped = "SOP Writing";
        if (o === "Team Builder") mapped = "Team Training";
        if (o === "Cost Control Expert") mapped = "Cost Control";

        if (operationsList.filter(x => x !== "Other").includes(mapped)) {
          matchedOps.push(mapped);
        } else {
          otherOps.push(o);
        }
      });
      console.log("ChefCompleteProfileScreen - matchedOps:", matchedOps, "otherOps:", otherOps);
      if (otherOps.length > 0) {
        matchedOps.push("Other");
        setCustomOperation(otherOps.join(", "));
      }
      setSelectedOperations(matchedOps);

      // Experience Range loading
      if (profile.experienceYears || profile.experience_range || profile.experience) {
        setExperienceYears(profile.experienceYears || profile.experience_range || profile.experience);
      }

      // Regional Experience loading
      let loadedReg = [];
      const rawReg =
        (profile.availability_info && typeof profile.availability_info === "object" && !Array.isArray(profile.availability_info) && profile.availability_info.regional_experience) ||
        (profile.chef_profile?.availability_info && typeof profile.chef_profile.availability_info === "object" && !Array.isArray(profile.chef_profile.availability_info) && profile.chef_profile.availability_info.regional_experience) ||
        profile.chef_profile?.regional_experience ||
        profile.regionalExperience ||
        profile.regional_experience;

      if (Array.isArray(rawReg)) {
        loadedReg = rawReg;
      } else if (typeof rawReg === "string") {
        loadedReg = rawReg.split(",").map(x => x.trim()).filter(Boolean);
      }
      setRegionalExperience(loadedReg);

      // Location Preference loading
      const rawLocPref =
        (profile.availability_info && typeof profile.availability_info === "object" && profile.availability_info.location_preference) ||
        (profile.chef_profile?.availability_info && typeof profile.chef_profile.availability_info === "object" && profile.chef_profile.availability_info.location_preference) ||
        profile.chef_profile?.location_preference ||
        profile.locationPreference ||
        profile.location_preference;

      if (rawLocPref) {
        if (rawLocPref === "Both" || rawLocPref.toLowerCase().includes("both")) {
          setLocationPreference("Both (India & Overseas)");
        } else if (rawLocPref === "India" || rawLocPref.toLowerCase() === "india") {
          setLocationPreference("India");
        } else if (rawLocPref === "Overseas" || rawLocPref.toLowerCase() === "overseas") {
          setLocationPreference("Overseas");
        } else {
          setLocationPreference(rawLocPref);
        }
      }

      // Employment Preference loading
      let loadedEmp = [];
      const rawEmp =
        (profile.availability_info && typeof profile.availability_info === "object" && !Array.isArray(profile.availability_info) && profile.availability_info.employment_preference) ||
        (profile.chef_profile?.availability_info && typeof profile.chef_profile.availability_info === "object" && !Array.isArray(profile.chef_profile.availability_info) && profile.chef_profile.availability_info.employment_preference) ||
        profile.chef_profile?.employment_preference ||
        profile.employmentPreference ||
        profile.employment_preference;

      if (Array.isArray(rawEmp)) {
        loadedEmp = rawEmp;
      } else if (typeof rawEmp === "string") {
        loadedEmp = rawEmp.split(",").map(x => x.trim()).filter(Boolean);
      }
      setEmploymentPreference(loadedEmp);

      // Availability loading
      const rawAvail =
        (profile.availability_info && typeof profile.availability_info === "object" && (profile.availability_info.availability_status || profile.availability_info.status)) ||
        (profile.chef_profile?.availability_info && typeof profile.chef_profile.availability_info === "object" && (profile.chef_profile.availability_info.availability_status || profile.chef_profile.availability_info.status)) ||
        profile.chef_profile?.availability ||
        profile.availability;

      if (rawAvail) {
        setAvailability(rawAvail);
      }

      // Bio loading
      const rawBio = profile.bio || profile.chef_profile?.bio;
      if (rawBio) {
        setBio(rawBio);
      }

      // Languages loading
      let loadedLangs = [];
      const rawLangs =
        (profile.availability_info && typeof profile.availability_info === "object" && profile.availability_info.languages) ||
        (profile.chef_profile?.availability_info && typeof profile.chef_profile.availability_info === "object" && profile.chef_profile.availability_info.languages) ||
        profile.languages ||
        profile.chef_profile?.languages;

      if (Array.isArray(rawLangs)) {
        loadedLangs = rawLangs;
      } else if (typeof rawLangs === "string") {
        loadedLangs = rawLangs.split(",").map(x => x.trim()).filter(Boolean);
      }
      setLanguages(loadedLangs);
      setIsProfileInitialized(true);
    }
  }, [profile, isProfileInitialized]);

  useEffect(() => {
    const loadSavedStep = async () => {
      try {
        const routeStep = route?.params?.step || route?.params?.initialStep;
        if (routeStep) {
          const parsedStep = parseInt(routeStep, 10);
          if (parsedStep >= 1 && parsedStep <= 7) {
            setStep(parsedStep);
            return;
          }
        }

        const savedStep = await getChefOnboardingStep();
        if (savedStep) {
          const parsedStep = parseInt(savedStep, 10);
          if (parsedStep >= 1 && parsedStep <= 7) {
            setStep(parsedStep);
          }
        }
      } catch (e) {
        console.error("Failed to load onboarding step:", e);
      }
    };
    loadSavedStep();
  }, [route?.params?.step, route?.params?.initialStep]);

  useEffect(() => {
    const saveCurrentStep = async () => {
      try {
        await setChefOnboardingStep(step);
      } catch (e) {
        console.error("Failed to save onboarding step:", e);
      }
    };
    saveCurrentStep();

    if (scrollViewRef?.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [step]);

  const handleCreateCalendlyAccount = () => {
    Linking.openURL("https://calendly.com/signup").catch((err) => {
      Alert.alert("Error", "Could not open browser: " + err.message);
    });
  };

  const handleCopyCalendlySignupLink = () => {
    Clipboard.setString("https://calendly.com/signup");
    Alert.alert("Link Copied", "Calendly signup URL copied to clipboard!");
  };

  const handlePasteCalendlyLink = async () => {
    try {
      const content = await Clipboard.getString();
      if (content && content.trim()) {
        let cleaned = content.trim().replace(/\s+/g, "");
        if (!/^https?:\/\//i.test(cleaned)) {
          cleaned = "https://" + cleaned;
        }
        setCalendlyLink(cleaned);
        Alert.alert("Success", "Calendly link pasted successfully!");
      } else {
        Alert.alert("Clipboard Empty", "No content found in clipboard to paste.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to paste from clipboard.");
    }
  };

  // --- Step 5 State ---
  const [linkedinLink, setLinkedinLink] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [facebookLink, setFacebookLink] = useState("");
  const [twitterLink, setTwitterLink] = useState("");
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [moreConnected, setMoreConnected] = useState(false);

  // Connection Modal State
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState("");
  const [tempLink, setTempLink] = useState("");

  const [customSocialLinks, setCustomSocialLinks] = useState([]);
  const [customPlatformName, setCustomPlatformName] = useState("");

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to upload a photo."
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
        setPhotoUri(result.assets[0].uri);
        setPhotoUploaded(true);
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
          "Permission Denied",
          "Sorry, we need camera permissions to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        setPhotoUploaded(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo.");
    }
  };

  const selectPhotoSource = () => {
    Alert.alert(
      "Profile Photo",
      "Select profile photo source:",
      [
        { text: "Camera", onPress: handleTakePhoto },
        { text: "Gallery", onPress: handleUploadPhoto },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleExitAndLogout = async () => {
    try {
      const { logout: logoutApi } = require("../../services/authApi");
      logoutApi().catch(() => {});
    } catch (e) {
      // ignore
    }
    await clearAuthStorage();
    try {
      const { clearClientState } = require("../../services/apiClient");
      clearClientState();
    } catch (e) {
      console.warn("Failed to clear API client state:", e);
    }
    dispatch(logout());
    dispatch(resetUser());
  };

  // --- Actions ---
  const handleAddLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
      setShowLangInput(false);
    }
  };

  const handleRemoveLanguage = (lang) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const toggleCuisine = (cuisine) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter((c) => c !== cuisine));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };

  const toggleOperation = (op) => {
    if (selectedOperations.includes(op)) {
      setSelectedOperations(selectedOperations.filter((o) => o !== op));
    } else {
      setSelectedOperations([...selectedOperations, op]);
    }
  };

  const toggleRegionalExp = (region) => {
    if (regionalExperience.includes(region)) {
      setRegionalExperience(regionalExperience.filter((r) => r !== region));
    } else {
      setRegionalExperience([...regionalExperience, region]);
    }
  };

  const toggleEmploymentPref = (pref) => {
    if (employmentPreference.includes(pref)) {
      setEmploymentPreference(employmentPreference.filter((p) => p !== pref));
    } else {
      setEmploymentPreference([...employmentPreference, pref]);
    }
  };

  const next = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        Alert.alert(t("error"), t("chefOnboarding.fullNameRequired"));
        return;
      }
      if (!professionalTitle.trim()) {
        Alert.alert(t("error"), t("chefOnboarding.titleRequired"));
        return;
      }
      if (!currentCity.trim() || !country.trim()) {
        Alert.alert(t("error"), t("chefOnboarding.locationRequired"));
        return;
      }
      if (languages.length === 0) {
        Alert.alert(t("error"), t("chefOnboarding.languageRequired"));
        return;
      }
    }

    if (step === 2) {
      if (selectedCuisines.length === 0) {
        Alert.alert(t("error"), t("chefOnboarding.cuisineRequired"));
        return;
      }
      if (selectedOperations.length === 0) {
        Alert.alert(t("error"), t("chefOnboarding.operationRequired"));
        return;
      }
      if (!experienceYears) {
        Alert.alert(t("error"), t("chefOnboarding.experienceRequired"));
        return;
      }
    }

    if (step === 3) {
      if (regionalExperience.length === 0) {
        Alert.alert(t("error"), t("chefOnboarding.regionalRequired"));
        return;
      }
      if (!locationPreference) {
        Alert.alert(t("error"), t("chefOnboarding.locationPrefRequired"));
        return;
      }
      if (employmentPreference.length === 0) {
        Alert.alert(t("error"), t("chefOnboarding.employmentRequired"));
        return;
      }
      if (!bio.trim()) {
        Alert.alert(t("error"), t("chefOnboarding.bioRequired"));
        return;
      }
    }

    if (step === 4) {
      if (calendlyLink && calendlyLink.trim()) {
        let cleaned = calendlyLink.trim().replace(/\s+/g, "");
        if (
          cleaned === "https://calendly.com/" ||
          cleaned === "https://calendly.com" ||
          cleaned === "http://calendly.com/" ||
          cleaned === "http://calendly.com" ||
          cleaned === "calendly.com/" ||
          cleaned === "calendly.com"
        ) {
          setCalendlyLink("");
        } else {
          if (!/^https?:\/\//i.test(cleaned)) {
            cleaned = "https://" + cleaned;
          }
          setCalendlyLink(cleaned);
        }
      }
    }

    if (step < 7) {
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step === 7) return; // Cannot go back from Congratulations
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        CustomAlert.show(
          t("exitOnboarding", "Exit Onboarding?"),
          t("exitOnboardingMessage", "Do you want to log out and exit profile setup?"),
          [
            { text: t("cancel"), style: "cancel" },
            {
              text: t("logOut"),
              style: "destructive",
              onPress: handleExitAndLogout,
            },
          ]
        );
      }
    }
  };

  useEffect(() => {
    const backAction = () => {
      prev();
      return true; // Prevent default app closing behavior
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [step]);

  const handleCompleteProfile = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("age", age || "");
      formData.append("preferred_role", professionalTitle);
      formData.append("city", currentCity);
      formData.append("country", country);
      formData.append("experience_range", experienceYears);
      
      let finalCuisines = [...selectedCuisines];
      if (finalCuisines.includes("Other")) {
        finalCuisines = finalCuisines.filter(c => c !== "Other");
        if (customCuisine.trim()) {
          finalCuisines.push(customCuisine.trim());
        }
      }
      formData.append("cuisine_specialty", finalCuisines.join(", "));
      formData.append("bio", bio);

      let formattedCalendly = (calendlyLink || "").trim().replace(/\s+/g, "");
      const calendlyPath = formattedCalendly.replace(/^https?:\/\/(www\.)?calendly\.com\/?/i, "").trim();
      if (!calendlyPath) {
        formattedCalendly = "";
      } else if (!/^https?:\/\//i.test(formattedCalendly)) {
        formattedCalendly = "https://" + formattedCalendly;
      }
      formData.append("calendly_link", formattedCalendly || "");

      // Append social links in all common formats to ensure backend maps it correctly
      formData.append("linkedin", linkedinLink || "");
      formData.append("linkedin_link", linkedinLink || "");
      formData.append("linkedinLink", linkedinLink || "");

      formData.append("instagram", instagramLink || "");
      formData.append("instagram_link", instagramLink || "");
      formData.append("instagramLink", instagramLink || "");

      formData.append("facebook", facebookLink || "");
      formData.append("facebook_link", facebookLink || "");
      formData.append("facebookLink", facebookLink || "");

      formData.append("twitter", twitterLink || "");
      formData.append("twitter_link", twitterLink || "");
      formData.append("twitterLink", twitterLink || "");

      // Location Preference Mapping
      let locPref = "Both";
      if (locationPreference.includes("India") && !locationPreference.includes("Both")) {
        locPref = "India";
      } else if (locationPreference.includes("Overseas") && !locationPreference.includes("Both")) {
        locPref = "Overseas";
      }
      formData.append("location_preference", locPref);
      formData.append("availability", availability);

      // Arrays
      if (Array.isArray(languages)) {
        languages.forEach((lang) => {
          formData.append("languages[]", lang);
        });
      }

      let finalOps = [...selectedOperations];
      if (finalOps.includes("Other")) {
        finalOps = finalOps.filter(o => o !== "Other");
        if (customOperation.trim()) {
          finalOps.push(customOperation.trim());
        }
      }
      if (Array.isArray(finalOps)) {
        finalOps.forEach((operational_experty) => {
          formData.append("operational_experties[]", operational_experty);
        });
      }

      if (Array.isArray(regionalExperience)) {
        regionalExperience.forEach((region) => {
          formData.append("regional_experience[]", region);
        });
      }

      if (Array.isArray(employmentPreference)) {
        employmentPreference.forEach((pref) => {
          formData.append("employment_preference[]", pref);
        });
      }

      // Photo file upload - support both profile_photo and profile_photo_path keys
      if (photoUri) {
        if (photoUri.startsWith("http://") || photoUri.startsWith("https://")) {
          formData.append("profile_photo", photoUri);
          formData.append("profile_photo_path", photoUri);
        } else {
          const uriParts = photoUri.split("/");
          const fileName = uriParts[uriParts.length - 1];
          const fileType = fileName.split(".").pop();
          const fileObj = {
            uri: Platform.OS === "android" ? photoUri : photoUri.replace("file://", ""),
            name: fileName,
            type: `image/${fileType === "jpg" ? "jpeg" : fileType || "png"}`,
          };
          formData.append("profile_photo", fileObj);
          formData.append("profile_photo_path", fileObj);
        }
      }

      // Call API to save chef onboarding details
      const apiResponse = await saveChefOnboarding(formData);

      // Call general profile update API to ensure name and profile photo are saved in core table
      const updatePayload = {
        full_name: fullName,
        name: fullName,
        city: currentCity,
        country,
        age: age || "",
        experience_range: experienceYears,
        preferred_role: professionalTitle,
        profile_photo_path: photoUri,
      };
      await dispatch(updateProfile(updatePayload)).unwrap();

      const profilePayload = {
        ...profile,
        name: fullName || "Chef User",
        age,
        professionalTitle,
        city: currentCity,
        country,
        languages,
        cuisines: finalCuisines,
        operations: finalOps,
        experienceYears,
        regionalExperience,
        locationPreference,
        employmentPreference,
        availability,
        bio,
        calendlyLink,
        calendly_link: calendlyLink,
        calendlyUrl: calendlyLink,
        linkedin: linkedinLink,
        instagram: instagramLink,
        facebook: facebookLink,
        twitter: twitterLink,
        role: "chef",
        chefOnboardingCompleted: false, // Keep onboarding active to show Success step
        profile_photo_path: photoUri || profile?.profile_photo_path,
        ...(apiResponse?.data || apiResponse || {}),
      };

      dispatch(setProfileData(profilePayload));
      await setStoredProfile(profilePayload);
      setStep(7); // Go to success screen
    } catch (error) {
      console.error("Failed to save chef onboarding:", error);
      Alert.alert("Error", error.message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishOnboarding = async (targetTab = "Home") => {
    let finalCuisines = [...selectedCuisines];
    if (finalCuisines.includes("Other")) {
      finalCuisines = finalCuisines.filter(c => c !== "Other");
      if (customCuisine.trim()) {
        finalCuisines.push(customCuisine.trim());
      }
    }

    let finalOps = [...selectedOperations];
    if (finalOps.includes("Other")) {
      finalOps = finalOps.filter(o => o !== "Other");
      if (customOperation.trim()) {
        finalOps.push(customOperation.trim());
      }
    }

    const profilePayload = {
      ...profile,
      name: fullName || "Chef User",
      professionalTitle,
      city: currentCity,
      country,
      languages,
      cuisines: finalCuisines,
      operations: finalOps,
      experienceYears,
      regionalExperience,
      locationPreference,
      employmentPreference,
      availability,
      bio,
      calendlyLink,
      calendly_link: calendlyLink,
      calendlyUrl: calendlyLink,
      linkedin: linkedinLink,
      instagram: instagramLink,
      facebook: facebookLink,
      twitter: twitterLink,
      role: "chef",
      chefOnboardingCompleted: true,
      profile_photo_path: photoUri || profile?.profile_photo_path,
    };

    dispatch(setProfileData(profilePayload));
    await setChefOnboardingCompleted();
    await setStoredProfile(profilePayload);
    await removeChefOnboardingStep();

    try {
      if (targetTab === "Profile") {
        navigation.navigate("Tabs", { screen: "Profile" });
      } else {
        navigation.navigate("Tabs", { screen: "Home" });
      }
    } catch (e) {
      // ignore
    }
  };

  const getOnboardingCompletionPercent = () => {
    let totalFields = 14;
    let filledFields = 0;
    
    if (fullName && fullName.trim()) filledFields++;
    if (photoUri) filledFields++;
    if (professionalTitle && professionalTitle.trim()) filledFields++;
    if (currentCity && currentCity.trim()) filledFields++;
    if (country && country.trim()) filledFields++;
    if (experienceYears && experienceYears.trim()) filledFields++;
    if (bio && bio.trim()) filledFields++;
    if (languages.length > 0) filledFields++;
    if (selectedCuisines.length > 0) filledFields++;
    if (selectedOperations.length > 0) filledFields++;
    if (locationPreference) filledFields++;
    if (employmentPreference.length > 0) filledFields++;
    
    const calendly = calendlyLink;
    const isCalendlyValid = calendly && 
                            calendly.trim().length > 0 && 
                            !/^(https?:\/\/)?(www\.)?calendly\.com\/?$/i.test(calendly.trim());
    if (isCalendlyValid) {
      filledFields++;
    }
    
    const hasSocial = (linkedinLink && linkedinLink.trim()) ||
                      (instagramLink && instagramLink.trim()) ||
                      (facebookLink && facebookLink.trim()) ||
                      (twitterLink && twitterLink.trim()) ||
                      (customSocialLinks && customSocialLinks.length > 0);
    if (hasSocial) {
      filledFields++;
    }
    
    return Math.round((filledFields / totalFields) * 100);
  };
  
  const progress = getOnboardingCompletionPercent();

  return (
    <SafeAreaView style={[styles.container, step === 7 && { backgroundColor: "#ffffff" }]}>
      <KeyboardAvoidingView
        behavior={undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        {step < 7 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={prev} style={styles.headerIconBtn}>
              <Ionicons name="arrow-back" size={24} color="#0a0504" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={[styles.headerTitle, { textAlign: "center" }, step >= 6 && { color: "#153e69" }]}>
                Professional Profile
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
        )}

        {/* Progress Stepper (only for steps 1 to 6) */}
        {step <= 6 && (
          <View style={styles.stepperContainer}>
            <View style={styles.stepperRow}>
              {[
                { num: 1, label: t("personalAndBasicInfoStep", "Personal &\nBasic Info") },
                { num: 2, label: t("experience", "Experience") },
                { num: 3, label: t("expertiseStep", "Expertise") },
                { num: 4, label: t("credentialsStep", "Credentials") },
                { num: 5, label: t("portfolioStep", "Portfolio") },
                { num: 6, label: t("reviewStep", "Review") },
              ].map((item, index) => {
                const isActive = step === item.num;
                const isCompleted = step > item.num;
                return (
                  <React.Fragment key={item.num}>
                    {index > 0 && (
                      <View style={[styles.stepperLine, isCompleted && styles.stepperLineCompleted]} />
                    )}
                    <View style={styles.stepperItem}>
                      <View
                        style={[
                          styles.stepperCircle,
                          isActive && styles.stepperCircleActive,
                          isCompleted && styles.stepperCircleCompleted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepperCircleText,
                            isActive && styles.stepperCircleTextActive,
                            isCompleted && styles.stepperCircleTextCompleted,
                          ]}
                        >
                          {item.num}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stepperLabel,
                          isActive && styles.stepperLabelActive,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>

            <Text style={styles.stepperSubtitle}>
              {t("basicInfoSubtitle", "Let's start with your basic information to create your professional identity.")}
            </Text>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, step === 7 && { backgroundColor: "#ffffff" }]}
          style={step === 7 && { backgroundColor: "#ffffff" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* STEP 1: PERSONAL PROFILE */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              {/* Card 1: Profile Photo */}
              <View style={styles.cardContainer}>
                <View style={styles.photoCardRow}>
                  <View style={styles.photoTextCol}>
                    <Text style={styles.cardTitleText}>
                      {t("profilePhotoTitle", "Profile Photo")}
                    </Text>
                    <Text style={styles.cardSubtitleText}>
                      {t("profilePhotoSub", "A professional photo helps build trust and credibility.")}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.avatarDashedCircle}
                    activeOpacity={0.8}
                    onPress={selectPhotoSource}
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.avatarImageCircle} />
                    ) : (
                      <View style={styles.avatarPlaceholderCol}>
                        <Ionicons name="camera" size={normalize(22)} color="#475569" />
                        <Text style={styles.addPhotoText}>
                          {t("addPhoto", "Add Photo")}
                        </Text>
                      </View>
                    )}
                    <View style={styles.plusGreenBadge}>
                      <Ionicons name="add" size={normalize(14)} color="#ffffff" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 2: Personal Details */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.greenIconCircle}>
                    <Ionicons name="person-outline" size={normalize(16)} color={PRIMARY_GREEN} />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("personalDetails", "Personal Details")}
                  </Text>
                </View>

                {/* 2 Column Row: Full Name & Age */}
                <View style={styles.twoColRow}>
                  {/* Full Name */}
                  <View style={styles.halfCol}>
                    <Text style={styles.fieldLabel}>
                      {t("fullName", "Full Name")}
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    <View style={[styles.fieldInputWrapper, activeInput === "fullName" && styles.fieldInputActive]}>
                      <Ionicons name="person-outline" size={normalize(16)} color="#64748b" style={styles.fieldIconLeft} />
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder={t("enterFullName", "Enter your full name")}
                        placeholderTextColor="#94a3b8"
                        style={styles.fieldTextInput}
                        onFocus={(e) => handleInputFocus(e, "fullName")}
                        onBlur={() => setActiveInput(null)}
                      />
                    </View>
                  </View>

                  {/* Age */}
                  <View style={styles.halfCol}>
                    <Text style={styles.fieldLabel}>
                      {t("age", "Age")}
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    <ModalPickerTrigger
                      onPress={() => setShowAgeDropdown(true)}
                      label={age}
                      placeholder={t("selectAge", "Select age")}
                      isOpen={showAgeDropdown}
                      leftIcon="calendar-outline"
                      style={styles.fieldInputWrapper}
                    />
                    <ModalPicker
                      visible={showAgeDropdown}
                      onClose={() => setShowAgeDropdown(false)}
                      title={t("selectAge", "Select age")}
                      options={ageOptions}
                      selectedValue={age}
                      onSelect={(opt) => setAge(opt)}
                    />
                  </View>
                </View>

                {/* Full Width Row: Professional Title */}
                <View style={styles.fullWidthGroup}>
                  <Text style={styles.fieldLabel}>
                    {t("professionalTitle", "Professional Title")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                  <ModalPickerTrigger
                    onPress={() => setShowTitleDropdown(true)}
                    label={professionalTitle}
                    placeholder={t("selectProfessionalTitle", "Select your professional title")}
                    isOpen={showTitleDropdown}
                    leftIcon="briefcase-outline"
                    style={styles.fieldInputWrapper}
                  />
                  <ModalPicker
                    visible={showTitleDropdown}
                    onClose={() => setShowTitleDropdown(false)}
                    title={t("selectProfessionalTitle", "Select your professional title")}
                    options={professionalTitleOptions}
                    selectedValue={professionalTitle}
                    onSelect={(opt) => setProfessionalTitle(opt)}
                  />
                  <Text style={styles.fieldHelperText}>
                    {t("titleExamples", "Examples: Executive Chef, Sous Chef, Culinary Consultant")}
                  </Text>
                </View>
              </View>

              {/* Card 3: Your Current Location */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.greenIconCircle}>
                    <Ionicons name="location-outline" size={normalize(16)} color={PRIMARY_GREEN} />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("yourCurrentLocation", "Your Current Location")}
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("whereAreYouBased", "Where are you currently based?")}
                </Text>

                {/* 2 Column Row: Country & Current City */}
                <View style={styles.twoColRow}>
                  {/* Country */}
                  <View style={styles.halfCol}>
                    <Text style={styles.fieldLabel}>
                      {t("country", "Country")}
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    <ModalPickerTrigger
                      onPress={() => {
                        setShowCountryDropdown(true);
                        setShowCityDropdown(false);
                      }}
                      label={selectedCountry}
                      placeholder={t("selectCountry", "Select Country")}
                      isOpen={showCountryDropdown}
                      leftIcon="globe-outline"
                      style={styles.fieldInputWrapper}
                    />
                    <ModalPicker
                      visible={showCountryDropdown}
                      onClose={() => setShowCountryDropdown(false)}
                      title={t("selectCountry", "Select Country")}
                      options={countriesList}
                      selectedValue={selectedCountry}
                      onSelect={(opt) => {
                        setSelectedCountry(opt);
                        if (opt === "Other") {
                          setCountry("");
                        } else {
                          setCountry(opt);
                        }
                        setCurrentCity("");
                        setSelectedCity("");
                      }}
                    />
                  </View>

                  {/* Current City */}
                  <View style={styles.halfCol}>
                    <Text style={styles.fieldLabel}>
                      {t("currentCity", "Current City")}
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    {selectedCountry === "Other" ? (
                      <View style={[styles.fieldInputWrapper, activeInput === "city" && styles.fieldInputActive]}>
                        <Ionicons name="location-outline" size={normalize(16)} color="#64748b" style={styles.fieldIconLeft} />
                        <TextInput
                          value={currentCity}
                          onChangeText={setCurrentCity}
                          placeholder={t("selectCity", "Select City")}
                          placeholderTextColor="#94a3b8"
                          style={styles.fieldTextInput}
                          onFocus={(e) => handleInputFocus(e, "city")}
                          onBlur={() => setActiveInput(null)}
                        />
                      </View>
                    ) : (
                      <>
                        <ModalPickerTrigger
                          onPress={() => {
                            if (!selectedCountry) {
                              Alert.alert("Select Country", "Please select a country first.");
                              return;
                            }
                            setShowCityDropdown(true);
                            setShowCountryDropdown(false);
                          }}
                          label={selectedCity === "Other" ? (currentCity || "") : (currentCity || "")}
                          placeholder={t("selectCity", "Select City")}
                          isOpen={showCityDropdown}
                          leftIcon="location-outline"
                          style={[styles.fieldInputWrapper, !selectedCountry && { backgroundColor: "#f8fafc" }]}
                        />
                        <ModalPicker
                          visible={showCityDropdown}
                          onClose={() => setShowCityDropdown(false)}
                          title={t("selectCity", "Select City")}
                          options={citiesByCountry[selectedCountry] || ["Other"]}
                          selectedValue={selectedCity}
                          searchable={true}
                          searchPlaceholder={t("searchCity", "Search city...")}
                          onSelect={(opt) => {
                            setSelectedCity(opt);
                            if (opt === "Other") {
                              setCurrentCity("");
                            } else {
                              setCurrentCity(opt);
                            }
                          }}
                        />
                      </>
                    )}
                  </View>
                </View>

                {selectedCountry === "Other" && (
                  <View style={[styles.fullWidthGroup, { marginTop: normalize(8) }]}>
                    <Text style={styles.fieldLabel}>
                      Enter Country Name
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    <View style={[styles.fieldInputWrapper, activeInput === "customCountry" && styles.fieldInputActive]}>
                      <Ionicons name="globe-outline" size={normalize(16)} color="#64748b" style={styles.fieldIconLeft} />
                      <TextInput
                        value={country}
                        onChangeText={setCountry}
                        placeholder="Enter country name"
                        placeholderTextColor="#94a3b8"
                        style={styles.fieldTextInput}
                        onFocus={(e) => handleInputFocus(e, "customCountry")}
                        onBlur={() => setActiveInput(null)}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Card 4: Languages Spoken */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.greenIconCircle}>
                    <Ionicons name="chatbubble-ellipses-outline" size={normalize(16)} color={PRIMARY_GREEN} />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("languagesSpokenTitle", "Languages Spoken")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("languagesSpokenSub", "Select the languages you speak fluently.")}
                </Text>

                {/* Language Selectable Cards Row */}
                <View style={styles.langPillsRow}>
                  {[
                    { key: "English", label: "English", icon: "chatbubble-outline" },
                    { key: "Hindi", label: "Hindi", icon: "language-outline", nativeLabel: "हिं" },
                    { key: "Arabic", label: "Arabic", icon: "language-outline", nativeLabel: "أمي" },
                  ].map((item) => {
                    const isSelected = languages.includes(item.key);
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.langCardItem,
                          isSelected && styles.langCardItemSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setLanguages(languages.filter((l) => l !== item.key));
                          } else {
                            setLanguages([...languages, item.key]);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.langCardLeft}>
                          {item.nativeLabel ? (
                            <Text style={styles.langNativeBadgeText}>{item.nativeLabel}</Text>
                          ) : (
                            <Ionicons name={item.icon} size={normalize(15)} color={isSelected ? PRIMARY_GREEN : "#64748b"} />
                          )}
                          <Text style={[styles.langCardLabelText, isSelected && styles.langCardLabelSelected]}>
                            {item.label}
                          </Text>
                        </View>
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                          size={normalize(16)}
                          color={isSelected ? PRIMARY_GREEN : "#cbd5e1"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueGreenButton,
                  (!fullName.trim() || !professionalTitle.trim() || !currentCity.trim() || !country.trim() || languages.length === 0) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>

              {/* Security Subtext */}
              <View style={styles.securityRow}>
                <Text style={styles.securityText}>
                  <Ionicons name="lock-closed-outline" size={normalize(12)} color="#64748b" />
                  {"  "}
                  {t("informationSecureSub", "Your information is secure and will never be shared without your consent.")}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 2: PROFESSIONAL EXPERTISE */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              {/* Section Header Title */}
              <View style={styles.stepHeaderRow}>
                <View style={styles.chefHatIconCircle}>
                  <Ionicons name="restaurant-outline" size={normalize(22)} color={PRIMARY_GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepHeaderTitle}>
                    {t("showcaseSkillsTitle", "Showcase Your Skills")}
                  </Text>
                  <Text style={styles.stepHeaderSubtitle}>
                    {t("showcaseSkillsSub", "Highlight your culinary strengths and management capabilities.")}
                  </Text>
                </View>
              </View>

              {/* Card 1: Cuisine Specialization */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#fff7ed" }]}>
                    <Ionicons name="restaurant-outline" size={normalize(16)} color="#f59e0b" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("cuisineSpecializationTitle", "Cuisine Specialization")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("cuisineSpecializationSub", "Select the cuisines you have mastered in your career.")}
                </Text>

                <View style={styles.fullWidthGroup}>
                  <ModalPickerTrigger
                    onPress={() => setShowCuisineDropdown(true)}
                    label={selectedCuisines.length > 0 ? selectedCuisines.map(c => c === "Other" && customCuisine ? `${c} (${customCuisine})` : c).join(", ") : ""}
                    placeholder={t("selectCuisines", "Select cuisines")}
                    isOpen={showCuisineDropdown}
                    leftIcon="restaurant-outline"
                    style={styles.fieldInputWrapper}
                  />
                  <ModalPicker
                    visible={showCuisineDropdown}
                    onClose={() => setShowCuisineDropdown(false)}
                    title={t("cuisineSpecializationTitle", "Cuisine Specialization")}
                    options={cuisinesList}
                    selectedValue={selectedCuisines}
                    onSelect={toggleCuisine}
                    multiSelect={true}
                    searchable={true}
                  />
                  <Text style={styles.fieldHelperText}>
                    {t("cuisineExamples", "Examples: Continental, Indian, Chinese, Italian, Japanese")}
                  </Text>
                </View>

                {/* Custom Cuisine Input if Other is selected */}
                {selectedCuisines.includes("Other") && (
                  <View style={[styles.fullWidthGroup, { marginTop: normalize(8) }]}>
                    <Text style={styles.fieldLabel}>
                      Enter Other Cuisine(s)
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    <View style={[styles.fieldInputWrapper, activeInput === "customCuisine" && styles.fieldInputActive]}>
                      <Ionicons name="create-outline" size={normalize(16)} color="#64748b" style={styles.fieldIconLeft} />
                      <TextInput
                        value={customCuisine}
                        onChangeText={setCustomCuisine}
                        placeholder="e.g. French, Japanese"
                        placeholderTextColor="#94a3b8"
                        style={styles.fieldTextInput}
                        onFocus={(e) => handleInputFocus(e, "customCuisine")}
                        onBlur={() => setActiveInput(null)}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Card 2: Operational Expertise */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.greenIconCircle}>
                    <Ionicons name="briefcase-outline" size={normalize(16)} color={PRIMARY_GREEN} />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("operationalExpertiseTitle", "Operational Expertise")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("operationalExpertiseSub", "Select the key areas where you have strong management experience across operations.")}
                </Text>

                <View style={styles.fullWidthGroup}>
                  <ModalPickerTrigger
                    onPress={() => setShowOperationsDropdown(true)}
                    label={selectedOperations.length > 0 ? selectedOperations.map(o => o === "Other" && customOperation ? `${o} (${customOperation})` : o).join(", ") : ""}
                    placeholder={t("selectOperationalExpertise", "Select Operational Expertise")}
                    isOpen={showOperationsDropdown}
                    leftIcon="briefcase-outline"
                    style={styles.fieldInputWrapper}
                  />
                  <ModalPicker
                    visible={showOperationsDropdown}
                    onClose={() => setShowOperationsDropdown(false)}
                    title={t("operationalExpertiseTitle", "Operational Expertise")}
                    options={operationsList}
                    selectedValue={selectedOperations}
                    onSelect={toggleOperation}
                    multiSelect={true}
                    searchable={true}
                  />
                </View>

                {/* Custom Operation Input if Other is selected */}
                {selectedOperations.includes("Other") && (
                  <View style={[styles.fullWidthGroup, { marginTop: normalize(8) }]}>
                    <Text style={styles.fieldLabel}>
                      Enter Other Operational Expertise
                      <Text style={styles.requiredStar}> *</Text>
                    </Text>
                    <View style={[styles.fieldInputWrapper, activeInput === "customOperation" && styles.fieldInputActive]}>
                      <Ionicons name="create-outline" size={normalize(16)} color="#64748b" style={styles.fieldIconLeft} />
                      <TextInput
                        value={customOperation}
                        onChangeText={setCustomOperation}
                        placeholder="e.g. Menu Development, Staffing"
                        placeholderTextColor="#94a3b8"
                        style={styles.fieldTextInput}
                        onFocus={(e) => handleInputFocus(e, "customOperation")}
                        onBlur={() => setActiveInput(null)}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Card 3: Years of Experience */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#f3e8ff" }]}>
                    <Ionicons name="calendar-outline" size={normalize(16)} color="#8b5cf6" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("yearsOfExperienceTitle", "Years of Experience")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("yearsOfExperienceSub", "Select your total professional experience.")}
                </Text>

                <View style={styles.fullWidthGroup}>
                  <ModalPickerTrigger
                    onPress={() => setShowExpDropdown(true)}
                    label={experienceYears}
                    placeholder={t("selectExperienceRange", "Select experience range")}
                    isOpen={showExpDropdown}
                    leftIcon="calendar-outline"
                    style={styles.fieldInputWrapper}
                  />
                  <ModalPicker
                    visible={showExpDropdown}
                    onClose={() => setShowExpDropdown(false)}
                    title={t("yearsOfExperienceTitle", "Years of Experience")}
                    options={experienceOptions}
                    selectedValue={experienceYears}
                    onSelect={(val) => setExperienceYears(val)}
                  />
                  <Text style={styles.fieldHelperText}>
                    {t("experienceHelperText", "This helps us match you with the right opportunities.")}
                  </Text>
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueGreenButton,
                  (!selectedCuisines.length || 
                   (selectedCuisines.includes("Other") && !customCuisine.trim()) ||
                   !selectedOperations.length || 
                   (selectedOperations.includes("Other") && !customOperation.trim()) ||
                   !experienceYears) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>

              {/* Security Subtext */}
              <View style={styles.securityRow}>
                <Text style={styles.securityText}>
                  <Ionicons name="lock-closed-outline" size={normalize(12)} color="#64748b" />
                  {"  "}
                  {t("informationSecureSub", "Your information is secure and will never be shared without your consent.")}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 3: EXPERIENCE & AVAILABILITY */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              {/* Section Header Title */}
              <View style={styles.stepHeaderRow}>
                <View style={[styles.chefHatIconCircle, { backgroundColor: "#eff6ff" }]}>
                  <Ionicons name="globe-outline" size={normalize(22)} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepHeaderTitle}>
                    {t("experienceAvailabilityTitle", "Experience & Availability")}
                  </Text>
                  <Text style={styles.stepHeaderSubtitle}>
                    {t("experienceAvailabilitySub", "Help us match you with the right culinary opportunities across the globe.")}
                  </Text>
                </View>
              </View>

              {/* Card 1: Regional Experience */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#eff6ff" }]}>
                    <Ionicons name="globe-outline" size={normalize(16)} color="#3b82f6" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("regionalExperienceTitle", "Regional Experience")}
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("regionalExperienceSub", "Where have you worked? Select all that apply.")}
                </Text>

                <View style={styles.pillsRowWrap}>
                  {regionalOptions.map((r) => {
                    const isSelected = regionalExperience.includes(r);
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roundedPillCard, isSelected && styles.roundedPillCardSelected]}
                        onPress={() => toggleRegionalExp(r)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.roundedPillCardText, isSelected && styles.roundedPillCardTextSelected]}>
                          {r}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={normalize(15)} color="#ffffff" style={{ marginLeft: normalize(4) }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Card 2: Job Location Preference */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#fff1f2" }]}>
                    <Ionicons name="location-outline" size={normalize(16)} color="#f43f5e" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("jobLocationPrefTitle", "Job Location Preference")}
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("whereOpenToWork", "Where are you open to work?")}
                </Text>

                <View style={styles.pillsRowWrap}>
                  {locationPrefOptions.map((lp) => {
                    const isSelected = locationPreference === lp;
                    return (
                      <TouchableOpacity
                        key={lp}
                        style={[styles.roundedPillCard, isSelected && styles.roundedPillCardSelected]}
                        onPress={() => setLocationPreference(lp)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.roundedPillCardText, isSelected && styles.roundedPillCardTextSelected]}>
                          {lp}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={normalize(15)} color="#ffffff" style={{ marginLeft: normalize(4) }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.fieldHelperText}>
                  {t("prefHelperText", "Choose the locations you prefer for future opportunities.")}
                </Text>
              </View>

              {/* Card 3: Employment Preference */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#fff7ed" }]}>
                    <Ionicons name="briefcase-outline" size={normalize(16)} color="#f59e0b" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("employmentPrefTitle", "Employment Preference")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("employmentPrefSub", "What type of work arrangement suits you best?")}
                </Text>

                <View style={styles.pillsRowWrap}>
                  {employmentOptions.map((ep) => {
                    const isSelected = employmentPreference.includes(ep);
                    return (
                      <TouchableOpacity
                        key={ep}
                        style={[styles.roundedPillCard, isSelected && styles.roundedPillCardSelected]}
                        onPress={() => toggleEmploymentPref(ep)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.roundedPillCardText, isSelected && styles.roundedPillCardTextSelected]}>
                          {ep}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={normalize(15)} color="#ffffff" style={{ marginLeft: normalize(4) }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Card 4: Availability */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#f3e8ff" }]}>
                    <Ionicons name="calendar-outline" size={normalize(16)} color="#8b5cf6" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("availabilityTitle", "Availability")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("currentWorkStatus", "What is your current work status?")}
                </Text>

                <View style={styles.fullWidthGroup}>
                  <ModalPickerTrigger
                    onPress={() => setShowAvailDropdown(true)}
                    label={availability}
                    placeholder={t("selectAvailabilityStatus", "Select current status")}
                    isOpen={showAvailDropdown}
                    leftIcon="document-text-outline"
                    style={styles.fieldInputWrapper}
                  />
                  <ModalPicker
                    visible={showAvailDropdown}
                    onClose={() => setShowAvailDropdown(false)}
                    title={t("availabilityTitle", "Availability")}
                    options={availabilityOptions}
                    selectedValue={availability}
                    onSelect={(val) => setAvailability(val)}
                  />
                </View>
              </View>

              {/* Card 5: Professional Bio */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#eff6ff" }]}>
                    <Ionicons name="create-outline" size={normalize(16)} color="#3b82f6" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("professionalBioTitle", "Professional Bio")}
                    <Text style={styles.requiredStar}> *</Text>
                  </Text>
                </View>
                <Text style={styles.cardSubtextBelowHeader}>
                  {t("professionalBioSub", "Tell us about your role, expertise, key achievements and how you create value for your clients and partners.")}
                </Text>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => bioInputRef.current?.focus()}
                  style={[styles.fieldInputWrapper, { height: normalize(100), alignItems: "flex-start", paddingTop: normalize(8) }, activeInput === "bio" && styles.fieldInputActive]}
                >
                  <TextInput
                    ref={bioInputRef}
                    value={bio}
                    onChangeText={(text) => {
                      if (text.length <= 500) {
                        setBio(text);
                      }
                    }}
                    placeholder={t("bioPlaceholder", "Share your professional journey...")}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    style={[styles.fieldTextInput, { height: "100%", width: "100%", textAlignVertical: "top" }]}
                    maxLength={500}
                    onFocus={(e) => handleInputFocus(e, "bio")}
                    onBlur={() => setActiveInput(null)}
                  />
                </TouchableOpacity>
                <Text style={styles.charCountText}>
                  {bio.length} / 500 characters
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueGreenButton,
                  (regionalExperience.length === 0 || !locationPreference || employmentPreference.length === 0 || !bio.trim()) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>

              {/* Security Subtext */}
              <View style={styles.securityRow}>
                <Text style={styles.securityText}>
                  <Ionicons name="lock-closed-outline" size={normalize(12)} color="#64748b" />
                  {"  "}
                  {t("informationSecureSub", "Your information is secure and will never be shared without your consent.")}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 4: CALENDLY INTEGRATION */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              {/* Section Header Title */}
              <View style={styles.stepHeaderRow}>
                <View style={[styles.chefHatIconCircle, { backgroundColor: "#eff6ff" }]}>
                  <Ionicons name="calendar-outline" size={normalize(22)} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepHeaderTitle}>
                    {t("schedulingCalendlyTitle", "Scheduling with Calendly")}
                  </Text>
                  <Text style={styles.stepHeaderSubtitle}>
                    {t("schedulingCalendlySub", "Let employers book interviews or consultation slots based on your availability.")}
                  </Text>
                </View>
              </View>

              {/* Banner Card: Connect & Get Booked */}
              <View style={[styles.cardContainer, { backgroundColor: "#f5f3ff", borderColor: "#e0e7ff" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(8) }}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#ede9fe", width: normalize(32), height: normalize(32), borderRadius: normalize(16) }]}>
                    <Ionicons name="sparkles" size={normalize(16)} color="#8b5cf6" />
                  </View>
                  <Text style={[styles.cardHeaderTitle, { color: "#4c1d95", fontSize: normalize(14) }]}>
                    {t("connectGetBookedTitle", "Connect & Get Booked")}
                  </Text>
                </View>
                <Text style={[styles.cardSubtextBelowHeader, { color: "#6b21a8", marginTop: normalize(2), paddingLeft: normalize(18) }]}>
                  {t("connectGetBookedSub", "Connect your Calendly and share your availability with employers and businesses.")}
                </Text>
              </View>

              {/* Card 1: Calendly Integration */}
              <View style={styles.cardContainer}>
                <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={[styles.greenIconCircle, { backgroundColor: "#eff6ff" }]}>
                      <Ionicons name="calendar-outline" size={normalize(16)} color="#3b82f6" />
                    </View>
                    <View style={{ marginLeft: normalize(6) }}>
                      <Text style={styles.cardHeaderTitle}>
                        {t("calendlyIntegrationTitle", "Calendly Integration")}
                      </Text>
                      <Text style={[styles.cardSubtextBelowHeader, { marginTop: 0 }]}>
                        {t("syncYourAvailability", "Sync your availability")}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadgeCapsule,
                      (calendlyLink && calendlyLink.trim().replace(/^https?:\/\/(www\.)?calendly\.com\/?/i, "").trim() !== "")
                        ? styles.statusBadgeCapsuleSuccess
                        : styles.statusBadgeCapsulePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeCapsuleText,
                        (calendlyLink && calendlyLink.trim().replace(/^https?:\/\/(www\.)?calendly\.com\/?/i, "").trim() !== "")
                          ? styles.statusBadgeCapsuleTextSuccess
                          : styles.statusBadgeCapsuleTextPending,
                      ]}
                    >
                      {(calendlyLink && calendlyLink.trim().replace(/^https?:\/\/(www\.)?calendly\.com\/?/i, "").trim() !== "")
                        ? t("linked", "Linked")
                        : t("notLinked", "Not Linked")}
                    </Text>
                  </View>
                </View>

                <View style={styles.horizontalDivider} />

                {/* Input Field */}
                <View style={styles.fullWidthGroup}>
                  <Text style={styles.fieldLabel}>
                    {t("yourCalendlyLink", "Your Calendly Link")}
                  </Text>
                  <View style={[styles.fieldInputWrapper, activeInput === "calendly" && styles.fieldInputActive]}>
                    <Ionicons name="link-outline" size={normalize(16)} color="#64748b" style={styles.fieldIconLeft} />
                    <TextInput
                      value={calendlyLink || "https://calendly.com/"}
                      onChangeText={(val) => {
                        const cleanVal = val.replace(/\s+/g, "");
                        if (!cleanVal) {
                          setCalendlyLink("https://calendly.com/");
                          return;
                        }
                        if (!cleanVal.startsWith("https://calendly.com/")) {
                          if (cleanVal.startsWith("https://")) {
                            setCalendlyLink(cleanVal);
                          } else if (cleanVal.includes("calendly.com/")) {
                            setCalendlyLink("https://" + cleanVal.replace(/^https?:\/\//, ""));
                          } else {
                            setCalendlyLink("https://calendly.com/" + cleanVal.replace(/^\/+/, ""));
                          }
                        } else {
                          setCalendlyLink(cleanVal);
                        }
                      }}
                      placeholder="https://calendly.com/yourusername"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="none"
                      style={styles.fieldTextInput}
                      onFocus={(e) => handleInputFocus(e, "calendly")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                  <Text style={styles.fieldHelperText}>
                    {t("calendlySubtext", "Paste your Calendly scheduling link to enable direct booking for interviews or consultations.")}
                  </Text>
                </View>
              </View>

              {/* Don't have a Calendly Account Card */}
              <View style={styles.dontHaveAccountCard}>
                <View style={styles.dontHaveAccountTopRow}>
                  <View style={styles.dontHaveIconCircle}>
                    <Ionicons name="calendar-outline" size={normalize(22)} color="#4f46e5" />
                  </View>
                  <View style={styles.dontHaveTextCol}>
                    <Text style={styles.dontHaveTitle}>
                      {t("dontHaveCalendlyTitle", "Don't have a Calendly account yet?")}
                    </Text>
                    <Text style={styles.dontHaveSub}>
                      {t("dontHaveCalendlySub", "Create a free account on Calendly in just 2 minutes to get your scheduling link.")}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.signUpButton} onPress={() => Linking.openURL("https://calendly.com/signup")} activeOpacity={0.85}>
                  <Ionicons name="open-outline" size={normalize(16)} color="#4f46e5" style={{ marginRight: normalize(6) }} />
                  <Text style={styles.signUpButtonText}>{t("signUpFreeCalendly", "Sign Up Free on Calendly")}</Text>
                </TouchableOpacity>
              </View>

              {/* Card 2: Why connect? */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#f3e8ff" }]}>
                    <Ionicons name="bulb-outline" size={normalize(16)} color="#8b5cf6" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>
                    {t("whyConnectTitle", "Why connect?")}
                  </Text>
                </View>
                <Text style={[styles.cardSubtextBelowHeader, { marginTop: normalize(4), lineHeight: normalize(16) }]}>
                  {t("whyConnectSub", "Chefs with connected Calendly receive 4x more interview requests. It's the fastest way to land your next opportunity.")}
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueGreenButton}
                onPress={next}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>

              {/* Security Subtext */}
              <View style={styles.securityRow}>
                <Text style={styles.securityText}>
                  <Ionicons name="lock-closed-outline" size={normalize(12)} color="#64748b" />
                  {"  "}
                  {t("informationSecureSub", "Your information is secure and will never be shared without your consent.")}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 5: MEDIA & PORTFOLIO */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              {/* Card 1: Top Hero Box */}
              <View style={[styles.cardContainer, { alignItems: "center", paddingVertical: normalize(16) }]}>
                <View style={styles.shareHeroCircle}>
                  <Ionicons name="share-social-outline" size={normalize(24)} color="#0f172a" />
                </View>
                <Text style={[styles.stepHeaderTitle, { marginTop: normalize(10), textAlign: "center" }]}>
                  {t("showcaseYourWorkTitle", "Showcase Your Work")}
                </Text>
                <Text style={[styles.stepHeaderSubtitle, { textAlign: "center", paddingHorizontal: normalize(12), marginTop: normalize(4) }]}>
                  {t("showcaseYourWorkSub", "Showcase your creativity and culinary journey. Connect your social media accounts to stand out to top employers.")}
                </Text>

                {/* Inner Banner Box */}
                <View style={styles.innerBannerPurpleBox}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: normalize(8) }}>
                    <Ionicons name="sparkles" size={normalize(16)} color="#8b5cf6" style={{ marginTop: normalize(2) }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.innerBannerPurpleTitle}>
                        {t("weRecommendConnect", "We recommend you connect")}
                      </Text>
                      <Text style={styles.innerBannerPurpleSub}>
                        {t("weRecommendConnectSub", "Link your social media to highlight your culinary creations, videos and achievements.")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: Social Media Links List */}
              <View style={styles.cardContainer}>
                {/* LinkedIn */}
                <TouchableOpacity
                  style={styles.socialListItemRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("LinkedIn");
                    setTempLink(linkedinLink);
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialListItemLeft}>
                    <View style={[styles.socialSquareIconBox, { backgroundColor: "#0077b5" }]}>
                      <Ionicons name="logo-linkedin" size={normalize(18)} color="#ffffff" />
                    </View>
                    <View style={{ marginLeft: normalize(10) }}>
                      <Text style={styles.socialItemTitle}>{t("linkedin", "LinkedIn")}</Text>
                      <Text style={styles.socialItemSub}>{t("linkedinSub", "Work History & Certificates")}</Text>
                    </View>
                  </View>
                  <View style={styles.socialListItemRight}>
                    <View style={[styles.socialStatusPill, linkedinLink ? styles.socialStatusPillConnected : styles.socialStatusPillNotConnected]}>
                      <Text style={[styles.socialStatusPillText, linkedinLink ? styles.socialStatusPillTextConnected : styles.socialStatusPillTextNotConnected]}>
                        {linkedinLink ? t("connected", "Connected") : t("notConnected", "Not Connected")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={normalize(16)} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                <View style={styles.horizontalDividerLight} />

                {/* Instagram */}
                <TouchableOpacity
                  style={styles.socialListItemRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("Instagram");
                    setTempLink(instagramLink);
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialListItemLeft}>
                    <View style={[styles.socialSquareIconBox, { backgroundColor: "#e1306c" }]}>
                      <Ionicons name="logo-instagram" size={normalize(18)} color="#ffffff" />
                    </View>
                    <View style={{ marginLeft: normalize(10) }}>
                      <Text style={styles.socialItemTitle}>{t("instagram", "Instagram")}</Text>
                      <Text style={styles.socialItemSub}>{t("instagramSub", "Photos & Videos")}</Text>
                    </View>
                  </View>
                  <View style={styles.socialListItemRight}>
                    <View style={[styles.socialStatusPill, instagramLink ? styles.socialStatusPillConnected : styles.socialStatusPillNotConnected]}>
                      <Text style={[styles.socialStatusPillText, instagramLink ? styles.socialStatusPillTextConnected : styles.socialStatusPillTextNotConnected]}>
                        {instagramLink ? t("connected", "Connected") : t("notConnected", "Not Connected")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={normalize(16)} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                <View style={styles.horizontalDividerLight} />

                {/* Facebook */}
                <TouchableOpacity
                  style={styles.socialListItemRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("Facebook");
                    setTempLink(facebookLink);
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialListItemLeft}>
                    <View style={[styles.socialSquareIconBox, { backgroundColor: "#1877f2" }]}>
                      <Ionicons name="logo-facebook" size={normalize(18)} color="#ffffff" />
                    </View>
                    <View style={{ marginLeft: normalize(10) }}>
                      <Text style={styles.socialItemTitle}>{t("facebook", "Facebook")}</Text>
                      <Text style={styles.socialItemSub}>{t("facebookSub", "Community & Badges")}</Text>
                    </View>
                  </View>
                  <View style={styles.socialListItemRight}>
                    <View style={[styles.socialStatusPill, facebookLink ? styles.socialStatusPillConnected : styles.socialStatusPillNotConnected]}>
                      <Text style={[styles.socialStatusPillText, facebookLink ? styles.socialStatusPillTextConnected : styles.socialStatusPillTextNotConnected]}>
                        {facebookLink ? t("connected", "Connected") : t("notConnected", "Not Connected")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={normalize(16)} color="#94a3b8" />
                  </View>
                </TouchableOpacity>

                <View style={styles.horizontalDividerLight} />

                {/* Render Custom Links */}
                {customSocialLinks.map((item) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.socialListItemRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setEditingPlatform(item.platform);
                        setTempLink(item.link);
                        setCustomPlatformName(item.platform);
                        setSocialModalVisible(true);
                      }}
                    >
                      <View style={styles.socialListItemLeft}>
                        <View style={[styles.socialSquareIconBox, { backgroundColor: "#f1f5f9" }]}>
                          <Ionicons name="link-outline" size={normalize(18)} color="#002b5c" />
                        </View>
                        <View style={{ marginLeft: normalize(10) }}>
                          <Text style={styles.socialItemTitle}>{item.platform}</Text>
                          <Text style={styles.socialItemSub} numberOfLines={1}>{item.link}</Text>
                        </View>
                      </View>
                      <View style={styles.socialListItemRight}>
                        <View style={[styles.socialStatusPill, item.link ? styles.socialStatusPillConnected : styles.socialStatusPillNotConnected]}>
                          <Text style={[styles.socialStatusPillText, item.link ? styles.socialStatusPillTextConnected : styles.socialStatusPillTextNotConnected]}>
                            {item.link ? t("connected", "Connected") : t("notConnected", "Not Connected")}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={normalize(16)} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>
                    <View style={styles.horizontalDividerLight} />
                  </React.Fragment>
                ))}

                {/* Add More
                <TouchableOpacity
                  style={styles.socialListItemRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("Add More");
                    setCustomPlatformName("");
                    setTempLink("");
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialListItemLeft}>
                    <View style={[styles.socialSquareIconBox, { backgroundColor: "#f1f5f9" }]}>
                      <Ionicons name="add" size={normalize(20)} color="#0f172a" />
                    </View>
                    <View style={{ marginLeft: normalize(10) }}>
                      <Text style={styles.socialItemTitle}>{t("addMore", "Add More")}</Text>
                      <Text style={styles.socialItemSub}>{t("addMoreSub", "Website, Portfolio or other links")}</Text>
                    </View>
                  </View>
                  <View style={styles.socialListItemRight}>
                    <Ionicons name="chevron-forward" size={normalize(16)} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
                */}
              </View>

              {/* Next: Review & Submit Button */}
              <TouchableOpacity
                style={styles.continueGreenButton}
                onPress={next}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>{t("nextReviewSubmit", "Next: Review & Submit")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>

              {/* Security Subtext */}
              <View style={styles.securityRow}>
                <Text style={styles.securityText}>
                  <Ionicons name="lock-closed-outline" size={normalize(12)} color="#64748b" />
                  {"  "}
                  {t("informationSecureSub", "Your information is secure and will never be shared without your consent.")}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 6: FINAL REVIEW */}
          {step === 6 && (
            <View style={styles.stepContainer}>
              {/* Section Header Title */}
              <View style={styles.stepHeaderRow}>
                <View style={[styles.chefHatIconCircle, { backgroundColor: "#f3e8ff" }]}>
                  <Ionicons name="search-outline" size={normalize(22)} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepHeaderTitle}>
                    {t("finalReviewTitle", "Final Review")}
                  </Text>
                  <Text style={styles.stepHeaderSubtitle}>
                    {t("finalReviewSub", "Please review your information below. You can edit any section to make changes before submitting.")}
                  </Text>
                </View>
              </View>

              {/* Main Card: All User Review Data in ONE Single Card */}
              <View style={styles.cardContainer}>
                {/* Top Profile Header Section */}
                <View style={[styles.photoCardRow, { alignItems: "flex-start" }]}>
                  <TouchableOpacity
                    style={styles.photoAvatarWrapper}
                    onPress={() => setStep(1)}
                    activeOpacity={0.8}
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.photoAvatarImage} />
                    ) : (
                      <View style={styles.blankAvatarCircle} />
                    )}
                    <View style={styles.plusGreenBadge}>
                      <Ionicons name="pencil" size={normalize(11)} color="#ffffff" />
                    </View>
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginLeft: normalize(12) }}>
                    {Boolean(fullName) && <Text style={[styles.reviewNameText, { textAlign: "left" }]}>{fullName}</Text>}
                    {Boolean(professionalTitle) && <Text style={[styles.reviewTitleSubtext, { textAlign: "left" }]}>{professionalTitle}</Text>}

                    {employmentPreference.length > 0 && (
                      <View style={styles.statusPillSmall}>
                        <Text style={styles.statusPillSmallText}>{employmentPreference.join(", ")}</Text>
                      </View>
                    )}

                    <View style={{ marginTop: normalize(6) }}>
                      {(Boolean(currentCity) || Boolean(country)) && (
                        <View style={{ paddingVertical: normalize(3) }}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                            <Ionicons name="location-outline" size={normalize(13)} color="#64748b" style={{ marginRight: normalize(5), marginTop: normalize(2) }} />
                            <Text style={{ flex: 1 }}>
                              <Text style={styles.reviewMetaLabel}>Current Location: </Text>
                              <Text style={styles.reviewMetaVal}>{currentCity && country ? `${currentCity}, ${country}` : currentCity || country}</Text>
                            </Text>
                          </View>
                          <View style={styles.horizontalDividerLight} />
                        </View>
                      )}
                      {Boolean(locationPreference) && (
                        <View style={{ paddingVertical: normalize(3) }}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                            <Ionicons name="briefcase-outline" size={normalize(13)} color="#64748b" style={{ marginRight: normalize(5), marginTop: normalize(2) }} />
                            <Text style={{ flex: 1 }}>
                              <Text style={styles.reviewMetaLabel}>Preferred Job Location: </Text>
                              <Text style={styles.reviewMetaVal}>{locationPreference}</Text>
                            </Text>
                          </View>
                          <View style={styles.horizontalDividerLight} />
                        </View>
                      )}
                      {Boolean(experienceYears) && (
                        <View style={{ paddingVertical: normalize(3) }}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                            <Ionicons name="calendar-outline" size={normalize(13)} color="#64748b" style={{ marginRight: normalize(5), marginTop: normalize(2) }} />
                            <Text style={{ flex: 1 }}>
                              <Text style={styles.reviewMetaLabel}>Experience: </Text>
                              <Text style={styles.reviewMetaVal}>{experienceYears}</Text>
                            </Text>
                          </View>
                          <View style={styles.horizontalDividerLight} />
                        </View>
                      )}
                      {regionalExperience.length > 0 && (
                        <View style={{ paddingVertical: normalize(3) }}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                            <Ionicons name="globe-outline" size={normalize(13)} color="#64748b" style={{ marginRight: normalize(5), marginTop: normalize(2) }} />
                            <Text style={{ flex: 1 }}>
                              <Text style={styles.reviewMetaLabel}>Regional Experience: </Text>
                              <Text style={styles.reviewMetaVal}>{regionalExperience.join(", ")}</Text>
                            </Text>
                          </View>
                          <View style={styles.horizontalDividerLight} />
                        </View>
                      )}
                      {Boolean(availability) && (
                        <View style={{ paddingVertical: normalize(3) }}>
                          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                            <Ionicons name="time-outline" size={normalize(13)} color="#64748b" style={{ marginRight: normalize(5), marginTop: normalize(2) }} />
                            <Text style={{ flex: 1 }}>
                              <Text style={styles.reviewMetaLabel}>Availability: </Text>
                              <Text style={styles.reviewMetaVal}>{availability}</Text>
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Horizontal Line below Top Profile Block */}
                <View style={styles.horizontalDivider} />

                {/* Section Details Rows inside the SAME Card */}
                {/* 1. Professional Bio */}
                {Boolean(bio) && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="document-text-outline" size={normalize(15)} color="#3b82f6" style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("professionalBioTitle", "Professional Bio")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(3)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.cardSubtextBelowHeader, { marginTop: normalize(2), marginLeft: 0, textAlign: "left" }]} numberOfLines={2}>
                        {bio}
                      </Text>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 2. Cuisine Specialization */}
                {selectedCuisines.length > 0 && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="restaurant-outline" size={normalize(15)} color="#f59e0b" style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("cuisineSpecializationTitle", "Cuisine Specialization")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(2)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ marginTop: normalize(4) }}>
                        {selectedCuisines.map((c, idx) => (
                          <View key={c} style={{ paddingVertical: normalize(3) }}>
                            <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                              • {c}
                            </Text>
                            {idx < selectedCuisines.length - 1 && <View style={styles.horizontalDividerLight} />}
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 3. Operational Expertise */}
                {selectedOperations.length > 0 && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="stats-chart-outline" size={normalize(15)} color={PRIMARY_GREEN} style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("operationalExpertiseTitle", "Operational Expertise")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(2)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ marginTop: normalize(4) }}>
                        {selectedOperations.map((op, idx) => (
                          <View key={op} style={{ paddingVertical: normalize(3) }}>
                            <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                              • {op}
                            </Text>
                            {idx < selectedOperations.length - 1 && <View style={styles.horizontalDividerLight} />}
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 4. Years of Experience */}
                {Boolean(experienceYears) && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="briefcase-outline" size={normalize(15)} color="#8b5cf6" style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("yearsOfExperienceTitle", "Years of Experience")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(2)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.cardSubtextBelowHeader, { marginTop: normalize(2), marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                        {experienceYears}
                      </Text>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 5. Regional Experience */}
                {regionalExperience.length > 0 && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="globe-outline" size={normalize(15)} color="#3b82f6" style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("regionalExperienceTitle", "Regional Experience")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(3)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ marginTop: normalize(4) }}>
                        {regionalExperience.map((reg, idx) => (
                          <View key={reg} style={{ paddingVertical: normalize(3) }}>
                            <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                              • {reg}
                            </Text>
                            {idx < regionalExperience.length - 1 && <View style={styles.horizontalDividerLight} />}
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 6. Job Location Preference */}
                {Boolean(locationPreference) && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="location-outline" size={normalize(15)} color="#f43f5e" style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("jobLocationPrefTitle", "Job Location Preference")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(3)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.cardSubtextBelowHeader, { marginTop: normalize(2), marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                        {locationPreference}
                      </Text>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 7. Employment Preference */}
                {employmentPreference.length > 0 && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="briefcase-outline" size={normalize(15)} color="#f59e0b" style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("employmentPrefTitle", "Employment Preference")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(3)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ marginTop: normalize(4) }}>
                        {employmentPreference.map((emp, idx) => (
                          <View key={emp} style={{ paddingVertical: normalize(3) }}>
                            <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                              • {emp}
                            </Text>
                            {idx < employmentPreference.length - 1 && <View style={styles.horizontalDividerLight} />}
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 8. Availability */}
                {Boolean(availability) && (
                  <>
                    <View style={{ paddingVertical: normalize(4) }}>
                      <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="calendar-outline" size={normalize(15)} color="#8b5cf6" style={{ marginRight: normalize(6) }} />
                          <Text style={styles.cardHeaderTitle}>{t("availabilityTitle", "Availability")}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setStep(3)} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                          <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.cardSubtextBelowHeader, { marginTop: normalize(2), marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                        {availability}
                      </Text>
                    </View>
                    <View style={styles.horizontalDividerLight} />
                  </>
                )}

                {/* 9. Scheduling (Calendly) */}
                <View style={{ paddingVertical: normalize(4) }}>
                  <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="calendar-outline" size={normalize(15)} color="#3b82f6" style={{ marginRight: normalize(6) }} />
                      <Text style={styles.cardHeaderTitle}>Scheduling (Calendly)</Text>
                    </View>
                    <TouchableOpacity onPress={() => setStep(4)} style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                      <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.cardSubtextBelowHeader, { marginTop: normalize(2), marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                    {calendlyLink ? "Connected" : "Not Linked"}
                  </Text>
                </View>

                {/* 10. Media & Social Links */}
                <View style={styles.horizontalDividerLight} />
                <View style={{ paddingVertical: normalize(4) }}>
                  <View style={[styles.cardHeaderRow, { justifyContent: "space-between" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="share-social-outline" size={normalize(15)} color="#0f172a" style={{ marginRight: normalize(6) }} />
                      <Text style={styles.cardHeaderTitle}>Media & Social Links</Text>
                    </View>
                    <TouchableOpacity onPress={() => setStep(5)} style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="pencil-outline" size={normalize(13)} color="#3b82f6" />
                      <Text style={{ fontSize: normalize(11.5), color: "#3b82f6", fontWeight: "600", marginLeft: normalize(2) }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: normalize(6) }}>
                    {linkedinLink ? (
                      <View style={{ paddingVertical: normalize(3) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(6) }}>
                          <Ionicons name="logo-linkedin" size={normalize(15)} color="#0077b5" />
                          <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>{linkedinLink}</Text>
                        </View>
                        <View style={styles.horizontalDividerLight} />
                      </View>
                    ) : null}
                    {instagramLink ? (
                      <View style={{ paddingVertical: normalize(3) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(6) }}>
                          <Ionicons name="logo-instagram" size={normalize(15)} color="#e1306c" />
                          <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>{instagramLink}</Text>
                        </View>
                        <View style={styles.horizontalDividerLight} />
                      </View>
                    ) : null}
                    {facebookLink ? (
                      <View style={{ paddingVertical: normalize(3) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(6) }}>
                          <Ionicons name="logo-facebook" size={normalize(15)} color="#1877f2" />
                          <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>{facebookLink}</Text>
                        </View>
                        <View style={styles.horizontalDividerLight} />
                      </View>
                    ) : null}
                    {customSocialLinks.length > 0
                      ? customSocialLinks.map((linkObj, idx) => {
                          const displayStr = typeof linkObj === "string" ? linkObj : `${linkObj.platform || "Link"}: ${linkObj.link || ""}`;
                          return (
                            <View key={linkObj.id || `custom-${idx}`} style={{ paddingVertical: normalize(3) }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: normalize(6) }}>
                                <Ionicons name="link-outline" size={normalize(15)} color="#64748b" />
                                <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left", color: "#1e293b", fontWeight: "500" }]}>
                                  {displayStr}
                                </Text>
                              </View>
                              {idx < customSocialLinks.length - 1 && <View style={styles.horizontalDividerLight} />}
                            </View>
                          );
                        })
                      : null}
                    {!linkedinLink && !instagramLink && !facebookLink && customSocialLinks.length === 0 && (
                      <Text style={[styles.cardSubtextBelowHeader, { marginLeft: 0, textAlign: "left" }]}>No social links connected</Text>
                    )}
                  </View>
                </View>
                <View style={styles.horizontalDividerLight} />
              </View>

              {/* Privacy Banner Card */}
              <View style={[styles.cardContainer, { backgroundColor: "#f5f3ff", borderColor: "#e0e7ff" }]}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: normalize(8) }}>
                  <Ionicons name="shield-checkmark-outline" size={normalize(18)} color="#4f46e5" style={{ marginTop: normalize(2) }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardHeaderTitle, { color: "#3730a3" }]}>
                      {t("privacyPriorityTitle", "Your privacy is our priority")}
                    </Text>
                    <Text style={[styles.cardSubtextBelowHeader, { color: "#4338ca", marginTop: normalize(2), marginLeft: 0, marginBottom: 0, textAlign: "left" }]}>
                      {t("privacyPrioritySub", "Your information will only be shared with verified employers and businesses on JobRito.")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.continueGreenButton, submitting && styles.continueButtonDisabled]}
                onPress={handleCompleteProfile}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.continueButtonText}>{t("submitProfile", "Submit Profile")}</Text>
                    <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
                  </>
                )}
              </TouchableOpacity>

              {/* Security Subtext */}
              <View style={styles.securityRow}>
                <Text style={styles.securityText}>
                  <Ionicons name="lock-closed-outline" size={normalize(12)} color="#64748b" />
                  {"  "}
                  {t("agreeTermsPolicySub", "By submitting, you agree to our Terms & Conditions and Privacy Policy.")}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 7: CONGRATULATIONS (SUCCESS SCREEN) */}
          {step === 7 && (
            <View style={[styles.stepContainer, { alignItems: "center", paddingTop: normalize(20) }]}>
              {/* Top Banner Image replacing checkmark icon */}
              <Image
                source={require("../../assets/talentprofile.png")}
                style={{
                  width: SCREEN_WIDTH,
                  height: normalize(200),
                  marginTop: -16,
                  marginBottom: normalize(12),
                  alignSelf: "center",
                }}
                resizeMode="cover"
              />

              {/* Heading & Subheading */}
              <Text style={styles.successTitleLarge}>
                {t("congratulations", "Congratulations!")}
              </Text>
              <Text style={styles.successSubtitleText}>
                {t("congratulationsSub", "Your Chef Connect profile has been submitted successfully.")}
              </Text>

              {/* Status Pending Approval Pill */}
              <View style={styles.statusPendingPill}>
                <Ionicons name="time-outline" size={normalize(14)} color="#047857" style={{ marginRight: normalize(4) }} />
                <Text style={styles.statusPendingPillText}>
                  {t("statusPendingApproval", "Status: Pending Approval")}
                </Text>
              </View>

              {/* What Happens Next Card */}
              <View style={[styles.cardContainer, { width: "100%", marginTop: normalize(16) }]}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: normalize(10) }}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#f3e8ff" }]}>
                    <Ionicons name="people-outline" size={normalize(18)} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>
                      {t("whatHappensNextTitle", "What happens next?")}
                    </Text>
                    <Text style={[styles.cardSubtextBelowHeader, { marginTop: normalize(4), marginLeft: 0 }]}>
                      {t("nextStep1", "Jobrito team will review your submission and set it to publish.")}
                    </Text>
                  </View>
                </View>

                <View style={styles.horizontalDividerLight} />

                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: normalize(10) }}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#f3e8ff" }]}>
                    <Ionicons name="call-outline" size={normalize(16)} color="#8b5cf6" />
                  </View>
                  <Text style={[styles.cardSubtextBelowHeader, { flex: 1, marginTop: normalize(2), marginLeft: 0 }]}>
                    {t("nextStep2", "If we need any further clarifications, we will contact you on your registered mobile number.")}
                  </Text>
                </View>

                <View style={styles.horizontalDividerLight} />

                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: normalize(10) }}>
                  <View style={[styles.greenIconCircle, { backgroundColor: "#f3e8ff" }]}>
                    <Ionicons name="megaphone-outline" size={normalize(16)} color="#8b5cf6" />
                  </View>
                  <Text style={[styles.cardSubtextBelowHeader, { flex: 1, marginTop: normalize(2), marginLeft: 0 }]}>
                    {t("nextStep3", "Once approved, your profile will be visible to employers and businesses across the Jobrito network.")}
                  </Text>
                </View>
              </View>

              {/* Return to Feed Button */}
              <TouchableOpacity
                style={[styles.continueGreenButton, { width: "100%", marginTop: normalize(14) }]}
                onPress={() => handleFinishOnboarding("Home")}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>
                  {t("returnToCommunityFeed", "Return to Community Feed")}
                </Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={socialModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSocialModalVisible(false)}
      >
        <View style={styles.socialModalOverlay}>
          <View style={styles.socialModalCard}>
            <Text style={styles.socialModalTitle}>
              {editingPlatform === "Add More"
                ? t("addCustomLink", "Add Custom Link")
                : t("connectPlatform", `Connect ${editingPlatform}`, { platform: editingPlatform })}
            </Text>
            
            {editingPlatform === "Add More" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("platformName", "Platform Name")}</Text>
                <View style={[styles.inputWrapper, { minHeight: 46 }]}>
                  <Ionicons name="pricetag-outline" size={18} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={customPlatformName}
                    onChangeText={setCustomPlatformName}
                    placeholder={t("platformNamePlaceholder", "e.g. Behance, GitHub, Pinterest")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            <View style={[styles.inputGroup, editingPlatform === "Add More" && { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>
                {editingPlatform === "Add More"
                  ? t("linkHandle", "Link / Handle")
                  : t("platformLinkHandle", `${editingPlatform} Link/Handle`, { platform: editingPlatform })}
              </Text>
              <View style={[styles.inputWrapper, { minHeight: 46 }]}>
                <Ionicons name="link-outline" size={18} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                <TextInput
                  value={tempLink}
                  onChangeText={setTempLink}
                  placeholder={editingPlatform === "Add More" ? t("urlPlaceholder", "https://...") : t("enterPlatformUrl", `Enter your ${editingPlatform} URL`, { platform: editingPlatform })}
                  placeholderTextColor="rgba(10, 5, 4, 0.4)"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.socialModalActions}>
              <TouchableOpacity
                style={[styles.socialModalButton, styles.socialModalCancel]}
                onPress={() => setSocialModalVisible(false)}
              >
                <Text style={styles.socialModalCancelText}>{t("cancel", "Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialModalButton, styles.socialModalSave]}
                onPress={() => {
                  const val = tempLink.trim();
                  if (editingPlatform === "Add More") {
                    const plat = customPlatformName.trim();
                    if (!plat || !val) {
                      Alert.alert(t("error", "Error"), t("fillBothPlatformAndLink", "Please fill in both platform name and link."));
                      return;
                    }
                    const newLink = {
                      id: Date.now().toString(),
                      platform: plat,
                      link: val
                    };
                    setCustomSocialLinks(prev => [...prev, newLink]);
                    if (plat.toLowerCase() === "twitter") {
                      setTwitterLink(val);
                      setMoreConnected(true);
                    }
                    setCustomPlatformName("");
                    setTempLink("");
                  } else {
                    const isCustom = customSocialLinks.some(item => item.platform === editingPlatform);
                    if (isCustom) {
                      setCustomSocialLinks(prev => prev.map(item => {
                        if (item.platform === editingPlatform) {
                          return { ...item, link: val };
                        }
                        return item;
                      }));
                      if (editingPlatform.toLowerCase() === "twitter") {
                        setTwitterLink(val);
                        setMoreConnected(!!val);
                      }
                    } else {
                      if (editingPlatform === "LinkedIn") {
                        setLinkedinLink(val);
                        setLinkedinConnected(!!val);
                      } else if (editingPlatform === "Instagram") {
                        setInstagramLink(val);
                        setInstagramConnected(!!val);
                      } else if (editingPlatform === "Facebook") {
                        setFacebookLink(val);
                        setFacebookConnected(!!val);
                      }
                    }
                  }
                  setSocialModalVisible(false);
                }}
              >
                <Text style={styles.socialModalSaveText}>{t("save", "Save")}</Text>
              </TouchableOpacity>
            </View>
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
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0504",
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  progressPct: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 99,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  photoSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderStyle: "dashed",
    position: "relative",
    overflow: "visible",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
    backgroundColor: "#e2e8f3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: 55,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlayText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
  plusIcon: {
    position: "absolute",
    bottom: 0,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "850",
    color: "#0a0504",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a0504",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    position: "relative",
  },
  inputWrapperActive: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    color: "#0a0504",
    fontSize: 15,
    paddingVertical: 8,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  inputSubtext: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 6,
    paddingLeft: 4,
  },
  inlineRow: {
    flexDirection: "row",
  },
  tagWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    padding: 10,
    minHeight: 50,
    alignItems: "center",
  },
  languageTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  languageTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
    marginRight: 4,
  },
  languageTagClose: {
    padding: 1,
  },
  addLangButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addLangButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  addLangWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    borderRadius: 8,
    paddingLeft: 8,
    height: 32,
    maxWidth: 120,
  },
  addLangInput: {
    flex: 1,
    fontSize: 12,
    color: "#0a0504",
    paddingVertical: 2,
  },
  addLangSubmit: {
    paddingHorizontal: 6,
    justifyContent: "center",
    height: "100%",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
    minHeight: 52,
    borderRadius: 12,
    gap: 8,
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 20,
  },
  continueButtonDisabled: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  bannerContainer: {
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    marginBottom: 20,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
    padding: 16,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0a0504",
  },
  sectionSubtitleText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
    marginBottom: 12,
    paddingLeft: 28,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingLeft: 28,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
  },
  pillSelected: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  pillTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  dropdownContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  dropdownItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
  },
  multilineWrapper: {
    alignItems: "flex-start",
    paddingVertical: 10,
    marginBottom: 20,
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  reviewMainTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 6,
  },
  reviewMainSubtitle: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f2f2f3",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  reviewProfileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#153e69",
    overflow: "hidden",
    marginRight: 14,
    backgroundColor: "#e2e8f3",
  },
  reviewAvatarImage: {
    width: "100%",
    height: "100%",
  },
  reviewTitleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#153e69",
    marginBottom: 4,
  },
  reviewDetailsList: {
    marginTop: 4,
    gap: 2,
  },
  detailRowText: {
    fontSize: 11,
    lineHeight: 16,
  },
  detailLabel: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
  },
  detailValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0a0504",
  },
  reviewAvatarPlaceholder: {
    backgroundColor: "#e2e8f3",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInfo: {
    flex: 1,
    justifyContent: "center",
  },
  reviewName: {
    fontSize: 18,
    fontWeight: "750",
    color: "#0a0504",
    marginBottom: 2,
  },
  reviewEmail: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 4,
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#153e69",
    marginLeft: 4,
  },
  reviewGridRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewGridCol: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f2f2f3",
  },
  reviewGridLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewGridLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
    letterSpacing: 0.5,
  },
  reviewGridValue: {
    fontSize: 14,
    fontWeight: "750",
    color: "#0a0504",
  },
  reviewSecTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewSecTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a0504",
    marginLeft: 8,
  },
  reviewSecBioText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
  },
  reviewPillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reviewPill: {
    backgroundColor: "#f2f2f3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  reviewPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  reviewBulletContainer: {
    gap: 6,
  },
  reviewBulletRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#153e69",
    marginRight: 10,
  },
  reviewBulletText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
  },
  editInfoBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  editInfoBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#153e69",
  },
  successIconBox: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  nextStepsCard: {
    backgroundColor: "#f2f2f3",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    width: "100%",
    marginBottom: 28,
  },
  nextStepsTitle: {
    fontSize: 15,
    fontWeight: "750",
    color: "#0a0504",
    marginBottom: 6,
  },
  nextStepsText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
  },
  viewDraftBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  viewDraftBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153e69",
  },
  // --- New Styles ---
  syncIllustrationCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  syncLogosRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  syncLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  illustrationTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 8,
    textAlign: "center",
  },
  illustrationSubtitle: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "750",
    color: "#0a0504",
  },
  cardSectionSubtitle: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
  },
  connectBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  connectBadgePending: {
    backgroundColor: "#f2f2f3",
  },
  connectBadgeSuccess: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  connectBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  connectButton: {
    backgroundColor: "#153e69",
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  connectButtonDisabled: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  whyConnectCard: {
    flexDirection: "row",
    backgroundColor: "#f2f2f3",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginTop: 20,
  },
  whyConnectTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a0504",
    marginBottom: 4,
  },
  whyConnectText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 16,
  },
  shareIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  socialListCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    overflow: "hidden",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  socialRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  socialIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  socialPlatformTitle: {
    fontSize: 14,
    fontWeight: "750",
    color: "#0a0504",
  },
  socialPlatformSubtitle: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
  },
  socialRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  socialStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  socialStatusBadgeConnect: {
    backgroundColor: "#f2f2f3",
  },
  socialStatusBadgeConnected: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  socialStatusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  socialRowDivider: {
    height: 1,
    backgroundColor: "#f2f2f3",
    marginHorizontal: 16,
  },
  finishSetupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#153e69",
    minHeight: 52,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  socialModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  socialModalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  socialModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    textAlign: "center",
    marginBottom: 4,
  },
  socialModalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  socialModalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  socialModalCancel: {
    backgroundColor: "#f2f2f3",
  },
  socialModalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  socialModalSave: {
    backgroundColor: "#153e69",
  },
  socialModalSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  helperActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  helperActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f3",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  helperActionText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  calendlyPromptRow: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calendlyPromptText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    fontWeight: "500",
  },
  calendlyLinkText: {
    color: "#153e69",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  reviewLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  reviewLocationText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  charCountText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.4)",
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 4,
  },

  // Stepper Progress Bar
  stepperContainer: {
    paddingHorizontal: normalize(12),
    paddingTop: normalize(10),
    paddingBottom: normalize(12),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperItem: {
    alignItems: "center",
    width: normalize(52),
  },
  stepperCircle: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(13),
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(4),
  },
  stepperCircleActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  stepperCircleCompleted: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  stepperCircleText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#64748b",
  },
  stepperCircleTextActive: {
    color: "#ffffff",
  },
  stepperCircleTextCompleted: {
    color: "#ffffff",
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e2e8f0",
    marginTop: normalize(-16),
  },
  stepperLineCompleted: {
    backgroundColor: PRIMARY_GREEN,
  },
  stepperLabel: {
    fontSize: normalize(8.5),
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    height: normalize(24),
  },
  stepperLabelActive: {
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  stepperSubtitle: {
    fontSize: normalize(11.5),
    fontWeight: "400",
    color: "#64748b",
    textAlign: "center",
    marginTop: normalize(8),
  },

  // Card Styling
  cardContainer: {
    backgroundColor: "#f4f6f9",
    borderRadius: normalize(10),
    padding: normalize(12),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: normalize(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  photoCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photoTextCol: {
    flex: 1,
    marginRight: normalize(12),
  },
  cardTitleText: {
    fontSize: normalize(15),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(4),
  },
  cardSubtitleText: {
    fontSize: normalize(11.5),
    fontWeight: "400",
    color: "#64748b",
    lineHeight: normalize(16),
  },
  avatarDashedCircle: {
    position: "relative",
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImageCircle: {
    width: normalize(76),
    height: normalize(76),
    borderRadius: normalize(38),
  },
  avatarPlaceholderCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: {
    fontSize: normalize(10),
    fontWeight: "700",
    color: "#0f172a",
    marginTop: normalize(2),
  },
  plusGreenBadge: {
    position: "absolute",
    bottom: normalize(2),
    right: normalize(2),
    width: normalize(22),
    height: normalize(22),
    borderRadius: normalize(11),
    backgroundColor: PRIMARY_GREEN,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },

  // Card Headers
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(2),
  },
  greenIconCircle: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(8),
  },
  cardHeaderTitle: {
    fontSize: normalize(14.5),
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubtextBelowHeader: {
    fontSize: normalize(11),
    color: "#64748b",
    marginBottom: normalize(10),
    marginLeft: normalize(36),
  },

  // Form Fields
  twoColRow: {
    flexDirection: "row",
    gap: normalize(10),
    marginTop: normalize(6),
  },
  halfCol: {
    flex: 1,
  },
  fullWidthGroup: {
    marginTop: normalize(10),
  },
  fieldLabel: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: normalize(4),
  },
  fieldInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: normalize(42),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(10),
  },
  fieldInputActive: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 1.5,
  },
  fieldIconLeft: {
    marginRight: normalize(6),
  },
  fieldTextInput: {
    flex: 1,
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#0f172a",
    paddingVertical: 0,
  },
  fieldHelperText: {
    fontSize: normalize(10),
    fontWeight: "400",
    color: "#94a3b8",
    marginTop: normalize(4),
  },

  // Languages Spoken Cards (Horizontal Row)
  langPillsRow: {
    flexDirection: "row",
    gap: normalize(8),
    marginTop: normalize(8),
  },
  langCardItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: normalize(40),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(8),
  },
  langCardItemSelected: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  langCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(4),
  },
  langNativeBadgeText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#64748b",
  },
  langCardLabelText: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#334155",
  },
  langCardLabelSelected: {
    color: PRIMARY_GREEN,
    fontWeight: "700",
  },
  addLanguageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: normalize(40),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: PRIMARY_GREEN,
    marginTop: normalize(10),
    gap: normalize(4),
  },
  addLanguageBtnText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },

  // Continue Button & Security
  continueGreenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: normalize(50),
    borderRadius: normalize(12),
    backgroundColor: PRIMARY_GREEN,
    marginTop: normalize(8),
    marginBottom: normalize(8),
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize(4),
    marginBottom: normalize(16),
    paddingHorizontal: normalize(20),
  },
  securityText: {
    fontSize: normalize(10.5),
    color: "#64748b",
    fontWeight: "400",
    textAlign: "center",
    lineHeight: normalize(15),
  },
  requiredStar: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: normalize(13),
  },

  // Step Header
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(12),
    gap: normalize(10),
  },
  chefHatIconCircle: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(12),
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  stepHeaderTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  stepHeaderSubtitle: {
    fontSize: normalize(11.5),
    color: "#64748b",
    marginTop: normalize(2),
  },
  skillsBadgeSubtext: {
    fontSize: normalize(10.5),
    color: "#64748b",
    fontWeight: "500",
  },

  // Skills Grid (3 Columns)
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(8),
    marginTop: normalize(10),
  },
  skillGridCardItem: {
    width: "31%",
    height: normalize(56),
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: normalize(8),
    justifyContent: "space-between",
  },
  skillGridCardSelected: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  skillGridCardText: {
    fontSize: normalize(10.5),
    fontWeight: "600",
    color: "#334155",
    lineHeight: normalize(13),
  },
  skillGridCardTextSelected: {
    color: PRIMARY_GREEN,
    fontWeight: "700",
  },

  // Step 3 Rounded Pill Cards
  pillsRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(8),
    marginTop: normalize(8),
  },
  roundedPillCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  roundedPillCardSelected: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  roundedPillCardText: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#334155",
  },
  roundedPillCardTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // Step 4 Calendly Styles
  statusBadgeCapsule: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(14),
  },
  statusBadgeCapsuleSuccess: {
    backgroundColor: "#ecfdf5",
  },
  statusBadgeCapsulePending: {
    backgroundColor: "#fff7ed",
  },
  statusBadgeCapsuleText: {
    fontSize: normalize(11),
    fontWeight: "700",
  },
  statusBadgeCapsuleTextSuccess: {
    color: "#047857",
  },
  statusBadgeCapsuleTextPending: {
    color: "#ea580c",
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: normalize(12),
  },
  accountPromptCard: {
    backgroundColor: "#f5f3ff",
    borderRadius: normalize(10),
    padding: normalize(12),
    alignItems: "center",
    marginTop: normalize(12),
  },
  accountPromptTitle: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#4c1d95",
  },
  accountPromptLinkText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#6366f1",
    textDecorationLine: "underline",
  },
  accountPromptTextSmall: {
    fontSize: normalize(12),
    color: "#6b21a8",
  },

  // Don't Have Account Card Styles
  dontHaveAccountCard: {
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#e0e7ff",
    borderRadius: normalize(18),
    padding: normalize(16),
    marginTop: normalize(14),
  },
  dontHaveAccountTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: normalize(14),
  },
  dontHaveIconCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(14),
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(14),
  },
  dontHaveTextCol: {
    flex: 1,
  },
  dontHaveTitle: {
    fontSize: normalize(14.5),
    fontWeight: "800",
    color: "#1e1b4b",
    marginBottom: normalize(4),
  },
  dontHaveSub: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#475569",
    lineHeight: normalize(17),
  },
  signUpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#c7d2fe",
    borderRadius: normalize(12),
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
  },
  signUpButtonText: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#4f46e5",
  },

  // Step 5 Media & Portfolio Styles
  shareHeroCircle: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  innerBannerPurpleBox: {
    backgroundColor: "#f5f3ff",
    borderRadius: normalize(10),
    padding: normalize(12),
    width: "100%",
    marginTop: normalize(14),
  },
  innerBannerPurpleTitle: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#4c1d95",
  },
  innerBannerPurpleSub: {
    fontSize: normalize(11),
    color: "#6b21a8",
    marginTop: normalize(2),
  },
  socialListItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(8),
  },
  socialListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  socialSquareIconBox: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  socialItemTitle: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#0f172a",
  },
  socialItemSub: {
    fontSize: normalize(11),
    color: "#64748b",
    marginTop: normalize(1),
  },
  socialListItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(6),
  },
  socialStatusPill: {
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(14),
  },
  socialStatusPillNotConnected: {
    backgroundColor: "#f1f5f9",
  },
  socialStatusPillConnected: {
    backgroundColor: "#ecfdf5",
  },
  socialStatusPillText: {
    fontSize: normalize(11),
    fontWeight: "600",
  },
  socialStatusPillTextNotConnected: {
    color: "#64748b",
  },
  socialStatusPillTextConnected: {
    color: "#047857",
  },
  horizontalDividerLight: {
    height: 1,
    backgroundColor: "#cbd5e1",
    marginVertical: normalize(4),
  },

  // Step 6 & Step 7 Review & Success Styles
  photoAvatarWrapper: {
    width: normalize(70),
    height: normalize(70),
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  blankAvatarCircle: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(35),
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  photoAvatarImage: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(35),
  },
  reviewNameText: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: "#0f172a",
  },
  reviewTitleSubtext: {
    fontSize: normalize(12),
    color: "#64748b",
    marginTop: normalize(1),
  },
  statusPillSmall: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(12),
    alignSelf: "flex-start",
    marginTop: normalize(4),
  },
  statusPillSmallText: {
    fontSize: normalize(10.5),
    fontWeight: "700",
    color: "#0284c7",
  },
  reviewMetaLabel: {
    fontSize: normalize(11.5),
    color: "#64748b",
  },
  reviewMetaVal: {
    fontSize: normalize(11.5),
    fontWeight: "600",
    color: "#0f172a",
  },
  successDarkCircle: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitleLarge: {
    fontSize: normalize(22),
    fontWeight: "800",
    color: "#0f172a",
    marginTop: normalize(12),
  },
  successSubtitleText: {
    fontSize: normalize(13),
    color: "#64748b",
    textAlign: "center",
    marginTop: normalize(4),
    paddingHorizontal: normalize(16),
  },
  statusPendingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(16),
    marginTop: normalize(10),
  },
  statusPendingPillText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#047857",
  },
});
