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

const PRIMARY_GREEN = "#153e69";
const { width } = Dimensions.get("window");

export default function PostReferralJobScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);
  const activeRole = useSelector(
    (state) => state.auth.user?.active_role ?? state.user?.activeRole,
  );

  const [step, setStep] = useState(1); // 1: Business Basics, 2: Job Details, 3: Contact & Extras, 4: Success
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const handleDismissSuccessModal = () => {
    setShowSuccessModal(false);
    handleReset();
    navigation.navigate("MyJobs");
  };

  // Form Fields
  const [category, setCategory] = useState("india"); // "india", "overseas", "community"
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [description, setDescription] = useState("");

  // Optional Fields
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
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
    "Senior (5+ and above)",
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
    if (!phoneNumber.trim()) {
      Alert.alert(t("error"), "Phone number is required.");
      return;
    }
    if (!emailAddress.trim()) {
      Alert.alert(t("error"), "Email address is required.");
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

    const combinedContact = `Phone: ${phoneNumber.trim()} | Email: ${emailAddress.trim()}`;

    const jobData = {
      title,
      category,
      company,
      contact_info: combinedContact,
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
      contact_person: contactPerson,
    };

    if (category === "overseas") {
      jobData.country = country.trim();
      jobData.visa_assistance = visaAssistance;
      jobData.accommodation_available = accommodationAvailable;
      jobData.contract_duration = contractDuration.trim() || null;
    }

    // Filter out empty/null fields
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
          console.error(
            "Job post failed - payload:",
            JSON.stringify(result.payload, null, 2),
          );
        } catch (e) {
          console.error("Job post failed - payload (raw):", result.payload);
        }
        Alert.alert(t("error"), errorMessage);
      }
    } catch (err) {
      Alert.alert(
        t("error"),
        err.message || t("postJob.errorOccurred", "Something went wrong."),
      );
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
              <Ionicons name="arrow-back" size={24} color="#153e69" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t("postJob.title", "Post a Referral Job")}
            </Text>
            <View style={{ width: 24 }} />
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
                <Text style={styles.inputLabel}>{t("postJob.businessName", "Business / Agency Name")}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    activeField === "company" && styles.inputWrapperActive,
                  ]}
                >
                  <TextInput
                    value={company}
                    onChangeText={setCompany}
                    placeholder={t("postJob.businessNamePlaceholder", "e.g. The Grand Bistro")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveField("company")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Contact Person Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.contactPerson", "Contact Person Name")}</Text>
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
                    placeholder={t("postJob.contactPersonPlaceholder", "Full name of hiring manager")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveField("contactPerson")}
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
                  <Text style={styles.imageCardTitleLabel}>
                    {t("postJob.identityTrust", "Identity & Trust")}
                  </Text>
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
                      onFocus={() => setActiveField("title")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Location */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.location", "Location")}
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      activeField === "location" && styles.inputWrapperActive,
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="rgba(10, 5, 4, 0.6)"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      value={location}
                      onChangeText={setLocation}
                      placeholder={t(
                        "postJob.locationPlaceholder",
                        "e.g., Mayfair, London",
                      )}
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.textInput}
                      onFocus={() => setActiveField("location")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Salary & Positions */}
                <View style={styles.inlineRow}>
                  <View style={{ flex: 1.1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>
                      {t("postJob.salaryRange", "Salary")}
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "salary" && styles.inputWrapperActive,
                      ]}
                    >
                      <TextInput
                        value={salary}
                        onChangeText={setSalary}
                        placeholder={t("postJob.salaryPlaceholder")}
                        placeholderTextColor="rgba(10, 5, 4, 0.4)"
                        style={styles.textInput}
                        onFocus={() => setActiveField("salary")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>

                  <View style={{ flex: 0.9, marginLeft: 8 }}>
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
                  <Text style={styles.inputLabel}>
                    {t("postJob.experienceRequired", "Experience Required")}
                  </Text>
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
                      color="rgba(10, 5, 4, 0.6)"
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
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={PRIMARY_GREEN}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Job Type Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
                  <Text style={styles.inputLabel}>
                    {t("postJob.jobType", "Job Type")}
                  </Text>
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
                      color="rgba(10, 5, 4, 0.6)"
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
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={PRIMARY_GREEN}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Job Description */}
                <View style={[styles.inputGroup, { marginTop: 8 }]}>
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
                  {t("postJob.contactInfoBanner", "Almost done! We just need your Contact Information so applicants know how to reach you or where to send their CVs.")}
                </Text>
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.step3InputLabel}>{t("postJob.phoneNumber", "Phone Number")}</Text>
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
                    placeholder={t("postJob.phonePlaceholder", "+1 (555) 000-0000")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.step3TextInputField}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={() => setActiveField("phone")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
                <Text style={styles.step3InputNote}>
                  {t("postJob.phoneCaption", "We'll only show this to verified applicants.")}
                </Text>
              </View>

              {/* Email Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.step3InputLabel}>{t("postJob.emailAddress", "Email Address")}</Text>
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
                    placeholder={t("postJob.emailPlaceholder", "manager@hospitalityhub.com")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.step3TextInputField}
                    keyboardType="email-address"
                    onFocus={() => setActiveField("email")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Quick Review Header */}
              <Text style={styles.reviewHeader}>{t("postJob.quickReview", "QUICK REVIEW")}</Text>

              {/* Position Card */}
              <View style={styles.step3ReviewCard}>
                <View style={styles.step3ReviewIconBox}>
                  <Ionicons name="restaurant" size={20} color="#153e69" />
                </View>
                <View style={styles.reviewTextContainer}>
                  <Text style={styles.reviewCardLabel}>{t("postJob.positionLabel", "Position")}</Text>
                  <Text style={styles.reviewCardValue}>
                    {title.trim() || "Senior Head Chef"}
                  </Text>
                </View>
              </View>

              {/* Location & Salary Side-by-Side Row */}
              <View style={styles.reviewCardRow}>
                <View
                  style={[styles.step3ReviewCard, { flex: 1, marginRight: 6 }]}
                >
                  <View style={styles.reviewTextContainer}>
                    <Text style={styles.reviewCardLabel}>{t("postJob.locationLabel", "Location")}</Text>
                    <Text style={styles.reviewCardValue} numberOfLines={1}>
                      {location.trim() || "London, UK"}
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.step3ReviewCard, { flex: 1, marginLeft: 6 }]}
                >
                  <View style={styles.reviewTextContainer}>
                    <Text style={styles.reviewCardLabel}>{t("postJob.salaryLabel", "Salary")}</Text>
                    <Text style={styles.reviewCardValue} numberOfLines={1}>
                      {salary.trim() || "Competitive"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Submit Buttons */}
              <TouchableOpacity
                style={styles.step3SubmitBtn}
                activeOpacity={0.8}
                onPress={handleSubmitJob}
              >
                <Text style={styles.step3SubmitBtnText}>
                  {t("postJob.submitApproval", "Submit For Approval")}
                </Text>
                <Ionicons
                  name="paper-plane"
                  size={18}
                  color="#ffffff"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.step3BackBtn}
                onPress={() => navigation.navigate("Home")}
                activeOpacity={0.7}
              >
                <Text style={styles.step3BackBtnText}>{t("postJob.returnFeed", "Return to feed")}</Text>
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
    paddingVertical: 20,
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
    minHeight: 50,
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
  reviewCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
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
    color: "rgba(10, 5, 4, 0.4)",
    marginBottom: 2,
  },
  reviewCardValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0504",
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
