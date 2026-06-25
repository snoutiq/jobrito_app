import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { submitCommunityJob } from "../../redux/slices/jobSlice";
import colors from "../../constants/colors";

const PRIMARY_GREEN = "#22C55E";

export default function PostJobScreen({ navigation }) {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.user.profile);

  const [step, setStep] = useState(1); // 1: Form, 2: Review, 3: Success

  // Form State
  const [region, setRegion] = useState("India");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [experience, setExperience] = useState("Entry Level");
  const [openPositions, setOpenPositions] = useState("1");
  const [jobDescription, setJobDescription] = useState("");

  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const regions = ["India", "KSA", "Dubai", "Europe"];
  const experienceOptions = ["Entry Level", "1-3 Years", "3-5 Years", "5+ Years"];

  const handleNext = () => {
    if (!jobTitle.trim()) {
      Alert.alert("Error", "Please enter a Job Title.");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Error", "Please enter a Job Location.");
      return;
    }
    if (!salaryRange.trim()) {
      Alert.alert("Error", "Please enter a Salary Range.");
      return;
    }
    if (!openPositions.trim() || isNaN(openPositions)) {
      Alert.alert("Error", "Please enter a valid number of Open Positions.");
      return;
    }
    if (!jobDescription.trim()) {
      Alert.alert("Error", "Please enter a Job Description.");
      return;
    }

    setStep(2);
  };

  const handleSubmitJob = async () => {
    const jobData = {
      employerName: profile?.businessName || "Grand Hyatt Dubai",
      contactPerson: profile?.contactName || "Sarah Jenkins",
      contactNumber: profile?.contactPhone || "+91 923456789",
      email: profile?.contactEmail || "careers@hiring.com",
      jobTitle,
      jobCategory: profile?.segment || "Hospitality & Service",
      city: location,
      experienceRequired: experience,
      openings: openPositions,
      salary: salaryRange,
      jobDescription,
      region,
    };

    const result = await dispatch(submitCommunityJob(jobData));
    if (submitCommunityJob.fulfilled.match(result)) {
      setStep(3);
    } else {
      Alert.alert("Error", "Failed to submit job posting. Please try again.");
    }
  };

  const handleReset = () => {
    setJobTitle("");
    setLocation("");
    setSalaryRange("");
    setExperience("Entry Level");
    setOpenPositions("1");
    setJobDescription("");
    setRegion("India");
    setStep(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          {step === 1 ? (
            <View style={styles.headerRow}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=60" }}
                style={styles.avatar}
              />
              <Text style={styles.headerTitle}>Post New Job</Text>
              <TouchableOpacity onPress={() => Alert.alert("Notifications", "You have no new notifications.")}>
                <Ionicons name="notifications-outline" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => setStep(step - 1)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Post a Job</Text>
              <Text style={styles.draftText}>Draft</Text>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* STEP 1: FORM ENTRY */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              {/* Info Card */}
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  Fill in the details below to find the best talent for your venue. Your post will be visible once approved.
                </Text>
              </View>

              {/* Title Section */}
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitle}>Post a job (Free)</Text>
              </View>

              {/* Select Region */}
              <Text style={styles.inputLabel}>Select Region</Text>
              <View style={styles.regionRow}>
                {regions.map((r) => {
                  const isActive = region === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.regionChip, isActive && { backgroundColor: PRIMARY_GREEN, borderColor: PRIMARY_GREEN }]}
                      onPress={() => setRegion(r)}
                    >
                      <Text style={[styles.regionChipText, isActive && { color: "#fff" }]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Job Information Header */}
              <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 14 }]}>
                <Ionicons name="document-text-outline" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.sectionTitle}>Job Information</Text>
              </View>

              {/* Job Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Title</Text>
                <View style={[styles.inputWrapper, activeField === "jobTitle" && styles.inputWrapperActive]}>
                  <TextInput
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="e.g. Senior Barista"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveField("jobTitle")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <View style={[styles.inputWrapper, activeField === "location" && styles.inputWrapperActive]}>
                  <Ionicons name="location-outline" size={18} color="#64748B" style={styles.inputIconLeft} />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="City, Area"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveField("location")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Salary Range */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Salary Range</Text>
                <View style={[styles.inputWrapper, activeField === "salaryRange" && styles.inputWrapperActive]}>
                  <TextInput
                    value={salaryRange}
                    onChangeText={setSalaryRange}
                    placeholder="e.g. £12 - £15 /hr"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    onFocus={() => setActiveField("salaryRange")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Experience & Open Positions (Inline Row) */}
              <View style={styles.inlineRow}>
                {/* Experience */}
                <View style={[styles.inputGroup, { flex: 1.2, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Experience</Text>
                  <TouchableOpacity
                    style={[styles.inputWrapper, showExpDropdown && styles.inputWrapperActive]}
                    onPress={() => setShowExpDropdown(!showExpDropdown)}
                  >
                    <Text style={styles.textInput}>{experience}</Text>
                    <Ionicons name={showExpDropdown ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
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
                          <Text style={[styles.dropdownItemText, experience === opt && { color: PRIMARY_GREEN, fontWeight: "700" }]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Open Positions */}
                <View style={[styles.inputGroup, { flex: 0.8, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>Open Positions</Text>
                  <View style={[styles.inputWrapper, activeField === "openPositions" && styles.inputWrapperActive]}>
                    <TextInput
                      value={openPositions}
                      onChangeText={setOpenPositions}
                      keyboardType="number-pad"
                      style={styles.textInput}
                      onFocus={() => setActiveField("openPositions")}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Job Description */}
              <View style={[styles.inputGroup, { marginTop: 8 }]}>
                <Text style={styles.inputLabel}>Job Description</Text>
                <View style={[styles.inputWrapper, styles.multilineWrapper, activeField === "jobDescription" && styles.inputWrapperActive]}>
                  <TextInput
                    value={jobDescription}
                    onChangeText={setJobDescription}
                    placeholder="Describe the role, responsibilities, and perks..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={6}
                    style={[styles.textInput, styles.multilineInput]}
                    onFocus={() => setActiveField("jobDescription")}
                    onBlur={() => setActiveField(null)}
                  />
                </View>
              </View>

              {/* Submit for Approval Button */}
              <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleNext}>
                <Text style={styles.submitBtnText}>Submit For Approval</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: REVIEW & POST */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              {/* Progress Tracker Banner */}
              <View style={styles.reviewHeaderBanner}>
                <Text style={styles.reviewStepLabel}>STEP 2 OF 2: CONTACT & REVIEW</Text>
                <Text style={[styles.reviewCompleteLabel, { color: PRIMARY_GREEN }]}>100% Complete</Text>
              </View>
              <View style={styles.reviewProgressBg}>
                <View style={[styles.reviewProgressFill, { backgroundColor: PRIMARY_GREEN }]} />
              </View>

              <Text style={styles.stepTitle}>Review & Post</Text>

              {/* Card 1: Job Details */}
              <View style={styles.reviewCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>
                    <Ionicons name="briefcase-outline" size={16} color="#64748B" /> Job Details
                  </Text>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.editLink}>
                    <Text style={[styles.editLinkText, { color: PRIMARY_GREEN }]}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Details Grid */}
                <View style={styles.gridContainer}>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Category</Text>
                      <Text style={styles.gridValue}>{profile?.segment || "Hospitality & Service"}</Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Position Title</Text>
                      <Text style={styles.gridValue}>{jobTitle}</Text>
                    </View>
                  </View>

                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Location</Text>
                      <Text style={styles.gridValue}>{location}</Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Openings</Text>
                      <Text style={styles.gridValue}>{openPositions} Positions</Text>
                    </View>
                  </View>

                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Salary Range</Text>
                      <Text style={styles.gridValue}>{salaryRange}</Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={styles.gridLabel}>Experience</Text>
                      <Text style={styles.gridValue}>{experience}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />
                <Text style={styles.gridLabel}>Job Description</Text>
                <Text style={styles.reviewDescText}>{jobDescription}</Text>
              </View>

              {/* Card 2: Business Contact */}
              <View style={styles.reviewCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>
                    <Ionicons name="business-outline" size={16} color="#64748B" /> Business Contact
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.editLink}>
                    <Text style={[styles.editLinkText, { color: PRIMARY_GREEN }]}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Avatar Banner */}
                <View style={styles.contactAvatarRow}>
                  <View style={[styles.letterAvatar, { backgroundColor: PRIMARY_GREEN }]}>
                    <Text style={styles.letterAvatarText}>
                      {(profile?.businessName || "G").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.contactBusinessName}>{profile?.businessName || "Grand Hyatt Dubai"}</Text>
                    <Text style={styles.contactBusinessSegment}>{profile?.segment || "Hospitality Group"}</Text>
                  </View>
                </View>

                {/* Details List */}
                <View style={styles.contactDetailsList}>
                  <View style={styles.contactDetailItem}>
                    <Ionicons name="person-outline" size={16} color="#64748B" style={styles.contactDetailIcon} />
                    <Text style={styles.contactDetailText}>
                      {profile?.contactName || "Sarah Jenkins"} ({profile?.relationship || "HR Manager"})
                    </Text>
                  </View>
                  <View style={styles.contactDetailItem}>
                    <Ionicons name="call-outline" size={16} color="#64748B" style={styles.contactDetailIcon} />
                    <Text style={styles.contactDetailText}>{profile?.contactPhone || "+91 923456789"}</Text>
                  </View>
                  <View style={styles.contactDetailItem}>
                    <Ionicons name="mail-outline" size={16} color="#64748B" style={styles.contactDetailIcon} />
                    <Text style={styles.contactDetailText}>{profile?.contactEmail || "careers@hiring.com"}</Text>
                  </View>
                </View>
              </View>

              {/* Info Disclaimer */}
              <View style={styles.disclaimerCard}>
                <Ionicons name="information-circle-outline" size={20} color="#64748B" style={{ marginRight: 10, marginTop: 2 }} />
                <Text style={styles.disclaimerText}>
                  Your job post will be visible to our community of 500+ hospitality professionals. By submitting, you agree to our terms of service and professional community guidelines.
                </Text>
              </View>

              {/* Submit Job Button */}
              <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmitJob}>
                <Text style={styles.submitBtnText}>Submit Job </Text>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <View style={[styles.stepContainer, { alignItems: "center", paddingTop: 40 }]}>
              {/* Checkmark Circle Illustration */}
              <View style={styles.successIconOuter}>
                <View style={[styles.successIconInner, { backgroundColor: `${PRIMARY_GREEN}1A` }]}>
                  <View style={[styles.successIconCore, { backgroundColor: PRIMARY_GREEN }]}>
                    <Ionicons name="checkmark" size={56} color="#fff" />
                  </View>
                </View>
              </View>

              <Text style={styles.successTitle}>🎉 Job Submitted Successfully</Text>

              {/* Submission Status Box */}
              <View style={styles.successInfoCard}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#64748B" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successInfoTitle}>Your job has been submitted for admin review.</Text>
                  <Text style={styles.successInfoText}>
                    Once approved, it will be published in the community feed and notifications will be sent to matched staff.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ width: "100%", gap: 14, marginTop: 40 }}>
                <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleReset}>
                  <Text style={styles.submitBtnText}>Post a new job</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dashboardLink}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleReset();
                    navigation.navigate("Home");
                  }}
                >
                  <Text style={styles.dashboardLinkText}>Go to Dashboard</Text>
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
    justifyContent: "space-between",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  draftText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  infoBoxText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  regionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  regionChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    borderRadius: 99,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  regionChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    minHeight: 50,
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
  inputIconLeft: {
    marginRight: 10,
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
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  reviewHeaderBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewStepLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  reviewCompleteLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  reviewProgressBg: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 99,
    marginBottom: 20,
  },
  reviewProgressFill: {
    height: "100%",
    width: "100%",
    borderRadius: 99,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editLink: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  editLinkText: {
    fontSize: 13,
    fontWeight: "700",
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  reviewDescText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  contactAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  letterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  letterAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  contactBusinessName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  contactBusinessSegment: {
    fontSize: 11,
    color: "#64748B",
  },
  contactDetailsList: {
    gap: 10,
  },
  contactDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactDetailIcon: {
    marginRight: 10,
  },
  contactDetailText: {
    fontSize: 13,
    color: "#475569",
  },
  disclaimerCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  successIconOuter: {
    alignItems: "center",
    marginBottom: 30,
  },
  successIconInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 20,
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
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },
  successInfoText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  dashboardLink: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dashboardLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
});
