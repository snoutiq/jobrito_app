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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { setProfileData, resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { setEmployerOnboardingCompleted, setStoredProfile, clearAuthStorage } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";
import colors from "../../constants/colors";
import * as ImagePicker from "expo-image-picker";
import { saveEmployerOnboarding } from "../../services/employerApi";
import * as Location from "expo-location";
import ModalPicker, { ModalPickerTrigger } from "../../components/common/ModalPicker";

const PRIMARY_GREEN = "#153e69";

// Total steps after merging old Step 3 (logo + operational locations) into Step 1
const TOTAL_STEPS = 4;

export default function EmployerCompleteProfileScreen({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);

  const isEditMode = route?.params?.isEditMode ?? false;
  const [step, setStep] = useState(1);

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

  // Splits "address, city postcode" into { address, cityPostcode } — used both for
  // initial hydration and for keeping the first location in sync with Business Location.
  const splitLocationString = (locStr) => {
    if (!locStr) return { address: "", cityPostcode: "" };
    const lastCommaIndex = locStr.lastIndexOf(",");
    if (lastCommaIndex !== -1) {
      return {
        address: locStr.substring(0, lastCommaIndex).trim(),
        cityPostcode: locStr.substring(lastCommaIndex + 1).trim(),
      };
    }
    return { address: locStr, cityPostcode: "" };
  };

  const getInitialLocations = () => {
    const profileLocations = profile?.operational_locations || profile?.locations;
    if (Array.isArray(profileLocations) && profileLocations.length > 0) {
      return profileLocations.map((locStr, idx) => {
        if (typeof locStr === "string") {
          const split = splitLocationString(locStr);
          return { id: idx + 1, address: split.address, cityPostcode: split.cityPostcode };
        }
        return { id: idx + 1, address: locStr?.address || "", cityPostcode: locStr?.cityPostcode || "" };
      });
    }
    return [{ id: 1, address: "", cityPostcode: "" }];
  };

  // Form State
  const [businessName, setBusinessName] = useState(profile?.business_name || profile?.businessName || profile?.company || "");
  const [industrySegment, setIndustrySegment] = useState(profile?.industry_segment || profile?.segment || "");
  const [businessLocation, setBusinessLocation] = useState(profile?.business_location || profile?.location || "");
  const getInitialContactName = () => {
    const nameVal = profile?.contact_person_name || profile?.contactName || profile?.name || profile?.full_name || "";
    const isPhoneLike = /^\+?\d[\d\s-]{6,}$/.test(nameVal);
    return isPhoneLike ? "" : nameVal;
  };

  const [contactName, setContactName] = useState(getInitialContactName());
  const [contactPhone, setContactPhone] = useState(profile?.business_mobile || profile?.contactPhone || profile?.phone || profile?.mobile_number || "");
  const [contactEmail, setContactEmail] = useState(profile?.business_email || profile?.contactEmail || profile?.email || "");
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || profile?.preferredLanguage || "English (UK)");
  const [privacyChecked, setPrivacyChecked] = useState(true);
  const [logoUploaded, setLogoUploaded] = useState(!!(profile?.company_logo || profile?.companyLogo || profile?.profile_photo_path));
  const [logoUri, setLogoUri] = useState(getInitialLogoUri());

  // Operational Locations state
  const [locations, setLocations] = useState(getInitialLocations());

  // Same as Business Location toggle (keeps location #1 auto-filled from businessLocation)
  const [sameAsBusinessLocation, setSameAsBusinessLocation] = useState(true);

  // Talent Manager Details state
  const [managerName, setManagerName] = useState(profile?.nominee_name || profile?.managerName || "");
  const [managerRelationship, setManagerRelationship] = useState(profile?.nominee_relationship || profile?.managerRelationship || "");
  const [managerPhone, setManagerPhone] = useState(profile?.nominee_mobile || profile?.managerPhone || "");

  // UI state
  const [activeInput, setActiveInput] = useState(null);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const segments = [
    "Restaurant",
    "Cafe",
    "QSR",
    "Cloud Kitchen",
    "Catering",
    "Bakery",
    "Hotel",
    "Food Production",
    "Hospitality Consultancy",
  ];
  const languages = ["English (UK)", "English (US)", "Hindi", "Arabic"];
  const relationships = ["Owner", "Manager", "HR Recruiter", "Operations Partner", "Other"];

  // Keep location #1 synced with Business Location whenever the toggle is ON
  useEffect(() => {
    if (!sameAsBusinessLocation) return;
    const split = splitLocationString(businessLocation);
    setLocations((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[0] = { ...updated[0], address: split.address, cityPostcode: split.cityPostcode };
      return updated;
    });
  }, [businessLocation, sameAsBusinessLocation]);

  const handleToggleSameLocation = (val) => {
    setSameAsBusinessLocation(val);
  };

  const next = () => {
    // STEP 1: Business Info + Logo + Operational Locations (merged)
    if (step === 1) {
      if (!businessName.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.businessNameRequired"));
        return;
      }
      if (!industrySegment) {
        Alert.alert(t("error"), t("employerOnboarding.industrySegmentRequired"));
        return;
      }
      if (!businessLocation.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.businessLocationRequired"));
        return;
      }
      // Only validate locations manually when NOT auto-filled from business location
      if (!sameAsBusinessLocation) {
        const emptyLocation = locations.some(loc => !loc.address.trim() || !loc.cityPostcode.trim());
        if (emptyLocation) {
          Alert.alert(t("error"), t("employerOnboarding.locationsRequired"));
          return;
        }
      }
    }

    if (step === 2) {
      if (!contactName.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.contactNameRequired"));
        return;
      }
      if (!contactPhone.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.contactPhoneRequired"));
        return;
      }
      if (contactPhone.trim().length !== 10) {
        Alert.alert(t("error"), t("employerOnboarding.mobileNumberInvalid"));
        return;
      }
      if (!contactEmail.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.contactEmailRequired"));
        return;
      }
    }

    // STEP 3: Talent Manager (was step 4)
    if (step === 3) {
      if (!managerName.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.managerNameRequired"));
        return;
      }
      if (!managerRelationship) {
        Alert.alert(t("error"), t("employerOnboarding.managerRelationshipRequired"));
        return;
      }
      if (!managerPhone.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.managerPhoneRequired"));
        return;
      }
      if (managerPhone.trim().length !== 10) {
        Alert.alert(t("error"), t("employerOnboarding.mobileNumberInvalid"));
        return;
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleExitAndLogout = async () => {
    try {
      const { logout: logoutApi } = require("../../services/authApi");
      await logoutApi();
    } catch (e) {
      // ignore
    }
    await clearAuthStorage();
    try {
      const { clearClientState } = require("../../services/apiClient");
      clearClientState();
    } catch (e) {
      console.warn("Failed to clear API client state:", e);
    }
    dispatch(logout());
    dispatch(resetUser());
  };

  const prev = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        CustomAlert.show(
          t("exitOnboarding", "Exit Onboarding?"),
          t("exitOnboardingMessage", "Do you want to log out and exit profile setup?"),
          [
            { text: t("cancel"), style: "cancel" },
            {
              text: t("logOut"),
              style: "destructive",
              onPress: handleExitAndLogout,
            },
          ]
        );
      }
    }
  };

  useEffect(() => {
    const backAction = () => {
      prev();
      return true; // Prevent default app closing behavior
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [step]); // Re-subscribe when step changes so prev() has the correct step value

  const addLocation = () => {
    setLocations([
      ...locations,
      { id: Date.now(), address: "", cityPostcode: "" }
    ]);
  };

  const removeLocation = (id) => {
    if (locations.length === 1) return;
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const handleLocationChange = (id, field, val) => {
    setLocations(locations.map(loc => {
      if (loc.id === id) {
        return { ...loc, [field]: val };
      }
      return loc;
    }));
  };

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to upload a photo."
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
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Sorry, we need camera permissions to take a photo."
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
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  const handleLogoUpload = () => {
    Alert.alert(
      "Upload Company Logo",
      "Choose a source for your logo image",
      [
        { text: "Camera", onPress: handleTakePhoto },
        { text: "Gallery", onPress: handleUploadPhoto },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleGPSLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied. Please enable location permissions in your settings."
        );
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const addressObj = geocode[0];
        const parts = [];
        if (addressObj.name && addressObj.name !== addressObj.street) {
          parts.push(addressObj.name);
        }
        if (addressObj.street) {
          parts.push(addressObj.street);
        }
        if (addressObj.district || addressObj.subregion) {
          parts.push(addressObj.district || addressObj.subregion);
        }
        if (addressObj.city) {
          parts.push(addressObj.city);
        }
        if (addressObj.region) {
          parts.push(addressObj.region);
        }
        if (addressObj.country) {
          parts.push(addressObj.country);
        }

        const fullAddress = parts.join(", ");
        setBusinessLocation(fullAddress);
      } else {
        const coordsString = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
        setBusinessLocation(coordsString);
      }
    } catch (error) {
      console.error("Error fetching GPS location:", error);
      Alert.alert("Error", "Failed to fetch current location. Please make sure location services are enabled on your device.");
    } finally {
      setIsLocating(false);
    }
  };

  const finishOnboarding = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        business_name: businessName,
        industry_segment: industrySegment,
        business_location: businessLocation,
        contact_person_name: contactName,
        business_mobile: contactPhone,
        business_email: contactEmail,
        preferred_language: preferredLanguage,
        operational_locations: locations.map(l => `${l.address}, ${l.cityPostcode}`),
        nominee_name: managerName,
        nominee_relationship: managerRelationship,
        nominee_mobile: managerPhone,
        company_logo: logoUri,
      };

      const formData = new FormData();
      formData.append("business_name", payload.business_name);
      formData.append("industry_segment", payload.industry_segment);
      formData.append("business_location", payload.business_location);
      formData.append("contact_person_name", payload.contact_person_name);
      formData.append("business_mobile", payload.business_mobile);
      formData.append("business_email", payload.business_email);
      formData.append("preferred_language", payload.preferred_language);
      
      if (Array.isArray(payload.operational_locations)) {
        payload.operational_locations.forEach((loc) => {
          formData.append("operational_locations[]", loc);
        });
      }
      
      formData.append("nominee_name", payload.nominee_name || "");
      formData.append("nominee_relationship", payload.nominee_relationship || "");
      formData.append("nominee_mobile", payload.nominee_mobile || "");

      if (payload.company_logo) {
        const uri = payload.company_logo;
        const uriParts = uri.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split(".").pop();
        
        formData.append("company_logo", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: fileName,
          type: `image/${fileType === "jpg" ? "jpeg" : fileType || "png"}`,
        });
      }

      // Log onboarding API call details
      console.log("[API INFO] Saving profile completion. URL: /employer/onboarding/save");
      if (formData && formData._parts) {
        formData._parts.forEach(([key, value]) => {
          console.log(`[API PAYLOAD] ${key}:`, typeof value === "object" && value !== null ? JSON.stringify(value) : value);
        });
      }

      // Call API
      const apiResponse = await saveEmployerOnboarding(formData);
      
      const profileReduxData = {
        name: managerName || contactName || "Employer User",
        businessName: businessName,
        company: businessName,
        segment: industrySegment,
        location: businessLocation,
        locations: payload.operational_locations,
        contactName,
        contactPhone,
        contactEmail,
        preferredLanguage,
        nominee_name: managerName,
        nominee_relationship: managerRelationship,
        nominee_mobile: managerPhone,
        company_logo: logoUri,
        role: "employer",
        employerOnboardingCompleted: true,
        ...(apiResponse?.data || apiResponse || {}),
      };

      // Update Redux state
      dispatch(setProfileData(profileReduxData));
      
      // Save locally
      await setStoredProfile(profileReduxData);

      if (isEditMode) {
        navigation.goBack();
      } else {
        navigation.navigate("Post Job", { isOnboarding: true });
      }
    } catch (error) {
      console.error("Failed to save employer onboarding:", error);
      Alert.alert("Error", error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };


  const progress = step === TOTAL_STEPS ? 100 : step * (100 / TOTAL_STEPS);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={prev} style={styles.backButton}>
            <Ionicons name={step === TOTAL_STEPS ? "close" : "arrow-back"} size={24} color="#0a0504" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? t("editProfile", "Edit Profile") : t("completeProfileTitle", "Complete Profile")}</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {step === TOTAL_STEPS ? "100%" : t("step", { current: step, total: TOTAL_STEPS }).replace("{{current}}", step).replace("{{total}}", TOTAL_STEPS)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{t("onboardingProgress", "Onboarding Progress")}</Text>
            <Text style={[styles.progressPct, { color: PRIMARY_GREEN }]}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: PRIMARY_GREEN }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: BUSINESS INFORMATION (Logo + Name + Segment + Primary Location + Operational Locations) */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{t("businessInformation", "Business Information")}</Text>
              <Text style={styles.stepSubtitle}>
                {t("employerCompleteProfile.step1Subtitle", "Tell us about your establishment to help us find the right talent for your team.")}
              </Text>

              {/* Company Logo Upload - top of the step */}
              <Text style={styles.sectionHeaderTitle}>{t("companyLogo", "Company Logo")}</Text>
              <TouchableOpacity
                style={styles.logoUploadBox}
                activeOpacity={0.7}
                onPress={handleLogoUpload}
              >
                <View style={styles.logoUploadInner}>
                  {logoUri ? (
                    <Image
                      source={{ uri: logoUri }}
                      style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="camera-outline" size={32} color={PRIMARY_GREEN} />
                  )}
                  <Text style={styles.logoUploadText}>{logoUploaded ? t("changeLogo", "Change Logo") : t("upload", "Upload")}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.logoSubtext}>{t("logoRecommendedFormat", "PNG, JPG up to 5MB. Recommended square format.")}</Text>

              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.businessName", "Business Name")} <Text style={styles.required}>*</Text></Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "businessName" && styles.inputWrapperActive
                ]}>
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder={t("employerCompleteProfile.enterBusinessName", "Enter business name")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("businessName")}
                    onBlur={() => setActiveInput(null)}
                  />
                  <Ionicons name="business-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconRight} />
                </View>
              </View>

              {/* Industry Segment Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("industrySegment", "Industry Segment")} <Text style={styles.required}>*</Text></Text>
                <ModalPickerTrigger
                  onPress={() => setShowSegmentDropdown(true)}
                  label={industrySegment}
                  placeholder={t("employerCompleteProfile.selectIndustrySegment", "Select an industry segment")}
                  isOpen={showSegmentDropdown}
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showSegmentDropdown}
                  onClose={() => setShowSegmentDropdown(false)}
                  title={t("industrySegment", "Industry Segment")}
                  options={segments}
                  selectedValue={industrySegment}
                  onSelect={(val) => setIndustrySegment(val)}
                />
              </View>

              {/* Primary Business Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("businessLocation", "Primary Business Location")} <Text style={styles.required}>*</Text></Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "businessLocation" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="location-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={businessLocation}
                    onChangeText={setBusinessLocation}
                    placeholder={t("employerCompleteProfile.enterBusinessLocation", "Enter business location")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("businessLocation")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                {/* Professional Use Current Location Button */}
                <TouchableOpacity
                  style={styles.useCurrentLocationBtn}
                  activeOpacity={0.8}
                  onPress={handleGPSLocation}
                  disabled={isLocating}
                >
                  <View style={styles.locateBtnContent}>
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#153e69" style={{ marginRight: 6 }} />
                    ) : (
                      <Ionicons name="locate" size={16} color="#153e69" style={{ marginRight: 6 }} />
                    )}
                    <Text style={styles.useCurrentLocationText}>
                      {isLocating ? t("fetchingLocation", "Fetching location...") : t("useCurrentLocation", "Use current location")}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Operational Locations Section */}
              <View style={styles.rowSpaceBetween}>
                <Text style={styles.sectionHeaderTitle}>{t("operationalLocations", "Operational Locations")}</Text>
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryBadgeText}>{t("mandatory", "MANDATORY")}</Text>
                </View>
              </View>

              {/* Same as Business Location Toggle */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.toggleLabel}>{t("sameAsBusinessLocation", "Same as Business Location")}</Text>
                  <Text style={styles.toggleSubtext}>{t("sameAsBusinessLocationHint", "Auto-fill Location #1, or switch off to enter manually")}</Text>
                </View>
                <Switch
                  value={sameAsBusinessLocation}
                  onValueChange={handleToggleSameLocation}
                  trackColor={{ false: "rgba(10, 5, 4, 0.15)", true: PRIMARY_GREEN }}
                  thumbColor="#ffffff"
                />
              </View>

              {locations.map((loc, idx) => {
                const isAutoFilled = idx === 0 && sameAsBusinessLocation;
                return (
                  <View key={loc.id} style={styles.locationCard}>
                    <View style={styles.locationCardHeader}>
                      <Text style={styles.locationCardTitle}>{t("location", "Location")} #{idx + 1}</Text>
                      {locations.length > 1 && (
                        <TouchableOpacity onPress={() => removeLocation(loc.id)}>
                          <Ionicons name="trash-outline" size={18} color="#f57f20" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <View style={[styles.inputWrapper, isAutoFilled && styles.inputWrapperDisabled]}>
                        <Ionicons name="location-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                        <TextInput
                          value={loc.address}
                          onChangeText={(val) => handleLocationChange(loc.id, "address", val)}
                          placeholder={t("employerCompleteProfile.enterLocationAddress", "Enter building, street or venue name")}
                          placeholderTextColor="rgba(10, 5, 4, 0.4)"
                          style={styles.textInput}
                          editable={!isAutoFilled}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { marginTop: 8 }]}>
                      <View style={[styles.inputWrapper, isAutoFilled && styles.inputWrapperDisabled]}>
                        <TextInput
                          value={loc.cityPostcode}
                          onChangeText={(val) => handleLocationChange(loc.id, "cityPostcode", val)}
                          placeholder={t("employerCompleteProfile.enterCityPostcode", "City, Postcode")}
                          placeholderTextColor="rgba(10, 5, 4, 0.4)"
                          style={[styles.textInput, { paddingLeft: 12 }]}
                          editable={!isAutoFilled}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Add Another Location Button */}
              <TouchableOpacity
                style={styles.addLocationButton}
                activeOpacity={0.8}
                onPress={addLocation}
              >
                <Ionicons name="add" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.addLocationButtonText}>{t("addAnotherLocation", "Add Another Location")}</Text>
              </TouchableOpacity>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={22} color="#153e69" style={styles.infoCardIcon} />
                <Text style={styles.infoCardText}>
                  {t("employerCompleteProfile.infoCardText2", "Having multiple locations allows you to post jobs specifically for each venue while managing them from one central account.")}
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!businessName.trim() || !industrySegment || !businessLocation.trim()) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.footerText}>{t("editDetailsLaterMsg", "You can edit these details later in your dashboard.")}</Text>
            </View>
          )}

          {/* STEP 2: BUSINESS INFORMATION (CONTACT) */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{t("businessInformation", "Business Information")}</Text>
              <Text style={styles.stepSubtitle}>
                {t("employerCompleteProfile.step2Subtitle", "Provide details so we can reach out regarding high-quality candidates and updates.")}
              </Text>

              {/* Contact Person Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.contactPerson", "Contact Person Name")}</Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "contactName" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="person-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder={t("enterFullName", "Enter full name")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("contactName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.phoneNumber", "Business Mobile Number")}</Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "contactPhone" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="call-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder={t("employerCompleteProfile.enterBusinessMobile", "Enter business mobile number")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.textInput}
                    onFocus={() => setActiveInput("contactPhone")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("postJob.emailAddress", "Business Email Address")}</Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "contactEmail" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="mail-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder={t("employerCompleteProfile.enterBusinessEmail", "Enter business email address")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("contactEmail")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Preferred Language */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("preferredLanguage", "Preferred Language")}</Text>
                <ModalPickerTrigger
                  onPress={() => setShowLangDropdown(true)}
                  label={preferredLanguage}
                  isOpen={showLangDropdown}
                  leftIcon="globe-outline"
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showLangDropdown}
                  onClose={() => setShowLangDropdown(false)}
                  title={t("preferredLanguage", "Preferred Language")}
                  options={languages}
                  selectedValue={preferredLanguage}
                  onSelect={(val) => setPreferredLanguage(val)}
                />
              </View>

              {/* Disclaimer Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                activeOpacity={0.8}
                onPress={() => setPrivacyChecked(!privacyChecked)}
              >
                <View style={[
                  styles.checkbox,
                  privacyChecked && { backgroundColor: PRIMARY_GREEN, borderColor: PRIMARY_GREEN }
                ]}>
                  {privacyChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  {t("employerCompleteProfile.privacyText", "Your information is protected and will only be used for reachout and applicant notifications.")}
                </Text>
              </TouchableOpacity>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim() || !privacyChecked) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: TALENT MANAGER DETAILS (was step 4) */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{t("talentManagerDetails", "Talent Manager Details")}</Text>
              <Text style={styles.stepSubtitle}>
                {t("employerCompleteProfile.step4Subtitle", "Please provide the contact details for your business manager or secondary contact person.")}
              </Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "managerName" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="person-outline" size={20} color="rgba(10, 5, 4, 0.6)" style={styles.inputIconLeft} />
                  <TextInput
                    value={managerName}
                    onChangeText={setManagerName}
                    placeholder={t("enterFullName", "Enter full name")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("managerName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <Text style={styles.inputSubtext}>{t("legalNameAsPerIdentity", "Legal name as per identity documents.")}</Text>
              </View>

              {/* Select Relationship Dropdown */}
              <View style={styles.inputGroup}>
                <ModalPickerTrigger
                  onPress={() => setShowRelationDropdown(true)}
                  label={managerRelationship}
                  placeholder={t("employerCompleteProfile.selectRelationship", "Select Relationship")}
                  isOpen={showRelationDropdown}
                  leftIcon="people-outline"
                  style={styles.inputWrapper}
                />
                <ModalPicker
                  visible={showRelationDropdown}
                  onClose={() => setShowRelationDropdown(false)}
                  title={t("employerCompleteProfile.relationship", "Relationship")}
                  options={relationships}
                  selectedValue={managerRelationship}
                  onSelect={(val) => setManagerRelationship(val)}
                />
              </View>

              {/* Mobile Number */}
              <View style={styles.inputGroup}>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "managerPhone" && styles.inputWrapperActive
                ]}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    value={managerPhone}
                    onChangeText={setManagerPhone}
                    placeholder={t("employerCompleteProfile.enterMobileNumber", "Enter mobile number")}
                    placeholderTextColor="rgba(10, 5, 4, 0.4)"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={[styles.textInput, { paddingLeft: 10 }]}
                    onFocus={() => setActiveInput("managerPhone")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <Text style={styles.inputSubtext}>{t("employerCompleteProfile.verificationMobileNote", "Used for emergency and business verification.")}</Text>
              </View>

              {/* Secure Verification Box */}
              <View style={styles.secureCard}>
                <Ionicons name="shield-checkmark" size={28} color={PRIMARY_GREEN} style={styles.secureCardIcon} />
                <View style={styles.secureCardContent}>
                  <Text style={styles.secureCardTitle}>{t("employerCompleteProfile.secureVerificationTitle", "Secure Verification")}</Text>
                  <Text style={styles.secureCardText}>
                    {t("employerCompleteProfile.secureVerificationText", "We prioritize data privacy. Manager details are only used for legal compliance and essential platform updates.")}
                  </Text>
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!managerName.trim() || !managerRelationship || !managerPhone.trim()) && styles.continueButtonDisabled
                ]}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>{t("continue", "Continue")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.footerNoteText}>{t("employerCompleteProfile.allFieldsMandatory", "All fields are mandatory to proceed")}</Text>
            </View>
          )}

          {/* STEP 4: ALL SET! (was step 5) */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              {/* Checkmark animation mock */}
              <View style={styles.successIconWrapper}>
                <View style={[styles.successIconCircle, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                  <View style={[styles.successIconInnerCircle, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="checkmark" size={48} color="#fff" />
                  </View>
                </View>
              </View>

              <Text style={[styles.stepTitle, { textAlign: "center" }]}>{t("allSet", "All Set!")}</Text>
              <Text style={[styles.stepSubtitle, { textAlign: "center", marginBottom: 24 }]}>
                {t("employerProfileSuccessMsg", "Your employer profile has been completed successfully. You can now start posting jobs and reviewing applicants.")}
              </Text>

              {/* Card 1: Business Card */}
              <View style={styles.summaryCard}>
                <View style={[styles.rowSpaceBetween, { marginBottom: 12 }]}>
                  <Text style={styles.summarySectionHeader}>{t("companyProfile", "Company Profile")}</Text>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.editButton}>
                    <Text style={styles.editButtonText}>{t("edit", "Edit")}</Text>
                    <Ionicons name="pencil" size={12} color={PRIMARY_GREEN} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.businessHeader}>
                  <View style={[styles.businessLogoContainer, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                    {logoUri ? (
                      <Image source={{ uri: logoUri }} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
                    ) : (
                      <Ionicons name="business" size={24} color={PRIMARY_GREEN} />
                    )}
                  </View>
                  <View style={styles.businessHeaderDetails}>
                    <Text style={styles.businessNameText}>{businessName || "Verdant Stays & Resorts"}</Text>
                    <View style={styles.badgeRow}>
                      <Ionicons name="pricetag-outline" size={12} color={PRIMARY_GREEN} />
                      <Text style={styles.badgeText}>{industrySegment || "Hospitality & Leisure"}</Text>
                    </View>
                  </View>
                </View>

                {/* HQ Location & Contact Details */}
                <View style={styles.detailList}>
                  {businessLocation ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="location-sharp" size={14} color="rgba(10, 5, 4, 0.5)" style={styles.detailIcon} />
                      <Text style={styles.detailText}>{businessLocation}</Text>
                    </View>
                  ) : null}

                  {contactEmail ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="mail" size={14} color="rgba(10, 5, 4, 0.5)" style={styles.detailIcon} />
                      <Text style={styles.detailText}>{contactEmail}</Text>
                    </View>
                  ) : null}

                  {contactPhone ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="call" size={14} color="rgba(10, 5, 4, 0.5)" style={styles.detailIcon} />
                      <Text style={styles.detailText}>{contactPhone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Card 2: Operational Locations */}
              <View style={styles.summaryCard}>
                <View style={[styles.rowSpaceBetween, { marginBottom: 12 }]}>
                  <Text style={styles.summarySectionHeader}>{t("operationalLocations", "Operational Locations")}</Text>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.editButton}>
                    <Text style={styles.editButtonText}>{t("edit", "Edit")}</Text>
                    <Ionicons name="pencil" size={12} color={PRIMARY_GREEN} />
                  </TouchableOpacity>
                </View>

                {locations.length > 0 ? (
                  <View style={styles.operationalList}>
                    {locations.map((loc, idx) => (
                      <View key={loc.id} style={styles.operationalItem}>
                        <View style={styles.operationalBadge}>
                          <Text style={styles.operationalBadgeText}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.operationalAddressText} numberOfLines={1}>{loc.address}</Text>
                          <Text style={styles.operationalCityText}>{loc.cityPostcode}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No branches added</Text>
                )}
              </View>

              {/* Card 3: Contact Representative */}
              <View style={styles.summaryCard}>
                <View style={[styles.rowSpaceBetween, { marginBottom: 12 }]}>
                  <Text style={styles.summarySectionHeader}>{t("contactRepresentative", "Contact Representative")}</Text>
                  <TouchableOpacity onPress={() => setStep(2)} style={styles.editButton}>
                    <Text style={styles.editButtonText}>{t("edit", "Edit")}</Text>
                    <Ionicons name="pencil" size={12} color={PRIMARY_GREEN} />
                  </TouchableOpacity>
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.columnLabelText}>{t("postJob.contactPerson", "Name")}</Text>
                    <Text style={styles.columnValueText}>{contactName || "Aryan Jain"}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.columnLabelText}>{t("preferredLanguage", "Preferred Language")}</Text>
                    <Text style={styles.columnValueText}>{preferredLanguage || "English (UK)"}</Text>
                  </View>
                </View>
              </View>

              {/* Card 4: Nominee Manager Details */}
              {managerName ? (
                <View style={styles.summaryCard}>
                  <View style={[styles.rowSpaceBetween, { marginBottom: 12 }]}>
                    <Text style={styles.summarySectionHeader}>{t("managerDetails", "Manager Details")}</Text>
                    <TouchableOpacity onPress={() => setStep(3)} style={styles.editButton}>
                      <Text style={styles.editButtonText}>{t("edit", "Edit")}</Text>
                      <Ionicons name="pencil" size={12} color={PRIMARY_GREEN} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.twoColumnRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.columnLabelText}>Manager Name</Text>
                      <Text style={styles.columnValueText}>{managerName}</Text>
                      <Text style={styles.columnSubtitleText}>{managerRelationship || "Supervisor"}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.columnLabelText}>Mobile Number</Text>
                      <Text style={styles.columnValueText}>{managerPhone || "N/A"}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Start Posting Jobs Button */}
              <TouchableOpacity
                style={[styles.continueButton, { marginTop: 24 }, isSaving && { opacity: 0.6 }]}
                onPress={finishOnboarding}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  {isSaving 
                    ? t("saving", "Saving...") 
                    : (isEditMode ? t("saveProfile", "Save Profile") : t("postJob.postNew", "Start Posting Jobs"))}
                </Text>
                {!isSaving && <Ionicons name="arrow-forward" size={18} color="#fff" />}
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
    backgroundColor: "#f2f2f3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0504",
  },
  stepBadge: {
    backgroundColor: "#f2f2f3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
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
    color: "rgba(10, 5, 4, 0.6)",
  },
  progressPct: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(10, 5, 4, 0.15)",
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
  stepTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0a0504",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a0504",
    marginBottom: 8,
  },
  required: {
    color: "#f57f20",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    position: "relative",
  },
  inputWrapperActive: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 1.5,
  },
  inputWrapperDisabled: {
    backgroundColor: "#f2f2f3",
    opacity: 0.7,
  },
  textInput: {
    flex: 1,
    color: "#0a0504",
    fontSize: 15,
    paddingVertical: 8,
  },
  inputIconRight: {
    marginLeft: 8,
  },
  inputIconLeft: {
    marginRight: 10,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0504",
    marginRight: 4,
    borderRightWidth: 1,
    borderRightColor: "rgba(10, 5, 4, 0.15)",
    paddingRight: 10,
  },
  inputSubtext: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 6,
    paddingLeft: 4,
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
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f3",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "rgba(10, 5, 4, 0.6)",
  },
  useCurrentLocationBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(21, 62, 105, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locateBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  useCurrentLocationText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153e69",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(21, 62, 105, 0.18)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  infoCardIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoCardText: {
    flex: 1,
    fontSize: 12,
    color: "#153e69",
    lineHeight: 18,
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: "rgba(10, 5, 4, 0.15)",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    marginTop: 14,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(10, 5, 4, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    lineHeight: 18,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 10,
    marginTop: 8,
  },
  logoUploadBox: {
    height: 90,
    width: 90,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#f2f2f3",
  },
  logoUploadInner: {
    alignItems: "center",
  },
  logoUploadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 4,
  },
  logoSubtext: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 24,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mandatoryBadge: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "#BDECCB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a0504",
  },
  toggleSubtext: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.5)",
    marginTop: 2,
  },
  locationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    marginBottom: 14,
  },
  locationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
  },
  addLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 24,
    borderStyle: "dashed",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  addLocationButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY_GREEN,
    marginLeft: 6,
  },
  secureCard: {
    flexDirection: "row",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
    borderWidth: 1,
    borderColor: "#BDECCB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    alignItems: "center",
  },
  secureCardIcon: {
    marginRight: 12,
  },
  secureCardContent: {
    flex: 1,
  },
  secureCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#153e69",
    marginBottom: 2,
  },
  secureCardText: {
    fontSize: 12,
    color: "#166534",
    lineHeight: 18,
  },
  footerNoteText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.4)",
    textAlign: "center",
    marginTop: 12,
  },
  successIconWrapper: {
    alignItems: "center",
    marginVertical: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  businessHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  businessLogoContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  businessHeaderDetails: {
    flex: 1,
  },
  businessNameText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0504",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY_GREEN,
  },
  summarySectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(10, 5, 4, 0.6)",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  locationPill: {
    backgroundColor: "#f2f2f3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(10, 5, 4, 0.6)",
  },
  twoColumnRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  columnNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a0504",
    marginBottom: 2,
  },
  columnSubtitleText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
  },
  businessTypeDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  businessTypeIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  businessTypeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a0504",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  summarySectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0504",
  },
  detailList: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 5, 4, 0.08)",
    paddingTop: 8,
    gap: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.7)",
    fontWeight: "500",
  },
  operationalList: {
    gap: 8,
  },
  operationalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f2f2f3",
    padding: 6,
    borderRadius: 10,
  },
  operationalBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  operationalBadgeText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "800",
  },
  operationalAddressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a0504",
  },
  operationalCityText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.5)",
  },
  columnLabelText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.5)",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },
  columnValueText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0a0504",
  },
  emptyText: {
    fontSize: 13,
    color: "rgba(10, 5, 4, 0.4)",
    fontStyle: "italic",
  },
  stepContainerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  successHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitleText: {
    fontSize: 20,
    fontWeight: "900",
    color: PRIMARY_GREEN,
  },
  successSubtitleText: {
    fontSize: 12,
    color: "rgba(10, 5, 4, 0.6)",
    textAlign: "center",
    marginBottom: 16,
  },
  dashboardGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  gridCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.12)",
    padding: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 5, 4, 0.06)",
    paddingBottom: 4,
    marginBottom: 6,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0a0504",
  },
  miniEditBtn: {
    padding: 2,
  },
  miniBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  miniLogoWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(21, 62, 105, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniBrandName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0a0504",
  },
  miniBrandSegment: {
    fontSize: 10,
    color: PRIMARY_GREEN,
    fontWeight: "600",
  },
  miniText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.6)",
    marginTop: 2,
  },
  miniLocList: {
    gap: 2,
  },
  miniLocItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniLocText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.7)",
    fontWeight: "500",
  },
  miniLocMore: {
    fontSize: 10,
    color: PRIMARY_GREEN,
    fontWeight: "700",
    marginTop: 2,
  },
  emptyMiniText: {
    fontSize: 11,
    color: "rgba(10, 5, 4, 0.4)",
    fontStyle: "italic",
  },
  miniLabel: {
    fontSize: 9,
    color: "rgba(10, 5, 4, 0.5)",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  miniValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0a0504",
  },
});