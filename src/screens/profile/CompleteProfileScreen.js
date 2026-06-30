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
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { fetchProfile, updateProfile } from "../../redux/slices/userSlice";

const PRIMARY = "#22C55E";

export default function CompleteProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { profile, loading } = useSelector((state) => state.user);
  
  const [step, setStep] = useState(1);

  // Profile Form States
  const [photo, setPhoto] = useState("https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop");
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
      if (profile.full_name || profile.name) setFullName(profile.full_name || profile.name);
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
      full_name: fullName, // "User Four"
      email: email, // "alex-new@hospitality.com"
      city: city, // "London, UK"
      experience_range: experienceRange, // "0-2 Years"
      preferred_role: preferredRole, // "Chef"
      skills: skills, // "Fine Dining, Chocolate tempering"
    //   Fields not in the cURL are removed for this example
      profile_photo_path: photo,
      current_employer: currentEmployer,
      gender,
      job_type: jobType,
      location_preference: locationPreference,
    };
    try {
      await dispatch(updateProfile(payload)).unwrap();
      setStep(6); // Success screen
    } catch (error) {
      Alert.alert("Submission Error", error?.message || "Failed to update profile details.");
    }
  };

  const progress = step === 6 ? 100 : ((step - 1) / 5) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {step !== 6 && (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={prev}>
              <Ionicons name="arrow-back" size={24} color="#15803D" />
            </TouchableOpacity>

            <Text style={styles.title}>{t("completeProfileTitle")}</Text>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.skip}>{t("skip")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.stepText}>{t("step", { current: step, total: 5 })}</Text>
            <Text style={styles.complete}>
              {Math.round(progress)}% Complete
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
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
            email={email}
            setEmail={setEmail}
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
            t={t}
            preferredRole={preferredRole}
            setPreferredRole={setPreferredRole}
            skills={skills}
            setSkills={setSkills}
            loading={loading}
          />
        )}
        {step === 6 && <SuccessStep t={t} navigation={navigation} />}
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      <TouchableOpacity style={styles.button} onPress={handleUploadPhoto}>
        <Text style={styles.buttonText}>{t("uploadPhoto")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
        <Text style={styles.buttonText}>{t("takePhoto")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={next}>
        <Text style={styles.later}>{photo ? t("continue", "Continue") : t("maybeLater")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function PersonalStep({ next, t, fullName, setFullName, email, setEmail, gender, setGender }) {
  return (
    <View style={styles.content}>
      <Text style={styles.label}>{t("fullName")}</Text>
      <TextInput
        placeholder={t("enterFullName")}
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 24 }]}>
        Email Address
      </Text>
      <TextInput
        placeholder="Enter your email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
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
        style={[styles.button, (!fullName || !email) && styles.buttonDisabled]}
        onPress={() => {
          if (!fullName || !email) {
            Alert.alert("Required Fields", "Please enter your full name and email address.");
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
      <Ionicons name={icon} size={28} color={selected ? "#FFFFFF" : "#0F7A37"} />
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
  const ranges = ["0-2 Years", "3-5 Years", "5+ Years"];
  const jobTypes = ["Full Time", "Part time", "Contract", "Freelance"];
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
        <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
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
        placeholder={t("typeCurrentEmployer")}
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

function LocationStep({ next, t, locationPreference, setLocationPreference, city, setCity }) {
  const prefs = ["India", "Overseas", "Both"];

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>
        {t("completeProfile.location.heading")}
      </Text>

      <View style={{ gap: 8, marginBottom: 20 }}>
        {prefs.map((pref) => {
          const isSelected = locationPreference === pref;
          return (
            <TouchableOpacity
              key={pref}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => setLocationPreference(pref)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{pref}</Text>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={isSelected ? PRIMARY : "#999"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>City / Location</Text>
      <TextInput
        placeholder="e.g. London, UK or Mumbai, India"
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, !city && styles.buttonDisabled]}
        onPress={() => {
          if (!city) {
            Alert.alert("Required Field", "Please enter your city/current location.");
            return;
          }
          next();
        }}
      >
        <Text style={styles.buttonText}>{t("continue")}</Text>
      </TouchableOpacity>
    </View>
  );
}

function CategoryStep({ onSubmit, t, preferredRole, setPreferredRole, skills, setSkills, loading }) {
  const jobs = [
    "Kitchen Production",
    "Restaurant Operations",
    "Cafe & Beverage",
    "QSR & Fast Food",
    "Catering & Banquet",
  ];

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>
        {t("completeProfile.category.heading")}
      </Text>

      <View style={{ gap: 8, marginBottom: 20 }}>
        {jobs.map((item) => {
          const isSelected = preferredRole === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => setPreferredRole(item)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item}</Text>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={isSelected ? PRIMARY : "#999"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Additional Skills (comma separated)</Text>
      <TextInput
        placeholder="e.g. Fine Dining, Chocolate tempering"
        value={skills}
        onChangeText={setSkills}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{t("saveAndContinue")}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SuccessStep({ t, navigation }) {
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

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Home")}>
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  skip: {
    color: "#0F7A37",
    fontSize: 16,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  stepText: {
    fontWeight: "600",
  },
  complete: {
    color: "#0F7A37",
    fontWeight: "700",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    borderRadius: 12,
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
    color: "#1E293B",
    fontSize: 15,
  },
  label: {
    fontWeight: "600",
    color: "#334155",
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
    backgroundColor: "#FFFFFF",
  },
  genderCardSelected: {
    backgroundColor: "#0F7A37",
    borderColor: "#0F7A37",
  },
  genderText: {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  genderTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  question: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    color: "#1E293B",
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
    backgroundColor: "#FFFFFF",
  },
  pickerTriggerText: {
    fontSize: 15,
    color: "#1E293B",
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownText: {
    fontSize: 15,
    color: "#475569",
  },
  boldText: {
    fontWeight: "700",
    color: "#0F7A37",
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
    backgroundColor: "#FFFFFF",
  },
  optionSelected: {
    borderColor: PRIMARY,
    backgroundColor: "#F0FDF4",
  },
  optionText: {
    fontSize: 15,
    color: "#475569",
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
    backgroundColor: "#93C5FD",
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
    color: "#64748B",
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
    color: "#1E293B",
  },
  successText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 10,
    fontSize: 15,
    lineHeight: 22,
  },
});