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
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { fetchProfile, updateProfile } from "../../redux/slices/userSlice";

const PRIMARY = "#153e69"; // Deep navy
const SECONDARY = "#f2f2f3"; // Snow white
const WARM_GOLD = "#f2c879"; // Warm gold
const EMBER_ORANGE = "#f57f20"; // Ember orange
const NEUTRAL = "#0a0504"; // Charcoal black

export default function CompleteProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { profile, loading } = useSelector((state) => state.user);
  
  const [step, setStep] = useState(1);

  // Profile Form States
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("male");
  const [experienceRange, setExperienceRange] = useState("0-2 Years");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [jobType, setJobType] = useState("Full Time");
  const [locationPreference, setLocationPreference] = useState("India");
  const [city, setCity] = useState("");
  const [preferredRole, setPreferredRole] = useState("Kitchen Production");
  const [skills, setSkills] = useState("");

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
      if (profile.profile_photo_path) setPhoto(profile.profile_photo_path);
      const profileName = profile.full_name || profile.name || "";
      const isPhoneLike = /^\+?\d[\d\s-]{6,}$/.test(profileName);
      if (profileName && !isPhoneLike) setFullName(profileName);
      if (profile.email) setEmail(profile.email);
      if (profile.city) setCity(profile.city);
      if (profile.experience_range) setExperienceRange(profile.experience_range);
      if (profile.preferred_role) setPreferredRole(profile.preferred_role);
      if (profile.current_employer) setCurrentEmployer(profile.current_employer);
      if (profile.skills) setSkills(profile.skills);
      if (profile.gender) setGender(profile.gender);
      if (profile.job_type) setJobType(profile.job_type);
      if (profile.location_preference) setLocationPreference(profile.location_preference);
    }
  }, [profile]);

  // Handle back/leave confirmation alert
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // If we are at step 6 (Success screen) or we already confirmed leaving, don't show the alert
      if (step === 6) {
        return;
      }

      // Prevent default behavior of leaving the screen immediately
      e.preventDefault();

      // Show alert confirmation
      Alert.alert(
        t("discardTitle", "Discard changes?"),
        t("discardMessage", "Are you sure you want to discard your changes and leave this page?"),
        [
          { text: t("cancel"), style: "cancel", onPress: () => {} },
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
    navigation.goBack();
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
    const payload = {
      full_name: fullName,
      email: email,
      city: city,
      experience_range: experienceRange,
      preferred_role: preferredRole,
      skills: skills,
      profile_photo_path: photo,
      current_employer: currentEmployer,
      gender: gender,
      job_type: jobType,
      location_preference: locationPreference,
    };
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
      index: 1,
      routes: [
        { name: "Home" },
        { name: "Profile" }
      ],
    });
  };

  // Determine progress text matching the design screenshot
  let progressPercentage = 0;
  let progressText = "";
  if (step === 1) {
    progressPercentage = 0;
    progressText = "0% Complete (0 of 5 Answered)";
  } else if (step === 2) {
    progressPercentage = 20;
    progressText = "20% Complete (1 of 5 Answered)";
  } else if (step === 3) {
    progressPercentage = 40;
    progressText = "40% Complete (2 of 5 Answered)";
  } else if (step === 4) {
    progressPercentage = 60;
    progressText = "60% Complete (3 of 5 Answered)";
  } else if (step === 5) {
    if (preferredRole) {
      progressPercentage = 100;
      progressText = "100% Complete (5 of 5 Answered)";
    } else {
      progressPercentage = 80;
      progressText = "80% Complete (4 of 5 Answered)";
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {step !== 6 && (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={prev}>
              <Ionicons name="arrow-back" size={24} color="#153e69" />
            </TouchableOpacity>

            <Text style={styles.title}>Question {step} of 5</Text>

            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.stepText}>Profile Completion</Text>
            <Text style={styles.complete}>{progressText}</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
        </>
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
        {step === 6 && <SuccessStep t={t} onReturnPress={handleReturnToProfile} />}
      </ScrollView>
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
      Alert.alert("Error", "Failed to select photo.");
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
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>{t("completeProfile.photo.heading")}</Text>
      <Text style={styles.subHeading}>
        {t("completeProfile.photo.subHeading")}
      </Text>

      <View style={styles.avatarBox}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="camera-outline" size={60} color="#999" />
        )}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 {t("proTip")}</Text>
        <Text>
          {t("completeProfile.photo.tip")}
        </Text>
      </View>

      <View style={styles.photoButtonsRow}>
        <TouchableOpacity style={[styles.button, styles.rowButton, styles.uploadButton]} onPress={handleUploadPhoto}>
          <Text style={[styles.buttonText, styles.uploadButtonText]}>{t("uploadPhoto")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.rowButton, styles.takePhotoButton]} onPress={handleTakePhoto}>
          <Text style={[styles.buttonText, styles.takePhotoButtonText]}>{t("takePhoto")}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[
          styles.actionHighlightBtn, 
          photo ? styles.actionContinueBtn : styles.actionLaterBtn
        ]} 
        onPress={next}
      >
        <Text style={[
          styles.actionHighlightText, 
          photo ? styles.actionContinueText : styles.actionLaterText
        ]}>
          {photo ? t("continue", "Continue") : t("maybeLater", "Maybe Later")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function PersonalStep({ next, t, fullName, setFullName, gender, setGender }) {
  return (
    <View style={styles.content}>
      <Text style={styles.label}>{t("fullName")}</Text>
      <TextInput
        placeholder={t("enterFullName", "Enter full name")}
        placeholderTextColor="rgba(10, 5, 4, 0.4)"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 24 }]}>
        {t("selectGender")}
      </Text>

      <View style={styles.genderRow}>
        <GenderCard
          icon="male"
          title={t("male")}
          selected={gender === "male"}
          onPress={() => setGender("male")}
        />
        <GenderCard
          icon="female"
          title={t("female")}
          selected={gender === "female"}
          onPress={() => setGender("female")}
        />
        <GenderCard
          icon="person"
          title={t("other")}
          selected={gender === "other"}
          onPress={() => setGender("other")}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, !fullName && styles.buttonDisabled]}
        onPress={() => {
          if (!fullName) {
            Alert.alert("Required Fields", "Please enter your full name.");
            return;
          }
          next();
        }}
      >
        <Text style={styles.buttonText}>{t("saveAndContinue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function GenderCard({ icon, title, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.genderCard, selected && styles.genderCardSelected]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={28} color={selected ? "#ffffff" : PRIMARY} />
      <Text style={[styles.genderText, selected && styles.genderTextSelected]}>{title}</Text>
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
  const ranges = ["1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"];
  const jobTypes = [
    "Full Time",
    "Part Time",
    "Freelance Chef",
  ];
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.content}>
      <Text style={styles.question}>
        {t("completeProfile.experience.question1")}
      </Text>

      <TouchableOpacity
        style={styles.pickerTrigger}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text style={styles.pickerTriggerText}>{experienceRange || t("selectYearsOfExperience")}</Text>
        <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={20} color="rgba(10, 5, 4, 0.6)" />
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.dropdown}>
          {ranges.map((r) => (
            <TouchableOpacity
              key={r}
              style={styles.dropdownItem}
              onPress={() => {
                setExperienceRange(r);
                setShowPicker(false);
              }}
            >
              <Text style={[styles.dropdownText, experienceRange === r && styles.boldText]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.question}>
        {t("completeProfile.experience.question2")}
      </Text>

      <TextInput
        placeholder={t("typeCurrentEmployer", "Enter current employer")}
        placeholderTextColor="rgba(10, 5, 4, 0.4)"
        value={currentEmployer}
        onChangeText={setCurrentEmployer}
        style={styles.input}
      />

      <Text style={styles.question}>
        {t("completeProfile.experience.question3")}
      </Text>

      <View style={{ gap: 8 }}>
        {jobTypes.map((type) => {
          const isSelected = jobType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => setJobType(type)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{type}</Text>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={isSelected ? PRIMARY : "#999"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.button} onPress={next}>
        <Text style={styles.buttonText}>{t("saveAndContinue")}</Text>
      </TouchableOpacity>
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

function LocationStep({ next, t, locationPreference, setLocationPreference, city, setCity }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("state"); // "state" or "region"
  const [searchText, setSearchText] = useState("");

  const handleSelectPref = (pref) => {
    setLocationPreference(pref);
    if (pref === "Both") {
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

  const handleSelectItem = (item) => {
    setCity(item);
    setModalVisible(false);
  };

  const listItems = modalType === "state" ? statesOfIndia : overseasRegions;
  const filteredItems = listItems.filter(item =>
    item.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>
        {t("completeProfile.location.heading")}
      </Text>
      <Text style={styles.subHeadingText}>
        Tell us your preference to match you with the right hospitality opportunities.
      </Text>

      <View style={styles.locationContainer}>
        {/* Option 1: India */}
        <Pressable
          style={[styles.locationCard, locationPreference === "India" && styles.locationCardSelected]}
          onPress={() => handleSelectPref("India")}
        >
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <View style={styles.locationIconBox}>
                <Ionicons name="location-sharp" size={22} color="rgba(10, 5, 4, 0.6)" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>India</Text>
                <Text style={styles.locationDesc}>Domestic hospitality roles</Text>
              </View>
            </View>
            <View style={[styles.radioWrapper, locationPreference === "India" && styles.radioWrapperActive]}>
              <View style={[styles.radioDot, locationPreference === "India" && styles.radioDotActive]} />
            </View>
          </View>

          {locationPreference === "India" && (
            <Pressable
              style={styles.locationDropdownTrigger}
              onPress={() => openSearchModal("state")}
            >
              <Text style={styles.locationDropdownText}>
                {city && locationPreference === "India" ? city : "Select State"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="rgba(10, 5, 4, 0.6)" />
            </Pressable>
          )}
        </Pressable>

        <View style={styles.locationDivider} />

        {/* Option 2: Overseas */}
        <Pressable
          style={[styles.locationCard, locationPreference === "Overseas" && styles.locationCardSelected]}
          onPress={() => handleSelectPref("Overseas")}
        >
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <View style={styles.locationIconBox}>
                <Ionicons name="earth-sharp" size={22} color="rgba(10, 5, 4, 0.6)" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Overseas</Text>
                <Text style={styles.locationDesc}>International hospitality roles</Text>
              </View>
            </View>
            <View style={[styles.radioWrapper, locationPreference === "Overseas" && styles.radioWrapperActive]}>
              <View style={[styles.radioDot, locationPreference === "Overseas" && styles.radioDotActive]} />
            </View>
          </View>

          {locationPreference === "Overseas" && (
            <Pressable
              style={styles.locationDropdownTrigger}
              onPress={() => openSearchModal("region")}
            >
              <Text style={styles.locationDropdownText}>
                {city && locationPreference === "Overseas" ? city : "Select Region"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="rgba(10, 5, 4, 0.6)" />
            </Pressable>
          )}
        </Pressable>

        <View style={styles.locationDivider} />

        {/* Option 3: Both */}
        <Pressable
          style={[styles.locationCard, locationPreference === "Both" && styles.locationCardSelected]}
          onPress={() => handleSelectPref("Both")}
        >
          <View style={styles.locationRow}>
            <View style={styles.locationLeft}>
              <View style={styles.locationIconBox}>
                <Ionicons name="compass-sharp" size={22} color="rgba(10, 5, 4, 0.6)" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Both</Text>
                <Text style={styles.locationDesc}>Explore global & domestic roles</Text>
              </View>
            </View>
            <View style={[styles.radioWrapper, locationPreference === "Both" && styles.radioWrapperActive]}>
              <View style={[styles.radioDot, locationPreference === "Both" && styles.radioDotActive]} />
            </View>
          </View>
        </Pressable>
      </View>

      <TouchableOpacity
        style={[styles.button, !city && styles.buttonDisabled]}
        onPress={() => {
          if (!city) {
            Alert.alert("Required Field", "Please select your work location preference.");
            return;
          }
          next();
        }}
      >
        <Text style={styles.buttonText}>{t("continue")}</Text>
      </TouchableOpacity>

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
                {modalType === "state" ? "Select State" : "Select Region"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="rgba(10, 5, 4, 0.4)" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="rgba(10, 5, 4, 0.4)" style={styles.searchIcon} />
              <TextInput
                placeholder="Search location..."
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInputField}
              />
            </View>

            {/* Items List */}
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {filteredItems.map((item, idx) => (
                <TouchableOpacity
                  key={`${item}-${idx}`}
                  style={[styles.modalItem, city === item && styles.modalItemActive]}
                  onPress={() => handleSelectItem(item)}
                >
                  <Text style={[styles.modalItemText, city === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {city === item && <Ionicons name="checkmark" size={18} color="#153e69" />}
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

const categories = [
  {
    id: "Kitchen Production",
    title: "Kitchen Production Job Titles - Community Members",
    icon: "restaurant-outline"
  },
  {
    id: "Restaurant Operations",
    title: "Restaurant Operations",
    icon: "business-outline"
  },
  {
    id: "Café & Beverage",
    title: "Café & Beverage",
    icon: "cafe-outline"
  },
  {
    id: "QSR & Fast Food",
    title: "QSR & Fast Food",
    icon: "tv-outline"
  },
  {
    id: "Catering & Banquet",
    title: "Catering & Banquet",
    icon: "settings-outline"
  }
];

function CategoryStep({ onSubmit, onSkip, t, preferredRole, setPreferredRole, skills, setSkills, loading }) {
  const [selectedCategory, setSelectedCategory] = useState("Kitchen Production");
  const [jobTitleModalVisible, setJobTitleModalVisible] = useState(false);
  const [jobTitleSearch, setJobTitleSearch] = useState("");

  // Auto detect initial category
  useEffect(() => {
    const initialCat = Object.keys(categoryJobTitles).find(cat => 
      categoryJobTitles[cat].includes(preferredRole)
    ) || "Kitchen Production";
    setSelectedCategory(initialCat);
  }, []);

  const jobTitlesList = categoryJobTitles[selectedCategory] || [];
  const filteredJobTitles = jobTitlesList.filter(title => 
    title.toLowerCase().includes(jobTitleSearch.toLowerCase())
  );

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>
        Which position best matches your experience?
      </Text>
      <Text style={styles.subHeadingText}>
        Select the role that defines your expertise in the hospitality industry.
      </Text>
      
      <View style={{ gap: 12, marginBottom: 20 }}>
        {categories.map((item) => {
          const isSelected = selectedCategory === item.id;
          return (
            <View key={item.id}>
              <TouchableOpacity
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                onPress={() => {
                  setSelectedCategory(item.id);
                  if (selectedCategory !== item.id) {
                    setPreferredRole("");
                  }
                }}
                activeOpacity={0.9}
              >
                <View style={styles.roleCardLeft}>
                  <View style={[styles.roleIconCircle, isSelected && styles.roleIconCircleActive]}>
                    <Ionicons name={item.icon} size={20} color={PRIMARY} />
                  </View>
                  <Text style={styles.roleCardTitle}>{item.title}</Text>
                </View>
                <View style={[styles.radioOutline, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDotInner} />}
                </View>
              </TouchableOpacity>

              {isSelected && (
                <Pressable
                  style={styles.inlineDropdownTrigger}
                  onPress={() => {
                    setJobTitleSearch("");
                    setJobTitleModalVisible(true);
                  }}
                >
                  <Text style={[styles.inlineDropdownTriggerText, !preferredRole && { color: "rgba(10, 5, 4, 0.4)" }]}>
                    {preferredRole || "Select specific job title..."}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="rgba(10, 5, 4, 0.6)" />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: 14 }]}>Additional Skills (comma separated)</Text>
      <TextInput
        placeholder="e.g. Fine Dining, Chocolate tempering"
        placeholderTextColor="rgba(10, 5, 4, 0.4)"
        value={skills}
        onChangeText={setSkills}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, (loading || !preferredRole) && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading || !preferredRole}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.buttonText}>{t("saveAndContinue")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} style={{ marginTop: 16 }}>
        <Text style={styles.later}>Maybe Later</Text>
      </TouchableOpacity>

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
              <Text style={styles.modalTitle}>Select {selectedCategory} Title</Text>
              <TouchableOpacity onPress={() => setJobTitleModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="rgba(10, 5, 4, 0.4)" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="rgba(10, 5, 4, 0.4)" style={styles.searchIcon} />
              <TextInput
                placeholder="Search job titles..."
                placeholderTextColor="rgba(10, 5, 4, 0.4)"
                value={jobTitleSearch}
                onChangeText={setJobTitleSearch}
                style={styles.searchInputField}
              />
            </View>

            {/* Items List */}
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
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
                  {preferredRole === item && <Ionicons name="checkmark" size={18} color="#153e69" />}
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

function SuccessStep({ t, onReturnPress }) {
  return (
    <View style={styles.success}>
      <Ionicons
        name="checkmark-circle"
        size={120}
        color={PRIMARY}
      />

      <Text style={styles.successTitle}>
        {t("completeProfile.successTitle")}
      </Text>

      <Text style={styles.successText}>
        {t("completeProfile.successSubTitle")}
      </Text>

      <TouchableOpacity style={styles.successButton} onPress={onReturnPress}>
        <Text style={styles.buttonText}>
          {t("returnToCommunityFeed")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    padding: 20,
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
