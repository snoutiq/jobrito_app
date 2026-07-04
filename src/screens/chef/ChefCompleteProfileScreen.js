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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setProfileData, resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { setChefOnboardingCompleted, setStoredProfile, clearAuthStorage } from "../../services/storage";
import * as ImagePicker from "expo-image-picker";
import { saveChefOnboarding } from "../../services/chefApi";
import { CustomAlert } from "../../components/common/CustomAlert";

const PRIMARY_GREEN = "#22C55E";

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

export default function ChefCompleteProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
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

  useEffect(() => {
    if (country) {
      if (countriesList.includes(country)) {
        setSelectedCountry(country);
      } else {
        setSelectedCountry("Other");
      }
    }
    if (currentCity) {
      if (country && countriesList.includes(country) && citiesByCountry[country]?.includes(currentCity)) {
        setSelectedCity(currentCity);
      } else {
        setSelectedCity("Other");
      }
    }
  }, []);

  // --- Step 2 State ---
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const [experienceYears, setExperienceYears] = useState("");
  const [showExpDropdown, setShowExpDropdown] = useState(false);

  const cuisinesList = [
    "Italian", "Continental", "Indian", "Chinese", 
    "Bakery", "Arabic", "Multi Cuisine", "Grill & BBQ"
  ];
  
  const operationsList = [
    "Kitchen Setup", "Menu Engineering", 
    "SOP Writer", "Team Builder", "Cost Control Expert"
  ];

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
  const availabilityOptions = ["Available Immediately", "1 Month Notice", "2 Months Notice", "Currently Employed"];

  // --- Step 4 State ---
  const [calendlyLink, setCalendlyLink] = useState("");
  const [calendlyConnected, setCalendlyConnected] = useState(false);

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
      await logoutApi();
    } catch (e) {
      // ignore
    }
    await clearAuthStorage();
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
      formData.append("cuisine_specialty", selectedCuisines.join(", "));
      formData.append("bio", bio);
      formData.append("calendly_link", calendlyLink || "");

      // Append social links
      if (linkedinLink) formData.append("linkedin", linkedinLink);
      if (instagramLink) formData.append("instagram", instagramLink);
      if (facebookLink) formData.append("facebook", facebookLink);
      if (twitterLink) formData.append("twitter", twitterLink);

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

      if (Array.isArray(selectedOperations)) {
        selectedOperations.forEach((skill) => {
          formData.append("skills[]", skill);
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

      // Photo file upload
      if (photoUri) {
        const uriParts = photoUri.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split(".").pop();
        formData.append("profile_photo", {
          uri: Platform.OS === "android" ? photoUri : photoUri.replace("file://", ""),
          name: fileName,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType || "png"}`,
        });
      }

      // Call API
      const apiResponse = await saveChefOnboarding(formData);

      const profilePayload = {
        name: fullName || "Chef User",
        professionalTitle,
        city: currentCity,
        country,
        languages,
        cuisines: selectedCuisines,
        operations: selectedOperations,
        experienceYears,
        regionalExperience,
        locationPreference,
        employmentPreference,
        availability,
        bio,
        calendlyLink,
        linkedin: linkedinLink,
        instagram: instagramLink,
        facebook: facebookLink,
        twitter: twitterLink,
        role: "chef",
        chefOnboardingCompleted: false, // Keep onboarding active to show Success step
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
    const profilePayload = {
      name: fullName || "Chef User",
      professionalTitle,
      city: currentCity,
      country,
      languages,
      cuisines: selectedCuisines,
      operations: selectedOperations,
      experienceYears,
      regionalExperience,
      locationPreference,
      employmentPreference,
      availability,
      bio,
      calendlyLink,
      linkedin: linkedinLink,
      instagram: instagramLink,
      facebook: facebookLink,
      twitter: twitterLink,
      role: "chef",
      chefOnboardingCompleted: true,
    };

    dispatch(setProfileData(profilePayload));
    await setChefOnboardingCompleted();
    await setStoredProfile(profilePayload);

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

  const progress = step === 6 ? 100 : Math.round((step / 6) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          {step < 7 ? (
            <TouchableOpacity onPress={prev} style={styles.headerIconBtn}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <Text style={[styles.headerTitle, step >= 6 && { color: "#15803D" }]}>
            {step === 7 ? "Jobrito" : "Professional Profile"}
          </Text>
          {step < 7 ? (
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => Alert.alert("Help", "Fill in your chef professional credentials to sync your profile with top employers.")}>
              <Ionicons name="help-circle-outline" size={24} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
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
                  <Image
                    source={{
                      uri: photoUri || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=60"
                    }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.avatarOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.avatarOverlayText}>Add Photo</Text>
                  </View>
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
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={[styles.inputWrapper, activeInput === "fullName" && styles.inputWrapperActive]}>
                  <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("fullName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Professional Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Professional Title</Text>
                <View style={[styles.inputWrapper, activeInput === "professionalTitle" && styles.inputWrapperActive]}>
                  <Ionicons name="restaurant-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={professionalTitle}
                    onChangeText={setProfessionalTitle}
                    placeholder="e.g. Executive Chef, Sous Chef"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("professionalTitle")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <Text style={styles.inputSubtext}>Common: Executive Chef, Culinary Consultant, Pastry Chef</Text>
              </View>

              {/* Country Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Country</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowCountryDropdown(!showCountryDropdown);
                    setShowCityDropdown(false);
                  }}
                  style={[styles.inputWrapper, showCountryDropdown && styles.inputWrapperActive]}
                >
                  <Ionicons name="globe-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <Text style={[styles.textInput, !selectedCountry && { color: "#94A3B8" }]}>
                    {selectedCountry || "Select Country"}
                  </Text>
                  <Ionicons name={showCountryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                </TouchableOpacity>

                {showCountryDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                      {countriesList.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedCountry(opt);
                            if (opt === "Other") {
                              setCountry("");
                            } else {
                              setCountry(opt);
                            }
                            setShowCountryDropdown(false);
                            // Clear city when country changes
                            setCurrentCity("");
                            setSelectedCity("");
                          }}
                        >
                          <Text style={[styles.dropdownItemText, selectedCountry === opt && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Custom Country TextInput */}
              {selectedCountry === "Other" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter Country Name</Text>
                  <View style={[styles.inputWrapper, activeInput === "customCountry" && styles.inputWrapperActive]}>
                    <Ionicons name="globe-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                    <TextInput
                      value={country}
                      onChangeText={setCountry}
                      placeholder="Enter country name"
                      placeholderTextColor="#94A3B8"
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
                    <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                    <TextInput
                      value={currentCity}
                      onChangeText={setCurrentCity}
                      placeholder="Enter city name"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("city")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        if (!selectedCountry) {
                          Alert.alert("Select Country", "Please select a country first.");
                          return;
                        }
                        setShowCityDropdown(!showCityDropdown);
                        setShowCountryDropdown(false);
                      }}
                      style={[
                        styles.inputWrapper,
                        !selectedCountry && { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
                        showCityDropdown && styles.inputWrapperActive
                      ]}
                      disabled={!selectedCountry}
                    >
                      <Ionicons name="location-outline" size={20} color={selectedCountry ? "#64748B" : "#94A3B8"} style={styles.inputIconLeft} />
                      <Text style={[styles.textInput, (!selectedCity || !currentCity) && { color: "#94A3B8" }]}>
                        {!selectedCountry 
                          ? "Select Country First" 
                          : (selectedCity === "Other" ? (currentCity || "Type your city name") : (currentCity || "Select City"))
                        }
                      </Text>
                      <Ionicons name={showCityDropdown ? "chevron-up" : "chevron-down"} size={20} color={selectedCountry ? "#64748B" : "#94A3B8"} />
                    </TouchableOpacity>

                    {showCityDropdown && selectedCountry && (
                      <View style={styles.dropdownContainer}>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                          {(citiesByCountry[selectedCountry] || ["Other"]).map((opt) => (
                            <TouchableOpacity
                              key={opt}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setSelectedCity(opt);
                                if (opt === "Other") {
                                  setCurrentCity("");
                                } else {
                                  setCurrentCity(opt);
                                }
                                setShowCityDropdown(false);
                              }}
                            >
                              <Text style={[styles.dropdownItemText, selectedCity === opt && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                                {opt}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Custom City TextInput (for standard country) */}
              {selectedCountry !== "Other" && selectedCity === "Other" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Enter City Name</Text>
                  <View style={[styles.inputWrapper, activeInput === "city" && styles.inputWrapperActive]}>
                    <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                    <TextInput
                      value={currentCity}
                      onChangeText={setCurrentCity}
                      placeholder="e.g. Pune"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("city")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                </View>
              )}

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
                            <Ionicons name="close" size={14} color="#64748B" />
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
                        placeholderTextColor="#94A3B8"
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
              {/* Banner Image Mock */}
              <View style={styles.bannerContainer}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=60" }}
                  style={styles.bannerImage}
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerText}>Showcase your skills</Text>
                </View>
              </View>

              {/* Cuisine Specialization */}
              <View style={styles.sectionHeader}>
                <Ionicons name="restaurant-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Cuisine Specialization</Text>
              </View>
              <Text style={styles.sectionSubtitleText}>
                Select all the cuisines you have mastered in your career.
              </Text>
              <View style={styles.pillsRow}>
                {cuisinesList.map((cuisine) => {
                  const isSelected = selectedCuisines.includes(cuisine);
                  return (
                    <TouchableOpacity
                      key={cuisine}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => toggleCuisine(cuisine)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Operational Expertise */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Operational Expertise</Text>
              </View>
              <Text style={styles.sectionSubtitleText}>
                What additional management skills do you bring to the kitchen?
              </Text>
              <View style={styles.pillsRow}>
                {operationsList.map((op) => {
                  const isSelected = selectedOperations.includes(op);
                  return (
                    <TouchableOpacity
                      key={op}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => toggleOperation(op)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                        {op}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Years of Experience */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="briefcase-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Years of Experience</Text>
              </View>
              <View style={[styles.inputGroup, { marginTop: 10 }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowExpDropdown(!showExpDropdown)}
                  style={[styles.inputWrapper, showExpDropdown && styles.inputWrapperActive]}
                >
                  <Text style={[styles.textInput, !experienceYears && { color: "#94A3B8" }]}>
                    {experienceYears || "Select total years in industry"}
                  </Text>
                  <Ionicons name={showExpDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                </TouchableOpacity>

                {showExpDropdown && (
                  <View style={styles.dropdownContainer}>
                    {experienceOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setExperienceYears(opt);
                          setShowExpDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, experienceYears === opt && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (selectedCuisines.length === 0 || selectedOperations.length === 0 || !experienceYears) && styles.continueButtonDisabled
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
                <Text style={styles.sectionTitleText}>Regional Experience</Text>
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
                <Text style={styles.sectionTitleText}>Job Location Preference</Text>
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
                <Text style={styles.sectionTitleText}>Employment Preference</Text>
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
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowAvailDropdown(!showAvailDropdown)}
                  style={[styles.inputWrapper, showAvailDropdown && styles.inputWrapperActive]}
                >
                  <Text style={[styles.textInput, !availability && { color: "#94A3B8" }]}>
                    {availability || "Select availability"}
                  </Text>
                  <Ionicons name={showAvailDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                </TouchableOpacity>

                {showAvailDropdown && (
                  <View style={styles.dropdownContainer}>
                    {availabilityOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setAvailability(opt);
                          setShowAvailDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, availability === opt && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Professional Bio */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitleText}>Professional Bio</Text>
              </View>
              <View style={[styles.inputWrapper, styles.multilineWrapper, activeInput === "bio" && styles.inputWrapperActive]}>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Briefly describe your expertise, career highlights, and what you bring to the kitchen..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={5}
                  style={[styles.textInput, styles.multilineInput]}
                  onFocus={() => setActiveInput("bio")}
                  onBlur={() => setActiveInput(null)}
                />
              </View>

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
                  <Ionicons name="repeat-outline" size={20} color="#94A3B8" style={{ marginHorizontal: 12 }} />
                  <View style={[styles.syncLogoBox, { backgroundColor: "#0284C7" }]}>
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
                      <Ionicons name="calendar-outline" size={24} color="#16A34A" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.cardSectionTitle}>Calendly Integration</Text>
                      <Text style={styles.cardSectionSubtitle}>Sync your availability</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.connectBadge, 
                    calendlyConnected ? styles.connectBadgeSuccess : styles.connectBadgePending
                  ]}>
                    <View style={[
                      styles.connectBadgeDot, 
                      calendlyConnected ? { backgroundColor: "#16A34A" } : { backgroundColor: "#94A3B8" }
                    ]} />
                    <Text style={[
                      styles.connectBadgeText,
                      calendlyConnected ? { color: "#16A34A" } : { color: "#64748B" }
                    ]}>
                      {calendlyConnected ? "Connected" : "Not Connected"}
                    </Text>
                  </View>
                </View>

                {/* Input Field */}
                <View style={[styles.inputGroup, { marginTop: 20 }]}>
                  <Text style={styles.inputLabel}>Your Calendly Link</Text>
                  <View style={[styles.inputWrapper, activeInput === "calendly" && styles.inputWrapperActive]}>
                    <Ionicons name="link-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                    <TextInput
                      value={calendlyLink}
                      onChangeText={(val) => {
                        setCalendlyLink(val);
                        if (!val.trim()) setCalendlyConnected(false);
                      }}
                      placeholder="calendly.com/your-name"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("calendly")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                  <Text style={styles.inputSubtext}>
                    Paste your personal Calendly scheduling link to enable direct booking for hospitality shifts.
                  </Text>
                </View>

                {/* Connect Button */}
                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    !calendlyLink.trim() && styles.connectButtonDisabled
                  ]}
                  onPress={() => {
                    if (calendlyLink.trim()) {
                      setCalendlyConnected(true);
                      Alert.alert("Success", "Calendly link connected successfully!");
                    }
                  }}
                  disabled={!calendlyLink.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.connectButtonText}>
                    {calendlyConnected ? "Connected" : "Connect"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Why Connect Info Card */}
              <View style={styles.whyConnectCard}>
                <Ionicons name="bulb-outline" size={20} color="#16A34A" style={{ marginRight: 10, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.whyConnectTitle}>Why connect?</Text>
                  <Text style={styles.whyConnectText}>
                    Candidates with connected calendars receive 4x more interview requests. It's the fastest way to land your next shift.
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
                    <View style={[styles.socialIconBox, { backgroundColor: "#0A66C2" }]}>
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
                          <Ionicons name="checkmark-circle" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                          <Text style={[styles.socialStatusBadgeText, { color: "#16A34A" }]}>Connected</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusBadgeText}>Connect</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" style={{ marginLeft: 6 }} />
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
                          <Ionicons name="checkmark-circle" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                          <Text style={[styles.socialStatusBadgeText, { color: "#16A34A" }]}>Connected</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusBadgeText}>Connect</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" style={{ marginLeft: 6 }} />
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
                          <Ionicons name="checkmark-circle" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                          <Text style={[styles.socialStatusBadgeText, { color: "#16A34A" }]}>Connected</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusBadgeText}>Connect</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>

                <View style={styles.socialRowDivider} />

                {/* Add More (Twitter) */}
                <TouchableOpacity
                  style={styles.socialRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setEditingPlatform("Twitter");
                    setTempLink(twitterLink);
                    setSocialModalVisible(true);
                  }}
                >
                  <View style={styles.socialRowLeft}>
                    <View style={[styles.socialIconBox, { backgroundColor: "#1DA1F2" }]}>
                      <Ionicons name="logo-twitter" size={20} color="#fff" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.socialPlatformTitle}>Add More</Text>
                      <Text style={styles.socialPlatformSubtitle}>Community Badges</Text>
                    </View>
                  </View>
                  <View style={styles.socialRowRight}>
                    <View style={[
                      styles.socialStatusBadge,
                      twitterLink ? styles.socialStatusBadgeConnected : styles.socialStatusBadgeConnect
                    ]}>
                      {twitterLink ? (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="checkmark-circle" size={12} color="#16A34A" style={{ marginRight: 4 }} />
                          <Text style={[styles.socialStatusBadgeText, { color: "#16A34A" }]}>Connected</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusBadgeText}>Connect</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Finish Setup Button */}
              <TouchableOpacity
                style={[styles.finishSetupButton, { backgroundColor: "#15803D" }]}
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

              {/* Profile Card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewProfileSection}>
                  <Image
                    source={{
                      uri: photoUri || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=60"
                    }}
                    style={styles.reviewAvatar}
                  />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{fullName || "Marcus V."}</Text>
                    <Text style={styles.reviewEmail}>
                      {fullName ? `${fullName.toLowerCase().replace(/\s+/g, ".")}@chefconnect.com` : "marcus.sterling@chefconnect.com"}
                    </Text>
                    <View style={styles.reviewBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                      <Text style={styles.reviewBadgeText}>{t("chefOnboarding.identityVerified")}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Title & Experience Grid */}
              <View style={styles.reviewGridRow}>
                <View style={[styles.reviewGridCol, { marginRight: 6 }]}>
                  <View style={styles.reviewGridLabelRow}>
                    <Ionicons name="star" size={14} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={styles.reviewGridLabel}>{t("chefOnboarding.currentTitle")}</Text>
                  </View>
                  <Text style={styles.reviewGridValue}>{professionalTitle || "Executive Sous Chef"}</Text>
                </View>
                <View style={[styles.reviewGridCol, { marginLeft: 6 }]}>
                  <View style={styles.reviewGridLabelRow}>
                    <Ionicons name="calendar" size={14} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={styles.reviewGridLabel}>{t("chefOnboarding.experience")}</Text>
                  </View>
                  <Text style={styles.reviewGridValue}>{experienceYears || "12 Years"}</Text>
                </View>
              </View>

              {/* Professional Bio Card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewSecTitleRow}>
                  <Ionicons name="document-text" size={18} color="#15803D" />
                  <Text style={styles.reviewSecTitle}>{t("chefOnboarding.professionalBio")}</Text>
                </View>
                <Text style={styles.reviewSecBioText}>
                  {bio || "Dedicated culinary professional with experience in high-volume, luxury hospitality environments."}
                </Text>
              </View>

              {/* Cuisine Specialization Card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewSecTitleRow}>
                  <Ionicons name="restaurant" size={18} color="#15803D" />
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
                  <Ionicons name="stats-chart" size={18} color="#15803D" />
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

              {/* Regions Card */}
              <View style={styles.reviewCard}>
                <View style={styles.reviewSecTitleRow}>
                  <Ionicons name="globe" size={18} color="#15803D" />
                  <Text style={styles.reviewSecTitle}>{t("chefOnboarding.regions")}</Text>
                </View>
                <View style={styles.reviewBulletContainer}>
                  {regionalExperience.map((region) => (
                    <View key={region} style={styles.reviewBulletRow}>
                      <View style={styles.reviewBulletDot} />
                      <Text style={styles.reviewBulletText}>{region}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Complete Profile Button */}
              <TouchableOpacity
                style={[styles.continueButton, { backgroundColor: "#22C55E" }, submitting && styles.continueButtonDisabled]}
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
                <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
              </View>

              {/* Heading & Subheading */}
              <Text style={styles.successTitle}>{t("chefOnboarding.congratulations")}</Text>
              <Text style={styles.successSubtitle}>
                {t("chefOnboarding.submittedSuccess")}
              </Text>

              {/* Status Pending Approval Pill */}
              <View style={styles.statusPill}>
                <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
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
                style={[styles.continueButton, { width: "100%", backgroundColor: "#22C55E" }]}
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
            <Text style={styles.socialModalTitle}>Connect {editingPlatform}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{editingPlatform} Link/Handle</Text>
              <View style={[styles.inputWrapper, { minHeight: 46 }]}>
                <Ionicons name="link-outline" size={18} color="#64748B" style={styles.inputIconLeft} />
                <TextInput
                  value={tempLink}
                  onChangeText={setTempLink}
                  placeholder={`Enter your ${editingPlatform} URL`}
                  placeholderTextColor="#94A3B8"
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
                  if (editingPlatform === "LinkedIn") {
                    setLinkedinLink(val);
                    setLinkedinConnected(!!val);
                  } else if (editingPlatform === "Instagram") {
                    setInstagramLink(val);
                    setInstagramConnected(!!val);
                  } else if (editingPlatform === "Facebook") {
                    setFacebookLink(val);
                    setFacebookConnected(!!val);
                  } else if (editingPlatform === "Twitter") {
                    setTwitterLink(val);
                    setMoreConnected(!!val);
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
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#64748B",
  },
  progressPct: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E2E8F0",
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
    backgroundColor: "#E2E8F0",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    position: "relative",
    overflow: "visible",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
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
    borderColor: "#FFFFFF",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "850",
    color: "#0F172A",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
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
    color: "#0F172A",
    fontSize: 15,
    paddingVertical: 8,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  inputSubtext: {
    fontSize: 11,
    color: "#64748B",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 10,
    minHeight: 50,
    alignItems: "center",
  },
  languageTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  languageTagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
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
    color: "#0F172A",
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
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
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
    color: "#FFFFFF",
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
    color: "#0F172A",
  },
  sectionSubtitleText: {
    fontSize: 12,
    color: "#64748B",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
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
    color: "#475569",
  },
  pillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dropdownContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#334155",
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
    color: "#0F172A",
    marginBottom: 6,
  },
  reviewMainSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
  reviewAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
  },
  reviewInfo: {
    flex: 1,
    justifyContent: "center",
  },
  reviewName: {
    fontSize: 18,
    fontWeight: "750",
    color: "#0F172A",
    marginBottom: 2,
  },
  reviewEmail: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2FBF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
    marginLeft: 4,
  },
  reviewGridRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewGridCol: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  reviewGridLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewGridLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  reviewGridValue: {
    fontSize: 14,
    fontWeight: "750",
    color: "#0F172A",
  },
  reviewSecTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewSecTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginLeft: 8,
  },
  reviewSecBioText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  reviewPillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reviewPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reviewPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
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
    backgroundColor: "#22C55E",
    marginRight: 10,
  },
  reviewBulletText: {
    fontSize: 13,
    color: "#475569",
  },
  editInfoBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  editInfoBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803D",
  },
  successIconBox: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  nextStepsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
    marginBottom: 28,
  },
  nextStepsTitle: {
    fontSize: 15,
    fontWeight: "750",
    color: "#0F172A",
    marginBottom: 6,
  },
  nextStepsText: {
    fontSize: 13,
    color: "#475569",
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
    color: "#15803D",
  },
  // --- New Styles ---
  syncIllustrationCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    backgroundColor: "#F2FBF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  illustrationTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  illustrationSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "750",
    color: "#1E293B",
  },
  cardSectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  connectBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  connectBadgePending: {
    backgroundColor: "#F1F5F9",
  },
  connectBadgeSuccess: {
    backgroundColor: "#F0FDF4",
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
    backgroundColor: "#22C55E",
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  connectButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  whyConnectCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
  },
  whyConnectTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  whyConnectText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  shareIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  socialListCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#1E293B",
  },
  socialPlatformSubtitle: {
    fontSize: 11,
    color: "#64748B",
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
    backgroundColor: "#F1F5F9",
  },
  socialStatusBadgeConnected: {
    backgroundColor: "#F0FDF4",
  },
  socialStatusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  socialRowDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 16,
  },
  finishSetupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803D",
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
    color: "#0F172A",
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
    backgroundColor: "#F1F5F9",
  },
  socialModalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  socialModalSave: {
    backgroundColor: "#22C55E",
  },
  socialModalSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
