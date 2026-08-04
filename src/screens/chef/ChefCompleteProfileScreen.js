import React, { useState, useEffect } from "react";
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
const PRIMARY_GREEN = "#153e69";

const countriesList = [
  "India",
  "Saudi Arabia",
  "UAE",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
  "United Kingdom",
  "United States",
  "Other"
];

const citiesByCountry = {
  "India": ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Kochi", "Goa", "Other"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Other"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Other"],
  "Qatar": ["Doha", "Al Wakrah", "Al Rayyan", "Other"],
  "Oman": ["Muscat", "Salalah", "Sohar", "Other"],
  "Kuwait": ["Kuwait City", "Hawally", "Salmiya", "Other"],
  "Bahrain": ["Manama", "Riffa", "Muharraq", "Other"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco", "Miami", "Other"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Edinburgh", "Glasgow", "Other"],
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

export default function ChefCompleteProfileScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // --- Step 1 State ---
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [fullName, setFullName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [country, setCountry] = useState("");
  const [languages, setLanguages] = useState([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [showLangInput, setShowLangInput] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  // Country & City Dropdown States
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

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
      if (Array.isArray(profile.operations)) {
        loadedOps = profile.operations;
      } else if (Array.isArray(profile.skills)) {
        loadedOps = profile.skills;
      } else if (typeof profile.operations === "string") {
        loadedOps = profile.operations.split(",").map(x => x.trim()).filter(Boolean);
      } else if (typeof profile.skills === "string") {
        loadedOps = profile.skills.split(",").map(x => x.trim()).filter(Boolean);
      }

      const matchedOps = [];
      let otherOps = [];
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
      if (profile.availability_info && typeof profile.availability_info === "object" && !Array.isArray(profile.availability_info) && Array.isArray(profile.availability_info.regional_experience)) {
        loadedReg = profile.availability_info.regional_experience;
      } else if (Array.isArray(profile.regionalExperience)) {
        loadedReg = profile.regionalExperience;
      } else if (Array.isArray(profile.regional_experience)) {
        loadedReg = profile.regional_experience;
      } else if (typeof profile.regionalExperience === "string") {
        loadedReg = profile.regionalExperience.split(",").map(x => x.trim()).filter(Boolean);
      } else if (typeof profile.regional_experience === "string") {
        loadedReg = profile.regional_experience.split(",").map(x => x.trim()).filter(Boolean);
      }
      setRegionalExperience(loadedReg);

      // Location Preference loading
      if (profile.locationPreference || profile.location_preference) {
        const val = profile.locationPreference || profile.location_preference;
        if (val === "Both") {
          setLocationPreference("Both (India & Overseas)");
        } else if (val === "India") {
          setLocationPreference("India");
        } else if (val === "Overseas") {
          setLocationPreference("Overseas");
        } else {
          setLocationPreference(val);
        }
      }

      // Employment Preference loading
      let loadedEmp = [];
      if (profile.availability_info && typeof profile.availability_info === "object" && !Array.isArray(profile.availability_info) && Array.isArray(profile.availability_info.employment_preference)) {
        loadedEmp = profile.availability_info.employment_preference;
      } else if (Array.isArray(profile.employmentPreference)) {
        loadedEmp = profile.employmentPreference;
      } else if (Array.isArray(profile.employment_preference)) {
        loadedEmp = profile.employment_preference;
      } else if (typeof profile.employmentPreference === "string") {
        loadedEmp = profile.employmentPreference.split(",").map(x => x.trim()).filter(Boolean);
      } else if (typeof profile.employment_preference === "string") {
        loadedEmp = profile.employment_preference.split(",").map(x => x.trim()).filter(Boolean);
      }
      setEmploymentPreference(loadedEmp);

      // Availability loading
      if (profile.availability_info && typeof profile.availability_info === "object" && !Array.isArray(profile.availability_info)) {
        setAvailability(profile.availability_info.availability_status || "");
      } else if (profile.availability) {
        setAvailability(profile.availability);
      }

      // Bio loading
      if (profile.bio) {
        setBio(profile.bio);
      }

      // Languages loading
      let loadedLangs = [];
      if (Array.isArray(profile.languages)) {
        loadedLangs = profile.languages;
      } else if (typeof profile.languages === "string") {
        loadedLangs = profile.languages.split(",").map(x => x.trim()).filter(Boolean);
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
      if (
        formattedCalendly === "https://calendly.com/" ||
        formattedCalendly === "https://calendly.com" ||
        formattedCalendly === "http://calendly.com/" ||
        formattedCalendly === "http://calendly.com" ||
        formattedCalendly === "calendly.com/" ||
        formattedCalendly === "calendly.com"
      ) {
        formattedCalendly = "";
      } else if (formattedCalendly && !/^https?:\/\//i.test(formattedCalendly)) {
        formattedCalendly = "https://" + formattedCalendly;
      }
      setCalendlyLink(formattedCalendly);
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
        experience_range: experienceYears,
        preferred_role: professionalTitle,
        profile_photo_path: photoUri,
      };
      await dispatch(updateProfile(updatePayload)).unwrap();

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          {step < 7 ? (
            <TouchableOpacity onPress={prev} style={styles.headerIconBtn}>
              <Ionicons name="arrow-back" size={24} color="#0a0504" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <Text style={[styles.headerTitle, step >= 6 && { color: "#153e69" }]}>
            {step === 7 ? "Jobrito" : "Professional Profile"}
          </Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Progress Tracker (only for steps 1 to 6) */}
        {step <= 6 && (
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>STEP {step} OF 6</Text>
              <Text style={[styles.progressPct, { color: PRIMARY_GREEN }]}>{progress}% Complete</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: PRIMARY_GREEN }]} />
            </View>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: PERSONAL PROFILE */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              {/* Photo Upload Box */}
              <View style={styles.photoSection}>
                <TouchableOpacity
                  style={styles.avatarCircle}
                  activeOpacity={0.8}
                  onPress={selectPhotoSource}
                >
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <>
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={48} color="#153e69" style={{ opacity: 0.6 }} />
                      </View>
                      <View style={styles.avatarOverlay}>
                        <Ionicons name="camera" size={20} color="#fff" />
                        <Text style={styles.avatarOverlayText}>Add Photo</Text>
                      </View>
                    </>
                  )}
                  <View style={[styles.plusIcon, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="add" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={[styles.stepTitle, { textAlign: "center" }]}>Personal Identity</Text>
              <Text style={[styles.stepSubtitle, { textAlign: "center" }]}>
                First impressions matter in the professional kitchen.
              </Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("fullName", "Full Name")}</Text>
                <View style={[styles.inputWrapper, activeInput === "fullName" && styles.inputWrapperActive]}>
                  <Ionicons name="person-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={t("enterFullName", "Enter your full name")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("fullName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Professional Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("professionalTitle", "Professional Title")}</Text>
                <View style={[styles.inputWrapper, activeInput === "professionalTitle" && styles.inputWrapperActive]}>
                  <Ionicons name="restaurant-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={professionalTitle}
                    onChangeText={setProfessionalTitle}
                    placeholder="e.g. Executive Chef, Sous Chef"
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("professionalTitle")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <Text style={styles.inputSubtext}>Common: Executive Chef, Culinary Consultant, Pastry Chef</Text>
              </View>

              {/* Country Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("country", "Country")}</Text>
                <ModalPickerTrigger
                  onPress={() => {
                    setShowCountryDropdown(true);
                    setShowCityDropdown(false);
                  }}
                  label={selectedCountry}
                  placeholder="Select Country"
                  isOpen={showCountryDropdown}
                  leftIcon="globe-outline"
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showCountryDropdown}
                  onClose={() => setShowCountryDropdown(false)}
                  title="Select Country"
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

              {/* Custom Country TextInput */}
              {selectedCountry === "Other" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter Country Name</Text>
                  <View style={[styles.inputWrapper, activeInput === "customCountry" && styles.inputWrapperActive]}>
                    <Ionicons name="globe-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                    <TextInput
                      value={country}
                      onChangeText={setCountry}
                      placeholder="Enter country name"
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("customCountry")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                </View>
              )}

              {/* City Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current City</Text>
                {selectedCountry === "Other" ? (
                  <View style={[styles.inputWrapper, activeInput === "city" && styles.inputWrapperActive]}>
                    <Ionicons name="location-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                    <TextInput
                      value={currentCity}
                      onChangeText={setCurrentCity}
                      placeholder="Enter city name"
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("city")}
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
                      placeholder={!selectedCountry ? "Select Country First" : "Select City"}
                      isOpen={showCityDropdown}
                      leftIcon="location-outline"
                      style={[styles.inputWrapper, !selectedCountry && { backgroundColor: "#f2f2f3" }]}
                    />
                    <ModalPicker
                      visible={showCityDropdown}
                      onClose={() => setShowCityDropdown(false)}
                      title="Select City"
                      options={citiesByCountry[selectedCountry] || ["Other"]}
                      selectedValue={selectedCity}
                      onSelect={(opt) => {
                        setSelectedCity(opt);
                        if (opt === "Other") {
                          setCurrentCity("");
                        } else {
                          setCurrentCity(opt);
                        }
                      }}
                    />
                    {selectedCity === "Other" && (
                      <View style={[styles.inputWrapper, { marginTop: 8 }, activeInput === "customCity" && styles.inputWrapperActive]}>
                        <TextInput
                          value={currentCity}
                          onChangeText={setCurrentCity}
                          placeholder="Type your city name"
                          placeholderTextColor="rgba(10, 5, 4, 0.4)"
                          style={styles.textInput}
                          onFocus={() => setActiveInput("customCity")}
                          onBlur={() => setActiveInput(null)}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>



              {/* Languages Spoken */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Languages Spoken</Text>
                
                <Text style={[styles.inputSubtext, { paddingLeft: 0, marginBottom: 8 }]}>Tap to select languages you speak:</Text>
                <View style={[styles.pillsRow, { paddingLeft: 0, marginTop: 4, marginBottom: 12 }]}>
                  {commonLanguagesList.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[styles.pill, isSelected && styles.pillSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setLanguages(languages.filter((l) => l !== lang));
                          } else {
                            setLanguages([...languages, lang]);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                          {lang}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {languages.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.inputSubtext, { paddingLeft: 0, marginBottom: 6 }]}>Selected Languages:</Text>
                    <View style={styles.tagWrapper}>
                      {languages.map((lang) => (
                        <View key={lang} style={styles.languageTag}>
                          <Text style={styles.languageTagText}>{lang}</Text>
                          <TouchableOpacity onPress={() => handleRemoveLanguage(lang)} style={styles.languageTagClose}>
                            <Ionicons name="close" size={14} color="rgba(10, 5, 4, 0.6)" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View>
                  {showLangInput ? (
                    <View style={[styles.inputWrapper, { borderColor: PRIMARY_GREEN }]}>
                      <TextInput
                        value={newLanguage}
                        onChangeText={setNewLanguage}
                        placeholder="Type custom language (e.g. German)"
                        placeholderTextColor="rgba(10, 5, 4, 0.4)"
                        style={styles.textInput}
                        autoFocus
                        onSubmitEditing={handleAddLanguage}
                      />
                      <TouchableOpacity onPress={handleAddLanguage} style={{ padding: 4 }}>
                        <Ionicons name="checkmark-circle" size={24} color={PRIMARY_GREEN} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.inputWrapper,
                        {
                          justifyContent: "center",
                          borderStyle: "dashed",
                          borderColor: PRIMARY_GREEN,
                          backgroundColor: "transparent"
                        }
                      ]}
                      onPress={() => setShowLangInput(true)}
                    >
                      <Ionicons name="add" size={20} color={PRIMARY_GREEN} style={{ marginRight: 6 }} />
                      <Text style={{ color: PRIMARY_GREEN, fontWeight: "700", fontSize: 14 }}>
                        Add Other Language
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!fullName.trim() || !professionalTitle.trim() || !currentCity.trim() || !country.trim() || languages.length === 0) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: PROFESSIONAL EXPERTISE */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              {/* Banner Mock with Solid Color */}
              <View style={[styles.bannerContainer, { backgroundColor: PRIMARY_GREEN, justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="sparkles" size={32} color="#f2c879" style={{ marginBottom: 6 }} />
                <Text style={styles.bannerText}>Showcase your skills</Text>
              </View>

              {/* Cuisine Specialization */}
              <View style={styles.sectionHeader}>
                <Ionicons name="restaurant-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Cuisine Specialization</Text>
              </View>
              <Text style={styles.sectionSubtitleText}>
                Select the cuisines you have mastered in your career.
              </Text>
              
              <View style={styles.inputGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowCuisineDropdown(!showCuisineDropdown);
                    setShowOperationsDropdown(false);
                  }}
                  style={[styles.inputWrapper, showCuisineDropdown && styles.inputWrapperActive]}
                >
                  <Text style={[styles.textInput, selectedCuisines.length === 0 && { color: "rgba(10, 5, 4, 0.4)" }]} numberOfLines={1}>
                    {selectedCuisines.length > 0 
                      ? selectedCuisines.map(c => c === "Other" && customCuisine ? `${c} (${customCuisine})` : c).join(", ")
                      : "Select Cuisines"}
                  </Text>
                  <Ionicons name={showCuisineDropdown ? "chevron-up" : "chevron-down"} size={20} color="rgba(10, 5, 4, 0.6)" />
                </TouchableOpacity>

                {showCuisineDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {cuisinesList.map((cuisine) => {
                        const isSelected = selectedCuisines.includes(cuisine);
                        return (
                          <TouchableOpacity
                            key={cuisine}
                            style={styles.dropdownItemRow}
                            onPress={() => toggleCuisine(cuisine)}
                          >
                            <Ionicons 
                              name={isSelected ? "checkbox" : "square-outline"} 
                              size={18} 
                              color={isSelected ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.4)"} 
                              style={{ marginRight: 10 }}
                            />
                            <Text style={[styles.dropdownItemText, isSelected && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                              {cuisine}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Custom Cuisine Input if Other is selected */}
              {selectedCuisines.includes("Other") && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter Other Cuisine(s)</Text>
                  <View style={[styles.inputWrapper, activeInput === "customCuisine" && styles.inputWrapperActive]}>
                    <Ionicons name="create-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                    <TextInput
                      value={customCuisine}
                      onChangeText={setCustomCuisine}
                      placeholder="e.g. French, Japanese"
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("customCuisine")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                </View>
              )}

              {/* Operational Expertise */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Operational Expertise</Text>
              </View>
              <Text style={styles.sectionSubtitleText}>
                What management skills do you bring to the kitchen?
              </Text>
              
              <View style={styles.inputGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowOperationsDropdown(!showOperationsDropdown);
                    setShowCuisineDropdown(false);
                  }}
                  style={[styles.inputWrapper, showOperationsDropdown && styles.inputWrapperActive]}
                >
                  <Text style={[styles.textInput, selectedOperations.length === 0 && { color: "rgba(10, 5, 4, 0.4)" }]} numberOfLines={1}>
                    {selectedOperations.length > 0 
                      ? selectedOperations.map(o => o === "Other" && customOperation ? `${o} (${customOperation})` : o).join(", ")
                      : "Select Operational Expertise"}
                  </Text>
                  <Ionicons name={showOperationsDropdown ? "chevron-up" : "chevron-down"} size={20} color="rgba(10, 5, 4, 0.6)" />
                </TouchableOpacity>

                {showOperationsDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {operationsList.map((op) => {
                        const isSelected = selectedOperations.includes(op);
                        return (
                          <TouchableOpacity
                            key={op}
                            style={styles.dropdownItemRow}
                            onPress={() => toggleOperation(op)}
                          >
                            <Ionicons 
                              name={isSelected ? "checkbox" : "square-outline"} 
                              size={18} 
                              color={isSelected ? PRIMARY_GREEN : "rgba(10, 5, 4, 0.4)"} 
                              style={{ marginRight: 10 }}
                            />
                            <Text style={[styles.dropdownItemText, isSelected && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                              {op}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Custom Operation Input if Other is selected */}
              {selectedOperations.includes("Other") && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter Other Operational Expertise</Text>
                  <View style={[styles.inputWrapper, activeInput === "customOperation" && styles.inputWrapperActive]}>
                    <Ionicons name="create-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                    <TextInput
                      value={customOperation}
                      onChangeText={setCustomOperation}
                      placeholder="e.g. Menu Development, Staffing"
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("customOperation")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                </View>
              )}

              {/* Years of Experience */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="briefcase-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Years of Experience</Text>
              </View>
              <View style={[styles.inputGroup, { marginTop: 10 }]}>
                <ModalPickerTrigger
                  onPress={() => setShowExpDropdown(true)}
                  label={experienceYears}
                  placeholder="Select total years in industry"
                  isOpen={showExpDropdown}
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showExpDropdown}
                  onClose={() => setShowExpDropdown(false)}
                  title="Years of Experience"
                  options={experienceOptions}
                  selectedValue={experienceYears}
                  onSelect={(val) => setExperienceYears(val)}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!selectedCuisines.length || 
                   (selectedCuisines.includes("Other") && !customCuisine.trim()) ||
                   !selectedOperations.length || 
                   (selectedOperations.includes("Other") && !customOperation.trim()) ||
                   !experienceYears) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: EXPERIENCE & AVAILABILITY */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Experience & Availability</Text>
              <Text style={styles.stepSubtitle}>
                Help us match you with the right culinary opportunities across the globe.
              </Text>

              {/* Regional Experience */}
              <View style={styles.sectionHeader}>
                <Ionicons name="globe-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>{t("regionalExperience", "Regional Experience")}</Text>
              </View>
              <View style={styles.pillsRow}>
                {regionalOptions.map((r) => {
                  const isSelected = regionalExperience.includes(r);
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => toggleRegionalExp(r)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Job Location Preference */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Ionicons name="globe-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>{t("jobLocationPreference", "Job Location Preference")} <Text style={{ color: "red" }}>*</Text></Text>
              </View>
              <View style={styles.pillsRow}>
                {locationPrefOptions.map((lp) => {
                  const isSelected = locationPreference === lp;
                  return (
                    <TouchableOpacity
                      key={lp}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setLocationPreference(lp)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {lp}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Employment Preference */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Ionicons name="briefcase-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>{t("employmentPreference", "Employment Preference")} <Text style={{ color: "red" }}>*</Text></Text>
              </View>
              <View style={styles.pillsRow}>
                {employmentOptions.map((ep) => {
                  const isSelected = employmentPreference.includes(ep);
                  return (
                    <TouchableOpacity
                      key={ep}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => toggleEmploymentPref(ep)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {ep}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Availability */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Ionicons name="calendar-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Availability</Text>
              </View>
              <View style={[styles.inputGroup, { marginTop: 8 }]}>
                <ModalPickerTrigger
                  onPress={() => setShowAvailDropdown(true)}
                  label={availability}
                  placeholder="Select availability"
                  isOpen={showAvailDropdown}
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showAvailDropdown}
                  onClose={() => setShowAvailDropdown(false)}
                  title="Availability"
                  options={availabilityOptions}
                  selectedValue={availability}
                  onSelect={(val) => setAvailability(val)}
                />
              </View>

              {/* Professional Bio */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Professional Bio</Text>
              </View>
              <View style={[styles.inputWrapper, styles.multilineWrapper, activeInput === "bio" && styles.inputWrapperActive]}>
                <TextInput
                  value={bio}
                  onChangeText={(text) => {
                    if (text.length <= 500) {
                      setBio(text);
                    }
                  }}
                  placeholder="Briefly describe your expertise, career highlights, and what you bring to the kitchen..."
                  placeholderTextColor="rgba(10, 5, 4, 0.4)"
                  multiline
                  numberOfLines={5}
                  style={[styles.textInput, styles.multilineInput]}
                  maxLength={500}
                  onFocus={() => setActiveInput("bio")}
                  onBlur={() => setActiveInput(null)}
                />
              </View>
              <Text style={styles.charCountText}>
                {bio.length} / 500 characters
              </Text>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (regionalExperience.length === 0 || !locationPreference || employmentPreference.length === 0 || !bio.trim()) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: CALENDLY INTEGRATION */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              {/* Top Sync Card */}
              <View style={styles.syncIllustrationCard}>
                <View style={styles.syncLogosRow}>
                  <View style={styles.syncLogoBox}>
                    <Ionicons name="calendar" size={24} color={PRIMARY_GREEN} />
                  </View>
                  <Ionicons name="repeat-outline" size={20} color="rgba(10, 5, 4, 0.4)" style={{ marginHorizontal: 12 }} />
                  <View style={[styles.syncLogoBox, { backgroundColor: "#153e69" }]}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>C</Text>
                  </View>
                </View>
                <Text style={styles.illustrationTitle}>Schedule Faster</Text>
                <Text style={styles.illustrationSubtitle}>
                  Connect your calendar to let employers book interviews instantly.
                </Text>
              </View>

              {/* Calendly Details Card */}
              <View style={styles.cardContainer}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={styles.calendarIconBg}>
                      <Ionicons name="calendar-outline" size={24} color="#153e69" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.cardSectionTitle}>Calendly Integration</Text>
                      <Text style={styles.cardSectionSubtitle}>Sync your availability</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.connectBadge, 
                    calendlyLink.trim() ? styles.connectBadgeSuccess : styles.connectBadgePending
                  ]}>
                    <View style={[
                      styles.connectBadgeDot, 
                      calendlyLink.trim() ? { backgroundColor: "#153e69" } : { backgroundColor: "rgba(10, 5, 4, 0.4)" }
                    ]} />
                    <Text style={[
                      styles.connectBadgeText,
                      calendlyLink.trim() ? { color: "#153e69" } : { color: "rgba(10, 5, 4, 0.6)" }
                    ]}>
                      {calendlyLink.trim() ? "Link Added" : "Not Connected"}
                    </Text>
                  </View>
                </View>

                {/* Input Field */}
                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                  <Text style={styles.inputLabel}>Your Calendly Link</Text>
                  <View style={[styles.inputWrapper, activeInput === "calendly" && styles.inputWrapperActive]}>
                    <Ionicons name="link-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                    <TextInput
                      value={calendlyLink}
                      onChangeText={(val) => setCalendlyLink(val.replace(/\s+/g, ""))}
                      placeholder="calendly.com/your-name"
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      autoCapitalize="none"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("calendly")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                  <Text style={styles.inputSubtext}>
                    Paste your personal Calendly scheduling link to enable direct booking for hospitality shifts.
                  </Text>

                  {/* Calendly Helper Actions */}
                  <View style={styles.calendlyPromptRow}>
                    <Text style={styles.calendlyPromptText}>
                      Don't have an account?{" "}
                      <Text
                        style={styles.calendlyLinkText}
                        onPress={() => Linking.openURL("https://calendly.com/signup")}
                      >
                        Create Account
                      </Text>
                      {" "}or{" "}
                      <Text
                        style={styles.calendlyLinkText}
                        onPress={() => Linking.openURL("https://calendly.com/login")}
                      >
                        Login
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Why Connect Info Card */}
              <View style={styles.whyConnectCard}>
                <Ionicons name="bulb-outline" size={20} color="#153e69" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.whyConnectTitle}>Why connect?</Text>
                  <Text style={styles.whyConnectText}>
                    Chef with connected calendars receive 4x more interview requests. It's the fastest way to land your next shift.
                  </Text>
                </View>
              </View>

              {/* Bottom Continue Button */}
              <TouchableOpacity
                style={[styles.continueButton, { marginTop: 24 }]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: SYNC YOUR PROFILE */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              {/* Top Sync Icon Box */}
              <View style={styles.syncIllustrationCard}>
                <View style={styles.shareIconCircle}>
                  <Ionicons name="share-social" size={32} color="#fff" />
                </View>
                <Text style={styles.illustrationTitle}>Sync Your Profile</Text>
                <Text style={styles.illustrationSubtitle}>
                  Connect your social accounts to import your hospitality experience and stand out to top employers.
                </Text>
              </View>

              {/* List of Social Connect Options */}
              <View style={styles.socialListCard}>
                {/* LinkedIn */}
                <TouchableOpacity
                  style={styles.socialRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("LinkedIn");
                    setTempLink(linkedinLink);
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialRowLeft}>
                    <View style={[styles.socialIconBox, { backgroundColor: "#153e69" }]}>
                      <Ionicons name="logo-linkedin" size={20} color="#fff" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.socialPlatformTitle}>LinkedIn</Text>
                      <Text style={styles.socialPlatformSubtitle}>Work History & Certificates</Text>
                    </View>
                  </View>
                  <View style={styles.socialRowRight}>
                    <View style={[
                      styles.socialStatusBadge,
                      linkedinLink ? styles.socialStatusBadgeConnected : styles.socialStatusBadgeConnect
                    ]}>
                      {linkedinLink ? (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="checkmark-circle" size={12} color="#153e69" style={{ marginRight: 4 }} />
                          <Text style={[styles.socialStatusBadgeText, { color: "#153e69" }]}>Connected</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusBadgeText}>Not Connected</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>

                <View style={styles.socialRowDivider} />

                {/* Instagram */}
                <TouchableOpacity
                  style={styles.socialRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("Instagram");
                    setTempLink(instagramLink);
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialRowLeft}>
                    <View style={[styles.socialIconBox, { backgroundColor: "#E1306C" }]}>
                      <Ionicons name="logo-instagram" size={20} color="#fff" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.socialPlatformTitle}>Instagram</Text>
                      <Text style={styles.socialPlatformSubtitle}>Visual Portfolio</Text>
                    </View>
                  </View>
                  <View style={styles.socialRowRight}>
                    <View style={[
                      styles.socialStatusBadge,
                      instagramLink ? styles.socialStatusBadgeConnected : styles.socialStatusBadgeConnect
                    ]}>
                      {instagramLink ? (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="checkmark-circle" size={12} color="#153e69" style={{ marginRight: 4 }} />
                          <Text style={[styles.socialStatusBadgeText, { color: "#153e69" }]}>Connected</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusBadgeText}>Not Connected</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>

                <View style={styles.socialRowDivider} />

                {/* Facebook */}
                <TouchableOpacity
                  style={styles.socialRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("Facebook");
                    setTempLink(facebookLink);
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialRowLeft}>
                    <View style={[styles.socialIconBox, { backgroundColor: "#1877F2" }]}>
                      <Ionicons name="logo-facebook" size={20} color="#fff" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.socialPlatformTitle}>Facebook</Text>
                      <Text style={styles.socialPlatformSubtitle}>Community Badges</Text>
                    </View>
                  </View>
                  <View style={styles.socialRowRight}>
                    <View style={[
                      styles.socialStatusBadge,
                      facebookLink ? styles.socialStatusBadgeConnected : styles.socialStatusBadgeConnect
                    ]}>
                      {facebookLink ? (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="checkmark-circle" size={12} color="#153e69" style={{ marginRight: 4 }} />
                          <Text style={[styles.socialStatusBadgeText, { color: "#153e69" }]}>Connected</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusBadgeText}>Not Connected</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>

                <View style={styles.socialRowDivider} />
                {/* Dynamically Rendered Custom Links */}
                {customSocialLinks.map((item) => (
                  <View key={item.id}>
                    <View style={styles.socialRowDivider} />
                    <View style={styles.socialRow}>
                      <TouchableOpacity
                        style={[styles.socialRowLeft, { flex: 1 }]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setEditingPlatform(item.platform);
                          setTempLink(item.link);
                          setSocialModalVisible(true);
                        }}
                      >
                        <View style={[styles.socialIconBox, { backgroundColor: PRIMARY_GREEN }]}>
                          <Ionicons 
                            name={item.platform.toLowerCase() === "twitter" ? "logo-twitter" : "link-outline"} 
                            size={20} 
                            color="#fff" 
                          />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.socialPlatformTitle}>{item.platform}</Text>
                          <Text style={styles.socialPlatformSubtitle} numberOfLines={1}>{item.link}</Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.socialRowRight}>
                        <TouchableOpacity
                          style={{ padding: 6 }}
                          onPress={() => {
                            setCustomSocialLinks(prev => prev.filter(l => l.id !== item.id));
                            if (item.platform.toLowerCase() === "twitter") {
                              setTwitterLink("");
                              setMoreConnected(false);
                            }
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="rgba(10, 5, 4, 0.4)" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}

                <View style={styles.socialRowDivider} />

                {/* Add More button */}
                <TouchableOpacity
                  style={styles.socialRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("Add More");
                    setCustomPlatformName("");
                    setTempLink("");
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialRowLeft}>
                    <View style={[styles.socialIconBox, { backgroundColor: "rgba(21, 62, 105, 0.08)" }]}>
                      <Ionicons name="add-outline" size={20} color={PRIMARY_GREEN} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.socialPlatformTitle}>Add More</Text>
                      <Text style={styles.socialPlatformSubtitle}>Website, Portfolio or other links</Text>
                    </View>
                  </View>
                  <View style={styles.socialRowRight}>
                    <Ionicons name="chevron-forward" size={16} color="rgba(10, 5, 4, 0.6)" style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Finish Setup Button */}
              <TouchableOpacity
                style={[styles.finishSetupButton, { backgroundColor: "#153e69" }]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Finish Setup</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: FINAL REVIEW */}
          {step === 6 && (
            <View style={styles.stepContainer}>
              <Text style={styles.reviewMainTitle}>{t("chefOnboarding.reviewTitle")}</Text>
              <Text style={styles.reviewMainSubtitle}>
                {t("chefOnboarding.reviewSubtitle")}
              </Text>

              <View style={styles.reviewCard}>
                <View style={styles.reviewProfileSection}>
                  {photoUri ? (
                    <View style={styles.reviewAvatarContainer}>
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.reviewAvatarImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={[styles.reviewAvatarContainer, styles.reviewAvatarPlaceholder]}>
                      <Ionicons name="person" size={28} color="#153e69" style={{ opacity: 0.6 }} />
                    </View>
                  )}
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{fullName || "Marcus V."}</Text>
                    {Boolean(professionalTitle) && (
                      <Text style={styles.reviewTitleText}>Current Role: {professionalTitle}</Text>
                    )}
                    
                    <View style={styles.reviewDetailsList}>
                      <Text numberOfLines={1} style={styles.detailRowText}>
                        <Text style={styles.detailLabel}>Current Location: </Text>
                        <Text style={styles.detailValue}>
                          {currentCity && country ? `${currentCity}, ${country}` : currentCity || country || "N/A"}
                        </Text>
                      </Text>
                      
                      <Text numberOfLines={1} style={styles.detailRowText}>
                        <Text style={styles.detailLabel}>Preferred Job Location: </Text>
                        <Text style={styles.detailValue}>
                          {locationPreference === "Both" || locationPreference === "Both (India & Overseas)"
                            ? "India & Overseas"
                            : locationPreference || "N/A"}
                        </Text>
                      </Text>
                      
                      <Text numberOfLines={1} style={styles.detailRowText}>
                        <Text style={styles.detailLabel}>Experience: </Text>
                        <Text style={styles.detailValue}>{experienceYears || "N/A"}</Text>
                      </Text>
                      
                      <Text numberOfLines={1} style={styles.detailRowText}>
                        <Text style={styles.detailLabel}>Regional Experience: </Text>
                        <Text style={styles.detailValue}>{regionalExperience.join(", ") || "N/A"}</Text>
                      </Text>
                      
                      <Text numberOfLines={1} style={styles.detailRowText}>
                        <Text style={styles.detailLabel}>Availability: </Text>
                        <Text style={styles.detailValue}>
                          {availability === "Available Immediately" || availability === "Immediately Available"
                            ? "Immediately Available"
                            : availability || "N/A"}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Professional Bio Card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewSecTitleRow}>
                  <Ionicons name="document-text" size={18} color="#153e69" />
                  <Text style={styles.reviewSecTitle}>{t("chefOnboarding.professionalBio")}</Text>
                </View>
                <Text style={styles.reviewSecBioText}>
                  {bio || "Dedicated culinary professional with experience in high-volume, luxury hospitality environments."}
                </Text>
              </View>

              {/* Cuisine Specialization Card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewSecTitleRow}>
                  <Ionicons name="restaurant" size={18} color="#153e69" />
                  <Text style={styles.reviewSecTitle}>{t("chefOnboarding.cuisineSpecialization")}</Text>
                </View>
                <View style={styles.reviewPillContainer}>
                  {selectedCuisines.map((cuisine) => (
                    <View key={cuisine} style={styles.reviewPill}>
                      <Text style={styles.reviewPillText}>{cuisine}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Operational Expertise Card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewSecTitleRow}>
                  <Ionicons name="stats-chart" size={18} color="#153e69" />
                  <Text style={styles.reviewSecTitle}>{t("chefOnboarding.operationalExpertise")}</Text>
                </View>
                <View style={styles.reviewPillContainer}>
                  {selectedOperations.map((op) => (
                    <View key={op} style={styles.reviewPill}>
                      <Text style={styles.reviewPillText}>{op}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Calendly & Social Links Card */}
              {(calendlyLink || linkedinLink || instagramLink || facebookLink || customSocialLinks.length > 0) ? (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewSecTitleRow}>
                    <Ionicons name="link-sharp" size={18} color="#153e69" />
                    <Text style={styles.reviewSecTitle}>Booking & Social Profiles</Text>
                  </View>
                  
                  {calendlyLink ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <Ionicons name="calendar-outline" size={16} color="#153e69" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, color: "rgba(10, 5, 4, 0.8)", fontWeight: "500" }} numberOfLines={1}>{calendlyLink}</Text>
                    </View>
                  ) : null}

                  {linkedinLink ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Ionicons name="logo-linkedin" size={16} color="#0077B5" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, color: "rgba(10, 5, 4, 0.8)", fontWeight: "500" }} numberOfLines={1}>{linkedinLink}</Text>
                    </View>
                  ) : null}

                  {instagramLink ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Ionicons name="logo-instagram" size={16} color="#E1306C" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, color: "rgba(10, 5, 4, 0.8)", fontWeight: "500" }} numberOfLines={1}>{instagramLink}</Text>
                    </View>
                  ) : null}

                  {facebookLink ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Ionicons name="logo-facebook" size={16} color="#1877F2" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, color: "rgba(10, 5, 4, 0.8)", fontWeight: "500" }} numberOfLines={1}>{facebookLink}</Text>
                    </View>
                  ) : null}

                  {customSocialLinks.map((item) => (
                    <View key={item.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Ionicons 
                        name={item.platform.toLowerCase() === "twitter" ? "logo-twitter" : "link-outline"} 
                        size={16} 
                        color={item.platform.toLowerCase() === "twitter" ? "#1DA1F2" : "#153e69"} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={{ fontSize: 13, color: "rgba(10, 5, 4, 0.8)", fontWeight: "500" }} numberOfLines={1}>
                        <Text style={{ fontWeight: "700" }}>{item.platform}:</Text> {item.link}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Complete Profile Button */}
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: "#153e69" }, submitting && styles.continueButtonDisabled]}
                onPress={handleCompleteProfile}
                activeOpacity={0.8}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.continueButtonText}>{t("chefOnboarding.completeProfile")}</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              {/* Edit Information Link */}
              <TouchableOpacity
                style={styles.editInfoBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.editInfoBtnText}>{t("chefOnboarding.editInformation")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 7: CONGRATULATIONS (SUCCESS SCREEN) */}
          {step === 7 && (
            <View style={[styles.stepContainer, { alignItems: "center", paddingTop: 40 }]}>
              {/* Success Circle Icon */}
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-circle" size={80} color="#153e69" />
              </View>

              {/* Heading & Subheading */}
              <Text style={styles.successTitle}>{t("chefOnboarding.congratulations")}</Text>
              <Text style={styles.successSubtitle}>
                {t("chefOnboarding.submittedSuccess")}
              </Text>

              {/* Status Pending Approval Pill */}
              <View style={styles.statusPill}>
                <Ionicons name="time-outline" size={14} color="rgba(10, 5, 4, 0.6)" style={{ marginRight: 4 }} />
                <Text style={styles.statusPillText}>{t("chefOnboarding.statusPending")}</Text>
              </View>

              {/* What Happens Next Card */}
              <View style={styles.nextStepsCard}>
                <Text style={styles.nextStepsTitle}>{t("chefOnboarding.whatHappensNext")}</Text>
                <Text style={styles.nextStepsText}>
                  {t("chefOnboarding.whatHappensNextBody")}
                </Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.continueButton, { width: "100%", backgroundColor: "#153e69" }]}
                onPress={() => handleFinishOnboarding("Home")}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>{t("chefOnboarding.returnToFeed")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
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
              {editingPlatform === "Add More" ? "Add Custom Link" : `Connect ${editingPlatform}`}
            </Text>
            
            {editingPlatform === "Add More" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Platform Name</Text>
                <View style={[styles.inputWrapper, { minHeight: 46 }]}>
                  <Ionicons name="pricetag-outline" size={18} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={customPlatformName}
                    onChangeText={setCustomPlatformName}
                    placeholder="e.g. Twitter, GitHub, Website"
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            <View style={[styles.inputGroup, editingPlatform === "Add More" && { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>
                {editingPlatform === "Add More" ? "Link / Handle" : `${editingPlatform} Link/Handle`}
              </Text>
              <View style={[styles.inputWrapper, { minHeight: 46 }]}>
                <Ionicons name="link-outline" size={18} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                <TextInput
                  value={tempLink}
                  onChangeText={setTempLink}
                  placeholder={editingPlatform === "Add More" ? "https://..." : `Enter your ${editingPlatform} URL`}
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
                <Text style={styles.socialModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialModalButton, styles.socialModalSave]}
                onPress={() => {
                  const val = tempLink.trim();
                  if (editingPlatform === "Add More") {
                    const plat = customPlatformName.trim();
                    if (!plat || !val) {
                      Alert.alert("Error", "Please fill in both platform name and link.");
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
                <Text style={styles.socialModalSaveText}>Save</Text>
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
    paddingVertical: 24,
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
});
