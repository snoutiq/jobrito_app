import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setProfileData } from "../../redux/slices/userSlice";
import { setChefOnboardingCompleted, setStoredProfile } from "../../services/storage";

const PRIMARY_GREEN = "#22C55E";

export default function ChefCompleteProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);

  // --- Step 1 State ---
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [fullName, setFullName] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [country, setCountry] = useState("");
  const [languages, setLanguages] = useState(["English", "French"]);
  const [newLanguage, setNewLanguage] = useState("");
  const [showLangInput, setShowLangInput] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  // --- Step 2 State ---
  const [selectedCuisines, setSelectedCuisines] = useState(["Indian"]);
  const [selectedOperations, setSelectedOperations] = useState(["Kitchen Setup"]);
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
    "1-2 Years", "2-5 Years", "5-10 Years", "10+ Years"
  ];

  // --- Step 3 State ---
  const [regionalExperience, setRegionalExperience] = useState(["UAE"]);
  const [locationPreference, setLocationPreference] = useState("Both (India & Overseas)");
  const [employmentPreference, setEmploymentPreference] = useState(["Full Time"]);
  const [availability, setAvailability] = useState("Available Immediately");
  const [showAvailDropdown, setShowAvailDropdown] = useState(false);
  const [bio, setBio] = useState("");

  const regionalOptions = ["Saudi Arabia", "UAE", "GCC", "International", "India"];
  const locationPrefOptions = ["India", "Overseas", "Both (India & Overseas)"];
  const employmentOptions = ["Full Time", "Contract", "Freelance", "Project Based", "Consultant"];
  const availabilityOptions = ["Available Immediately", "1 Month Notice", "2 Months Notice", "Currently Employed"];

  // --- Step 4 State ---
  const [calendlyLink, setCalendlyLink] = useState("calendly.com/your-name");
  const [calendlyConnected, setCalendlyConnected] = useState(false);

  // --- Step 5 State ---
  const [linkedinConnected, setLinkedinConnected] = useState(true);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [moreConnected, setMoreConnected] = useState(false);

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

    if (step < 5) {
      setStep(step + 1);
    }
  };

  const prev = () => {
    if (step === 5) return; // Cannot go back from Congratulations
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  const handleCompleteProfile = async () => {
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
      role: "chef",
      chefOnboardingCompleted: false, // Keep onboarding active to show Step 5
    };

    dispatch(setProfileData(profilePayload));
    await setStoredProfile(profilePayload);
    setStep(5); // Go to success screen
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
      role: "chef",
      chefOnboardingCompleted: true,
    };

    dispatch(setProfileData(profilePayload));
    await setChefOnboardingCompleted();
    await setStoredProfile(profilePayload);

    // Navigation switches automatically because Redux profile state is updated.
  };

  const progress = step === 4 ? 100 : step * 25;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          {step < 5 ? (
            <TouchableOpacity onPress={prev} style={styles.headerIconBtn}>
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <Text style={[styles.headerTitle, step >= 4 && { color: "#15803D" }]}>
            {step === 5 ? "Jobrito" : "Professional Profile"}
          </Text>
          {step < 5 ? (
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => Alert.alert("Help", "Fill in your chef professional credentials to sync your profile with top employers.")}>
              <Ionicons name="help-circle-outline" size={24} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>

        {/* Progress Tracker (only for steps 1 to 4) */}
        {step <= 4 && (
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>STEP {step} OF 4</Text>
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
                  onPress={() => {
                    setPhotoUploaded(true);
                    Alert.alert("Photo Picker", "Selected profile photo successfully!");
                  }}
                >
                  <Image
                    source={{
                      uri: photoUploaded
                        ? "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=60"
                        : "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=60"
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

              {/* City & Country Row */}
              <View style={styles.inlineRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Current City</Text>
                  <View style={[styles.inputWrapper, activeInput === "city" && styles.inputWrapperActive]}>
                    <TextInput
                      value={currentCity}
                      onChangeText={setCurrentCity}
                      placeholder="e.g. Dubai"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("city")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <View style={[styles.inputWrapper, activeInput === "country" && styles.inputWrapperActive]}>
                    <TextInput
                      value={country}
                      onChangeText={setCountry}
                      placeholder="e.g. UAE"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveInput("country")}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Languages Spoken */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Languages Spoken</Text>
                <View style={styles.tagWrapper}>
                  {languages.map((lang) => (
                    <View key={lang} style={styles.languageTag}>
                      <Text style={styles.languageTagText}>{lang}</Text>
                      <TouchableOpacity onPress={() => handleRemoveLanguage(lang)} style={styles.languageTagClose}>
                        <Ionicons name="close" size={14} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {showLangInput ? (
                    <View style={styles.addLangWrapper}>
                      <TextInput
                        value={newLanguage}
                        onChangeText={setNewLanguage}
                        placeholder="Language"
                        placeholderTextColor="#94A3B8"
                        style={styles.addLangInput}
                        autoFocus
                        onSubmitEditing={handleAddLanguage}
                      />
                      <TouchableOpacity onPress={handleAddLanguage} style={styles.addLangSubmit}>
                        <Ionicons name="checkmark" size={16} color={PRIMARY_GREEN} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addLangButton}
                      onPress={() => setShowLangInput(true)}
                    >
                      <Text style={[styles.addLangButtonText, { color: PRIMARY_GREEN }]}>+ Add More</Text>
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
                  <Text style={styles.textInput}>{availability}</Text>
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

          {/* STEP 4: FINAL REVIEW */}
          {step === 4 && (
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
                      uri: photoUploaded
                        ? "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=60"
                        : "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=60"
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
                style={[styles.continueButton, { backgroundColor: "#22C55E" }]}
                onPress={handleCompleteProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>{t("chefOnboarding.completeProfile")}</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
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

          {/* STEP 5: CONGRATULATIONS (SUCCESS SCREEN) */}
          {step === 5 && (
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

              <TouchableOpacity
                style={styles.viewDraftBtn}
                onPress={() => handleFinishOnboarding("Profile")}
                activeOpacity={0.7}
              >
                <Text style={styles.viewDraftBtnText}>{t("chefOnboarding.viewProfileDraft")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
});
