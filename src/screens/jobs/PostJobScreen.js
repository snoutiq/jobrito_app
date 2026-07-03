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
import { submitCommunityJob, storeEmployerJob } from "../../redux/slices/jobSlice";
import { setProfileData } from "../../redux/slices/userSlice";
import { setEmployerOnboardingCompleted } from "../../services/storage";
import colors from "../../constants/colors";

const PRIMARY_GREEN = "#22C55E";
const { width } = Dimensions.get("window");

export default function PostJobScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  const [step, setStep] = useState(1); // 1: Business Info, 2: Job Details, 3: Contact & Review, 4: Success

  // Step 1: Business Basics
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  // Step 2: Job Details
  const [region, setRegion] = useState("India");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [openPositions, setOpenPositions] = useState("1");
  const [experience, setExperience] = useState("Mid-Level (3-5 years)");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");

  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [activeField, setActiveField] = useState(null);

  // Step 3: Contact & Review
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const regions = ["India", "KSA", "Dubai", "Europe"];
  const experienceOptions = [
    "Entry Level (0-2 years)",
    "Mid-Level (3-5 years)",
    "Senior (5+ years)",
  ];
  const jobTypeOptions = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
  ];

  // Autofill fields from user profile if available
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || profile.company || "");
      setContactPerson(profile.name || profile.full_name || profile.contactName || "");
      setContactPhone(profile.phone || profile.mobile_number || profile.contactPhone || "");
      setContactEmail(profile.email || profile.contactEmail || "");
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
    if (!location.trim()) {
      Alert.alert(t("error"), t("postJob.locationRequired", "Please enter a Job Location."));
      return;
    }
    if (!salaryRange.trim()) {
      Alert.alert(t("error"), t("postJob.salaryRequired", "Please enter a Salary Range."));
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
  
  const handleExitOnboarding = async () => {
    try {
      await setEmployerOnboardingCompleted();
      dispatch(
        setProfileData({
          ...profile,
          employerOnboardingCompleted: true,
        })
      );
    } catch (err) {
      console.warn("Failed to complete onboarding:", err);
    }
  };

  const handleSubmitJob = async () => {
    if (!contactPhone.trim()) {
      Alert.alert(t("error"), t("employerOnboarding.contactPhoneRequired"));
      return;
    }
    if (!contactEmail.trim()) {
      Alert.alert(t("error"), t("employerOnboarding.contactEmailRequired"));
      return;
    }

    const jobData = {
      title: jobTitle,
      category: region.toLowerCase(),
      company: businessName,
      location: location,
      salary: salaryRange,
      contact_info: contactEmail,
      description: jobDescription,
      job_type: jobType,
      experience_range: experience,
      open_positions: parseInt(openPositions, 10) || 1,
      requirements: requirements,
      benefits: benefits,
    };

    try {
      const result = await dispatch(storeEmployerJob(jobData));
      
      if (storeEmployerJob.fulfilled.match(result)) {
        if (route.params?.isOnboarding) {
          // Save completion in local storage (so restart doesn't reload onboarding screen)
          await setEmployerOnboardingCompleted();
        }
        setStep(4);
      } else {
        Alert.alert(t("error"), t("postJob.submitFailed", "Failed to submit job posting. Please try again."));
      }
    } catch (err) {
      Alert.alert(t("error"), err.message || t("postJob.errorOccurred", "Something went wrong."));
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
    setSalaryRange("");
    setExperience("Mid-Level (3-5 years)");
    setOpenPositions("1");
    setJobDescription("");
    setRegion("India");
    setJobType("Full-time");
    setRequirements("");
    setBenefits("");
    setStep(1);
  };

  const renderProgress = () => {
    let percentage = "0%";
    let title = "";
    if (step === 1) {
      percentage = "33%";
      title = t("step", { current: 1, total: 3 });
    } else if (step === 2) {
      percentage = "66%";
      title = t("step", { current: 2, total: 3 });
    } else if (step === 3) {
      percentage = "100%";
      title = t("step", { current: 3, total: 3 });
    }

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressStepText}>{title}</Text>
          {step === 2 && <Text style={styles.progressPercentText}>66% {t("completeProfile.complete", "Complete")}</Text>}
          {step === 3 && <Text style={styles.progressPercentText}>100%</Text>}
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
            <Text style={styles.headerTitle}>{t("postJob.title")}</Text>
            <View style={styles.headerRight}>
              {route?.params?.isOnboarding ? (
                <TouchableOpacity
                  onPress={handleExitOnboarding}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={28} color="#EF4444" />
                </TouchableOpacity>
              ) : (
                <>
                  {step === 2 && (
                    <TouchableOpacity style={styles.headerIcon}>
                      <Ionicons name="notifications-outline" size={22} color="#1E293B" />
                    </TouchableOpacity>
                  )}
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
                </>
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
          {/* STEP 1: BUSINESS BASICS */}
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
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveField("businessName")}
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
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveField("contactPerson")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Image Card Overlay Illustration */}
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
                  <Text style={styles.imageCardTitleLabel}>{t("postJob.identityTrust")}</Text>
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
                <Ionicons name="help-circle-outline" size={26} color="#FFFFFF" />
              </TouchableOpacity> */}

              {/* Footer actions */}
              <View style={[styles.footerContainer, { marginTop: 40 }]}>
                <TouchableOpacity
                  style={styles.primaryNextBtn}
                  activeOpacity={0.8}
                  onPress={handleNextStep1}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.next")}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={handleSaveAsDraft}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveDraftLinkText}>{t("postJob.saveDraft")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: JOB DETAILS */}
          {step === 2 && (
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
                        {r}
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
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveField("jobTitle")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Location */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t("postJob.location")}</Text>
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
                      placeholder={t("postJob.locationPlaceholder")}
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      onFocus={() => setActiveField("location")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>

                {/* Salary & Positions Row */}
                <View style={styles.inlineRow}>
                  <View style={{ flex: 1.1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>{t("postJob.salaryRange")}</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        activeField === "salaryRange" && styles.inputWrapperActive,
                      ]}
                    >
                      <TextInput
                        value={salaryRange}
                        onChangeText={setSalaryRange}
                        placeholder={t("postJob.salaryPlaceholder")}
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        onFocus={() => setActiveField("salaryRange")}
                        onBlur={() => setActiveField(null)}
                      />
                    </View>
                  </View>

                  <View style={{ flex: 0.9, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>{t("postJob.openPositions")}</Text>
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
                  <Text style={styles.inputLabel}>{t("postJob.experienceRequired")}</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      showExpDropdown && styles.inputWrapperActive,
                    ]}
                    onPress={() => setShowExpDropdown(!showExpDropdown)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textInput}>{experience}</Text>
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
                            setExperience(opt);
                            setShowExpDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              experience === opt && {
                                color: PRIMARY_GREEN,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {opt}
                          </Text>
                          {experience === opt && (
                            <Ionicons name="checkmark" size={16} color={PRIMARY_GREEN} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Job Type Dropdown */}
                <View style={[styles.inputGroup, { marginTop: 14 }]}>
                  <Text style={styles.inputLabel}>Job Type</Text>
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
                  <Text style={styles.inputLabel}>Requirements (e.g. Food Safety, Menu Design)</Text>
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
                  <Text style={styles.inputLabel}>Benefits (e.g. Free Meals, Accommodation)</Text>
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
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={5}
                      style={[styles.textInput, styles.multilineInput]}
                      onFocus={() => setActiveField("jobDescription")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Lightbulb Tip Card */}
              <View style={styles.tipBox}>
                <Ionicons
                  name="bulb-outline"
                  size={20}
                  color={PRIMARY_GREEN}
                  style={styles.tipBoxIcon}
                />
                <Text style={styles.tipBoxText}>
                  {t("postJob.tipText")}
                </Text>
              </View>

              {/* Footer step 2 */}
              <View style={styles.footerRowStep2}>
                <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={handleSaveAsDraft}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveDraftLinkText}>{t("postJob.saveDraft")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryNextBtnSmall}
                  activeOpacity={0.8}
                  onPress={handleNextStep2}
                >
                  <Text style={styles.primaryNextBtnText}>{t("postJob.next")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: CONTACT & REVIEW */}
          {step === 3 && (
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
                    color="#64748B"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder={t("postJob.phonePlaceholder")}
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    style={styles.textInput}
                    onFocus={() => setActiveField("contactPhone")}
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
                    color="#64748B"
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder={t("postJob.emailPlaceholder")}
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    onFocus={() => setActiveField("contactEmail")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Quick Review Header */}
              <Text style={styles.reviewHeader}>{t("postJob.quickReview")}</Text>

              {/* Review Card: Position */}
              <View style={styles.reviewCardItem}>
                <View style={styles.reviewIconContainer}>
                  <Ionicons name="restaurant" size={20} color={PRIMARY_GREEN} />
                </View>
                <View style={styles.reviewTextContainer}>
                  <Text style={styles.reviewCardLabel}>{t("postJob.positionLabel")}</Text>
                  <Text style={styles.reviewCardValue}>
                    {jobTitle.trim() || "Senior Head Chef"}
                  </Text>
                </View>
              </View>

              {/* Review Cards Row (Location & Salary) */}
              <View style={styles.reviewCardRow}>
                <View style={[styles.reviewCardItem, { flex: 1, marginRight: 8 }]}>
                  <View style={styles.reviewTextContainer}>
                    <Text style={styles.reviewCardLabel}>{t("postJob.locationLabel")}</Text>
                    <Text style={styles.reviewCardValue} numberOfLines={1}>
                      {location.trim() || "London, UK"}
                    </Text>
                  </View>
                </View>

                <View style={[styles.reviewCardItem, { flex: 1, marginLeft: 8 }]}>
                  <View style={styles.reviewTextContainer}>
                    <Text style={styles.reviewCardLabel}>{t("postJob.salaryLabel")}</Text>
                    <Text style={styles.reviewCardValue} numberOfLines={1}>
                      {salaryRange.trim() || "£45k - £55k"}
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
                  <Text style={styles.primaryNextBtnText}>{t("postJob.submitApproval")}</Text>
                  <Ionicons
                    name="paper-plane-outline"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveDraftLink}
                  onPress={() => {
                    handleReset();
                    navigation.navigate("Home");
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
                    <Ionicons name="checkmark" size={56} color="#FFFFFF" />
                  </View>
                </View>
              </View>

              <Text style={styles.successTitle}>🎉 {t("postJob.successTitle")}</Text>

              {/* Submission description card */}
              <View style={styles.successInfoCard}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  color="#64748B"
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successInfoTitle}>
                    {t("postJob.successTitle")}
                  </Text>
                  <Text style={styles.successInfoText}>
                    {t("postJob.successMessage")}
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
                    if (route?.params?.isOnboarding) {
                      handleExitOnboarding();
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
                      navigation.popToTop();
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
  headerIcon: {
    padding: 4,
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
  infoBoxTime: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 6,
    fontWeight: "600",
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
  phoneCaption: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 6,
    marginLeft: 2,
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
