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
  ActivityIndicator,
  BackHandler,
  Dimensions,
  PixelRatio,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { setProfileData, resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { setEmployerOnboardingCompleted, setStoredProfile, clearAuthStorage } from "../../services/storage";
import colors from "../../constants/colors";
import * as ImagePicker from "expo-image-picker";
import { saveEmployerOnboarding } from "../../services/employerApi";
import ModalPicker, { ModalPickerTrigger } from "../../components/common/ModalPicker";
import countryStateCityData from "../../data/countryStateCityData.json";
import useKeyboardAwareScroll from "../../hooks/useKeyboardAwareScroll";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

const PRIMARY_BLUE = "#1860f0";
const DARK_NAVY = "#0f172a";
const TOTAL_STEPS = 4;

const countryOptions = ["India", "Saudi Arabia"];

const businessTypeOptions = [
  "QSR",
  "Restaurant",
  "Cafe",
  "Cloud Kitchen",
  "Hotel / Resort",
  "Catering",
  "Others",
];

export default function EmployerCompleteProfileScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);

  const { scrollViewRef, handleInputFocus: scrollInputFocus } = useKeyboardAwareScroll({ extraOffset: 30 });

  const handleInputFocus = (e, key) => {
    if (key) setActiveInput(key);
    scrollInputFocus(e);
  };

  const isEditMode = route?.params?.isEditMode ?? false;
  const [step, setStep] = useState(1);

  // Initial logo URI
  const getInitialLogoUri = () => {
    const uri = profile?.company_logo || profile?.companyLogo || profile?.profile_photo_path;
    if (!uri) return null;
    if (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("file://") ||
      uri.startsWith("data:")
    ) {
      return uri;
    }
    return `http://178.16.138.159/backend${uri.startsWith("/") ? "" : "/"}${uri}`;
  };

  // Helper to split location string into { city, state, country }
  const parseLocationStr = (locStr) => {
    if (!locStr) return { city: "", state: "", country: "" };
    const parts = String(locStr).split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return {
        city: parts[0],
        state: parts[1],
        country: parts[parts.length - 1],
      };
    } else if (parts.length === 2) {
      return {
        city: parts[0],
        state: parts[1],
        country: "",
      };
    }
    return { city: locStr, state: "", country: "" };
  };

  // Extract initial operational locations (including primary business_location and all operational_locations)
  const getInitialOpLocations = () => {
    let profileLocations =
      profile?.employer_profile?.operational_locations ||
      profile?.employer_profile?.locations ||
      profile?.operational_locations ||
      profile?.locations;

    if (typeof profileLocations === "string") {
      try {
        profileLocations = JSON.parse(profileLocations);
      } catch (e) {
        profileLocations = [profileLocations];
      }
    }

    let list = Array.isArray(profileLocations) ? [...profileLocations] : [];

    // Also check primary business_location if available
    const bizLoc = profile?.business_location || profile?.employer_profile?.business_location;
    if (bizLoc && typeof bizLoc === "string" && !list.includes(bizLoc)) {
      list.unshift(bizLoc);
    }

    if (list.length > 0) {
      return list.map((locStr, idx) => {
        const parsed = typeof locStr === "string" ? parseLocationStr(locStr) : locStr;
        return {
          id: `saved_loc_${idx}_${Date.now()}`,
          city: parsed?.city || "",
          state: parsed?.state || "",
          country: parsed?.country || "",
        };
      }).filter((l) => l.city || l.state || l.country);
    }
    return [];
  };

  const initialOpLocs = getInitialOpLocations();
  // Primary/master country: locked in edit mode, and locked after the first save in create mode.
  const initialCountry = initialOpLocs.length > 0 ? initialOpLocs[0].country : "";

  // Form States
  // STEP 1: Business Information
  const [businessName, setBusinessName] = useState(
    profile?.business_name || profile?.businessName || profile?.company || ""
  );
  const [businessType, setBusinessType] = useState(
    profile?.industry_segment || profile?.segment || ""
  );
  const [logoUri, setLogoUri] = useState(getInitialLogoUri());
  const [logoUploaded, setLogoUploaded] = useState(
    !!(profile?.company_logo || profile?.companyLogo || profile?.profile_photo_path)
  );

  // STEP 2: Business Locations
  const [primaryCountry, setPrimaryCountry] = useState(initialCountry);
  const [primaryState, setPrimaryState] = useState("");
  const [primaryCity, setPrimaryCity] = useState("");
  const [additionalLocations, setAdditionalLocations] = useState(initialOpLocs);
  // When set, the top "location card" is editing an existing saved location (state/city only)
  // instead of adding a brand new one.
  const [editingLocId, setEditingLocId] = useState(null);

  // STEP 3: Contact Information
  const getInitialContactName = () => {
    const nameVal = profile?.contact_person_name || profile?.contactName || profile?.name || profile?.full_name || "";
    const isPhoneLike = /^\+?\d[\d\s-]{6,}$/.test(nameVal);
    return isPhoneLike ? "" : nameVal;
  };
  const [contactName, setContactName] = useState(getInitialContactName());
  const [contactPhone, setContactPhone] = useState(
    profile?.business_mobile || profile?.contactPhone || profile?.phone || profile?.mobile_number || ""
  );
  const [contactEmail, setContactEmail] = useState(
    profile?.business_email || profile?.contactEmail || profile?.email || ""
  );
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile?.preferred_language || profile?.preferredLanguage || "English (UK)"
  );

  // UI States
  const [activeInput, setActiveInput] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showPrimaryCountryModal, setShowPrimaryCountryModal] = useState(false);
  const [showPrimaryStateModal, setShowPrimaryStateModal] = useState(false);
  const [showPrimaryCityModal, setShowPrimaryCityModal] = useState(false);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Country is locked (read-only) once:
  // - we're editing an existing saved location (country can never change for it), OR
  // - the profile is in edit mode (country locked for the whole flow), OR
  // - at least one location has already been saved in this session (create flow) -
  //   every location shares the same master/primary country.
  const isCountryLocked = !!editingLocId || isEditMode || additionalLocations.length > 0;

  // Handle Image Pickers
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("cameraPermissionMsg", "Sorry, we need camera permissions to take a photo.")
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUri(result.assets[0].uri);
        setLogoUploaded(true);
      }
    } catch (error) {
      Alert.alert(t("error", "Error"), t("failedToOpenCamera", "Failed to open camera."));
    }
  };

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionDenied", "Permission Denied"),
          t("cameraRollPermissionMsg", "Sorry, we need camera roll permissions to upload a photo.")
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
        setLogoUri(result.assets[0].uri);
        setLogoUploaded(true);
      }
    } catch (error) {
      Alert.alert(t("error", "Error"), t("failedToSelectPhoto", "Failed to select photo."));
    }
  };

  const handleLogoUpload = () => {
    Alert.alert(
      t("uploadCompanyLogo", "Upload Company Logo"),
      t("chooseSourceForLogo", "Choose a source for your logo image"),
      [
        { text: t("camera", "Camera"), onPress: handleTakePhoto },
        { text: t("gallery", "Gallery"), onPress: handleUploadPhoto },
        { text: t("cancel", "Cancel"), style: "cancel" }
      ]
    );
  };

  // Location Handlers
  // Saves the current top-card entry: either updates the location currently being
  // edited (editingLocId set) or appends a brand new one. Country is never mutated
  // for an existing location — it is fixed the moment a location is first created.
  const handleSaveLocationFromTop = () => {
    if (!primaryCity) {
      Alert.alert(t("error", "Error"), t("selectCityFirst", "Please select a city first."));
      return;
    }

    if (editingLocId) {
      setAdditionalLocations((prev) =>
        prev.map((l) =>
          l.id === editingLocId ? { ...l, state: primaryState, city: primaryCity } : l
        )
      );
      setEditingLocId(null);
    } else {
      const newLoc = {
        id: `addon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        country: primaryCountry,
        state: primaryState,
        city: primaryCity,
      };
      setAdditionalLocations((prev) => [...prev, newLoc]);
    }

    // Country stays as-is (now locked for any further entries); only clear state/city.
    setPrimaryState("");
    setPrimaryCity("");
  };

  const startEditLocation = (loc) => {
    setEditingLocId(loc.id);
    setPrimaryCountry(loc.country);
    setPrimaryState(loc.state);
    setPrimaryCity(loc.city);
  };

  const cancelEditLocation = () => {
    setEditingLocId(null);
    setPrimaryState("");
    setPrimaryCity("");
  };

  const removeAddonLocation = (id) => {
    if (isEditMode) return; // deleting is disabled once editing an existing profile
    if (editingLocId === id) {
      setEditingLocId(null);
      setPrimaryState("");
      setPrimaryCity("");
    }
    setAdditionalLocations((prev) => prev.filter((l) => l.id !== id));
  };

  // Builds the final list of locations for review/submission, folding in any
  // location currently being typed in the top card (new or in-progress edit)
  // without mutating state. All locations always carry the shared primary country.
  const buildFinalLocations = () => {
    let list = [...additionalLocations];
    if (primaryCity) {
      if (editingLocId) {
        list = list.map((l) =>
          l.id === editingLocId ? { ...l, state: primaryState, city: primaryCity } : l
        );
      } else {
        list = [
          ...list,
          { id: "pending_new", country: primaryCountry, state: primaryState, city: primaryCity },
        ];
      }
    }
    return list;
  };

  // Step Navigation
  const nextStep = () => {
    if (step === 1 && (!businessName.trim() || !businessType)) {
      Alert.alert(t("error", "Error"), t("pleaseFillRequiredFields", "Please fill in all required fields."));
      return;
    }
    if (step === 2) {
      if (primaryCity) {
        // Commit whatever is currently in the top card (new add or in-progress edit).
        handleSaveLocationFromTop();
      } else if (additionalLocations.length === 0) {
        Alert.alert(t("error", "Error"), t("primaryCityRequired", "Please select primary city location."));
        return;
      }
    }
    if (step === 3) {
      if (!contactName.trim() || !contactPhone.trim()) {
        Alert.alert(t("error", "Error"), t("contactInfoRequired", "Please fill in all contact details."));
        return;
      }
      if (contactEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail.trim())) {
          Alert.alert(t("error", "Error"), t("validEmailRequired", "Please enter a valid email address."));
          return;
        }
      }
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  // Handle Android hardware back press to go back step-by-step
  useEffect(() => {
    const onBackPress = () => {
      if (step > 1) {
        setStep((prev) => prev - 1);
        return true; // Intercept and handle back press
      }
      return false; // Fallback to default navigation behavior on step 1
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [step]);

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      if (isEditMode && typeof navigation.goBack === "function") {
        navigation.goBack();
      }
    }
  };

  // Final Submission
  const finishOnboarding = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const compiledLocObjs = buildFinalLocations();
      const formattedOpLocations = compiledLocObjs.map((l) =>
        [l.city, l.state, l.country].filter(Boolean).join(", ")
      ).filter(Boolean);

      const primaryLocStr = formattedOpLocations[0] || "";
      const additionalLocStrs = formattedOpLocations.slice(1);

      const formData = new FormData();
      formData.append("business_name", businessName);
      formData.append("industry_segment", businessType);
      formData.append("business_location", primaryLocStr); // Primary location sent ONLY here!
      formData.append("contact_person_name", contactName);
      formData.append("business_mobile", contactPhone);
      formData.append("business_email", contactEmail);
      formData.append("preferred_language", preferredLanguage);

      // Send ONLY additional locations in operational_locations[]
      if (Array.isArray(additionalLocStrs)) {
        additionalLocStrs.forEach((loc) => {
          formData.append("operational_locations[]", loc);
        });
      }

      if (logoUri) {
        const uriParts = logoUri.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split(".").pop();
        formData.append("company_logo", {
          uri: Platform.OS === "android" ? logoUri : logoUri.replace("file://", ""),
          name: fileName,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType || "png"}`,
        });
      }

      const apiResponse = await saveEmployerOnboarding(formData);

      const profileReduxData = {
        name: contactName || "Employer User",
        businessName: businessName,
        company: businessName,
        segment: businessType,
        industry_segment: businessType,
        location: formattedOpLocations[0] || "",
        locations: formattedOpLocations,
        operational_locations: formattedOpLocations,
        contactName,
        contactPhone,
        contactEmail,
        preferredLanguage,
        company_logo: logoUri,
        role: "employer",
        employerOnboardingCompleted: true,
        ...(apiResponse?.data || apiResponse || {}),
      };

      dispatch(setProfileData(profileReduxData));
      await setStoredProfile(profileReduxData);
      await setEmployerOnboardingCompleted(true);

      if (isEditMode) {
        navigation.navigate("EmployerHome");
      } else {
        navigation.reset({ index: 0, routes: [{ name: "EmployerHome" }] });
      }
    } catch (error) {
      console.error("Failed to save employer profile:", error);
      Alert.alert(t("error", "Error"), error.message || t("failedToSaveProfileMsg", "Failed to save profile. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepPills = () => {
    return (
      <View style={styles.stepPillContainer}>
        {[1, 2, 3, 4].map((stepNum) => {
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <React.Fragment key={`step_pill_${stepNum}`}>
              <View style={[
                styles.stepPill,
                isActive && styles.stepPillActive,
                isCompleted && styles.stepPillCompleted
              ]}>
                <Text style={[
                  styles.stepPillText,
                  isActive && styles.stepPillTextActive,
                  isCompleted && styles.stepPillTextCompleted
                ]}>
                  {stepNum}
                </Text>
              </View>
              {stepNum < TOTAL_STEPS && (
                <View style={[
                  styles.stepConnector,
                  isCompleted && styles.stepConnectorCompleted
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Bar Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Ionicons name="arrow-back" size={normalize(22)} color="#0f172a" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t("completeBusinessProfileTitle", "Complete Your Business Profile")}</Text>
          <View style={{ width: normalize(32) }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Pills rendered at top of form */}
          {step <= TOTAL_STEPS && (
            <View style={styles.topFormStepWrapper}>
              {renderStepPills()}
            </View>
          )}
          {/* STEP 1: BUSINESS INFORMATION */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepMainSubtitle}>
                {t("completeBusinessProfileStep1Subtitle", "Let's start with the basics. Tell us about your business and add your logo.")}
              </Text>

              <Text style={styles.sectionHeaderUpper}>{t("businessInformationUpper", "BUSINESS INFORMATION")}</Text>

              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("businessName", "Business Name")}<Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputWrapper, activeInput === "businessName" && styles.inputWrapperActive]}>
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder={t("enterBusinessName", "Enter business name")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "businessName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Business Type Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("businessType", "Business Type")}<Text style={styles.required}>*</Text></Text>
                <ModalPickerTrigger
                  onPress={() => setShowTypeDropdown(true)}
                  label={businessType}
                  placeholder={t("selectBusinessType", "Select Business Type")}
                  isOpen={showTypeDropdown}
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showTypeDropdown}
                  onClose={() => setShowTypeDropdown(false)}
                  title={t("businessType", "Business Type")}
                  options={businessTypeOptions}
                  selectedValue={businessType}
                  onSelect={(val) => setBusinessType(val)}
                />
                <Text style={styles.fieldHint}>{t("selectTypeBusinessOperate", "Select the type of business you operate.")}</Text>
              </View>

              {/* Business Logo Upload Card */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("businessLogo", "Business Logo")}<Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={styles.logoCardBox}
                  activeOpacity={0.8}
                  onPress={handleLogoUpload}
                >
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logoPreviewImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.logoIconCircle}>
                      <Ionicons name="person-outline" size={normalize(26)} color={PRIMARY_BLUE} />
                    </View>
                  )}
                  <Text style={styles.logoUploadTitle}>{logoUploaded ? t("changeLogo", "Change Logo") : t("uploadBusinessLogo", "Upload your business logo")}</Text>
                  <Text style={styles.logoUploadSubtext}>{t("logoRecommendedFormat", "PNG or JPG · Max 5 MB · Square format recommended")}</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Action Button */}
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: BUSINESS LOCATIONS */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepMainSubtitle}>
                {t("completeBusinessProfileStep2Subtitle", "Add your locations to connect with the right Talent.")}
              </Text>

              <Text style={styles.sectionHeaderUpper}>{t("businessLocationsUpper", "BUSINESS LOCATIONS")}</Text>

              {/* Business Location Card — doubles as "Add new" and "Edit existing" depending on editingLocId */}
              <View style={[styles.primaryLocationCard, editingLocId && styles.primaryLocationCardEditing]}>
                <View style={styles.cardTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.primaryLocTitle}>
                      {editingLocId
                        ? t("editLocation", "Edit Location")
                        : additionalLocations.length === 0
                        ? t("primaryBusinessLocation", "Primary Business Location")
                        : additionalLocations.length === 1
                        ? t("secondaryBusinessLocation", "Secondary Location (Location #2)")
                        : additionalLocations.length === 2
                        ? t("tertiaryBusinessLocation", "Tertiary Location (Location #3)")
                        : t("additionalLocationTitle", `Location #${additionalLocations.length + 1}`, { num: additionalLocations.length + 1 })}
                      {!editingLocId && <Text style={styles.required}>*</Text>}
                    </Text>
                    <Text style={styles.primaryLocSubtitle}>
                      {editingLocId
                        ? t("editLocationHint", "Update the state and city for this location.")
                        : additionalLocations.length === 0
                        ? t("primaryLocationDefaultHint", "This location will be used by default when posting a job.")
                        : additionalLocations.length === 1
                        ? t("secondaryLocationHint", "Add your secondary location for hiring Talent.")
                        : t("additionalLocationHint", "Add additional location for hiring Talent.")}
                    </Text>
                  </View>
                  {editingLocId && (
                    <TouchableOpacity onPress={cancelEditLocation} style={styles.cancelEditChip} activeOpacity={0.7}>
                      <Ionicons name="close" size={normalize(14)} color="#64748b" />
                      <Text style={styles.cancelEditChipText}>{t("cancel", "Cancel")}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Country (Hidden once selected/locked) */}
                {!isCountryLocked && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.smallInputLabel}>{t("country", "Country")}</Text>
                    <ModalPickerTrigger
                      onPress={() => setShowPrimaryCountryModal(true)}
                      label={primaryCountry}
                      placeholder={t("selectCountry", "Select Country")}
                      isOpen={showPrimaryCountryModal}
                      style={styles.inputWrapper}
                    />
                    <ModalPicker
                      visible={showPrimaryCountryModal}
                      onClose={() => setShowPrimaryCountryModal(false)}
                      title={t("country", "Country")}
                      options={countryOptions}
                      selectedValue={primaryCountry}
                      onSelect={(val) => {
                        setPrimaryCountry(val);
                        setPrimaryState("");
                        setPrimaryCity("");
                      }}
                      searchable={false}
                    />
                  </View>
                )}

                {/* State / Region */}
                <View style={styles.inputGroup}>
                  <Text style={styles.smallInputLabel}>{t("stateRegion", "State / Region")}</Text>
                  <ModalPickerTrigger
                    onPress={() => setShowPrimaryStateModal(true)}
                    label={primaryState}
                    placeholder={t("selectStateRegion", "Select State / Region")}
                    isOpen={showPrimaryStateModal}
                    style={styles.inputWrapper}
                  />
                  <ModalPicker
                    visible={showPrimaryStateModal}
                    onClose={() => setShowPrimaryStateModal(false)}
                    title={t("stateRegion", "State / Region")}
                    options={countryStateCityData[primaryCountry] ? Object.keys(countryStateCityData[primaryCountry]) : []}
                    selectedValue={primaryState}
                    onSelect={(val) => {
                      setPrimaryState(val);
                      if (primaryCity && countryStateCityData[primaryCountry]?.[val] && !countryStateCityData[primaryCountry][val].includes(primaryCity)) {
                        setPrimaryCity("");
                      }
                    }}
                    searchable
                    searchPlaceholder={t("searchState", "Search State...")}
                  />
                </View>

                {/* City */}
                <View style={styles.inputGroup}>
                  <Text style={styles.smallInputLabel}>{t("city", "City")}</Text>
                  <ModalPickerTrigger
                    onPress={() => setShowPrimaryCityModal(true)}
                    label={primaryCity}
                    placeholder={t("selectCity", "Select City")}
                    isOpen={showPrimaryCityModal}
                    style={styles.inputWrapper}
                  />
                  <ModalPicker
                    visible={showPrimaryCityModal}
                    onClose={() => setShowPrimaryCityModal(false)}
                    title={t("city", "City")}
                    options={primaryState
                      ? (countryStateCityData[primaryCountry]?.[primaryState] || [])
                      : Array.from(new Set(Object.values(countryStateCityData[primaryCountry] || {}).flat())).sort()}
                    selectedValue={primaryCity}
                    onSelect={(val) => {
                      setPrimaryCity(val);
                      if (!primaryState && countryStateCityData[primaryCountry]) {
                        const foundState = Object.keys(countryStateCityData[primaryCountry]).find((st) =>
                          countryStateCityData[primaryCountry][st].includes(val)
                        );
                        if (foundState) setPrimaryState(foundState);
                      }
                    }}
                    searchable
                    searchPlaceholder={t("searchCity", "Search City...")}
                  />
                </View>

                {/* Save & Add / Update Location Button inside card */}
                <TouchableOpacity
                  style={[styles.saveLocationInsideBtn, editingLocId && styles.updateLocationInsideBtn]}
                  activeOpacity={0.8}
                  onPress={handleSaveLocationFromTop}
                >
                  <Ionicons
                    name={editingLocId ? "checkmark-circle-outline" : "add-circle-outline"}
                    size={normalize(18)}
                    color={editingLocId ? "#ffffff" : "#153e69"}
                    style={{ marginRight: normalize(6) }}
                  />
                  <Text style={[styles.saveLocationInsideBtnText, editingLocId && styles.updateLocationInsideBtnText]}>
                    {editingLocId ? t("updateLocation", "Update Location") : t("saveAddLocation", "Save & Add Location")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Added Locations List Below */}
              {additionalLocations.map((loc, idx) => {
                const isBeingEdited = editingLocId === loc.id;
                return (
                  <View
                    key={`added_loc_item_${loc.id}_${idx}`}
                    style={[styles.locationListItem, isBeingEdited && styles.locationListItemActive]}
                  >
                    <View style={styles.locationPinIcon}>
                      <Ionicons name="location" size={normalize(15)} color={PRIMARY_BLUE} />
                    </View>
                    <View style={styles.locationListTextWrap}>
                      <View style={styles.locationListTitleRow}>
                        <Text style={styles.locationListTitle}>{t("location", "Location")} #{idx + 1}</Text>
                        {idx === 0 && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>{t("primaryTag", "Primary")}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.locationListSub}>{[loc.city, loc.state, loc.country].filter(Boolean).join(", ")}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => startEditLocation(loc)}
                      style={styles.iconActionBtn}
                      disabled={isBeingEdited}
                    >
                      <Ionicons name="pencil-outline" size={normalize(16)} color={isBeingEdited ? "#cbd5e1" : PRIMARY_BLUE} />
                    </TouchableOpacity>
                    {!isEditMode && (
                      <TouchableOpacity onPress={() => removeAddonLocation(loc.id)} style={styles.iconActionBtn}>
                        <Ionicons name="trash-outline" size={normalize(16)} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {/* Location Tips Info Card */}
              <View style={styles.locationTipsCard}>
                <Ionicons name="information-circle" size={normalize(20)} color={PRIMARY_BLUE} style={{ marginRight: normalize(8) }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipsTitle}>{t("locationTipsTitle", "Location Tips:")}</Text>
                  <Text style={styles.tipsMsg}>
                    {isEditMode
                      ? t("locationTipsEditMsg", "You can update the state and city of any location, but not its country.")
                      : t("locationTipsMsg", "Multiple locations let you post jobs for specific venues while managing everything from one account.")}
                  </Text>
                </View>
              </View>

              {/* Bottom Button */}
              <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: CONTACT INFORMATION */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepMainSubtitle}>
                {t("completeBusinessProfileStep3Subtitle", "Let Jobrito reach you for important updates.")}
              </Text>

              <Text style={styles.sectionHeaderUpper}>{t("contactInformationUpper", "CONTACT INFORMATION")}</Text>
              <Text style={styles.stepMainSubtitle}>
                {t("contactInformationHint", "Your contact details help Jobrito reach you about job postings, your account, and important updates.")}
              </Text>

              {/* Contact Person Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("contactPerson", "Contact Person")}<Text style={styles.required}>*</Text></Text>
                <View style={[styles.inputWrapper, activeInput === "contactName" && styles.inputWrapperActive]}>
                  <TextInput
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder={t("enterFullName", "Enter full name")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "contactName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Mobile Number (Disabled with Lock Icon) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("mobileNumber", "Mobile Number")}<Text style={styles.required}>*</Text></Text>
                <View style={styles.mobileInputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <View style={[styles.lockedMobileWrapper, { flex: 1 }]}>
                    <TextInput
                      value={contactPhone}
                      editable={false}
                      placeholder="XXXXX XXXXX"
                      placeholderTextColor="rgba(10, 5, 4, 0.4)"
                      style={styles.disabledInputText}
                    />
                    <Ionicons name="lock-closed" size={normalize(16)} color="#94a3b8" />
                  </View>
                </View>
                <View style={styles.verifiedRow}>
                  <Ionicons name="checkmark-sharp" size={normalize(16)} color="#16a34a" />
                  <Text style={styles.verifiedText}>{t("verified", "Verified")}</Text>
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("emailAddress", "Email Address")}</Text>
                <View style={[styles.inputWrapper, activeInput === "contactEmail" && styles.inputWrapperActive]}>
                  <TextInput
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder="email@example.com"
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    onFocus={(e) => handleInputFocus(e, "contactEmail")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Bottom Button */}
              <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
                <Text style={styles.primaryButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={normalize(18)} color="#ffffff" style={{ marginLeft: normalize(6) }} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              {/* Illustration Clipboard Badge */}
              <View style={styles.readyBadgeWrapper}>
                <View style={styles.readyCircleOuter}>
                  <View style={styles.readyCircleInner}>
                    <Ionicons name="clipboard-outline" size={normalize(36)} color={PRIMARY_BLUE} />
                  </View>
                  <View style={styles.readyCheckDot}>
                    <Ionicons name="checkmark-sharp" size={normalize(14)} color="#ffffff" />
                  </View>
                </View>
              </View>

              <Text style={styles.readyMainTitle}>{t("yourProfileIsReady", "YOUR PROFILE IS READY")}</Text>
              <Text style={styles.readySubtitle}>
                {t("reviewProfileNotice", "Review your information and submit your profile for approval.")}
              </Text>

              {/* Summary Card */}
              <View style={styles.summaryCardBox}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryCardTitle}>{t("yourBusinessProfile", "Your Business Profile")}</Text>
                  <TouchableOpacity onPress={() => setStep(1)} activeOpacity={0.7}>
                    <Text style={styles.editBtnText}>{t("edit", "Edit")}</Text>
                  </TouchableOpacity>
                </View>

                {/* Logo + Name + Type */}
                <View style={styles.summaryBizRow}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.summaryLogoImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.summaryLogoPlaceholder}>
                      <Ionicons name="business" size={normalize(22)} color="#ffffff" />
                    </View>
                  )}
                  <View style={styles.summaryBizDetails}>
                    <Text style={styles.summaryBizLabel}>{t("businessName", "Business Name")}</Text>
                    <Text style={styles.summaryBizName}>{businessName || "-"}</Text>

                    <Text style={[styles.summaryBizLabel, { marginTop: normalize(6) }]}>{t("businessType", "Business Type")}</Text>
                    <Text style={styles.summaryBizValue}>{businessType || "-"}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                {/* Locations List */}
                <Text style={styles.summarySectionLabel}>{t("locations", "Locations")}</Text>
                <View style={styles.summaryLocList}>
                  {buildFinalLocations().map((l, idx) => (
                    <Text key={`compiled_loc_summary_${idx}_${l.city}`} style={styles.summaryLocItem}>
                      {idx + 1}. {[l.city, l.state, l.country].filter(Boolean).join(", ")}{idx === 0 ? ` (${t("primaryTag", "Primary")})` : ""}
                    </Text>
                  ))}
                </View>

                <View style={styles.summaryDivider} />

                {/* Contact Info Table */}
                <View style={styles.summaryInfoRow}>
                  <Text style={styles.summaryInfoLabel}>{t("contactPerson", "Contact Person")}</Text>
                  <Text style={styles.summaryInfoValue}>{contactName || "-"}</Text>
                </View>

                <View style={styles.summaryInfoRow}>
                  <Text style={styles.summaryInfoLabel}>{t("mobileNumber", "Mobile Number")}</Text>
                  <Text style={styles.summaryInfoValue}>+91 {contactPhone || "-"}</Text>
                </View>

                {!!(contactEmail && contactEmail.trim()) && (
                  <View style={styles.summaryInfoRow}>
                    <Text style={styles.summaryInfoLabel}>{t("emailAddress", "Email Address")}</Text>
                    <Text style={styles.summaryInfoValue}>{contactEmail.trim()}</Text>
                  </View>
                )}
              </View>

              {/* Complete Registration / Save Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: normalize(20) }, isSaving && { opacity: 0.6 }]}
                activeOpacity={0.8}
                onPress={finishOnboarding}
                disabled={isSaving}
              >
                <Text style={styles.primaryButtonText}>
                  {isSaving
                    ? t("saving", "Saving...")
                    : (isEditMode ? t("saveProfile", "Save Profile") : t("completeRegistration", "Complete Registration"))}
                </Text>
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
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.08)",
  },
  headerTitle: {
    fontSize: normalize(16),
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  backButton: {
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
    gap: normalize(6),
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
    backgroundColor: PRIMARY_BLUE,
  },
  stepPillCompleted: {
    backgroundColor: PRIMARY_BLUE,
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
  stepConnector: {
    width: normalize(20),
    height: 2,
    backgroundColor: "#e2e8f0",
  },
  stepConnectorCompleted: {
    backgroundColor: PRIMARY_BLUE,
  },
  scrollContent: {
    paddingHorizontal: normalize(16),
    paddingTop: normalize(10),
    paddingBottom: normalize(50),
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepMainTitle: {
    fontSize: normalize(18),
    fontWeight: "900",
    color: DARK_NAVY,
    marginBottom: normalize(4),
  },
  stepMainSubtitle: {
    fontSize: normalize(12),
    color: "#64748b",
    lineHeight: normalize(16),
    marginBottom: normalize(14),
  },
  sectionHeaderUpper: {
    fontSize: normalize(11),
    fontWeight: "800",
    color: PRIMARY_BLUE,
    letterSpacing: 0.8,
    marginBottom: normalize(12),
    textTransform: "uppercase",
  },
  inputGroup: {
    marginBottom: normalize(14),
  },
  inputLabel: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: DARK_NAVY,
    marginBottom: normalize(6),
  },
  smallInputLabel: {
    fontSize: normalize(11),
    fontWeight: "600",
    color: "#64748b",
    marginBottom: normalize(4),
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(12),
    minHeight: normalize(46),
  },
  inputWrapperActive: {
    borderColor: PRIMARY_BLUE,
    backgroundColor: "#ffffff",
  },
  textInput: {
    flex: 1,
    fontSize: normalize(13.5),
    color: DARK_NAVY,
    paddingVertical: normalize(8),
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
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#475569",
  },
  lockedMobileWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(12),
    height: normalize(46),
  },
  fieldHint: {
    fontSize: normalize(10.5),
    color: "#94a3b8",
    marginTop: normalize(4),
  },
  logoCardBox: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: normalize(14),
    backgroundColor: "#f8fafc",
    padding: normalize(18),
    alignItems: "center",
    justifyContent: "center",
  },
  logoPreviewImage: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(12),
    marginBottom: normalize(10),
  },
  logoIconCircle: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize(10),
  },
  logoUploadTitle: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: DARK_NAVY,
    marginBottom: 3,
  },
  logoUploadSubtext: {
    fontSize: normalize(11),
    color: "#94a3b8",
    textAlign: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_BLUE,
    borderRadius: normalize(12),
    minHeight: normalize(46),
    paddingHorizontal: normalize(16),
    marginTop: normalize(8),
  },
  primaryButtonText: {
    fontSize: normalize(14),
    fontWeight: "700",
    color: "#ffffff",
  },
  primaryLocationCard: {
    backgroundColor: "#f8fafc",
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: normalize(14),
    marginBottom: normalize(14),
  },
  primaryLocationCardEditing: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
    borderWidth: 1.5,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: normalize(4),
  },
  cancelEditChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(16),
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    marginLeft: normalize(8),
  },
  cancelEditChipText: {
    fontSize: normalize(11),
    fontWeight: "700",
    color: "#64748b",
    marginLeft: 3,
  },
  lockedFieldBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eef2f7",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(12),
    minHeight: normalize(46),
  },
  lockedFieldText: {
    fontSize: normalize(13.5),
    fontWeight: "600",
    color: "#64748b",
  },
  saveLocationInsideBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
    borderRadius: normalize(12),
    backgroundColor: "#eff6ff",
    paddingVertical: normalize(10),
    marginTop: normalize(8),
  },
  updateLocationInsideBtn: {
    borderStyle: "solid",
    borderColor: PRIMARY_BLUE,
    backgroundColor: PRIMARY_BLUE,
  },
  saveLocationInsideBtnText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: "#153e69",
  },
  updateLocationInsideBtnText: {
    color: "#ffffff",
  },
  primaryLocTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: DARK_NAVY,
    marginBottom: 2,
  },
  primaryLocSubtitle: {
    fontSize: normalize(11),
    color: "#64748b",
    marginBottom: normalize(10),
  },
  locationListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: normalize(12),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(10),
    marginBottom: normalize(8),
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  locationListItemActive: {
    borderColor: PRIMARY_BLUE,
    backgroundColor: "#f5f9ff",
  },
  locationPinIcon: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: normalize(8),
  },
  locationListTextWrap: {
    flex: 1,
  },
  locationListTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationListTitle: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: DARK_NAVY,
  },
  primaryBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: normalize(6),
    paddingHorizontal: normalize(6),
    paddingVertical: 2,
    marginLeft: normalize(6),
  },
  primaryBadgeText: {
    fontSize: normalize(9.5),
    fontWeight: "800",
    color: "#15803d",
    textTransform: "uppercase",
  },
  locationListSub: {
    fontSize: normalize(11),
    color: "#64748b",
    marginTop: 1,
  },
  iconActionBtn: {
    padding: normalize(6),
    marginLeft: 2,
  },
  addLocationDottedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
    borderRadius: normalize(12),
    backgroundColor: "#eff6ff",
    paddingVertical: normalize(12),
    marginBottom: normalize(14),
  },
  addLocationDottedText: {
    fontSize: normalize(13),
    fontWeight: "700",
    color: PRIMARY_BLUE,
    marginLeft: 6,
  },
  locationTipsCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderRadius: normalize(12),
    padding: normalize(12),
    marginTop: normalize(4),
    marginBottom: normalize(16),
  },
  tipsTitle: {
    fontSize: normalize(12),
    fontWeight: "800",
    color: PRIMARY_BLUE,
    marginBottom: 2,
  },
  tipsMsg: {
    fontSize: normalize(11),
    color: "#3b82f6",
    lineHeight: normalize(15),
  },
  bottomNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
    marginTop: normalize(8),
  },
  backOutlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    height: normalize(46),
    paddingHorizontal: normalize(16),
    backgroundColor: "#ffffff",
  },
  backOutlineText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: DARK_NAVY,
  },
  mobileInputRow: {
    flexDirection: "row",
    gap: normalize(8),
  },
  countryCodeBox: {
    height: normalize(46),
    paddingHorizontal: normalize(12),
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: normalize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: normalize(13.5),
    fontWeight: "700",
    color: DARK_NAVY,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(4),
  },
  verifiedText: {
    fontSize: normalize(11.5),
    fontWeight: "700",
    color: "#16a34a",
    marginLeft: 4,
  },
  readyBadgeWrapper: {
    alignItems: "center",
    marginVertical: normalize(12),
  },
  readyCircleOuter: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(35),
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  readyCircleInner: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(26),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1860f0",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  readyCheckDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: normalize(22),
    height: normalize(22),
    borderRadius: normalize(11),
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  readyMainTitle: {
    fontSize: normalize(18),
    fontWeight: "900",
    color: DARK_NAVY,
    textAlign: "center",
    marginBottom: normalize(6),
  },
  readySubtitle: {
    fontSize: normalize(12),
    color: "#64748b",
    textAlign: "center",
    lineHeight: normalize(16),
    marginBottom: normalize(16),
    paddingHorizontal: normalize(8),
  },
  summaryCardBox: {
    backgroundColor: "#ffffff",
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: normalize(14),
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(12),
  },
  summaryCardTitle: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: DARK_NAVY,
  },
  editBtnText: {
    fontSize: normalize(12),
    fontWeight: "700",
    color: PRIMARY_BLUE,
  },
  summaryBizRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  summaryLogoImage: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
  },
  summaryLogoPlaceholder: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: PRIMARY_BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryBizDetails: {
    flex: 1,
  },
  summaryBizLabel: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: DARK_NAVY,
    marginBottom: 1,
  },
  summaryBizName: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#64748b",
  },
  summaryBizValue: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#64748b",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: normalize(12),
  },
  summarySectionLabel: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: DARK_NAVY,
    marginBottom: normalize(4),
  },
  summaryLocList: {
    gap: 4,
  },
  summaryLocItem: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#64748b",
    lineHeight: normalize(16),
  },
  summaryInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize(6),
  },
  summaryInfoLabel: {
    fontSize: normalize(14),
    fontWeight: "800",
    color: DARK_NAVY,
  },
  summaryInfoValue: {
    fontSize: normalize(12),
    fontWeight: "600",
    color: "#64748b",
  },
});