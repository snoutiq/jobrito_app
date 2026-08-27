import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  PixelRatio,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { fetchProfile, updateProfile } from "../../redux/slices/userSlice";
import { getProfileCompletionPercent } from "../../utils/profileCompletion";
import ModalPicker, {
  ModalPickerTrigger,
} from "../../components/common/ModalPicker";
import talentProfileImg from "../../assets/talentprofile.png";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY = "#153e69"; // Deep navy
const SECONDARY = "#f2f2f3"; // Snow white
const WARM_GOLD = "#f2c879"; // Warm gold
const EMBER_ORANGE = "#f57f20"; // Ember orange
const NEUTRAL = "#0a0504"; // Charcoal black
const IMAGE_BASE_URL = "http://178.16.138.159/backend";

const toTrimmedString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizePhotoUri = (uri) => {
  const value = toTrimmedString(uri);
  if (!value) return "";
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("file://") ||
    value.startsWith("data:")
  ) {
    return value;
  }
  return `${IMAGE_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};

const normalizeSkillsValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toTrimmedString(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }
  return "";
};

const normalizeLocationPreferenceValue = (value) => {
  const normalized = toTrimmedString(value);
  if (!normalized) return "";
  if (
    normalized === "India" ||
    normalized === "Overseas" ||
    normalized === "Both"
  ) {
    return normalized;
  }
  if (
    normalized === "Both (India & Overseas)" ||
    normalized === "Both (Global & Domestic)"
  ) {
    return "Both";
  }
  if (statesOfIndia.includes(normalized)) {
    return "India";
  }
  if (overseasRegions.includes(normalized)) {
    return "Overseas";
  }
  return "";
};

export default function CompleteProfileScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { profile, loading } = useSelector((state) => state.user);
  
  const [step, setStep] = useState(() => {
    if (route?.params?.step) {
      return route.params.step;
    }
    return 1;
  });

  useEffect(() => {
    if (route?.params?.step) {
      setStep(route.params.step);
    }
  }, [route?.params?.step]);

  // Profile Form States
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [experienceRange, setExperienceRange] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [jobType, setJobType] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [city, setCity] = useState("");
  const [preferredRole, setPreferredRole] = useState("");
  const [skills, setSkills] = useState("");
  const [hasOverseasExp, setHasOverseasExp] = useState(null);

  useLayoutEffect(() => {
    if (navigation && navigation.setOptions) {
      navigation.setOptions({ headerShown: false });
    }
  }, [navigation]);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      const pUser = profile.user || profile;
      const pTalent =
        profile.talent_profile ||
        profile.talent_profile_details ||
        profile.job_seeker_profile ||
        pUser.talent_profile ||
        pUser.job_seeker_profile ||
        {};

      const profilePhoto = normalizePhotoUri(
        pUser.profile_photo_path || pUser.profile_photo || pTalent.profile_photo_path || profile.profile_photo_path
      );
      if (profilePhoto) setPhoto(profilePhoto);

      const profileName =
        pUser.full_name || pUser.name || pTalent.full_name || pTalent.name || profile.full_name || profile.name || "";
      const isPhoneLike = /^\+?\d[\d\s-]{6,}$/.test(profileName);
      if (profileName && !isPhoneLike) setFullName(profileName);

      const ageVal = toTrimmedString(
        profile.age || pUser.age || pUser.user_age || pTalent.age || profile.user_age || profile.chef_profile?.age || ""
      );
      if (ageVal) setAge(ageVal);

      const overseasExpVal = toTrimmedString(
        profile.overseas_work_experience || pUser.overseas_work_experience || pTalent.overseas_work_experience || ""
      );
      if (overseasExpVal) {
        const isYes = overseasExpVal.toLowerCase().includes("yes") || overseasExpVal === "1" || overseasExpVal === "true";
        setHasOverseasExp(isYes ? "Yes" : "No");
      }

      const emailValue = toTrimmedString(
        pUser.email || pUser.contact_email || pTalent.email || profile.email || profile.contact_email
      );
      if (emailValue) setEmail(emailValue);

      const cityValue = toTrimmedString(
        pUser.city || pUser.current_city || pUser.location || pUser.job_location || pTalent.city || pTalent.job_location || profile.city || profile.job_location
      );
      if (cityValue) setCity(cityValue);

      const experienceValue = toTrimmedString(
        pUser.experience_range || pUser.experience_years || pUser.experience || pTalent.experience_range || pTalent.experience_years || profile.experience_range || profile.experience_years
      );
      if (experienceValue) setExperienceRange(experienceValue);

      const preferredRoleValue = toTrimmedString(
        pUser.preferred_role || pUser.preference || pUser.preferredRole || pTalent.preferred_role || pTalent.preference || profile.preferred_role || profile.preference
      );
      if (preferredRoleValue) setPreferredRole(preferredRoleValue);

      const employerValue = toTrimmedString(
        pUser.current_employer || pUser.currentEmployer || pUser.current_company || pUser.company || pTalent.current_employer || profile.current_employer
      );
      if (employerValue) setCurrentEmployer(employerValue);

      const skillsValue = normalizeSkillsValue(
        pUser.skills || pUser.operations || pTalent.skills || profile.skills
      );
      if (skillsValue) setSkills(skillsValue);

      const genderValue = pUser.gender || pTalent.gender || profile.gender;
      if (genderValue) setGender(toTrimmedString(genderValue).toLowerCase());

      const jobTypeValue = toTrimmedString(
        profile.job_type || pUser.job_type || pUser.jobType || pTalent.job_type || ""
      );
      if (jobTypeValue) setJobType(jobTypeValue);

      const locationPrefRaw = toTrimmedString(
        pUser.location_preference || pUser.locationPreference || pTalent.location_preference || profile.location_preference
      );
      const locationValue = normalizeLocationPreferenceValue(locationPrefRaw);
      if (locationValue) {
        setLocationPreference(locationValue);
        if (locationValue === "Both" && !cityValue) {
          setCity("Both (Global & Domestic)");
        }
      } else if (cityValue) {
        if (statesOfIndia.includes(cityValue)) {
          setLocationPreference("India");
        } else if (overseasRegions.includes(cityValue)) {
          setLocationPreference("Overseas");
        }
      }
    }
  }, [profile]);

  // Handle back/leave confirmation alert
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // If step > 1 (Steps 2, 3, 4, 5), step back to previous step without showing leave modal!
      if (step > 1 && step < 6) {
        e.preventDefault();
        setStep((prevS) => prevS - 1);
        return;
      }

      // If we are at step 6 (Success screen), allow leaving cleanly without alert
      if (step === 6) {
        return;
      }

      // Step === 1: Show leave alert confirmation ONLY on Step 1!
      e.preventDefault();

      Alert.alert(
        t("discardTitle", "Discard changes?"),
        t("discardMessage", "Are you sure you want to discard your changes and leave this page?"),
        [
          { text: t("cancel", "Cancel"), style: "cancel", onPress: () => {} },
          {
            text: t("discardLeave", "Leave"),
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, step, t]);

  const handleSkip = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      navigation.goBack();
    }
  };

  const next = () => {
    if (step < 6) setStep(step + 1);
  };

  const prev = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    const trimmedFullName = toTrimmedString(fullName);
    const trimmedEmail = toTrimmedString(email);
    const trimmedCity = toTrimmedString(city);
    const trimmedExperience = toTrimmedString(experienceRange);
    const trimmedEmployer = toTrimmedString(currentEmployer);
    const trimmedRole = toTrimmedString(preferredRole);
    const trimmedLocation = normalizeLocationPreferenceValue(locationPreference);
    const trimmedJobType = toTrimmedString(jobType);

    const payload = {};
    if (trimmedFullName) payload.full_name = trimmedFullName;
    if (trimmedExperience) payload.experience_range = trimmedExperience;
    if (trimmedRole) payload.preferred_role = trimmedRole;
    if (photo) payload.profile_photo_path = photo;
    if (trimmedEmployer) payload.current_employer = trimmedEmployer;
    if (gender) payload.gender = gender;
    if (age) payload.age = age;
    if (hasOverseasExp !== null && hasOverseasExp !== undefined) {
      payload.overseas_work_experience = (hasOverseasExp === true || hasOverseasExp === "Yes") ? "Yes" : "No";
    }
    if (trimmedJobType) payload.job_type = trimmedJobType;
    if (trimmedLocation) payload.location_preference = trimmedLocation;
    if (trimmedCity) payload.city = trimmedLocation === "Both" ? trimmedCity || "Both (Global & Domestic)" : trimmedCity;
    if (trimmedEmail) payload.email = trimmedEmail;
    if (skills) payload.skills = skills;

    try {
      await dispatch(updateProfile(payload)).unwrap();
      setStep(6); // Success screen
    } catch (error) {
      const emailErrors =
        error?.raw?.response?.data?.errors?.email ||
        error?.response?.data?.errors?.email ||
        [];
      const messageText = String(
        error?.message ||
          error?.raw?.response?.data?.message ||
          emailErrors?.[0] ||
          "Failed to update profile details."
      );

      let alertTitle = t("onboarding.validationTitle", "Verification Failed");
      let displayError = messageText;

      const isEmailTaken =
        messageText.toLowerCase().includes("email has already been taken") ||
        messageText.toLowerCase().includes("email already exists") ||
        messageText.toLowerCase().includes("email already taken") ||
        messageText.toLowerCase().includes("email already used") ||
        emailErrors.length > 0;

      if (isEmailTaken) {
        alertTitle = t("emailTakenTitle", "Email Already Exists");
        displayError = t(
          "emailTakenMessage",
          "This email address already exists. Please use a different email."
        );
      }

      Alert.alert(alertTitle, displayError);
    }
  };

  const handleReturnToProfile = async () => {
    await dispatch(fetchProfile());
    navigation.reset({
      index: 0,
      routes: [
        { name: "Home" }
      ],
    });
  };

  const hasMeaningfulVal = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    return true;
  };

  const calculateStepProgress = () => {
    if (step >= 6) return 100;

    let base = (step - 1) * 20;

    if (step === 1) {
      if (hasMeaningfulVal(photo)) base += 20;
    } else if (step === 2) {
      let filled = 0;
      if (hasMeaningfulVal(fullName)) filled++;
      if (hasMeaningfulVal(gender)) filled++;
      if (hasMeaningfulVal(age)) filled++;
      base += Math.round((filled / 3) * 20);
    } else if (step === 3) {
      let filled = 0;
      if (hasMeaningfulVal(experienceRange)) filled++;
      if (hasMeaningfulVal(currentEmployer)) filled++;
      if (hasMeaningfulVal(jobType)) filled++;
      base += Math.round((filled / 3) * 20);
    } else if (step === 4) {
      let filled = 0;
      if (hasMeaningfulVal(locationPreference)) filled++;
      if (hasMeaningfulVal(city)) filled++;
      base += Math.round((filled / 2) * 20);
    } else if (step === 5) {
      let filled = 0;
      if (hasMeaningfulVal(preferredRole)) filled++;
      if (hasMeaningfulVal(skills)) filled++;
      base += Math.round((filled / 2) * 20);
    }

    return Math.min(Math.max(base, 0), 100);
  };

  const progressPercentage = calculateStepProgress();
  const progressText = `${progressPercentage}% Complete`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        style={{ flex: 1 }}
      >
      {step !== 6 && (
        <View style={styles.modernHeaderContainer}>
          {/* Top Row: Circular Back Btn, Center Title/Subtitle */}
          <View style={styles.modernHeaderRow}>
            <TouchableOpacity onPress={prev} style={styles.headerBackBtnCircle} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={normalize(18)} color="#153e69" />
            </TouchableOpacity>

            <View style={styles.headerTitleCenterCol}>
              <Text style={styles.headerTitleText}>
                {t("talentRegistration", "Talent Registration")}
              </Text>
              <Text style={styles.headerStepSubtitle}>
                {t("stepOfTotal", `Step ${step} of 5`, { step, total: 5 })}
              </Text>
            </View>

            <TouchableOpacity onPress={handleSkip} style={styles.skipBtnTouch} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>{t("skip", "Skip")}</Text>
            </TouchableOpacity>
          </View>

          {/* Numbered Step Circle Progress Line */}
          <View style={styles.numberedStepLineRow}>
            {[1, 2, 3, 4, 5].map((sIndex) => {
              const isDone = step > sIndex;
              const isCurrent = step === sIndex;

              return (
                <React.Fragment key={`step_num_circle_${sIndex}`}>
                  <View
                    style={[
                      styles.stepNumCircle,
                      isDone || isCurrent ? styles.stepNumCircleActive : styles.stepNumCircleInactive,
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={normalize(12)} color="#ffffff" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumCircleText,
                          isCurrent ? styles.stepNumCircleTextActive : styles.stepNumCircleTextInactive,
                        ]}
                      >
                        {sIndex}
                      </Text>
                    )}
                  </View>
                  {sIndex < 5 && (
                    <View
                      style={[
                        styles.stepNumConnectorLine,
                        isDone ? styles.stepNumConnectorLineActive : styles.stepNumConnectorLineInactive,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Profile Completion Row & Bar */}
          <View style={styles.profileCompletionRow}>
            <Text style={styles.profileCompletionLabel}>
              {t("profileCompletion", "Profile Completion")}
            </Text>
            <Text style={styles.profileCompletionValue}>{progressText}</Text>
          </View>

          <View style={styles.profileCompletionTrack}>
            <View
              style={[styles.profileCompletionFill, { width: `${progressPercentage}%` }]}
            />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <PhotoStep
            next={next}
            t={t}
            photo={photo}
            setPhoto={setPhoto}
          />
        )}
        {step === 2 && (
          <PersonalStep
            next={next}
            t={t}
            fullName={fullName}
            setFullName={setFullName}
            gender={gender}
            setGender={setGender}
            age={age}
            setAge={setAge}
          />
        )}
        {step === 3 && (
          <ExperienceStep
            next={next}
            t={t}
            experienceRange={experienceRange}
            setExperienceRange={setExperienceRange}
            currentEmployer={currentEmployer}
            setCurrentEmployer={setCurrentEmployer}
            jobType={jobType}
            setJobType={setJobType}
          />
        )}
        {step === 4 && (
          <LocationStep
            next={next}
            t={t}
            locationPreference={locationPreference}
            setLocationPreference={setLocationPreference}
            city={city}
            setCity={setCity}
            hasOverseasExp={hasOverseasExp}
            setHasOverseasExp={setHasOverseasExp}
          />
        )}
        {step === 5 && (
          <CategoryStep
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            t={t}
            preferredRole={preferredRole}
            setPreferredRole={setPreferredRole}
            skills={skills}
            setSkills={setSkills}
            loading={loading}
          />
        )}
        {step === 6 && (
          <SuccessStep
            t={t}
            onReturnPress={handleReturnToProfile}
            progressPercentage={progressPercentage}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

function PhotoStep({ next, t, photo, setPhoto }) {
  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("mediaLibraryPermissionRequired", "Sorry, we need camera roll permissions to upload a photo.")
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
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t("error", "Error"), t("failedToSelectPhoto", "Failed to select photo."));
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("cameraPermissionRequired", "Sorry, we need camera permissions to take a photo.")
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t("error", "Error"), t("failedToOpenCamera", "Failed to open camera."));
    }
  };

  return (
    <View style={styles.modernStepContent}>
      {/* Title & Subtitle */}
      <Text style={styles.stepMainHeading}>
        {t("addProfilePhotoHeading", "Add a Profile Photo")}
      </Text>
      <Text style={styles.stepMainSubheading}>
        {t("addProfilePhotoSubHeading", "A professional photo helps you stand out to employers and get hired faster.")}
      </Text>

      {/* Center Large Avatar Container */}
      <View style={styles.avatarCircleContainer}>
        <View style={styles.avatarCircleWrapper}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImageCircle} />
          ) : (
            <View style={styles.avatarPlaceholderCircle}>
              <Ionicons name="person-outline" size={normalize(76)} color="#94a3b8" />
            </View>
          )}
        </View>
      </View>

      {/* Pro Tip Card */}
      <View style={styles.proTipCardBox}>
        <View style={styles.proTipIconCircle}>
          <Ionicons name="bulb" size={normalize(20)} color="#facc15" />
        </View>
        <View style={styles.proTipTextCol}>
          <Text style={styles.proTipCardTitle}>{t("proTipTitle", "Pro Tip")}</Text>
          <Text style={styles.proTipCardBody}>
            {t("proTipBody", "Use a clear, friendly photo with good lighting. Avoid filters or group photos.")}
          </Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.photoActionRow}>
        <TouchableOpacity
          style={styles.uploadPhotoOutlineBtn}
          onPress={handleUploadPhoto}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={normalize(18)} color="#153e69" style={{ marginRight: normalize(6) }} />
          <Text style={styles.uploadPhotoBtnText}>{t("uploadPhoto", "Upload Photo")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.takePhotoHighlightBtn}
          onPress={handleTakePhoto}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={normalize(18)} color="#ea580c" style={{ marginRight: normalize(6) }} />
          <Text style={styles.takePhotoBtnText}>{t("takePhoto", "Take Photo")}</Text>
        </TouchableOpacity>
      </View>

      {/* Continue Main Button */}
      <TouchableOpacity
        style={styles.continueSolidBtn}
        onPress={next}
        activeOpacity={0.85}
      >
        <Text style={styles.continueSolidBtnText}>{t("continue", "Continue")}</Text>
      </TouchableOpacity>

      {/* Security Footer Notice */}
      <View style={styles.securityFooterNoticeRow}>
        <Ionicons name="lock-closed-outline" size={normalize(14)} color="#16a34a" style={{ marginRight: normalize(4) }} />
        <Text style={styles.securityNoticeText}>
          {t("securePrivateNotice", "Your information is secure and private")}
        </Text>
      </View>
    </View>
  );
}

function PersonalStep({ next, t, fullName, setFullName, gender, setGender, age, setAge }) {
  const [selectedAge, setSelectedAge] = useState(age || "");
  const [showAgeModal, setShowAgeModal] = useState(false);

  useEffect(() => {
    setSelectedAge(age || "");
  }, [age]);

  const ageOptions = Array.from({ length: 50 }, (_, i) => String(i + 18));

  return (
    <View style={styles.modernStepContent}>
      {/* Heading & Subheading */}
      <Text style={styles.stepMainHeading}>
        {t("tellUsAboutYourselfHeading", "Tell us about yourself")}
      </Text>
      <Text style={styles.stepMainSubheading}>
        {t("tellUsAboutYourselfSubHeading", "This helps employers know you better and connect you with the right opportunities.")}
      </Text>

      {/* Field 1: What is your age? */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="calendar-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("whatIsYourAge", "What is your age?")}<Text style={{ color: "#ef4444" }}> *</Text>
            </Text>
            <Text style={styles.fieldLabelSub}>
              {t("enterYourAge", "Enter your age")}
            </Text>
          </View>
        </View>

        <ModalPickerTrigger
          onPress={() => setShowAgeModal(true)}
          label={selectedAge}
          placeholder={t("enterYourAge", "Enter your age")}
          isOpen={showAgeModal}
          style={styles.modernInputWrapper}
        />
        <ModalPicker
          visible={showAgeModal}
          onClose={() => setShowAgeModal(false)}
          title={t("selectAge", "Select Age")}
          options={ageOptions}
          selectedValue={selectedAge}
          onSelect={(val) => {
            setSelectedAge(val);
            if (setAge) setAge(val);
          }}
          searchable={true}
          searchPlaceholder={t("searchAge", "Search Age...")}
        />
      </View>

      {/* Field 2: Full Name */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="person-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("fullName", "Full Name")}<Text style={{ color: "#ef4444" }}> *</Text>
            </Text>
            <Text style={styles.fieldLabelSub}>
              {t("enterLegalFullName", "Enter your legal full name")}
            </Text>
          </View>
        </View>

        <View style={styles.modernInputWrapper}>
          <TextInput
            placeholder={t("enterFullName", "Enter full name")}
            placeholderTextColor="#94a3b8"
            value={fullName}
            onChangeText={setFullName}
            style={styles.modernTextInput}
          />
        </View>
      </View>

      {/* Field 3: Select Gender */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="male-female-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("selectGender", "Select Gender")}<Text style={{ color: "#ef4444" }}> *</Text>
            </Text>
            <Text style={styles.fieldLabelSub}>
              {t("chooseGenderSub", "Choose the option that best describes you")}
            </Text>
          </View>
        </View>

        <View style={styles.modernGenderRow}>
          <GenderCard
            icon="male-outline"
            title={t("male", "Male")}
            selected={gender === "male"}
            onPress={() => setGender("male")}
          />
          <GenderCard
            icon="female-outline"
            title={t("female", "Female")}
            selected={gender === "female"}
            onPress={() => setGender("female")}
          />
          <GenderCard
            icon="person-outline"
            title={t("other", "Other")}
            selected={gender === "other"}
            onPress={() => setGender("other")}
          />
        </View>
      </View>

      {/* Why We Ask This Card */}
      <View style={styles.proTipCardBox}>
        <View style={styles.proTipIconCircle}>
          <Ionicons name="bulb" size={normalize(20)} color="#facc15" />
        </View>
        <View style={styles.proTipTextCol}>
          <Text style={styles.proTipCardTitle}>{t("whyWeAskThisTitle", "Why we ask this?")}</Text>
          <Text style={styles.proTipCardBody}>
            {t("whyWeAskThisBody", "This helps us personalize your experience and connect you with relevant job opportunities.")}
          </Text>
        </View>
      </View>

      {/* Save & Continue Button */}
      <TouchableOpacity
        style={styles.continueSolidBtn}
        onPress={() => {
          if (!toTrimmedString(fullName)) {
            Alert.alert(t("requiredField", "Required Field"), t("pleaseEnterFullName", "Please enter your full name."));
            return;
          }
          next();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.continueSolidBtnText}>{t("saveAndContinue", "Save & Continue")}</Text>
      </TouchableOpacity>

      {/* Security Footer Notice */}
      <View style={styles.securityFooterNoticeRow}>
        <Ionicons name="lock-closed-outline" size={normalize(14)} color="#16a34a" style={{ marginRight: normalize(4) }} />
        <Text style={styles.securityNoticeText}>
          {t("securePrivateNotice", "Your information is secure and private")}
        </Text>
      </View>
    </View>
  );
}

function GenderCard({ icon, title, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.modernGenderCard, selected && styles.modernGenderCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={normalize(24)} color={selected ? "#ffffff" : "#153e69"} />
      <Text style={[styles.modernGenderText, selected && styles.modernGenderTextSelected]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function ExperienceStep({
  next,
  t,
  experienceRange,
  setExperienceRange,
  currentEmployer,
  setCurrentEmployer,
  jobType,
  setJobType,
}) {
  const ranges = ["0-1 Years", "1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"];
  const [showExpModal, setShowExpModal] = useState(false);

  const jobTypeOptionsList = [
    {
      id: "Full Time",
      label: t("fullTime", "Full Time"),
      subLabel: t("fullTimeSub", "Regular full-time job opportunity"),
      icon: "briefcase-outline",
    },
    {
      id: "Part Time",
      label: t("partTime", "Part Time"),
      subLabel: t("partTimeSub", "Flexible part-time job opportunity"),
      icon: "time-outline",
    },
    {
      id: "Contract",
      label: t("contract", "Contract"),
      subLabel: t("contractSub", "Fixed duration / project-based role"),
      icon: "document-text-outline",
    },
    {
      id: "Freelance",
      label: t("freelance", "Freelance"),
      subLabel: t("freelanceSub", "Independent & flexible work"),
      icon: "person-outline",
    },
  ];

  return (
    <View style={styles.modernStepContent}>
      {/* Title & Subtitle */}
      <Text style={styles.stepMainHeading}>
        {t("tellUsAboutYourExperienceHeading", "Tell us about your experience")}
      </Text>
      <Text style={styles.stepMainSubheading}>
        {t("tellUsAboutYourExperienceSubHeading", "This helps us understand you better and match you with the right opportunities.")}
      </Text>

      {/* Field 1: How many years of experience do you have in hospitality? */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="briefcase-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("yearsOfExperienceTitle", "How many years of experience do you have")} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <Text style={styles.fieldLabelSub}>
              {t("inHospitalitySub", "in hospitality?")}
            </Text>
          </View>
        </View>

        <ModalPickerTrigger
          onPress={() => setShowExpModal(true)}
          label={experienceRange}
          placeholder={t("selectExperiencePlaceholder", "Select experience")}
          isOpen={showExpModal}
          style={styles.modernInputWrapper}
        />
        <ModalPicker
          visible={showExpModal}
          onClose={() => setShowExpModal(false)}
          title={t("selectExperience", "Select Experience")}
          options={ranges}
          selectedValue={experienceRange}
          onSelect={(val) => {
            if (setExperienceRange) setExperienceRange(val);
          }}
          searchable={false}
        />
      </View>

      {/* Field 2: Where did you work last (or where do you work now)? */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="business-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("whereWorkedLastTitle", "Where did you work last (or where do you work now)?")} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
          </View>
        </View>

        <View style={styles.modernInputWrapper}>
          <TextInput
            placeholder={t("enterEmployerPlaceholder", "Enter company or employer name")}
            placeholderTextColor="#94a3b8"
            value={currentEmployer}
            onChangeText={setCurrentEmployer}
            style={styles.modernTextInput}
          />
        </View>
      </View>

      {/* Field 3: What job type are you looking for? */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="compass-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("whatJobTypeTitle", "What job type are you looking for?")} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <Text style={styles.fieldLabelSub}>
              {t("chooseJobTypeSub", "Choose the option that suits you best.")}
            </Text>
          </View>
        </View>

        <View style={styles.jobTypeCardListCol}>
          {jobTypeOptionsList.map((opt) => {
            const isSelected = (jobType || "").toLowerCase() === opt.id.toLowerCase();
            return (
              <TouchableOpacity
                key={`job_type_card_${opt.id}`}
                style={[
                  styles.jobTypeOptionCard,
                  isSelected && styles.jobTypeOptionCardSelected,
                ]}
                onPress={() => setJobType(opt.id)}
                activeOpacity={0.8}
              >
                <View style={styles.jobTypeIconCircle}>
                  <Ionicons name={opt.icon} size={normalize(18)} color="#153e69" />
                </View>
                <View style={styles.jobTypeTextCol}>
                  <Text style={styles.jobTypeCardTitle}>{opt.label}</Text>
                  <Text style={styles.jobTypeCardSub}>{opt.subLabel}</Text>
                </View>
                <Ionicons
                  name={isSelected ? "radio-button-on" : "radio-button-off"}
                  size={normalize(22)}
                  color={isSelected ? "#153e69" : "#cbd5e1"}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Why We Ask This Card */}
      <View style={styles.proTipCardBox}>
        <View style={styles.proTipIconCircle}>
          <Ionicons name="bulb" size={normalize(20)} color="#facc15" />
        </View>
        <View style={styles.proTipTextCol}>
          <Text style={styles.proTipCardTitle}>{t("whyWeAskThisTitle", "Why we ask this?")}</Text>
          <Text style={styles.proTipCardBody}>
            {t("whyWeAskExperienceBody", "This helps employers connect with you for the right type of opportunities.")}
          </Text>
        </View>
      </View>

      {/* Save & Continue Button */}
      <TouchableOpacity
        style={styles.continueSolidBtn}
        onPress={() => {
          if (!toTrimmedString(experienceRange)) {
            Alert.alert(t("requiredField", "Required Field"), t("pleaseSelectExperience", "Please select your years of experience."));
            return;
          }
          if (!toTrimmedString(currentEmployer)) {
            Alert.alert(
              t("requiredField", "Required Field"),
              t("pleaseEnterEmployer", "Please enter your current employer. Enter 'None' or 'Self-Employed' if you are currently seeking opportunities.")
            );
            return;
          }
          next();
        }}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: normalize(8) }}>
          <Text style={styles.continueSolidBtnText}>{t("saveAndContinue", "Save & Continue")}</Text>
          <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* Security Footer Notice */}
      <View style={styles.securityFooterNoticeRow}>
        <Ionicons name="lock-closed-outline" size={normalize(14)} color="#16a34a" style={{ marginRight: normalize(4) }} />
        <Text style={styles.securityNoticeText}>
          {t("securePrivateNotice", "Your information is secure and private")}
        </Text>
      </View>
    </View>
  );
}

const statesOfIndia = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Mumbai", "Bengaluru", "Kochi"
];

const overseasRegions = [
  "Dubai, UAE", "Abu Dhabi, UAE", "Riyadh, Saudi Arabia", "Jeddah, Saudi Arabia",
  "Doha, Qatar", "Muscat, Oman", "Kuwait City, Kuwait", "Manama, Bahrain",
  "Singapore", "London, UK", "Manchester, UK", "New York, USA", "California, USA",
  "Sydney, Australia", "Melbourne, Australia", "Toronto, Canada", "Vancouver, Canada"
];

function LocationStep({ next, t, locationPreference, setLocationPreference, city, setCity, hasOverseasExp, setHasOverseasExp }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("state"); // "state" or "region"
  const [searchText, setSearchText] = useState("");

  const handleSelectPref = (pref) => {
    setLocationPreference(pref);
    if (pref === "Both" || pref === "Global") {
      setCity("Both (Global & Domestic)");
    } else {
      setCity("");
    }
  };

  const openSearchModal = (type) => {
    setModalType(type);
    setSearchText("");
    setModalVisible(true);
  };

  const listItems = modalType === "state" ? statesOfIndia : overseasRegions;
  const filteredItems = listItems.filter((item) =>
    item.toLowerCase().includes(searchText.toLowerCase())
  );

  const preferenceOptionsList = [
    {
      id: "India",
      title: t("india", "India"),
      desc: t("indiaDesc", "Domestic hospitality opportunities"),
      icon: "location-outline",
    },
    {
      id: "Overseas",
      title: t("overseas", "Overseas"),
      desc: t("overseasDesc", "International hospitality opportunities"),
      icon: "globe-outline",
    },
    {
      id: "Both",
      title: t("global", "Global"),
      desc: t("globalDesc", "Explore domestic & international opportunities"),
      icon: "earth-outline",
    },
  ];

  const isOverseasYes = hasOverseasExp === true || hasOverseasExp === "Yes";
  const isOverseasNo = hasOverseasExp === false || hasOverseasExp === "No";

  return (
    <View style={styles.modernStepContent}>
      {/* Title & Subtitle */}
      <Text style={styles.stepMainHeading}>
        {t("whereWouldYouLikeToWorkHeading", "Where would you like to work?")}
      </Text>
      <Text style={styles.stepMainSubheading}>
        {t("whereWouldYouLikeToWorkSubHeading", "Tell us your preference to match you with the right hospitality opportunities.")}
      </Text>

      {/* Form Card 1: Previous Overseas Work Experience Question */}
      <View style={styles.overseasQuestionCardBox}>
        <View style={styles.overseasCardLeftRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="medical-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.overseasCardTextCol}>
            <Text style={styles.overseasQuestionTitle}>
              {t("previousOverseasExpTitle", "Do you have any previous overseas work experience?")}
            </Text>
            <Text style={styles.overseasQuestionSub}>
              {t("previousOverseasExpSub", "This helps us connect you with the right international opportunities.")}
            </Text>
          </View>
        </View>

        <View style={styles.yesNoToggleRow}>
          <TouchableOpacity
            style={[
              styles.yesNoToggleBtn,
              isOverseasYes && styles.yesNoToggleBtnActive,
            ]}
            onPress={() => setHasOverseasExp("Yes")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.yesNoToggleBtnText,
                isOverseasYes && styles.yesNoToggleBtnTextActive,
              ]}
            >
              {t("yes", "Yes")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.yesNoToggleBtn,
              isOverseasNo && styles.yesNoToggleBtnActive,
            ]}
            onPress={() => setHasOverseasExp("No")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.yesNoToggleBtnText,
                isOverseasNo && styles.yesNoToggleBtnTextActive,
              ]}
            >
              {t("no", "No")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form Card 2: Choose your preference */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="globe-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("chooseYourPreferenceTitle", "Choose your preference")} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <Text style={styles.fieldLabelSub}>
              {t("selectOneOptionSub", "Select one option that suits you best")}
            </Text>
          </View>
        </View>

        <View style={styles.jobTypeCardListCol}>
          {preferenceOptionsList.map((opt) => {
            const isSelected =
              locationPreference === opt.id ||
              (opt.id === "Both" && (locationPreference === "Both" || locationPreference === "Global"));

            return (
              <React.Fragment key={`pref_card_${opt.id}`}>
                <TouchableOpacity
                  style={[
                    styles.jobTypeOptionCard,
                    isSelected && styles.jobTypeOptionCardSelected,
                  ]}
                  onPress={() => handleSelectPref(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.jobTypeIconCircle}>
                    <Ionicons name={opt.icon} size={normalize(18)} color="#153e69" />
                  </View>
                  <View style={styles.jobTypeTextCol}>
                    <Text style={styles.jobTypeCardTitle}>{opt.title}</Text>
                    <Text style={styles.jobTypeCardSub}>{opt.desc}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                    size={normalize(22)}
                    color={isSelected ? "#153e69" : "#cbd5e1"}
                  />
                </TouchableOpacity>

                {/* Sub-dropdown when India or Overseas is selected */}
                {isSelected && opt.id === "India" && (
                  <TouchableOpacity
                    style={styles.locationSubDropdownBtn}
                    onPress={() => openSearchModal("state")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.locationSubDropdownText}>
                      {city && locationPreference === "India"
                        ? city
                        : t("selectStatePlaceholder", "Select State")}
                    </Text>
                    <Ionicons name="chevron-down" size={normalize(18)} color="#64748b" />
                  </TouchableOpacity>
                )}

                {isSelected && opt.id === "Overseas" && (
                  <TouchableOpacity
                    style={styles.locationSubDropdownBtn}
                    onPress={() => openSearchModal("region")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.locationSubDropdownText}>
                      {city && locationPreference === "Overseas"
                        ? city
                        : t("selectRegionPlaceholder", "Select Region")}
                    </Text>
                    <Ionicons name="chevron-down" size={normalize(18)} color="#64748b" />
                  </TouchableOpacity>
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Why We Ask This Card */}
      <View style={styles.proTipCardBox}>
        <View style={styles.proTipIconCircle}>
          <Ionicons name="bulb" size={normalize(20)} color="#facc15" />
        </View>
        <View style={styles.proTipTextCol}>
          <Text style={styles.proTipCardTitle}>{t("whyWeAskThisTitle", "Why we ask this?")}</Text>
          <Text style={styles.proTipCardBody}>
            {t("whyWeAskLocationBody", "This helps us personalize job opportunities that match your location preference.")}
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueSolidBtn}
        onPress={() => {
          if (locationPreference !== "Both" && locationPreference !== "Global" && (!toTrimmedString(city) || city.startsWith("Select"))) {
            const placeType = locationPreference === "India" ? "state" : "region";
            Alert.alert(t("requiredField", "Required Field"), t("pleaseSelectWorkLocation", `Please select a ${placeType} for your work location preference.`));
            return;
          }
          next();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.continueSolidBtnText}>{t("continue", "Continue")}</Text>
      </TouchableOpacity>

      {/* Security Footer Notice */}
      <View style={styles.securityFooterNoticeRow}>
        <Ionicons name="lock-closed-outline" size={normalize(14)} color="#16a34a" style={{ marginRight: normalize(4) }} />
        <Text style={styles.securityNoticeText}>
          {t("securePrivateNotice", "Your information is secure and private")}
        </Text>
      </View>
      {/* Search Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "state"
                  ? t("selectStateTitle", "Select State")
                  : t("selectRegionTitle", "Select Region")}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="rgba(10, 5, 4, 0.4)" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="rgba(10, 5, 4, 0.4)" style={styles.searchIcon} />
              <TextInput
                placeholder={t("searchLocationPlaceholder", "Search location...")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInputField}
              />
            </View>

            {/* Items List */}
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {filteredItems.map((item, idx) => (
                <TouchableOpacity
                  key={`${item}-${idx}`}
                  style={[styles.modalItem, city === item && styles.modalItemActive]}
                  onPress={() => {
                    setCity(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, city === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {city === item && (
                    <Ionicons name="checkmark" size={20} color="#153e69" />
                  )}
                </TouchableOpacity>
              ))}
              {filteredItems.length === 0 && (
                <Text style={styles.noResultsText}>No matching locations found.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const categoryJobTitles = {
  "Kitchen Production": [
    "Bakery Commis", "Batch Cooking Staff", "BBQ Commis", "Buffet Setup Staff", "Burger Maker", 
    "Butcher", "Catering Helper", "CDP (Chef de Partie)", "Central Kitchen Staff", "Chaat Maker", 
    "Chapati Maker", "Chicken Cutter", "Chinese Commis", "Chopping Staff", "Cleaning Staff", 
    "Coffee Maker", "Commis I", "Commis II", "Commis III", "Continental Commis", "Counter Crew", 
    "Curry Maker", "Cutting Staff", "Demi Chef de Partie", "Dishwasher", "Dispatch Staff", 
    "Dosa Maker", "Fast Food Crew", "Fish Cleaner", "Food Packing Staff", "Food Preparation Staff", 
    "Frozen Food Preparation Staff", "Fry Cook", "General Helper", "Grill Maker", "Indian Commis", 
    "Inventory Helper", "Juice Maker", "Kitchen Assistant", "Kitchen Helper", "Kitchen Steward", 
    "Line Cook", "Meat Cutter", "Naan Maker", "Order Packing Staff", "Packing Staff", 
    "Parcel Packing Staff", "Parotta Maker", "Pastry Commis", "Pizza Maker", "Prep Cook", 
    "Preparation Staff", "Production Helper", "Production Staff", "QSR Crew Member", 
    "Ready-to-Eat Production Staff", "Roti Maker", "Salad Maker", "Sandwich Maker", 
    "Service Crew", "Shawarma Maker", "Store Helper", "Tandoor Commis", "Tandoor Roti Maker", 
    "Tea Maker", "Utility Worker", "Vegetable Cutter", "Wok Cook"
  ],
  "Restaurant Operations": [
    "Restaurant Manager", "Assistant Restaurant Manager", "Outlet Manager", "Floor Supervisor", 
    "Restaurant Supervisor", "Captain", "Senior Captain", "Steward", "Senior Steward", 
    "Cashier", "Host", "Hostess", "Food Runner", "Busser", "Order Taker"
  ],
  "Café & Beverage": [
    "Café Manager", "Barista", "Senior Barista", "Coffee Master", "Tea Maker", 
    "Juice Maker", "Smoothie Specialist", "Beverage Specialist"
  ],
  "QSR & Fast Food": [
    "QSR Manager", "Shift Manager", "Counter Staff", "Crew Member", "Drive Thru Staff", 
    "Packing Staff", "Food Preparation Staff", "Fryer Operator", "Production Crew"
  ],
  "Catering & Banquet": [
    "Catering Manager", "Banquet Supervisor", "Banquet Captain", "Event Catering Coordinator", 
    "Outdoor Catering Staff", "Buffet Setup Staff", "Service Crew", "Banquet Steward"
  ]
};

const businessTypeCategories = [
  {
    id: "QSR & Fast Food",
    title: "QSR (Quick Service Restaurant)",
    subTitle: "Fast food, counter service, takeaways",
    icon: "fast-food-outline",
  },
  {
    id: "Restaurant Operations",
    title: "Restaurant",
    subTitle: "Full service dining, casual or fine dining",
    icon: "restaurant-outline",
  },
  {
    id: "Café & Beverage",
    title: "Café",
    subTitle: "Cafés, coffee shops, lounges, tea houses",
    icon: "cafe-outline",
  },
  {
    id: "Cloud Kitchen",
    title: "Cloud Kitchen",
    subTitle: "Online kitchens, delivery only brands",
    icon: "flame-outline",
  },
  {
    id: "Hotel / Resort",
    title: "Hotel / Resort",
    subTitle: "Hotels, resorts, homestays, lodges",
    icon: "business-outline",
  },
  {
    id: "Catering & Banquet",
    title: "Catering",
    subTitle: "Event catering, corporate catering, banquets",
    icon: "wine-outline",
  },
  {
    id: "Kitchen Production",
    title: "Others",
    subTitle: "Other hospitality businesses",
    icon: "grid-outline",
  },
];

function CategoryStep({ onSubmit, onSkip, t, preferredRole, setPreferredRole, skills, setSkills, loading }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [jobTitleModalVisible, setJobTitleModalVisible] = useState(false);
  const [jobTitleSearch, setJobTitleSearch] = useState("");

  useEffect(() => {
    if (!preferredRole) return;
    const initialCat = Object.keys(categoryJobTitles).find((cat) =>
      categoryJobTitles[cat].includes(preferredRole)
    );
    if (initialCat) {
      setSelectedCategory(initialCat);
    }
  }, [preferredRole]);

  const jobTitlesList = selectedCategory ? (categoryJobTitles[selectedCategory] || []) : [];
  const filteredJobTitles = jobTitlesList.filter((title) =>
    title.toLowerCase().includes(jobTitleSearch.toLowerCase())
  );

  return (
    <View style={styles.modernStepContent}>
      {/* Title & Subtitle */}
      <Text style={styles.stepMainHeading}>
        {t("whichBusinessTypeHeading", "Which business type best matches your experience?")}
      </Text>
      <Text style={styles.stepMainSubheading}>
        {t("whichBusinessTypeSubHeading", "Select the type of hospitality business you have worked in or are most interested in.")}
      </Text>

      {/* Field Block: Choose business type */}
      <View style={styles.formFieldBlock}>
        <View style={styles.fieldHeaderRow}>
          <View style={styles.fieldHeaderIconCircle}>
            <Ionicons name="storefront-outline" size={normalize(16)} color="#153e69" />
          </View>
          <View style={styles.fieldHeaderTextCol}>
            <Text style={styles.fieldLabelTitle}>
              {t("chooseBusinessTypeTitle", "Choose business type")} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <Text style={styles.fieldLabelSub}>
              {t("chooseBusinessTypeSub", "This helps us show you the most relevant roles.")}
            </Text>
          </View>
        </View>

        <View style={styles.jobTypeCardListCol}>
          {businessTypeCategories.map((item) => {
            const isSelected = selectedCategory === item.id;
            return (
              <View
                key={`biz_cat_${item.id}`}
                style={[
                  styles.jobTypeOptionCard,
                  isSelected && styles.jobTypeOptionCardSelected,
                  { flexDirection: "column", alignItems: "stretch" },
                ]}
              >
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={() => {
                    setSelectedCategory(item.id);
                    if (selectedCategory !== item.id) {
                      setPreferredRole("");
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.jobTypeIconCircle}>
                    <Ionicons name={item.icon} size={normalize(18)} color="#153e69" />
                  </View>
                  <View style={styles.jobTypeTextCol}>
                    <Text style={styles.jobTypeCardTitle}>{item.title}</Text>
                    <Text style={styles.jobTypeCardSub}>{item.subTitle}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                    size={normalize(22)}
                    color={isSelected ? "#153e69" : "#cbd5e1"}
                  />
                </TouchableOpacity>

                {/* Inline Role Selector Dropdown when card is selected */}
                {isSelected && (
                  <View style={styles.inlineRoleSelectorBlock}>
                    <Text style={styles.inlineRoleSelectorLabel}>
                      {t("selectInterestedRole", "Select your interested role")} <Text style={{ color: "#ef4444" }}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.inlineRoleDropdownTriggerBtn}
                      onPress={() => {
                        setJobTitleSearch("");
                        setJobTitleModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.inlineRoleDropdownTriggerText,
                          !preferredRole && { color: "#94a3b8" },
                        ]}
                      >
                        {preferredRole || t("selectRolePlaceholder", "Select role...")}
                      </Text>
                      <Ionicons name="chevron-down" size={normalize(18)} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Why We Ask This Card */}
      <View style={styles.proTipCardBox}>
        <View style={styles.proTipIconCircle}>
          <Ionicons name="bulb" size={normalize(20)} color="#facc15" />
        </View>
        <View style={styles.proTipTextCol}>
          <Text style={styles.proTipCardTitle}>{t("whyWeAskThisTitle", "Why we ask this?")}</Text>
          <Text style={styles.proTipCardBody}>
            {t("whyWeAskCategoryBody", "This helps us recommend the right job opportunities that match your experience.")}
          </Text>
        </View>
      </View>

      {/* Save & Continue Button */}
      <TouchableOpacity
        style={styles.continueSolidBtn}
        onPress={() => {
          if (!toTrimmedString(preferredRole)) {
            Alert.alert(
              t("requiredField", "Required Field"),
              t("pleaseSelectRole", "Please select your interested job role.")
            );
            return;
          }
          onSubmit();
        }}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: normalize(8) }}>
            <Text style={styles.continueSolidBtnText}>{t("saveAndContinue", "Save & Continue")}</Text>
            <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Security Footer Notice */}
      <View style={styles.securityFooterNoticeRow}>
        <Ionicons name="lock-closed-outline" size={normalize(14)} color="#16a34a" style={{ marginRight: normalize(4) }} />
        <Text style={styles.securityNoticeText}>
          {t("securePrivateNotice", "Your information is secure and private")}
        </Text>
      </View>

      {/* Specific Job Title Search Modal */}
      <Modal
        visible={jobTitleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setJobTitleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {selectedCategory} Role</Text>
              <TouchableOpacity onPress={() => setJobTitleModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="rgba(10, 5, 4, 0.4)" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="rgba(10, 5, 4, 0.4)" style={styles.searchIcon} />
              <TextInput
                placeholder={t("searchRolesPlaceholder", "Search job roles...")}
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={jobTitleSearch}
                onChangeText={setJobTitleSearch}
                style={styles.searchInputField}
              />
            </View>

            {/* Items List */}
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {filteredJobTitles.map((item, idx) => (
                <TouchableOpacity
                  key={`${item}-${idx}`}
                  style={[styles.modalItem, preferredRole === item && styles.modalItemActive]}
                  onPress={() => {
                    setPreferredRole(item);
                    setJobTitleModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, preferredRole === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {preferredRole === item && (
                    <Ionicons name="checkmark" size={20} color="#153e69" />
                  )}
                </TouchableOpacity>
              ))}
              {filteredJobTitles.length === 0 && (
                <Text style={styles.noResultsText}>No matching job titles found.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SuccessStep({ t, onReturnPress, progressPercentage }) {
  return (
    <View style={styles.successStepContainer}>
      {/* Header Banner Image */}
      <Image
        source={talentProfileImg}
        style={styles.successHeaderBannerImg}
        resizeMode="cover"
      />

      {/* Main Title & Subtitle */}
      <Text style={styles.successHeadingText}>
        {t("profileCompletedHeading", "Profile Completed!")}
      </Text>
      <Text style={styles.successSubHeadingText}>
        {t("profileCompletedSubHeading", "Congratulations! Your profile has been successfully set up.")}
      </Text>

      {/* Green Check Status Card */}
      <View style={styles.greenCheckStatusCardBox}>
        <View style={styles.greenCheckIconCircle}>
          <Ionicons name="checkmark" size={normalize(18)} color="#ffffff" />
        </View>
        <View style={styles.greenCheckTextCol}>
          <Text style={styles.greenCheckTitle}>{t("youreAllSetTitle", "You're all set!")}</Text>
          <Text style={styles.greenCheckSub}>
            {t("youreAllSetSub", "You can now start applying for jobs and connect with top hospitality employers.")}
          </Text>
        </View>
      </View>

      {/* Profile Completion Box */}
      <View style={styles.successCompletionCardBox}>
        <View style={styles.profileCompletionRow}>
          <Text style={styles.profileCompletionLabel}>
            {t("profileCompletion", "Profile Completion")}
          </Text>
          <Text style={styles.profileCompletionValue}>{`${progressPercentage || 100}% Complete`}</Text>
        </View>

        <View style={styles.profileCompletionTrack}>
          <View
            style={[styles.profileCompletionFill, { width: `${progressPercentage || 100}%` }]}
          />
        </View>
      </View>

      {/* Party Popper Card */}
      <View style={styles.partyPopperCardBox}>
        <View style={styles.partyPopperTextCol}>
          <Text style={styles.partyPopperTitle}>🎉 {t("youreNowReadyTitle", "You're now ready!")}</Text>
          <Text style={styles.partyPopperSub}>
            {t("youreNowReadySub", "Explore new opportunities from the Community Job Feed.")}
          </Text>
          <Text style={styles.partyPopperLuckText}>
            {t("goodLuckText", "Good luck on your journey! 🍀")}
          </Text>
        </View>
      </View>

      {/* Go to Job Feed Button */}
      <TouchableOpacity
        style={[styles.continueSolidBtn, { width: "100%" }]}
        onPress={onReturnPress}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: normalize(8), width: "100%" }}>
          <Text style={styles.continueSolidBtnText}>{t("goToJobFeed", "Go to Job Feed")}</Text>
          <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" opacity={0.9} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Modern Header Styling
  modernHeaderContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: normalize(16),
    paddingTop: normalize(12),
    paddingBottom: normalize(14),
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  modernHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(14),
  },
  headerBackBtnCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleCenterCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
  },
  headerStepSubtitle: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#64748b",
    marginTop: normalize(2),
  },
  skipBtnTouch: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
  },
  skipBtnText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#153e69",
  },
  // Numbered Step Circle Line
  numberedStepLineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(14),
    paddingHorizontal: normalize(20),
  },
  stepNumCircle: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumCircleActive: {
    backgroundColor: "#153e69",
  },
  stepNumCircleInactive: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  stepNumCircleText: {
    fontSize: normalize(13),
    fontWeight: "700",
  },
  stepNumCircleTextActive: {
    color: "#ffffff",
  },
  stepNumCircleTextInactive: {
    color: "#94a3b8",
  },
  stepNumConnectorLine: {
    flex: 1,
    height: normalize(2),
    marginHorizontal: normalize(4),
  },
  stepNumConnectorLineActive: {
    backgroundColor: "#153e69",
  },
  stepNumConnectorLineInactive: {
    backgroundColor: "#e2e8f0",
  },

  // Profile Completion Row & Track
  profileCompletionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(6),
  },
  profileCompletionLabel: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#0f172a",
  },
  profileCompletionValue: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#153e69",
  },
  profileCompletionTrack: {
    height: normalize(6),
    backgroundColor: "#e2e8f0",
    borderRadius: normalize(3),
    overflow: "hidden",
    width: "100%",
  },
  profileCompletionFill: {
    height: "100%",
    backgroundColor: "#153e69",
    borderRadius: normalize(3),
  },

  // Form Field Block & Header
  formFieldBlock: {
    marginBottom: normalize(20),
  },
  fieldHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(10),
  },
  fieldHeaderIconCircle: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(17),
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(10),
  },
  fieldHeaderTextCol: {
    flex: 1,
  },
  fieldLabelTitle: {
    fontSize: normalize(14.5),
    fontWeight: "800",
    color: "#0f172a",
  },
  fieldLabelSub: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#64748b",
    marginTop: normalize(1),
  },
  modernInputWrapper: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(14),
    paddingVertical: Platform.OS === "ios" ? normalize(12) : normalize(8),
    minHeight: normalize(48),
    justifyContent: "center",
  },
  modernTextInput: {
    fontSize: normalize(14.5),
    fontWeight: "600",
    color: "#0f172a",
    padding: 0,
  },
  // Overseas Question Card Box
  overseasQuestionCardBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(20),
  },
  overseasCardLeftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: normalize(12),
  },
  overseasCardTextCol: {
    flex: 1,
  },
  overseasQuestionTitle: {
    fontSize: normalize(13.5),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(2),
  },
  overseasQuestionSub: {
    fontSize: normalize(11.5),
    fontWeight: "500",
    color: "#64748b",
    lineHeight: normalize(16),
  },
  yesNoToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: normalize(10),
  },
  yesNoToggleBtn: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(8),
    borderRadius: normalize(10),
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  yesNoToggleBtnActive: {
    borderColor: "#153e69",
    backgroundColor: "#ffffff",
  },
  yesNoToggleBtnText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#64748b",
  },
  yesNoToggleBtnTextActive: {
    color: "#153e69",
  },

  // Location Sub-Dropdown Button
  locationSubDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(12),
    marginTop: normalize(-2),
    marginBottom: normalize(8),
    marginLeft: normalize(16),
  },
  locationSubDropdownText: {
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#0f172a",
  },

  // Gender Cards
  modernGenderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
  },
  modernGenderCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(12),
    paddingVertical: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    gap: normalize(6),
  },
  modernGenderCardSelected: {
    backgroundColor: "#153e69",
    borderColor: "#153e69",
  },
  modernGenderText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#0f172a",
  },
  modernGenderTextSelected: {
    color: "#ffffff",
  },

  // Job Type Option Cards
  jobTypeCardListCol: {
    flexDirection: "column",
    gap: normalize(10),
  },
  jobTypeOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(14),
    padding: normalize(14),
  },
  jobTypeOptionCardSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#153e69",
  },
  jobTypeIconCircle: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(12),
  },
  jobTypeTextCol: {
    flex: 1,
  },
  jobTypeCardTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(2),
  },
  jobTypeCardSub: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#64748b",
  },

  // Inline Role Selector Block inside Business Type Card
  inlineRoleSelectorBlock: {
    marginTop: normalize(12),
    paddingTop: normalize(12),
    borderTopWidth: 1,
    borderColor: "#dbeafe",
  },
  inlineRoleSelectorLabel: {
    fontSize: normalize(12.5),
    fontWeight: "700",
    color: "#153e69",
    marginBottom: normalize(6),
  },
  inlineRoleDropdownTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(10),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(10),
  },
  inlineRoleDropdownTriggerText: {
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#0f172a",
  },

  // Success Step Styling
  successStepContainer: {
    paddingHorizontal: normalize(20),
    paddingTop: normalize(20),
    paddingBottom: normalize(30),
    alignItems: "center",
  },
  successHeaderBannerImg: {
    width: SCREEN_WIDTH,
    height: normalize(220),
    marginTop: normalize(-20),
    marginBottom: normalize(16),
    alignSelf: "center",
  },
  celebrationCircleOuter: {
    width: normalize(96),
    height: normalize(96),
    borderRadius: normalize(48),
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(20),
  },
  celebrationCircleInner: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
  },
  successHeadingText: {
    fontSize: normalize(24),
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: normalize(8),
  },
  successSubHeadingText: {
    fontSize: normalize(14),
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    marginBottom: normalize(24),
    paddingHorizontal: normalize(10),
  },
  greenCheckStatusCardBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(16),
  },
  greenCheckIconCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(12),
  },
  greenCheckTextCol: {
    flex: 1,
  },
  greenCheckTitle: {
    fontSize: normalize(14.5),
    fontWeight: "800",
    color: "#14532d",
    marginBottom: normalize(2),
  },
  greenCheckSub: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#166534",
    lineHeight: normalize(16),
  },
  successCompletionCardBox: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(16),
  },
  partyPopperCardBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: normalize(16),
    padding: normalize(16),
    marginBottom: normalize(24),
  },
  partyPopperTextCol: {
    width: "100%",
  },
  partyPopperTitle: {
    fontSize: normalize(15),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(4),
  },
  partyPopperSub: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#64748b",
    marginBottom: normalize(8),
    lineHeight: normalize(18),
  },
  partyPopperLuckText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#15803d",
  },

  // Modern Step Content
  modernStepContent: {
    paddingHorizontal: normalize(20),
    paddingTop: normalize(20),
    paddingBottom: normalize(32),
  },
  stepMainHeading: {
    fontSize: normalize(24),
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: normalize(8),
    textAlign: "left",
  },
  stepMainSubheading: {
    fontSize: normalize(13.5),
    fontWeight: "500",
    color: "#64748b",
    lineHeight: normalize(20),
    marginBottom: normalize(24),
  },

  // Center Avatar Circle Container
  avatarCircleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: normalize(16),
  },
  avatarCircleWrapper: {
    position: "relative",
    width: normalize(180),
    height: normalize(180),
    borderRadius: normalize(90),
  },
  avatarImageCircle: {
    width: normalize(180),
    height: normalize(180),
    borderRadius: normalize(90),
    resizeMode: "cover",
  },
  avatarPlaceholderCircle: {
    width: normalize(180),
    height: normalize(180),
    borderRadius: normalize(90),
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: normalize(6),
    right: normalize(6),
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // Pro Tip Box
  proTipCardBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: normalize(16),
    padding: normalize(16),
    marginTop: normalize(20),
    marginBottom: normalize(24),
  },
  proTipIconCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: "#153e69",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(12),
  },
  proTipTextCol: {
    flex: 1,
  },
  proTipCardTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: "#153e69",
    marginBottom: normalize(3),
  },
  proTipCardBody: {
    fontSize: normalize(12.5),
    fontWeight: "500",
    color: "#475569",
    lineHeight: normalize(18),
  },

  // Action Buttons Row
  photoActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    marginBottom: normalize(16),
  },
  uploadPhotoOutlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#153e69",
    borderRadius: normalize(12),
    paddingVertical: normalize(13),
  },
  uploadPhotoBtnText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#153e69",
  },
  takePhotoHighlightBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffbeb",
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    borderRadius: normalize(12),
    paddingVertical: normalize(13),
  },
  takePhotoBtnText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: "#0f172a",
  },

  // Continue Button
  continueSolidBtn: {
    width: "100%",
    backgroundColor: "#002b5c",
    borderRadius: normalize(12),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(20),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(20),
    shadowColor: "#002b5c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueSolidBtnText: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#ffffff",
  },

  // Security Footer Notice
  securityFooterNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  securityNoticeText: {
    fontSize: normalize(12),
    fontWeight: "500",
    color: "#64748b",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  skip: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  stepText: {
    fontWeight: "600",
  },
  complete: {
    color: PRIMARY,
    fontWeight: "700",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  progressFill: {
    height: 6,
    backgroundColor: PRIMARY,
    borderRadius: 10,
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  subHeading: {
    color: "#666",
    lineHeight: 22,
  },
  avatarBox: {
    height: 180,
    width: 180,
    borderRadius: 90,
    backgroundColor: "#F3F4F6",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  tipCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
    marginTop: 10,
    color: "#0a0504",
    fontSize: 15,
  },
  label: {
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  genderCard: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#DDD",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  genderCardSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  genderText: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
  },
  genderTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  question: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    color: "#0a0504",
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginTop: 10,
    backgroundColor: "#ffffff",
  },
  pickerTriggerText: {
    fontSize: 15,
    color: "#0a0504",
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  dropdownText: {
    fontSize: 15,
    color: "rgba(10, 5, 4, 0.6)",
  },
  boldText: {
    fontWeight: "700",
    color: PRIMARY,
  },
  option: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#ffffff",
  },
  optionSelected: {
    borderColor: PRIMARY,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  optionText: {
    fontSize: 15,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: PRIMARY,
    fontWeight: "700",
  },
  button: {
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  buttonDisabled: {
    backgroundColor: "rgba(21, 62, 105, 0.3)",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  later: {
    textAlign: "center",
    marginTop: 18,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  success: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  successTitle: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 20,
    color: "#0a0504",
  },
  successText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  successButton: {
    alignSelf: "stretch",
    paddingHorizontal: 18,
    height: 56,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  photoButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 25,
    width: "100%",
  },
  rowButton: {
    flex: 1,
    marginTop: 0,
  },
  actionHighlightBtn: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  actionContinueBtn: {
    backgroundColor: PRIMARY,
  },
  actionLaterBtn: {
    backgroundColor: "#f2f2f3",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  actionHighlightText: {
    fontSize: 16,
    fontWeight: "800",
  },
  actionContinueText: {
    color: "#ffffff",
  },
  actionLaterText: {
    color: "rgba(10, 5, 4, 0.6)",
  },
  uploadButton: {
    backgroundColor: SECONDARY,
    borderWidth: 1.5,
    borderColor: "rgba(21, 62, 105, 0.18)",
  },
  uploadButtonText: {
    color: PRIMARY,
  },
  takePhotoButton: {
    backgroundColor: "rgba(242, 200, 121, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(242, 200, 121, 0.25)",
  },
  takePhotoButtonText: {
    color: PRIMARY,
  },
  subHeadingText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 4,
    marginBottom: 24,
  },
  locationContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    padding: 8,
    marginBottom: 25,
  },
  locationCard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  locationCardSelected: {
    backgroundColor: "#f2f2f3",
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f2f2f3",
    justifyContent: "center",
    alignItems: "center",
  },
  locationInfo: {
    gap: 2,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0504",
  },
  locationDesc: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
  },
  radioWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(10, 5, 4, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioWrapperActive: {
    borderColor: "#153e69",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "transparent",
  },
  radioDotActive: {
    backgroundColor: "#153e69",
  },
  locationDropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginLeft: 52,
    backgroundColor: "#ffffff",
  },
  locationDropdownText: {
    fontSize: 14,
    color: "#0a0504",
    fontWeight: "600",
  },
  locationDivider: {
    height: 1,
    backgroundColor: "#f2f2f3",
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0a0504",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 15,
    color: "#0a0504",
    paddingVertical: 8,
  },
  modalList: {
    marginBottom: 10,
    flexShrink: 1,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  modalItemActive: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  modalItemText: {
    fontSize: 15,
    color: "rgba(10, 5, 4, 0.6)",
  },
  modalItemTextActive: {
    color: "#153e69",
    fontWeight: "600",
  },
  noResultsText: {
    textAlign: "center",
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 20,
    fontSize: 14,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  roleCardSelected: {
    borderColor: "#153e69",
  },
  roleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconCircleActive: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0504",
    flex: 1,
  },
  radioOutline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(10, 5, 4, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#153e69",
  },
  radioDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#153e69",
  },
  inlineDropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 8,
    marginBottom: 12,
    marginLeft: 52,
    backgroundColor: "#f2f2f3",
  },
  inlineDropdownTriggerText: {
    fontSize: 14,
    color: "#0a0504",
    fontWeight: "600",
  },
  categoryChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#f2f2f3",
  },
  categoryChipActive: {
    borderColor: WARM_GOLD,
    backgroundColor: "rgba(242, 199, 121, 0.12)",
  },
  categoryChipText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: PRIMARY,
    fontWeight: "700",
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: "#0a0504",
    fontWeight: "600",
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a0504",
    marginTop: 14,
    marginBottom: 8,
  },
  tagChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  tagChipActive: {
    borderColor: WARM_GOLD,
    backgroundColor: "rgba(242, 199, 121, 0.12)",
  },
  tagChipText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    fontWeight: "500",
  },
  tagChipTextActive: {
    color: PRIMARY,
    fontWeight: "600",
  },
});
