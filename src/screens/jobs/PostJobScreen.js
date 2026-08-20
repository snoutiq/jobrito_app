import React, { useState, useEffect, useCallback } from "react";
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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { submitCommunityJob, storeEmployerJob } from "../../redux/slices/jobSlice";
import { setProfileData, fetchProfile } from "../../redux/slices/userSlice";
import { useFocusEffect } from "@react-navigation/native";
import { setEmployerOnboardingCompleted, setStoredProfile } from "../../services/storage";
import { getDailyPostLimit } from "../../services/jobApi";
import colors from "../../constants/colors";
import ModalPicker, { ModalPickerTrigger } from "../../components/common/ModalPicker";
import indianStatesCities from "../../data/indianStatesCities.json";

const stateOptions = Object.keys(indianStatesCities);
const allCitiesList = Array.from(new Set(Object.values(indianStatesCities).flat()));

import useKeyboardAwareScroll from "../../hooks/useKeyboardAwareScroll";

const PRIMARY_GREEN = "#153e69";
const { width } = Dimensions.get("window");

export default function PostJobScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole
  );

  const { scrollViewRef, handleInputFocus: scrollInputFocus } = useKeyboardAwareScroll({ extraOffset: 30 });

  const handleInputFocus = (e, fieldName) => {
    if (fieldName) setActiveField(fieldName);
    scrollInputFocus(e);
  };

  // When on PostJobScreen, the user is assumed to be an employer.
  const goToDashboard = () => {
    navigation.navigate("MyJobs", { activeTab: "pending" });
  };

  const savedBusinessName = profile?.business_name || profile?.businessName || profile?.company || "";
  const savedContactName = profile?.contact_person_name || profile?.name || profile?.full_name || profile?.contactName || "";

  const [step, setStep] = useState(() => {
    return savedBusinessName.trim() && savedContactName.trim() ? 2 : 1;
  }); // 1: Business Info, 2: Job Details, 3: Contact & Review, 4: Success
  const [toastMessage, setToastMessage] = useState("");
  const [checkingLimit, setCheckingLimit] = useState(false);
  const hasSavedBusinessBasics = savedBusinessName.trim() && savedContactName.trim();
  const visibleStep = hasSavedBusinessBasics ? Math.max(step, 2) : step;

  // Step 1: Business Basics
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  // Step 2: Job Details
  const [region, setRegion] = useState("India");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("INR");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [openPositions, setOpenPositions] = useState("1");
  const [experience, setExperience] = useState("Mid-Level (3-5 years)");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);

  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [activeField, setActiveField] = useState(null);
  
  // Step 3: Contact & Review
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const regions = ["India", "KSA", "Dubai"];
  const experienceOptions = [
    "Entry Level (0-2 years)",
    "Mid-Level (3-5 years)",
    "Senior (5+ and above)",
  ];
  const jobTypeOptions = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
  ];

  const getRegionLabel = (r) => {
    switch (r) {
      case "India": return t("regions.india", "India");
      case "KSA": return t("regions.ksa", "KSA");
      case "Dubai": return t("regions.dubai", "Dubai");
      default: return r;
    }
  };

  const getExperienceLabel = (opt) => {
    if (opt.startsWith("Entry")) return t("experience.entry", "Entry Level (0-2 years)");
    if (opt.startsWith("Mid")) return t("experience.mid", "Mid-Level (3-5 years)");
    if (opt.startsWith("Senior")) return t("experience.senior", "Senior (5+ and above)");
    return opt;
  };

  const getJobTypeLabel = (opt) => {
    switch (opt?.toLowerCase()) {
      case "full-time":
      case "full time":
        return t("jobType.fullTime", "Full-time");
      case "part-time":
      case "part time":
        return t("jobType.partTime", "Part-time");
      case "contract":
        return t("jobType.contract", "Contract");
      case "internship":
        return t("jobType.internship", "Internship");
      case "freelance":
        return t("jobType.freelance", "Freelance");
      default:
        return opt;
    }
  };

  // Fetch profile immediately when screen opens — ensures data is fresh after login
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchProfile());
    }, [dispatch])
  );

  // Autofill fields from user profile if available — only fills empty fields to avoid overwriting user input
  useEffect(() => {
    if (profile) {
      const bName = profile.business_name || profile.businessName || profile.company || "";
      const cPerson = profile.contact_person_name || profile.name || profile.full_name || profile.contactName || "";

      // Only set if not already filled by user
      setBusinessName((prev) => prev.trim() ? prev : bName);
      setContactPerson((prev) => prev.trim() ? prev : cPerson);
      setContactPhone((prev) => prev.trim() ? prev : (profile.business_mobile || profile.phone || profile.mobile_number || profile.contactPhone || ""));
      setContactEmail((prev) => prev.trim() ? prev : (profile.business_email || profile.email || profile.contactEmail || ""));

      if (bName.trim() && cPerson.trim()) {
        setStep((prev) => prev === 1 ? 2 : prev);
      }
    }
  }, [profile]);

  const handleNextStep1 = () => {
    if (!businessName.trim()) {
      Alert.alert(t("error"), t("employerOnboarding.businessNameRequired"));
      return;
    }
    if (!contactPerson.trim()) {
      Alert.alert(t("error"), t("employerOnboarding.contactNameRequired"));
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!jobTitle.trim()) {
      Alert.alert(t("error"), t("postJob.jobTitleRequired", "Please enter a Job Title."));
      return;
    }
    if (!selectedState) {
      Alert.alert(t("error"), t("selectStateRequired", "Please select a State."));
      return;
    }
    if (!selectedCity) {
      Alert.alert(t("error"), t("selectCityRequired", "Please select a City."));
      return;
    }
    if (!openPositions.trim() || isNaN(openPositions)) {
      Alert.alert(t("error"), t("postJob.openPositionsRequired", "Please enter a valid number of Open Positions."));
      return;
    }
    if (!jobDescription.trim()) {
      Alert.alert(t("error"), t("postJob.descriptionRequired", "Please enter a Job Description."));
      return;
    }
    setStep(3);
  };
  
    const persistEmployerOnboardingComplete = async () => {
    const updatedProfile = {
      ...profile,
      employerOnboardingCompleted: true,
    };

    await setStoredProfile(updatedProfile);
    await setEmployerOnboardingCompleted();
    dispatch(setProfileData(updatedProfile));
  };

  const handleExitOnboarding = async () => {
    try {
      await persistEmployerOnboardingComplete();
    } catch (err) {
      console.warn("Failed to complete onboarding:", err);
    }
    // Redux state update ke baad MainTabs stack switch hone ke liye
    // thoda time dena zaroori hai, warna EmployerHome screen abhi
    // registered nahi hoti purane navigator mein.
    setTimeout(() => {
      goToDashboard();
    }, 150);
  };

const handleSubmitJob = async () => {
  if (isSubmitting) return; // Prevent duplicate submissions

  if (!contactPhone.trim()) {
    Alert.alert(t("error"), t("employerOnboarding.contactPhoneRequired"));
    return;
  }

  setIsSubmitting(true);

  const combinedSalary = salaryMin && salaryMax
    ? `${salaryCurrency} ${salaryMin} - ${salaryMax}`
    : salaryMin
      ? `${salaryCurrency} ${salaryMin}+`
      : "";

  const finalLocation = selectedCity && selectedState
    ? `${selectedCity}, ${selectedState}`
    : selectedState || selectedCity || location.trim() || "";

  const jobData = {
    title: jobTitle,
    category: region.toLowerCase(),
    company: businessName,
    location: finalLocation,
    state: selectedState || "",
    city: selectedCity || "",
    salary: combinedSalary,
    salary_min: salaryMin ? parseFloat(salaryMin) || salaryMin : null,
    salary_max: salaryMax ? parseFloat(salaryMax) || salaryMax : null,
    salary_currency: salaryCurrency,
    contact_info: contactEmail || contactPhone || "",
    description: jobDescription,
    job_type: jobType,
    experience_range: experience,
    open_positions: parseInt(openPositions, 10) || 1,
  };

  try {
    const result = await dispatch(storeEmployerJob(jobData));

    if (storeEmployerJob.fulfilled.match(result)) {
      if (route.params?.isOnboarding) {
        await persistEmployerOnboardingComplete();
      }
      setStep(4);
    } else {
      const serverError = result.payload;
      let errorMessage = t("postJob.submitFailed", "Failed to submit job posting. Please try again.");
      if (serverError && typeof serverError === "object") {
        if (serverError.errors && typeof serverError.errors === "object") {
          errorMessage = Object.entries(serverError.errors)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(" ") : val}`)
            .join("\n");
        } else if (serverError.message) {
          errorMessage = serverError.message;
        }
      } else if (typeof serverError === "string") {
        errorMessage = serverError;
      }
      Alert.alert(t("error"), errorMessage);
    }
  } catch (err) {
    Alert.alert(t("error"), err.message || t("postJob.errorOccurred", "Something went wrong."));
  } finally {
    setIsSubmitting(false);
  }
};

  const handleSaveAsDraft = () => {
    Alert.alert(
      t("postJob.saveDraft", "Save as Draft"),
      t("postJob.draftSavedSuccess", "Your job post draft has been saved successfully."),
      [{ text: "OK" }]
    );
  };

  const handleReset = () => {
    setJobTitle("");
    setLocation("");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("INR");
    setExperience("Mid-Level (3-5 years)");
    setOpenPositions("1");
    setJobDescription("");
    setRegion("India");
    setJobType("Full-time");
    setStep(1);
  };

  const renderProgress = () => {
    let percentage = "0%";
    let title = "";

    if (visibleStep === 1) {
      percentage = "33%";
      title = t("step", { current: 1, total: 3 });
    } else if (visibleStep === 2) {
      percentage = "66%";
      title = t("step", { current: 2, total: 3 });
    } else if (visibleStep === 3) {
      percentage = "100%";
      title = t("step", { current: 3, total: 3 });
    }

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressStepText}>{title}</Text>
          {visibleStep === 2 && <Text style={styles.progressPercentText}>66% {t("completeProfile.complete", "Complete")}</Text>}
          {visibleStep === 3 && <Text style={styles.progressPercentText}>100%</Text>}
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: percentage }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                if (visibleStep > 2 && visibleStep < 4) {
                  setStep(visibleStep - 1);
                } else {
                  navigation.goBack();
                }
              }}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#153e69" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("postJob.title")}</Text>
            <View style={styles.headerRight}>
              {route?.params?.isOnboarding ? (
                <TouchableOpacity
                  onPress={() => {
                    handleExitOnboarding();
                    goToDashboard();
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={28} color="#f57f20" />
                </TouchableOpacity>
              ) : (
                <>
                  {visibleStep === 2 && (
                    <TouchableOpacity style={styles.headerIcon}>
                      {/* <Ionicons name="notifications-outline" size={22} color="#0a0504" /> */}
                    </TouchableOpacity>
                  )}
                  {/* {profile?.profile_photo_path ? (
                    <Image
                      source={{ uri: profile.profile_photo_path }}
                      style={styles.headerAvatar}
                    />
                  ) : (
                    <View style={styles.headerAvatarFallback}>
                      <Ionicons name="person-outline" size={16} color="rgba(10, 5, 4, 0.6)" />
                    </View>
                  )} */}
                </>
              )}
            </View>
          </View>
        </View>

        {visibleStep < 4 && renderProgress()}

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: BUSINESS BASICS */}
          {visibleStep === 1 && (
            <View style={styles.stepContainer}>
              {/* Info Card */}
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle"
                  size={26}
                  color={PRIMARY_GREEN}
                  style={styles.infoBoxIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoBoxText}>
                    {t("postJob.businessBasics")}
                  </Text>
                  <Text style={styles.infoBoxTime}>10:04 AM</Text>
                </View>
              </View>

              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.businessName")}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    activeField === "businessName" && styles.inputWrapperActive,
                  ]}
                >
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder={t("postJob.businessNamePlaceholder")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "businessName")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Contact Person Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.contactPerson")}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    activeField === "contactPerson" && styles.inputWrapperActive,
                  ]}
                >
                  <TextInput
                    value={contactPerson}
                    onChangeText={setContactPerson}
                    placeholder={t("postJob.contactPersonPlaceholder")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "contactPerson")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>



              {/* Floating Help Button */}
              {/* <TouchableOpacity
                style={styles.fab}
                onPress={() =>
                  Alert.alert("Help", t("postJob.supportMessage", "Need assistance? Please contact support@JobRito.com"))
                }
                activeOpacity={0.8}
              >
                <Ionicons name="help-circle-outline" size={26} color="#ffffff" />
              </TouchableOpacity> */}

              {/* Footer actions */}
              <View style={[styles.footerContainer, { marginTop: 40 }]}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={handleNextStep1}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.next")}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                </TouchableOpacity>

                {/* <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={handleSaveAsDraft}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveDraftLinkText}>{t("postJob.saveDraft")}</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          )}

          {/* STEP 2: JOB DETAILS */}
          {visibleStep === 2 && (
            <View style={styles.stepContainer}>
              {/* Target Region Label */}
              <Text style={styles.inputLabel}>{t("postJob.targetRegion")}</Text>
              <View style={styles.regionRow}>
                {regions.map((r) => {
                  const isActive = region === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.regionChip,
                        isActive && styles.regionChipActive,
                      ]}
                      onPress={() => setRegion(r)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.regionChipText,
                          isActive && styles.regionChipTextActive,
                        ]}
                      >
                        {getRegionLabel(r)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Fields Card */}
              <View style={styles.fieldsCard}>
                {/* Job Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("postJob.jobTitle")}</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "jobTitle" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={jobTitle}
                      onChangeText={setJobTitle}
                      placeholder={t("postJob.jobTitlePlaceholder")}
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={(e) => handleInputFocus(e, "jobTitle")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* State & City in a Single Row */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 16 }}>
                  {/* State Dropdown */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>{t("selectState", "State")}</Text>
                    <ModalPickerTrigger
                      onPress={() => setShowStateModal(true)}
                      label={selectedState}
                      placeholder={t("selectState", "Select State")}
                      isOpen={showStateModal}
                      leftIcon="map-outline"
                      style={styles.inputWrapper}
                    />
                    <ModalPicker
                      visible={showStateModal}
                      onClose={() => setShowStateModal(false)}
                      title={t("selectState", "Select State")}
                      options={stateOptions}
                      selectedValue={selectedState}
                      onSelect={(val) => {
                        setSelectedState(val);
                        if (selectedCity && indianStatesCities[val] && !indianStatesCities[val].includes(selectedCity)) {
                          setSelectedCity("");
                        }
                      }}
                      searchable={true}
                      searchPlaceholder={t("searchState", "Search State...")}
                    />
                  </View>

                  {/* City Dropdown */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>{t("selectCity", "City")}</Text>
                    <ModalPickerTrigger
                      onPress={() => setShowCityModal(true)}
                      label={selectedCity}
                      placeholder={t("selectCity", "Select City")}
                      isOpen={showCityModal}
                      leftIcon="business-outline"
                      style={styles.inputWrapper}
                    />
                    <ModalPicker
                      visible={showCityModal}
                      onClose={() => setShowCityModal(false)}
                      title={t("selectCity", "Select City")}
                      options={selectedState ? (indianStatesCities[selectedState] || []) : allCitiesList}
                      selectedValue={selectedCity}
                      onSelect={(val) => {
                        setSelectedCity(val);
                        if (!selectedState) {
                          const foundState = Object.keys(indianStatesCities).find((st) =>
                            indianStatesCities[st].includes(val)
                          );
                          if (foundState) setSelectedState(foundState);
                        }
                      }}
                      searchable={true}
                      searchPlaceholder={t("searchCity", "Search City...")}
                    />
                  </View>
                </View>

                {/* Salary Currency & Range Section */}
                <Text style={styles.inputLabel}>{t("postJob.salaryRange", "Salary Range")}</Text>
                
                <View style={[styles.inlineRow, { marginBottom: 12 }]}>
                  {/* Currency Selector */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <ModalPickerTrigger
                      onPress={() => setShowCurrencyDropdown(true)}
                      label={salaryCurrency}
                      placeholder="Currency"
                      isOpen={showCurrencyDropdown}
                      style={styles.inputWrapper}
                    />
                    <ModalPicker
                      visible={showCurrencyDropdown}
                      onClose={() => setShowCurrencyDropdown(false)}
                      title="Select Currency"
                      options={["INR", "USD", "SAR", "AED", "EUR", "GBP"]}
                      selectedValue={salaryCurrency}
                      onSelect={(val) => setSalaryCurrency(val)}
                      renderOption={(opt) => ({ INR: "INR (₹)", USD: "USD ($)", SAR: "SAR (SR)", AED: "AED (AED)", EUR: "EUR (€)", GBP: "GBP (£)" }[opt] || opt)}
                    />
                  </View>

                  {/* Min Salary */}
                  <View style={{ flex: 1, marginRight: 8, position: "relative", zIndex: 20, elevation: 20 }}>
                    <View style={[styles.inputWrapper, activeField === "salaryMin" && styles.inputWrapperActive]}>
                      <TextInput
                        value={salaryMin}
                        onChangeText={setSalaryMin}
                        placeholder={t("postJob.salaryMinPlaceholder", "Min")}
                        placeholderTextColor="rgba(10, 5, 4, 0.4)"
                        style={styles.textInput}
                        keyboardType="numeric"
                        onFocus={(e) => handleInputFocus(e, "salaryMin")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>

                  {/* Max Salary */}
                  <View style={{ flex: 1 }}>
                    <View style={[styles.inputWrapper, activeField === "salaryMax" && styles.inputWrapperActive]}>
                      <TextInput
                        value={salaryMax}
                        onChangeText={setSalaryMax}
                        placeholder={t("postJob.salaryMaxPlaceholder", "Max")}
                        placeholderTextColor="rgba(10, 5, 4, 0.4)"
                        style={styles.textInput}
                        keyboardType="numeric"
                        onFocus={(e) => handleInputFocus(e, "salaryMax")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>
                </View>

                {/* Open Positions Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("postJob.openPositions")}</Text>
                  <View style={[styles.inputWrapper, activeField === "openPositions" && styles.inputWrapperActive]}>
                    <TextInput
                      value={openPositions}
                      onChangeText={setOpenPositions}
                      placeholder="1"
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      keyboardType="numeric"
                      onFocus={(e) => handleInputFocus(e, "openPositions")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Experience Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.experienceRequired")}</Text>
                  <ModalPickerTrigger
                    onPress={() => setShowExpDropdown(true)}
                    label={getExperienceLabel(experience)}
                    isOpen={showExpDropdown}
                    style={styles.inputWrapper}
                  />
                  <ModalPicker
                    visible={showExpDropdown}
                    onClose={() => setShowExpDropdown(false)}
                    title={t("postJob.experienceRequired")}
                    options={experienceOptions}
                    selectedValue={experience}
                    onSelect={(val) => setExperience(val)}
                    renderOption={getExperienceLabel}
                  />
                </View>

                {/* Job Type Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.jobType", "Job Type")}</Text>
                  <ModalPickerTrigger
                    onPress={() => setShowJobTypeDropdown(true)}
                    label={getJobTypeLabel(jobType)}
                    isOpen={showJobTypeDropdown}
                    style={styles.inputWrapper}
                  />
                  <ModalPicker
                    visible={showJobTypeDropdown}
                    onClose={() => setShowJobTypeDropdown(false)}
                    title={t("postJob.jobType", "Job Type")}
                    options={jobTypeOptions}
                    selectedValue={jobType}
                    onSelect={(val) => setJobType(val)}
                    renderOption={getJobTypeLabel}
                  />
                </View>

                {/* Job Description */}
                <View style={[styles.inputGroup, { marginTop: 8, position: "relative", zIndex: 20, elevation: 20 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.jobDescription")}</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.multilineWrapper,
                      activeField === "jobDescription" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={jobDescription}
                      onChangeText={setJobDescription}
                      placeholder={t("postJob.jobDescriptionPlaceholder")}
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={[styles.textInput, styles.multilineInput]}
                      multiline
                      numberOfLines={4}
                      onFocus={(e) => handleInputFocus(e, "jobDescription")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Tip Box */}
              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.tipBoxIcon} />
                <Text style={styles.tipBoxText}>{t("postJob.tipText")}</Text>
              </View>

              {/* Footer actions for Step 2 */}
              <View style={styles.footerRowStep2}>
                {/* <TouchableOpacity style={styles.saveDraftLink} onPress={handleSaveAsDraft} activeOpacity={0.7}>
                  <Text style={styles.saveDraftLinkText}>{t("postJob.saveDraft")}</Text>
                </TouchableOpacity> */}

                <TouchableOpacity style={styles.primaryNextBtnSmall} activeOpacity={0.8} onPress={handleNextStep2}>
                  <Text style={styles.primaryNextBtnText}>{t("postJob.next")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: CONTACT & REVIEW */}
          {visibleStep === 3 && (
            <View style={styles.stepContainer}>

              {/* Top Banner Card */}
              <View style={styles.step3Banner}>
                <Text style={styles.step3BannerText}>
                  {t("postJob.contactInfoBanner")}
                </Text>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.phoneNumber")}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    activeField === "contactPhone" && styles.inputWrapperActive,
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color="rgba(10, 5, 4, 0.6)"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder={t("postJob.phonePlaceholder")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "contactPhone")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
                <Text style={styles.phoneCaption}>
                  {t("postJob.phoneCaption")}
                </Text>
              </View>

              {/* Email Address */}
              <View style={[styles.inputGroup, { marginTop: 4 }]}>
                <Text style={styles.inputLabel}>{t("postJob.emailAddress")}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    activeField === "contactEmail" && styles.inputWrapperActive,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="rgba(10, 5, 4, 0.6)"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder={t("postJob.emailPlaceholder")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "contactEmail")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Quick Review Header */}
              <Text style={styles.reviewHeader}>{t("postJob.quickReview", "QUICK REVIEW")}</Text>

              {/* Single Compact Review Card */}
              <View style={styles.compactReviewCard}>
                <View style={styles.reviewHeaderRow}>
                  <View style={styles.reviewHeaderIconContainer}>
                    <Ionicons name="briefcase" size={20} color={PRIMARY_GREEN} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewJobTitle}>{jobTitle.trim() || "Job Title"}</Text>
                    <Text style={styles.reviewCompanySub}>{businessName || "Business Name"}</Text>
                  </View>
                </View>
                {/* Metadata Row */}
                <View style={styles.reviewMetaRow}>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons name="location-outline" size={13} color={PRIMARY_GREEN} style={{ marginRight: 2 }} />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>{selectedCity && selectedState ? `${selectedCity}, ${selectedState}` : selectedState || selectedCity || location.trim() || "Location"}</Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons name="cash-outline" size={13} color={PRIMARY_GREEN} style={{ marginRight: 2 }} />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>
                      {salaryMin ? `${salaryCurrency} ${salaryMin}${salaryMax ? `-${salaryMax}` : "+"}` : "Not Specified"}
                    </Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons name="people-outline" size={13} color={PRIMARY_GREEN} style={{ marginRight: 2 }} />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>{t("openings_count", { count: parseInt(openPositions, 10) || 1 })}</Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons name="bar-chart-outline" size={13} color={PRIMARY_GREEN} style={{ marginRight: 2 }} />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>{getExperienceLabel(experience)}</Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons name="time-outline" size={13} color={PRIMARY_GREEN} style={{ marginRight: 2 }} />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>{getJobTypeLabel(jobType)}</Text>
                  </View>
                </View>

                <View style={styles.reviewDivider} />

                {/* Bio / Description */}
                <View style={[styles.reviewBioContainer, { borderLeftWidth: 3, borderLeftColor: PRIMARY_GREEN, paddingLeft: 10, marginTop: 4 }]}>
                  <Text style={styles.reviewBioLabel}>{t("postJob.jobDescription", "Job Description")}</Text>
                  <View style={{ 
                    height: 85, 
                    backgroundColor: "#f8f9fa", 
                    borderRadius: 8, 
                    padding: 8, 
                    borderWidth: 1, 
                    borderColor: "rgba(10, 5, 4, 0.05)",
                    marginTop: 6 
                  }}>
                    <ScrollView 
                      nestedScrollEnabled 
                      showsVerticalScrollIndicator={true} 
                      persistentScrollbar={true}
                    >
                      <Text style={styles.reviewBioText}>
                        {jobDescription.trim() || "No description provided."}
                      </Text>
                    </ScrollView>
                  </View>
                </View>
              </View>

              {/* Footer step 3 */}
              <View style={[styles.footerContainer, { marginTop: 36 }]}>
                {/* <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={handleSubmitJob}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.submitApproval")}</Text>
                  <Ionicons
                    name="paper-plane-outline"
                    size={16}
                    color="#ffffff"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity> */}
                <TouchableOpacity
  style={[styles.primaryNextBtn, isSubmitting && { opacity: 0.6 }]}
  activeOpacity={0.8}
  onPress={handleSubmitJob}
  disabled={isSubmitting}
>
  <Text style={styles.primaryNextBtnText}>
    {isSubmitting ? "Submitting..." : t("postJob.submitApproval", "Submit For Approval")}
  </Text>
  {!isSubmitting && (
    <Ionicons name="paper-plane" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
  )}
</TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={() => {
                    handleReset();
                    goToDashboard();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveDraftLinkText}>{t("postJob.returnFeed")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <View style={[styles.stepContainer, { alignItems: "center", paddingTop: 40 }]}>
              {/* Checkmark circle illustration */}
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <View style={styles.successIconCore}>
                    <Ionicons name="checkmark" size={56} color="#ffffff" />
                  </View>
                </View>
              </View>

              <Text style={styles.successTitle}>🎉 {t("postJob.successTitle")}</Text>

              {/* Submission description card */}
              <View style={styles.tipBox}>
                              <Ionicons
                                name="bulb-outline"
                                size={20}
                                color={PRIMARY_GREEN}
                                style={styles.tipBoxIcon}
                              />
                              <Text style={styles.tipBoxText}>
                                Detailed job descriptions attract{" "}
                                <Text style={{ color: PRIMARY_GREEN, fontWeight: "700" }}>40% more</Text>{" "}
                                qualified applicants. Be sure to mention specific benefits!
                              </Text>
                            </View>

              {/* Success Action Buttons */}
              <View style={{ width: "100%", gap: 14, marginTop: 40 }}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={async () => {
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
                        handleReset();
                        if (route?.params?.isOnboarding) {
                          handleExitOnboarding();
                        }
                      }
                    } catch (err) {
                      console.warn("Failed to check daily post limit:", err);
                      handleReset();
                      if (route?.params?.isOnboarding) {
                        handleExitOnboarding();
                      }
                    } finally {
                      setCheckingLimit(false);
                    }
                  }}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.postNew")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dashboardLink}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleReset();
                    if (route?.params?.isOnboarding) {
                      handleExitOnboarding();
                    } else {
                      goToDashboard();
                    }
                  }}
                >
                  <Text style={styles.dashboardLinkText}>{t("postJob.goDashboard")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {toastMessage ? (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f3",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#0a0504",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  headerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderColor: "#EEF2F7",
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#153e69",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 99,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 99,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoBoxIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoBoxText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
  },
  infoBoxTime: {
    fontSize: 10,
    color: "rgba(10, 5, 4, 0.4)",
    marginTop: 6,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    height: 50,
    minHeight: 50,
    width: "100%",
    paddingHorizontal: 14,
  },
  inputWrapperActive: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 1.5,
    backgroundColor: "#ffffff",
  },
  textInput: {
    flex: 1,
    color: "#0a0504",
    fontSize: 15,
    paddingVertical: 8,
  },
  imageCard: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
    position: "relative",
  },
  imageCardBackground: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  imageCardContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
  },
  imageCardStepLabel: {
    color: "#f2f2f3",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  imageCardTitleLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_GREEN,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 90,
    right: 0,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  footerContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  primaryNextBtn: {
    width: "100%",
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryNextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  saveDraftLink: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  saveDraftLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#153e69",
  },
  regionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  regionChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  regionChipActive: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  regionChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  regionChipTextActive: {
    color: "#153e69",
  },
  fieldsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    marginBottom: 16,
  },
  inlineRow: {
    flexDirection: "row",
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
    position: "absolute",
    width: "100%",
    zIndex: 10,
    top: 74,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    height: 110,
  },
  multilineInput: {
    textAlignVertical: "top",
    height: "100%",
    width: "100%",
  },
  tipBox: {
    flexDirection: "row",
    backgroundColor: "#f2f2f3",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
    marginBottom: 20,
  },
  tipBoxIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  tipBoxText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
  },
  footerRowStep2: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
  },
  primaryNextBtnSmall: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    minHeight: 46,
    width: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  step3Banner: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 14,
    marginBottom: 20,
  },
  step3BannerText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 19,
  },
  phoneCaption: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.4)",
    marginTop: 6,
    marginLeft: 2,
  },
  reviewHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  compactReviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  reviewHeaderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewJobTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 2,
  },
  reviewCompanySub: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.5)",
  },
  reviewMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  reviewMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f2f2f3",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.06)",
  },
  reviewMetaChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  reviewDivider: {
    height: 1,
    backgroundColor: "rgba(10, 5, 4, 0.08)",
    marginVertical: 12,
  },
  reviewBioContainer: {
    gap: 4,
  },
  reviewBioLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reviewBioText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.7)",
    lineHeight: 18,
  },
  successIconOuter: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E2FBE9",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconCore: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: PRIMARY_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0a0504",
    textAlign: "center",
    marginBottom: 16,
  },
  successInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 14,
    padding: 16,
    width: "100%",
  },
  successInfoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  successInfoText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 16,
  },
  dashboardLink: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dashboardLinkText: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(10, 5, 4, 0.6)",
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
