import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  PixelRatio,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { fetchEmployerDashboard } from "../../redux/slices/employerSlice";
import { createJobPost, fetchMyJobs } from "../../redux/slices/jobSlice";
import colors from "../../constants/colors";
import ModalPicker, {
  ModalPickerTrigger,
} from "../../components/common/ModalPicker";
import indianStatesCities from "../../data/indianStatesCities.json";
import countryData from "../../data/countryStateCityData.json";

const stateOptions = Object.keys(indianStatesCities);
const allCitiesList = Array.from(new Set(Object.values(indianStatesCities).flat()));

import useKeyboardAwareScroll from "../../hooks/useKeyboardAwareScroll";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_GREEN = "#153e69";
const { width } = Dimensions.get("window");

export default function PostReferralJobScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole,
  );

  const { scrollViewRef, handleInputFocus: scrollInputFocus } = useKeyboardAwareScroll({ extraOffset: 30 });

  const handleInputFocus = (e, fieldName) => {
    if (fieldName) setActiveField(fieldName);
    scrollInputFocus(e);
  };

  const [step, setStep] = useState(1); // 1: Business Basics, 2: Job Details, 3: Contact & Extras, 4: Success
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeField, setActiveField] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step > 1 && step < 4) {
          setStep((prev) => prev - 1);
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [step])
  );

  const handleDismissSuccessModal = () => {
    setShowSuccessModal(false);
    handleReset();
    dispatch(fetchEmployerDashboard());
    dispatch(fetchMyJobs());
    if (typeof navigation.replace === "function") {
      navigation.replace("MyJobs", { activeTab: "pending" });
    } else {
      navigation.navigate("MyJobs", { activeTab: "pending" });
    }
  };

  // Form Fields
  const [category, setCategory] = useState("India"); // "India", "KSA", "Dubai"
  const [title, setTitle] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [company, setCompany] = useState("");

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
  const [contactInfo, setContactInfo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneDialCode, setPhoneDialCode] = useState("🇮🇳 +91");
  const [showDialCodeModal, setShowDialCodeModal] = useState(false);
  const dialCodeOptions = ["🇮🇳 +91", "🇸🇦 +966"];

  useEffect(() => {
    if (category === "KSA" || category === "Saudi Arabia") {
      setPhoneDialCode("🇸🇦 +966");
    } else {
      setPhoneDialCode("🇮🇳 +91");
    }
  }, [category]);
  const [emailAddress, setEmailAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [description, setDescription] = useState("");

  // Optional Fields
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("INR");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [location, setLocation] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [jobType, setJobType] = useState("Full-time");
  const [experienceRange, setExperienceRange] = useState(
    "Mid-Level (3-5 years)",
  );
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [openPositions, setOpenPositions] = useState("1");

  // Overseas Specific Fields
  const [country, setCountry] = useState("");
  const [visaAssistance, setVisaAssistance] = useState(false);
  const [accommodationAvailable, setAccommodationAvailable] = useState(false);
  const [contractDuration, setContractDuration] = useState("");

  // Referral Fields
  const [isReferral, setIsReferral] = useState(true); // Default true for this page
  const [submittedByRole, setSubmittedByRole] = useState("jobseeker");

  // Dropdown visibility
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { label: t("regions.india", "India"), value: "India" },
    { label: t("regions.ksa", "KSA"), value: "KSA" },
    { label: t("regions.dubai", "Dubai"), value: "Dubai" },
  ];

  const jobTypeOptions = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Freelance",
  ];

  const experienceOptions = [
    "Entry Level (0-2 years)",
    "Mid-Level (3-5 years)",
    "Senior (5+ and above)",
  ];

  const submittedByRoleOptions = [
    { label: "Job Seeker", value: "jobseeker" },
    { label: "Chef", value: "chef" },
    { label: "Employer", value: "employer" },
    { label: "Agency", value: "agency" },
  ];

  const getRegionLabel = (r) => {
    switch (r) {
      case "India":
        return t("regions.india", "India");
      case "KSA":
        return t("regions.ksa", "KSA");
      case "Dubai":
        return t("regions.dubai", "Dubai");
      default:
        return r;
    }
  };

  const getExperienceLabel = (opt) => {
    if (opt.startsWith("Entry"))
      return t("experience.entry", "Entry Level (0-2 years)");
    if (opt.startsWith("Mid"))
      return t("experience.mid", "Mid-Level (3-5 years)");
    if (opt.startsWith("Senior"))
      return t("experience.senior", "Senior (5+ and above)");
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

  // Autofill fields from user profile if available
  useEffect(() => {
    if (profile) {
      if (!company) {
        setCompany(profile.businessName || profile.company || "");
      }
      if (!contactInfo) {
        setContactInfo(profile.email || profile.phone || "");
      }
      if (!phoneNumber) {
        setPhoneNumber(profile.phone || "");
      }
      if (!emailAddress) {
        setEmailAddress(profile.email || "");
      }
      if (!contactPerson) {
        setContactPerson(profile.name || profile.full_name || "");
      }
    }
  }, [profile]);

  // Autofill role
  useEffect(() => {
    if (activeRole) {
      const normalized = activeRole
        .toLowerCase()
        .replace(" ", "")
        .replace("_", "");
      if (normalized === "chef") {
        setSubmittedByRole("chef");
      } else if (normalized === "jobseeker" || normalized === "job_seeker") {
        setSubmittedByRole("jobseeker");
      } else if (normalized === "employer") {
        setSubmittedByRole("employer");
      } else {
        setSubmittedByRole("jobseeker");
      }
    }
  }, [activeRole]);

  const handleNextStep1 = () => {
    if (!company.trim()) {
      Alert.alert(t("error"), t("postJob.businessNameRequired", "Please enter a Business Name."));
      return;
    }
    if (!category) {
      Alert.alert(t("error"), t("postJob.countryRequired", "Please select a Country."));
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
    if (!contactPerson.trim()) {
      Alert.alert(t("error"), t("postJob.contactPersonRequired", "Please enter a Contact Person Name."));
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert(t("error"), t("postJob.phoneRequired", "Please enter a Phone Number."));
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!title.trim()) {
      Alert.alert(
        t("error"),
        t("postJob.pleaseSelectJobRole", "Please select a Job Role."),
      );
      return;
    }
    if (title === "Other" && !customRole.trim()) {
      Alert.alert(
        t("error"),
        t("postJob.pleaseEnterCustomRole", "Please specify custom job role."),
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert(
        t("error"),
        t("postJob.descriptionRequired", "Please enter a Job Description."),
      );
      return;
    }
    setStep(3);
  };

  const handleSubmitJob = async () => {
    if (isSubmitting) return; // duplicate tap block

    if (!phoneNumber.trim()) {
      Alert.alert(t("error"), "Phone number is required.");
      return;
    }
    if (category === "overseas" && !country.trim()) {
      Alert.alert(
        t("error"),
        t(
          "postJob.countryRequired",
          "Country is required when category is Overseas.",
        ),
      );
      return;
    }

    setIsSubmitting(true);

    const requirementsArray = requirements
      ? requirements
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
      : null;
    const benefitsArray = benefits
      ? benefits
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
      : null;

    const combinedContact = emailAddress.trim()
      ? `Phone: ${phoneNumber.trim()} | Email: ${emailAddress.trim()}`
      : `Phone: ${phoneNumber.trim()}`;

    const combinedSalary =
      salaryMin && salaryMax
        ? `${salaryCurrency} ${salaryMin} - ${salaryMax}`
        : salaryMin
          ? `${salaryCurrency} ${salaryMin}+`
          : "";

    const finalLocation = selectedCity && selectedState
      ? `${selectedCity}, ${selectedState}`
      : selectedState || selectedCity || location.trim() || "";

    const jobData = {
      title,
      category: category.toLowerCase(),
      company,
      contact_info: combinedContact,
      description,
      salary: combinedSalary || null,
      salary_min: salaryMin ? parseFloat(salaryMin) || salaryMin : null,
      salary_max: salaryMax ? parseFloat(salaryMax) || salaryMax : null,
      salary_currency: salaryCurrency,
      location: finalLocation,
      state: selectedState || null,
      city: selectedCity || null,
      job_type: jobType,
      experience_range: experienceRange,
      requirements: requirementsArray,
      benefits: benefitsArray,
      open_positions: parseInt(openPositions, 10) || null,
      is_referral: isReferral,
      submitted_by_role: submittedByRole,
      contact_person: contactPerson,
    };

    if (category === "KSA" || category === "Dubai") {
      jobData.country = country.trim();
      jobData.visa_assistance = visaAssistance;
      jobData.accommodation_available = accommodationAvailable;
      jobData.contract_duration = contractDuration.trim() || null;
    }

    const payload = Object.keys(jobData).reduce((acc, key) => {
      if (
        jobData[key] !== "" &&
        jobData[key] !== null &&
        jobData[key] !== undefined
      ) {
        acc[key] = jobData[key];
      }
      return acc;
    }, {});

    try {
      console.log("Posting job payload:", payload);
      const result = await dispatch(createJobPost(payload));

      if (createJobPost.fulfilled.match(result)) {
        setShowSuccessModal(true);
      } else {
        const serverError = result.payload;
        let errorMessage = t(
          "postJob.submitFailed",
          "Failed to submit job posting. Please try again.",
        );
        if (serverError && typeof serverError === "object") {
          if (serverError.errors && typeof serverError.errors === "object") {
            errorMessage = Object.entries(serverError.errors)
              .map(
                ([key, val]) =>
                  `${key}: ${Array.isArray(val) ? val.join(" ") : val}`,
              )
              .join("\n");
          } else if (serverError.message) {
            errorMessage = serverError.message;
          }
          if (serverError.status) {
            errorMessage = `(${serverError.status}) ` + errorMessage;
          }
        } else if (typeof serverError === "string") {
          errorMessage = serverError;
        }
        console.error("Job post failed - action result:", result);
        Alert.alert(t("error"), errorMessage);
      }
    } catch (err) {
      Alert.alert(
        t("error"),
        err.message || t("postJob.errorOccurred", "Something went wrong."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setCompany("");
    setContactInfo("");
    setDescription("");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("INR");
    setLocation("");
    setJobType("Full-time");
    setExperienceRange("Mid-Level (3-5 years)");
    setRequirements("");
    setBenefits("");
    setOpenPositions("1");
    setCategory("India");
    setCountry("");
    setVisaAssistance(false);
    setAccommodationAvailable(false);
    setContractDuration("");
    setIsReferral(true);
    setStep(1);
  };

  // Connected Step Pills Progress Bar (Matching PostJobScreen)
  const renderStepPills = () => {
    const TOTAL_STEPS = 3;
    return (
      <View style={styles.stepPillContainer}>
        {[1, 2, 3].map((stepNum) => {
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <React.Fragment key={`post_referral_pill_${stepNum}`}>
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
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
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

        <Text style={styles.headerTitle}>
          {t("postReferralJobTitle", "Post a Referral Job")}
        </Text>
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
          {/* STEP 1: BUSINESS & CONTACT INFO */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.subHeaderRow}>
                <Text style={styles.stepCountText}>{t("step1Of3", "Step 1 of 3")}</Text>
                <Text style={styles.progressHintText}>{t("start0", "0% complete")}</Text>
              </View>

              <Text style={styles.mainSubtitle}>
                {t("postJobStep1Subtitle", "Post your job in just 3 simple steps.")}
              </Text>

              {/* BASIC INFORMATION */}
              <Text style={styles.sectionHeaderUpper}>{t("basicInformationUpper", "BUSINESS & CONTACT INFO")}</Text>

              {/* Fields Card */}
              <View style={styles.fieldsCard}>
                {/* 1. Business Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.businessName", "Business Name")}<Text style={styles.required}> *</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "company" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={company}
                      onChangeText={setCompany}
                      placeholder={t(
                        "postJob.businessNamePlaceholder",
                        "e.g. The Grand Bistro",
                      )}
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={(e) => handleInputFocus(e, "company")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* 2. Location (Country, State & City in 1 Row) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.location", "Location")}<Text style={styles.required}> *</Text>
                  </Text>

                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {/* Country Dropdown */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>
                        {t("selectCountry", "Country")}<Text style={styles.required}> *</Text>
                      </Text>
                      <ModalPickerTrigger
                        onPress={() => setShowCountryModal(true)}
                        label={
                          category === "KSA" || category === "Saudi Arabia"
                            ? t("regions.saudiArabia", "Saudi Arabia")
                            : t("regions.india", "India")
                        }
                        placeholder={t("selectCountry", "Country")}
                        isOpen={showCountryModal}
                        style={styles.inputWrapper}
                      />
                      <ModalPicker
                        visible={showCountryModal}
                        onClose={() => setShowCountryModal(false)}
                        title={t("selectCountry", "Select Country")}
                        options={["India", "Saudi Arabia"]}
                        selectedValue={category === "KSA" ? "Saudi Arabia" : category}
                        onSelect={(val) => {
                          const newCat = val === "Saudi Arabia" ? "KSA" : val;
                          if (category !== newCat) {
                            setCategory(newCat);
                            setSelectedState("");
                            setSelectedCity("");
                          }
                        }}
                      />
                    </View>

                    {/* State Dropdown */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>
                        {t("selectState", "State")}<Text style={styles.required}> *</Text>
                      </Text>
                      <ModalPickerTrigger
                        onPress={() => setShowStateModal(true)}
                        label={selectedState}
                        placeholder={t("selectState", "State")}
                        isOpen={showStateModal}
                        style={styles.inputWrapper}
                      />
                      <ModalPicker
                        visible={showStateModal}
                        onClose={() => setShowStateModal(false)}
                        title={t("selectState", "Select State")}
                        options={
                          countryData[category === "KSA" || category === "Saudi Arabia" ? "Saudi Arabia" : "India"]
                            ? Object.keys(countryData[category === "KSA" || category === "Saudi Arabia" ? "Saudi Arabia" : "India"])
                            : []
                        }
                        selectedValue={selectedState}
                        onSelect={(val) => {
                          setSelectedState(val);
                          const cMap = countryData[category === "KSA" || category === "Saudi Arabia" ? "Saudi Arabia" : "India"] || {};
                          if (selectedCity && cMap[val] && !cMap[val].includes(selectedCity)) {
                            setSelectedCity("");
                          }
                        }}
                        searchable={true}
                        searchPlaceholder={t("searchState", "Search State...")}
                      />
                    </View>

                    {/* City Dropdown */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>
                        {t("selectCity", "City")}<Text style={styles.required}> *</Text>
                      </Text>
                      <ModalPickerTrigger
                        onPress={() => setShowCityModal(true)}
                        label={selectedCity}
                        placeholder={t("selectCity", "City")}
                        isOpen={showCityModal}
                        style={styles.inputWrapper}
                      />
                      <ModalPicker
                        visible={showCityModal}
                        onClose={() => setShowCityModal(false)}
                        title={t("selectCity", "Select City")}
                        options={(() => {
                          const cMap = countryData[category === "KSA" || category === "Saudi Arabia" ? "Saudi Arabia" : "India"] || {};
                          if (selectedState && cMap[selectedState]) {
                            return cMap[selectedState];
                          }
                          return Array.from(new Set(Object.values(cMap).flat()));
                        })()}
                        selectedValue={selectedCity}
                        onSelect={(val) => {
                          setSelectedCity(val);
                          const cMap = countryData[category === "KSA" || category === "Saudi Arabia" ? "Saudi Arabia" : "India"] || {};
                          if (!selectedState) {
                            const foundState = Object.keys(cMap).find((st) => cMap[st].includes(val));
                            if (foundState) setSelectedState(foundState);
                          }
                        }}
                        searchable={true}
                        searchPlaceholder={t("searchCity", "Search City...")}
                      />
                    </View>
                  </View>
                </View>

                {/* 3. Contact Person Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.contactPerson", "Contact Person Name")}<Text style={styles.required}> *</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "contactPerson" &&
                        styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={contactPerson}
                      onChangeText={setContactPerson}
                      placeholder={t(
                        "postJob.contactPersonPlaceholder",
                        "Full name of hiring manager",
                      )}
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={(e) => handleInputFocus(e, "contactPerson")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* 4. Phone Number with Country Code Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.phoneNumber", "Phone Number")}<Text style={styles.required}> *</Text>
                  </Text>
                  <View style={styles.salaryRow}>
                    {/* Dial Code Dropdown Trigger */}
                    <View style={styles.currencySelectWrap}>
                      <ModalPickerTrigger
                        onPress={() => setShowDialCodeModal(true)}
                        label={phoneDialCode}
                        isOpen={showDialCodeModal}
                        style={styles.currencyTriggerStyle}
                      />
                      <ModalPicker
                        visible={showDialCodeModal}
                        onClose={() => setShowDialCodeModal(false)}
                        title={t("selectCountryCode", "Select Code")}
                        options={dialCodeOptions}
                        selectedValue={phoneDialCode}
                        onSelect={(val) => setPhoneDialCode(val)}
                      />
                    </View>

                    {/* Phone Input Box */}
                    <View
                      style={[
                        styles.salaryInputBox,
                        activeField === "phone" && styles.inputWrapperActive,
                      ]}
                    >
                      <TextInput
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder={t(
                          "postJob.phonePlaceholder",
                          "9876543210",
                        )}
                        placeholderTextColor="rgba(10, 5, 4, 0.4)"
                        style={styles.textInput}
                        keyboardType="phone-pad"
                        maxLength={15}
                        onFocus={(e) => handleInputFocus(e, "phone")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>

                  {/* Verified Text below Phone Field */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Text style={{ fontSize: normalize(12), fontWeight: "700", color: "#16a34a" }}>
                      {t("verified", "Verified")}
                    </Text>
                    <Ionicons name="checkmark-circle" size={normalize(14)} color="#16a34a" />
                  </View>
                </View>
              </View>

              {/* Footer actions */}
              <View style={[styles.footerContainer, { marginTop: 24 }]}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={handleNextStep1}
                >
                  <Text style={styles.primaryNextBtnText}>
                    {t("postJob.next", "Next")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#ffffff"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: JOB DETAILS */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.subHeaderRow}>
                <Text style={styles.stepCountText}>{t("step2Of3", "Step 2 of 3")}</Text>
                <Text style={styles.progressHintText}>{t("almostDone50", "You're almost done! 50% complete")}</Text>
              </View>

              <Text style={styles.mainSubtitle}>
                {t("postJobStep2Subtitle", "Add the final details to complete your job posting.")}
              </Text>

              {/* SALARY & EXPERIENCE */}
              <Text style={styles.sectionHeaderUpper}>{t("salaryExperienceUpper", "SALARY & EXPERIENCE")}</Text>

              {/* Fields Card */}
              <View style={styles.fieldsCard}>
                {/* 1. Job Role Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.jobRole", "Job Role")}<Text style={styles.required}> *</Text>
                  </Text>
                  <ModalPickerTrigger
                    onPress={() => setShowRoleModal(true)}
                    label={title === "Other" && customRole ? `Other: ${customRole}` : title}
                    placeholder={t("selectRolePlaceholder", "Choose Job Role")}
                    isOpen={showRoleModal}
                    style={styles.inputWrapper}
                  />
                  <Text style={styles.exampleHint}>
                    {t("jobRoleExampleHint", "e.g. Sous Chef, Barista, Waiter")}
                  </Text>
                  <ModalPicker
                    visible={showRoleModal}
                    onClose={() => setShowRoleModal(false)}
                    title={t("selectJobRole", "Select or search for the job role")}
                    options={roleOptions}
                    selectedValue={title}
                    onSelect={(val) => {
                      setTitle(val);
                      if (val !== "Other") {
                        setCustomRole("");
                      }
                    }}
                    searchable
                  />
                </View>

                {/* Custom Role input if "Other" is selected */}
                {title === "Other" && (
                  <View style={[styles.inputGroup, { marginTop: 4 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={styles.inputLabel}>
                        {t("specifyJobRole", "Specify Job Role")}<Text style={styles.required}> *</Text>
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

                {/* Salary Currency & Range Section */}
                <Text style={styles.inputLabel}>
                  {t("postJob.salaryRange", "Salary Range")}
                </Text>

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
                      renderOption={(opt) =>
                        ({
                          INR: "INR (₹)",
                          USD: "USD ($)",
                          SAR: "SAR (SR)",
                          AED: "AED (AED)",
                          EUR: "EUR (€)",
                          GBP: "GBP (£)",
                        })[opt] || opt
                      }
                    />
                  </View>

                  {/* Min Salary */}
                  <View
                    style={{
                      flex: 1,
                      marginRight: 8,
                      position: "relative",
                      zIndex: 20,
                      elevation: 20,
                    }}
                  >
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "salaryMin" &&
                          styles.inputWrapperActive,
                      ]}
                    >
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
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "salaryMax" &&
                          styles.inputWrapperActive,
                      ]}
                    >
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
                  <Text style={styles.inputLabel}>
                    {t("postJob.openPositions", "Open Positions")}
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "openPositions" &&
                        styles.inputWrapperActive,
                    ]}
                  >
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
                  <Text style={styles.inputLabel}>
                    {t("postJob.experienceRequired", "Experience Required")}
                  </Text>
                  <ModalPickerTrigger
                    onPress={() => setShowExpDropdown(true)}
                    label={getExperienceLabel(experienceRange)}
                    isOpen={showExpDropdown}
                    style={styles.inputWrapper}
                  />
                  <ModalPicker
                    visible={showExpDropdown}
                    onClose={() => setShowExpDropdown(false)}
                    title={t(
                      "postJob.experienceRequired",
                      "Experience Required",
                    )}
                    options={experienceOptions}
                    selectedValue={experienceRange}
                    onSelect={(val) => setExperienceRange(val)}
                    renderOption={getExperienceLabel}
                  />
                </View>
              </View>

              {/* EMPLOYMENT TYPE & DESCRIPTION */}
              <Text style={styles.sectionHeaderUpper}>{t("employmentTypeDescUpper", "EMPLOYMENT TYPE & DESCRIPTION")}</Text>

              <View style={styles.fieldsCard}>
                {/* Job Type Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.jobType", "Job Type")}
                  </Text>
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
                <View style={[styles.inputGroup, { marginTop: 8 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.inputLabel}>
                      {t("postJob.jobDescription", "Job Description")}<Text style={styles.required}> *</Text>
                    </Text>
                    <Text style={{ fontSize: normalize(11.5), color: description.length >= 150 ? "#ef4444" : "#64748b" }}>
                      {description.length}/150
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.multilineWrapper,
                      activeField === "description" &&
                        styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t(
                        "postJob.jobDescriptionPlaceholder",
                        "Describe the job role and responsibilities...",
                      )}
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      multiline
                      numberOfLines={4}
                      maxLength={150}
                      style={[styles.textInput, styles.multilineInput]}
                      onFocus={(e) => handleInputFocus(e, "description")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Tip box */}
              <View style={styles.tipBox}>
                <Ionicons
                  name="bulb-outline"
                  size={20}
                  color={PRIMARY_GREEN}
                  style={styles.tipBoxIcon}
                />
                <Text style={styles.tipBoxText}>
                  {t(
                    "postJob.detailedDescTip",
                    "Detailed job descriptions attract qualified applicants. Be sure to mention specific benefits!",
                  )}
                </Text>
              </View>

              {/* Footer actions */}
              <View style={[styles.footerContainer, { marginTop: 24 }]}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={handleNextStep2}
                >
                  <Text style={styles.primaryNextBtnText}>
                    {t("postJob.next", "Next")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#ffffff"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: CONTACT & EXTRAS (REVIEW) */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              {/* Completion Banner */}
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

              {/* Quick Review Header */}
              <Text style={styles.sectionHeaderUpper}>{t("quickReviewUpper", "QUICK REVIEW")}</Text>

              {/* Quick Review Card */}
              <View style={styles.reviewCard}>
                {/* Header Row */}
                <View style={styles.reviewCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewRoleTitle}>{title || t("jobRole", "Job Role")}</Text>
                    {company ? <Text style={styles.reviewCompanySub}>{company}</Text> : null}
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
                      {selectedCity && selectedState ? `${selectedCity}, ${selectedState}` : selectedState || selectedCity || (category === "KSA" ? "Saudi Arabia" : "India")}
                    </Text>
                  </View>

                  <View style={styles.gridColDivider} />

                  {/* Col 2: Contact Person */}
                  <View style={styles.gridCol}>
                    <View style={[styles.gridIconCircle, { backgroundColor: "#fff7ed" }]}>
                      <Ionicons name="person-outline" size={18} color="#ea580c" />
                    </View>
                    <Text style={styles.gridLabel}>{t("contactPerson", "Contact")}</Text>
                    <Text style={styles.gridValue} numberOfLines={2}>
                      {contactPerson || "Manager"}
                    </Text>
                  </View>

                  <View style={styles.gridColDivider} />

                  {/* Col 3: Employment Type */}
                  <View style={styles.gridCol}>
                    <View style={[styles.gridIconCircle, { backgroundColor: "#f0fdf4" }]}>
                      <Ionicons name="briefcase-outline" size={18} color="#16a34a" />
                    </View>
                    <Text style={styles.gridLabel}>{t("employmentType", "Job Type")}</Text>
                    <Text style={styles.gridValue} numberOfLines={2}>
                      {jobType || "Full-Time"}
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
                    <Ionicons name="call-outline" size={18} color="#10b981" style={{ marginRight: 10 }} />
                    <Text style={styles.reviewListLabel}>{t("phoneNumber", "Phone Number")}</Text>
                  </View>
                  <Text style={styles.reviewListValue}>{phoneDialCode} {phoneNumber}</Text>
                </View>

                <View style={styles.reviewListRow}>
                  <View style={styles.reviewListLeft}>
                    <Ionicons name="star-outline" size={18} color="#f59e0b" style={{ marginRight: 10 }} />
                    <Text style={styles.reviewListLabel}>{t("experienceLevel", "Experience Level")}</Text>
                  </View>
                  <Text style={styles.reviewListValue}>{experienceRange || "Mid Level"}</Text>
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
                  {description.trim() || "No description provided."}
                </Text>
              </View>

              {/* Submit Approval Button */}
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
            </View>
          )}

          {/* SUCCESS MODAL */}
          <Modal
            visible={showSuccessModal}
            transparent={true}
            animationType="fade"
            onRequestClose={handleDismissSuccessModal}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                {/* Checkmark Circle */}
                <View style={styles.successIconOuter}>
                  <View style={styles.successIconInner}>
                    <View style={styles.successIconCore}>
                      <Ionicons name="checkmark" size={48} color="#ffffff" />
                    </View>
                  </View>
                </View>

                <Text style={styles.modalSuccessTitle}>
                  {t("postJob.successTitle", "🎉 Job Submitted Successfully")}
                </Text>

                <Text style={styles.modalSuccessMessage}>
                  {t(
                    "postJob.successMessage",
                    "Your job has been submitted for admin review. Once approved, it will be published in the community feed.",
                  )}
                </Text>

                <TouchableOpacity
                  style={styles.modalOkBtn}
                  activeOpacity={0.8}
                  onPress={handleDismissSuccessModal}
                >
                  <Text style={styles.modalOkBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
    backgroundColor: PRIMARY_GREEN,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(14),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: {
    padding: normalize(4),
  },
  headerTitle: {
    fontSize: normalize(18),
    fontWeight: "800",
    color: "#0f172a",
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
    backgroundColor: "rgba(21, 62, 105, 0.08)",
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
    fontWeight: "700",
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
  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySelectWrap: {
    width: normalize(92),
    marginRight: normalize(8),
  },
  currencyTriggerStyle: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: normalize(8),
    justifyContent: "center",
  },
  salaryInputBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  capturedHint: {
    fontSize: normalize(11),
    color: "#64748b",
    marginTop: normalize(4),
  },
  exampleHint: {
    fontSize: normalize(10.5),
    color: "#64748b",
    marginTop: normalize(3),
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
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(6),
  },
  stepCountText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  progressHintText: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#1860f0",
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
  sectionHeaderUpper: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: PRIMARY_GREEN,
    letterSpacing: 0.8,
    marginTop: normalize(10),
    marginBottom: normalize(8),
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(16),
    padding: normalize(14),
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: normalize(16),
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(10),
  },
  reviewRoleTitle: {
    fontSize: normalize(17),
    fontWeight: "800",
    color: "#0f172a",
  },
  reviewCompanySub: {
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
    backgroundColor: PRIMARY_GREEN,
    borderRadius: normalize(12),
    height: normalize(46),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(16),
  },
  submitApprovalButtonText: {
    fontSize: normalize(15),
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
    justifyContent: "space-between",
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
  step3BannerBox: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 16,
    marginBottom: 20,
  },
  step3BannerText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 20,
    fontWeight: "500",
  },
  step3InputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 8,
  },
  step3InputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#ffffff",
  },
  step3InputWrapperActive: {
    borderColor: PRIMARY_GREEN,
  },
  step3InputIcon: {
    marginRight: 10,
  },
  step3TextInputField: {
    flex: 1,
    fontSize: 15,
    color: "#0a0504",
    fontWeight: "500",
  },
  step3InputNote: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 6,
  },
  step3ReviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  step3ReviewIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  step3SubmitBtn: {
    backgroundColor: PRIMARY_GREEN,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 24,
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  step3SubmitBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  step3BackBtn: {
    alignSelf: "center",
    paddingVertical: 14,
    marginTop: 12,
  },
  step3BackBtnText: {
    color: PRIMARY_GREEN,
    fontSize: 15,
    fontWeight: "700",
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
    marginLeft: 10,
  },
  successIconOuter: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(242, 200, 121, 0.15)",
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
  infoBoxSub: {
    fontSize: 10,
    color: "rgba(10, 5, 4, 0.4)",
    marginTop: 4,
    fontWeight: "500",
  },
  floatingHelpBtn: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalSuccessTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0a0504",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  modalSuccessMessage: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalOkBtn: {
    backgroundColor: PRIMARY_GREEN,
    width: "100%",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOkBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
