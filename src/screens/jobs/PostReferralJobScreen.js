import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { createJobPost } from "../../redux/slices/jobSlice";
import colors from "../../constants/colors";
import ModalPicker, {
  ModalPickerTrigger,
} from "../../components/common/ModalPicker";
import indianStatesCities from "../../data/indianStatesCities.json";

const stateOptions = Object.keys(indianStatesCities);
const allCitiesList = Array.from(new Set(Object.values(indianStatesCities).flat()));

import useKeyboardAwareScroll from "../../hooks/useKeyboardAwareScroll";

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

  const handleDismissSuccessModal = () => {
    setShowSuccessModal(false);
    handleReset();
    const rootHome = submittedByRole === "employer" ? "EmployerHome" : "Tabs";
    navigation.reset({
      index: 1,
      routes: [
        { name: rootHome },
        {
          name: "MyJobs",
          params: { activeTab: "pending" },
        },
      ],
    });
  };

  // Form Fields
  const [category, setCategory] = useState("India"); // "India", "KSA", "Dubai"
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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

  const roleOptions = [
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
      Alert.alert(t("error"), "Please enter a Business / Agency Name.");
      return;
    }
    if (!contactPerson.trim()) {
      Alert.alert(t("error"), "Please enter a Contact Person Name.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!title.trim()) {
      Alert.alert(
        t("error"),
        t("postJob.jobTitleRequired", "Please enter a Job Title."),
      );
      return;
    }
    if (!selectedState) {
      Alert.alert(
        t("error"),
        t("selectStateRequired", "Please select a State."),
      );
      return;
    }
    if (!selectedCity) {
      Alert.alert(
        t("error"),
        t("selectCityRequired", "Please select a City."),
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

  const renderProgress = () => {
    let percentage = "0%";
    let titleText = "";
    if (step === 1) {
      percentage = "33%";
      titleText = t("step", { current: 1, total: 3 });
    } else if (step === 2) {
      percentage = "66%";
      titleText = t("step", { current: 2, total: 3 });
    } else if (step === 3) {
      percentage = "100%";
      titleText = t("step", { current: 3, total: 3 });
    }

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressStepText}>{titleText}</Text>
          {step === 1 && (
            <Text style={styles.progressPercentText}>
              33% {t("completeProfile.complete", "Complete")}
            </Text>
          )}
          {step === 2 && (
            <Text style={styles.progressPercentText}>
              66% {t("completeProfile.complete", "Complete")}
            </Text>
          )}
          {step === 3 && (
            <Text style={styles.progressPercentText}>
              100% {t("completeProfile.complete", "Complete")}
            </Text>
          )}
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: percentage }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        style={{ flex: 1 }}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
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
              <Ionicons name="arrow-back" size={24} color="#153e69" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t("postJob.title", "Post a Referral Job")}
            </Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ padding: 4 }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={28} color="#f57f20" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {step < 4 && renderProgress()}

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: BUSINESS & CONTACT INFO */}
          {step === 1 && (
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
                    Let's start with your business basics. This information
                    helps applicants identify who they'll be working for.
                  </Text>
                  <Text style={styles.infoBoxSub}>
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              {/* Company Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("postJob.businessName", "Business / Agency Name")}
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

              {/* Contact Person Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("postJob.contactPerson", "Contact Person Name")}
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
              {/* Category Chips */}
              <Text style={styles.inputLabel}>
                {t("postJob.category", "Category *")}
              </Text>
              <View style={styles.regionRow}>
                {categories.map((c) => {
                  const isActive = category === c.value;
                  return (
                    <TouchableOpacity
                      key={c.value}
                      style={[
                        styles.regionChip,
                        isActive && styles.regionChipActive,
                      ]}
                      onPress={() => setCategory(c.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.regionChipText,
                          isActive && styles.regionChipTextActive,
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Fields Card */}
              <View style={styles.fieldsCard}>
                {/* Job Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.jobTitle", "Job Title *")}
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "title" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder={t(
                        "postJob.jobTitlePlaceholder",
                        "e.g., Senior Pastry Chef",
                      )}
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={(e) => handleInputFocus(e, "title")}
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

                {/* Job Type Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
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
                <View
                  style={[
                    styles.inputGroup,
                    {
                      marginTop: 8,
                      position: "relative",
                      zIndex: 20,
                      elevation: 20,
                    },
                  ]}
                >
                  <Text style={styles.inputLabel}>
                    {t("postJob.jobDescription", "Job Description *")}
                  </Text>
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
                      numberOfLines={5}
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
                  Detailed job descriptions attract{" "}
                  <Text style={{ color: PRIMARY_GREEN, fontWeight: "700" }}>
                    40% more
                  </Text>{" "}
                  qualified applicants. Be sure to mention specific benefits!
                </Text>
              </View>

              {/* Footer actions */}
              <View style={styles.footerRowStep2}>
                <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={() => setStep(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveDraftLinkText}>
                    {t("back", "Back")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryNextBtnSmall}
                  activeOpacity={0.8}
                  onPress={handleNextStep2}
                >
                  <Text style={styles.primaryNextBtnText}>
                    {t("postJob.next", "Next")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: CONTACT & EXTRAS (REVIEW) */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              {/* Top Banner Card */}
              <View style={styles.step3BannerBox}>
                <Text style={styles.step3BannerText}>
                  {t("postJob.contactInfoBanner", "Almost done!")}
                </Text>
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.step3InputLabel}>
                  {t("postJob.phoneNumber", "Phone Number")}
                </Text>
                <View
                  style={[
                    styles.step3InputWrapper,
                    activeField === "phone" && styles.step3InputWrapperActive,
                  ]}
                >
                  <Ionicons
                    name="call"
                    size={18}
                    color="rgba(10, 5, 4, 0.4)"
                    style={styles.step3InputIcon}
                  />
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder={t(
                      "postJob.phonePlaceholder",
                      "+1 (555) 000-0000",
                    )}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.step3TextInputField}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={(e) => handleInputFocus(e, "phone")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
                <Text style={styles.step3InputNote}>
                  {t(
                    "postJob.phoneCaption",
                    "We'll only show this to verified applicants.",
                  )}
                </Text>
              </View>

              {/* Email Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.step3InputLabel}>
                  {t("postJob.emailAddress", "Email Address")}
                </Text>
                <View
                  style={[
                    styles.step3InputWrapper,
                    activeField === "email" && styles.step3InputWrapperActive,
                  ]}
                >
                  <Ionicons
                    name="mail"
                    size={18}
                    color="rgba(10, 5, 4, 0.4)"
                    style={styles.step3InputIcon}
                  />
                  <TextInput
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    placeholder={t(
                      "postJob.emailPlaceholder",
                      "manager@hospitalityhub.com",
                    )}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.step3TextInputField}
                    keyboardType="email-address"
                    onFocus={(e) => handleInputFocus(e, "email")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Quick Review Header */}
              <Text style={styles.reviewHeader}>
                {t("postJob.quickReview", "QUICK REVIEW")}
              </Text>

              {/* Single Compact Review Card */}
              <View style={styles.compactReviewCard}>
                <View style={styles.reviewHeaderRow}>
                  <View style={styles.reviewHeaderIconContainer}>
                    <Ionicons
                      name="briefcase"
                      size={20}
                      color={PRIMARY_GREEN}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewJobTitle}>
                      {title.trim() || "Job Title"}
                    </Text>
                    <Text style={styles.reviewCompanySub}>
                      {company || "Business Name"}
                    </Text>
                  </View>
                </View>
                {/* Metadata Row */}
                <View style={styles.reviewMetaRow}>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color={PRIMARY_GREEN}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>
                      {selectedCity && selectedState ? `${selectedCity}, ${selectedState}` : selectedState || selectedCity || location.trim() || "Location"}
                    </Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons
                      name="cash-outline"
                      size={13}
                      color={PRIMARY_GREEN}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>
                      {salaryMin
                        ? `${salaryCurrency} ${salaryMin}${salaryMax ? `-${salaryMax}` : "+"}`
                        : "Not Specified"}
                    </Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons
                      name="people-outline"
                      size={13}
                      color={PRIMARY_GREEN}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>
                      {t("openings_count", {
                        count: parseInt(openPositions, 10) || 1,
                      })}
                    </Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons
                      name="bar-chart-outline"
                      size={13}
                      color={PRIMARY_GREEN}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>
                      {experienceRange}
                    </Text>
                  </View>
                  <View style={styles.reviewMetaChip}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={PRIMARY_GREEN}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.reviewMetaChipText} numberOfLines={1}>
                      {jobType}
                    </Text>
                  </View>
                </View>

                <View style={styles.reviewDivider} />

                {/* Bio / Description */}
                <View
                  style={[
                    styles.reviewBioContainer,
                    {
                      borderLeftWidth: 3,
                      borderLeftColor: PRIMARY_GREEN,
                      paddingLeft: 10,
                      marginTop: 4,
                    },
                  ]}
                >
                  <Text style={styles.reviewBioLabel}>
                    {t("postJob.jobDescription", "Job Description")}
                  </Text>
                  <Text style={styles.reviewBioText} numberOfLines={3}>
                    {description.trim() || "No description provided."}
                  </Text>
                </View>
              </View>
              {/* Submit Buttons */}
              <TouchableOpacity
                style={[
                  styles.step3SubmitBtn,
                  isSubmitting && { opacity: 0.6 },
                ]}
                activeOpacity={0.8}
                onPress={handleSubmitJob}
                disabled={isSubmitting}
              >
                <Text style={styles.step3SubmitBtnText}>
                  {isSubmitting
                    ? "Submitting..."
                    : t("postJob.submitApproval", "Submit For Approval")}
                </Text>
                {!isSubmitting && (
                  <Ionicons
                    name="paper-plane"
                    size={18}
                    color="#ffffff"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.step3BackBtn}
                onPress={() => {
                  handleReset();
                  const rootHome = submittedByRole === "employer" ? "EmployerHome" : "Tabs";
                  navigation.reset({
                    index: 1,
                    routes: [
                      { name: rootHome },
                      {
                        name: "MyJobs",
                        params: { activeTab: "pending" },
                      },
                    ],
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.step3BackBtnText}>
                  {t("postJob.returnFeed", "Return to feed")}
                </Text>
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
                  🎉 Job Submitted Successfully
                </Text>

                <Text style={styles.modalSuccessMessage}>
                  Your job has been submitted for admin review. Once approved,
                  it will be published in the community feed.
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
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 80,
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
