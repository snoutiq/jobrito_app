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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { createJobPost } from "../../redux/slices/jobSlice";
import colors from "../../constants/colors";

const PRIMARY_GREEN = "#22C55E";
const { width } = Dimensions.get("window");

export default function PostReferralJobScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole
  );

  const [step, setStep] = useState(1); // 1: Business Basics, 2: Job Details, 3: Contact & Extras, 4: Success
  const [activeField, setActiveField] = useState(null);

  // Form Fields
  const [category, setCategory] = useState("india"); // "india", "overseas", "community"
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  
  // Optional Fields
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [experienceRange, setExperienceRange] = useState("Mid-Level (3-5 years)");
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

  const categories = [
    { label: t("filters.india", "India"), value: "india" },
    { label: t("filters.overseas", "Overseas"), value: "overseas" },
    { label: t("filters.community", "Community"), value: "community" },
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
    "Senior (5+ years)",
  ];

  const roleOptions = [
    { label: "Job Seeker", value: "jobseeker" },
    { label: "Chef", value: "chef" },
    { label: "Employer", value: "employer" },
    { label: "Agency", value: "agency" },
  ];

  // Autofill fields from user profile if available
  useEffect(() => {
    if (profile) {
      setCompany(profile.businessName || profile.company || "");
      setContactInfo(profile.email || profile.phone || "");
    }
  }, [profile]);

  // Autofill role
  useEffect(() => {
    if (activeRole) {
      const normalized = activeRole.toLowerCase().replace(" ", "").replace("_", "");
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
      Alert.alert(t("error"), t("postJob.companyRequired", "Please enter a Company Name."));
      return;
    }
    if (!contactInfo.trim()) {
      Alert.alert(t("error"), t("postJob.contactInfoRequired", "Please enter contact info."));
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!title.trim()) {
      Alert.alert(t("error"), t("postJob.jobTitleRequired", "Please enter a Job Title."));
      return;
    }
    if (!description.trim()) {
      Alert.alert(t("error"), t("postJob.descriptionRequired", "Please enter a Job Description."));
      return;
    }
    setStep(3);
  };

  const handleSubmitJob = async () => {
    if (category === "overseas" && !country.trim()) {
      Alert.alert(t("error"), t("postJob.countryRequired", "Country is required when category is Overseas."));
      return;
    }

    const requirementsArray = requirements
      ? requirements.split(",").map((r) => r.trim()).filter(Boolean)
      : null;
    const benefitsArray = benefits
      ? benefits.split(",").map((b) => b.trim()).filter(Boolean)
      : null;

    const jobData = {
      title,
      category,
      company,
      contact_info: contactInfo,
      description,
      salary: salary.trim() || null,
      location: location.trim() || null,
      job_type: jobType,
      experience_range: experienceRange,
      requirements: requirementsArray,
      benefits: benefitsArray,
      open_positions: parseInt(openPositions, 10) || null,
      is_referral: isReferral,
      submitted_by_role: submittedByRole,
    };

    if (category === "overseas") {
      jobData.country = country.trim();
      jobData.visa_assistance = visaAssistance;
      jobData.accommodation_available = accommodationAvailable;
      jobData.contract_duration = contractDuration.trim() || null;
    }

    // Filter out empty/null fields
    const payload = Object.keys(jobData).reduce((acc, key) => {
      if (jobData[key] !== "" && jobData[key] !== null && jobData[key] !== undefined) {
        acc[key] = jobData[key];
      }
      return acc;
    }, {});

    try {
      console.log("Posting job payload:", payload);
      const result = await dispatch(createJobPost(payload));
      
      if (createJobPost.fulfilled.match(result)) {
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
          // Append status for debugging
          if (serverError.status) {
            errorMessage = `(${serverError.status}) ` + errorMessage;
          }
        } else if (typeof serverError === "string") {
          errorMessage = serverError;
        }
        // Log full action result and payload for debugging
        console.error("Job post failed - action result:", result);
        try {
          console.error("Job post failed - payload:", JSON.stringify(result.payload, null, 2));
        } catch (e) {
          console.error("Job post failed - payload (raw):", result.payload);
        }
        Alert.alert(t("error"), errorMessage);
      }
    } catch (err) {
      Alert.alert(t("error"), err.message || t("postJob.errorOccurred", "Something went wrong."));
    }
  };

  const handleReset = () => {
    setTitle("");
    setCompany("");
    setContactInfo("");
    setDescription("");
    setSalary("");
    setLocation("");
    setJobType("Full-time");
    setExperienceRange("Mid-Level (3-5 years)");
    setRequirements("");
    setBenefits("");
    setOpenPositions("1");
    setCategory("india");
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
          {step === 1 && <Text style={styles.progressPercentText}>33% {t("completeProfile.complete", "Complete")}</Text>}
          {step === 2 && <Text style={styles.progressPercentText}>66% {t("completeProfile.complete", "Complete")}</Text>}
          {step === 3 && <Text style={styles.progressPercentText}>100% {t("completeProfile.complete", "Complete")}</Text>}
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              <Ionicons name="arrow-back" size={24} color="#15803D" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("postJob.title", "Post a Referral Job")}</Text>
            <View style={styles.headerRight}>
              {profile?.profile_photo_path ? (
                <Image
                  source={{ uri: profile.profile_photo_path }}
                  style={styles.headerAvatar}
                />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Ionicons name="person-outline" size={16} color="#64748B" />
                </View>
              )}
            </View>
          </View>
        </View>

        {step < 4 && renderProgress()}

        <ScrollView
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
                    {t("postJob.businessBasics", "Enter basic company and contact information for the job post. Providing clear info ensures trust.")}
                  </Text>
                </View>
              </View>

              {/* Company Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.companyName", "Company Name *")}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    activeField === "company" && styles.inputWrapperActive,
                  ]}
                >
                  <TextInput
                    value={company}
                    onChangeText={setCompany}
                    placeholder={t("postJob.companyPlaceholder", "e.g., The Grand Patisserie")}
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveField("company")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Contact Info */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.contactInfo", "Contact Email or Phone *")}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    activeField === "contactInfo" && styles.inputWrapperActive,
                  ]}
                >
                  <TextInput
                    value={contactInfo}
                    onChangeText={setContactInfo}
                    placeholder={t("postJob.contactInfoPlaceholder", "e.g., hire@company.com")}
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveField("contactInfo")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Illustration Card */}
              <View style={styles.imageCard}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop",
                  }}
                  style={styles.imageCardBackground}
                />
                <View style={styles.imageCardOverlay} />
                <View style={styles.imageCardContent}>
                  <Text style={styles.imageCardStepLabel}>{t("step", { current: 1, total: 3 })}</Text>
                  <Text style={styles.imageCardTitleLabel}>{t("postJob.identityTrust", "Identity & Collaboration")}</Text>
                </View>
              </View>

              {/* Footer actions */}
              <View style={[styles.footerContainer, { marginTop: 40 }]}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={handleNextStep1}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.next", "Next")}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: JOB DETAILS */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              {/* Category Chips */}
              <Text style={styles.inputLabel}>{t("postJob.category", "Category *")}</Text>
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
                  <Text style={styles.inputLabel}>{t("postJob.jobTitle", "Job Title *")}</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "title" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder={t("postJob.jobTitlePlaceholder", "e.g., Senior Pastry Chef")}
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveField("title")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Location */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("postJob.location", "Location")}</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "location" && styles.inputWrapperActive,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#64748B"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      value={location}
                      onChangeText={setLocation}
                      placeholder={t("postJob.locationPlaceholder", "e.g., Mayfair, London")}
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveField("location")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Salary & Positions */}
                <View style={styles.inlineRow}>
                  <View style={{ flex: 1.1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>{t("postJob.salaryRange", "Salary")}</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "salary" && styles.inputWrapperActive,
                      ]}
                    >
                      <TextInput
                        value={salary}
                        onChangeText={setSalary}
                        placeholder={t("postJob.salaryPlaceholder", "e.g., £35k - £42k / yr")}
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        onFocus={() => setActiveField("salary")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>

                  <View style={{ flex: 0.9, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>{t("postJob.openPositions", "Open Positions")}</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "openPositions" && styles.inputWrapperActive,
                      ]}
                    >
                      <TextInput
                        value={openPositions}
                        onChangeText={setOpenPositions}
                        placeholder="1"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        style={styles.textInput}
                        onFocus={() => setActiveField("openPositions")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>
                </View>

                {/* Experience Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.experienceRequired", "Experience Required")}</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      showExpDropdown && styles.inputWrapperActive,
                    ]}
                    onPress={() => setShowExpDropdown(!showExpDropdown)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textInput}>{experienceRange}</Text>
                    <Ionicons
                      name={showExpDropdown ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {showExpDropdown && (
                    <View style={styles.dropdownContainer}>
                      {experienceOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setExperienceRange(opt);
                            setShowExpDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              experienceRange === opt && {
                                color: PRIMARY_GREEN,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {opt}
                          </Text>
                          {experienceRange === opt && (
                            <Ionicons name="checkmark" size={16} color={PRIMARY_GREEN} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Job Type Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.jobType", "Job Type")}</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      showJobTypeDropdown && styles.inputWrapperActive,
                    ]}
                    onPress={() => setShowJobTypeDropdown(!showJobTypeDropdown)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textInput}>{jobType}</Text>
                    <Ionicons
                      name={showJobTypeDropdown ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {showJobTypeDropdown && (
                    <View style={styles.dropdownContainer}>
                      {jobTypeOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setJobType(opt);
                            setShowJobTypeDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              jobType === opt && {
                                color: PRIMARY_GREEN,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {opt}
                          </Text>
                          {jobType === opt && (
                            <Ionicons name="checkmark" size={16} color={PRIMARY_GREEN} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Requirements */}
                <View style={[styles.inputGroup, { marginTop: 8 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.requirements", "Requirements (comma separated)")}</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "requirements" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={requirements}
                      onChangeText={setRequirements}
                      placeholder="e.g. HACCP Certified, Food Safety, Menu Design"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveField("requirements")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Benefits */}
                <View style={[styles.inputGroup, { marginTop: 8 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.benefits", "Benefits (comma separated)")}</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "benefits" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={benefits}
                      onChangeText={setBenefits}
                      placeholder="e.g. Free Staff Meals, Accommodation, Medical Cover"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveField("benefits")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Job Description */}
                <View style={[styles.inputGroup, { marginTop: 8 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.jobDescription", "Job Description *")}</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.multilineWrapper,
                      activeField === "description" && styles.inputWrapperActive,
                    ]}
                  >
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t("postJob.jobDescriptionPlaceholder", "Describe the job role and responsibilities...")}
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={5}
                      style={[styles.textInput, styles.multilineInput]}
                      onFocus={() => setActiveField("description")}
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
                  {t("postJob.tipText", "Add detailed requirements and benefits to get quality applications from chefs and professionals.")}
                </Text>
              </View>

              {/* Footer actions */}
              <View style={styles.footerRowStep2}>
                <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={() => setStep(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveDraftLinkText}>{t("back", "Back")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryNextBtnSmall}
                  activeOpacity={0.8}
                  onPress={handleNextStep2}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.next", "Next")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: CONTACT & EXTRAS (REVIEW) */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.step3Banner}>
                <Text style={styles.step3BannerText}>
                  {t("postJob.contactInfoBanner", "Confirm your referral details and additional preferences below before submitting.")}
                </Text>
              </View>

              {/* OVERSEAS SPECIFIC FIELDS */}
              {category === "overseas" && (
                <View style={styles.fieldsCard}>
                  <Text style={[styles.inputLabel, { color: PRIMARY_GREEN }]}>{t("postJob.overseasInfo", "Overseas Information")}</Text>
                  
                  {/* Country */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t("postJob.country", "Country *")}</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "country" && styles.inputWrapperActive,
                      ]}
                    >
                      <TextInput
                        value={country}
                        onChangeText={setCountry}
                        placeholder="e.g., United Kingdom"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        onFocus={() => setActiveField("country")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>

                  {/* Contract Duration */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t("postJob.contractDuration", "Contract Duration")}</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "contractDuration" && styles.inputWrapperActive,
                      ]}
                    >
                      <TextInput
                        value={contractDuration}
                        onChangeText={setContractDuration}
                        placeholder="e.g., 2 Years"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        onFocus={() => setActiveField("contractDuration")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>

                  {/* Visa Assistance Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    onPress={() => setVisaAssistance(!visaAssistance)}
                  >
                    <Ionicons
                      name={visaAssistance ? "checkbox" : "square-outline"}
                      size={24}
                      color={visaAssistance ? PRIMARY_GREEN : "#94A3B8"}
                    />
                    <Text style={styles.checkboxLabel}>{t("postJob.visaAssistance", "Visa Assistance Provided")}</Text>
                  </TouchableOpacity>

                  {/* Accommodation Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    onPress={() => setAccommodationAvailable(!accommodationAvailable)}
                  >
                    <Ionicons
                      name={accommodationAvailable ? "checkbox" : "square-outline"}
                      size={24}
                      color={accommodationAvailable ? PRIMARY_GREEN : "#94A3B8"}
                    />
                    <Text style={styles.checkboxLabel}>{t("postJob.accommodation", "Accommodation Available")}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* REFERRAL & ROLE INFORMATION */}
              <View style={styles.fieldsCard}>
                <Text style={[styles.inputLabel, { color: PRIMARY_GREEN }]}>{t("postJob.referralInfo", "Post Configuration")}</Text>

                {/* Submit as Referral Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  onPress={() => setIsReferral(!isReferral)}
                >
                  <Ionicons
                    name={isReferral ? "checkbox" : "square-outline"}
                    size={24}
                    color={isReferral ? PRIMARY_GREEN : "#94A3B8"}
                  />
                  <Text style={styles.checkboxLabel}>{t("postJob.isReferral", "Submit as Referral")}</Text>
                </TouchableOpacity>

                {/* Submitted By Role Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
                  <Text style={styles.inputLabel}>{t("postJob.yourRole", "Your Role")}</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      showRoleDropdown && styles.inputWrapperActive,
                    ]}
                    onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textInput}>
                      {roleOptions.find((r) => r.value === submittedByRole)?.label || submittedByRole}
                    </Text>
                    <Ionicons
                      name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {showRoleDropdown && (
                    <View style={styles.dropdownContainer}>
                      {roleOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSubmittedByRole(opt.value);
                            setShowRoleDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              submittedByRole === opt.value && {
                                color: PRIMARY_GREEN,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {submittedByRole === opt.value && (
                            <Ionicons name="checkmark" size={16} color={PRIMARY_GREEN} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Quick Review Header */}
              <Text style={styles.reviewHeader}>{t("postJob.quickReview", "QUICK REVIEW")}</Text>

              {/* Review Card */}
              <View style={styles.reviewCardItem}>
                <View style={styles.reviewIconContainer}>
                  <Ionicons name="restaurant" size={20} color={PRIMARY_GREEN} />
                </View>
                <View style={styles.reviewTextContainer}>
                  <Text style={styles.reviewCardLabel}>{t("postJob.positionLabel", "POSITION")}</Text>
                  <Text style={styles.reviewCardValue}>
                    {title.trim() || "Job Title"}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewCardRow}>
                <View style={[styles.reviewCardItem, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.reviewTextContainer}>
                    <Text style={styles.reviewCardLabel}>{t("postJob.companyLabel", "COMPANY")}</Text>
                    <Text style={styles.reviewCardValue} numberOfLines={1}>
                      {company.trim()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.reviewCardItem, { flex: 1, marginLeft: 8 }]}>
                  <View style={styles.reviewTextContainer}>
                    <Text style={styles.reviewCardLabel}>{t("postJob.salaryLabel", "SALARY")}</Text>
                    <Text style={styles.reviewCardValue} numberOfLines={1}>
                      {salary.trim() || "Competitive"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Footer step 3 */}
              <View style={[styles.footerContainer, { marginTop: 36 }]}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={handleSubmitJob}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.submitApproval", "Submit for Approval")}</Text>
                  <Ionicons
                    name="paper-plane-outline"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={() => setStep(2)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveDraftLinkText}>{t("back", "Back")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <View style={[styles.stepContainer, { alignItems: "center", paddingTop: 40 }]}>
              {/* Checkmark Circle */}
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <View style={styles.successIconCore}>
                    <Ionicons name="checkmark" size={56} color="#FFFFFF" />
                  </View>
                </View>
              </View>

              <Text style={styles.successTitle}>🎉 {t("postJob.successTitle", "Job Submitted Successfully")}</Text>

              {/* Success Info Card */}
              <View style={styles.successInfoCard}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  color="#64748B"
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successInfoTitle}>
                    {t("postJob.successTitle", "Pending Moderation")}
                  </Text>
                  <Text style={styles.successInfoText}>
                    {t("postJob.successMessage", "Your job post has been submitted and is pending admin moderation. Approved jobs will be visible on the feed shortly.")}
                  </Text>
                </View>
              </View>

              {/* Success Action Buttons */}
              <View style={{ width: "100%", gap: 14, marginTop: 40 }}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleReset();
                  }}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.postNew", "Post Another Referral")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dashboardLink}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleReset();
                    navigation.popToTop();
                  }}
                >
                  <Text style={styles.dashboardLinkText}>{t("postJob.goDashboard", "Go to Feed")}</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#0F172A",
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
    borderColor: "#E2E8F0",
  },
  headerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    backgroundColor: "#FFFFFF",
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
    color: "#64748B",
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 99,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 99,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoBoxIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoBoxText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  inputWrapperActive: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    color: "#0F172A",
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
    color: "#F1F5F9",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  imageCardTitleLabel: {
    color: "#FFFFFF",
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
    color: "#FFFFFF",
  },
  saveDraftLink: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  saveDraftLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A7B32",
  },
  regionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  regionChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  regionChipActive: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: "#F2FBF5",
  },
  regionChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  regionChipTextActive: {
    color: "#15803D",
  },
  fieldsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 16,
  },
  inlineRow: {
    flexDirection: "row",
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
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#334155",
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#475569",
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
  step3Banner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 20,
  },
  step3BannerText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
  },
  reviewHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  reviewCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  reviewIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#E2FBE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reviewTextContainer: {
    flex: 1,
  },
  reviewCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 2,
  },
  reviewCardValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  reviewCardRow: {
    flexDirection: "row",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
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
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 16,
  },
  successInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 16,
    width: "100%",
  },
  successInfoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  successInfoText: {
    fontSize: 11,
    color: "#64748B",
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
    color: "#64748B",
  },
});
