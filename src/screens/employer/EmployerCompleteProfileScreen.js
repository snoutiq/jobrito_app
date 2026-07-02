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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setProfileData, resetUser } from "../../redux/slices/userSlice";
import { logout } from "../../redux/slices/authSlice";
import { setEmployerOnboardingCompleted, setStoredProfile, clearAuthStorage } from "../../services/storage";
import { CustomAlert } from "../../components/common/CustomAlert";
import colors from "../../constants/colors";
import * as ImagePicker from "expo-image-picker";
import { saveEmployerOnboarding } from "../../services/employerApi";
import * as Location from "expo-location";

const PRIMARY_GREEN = "#22C55E";

export default function EmployerCompleteProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [industrySegment, setIndustrySegment] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English (UK)");
  const [privacyChecked, setPrivacyChecked] = useState(true);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [logoUri, setLogoUri] = useState(null);

  // Operational Locations state
  const [locations, setLocations] = useState([
    { id: 1, address: "", cityPostcode: "" }
  ]);

  // Talent Manager Details state
  const [managerName, setManagerName] = useState("");
  const [managerRelationship, setManagerRelationship] = useState("");
  const [managerPhone, setManagerPhone] = useState("");

  // UI state
  const [activeInput, setActiveInput] = useState(null);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const segments = ["Hospitality & Leisure", "Food & Beverage", "Cafe & QSR", "Retail", "Other"];
  const languages = ["English (UK)", "English (US)", "Hindi", "Arabic"];
  const relationships = ["Owner", "Manager", "HR Recruiter", "Operations Partner", "Other"];

  const next = () => {
    if (step === 1 && !businessName.trim()) {
      Alert.alert(t("error"), t("employerOnboarding.businessNameRequired"));
      return;
    }
    if (step === 1 && !industrySegment) {
      Alert.alert(t("error"), t("employerOnboarding.industrySegmentRequired"));
      return;
    }
    if (step === 1 && !businessLocation.trim()) {
      Alert.alert(t("error"), t("employerOnboarding.businessLocationRequired"));
      return;
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
      if (!contactEmail.trim()) {
        Alert.alert(t("error"), t("employerOnboarding.contactEmailRequired"));
        return;
      }
    }

    if (step === 3) {
      const emptyLocation = locations.some(loc => !loc.address.trim() || !loc.cityPostcode.trim());
      if (emptyLocation) {
        Alert.alert(t("error"), t("employerOnboarding.locationsRequired"));
        return;
      }
    }

    if (step === 4) {
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
    }

    if (step < 5) {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        Alert.alert("GPS Location", `Successfully fetched location:\n${fullAddress}`);
      } else {
        const coordsString = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
        setBusinessLocation(coordsString);
        Alert.alert("GPS Location", `Successfully fetched coordinates: ${coordsString}`);
      }
    } catch (error) {
      console.error("Error fetching GPS location:", error);
      Alert.alert("Error", "Failed to fetch current location. Please make sure location services are enabled on your device.");
    } finally {
      setIsLocating(false);
    }
  };

  const finishOnboarding = async () => {
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
      await setEmployerOnboardingCompleted();

      Alert.alert(
        t("success"),
        "Profile onboarding completed successfully!",
        [
          {
            text: "OK",
            onPress: () => {}
          }
        ]
      );
    } catch (error) {
      console.error("Failed to save employer onboarding:", error);
      Alert.alert("Error", error.message || "Failed to save profile. Please try again.");
    }
  };


  const progress = step === 5 ? 100 : step * 20;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={prev} style={styles.backButton}>
            <Ionicons name={step === 5 ? "close" : "arrow-back"} size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Profile</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {step === 5 ? "100%" : `Step ${step} of 5`}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Onboarding Progress</Text>
            <Text style={[styles.progressPct, { color: PRIMARY_GREEN }]}>{progress}%</Text>
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
          {/* STEP 1: BUSINESS INFORMATION */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Business Information</Text>
              <Text style={styles.stepSubtitle}>
                Tell us about your establishment to help us find the right talent for your team.
              </Text>

              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name <Text style={styles.required}>*</Text></Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "businessName" && styles.inputWrapperActive
                ]}>
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="e.g. The Green Kitchen"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("businessName")}
                    onBlur={() => setActiveInput(null)}
                  />
                  <Ionicons name="business-outline" size={20} color="#64748B" style={styles.inputIconRight} />
                </View>
              </View>

              {/* Industry Segment Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Industry Segment <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowSegmentDropdown(!showSegmentDropdown)}
                  style={[
                    styles.inputWrapper,
                    showSegmentDropdown && styles.inputWrapperActive
                  ]}
                >
                  <Text style={[styles.textInput, !industrySegment && { color: "#94A3B8" }]}>
                    {industrySegment || "Select a segment"}
                  </Text>
                  <Ionicons name={showSegmentDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" style={styles.inputIconRight} />
                </TouchableOpacity>

                {showSegmentDropdown && (
                  <View style={styles.dropdownContainer}>
                    {segments.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setIndustrySegment(item);
                          setShowSegmentDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, industrySegment === item && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Business Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Location <Text style={styles.required}>*</Text></Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "businessLocation" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={businessLocation}
                    onChangeText={setBusinessLocation}
                    placeholder="Search city or street"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("businessLocation")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Map Preview Mockup */}
              <View style={styles.mapContainer}>
                <View style={styles.mapGridBg}>
                  {/* Styled mock map lines */}
                  <View style={[styles.mapLine, { transform: [{ rotate: "30deg" }], top: 30 }]} />
                  <View style={[styles.mapLine, { transform: [{ rotate: "-45deg" }], top: 70 }]} />
                  <View style={[styles.mapLine, { transform: [{ rotate: "15deg" }], top: 110 }]} />
                  <View style={[styles.mapRoad, { top: 60, height: 18 }]} />
                  <View style={[styles.mapRoad, { left: 120, width: 22, height: "100%" }]} />
                  {/* Pin */}
                  <View style={styles.mapPin}>
                    <Ionicons name="location" size={38} color={PRIMARY_GREEN} />
                  </View>
                </View>

                {/* Floating GPS Button */}
                <TouchableOpacity
                  style={styles.gpsButton}
                  activeOpacity={0.8}
                  onPress={handleGPSLocation}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={PRIMARY_GREEN} />
                  ) : (
                    <Ionicons name="locate" size={18} color={PRIMARY_GREEN} />
                  )}
                  <Text style={styles.gpsButtonText}>
                    {isLocating ? "Fetching location..." : "Use current location"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={22} color="#0284C7" style={styles.infoCardIcon} />
                <Text style={styles.infoCardText}>
                  This information will be visible to potential candidates to help them understand your brand and location proximity.
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
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.footerText}>You can edit these details later in your dashboard.</Text>
            </View>
          )}

          {/* STEP 2: BUSINESS INFORMATION (CONTACT) */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Business Information</Text>
              <Text style={styles.stepSubtitle}>
                Provide details so we can reach out regarding high-quality candidates and updates.
              </Text>

              {/* Contact Person Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Person Name</Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "contactName" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder="Enter full name"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("contactName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Mobile Number</Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "contactPhone" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder="+971 00 000 0000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("contactPhone")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Email Address</Text>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "contactEmail" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder="example@business.com"
                    placeholderTextColor="#94A3B8"
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
                <Text style={styles.inputLabel}>Preferred Language</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowLangDropdown(!showLangDropdown)}
                  style={[
                    styles.inputWrapper,
                    showLangDropdown && styles.inputWrapperActive
                  ]}
                >
                  <Ionicons name="globe-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <Text style={styles.textInput}>
                    {preferredLanguage}
                  </Text>
                  <Ionicons name={showLangDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" style={styles.inputIconRight} />
                </TouchableOpacity>

                {showLangDropdown && (
                  <View style={styles.dropdownContainer}>
                    {languages.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setPreferredLanguage(item);
                          setShowLangDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, preferredLanguage === item && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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
                  Your information is protected and will only be used for reachout and applicant notifications.
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
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: BUSINESS PROFILE */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Business Profile</Text>
              <Text style={styles.stepSubtitle}>
                Upload your logo and add the physical locations where your hospitality team will be working.
              </Text>

              {/* Company Logo Upload */}
              <Text style={styles.sectionHeaderTitle}>Company Logo</Text>
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
                  <Text style={styles.logoUploadText}>{logoUploaded ? "Change Logo" : "Upload"}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.logoSubtext}>PNG, JPG up to 5MB. Recommended square format.</Text>

              {/* Operational Locations Section */}
              <View style={styles.rowSpaceBetween}>
                <Text style={styles.sectionHeaderTitle}>Operational Locations</Text>
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryBadgeText}>MANDATORY</Text>
                </View>
              </View>

              {locations.map((loc, idx) => (
                <View key={loc.id} style={styles.locationCard}>
                  <View style={styles.locationCardHeader}>
                    <Text style={styles.locationCardTitle}>Location #{idx + 1}</Text>
                    {locations.length > 1 && (
                      <TouchableOpacity onPress={() => removeLocation(loc.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                      <TextInput
                        value={loc.address}
                        onChangeText={(val) => handleLocationChange(loc.id, "address", val)}
                        placeholder="Enter building, street or venue name"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 8 }]}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={loc.cityPostcode}
                        onChangeText={(val) => handleLocationChange(loc.id, "cityPostcode", val)}
                        placeholder="City, Postcode"
                        placeholderTextColor="#94A3B8"
                        style={[styles.textInput, { paddingLeft: 12 }]}
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* Add Another Location Button */}
              <TouchableOpacity
                style={styles.addLocationButton}
                activeOpacity={0.8}
                onPress={addLocation}
              >
                <Ionicons name="add" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.addLocationButtonText}>Add Another Location</Text>
              </TouchableOpacity>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={22} color="#0284C7" style={styles.infoCardIcon} />
                <Text style={styles.infoCardText}>
                  Having multiple locations allows you to post jobs specifically for each venue while managing them from one central account.
                </Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={next}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: TALENT MANAGER DETAILS */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Talent Manager Details</Text>
              <Text style={styles.stepSubtitle}>
                Please provide the contact details for your business nominee or secondary contact person.
              </Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <View style={[
                  styles.inputWrapper,
                  activeInput === "managerName" && styles.inputWrapperActive
                ]}>
                  <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={managerName}
                    onChangeText={setManagerName}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveInput("managerName")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <Text style={styles.inputSubtext}>Legal name as per identity documents.</Text>
              </View>

              {/* Select Relationship Dropdown */}
              <View style={styles.inputGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowRelationDropdown(!showRelationDropdown)}
                  style={[
                    styles.inputWrapper,
                    showRelationDropdown && styles.inputWrapperActive
                  ]}
                >
                  <Ionicons name="people-outline" size={20} color="#64748B" style={styles.inputIconLeft} />
                  <Text style={[styles.textInput, !managerRelationship && { color: "#94A3B8" }]}>
                    {managerRelationship || "Select Relationship"}
                  </Text>
                  <Ionicons name={showRelationDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" style={styles.inputIconRight} />
                </TouchableOpacity>

                {showRelationDropdown && (
                  <View style={styles.dropdownContainer}>
                    {relationships.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setManagerRelationship(item);
                          setShowRelationDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, managerRelationship === item && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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
                    placeholder="Mobile Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    style={[styles.textInput, { paddingLeft: 10 }]}
                    onFocus={() => setActiveInput("managerPhone")}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>
                <Text style={styles.inputSubtext}>Used for emergency and business verification.</Text>
              </View>

              {/* Secure Verification Box */}
              <View style={styles.secureCard}>
                <Ionicons name="shield-checkmark" size={28} color={PRIMARY_GREEN} style={styles.secureCardIcon} />
                <View style={styles.secureCardContent}>
                  <Text style={styles.secureCardTitle}>Secure Verification</Text>
                  <Text style={styles.secureCardText}>
                    We prioritize data privacy. Nominee details are only used for legal compliance and essential platform updates.
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
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.footerNoteText}>All fields are mandatory to proceed</Text>
            </View>
          )}

          {/* STEP 5: ALL SET! */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              {/* Checkmark animation mock */}
              <View style={styles.successIconWrapper}>
                <View style={[styles.successIconCircle, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                  <View style={[styles.successIconInnerCircle, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="checkmark" size={48} color="#fff" />
                  </View>
                </View>
              </View>

              <Text style={[styles.stepTitle, { textAlign: "center" }]}>All Set!</Text>
              <Text style={[styles.stepSubtitle, { textAlign: "center", marginBottom: 24 }]}>
                Your employer profile has been completed successfully. You can now start posting jobs and reviewing applicants.
              </Text>

              {/* Card 1: Business Card */}
              <View style={styles.summaryCard}>
                <View style={styles.businessHeader}>
                  <View style={[styles.businessLogoContainer, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                    <Ionicons name="business" size={24} color={PRIMARY_GREEN} />
                  </View>
                  <View style={styles.businessHeaderDetails}>
                    <Text style={styles.businessNameText}>{businessName || "Verdant Stays & Resorts"}</Text>
                    <View style={styles.badgeRow}>
                      <Ionicons name="checkmark-circle" size={14} color={PRIMARY_GREEN} />
                      <Text style={styles.badgeText}>{industrySegment || "Hospitality & Leisure"}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: Operational Locations */}
              <View style={styles.summaryCard}>
                <Text style={styles.summarySectionTitle}>
                  <Ionicons name="location-outline" size={16} color="#64748B" /> Operational Locations
                </Text>
                <View style={styles.locationPillsRow}>
                  {locations.slice(0, 3).map((loc, index) => (
                    <View key={loc.id} style={styles.locationPill}>
                      <Text style={styles.locationPillText}>
                        {loc.cityPostcode || (index === 0 ? "Maharashtra" : index === 1 ? "Karnataka" : "Delhi")}
                      </Text>
                    </View>
                  ))}
                  {locations.length > 3 && (
                    <View style={[styles.locationPill, { backgroundColor: "#F1F5F9" }]}>
                      <Text style={[styles.locationPillText, { color: "#64748B" }]}>
                        +{locations.length - 3} others
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Card 3: Contact & Language Columns */}
              <View style={styles.twoColumnRow}>
                {/* Contact Column */}
                <View style={[styles.summaryCard, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.summarySectionTitle}>
                    <Ionicons name="person-outline" size={16} color="#64748B" /> Contact
                  </Text>
                  <Text style={styles.columnNameText}>{contactName || "Aryan Jain"}</Text>
                  <Text style={styles.columnSubtitleText}>Operations Manager</Text>
                </View>

                {/* Language Column */}
                <View style={[styles.summaryCard, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.summarySectionTitle}>
                    <Ionicons name="globe-outline" size={16} color="#64748B" /> Language
                  </Text>
                  <Text style={styles.columnNameText}>{preferredLanguage || "English (UK)"}</Text>
                  <Text style={styles.columnSubtitleText}>Primary Interface</Text>
                </View>
              </View>

              {/* Card 4: Business Type Row */}
              <View style={[styles.summaryCard, styles.rowSpaceBetween]}>
                <View style={styles.businessTypeDetails}>
                  <View style={[styles.businessTypeIconWrapper, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                    <Ionicons name="business-outline" size={20} color={PRIMARY_GREEN} />
                  </View>
                  <View>
                    <Text style={styles.columnSubtitleText}>Business Type</Text>
                    <Text style={styles.businessTypeText}>{industrySegment || "Luxury Hotel Chain"}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                  <Ionicons name="pencil" size={14} color={PRIMARY_GREEN} />
                </TouchableOpacity>
              </View>

              {/* Start Posting Jobs Button */}
              <TouchableOpacity
                style={[styles.continueButton, { marginTop: 24 }]}
                onPress={finishOnboarding}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Start Posting Jobs</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  stepBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#64748B",
  },
  progressPct: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E2E8F0",
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
    color: "#0F172A",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    position: "relative",
  },
  inputWrapperActive: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    color: "#0F172A",
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
    color: "#0F172A",
    marginRight: 4,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    paddingRight: 10,
  },
  inputSubtext: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 6,
    paddingLeft: 4,
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
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#334155",
  },
  mapContainer: {
    height: 170,
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  mapGridBg: {
    flex: 1,
    backgroundColor: "#E2E8F0",
  },
  mapLine: {
    position: "absolute",
    width: "120%",
    height: 1,
    backgroundColor: "#94A3B8",
    left: "-10%",
  },
  mapRoad: {
    position: "absolute",
    backgroundColor: "#F1F5F9",
    width: "120%",
    left: "-10%",
  },
  mapPin: {
    position: "absolute",
    top: "35%",
    left: "48%",
  },
  gpsButton: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginLeft: 6,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
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
    color: "#0369A1",
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
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
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
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
    marginTop: 8,
  },
  logoUploadBox: {
    height: 90,
    width: 90,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
  },
  logoUploadInner: {
    alignItems: "center",
  },
  logoUploadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
  logoSubtext: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 24,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mandatoryBadge: {
    backgroundColor: "#F2FBF5",
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
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    color: "#475569",
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
    backgroundColor: "#F2FBF5",
  },
  addLocationButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY_GREEN,
    marginLeft: 6,
  },
  secureCard: {
    flexDirection: "row",
    backgroundColor: "#F2FBF5",
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
    color: "#15803D",
    marginBottom: 2,
  },
  secureCardText: {
    fontSize: 12,
    color: "#166534",
    lineHeight: 18,
  },
  footerNoteText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 12,
  },
  successIconWrapper: {
    alignItems: "center",
    marginVertical: 20,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconInnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
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
    color: "#0F172A",
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
    color: "#64748B",
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
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  twoColumnRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  columnNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  columnSubtitleText: {
    fontSize: 11,
    color: "#64748B",
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
    color: "#0F172A",
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
});
