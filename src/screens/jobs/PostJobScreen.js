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
  ActivityIndicator,
  BackHandler,
  Dimensions,
  PixelRatio,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { storeEmployerJob } from "../../redux/slices/jobSlice";
import { fetchProfile, setProfileData } from "../../redux/slices/userSlice";
import { useFocusEffect } from "@react-navigation/native";
import { setEmployerOnboardingCompleted, setStoredProfile } from "../../services/storage";
import ModalPicker, { ModalPickerTrigger } from "../../components/common/ModalPicker";
import useKeyboardAwareScroll from "../../hooks/useKeyboardAwareScroll";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_NAVY = "#153e69";
const PRIMARY_BLUE = "#1860f0";

export default function PostJobScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  const { scrollViewRef, handleInputFocus: scrollInputFocus } = useKeyboardAwareScroll({ extraOffset: 30 });

  const handleInputFocus = (e, fieldName) => {
    if (fieldName) setActiveField(fieldName);
    scrollInputFocus(e);
  };

  const goToDashboard = () => {
    if (typeof navigation.replace === "function") {
      navigation.replace("MyJobs", { activeTab: "pending" });
    } else {
      navigation.navigate("MyJobs", { activeTab: "pending" });
    }
  };

  // Helper to extract saved registration locations
  const getRegistrationLocations = useCallback(() => {
    let list = [];
    const bizLoc = profile?.business_location || profile?.employer_profile?.business_location;
    if (bizLoc && typeof bizLoc === "string") {
      list.push(`Primary (${bizLoc})`);
    }

    let opLocs =
      profile?.employer_profile?.operational_locations ||
      profile?.employer_profile?.locations ||
      profile?.operational_locations ||
      profile?.locations;

    if (typeof opLocs === "string") {
      try {
        opLocs = JSON.parse(opLocs);
      } catch (e) {
        opLocs = [opLocs];
      }
    }

    if (Array.isArray(opLocs)) {
      opLocs.forEach((locStr, idx) => {
        const strVal = typeof locStr === "string" ? locStr : [locStr.city, locStr.state, locStr.country].filter(Boolean).join(", ");
        if (strVal) {
          const alreadyAdded = list.some((item) => item.includes(strVal));
          if (!alreadyAdded) {
            const label = list.length === 0 ? `Primary (${strVal})` : `Secondary (${strVal})`;
            list.push(label);
          }
        }
      });
    }

    if (list.length === 0) {
      list.push("Primary (Riyadh, Central, Saudi Arabia)");
    }
    return list;
  }, [profile]);

  const locationOptions = getRegistrationLocations();

  // Form State
  const [step, setStep] = useState(1); // 1: Job Details, 2: Job Requirements, 3: Review, 4: Success
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Business Type (Read-only from registration)
  const businessType =
    profile?.industry_segment ||
    profile?.segment ||
    profile?.employer_profile?.industry_segment ||
    "Café";

  const [jobRole, setJobRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Step 2: Salary & Experience & Description
  const [salaryCurrency, setSalaryCurrency] = useState("SAR");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  
  const [experience, setExperience] = useState("Mid Level (3-5 Years)");
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  const [openPositions, setOpenPositions] = useState("2");
  const [jobType, setJobType] = useState("Full-Time");
  const [showJobTypeModal, setShowJobTypeModal] = useState(false);

  const [jobDescription, setJobDescription] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed effective job role
  const effectiveJobRole = jobRole === "Other" ? (customRole.trim() || "Other") : jobRole;

  // Initialize selectedLocation on profile load
  useEffect(() => {
    if (locationOptions.length > 0 && !selectedLocation) {
      setSelectedLocation(locationOptions[0]);
    }
  }, [locationOptions, selectedLocation]);

  // Autofill currency based on selected location
  useEffect(() => {
    if (selectedLocation) {
      const locLower = selectedLocation.toLowerCase();
      if (locLower.includes("india")) {
        setSalaryCurrency("INR");
      } else if (
        locLower.includes("saudi") ||
        locLower.includes("ksa") ||
        locLower.includes("riyadh") ||
        locLower.includes("jeddah") ||
        locLower.includes("khobar") ||
        locLower.includes("dammam") ||
        locLower.includes("jubail")
      ) {
        setSalaryCurrency("SAR");
      }
    }
  }, [selectedLocation]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchProfile());
    }, [dispatch])
  );

  // Handle hardware back press on Android (Step 3 -> Step 2 -> Step 1 -> Exit)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step > 1 && step < 4) {
          setStep((prevStep) => prevStep - 1);
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [step])
  );

  // Option Lists
  const categoryOptions = [
    "Kitchen, Service, Bar & Beverage, Café",
    "Management & Operations",
    "Bakery & Pastry",
    "Hotel & Housekeeping",
    "Delivery & Logistics",
  ];

  const roleOptions = [
    "Executive Chef",
    "Head Chef",
    "Sous Chef",
    "Chef de Partie",
    "Commis Chef",
    "Pastry Chef",
    "Bakery Chef",
    "Pizza Chef",
    "Grill Chef",
    "Indian Chef",
    "Arabic Chef",
    "Chinese Chef",
    "Tandoor Chef",
    "Kitchen Helper",
    "Kitchen Steward",
    "Dishwasher",
    "Butcher",
    "Sandwich Maker",
    "Juice Maker",
    "Restaurant Manager",
    "Assistant Restaurant Manager",
    "Café Manager",
    "Outlet Manager",
    "Floor Supervisor",
    "Captain",
    "Steward",
    "Senior Steward",
    "Host",
    "Hostess",
    "Cashier",
    "Food Runner",
    "Busser",
    "Order Taker",
    "Drive-Thru Staff",
    "Barista",
    "Bartender",
    "Mixologist",
    "Bar Supervisor",
    "Bar Manager",
    "Beverage Manager",
    "Hotel Manager",
    "Front Office Manager",
    "Receptionist",
    "Guest Relations Executive",
    "Bell Boy",
    "Concierge",
    "Reservation Agent",
    "Night Auditor",
    "Housekeeping Supervisor",
    "Housekeeping Staff",
    "Laundry Attendant",
    "Room Attendant",
    "Operations Manager",
    "Area Manager",
    "General Manager",
    "HR Executive",
    "Recruitment Coordinator",
    "Accountant",
    "Purchase Manager",
    "Store Keeper",
    "Inventory Controller",
    "Admin Executive",
    "Delivery Driver",
    "Bike Rider",
    "Dispatch Executive",
    "Warehouse Assistant",
    "Logistics Coordinator",
    "Catering Manager",
    "Banquet Supervisor",
    "Event Coordinator",
    "Banquet Staff",
    "Cleaner",
    "Maintenance Technician",
    "Electrician",
    "Plumber",
    "AC Technician",
    "Security Guard",
    "Other",
  ];

  const currencyOptions = ["SAR", "INR", "USD", "AED"];

  const experienceOptions = [
    "Entry Level (0-2 Years)",
    "Mid Level (3-5 Years)",
    "Senior Level (5+ Years)",
  ];

  const jobTypeOptions = [
    "Full-Time",
    "Part-Time",
    "Contract",
    "Internship",
  ];

  // Helpers for localized display of job type and experience
  const getTranslatedJobType = useCallback((type) => {
    if (!type) return "";
    const lower = type.toLowerCase();
    if (lower.includes("full")) return t("fullTime", "Full-Time");
    if (lower.includes("part")) return t("partTime", "Part-Time");
    if (lower.includes("contract")) return t("contract", "Contract");
    if (lower.includes("intern")) return t("internship", "Internship");
    return type;
  }, [t]);

  const getTranslatedExperience = useCallback((exp) => {
    if (!exp) return "";
    if (exp.includes("0-2")) return t("entryLevelExp", "Entry Level (0-2 Years)");
    if (exp.includes("3-5")) return t("midLevelExp", "Mid Level (3-5 Years)");
    if (exp.includes("5+")) return t("seniorLevelExp", "Senior Level (5+ Years)");
    return exp;
  }, [t]);

  // Helper to extract clean location string from "Primary (Loc)" label
  const getCleanLocationStr = (locLabel) => {
    if (!locLabel) return "";
    const match = locLabel.match(/\(([^)]+)\)/);
    return match ? match[1] : locLabel;
  };

  // Step 1 Validation
  const handleStep1Next = () => {
    if (!selectedLocation) {
      Alert.alert(t("error", "Error"), t("pleaseSelectLocation", "Please select job location."));
      return;
    }
    if (!jobRole) {
      Alert.alert(t("error", "Error"), t("pleaseSelectJobRole", "Please select a job role."));
      return;
    }
    if (jobRole === "Other" && !customRole.trim()) {
      Alert.alert(t("error", "Error"), t("pleaseEnterCustomRole", "Please specify custom job role."));
      return;
    }
    setStep(2);
  };

  // Step 2 Validation
  const handleStep2Next = () => {
    if (!jobType) {
      Alert.alert(t("error", "Error"), t("pleaseSelectJobType", "Please select employment type."));
      return;
    }
    if (!jobDescription.trim()) {
      Alert.alert(t("error", "Error"), t("pleaseEnterJobDescription", "Please enter job description."));
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

  // Step 3 Submission
  const handleSubmitJob = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const cleanLoc = getCleanLocationStr(selectedLocation);
    const combinedSalary = salaryMin && salaryMax
      ? `${salaryCurrency} ${salaryMin} - ${salaryMax}`
      : salaryMin
      ? `${salaryCurrency} ${salaryMin}+`
      : "";

    const finalRole = jobRole === "Other" ? (customRole.trim() || "Other") : jobRole;

    const jobData = {
      title: finalRole || "Hospitality Staff",
      job_role: finalRole,
      industry_segment: businessType,
      company: profile?.business_name || profile?.businessName || profile?.company || "My Company",
      location: cleanLoc,
      salary: combinedSalary,
      salary_min: salaryMin ? parseFloat(salaryMin) || salaryMin : null,
      salary_max: salaryMax ? parseFloat(salaryMax) || salaryMax : null,
      salary_currency: salaryCurrency,
      experience_range: experience,
      job_type: jobType,
      open_positions: parseInt(openPositions, 10) || 1,
      description: jobDescription,
    };

    try {
      const result = await dispatch(storeEmployerJob(jobData));
      if (storeEmployerJob.fulfilled.match(result)) {
        if (route.params?.isOnboarding) {
          await persistEmployerOnboardingComplete();
        }
        goToDashboard();
      } else {
        const serverError = result.payload;
        let errorMessage = t("postJobSubmitFailed", "Failed to submit job posting. Please try again.");
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
        Alert.alert(t("error", "Error"), errorMessage);
      }
    } catch (err) {
      Alert.alert(t("error", "Error"), err.message || t("errorOccurred", "Something went wrong."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedLocation(locationOptions[0] || "");
    setJobCategory("Kitchen, Service, Bar & Beverage, Café");
    setJobRole("Sous Chef");
    setSalaryCurrency("SAR");
    setSalaryMin("");
    setSalaryMax("");
    setExperience("Mid Level (3-5 Years)");
    setOpenPositions("2");
    setJobType("Full-Time");
    setJobDescription("");
    setStep(1);
  };

  // Connected Step Pills Progress Bar
  const renderStepPills = () => {
    const TOTAL_STEPS = 3;
    return (
      <View style={styles.stepPillContainer}>
        {[1, 2, 3].map((stepNum) => {
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <React.Fragment key={`post_job_pill_${stepNum}`}>
              <View
                style={[
                  styles.stepPill,
                  isActive && styles.stepPillActive,
                  isCompleted && styles.stepPillCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.stepPillText,
                    isActive && styles.stepPillTextActive,
                    isCompleted && styles.stepPillTextCompleted,
                  ]}
                >
                  {stepNum}
                </Text>
              </View>
              {stepNum < TOTAL_STEPS && (
                <View
                  style={[
                    styles.stepLine,
                    step > stepNum && styles.stepLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      {/* Top Header — Fixed outside KeyboardAvoidingView */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (step > 1 && step < 4) {
              setStep(step - 1);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={normalize(22)} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("postJobTitle", "Post a Job")}</Text>
        <View style={{ width: normalize(32) }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Pills rendered at top of form */}
          {step < 4 && (
            <View style={styles.topFormStepWrapper}>
              {renderStepPills()}
            </View>
          )}
          {/* STEP 1: JOB DETAILS */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              <Text style={styles.mainSubtitle}>
                {t("postJobStep1Subtitle", "Post your job in just 3 simple steps.")}
              </Text>

              {/* JOB LOCATION */}
              <Text style={styles.sectionHeaderUpper}>{t("jobLocationUpper", "JOB LOCATION")}</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("selectLocation", "Select Location")}<Text style={styles.required}>*</Text>
                </Text>
                <ModalPickerTrigger
                  onPress={() => setShowLocationModal(true)}
                  label={selectedLocation}
                  placeholder={t("selectLocationPlaceholder", "Select Location")}
                  isOpen={showLocationModal}
                  style={styles.inputWrapper}
                />
                <Text style={styles.capturedHint}>
                  {t("capturedFromRegistration", "Captured from your registration")}
                </Text>
                <ModalPicker
                  visible={showLocationModal}
                  onClose={() => setShowLocationModal(false)}
                  title={t("selectLocation", "Select Location")}
                  options={locationOptions}
                  selectedValue={selectedLocation}
                  onSelect={(val) => setSelectedLocation(val)}
                />
              </View>

              {/* BUSINESS TYPE (Read-only) */}
              <Text style={styles.sectionHeaderUpper}>{t("businessTypeUpper", "BUSINESS TYPE")}</Text>
              <View style={styles.inputGroup}>
                <View style={styles.disabledInputCard}>
                  <Text style={styles.disabledInputText}>{businessType}</Text>
                </View>
                <Text style={styles.capturedHint}>
                  {t("capturedFromRegistration", "Captured from your registration")}
                </Text>
              </View>

              {/* JOB ROLE */}
              <Text style={styles.sectionHeaderUpper}>{t("jobRoleUpper", "JOB ROLE")}</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("selectJobRole", "Select or search for the job role")}<Text style={styles.required}>*</Text>
                </Text>
                <ModalPickerTrigger
                  onPress={() => setShowRoleModal(true)}
                  label={jobRole === "Other" && customRole ? `Other: ${customRole}` : jobRole}
                  placeholder={t("selectRolePlaceholder", "Choose Job Role")}
                  isOpen={showRoleModal}
                  style={styles.inputWrapper}
                />
                <Text style={styles.exampleHint}>{t("jobRoleExampleHint", "e.g. Sous Chef, Barista, Waiter")}</Text>
                <ModalPicker
                  visible={showRoleModal}
                  onClose={() => setShowRoleModal(false)}
                  title={t("selectJobRole", "Select or search for the job role")}
                  options={roleOptions}
                  selectedValue={jobRole}
                  onSelect={(val) => {
                    setJobRole(val);
                    if (val !== "Other") {
                      setCustomRole("");
                    }
                  }}
                  searchable
                />
              </View>

              {/* Custom Job Role Input if "Other" is selected */}
              {jobRole === "Other" && (
                <View style={[styles.inputGroup, { marginTop: 4 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.inputLabel}>
                      {t("specifyJobRole", "Specify Job Role")}<Text style={styles.required}>*</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: customRole.length >= 20 ? "#ef4444" : "#64748b" }}>
                      {customRole.length}/20
                    </Text>
                  </View>
                  <View style={[styles.inputWrapper, activeField === "customRole" && styles.inputWrapperActive]}>
                    <TextInput
                      value={customRole}
                      onChangeText={setCustomRole}
                      placeholder={t("enterCustomRolePlaceholder", "e.g. Executive Barista")}
                      placeholderTextColor="#94a3b8"
                      maxLength={20}
                      style={styles.textInput}
                      onFocus={(e) => handleInputFocus(e, "customRole")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>
              )}

              {/* Next Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={handleStep1Next}
              >
                <Text style={styles.primaryButtonText}>{t("next", "Next")} →</Text>
              </TouchableOpacity>

              {/* Bottom Spacer for smooth keyboard scroll */}
              <View style={{ height: 220 }} />
            </View>
          )}

          {/* STEP 2: JOB REQUIREMENTS */}
          {step === 2 && (
            <View style={{ flex: 1 }}>
              <View style={styles.subHeaderRow}>
                <Text style={styles.stepCountText}>{t("step2Of3", "Step 2 of 3")}</Text>
                <Text style={styles.progressHintText}>{t("almostDone50", "You're almost done! 50% complete")}</Text>
              </View>

              <Text style={styles.mainSubtitle}>
                {t("postJobStep2Subtitle", "Add the final details to complete your job posting.")}
              </Text>

              {/* SALARY & EXPERIENCE */}
              <Text style={styles.sectionHeaderUpper}>{t("salaryExperienceUpper", "SALARY & EXPERIENCE")}</Text>

              {/* Salary Range */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("salaryRangeOptional", "Salary Range (Optional)")}</Text>
                <View style={styles.salaryRow}>
                  <View style={styles.currencySelectWrap}>
                    <ModalPickerTrigger
                      onPress={() => setShowCurrencyModal(true)}
                      label={salaryCurrency}
                      placeholder="SAR"
                      isOpen={showCurrencyModal}
                      style={styles.currencyTriggerStyle}
                    />
                  </View>
                  <View style={[styles.salaryInputBox, activeField === "salaryMin" && styles.inputWrapperActive]}>
                    <Text style={styles.salaryInputSmallLabel}>{t("min", "Min")}</Text>
                    <TextInput
                      value={salaryMin}
                      onChangeText={setSalaryMin}
                      placeholder="50000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={styles.salaryTextInput}
                      onFocus={(e) => handleInputFocus(e, "salaryMin")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                  <Text style={styles.salaryDash}>-</Text>
                  <View style={[styles.salaryInputBox, activeField === "salaryMax" && styles.inputWrapperActive]}>
                    <Text style={styles.salaryInputSmallLabel}>{t("max", "Max")}</Text>
                    <TextInput
                      value={salaryMax}
                      onChangeText={setSalaryMax}
                      placeholder="80000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={styles.salaryTextInput}
                      onFocus={(e) => handleInputFocus(e, "salaryMax")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>
                <ModalPicker
                  visible={showCurrencyModal}
                  onClose={() => setShowCurrencyModal(false)}
                  title={t("currency", "Currency")}
                  options={currencyOptions}
                  selectedValue={salaryCurrency}
                  onSelect={(val) => setSalaryCurrency(val)}
                />
              </View>

              {/* Experience Level */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("experienceLevelOptional", "Experience Level (Optional)")}</Text>
                <ModalPickerTrigger
                  onPress={() => setShowExperienceModal(true)}
                  label={getTranslatedExperience(experience)}
                  placeholder={t("selectExperience", "Select Experience")}
                  isOpen={showExperienceModal}
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showExperienceModal}
                  onClose={() => setShowExperienceModal(false)}
                  title={t("experienceLevel", "Experience Level")}
                  options={experienceOptions}
                  selectedValue={experience}
                  renderOption={(opt) => getTranslatedExperience(opt)}
                  onSelect={(val) => setExperience(val)}
                />
              </View>

              {/* Open Positions */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("openPositions", "Open Positions")}</Text>
                <View style={[styles.inputWrapper, activeField === "openPositions" && styles.inputWrapperActive]}>
                  <TextInput
                    value={openPositions}
                    onChangeText={setOpenPositions}
                    placeholder="1"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "openPositions")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* EMPLOYMENT TYPE & DESCRIPTION */}
              <Text style={styles.sectionHeaderUpper}>{t("employmentTypeDescUpper", "EMPLOYMENT TYPE & DESCRIPTION")}</Text>

              {/* Employment Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("employmentType", "Employment Type")}<Text style={styles.required}>*</Text>
                </Text>
                <ModalPickerTrigger
                  onPress={() => setShowJobTypeModal(true)}
                  label={getTranslatedJobType(jobType)}
                  placeholder={t("selectJobType", "Select Employment Type")}
                  isOpen={showJobTypeModal}
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showJobTypeModal}
                  onClose={() => setShowJobTypeModal(false)}
                  title={t("employmentType", "Employment Type")}
                  options={jobTypeOptions}
                  selectedValue={jobType}
                  renderOption={(opt) => getTranslatedJobType(opt)}
                  onSelect={(val) => setJobType(val)}
                />
              </View>

              {/* Job Description */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.inputLabel}>
                    {t("jobDescription", "Job Description")}<Text style={styles.required}>*</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: jobDescription.length >= 150 ? "#ef4444" : "#64748b" }}>
                    {jobDescription.length}/150
                  </Text>
                </View>
                <View style={[styles.textAreaWrapper, activeField === "jobDescription" && styles.inputWrapperActive]}>
                  <TextInput
                    value={jobDescription}
                    onChangeText={setJobDescription}
                    placeholder="We are looking for an experienced Sous Chef to join our team and manage kitchen operations..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    maxLength={150}
                    numberOfLines={4}
                    style={styles.textAreaInput}
                    onFocus={(e) => handleInputFocus(e, "jobDescription")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Tip Info Box */}
              <View style={styles.tipBoxCard}>
                <Ionicons name="bulb-outline" size={22} color={PRIMARY_BLUE} style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.tipBoxText}>
                  {t(
                    "jobDescriptionTip",
                    "Tip: Include key responsibilities, required skills, benefits, and working hours to help attract the right applicants."
                  )}
                </Text>
              </View>

              {/* Nav Buttons */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.backOutlineBtn}
                  activeOpacity={0.8}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.backOutlineText}>← {t("back", "Back")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1, marginTop: 0 }]}
                  activeOpacity={0.85}
                  onPress={handleStep2Next}
                >
                  <Text style={styles.primaryButtonText}>{t("next", "Next")} →</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Spacer for smooth keyboard scroll */}
              <View style={{ height: 220 }} />
            </View>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 3 && (
            <View style={{ flex: 1 }}>
              {/* Completion Pill Banner */}
              <View style={styles.completionBanner}>
                <Text style={styles.completionBannerText}>
                  {t("almostThere100", "Almost there! 100% complete 🎉")}
                </Text>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.mainTitle}>{t("step3ReadyToSubmit", "Step 3 — Ready to Submit?")}</Text>
              <Text style={styles.mainSubtitle}>
                {t("reviewDetailsBeforeSubmit", "Review your job details before sending for approval.")}
              </Text>

              <Text style={styles.sectionHeaderUpper}>{t("quickReviewUpper", "QUICK REVIEW")}</Text>

              {/* Quick Review Card */}
              <View style={styles.reviewCard}>
                {/* Header Row */}
                <View style={styles.reviewCardHeader}>
                  <View style={styles.reviewRoleIconCircle}>
                    <Ionicons name="briefcase-outline" size={24} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.reviewRoleTitle}>{effectiveJobRole || t("jobRole", "Job Role")}</Text>
                  </View>
                </View>

                {/* 3 Columns Grid */}
                <View style={styles.threeColGrid}>
                  {/* Col 1: Location */}
                  <View style={styles.gridCol}>
                    <View style={[styles.gridIconCircle, { backgroundColor: "#eff6ff" }]}>
                      <Ionicons name="location-outline" size={18} color="#2563eb" />
                    </View>
                    <Text style={styles.gridLabel}>{t("location", "Location")}</Text>
                    <Text style={styles.gridValue} numberOfLines={2}>
                      {getCleanLocationStr(selectedLocation) || "Riyadh, Central, Saudi Arabia"}
                    </Text>
                  </View>

                  <View style={styles.gridColDivider} />

                  {/* Col 2: Business Type */}
                  <View style={styles.gridCol}>
                    <View style={[styles.gridIconCircle, { backgroundColor: "#fff7ed" }]}>
                      <Ionicons name="business-outline" size={18} color="#ea580c" />
                    </View>
                    <Text style={styles.gridLabel}>{t("businessType", "Business Type")}</Text>
                    <Text style={styles.gridValue} numberOfLines={2}>
                      {businessType || "Café"}
                    </Text>
                  </View>

                  <View style={styles.gridColDivider} />

                  {/* Col 3: Employment Type */}
                  <View style={styles.gridCol}>
                    <View style={[styles.gridIconCircle, { backgroundColor: "#f0fdf4" }]}>
                      <Ionicons name="briefcase-outline" size={18} color="#16a34a" />
                    </View>
                    <Text style={styles.gridLabel}>{t("employmentType", "Employment Type")}</Text>
                    <Text style={styles.gridValue} numberOfLines={2}>
                      {getTranslatedJobType(jobType) || t("fullTime", "Full-Time")}
                    </Text>
                  </View>
                </View>

                <View style={styles.reviewDivider} />

                {/* Info List Rows */}
                <View style={styles.reviewListRow}>
                  <View style={styles.reviewListLeft}>
                    <Ionicons name="cash-outline" size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                    <Text style={styles.reviewListLabel}>{t("salaryRange", "Salary Range")}</Text>
                  </View>
                  <Text style={styles.reviewListValue}>
                    {salaryMin && salaryMax
                      ? `${salaryCurrency} ${parseFloat(salaryMin).toLocaleString()} - ${parseFloat(salaryMax).toLocaleString()}`
                      : salaryMin
                      ? `${salaryCurrency} ${parseFloat(salaryMin).toLocaleString()}+`
                      : t("notSpecified", "Not Specified")}
                  </Text>
                </View>

                <View style={styles.reviewListRow}>
                  <View style={styles.reviewListLeft}>
                    <Ionicons name="star-outline" size={18} color="#f59e0b" style={{ marginRight: 10 }} />
                    <Text style={styles.reviewListLabel}>{t("experienceLevel", "Experience Level")}</Text>
                  </View>
                  <Text style={styles.reviewListValue}>{getTranslatedExperience(experience) || t("midLevelExp", "Mid Level (3-5 Years)")}</Text>
                </View>

                <View style={styles.reviewListRow}>
                  <View style={styles.reviewListLeft}>
                    <Ionicons name="people-outline" size={18} color="#8b5cf6" style={{ marginRight: 10 }} />
                    <Text style={styles.reviewListLabel}>{t("openPositions", "Open Positions")}</Text>
                  </View>
                  <Text style={styles.reviewListValue}>{openPositions || "1"}</Text>
                </View>

                <View style={styles.reviewDivider} />

                {/* Description Block */}
                <View style={styles.reviewDescHeaderRow}>
                  <View style={[styles.gridIconCircle, { backgroundColor: "#eff6ff", width: 28, height: 28, borderRadius: 14 }]}>
                    <Ionicons name="document-text-outline" size={16} color="#2563eb" />
                  </View>
                  <Text style={styles.reviewDescTitle}>{t("jobDescription", "Job Description")}</Text>
                </View>

                <Text style={styles.reviewDescBody}>
                  {jobDescription ||
                    "We are looking for an experienced Sous Chef to join our team and manage kitchen operations. The ideal candidate should have strong culinary skills, leadership abilities, and a passion for delivering quality food."}
                </Text>
              </View>

              {/* Posting Tip Info Box */}
              <View style={styles.postingTipBox}>
                <View style={styles.tipIconCircle}>
                  <Ionicons name="bulb-outline" size={18} color="#2563eb" />
                </View>
                <Text style={styles.postingTipText}>
                  {t(
                    "postingTipBanner",
                    "Posting Tip: Once approved, your job will be published and matching Talent will be notified. Track applications from your Hiring Dashboard."
                  )}
                </Text>
              </View>

              {/* Bottom Action Buttons */}
              <TouchableOpacity
                style={styles.submitApprovalButton}
                activeOpacity={0.85}
                onPress={handleSubmitJob}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitApprovalButtonText}>
                    {t("submitForApproval", "Submit for Approval")} →
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToEditButton}
                activeOpacity={0.7}
                onPress={() => setStep(2)}
                disabled={isSubmitting}
              >
                <Text style={styles.backToEditButtonText}>{t("backToEdit", "Back to Edit")}</Text>
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
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  backBtn: {
    padding: normalize(4),
  },
  topFormStepWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize(4),
    marginBottom: normalize(12),
  },
  stepPillContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepPill: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepPillActive: {
    backgroundColor: PRIMARY_NAVY,
  },
  stepPillCompleted: {
    backgroundColor: "#16a34a",
  },
  stepPillText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#64748b",
  },
  stepPillTextActive: {
    color: "#ffffff",
  },
  stepPillTextCompleted: {
    color: "#ffffff",
  },
  stepLine: {
    width: normalize(24),
    height: 2,
    backgroundColor: "#e2e8f0",
    marginHorizontal: normalize(4),
  },
  stepLineCompleted: {
    backgroundColor: "#16a34a",
  },
  scrollContent: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(10),
    paddingBottom: normalize(40),
  },
  stepCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    padding: normalize(16),
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(6),
  },
  stepCountText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: PRIMARY_NAVY,
  },
  progressHintText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: PRIMARY_BLUE,
  },
  mainTitle: {
    fontSize: normalize(20),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(4),
  },
  mainSubtitle: {
    fontSize: normalize(13),
    color: "#64748b",
    marginBottom: normalize(16),
  },
  sectionHeaderUpper: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: PRIMARY_NAVY,
    letterSpacing: 0.8,
    marginTop: normalize(10),
    marginBottom: normalize(8),
  },
  inputGroup: {
    marginBottom: normalize(14),
  },
  inputLabel: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: normalize(5),
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    height: normalize(46),
    paddingHorizontal: normalize(12),
    justifyContent: "center",
  },
  inputWrapperActive: {
    borderColor: PRIMARY_NAVY,
    borderWidth: 1.5,
  },
  disabledInputCard: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(12),
    height: normalize(46),
    paddingHorizontal: normalize(12),
    justifyContent: "center",
  },
  disabledInputText: {
    fontSize: normalize(13),
    fontWeight: "600",
    color: "#475569",
  },
  textInput: {
    fontSize: normalize(13),
    color: "#0f172a",
    padding: 0,
  },
  capturedHint: {
    fontSize: normalize(10.5),
    color: "#94a3b8",
    marginTop: normalize(3),
  },
  exampleHint: {
    fontSize: normalize(10.5),
    color: "#64748b",
    marginTop: normalize(3),
  },
  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySelectWrap: {
    width: normalize(72),
    marginRight: normalize(6),
  },
  currencyTriggerStyle: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    height: normalize(46),
    paddingHorizontal: normalize(6),
    justifyContent: "center",
  },
  salaryInputBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    height: normalize(46),
    paddingHorizontal: normalize(8),
    justifyContent: "center",
  },
  salaryInputSmallLabel: {
    fontSize: normalize(9.5),
    color: "#94a3b8",
  },
  salaryTextInput: {
    fontSize: normalize(12.5),
    fontWeight: "600",
    color: "#0f172a",
    padding: 0,
  },
  salaryDash: {
    fontSize: normalize(14),
    color: "#94a3b8",
    marginHorizontal: normalize(4),
  },
  textAreaWrapper: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    padding: normalize(10),
    minHeight: normalize(100),
  },
  textAreaInput: {
    fontSize: normalize(13),
    color: "#0f172a",
    textAlignVertical: "top",
    padding: 0,
  },
  tipBoxCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: normalize(12),
    padding: normalize(12),
    marginBottom: normalize(16),
  },
  tipBoxText: {
    flex: 1,
    fontSize: normalize(11),
    color: "#1e3a8a",
    lineHeight: normalize(16),
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(8),
  },
  backOutlineBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    height: normalize(46),
    paddingHorizontal: normalize(16),
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(8),
  },
  backOutlineText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#475569",
  },
  primaryButton: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: normalize(12),
    height: normalize(46),
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize(12),
  },
  primaryButtonText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#ffffff",
  },

  // Step 3 Review Styles
  completionBanner: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: normalize(12),
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(14),
    alignItems: "center",
    marginBottom: normalize(14),
  },
  completionBannerText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#15803d",
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    padding: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
    marginBottom: normalize(14),
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(14),
  },
  reviewRoleIconCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewRoleTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  reviewRoleCategory: {
    fontSize: normalize(12),
    color: "#64748b",
    marginTop: 2,
  },
  threeColGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: normalize(12),
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(4),
    marginBottom: normalize(12),
  },
  gridCol: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: normalize(2),
  },
  gridColDivider: {
    width: 1,
    height: normalize(34),
    backgroundColor: "#e2e8f0",
  },
  gridIconCircle: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(4),
  },
  gridLabel: {
    fontSize: normalize(10),
    color: "#64748b",
    marginBottom: 2,
  },
  gridValue: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  reviewDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: normalize(10),
  },
  reviewListRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: normalize(6),
  },
  reviewListLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewListLabel: {
    fontSize: normalize(12),
    color: "#475569",
    fontWeight: "500",
  },
  reviewListValue: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: "#0f172a",
  },
  reviewDescHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(6),
  },
  reviewDescTitle: {
    fontSize: normalize(13),
    fontWeight: "800",
    color: "#0f172a",
    marginLeft: normalize(6),
  },
  reviewDescBody: {
    fontSize: normalize(12),
    color: "#475569",
    lineHeight: normalize(18),
  },
  postingTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: normalize(12),
    padding: normalize(12),
    marginBottom: normalize(16),
  },
  tipIconCircle: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(8),
  },
  postingTipText: {
    flex: 1,
    fontSize: normalize(11),
    color: "#1e40af",
    lineHeight: normalize(16),
  },
  submitApprovalButton: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: normalize(12),
    height: normalize(46),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(8),
  },
  submitApprovalButtonText: {
    fontSize: normalize(15),
    fontWeight: "700",
    color: "#ffffff",
  },
  backToEditButton: {
    paddingVertical: normalize(10),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(16),
  },
  backToEditButtonText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: PRIMARY_BLUE,
  },

  // Success Screen Styles
  successContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  successBadgeOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successBadgeInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  whatsNextCard: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
  },
  whatsNextTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: PRIMARY_NAVY,
    marginBottom: 12,
  },
  whatsNextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  whatsNextText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
    lineHeight: 18,
  },
  postAnotherBtn: {
    marginTop: 16,
    paddingVertical: 10,
  },
  postAnotherBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY_BLUE,
  },
});
