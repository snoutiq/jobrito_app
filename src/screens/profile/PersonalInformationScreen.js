import React, { useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppInput from "../../components/inputs/AppInput";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";

export default function PersonalInformationScreen() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    city: "",
    currentEmployer: "",
    yearsOfExperience: "",
    preferredRole: "",
  });
  const [skills, setSkills] = useState([]);
  const [imageUri, setImageUri] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const profileCompletion = 65;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddSkill = () => {
    setShowSkillInput(true);
  };

  const removeSkill = (skill) => {
    setSkills((current) => current.filter((item) => item !== skill));
  };

  const confirmAddSkill = () => {
    const skill = newSkill.trim();
    if (!skill) {
      return;
    }
    setSkills((current) => (current.includes(skill) ? current : [...current, skill]));
    setNewSkill("");
    setShowSkillInput(false);
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera permission is needed to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
    closeImageModal();
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery permission is needed to choose a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
    closeImageModal();
  };

  const handleSave = () => {
    Alert.alert("Saved", "Profile details saved locally.");
  };

  return (
    <ScreenWrapper contentStyle={styles.page}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Profile Completion</Text>
        <Text style={styles.progressValue}>{profileCompletion}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${profileCompletion}%` }]} />
      </View>

      <View style={styles.profileHero}>
        <Pressable style={styles.avatarOuter} onPress={openImageModal}>
          <View style={styles.avatarInner}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={42} color={colors.primaryDark} />
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={13} color={colors.white} />
          </View>
        </Pressable>

        <Text style={styles.title}>Create your profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about your professional self</Text>
      </View>

      <View style={styles.card}>
        <AppInput
          label="Full Name"
          value={form.fullName}
          onChangeText={(value) => updateField("fullName", value)}
          placeholder="Enter full name"
        />
        <AppInput
          label="Email Address"
          value={form.email}
          onChangeText={(value) => updateField("email", value)}
          keyboardType="email-address"
          placeholder="Enter email address"
        />
        <AppInput
          label="City"
          value={form.city}
          onChangeText={(value) => updateField("city", value)}
          placeholder="Enter city"
        />
        <AppInput
          label="Current Employer"
          value={form.currentEmployer}
          onChangeText={(value) => updateField("currentEmployer", value)}
          placeholder="Enter current employer"
        />

        <View style={styles.selectField}>
          <Text style={styles.selectLabel}>{t("Years of Experience")}</Text>
          <Pressable
            style={styles.selectBox}
            onPress={() =>
              Alert.alert(
                t("Years of Experience"),
                t("This can be connected to a picker later.")
              )
            }
          >
            <Text
              style={[
                styles.selectValue,
                !form.yearsOfExperience && styles.placeholderText,
              ]}
            >
              {form.yearsOfExperience || t("Enter years of experience")}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.mutedText} />
          </Pressable>
        </View>

        <AppInput
          label="Preferred Role"
          value={form.preferredRole}
          onChangeText={(value) => updateField("preferredRole", value)}
          placeholder="Enter preferred role"
        />

        <View style={styles.skillsHeader}>
          <Text style={styles.selectLabel}>{t("Skills")}</Text>
          <Pressable onPress={handleAddSkill} style={styles.addSkillButton}>
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={styles.addSkillText}>{t("Add Skill")}</Text>
          </Pressable>
        </View>

        {showSkillInput ? (
          <View style={styles.skillInputRow}>
            <AppInput
              label="Skill"
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Enter skill"
              containerStyle={styles.skillInput}
            />
            <Pressable onPress={confirmAddSkill} style={styles.skillAddButton}>
              <Text style={styles.skillAddText}>{t("Add")}</Text>
            </Pressable>
          </View>
        ) : null}

        {skills.length ? (
          <View style={styles.skillWrap}>
            {skills.map((skill) => (
              <Pressable
                key={skill}
                onPress={() => removeSkill(skill)}
                style={styles.skillChip}
              >
                <Text style={styles.skillText}>{skill}</Text>
                <Ionicons name="close" size={13} color={colors.primaryDark} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <AppButton title={t("Save Profile")} onPress={handleSave} />
      </View>

      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeImageModal} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("Update profile photo")}</Text>
            <Text style={styles.modalText}>{t("Choose where you want to pick the image from.")}</Text>

            <View style={styles.modalActions}>
              <Pressable onPress={pickFromCamera} style={[styles.modalButton, styles.modalPrimaryButton]}>
                <Ionicons name="camera" size={18} color={colors.white} />
                <Text style={styles.modalPrimaryText}>{t("Camera")}</Text>
              </Pressable>
              <Pressable onPress={pickFromGallery} style={[styles.modalButton, styles.modalSecondaryButton]}>
                <Ionicons name="images" size={18} color={colors.primary} />
                <Text style={styles.modalSecondaryText}>{t("Gallery")}</Text>
              </Pressable>
            </View>

            <Pressable onPress={closeImageModal} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>{t("Cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 12,
    paddingBottom: 20,
    gap: 14,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  progressValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.progressTrack,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  profileHero: {
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  avatarOuter: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  cameraBadge: {
    position: "absolute",
    right: 6,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 2,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  selectField: {
    gap: 8,
  },
  selectLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectBox: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    color: colors.text,
    fontSize: 15,
  },
  placeholderText: {
    color: colors.mutedText,
  },
  skillsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  addSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primarySoftBorder,
    backgroundColor: colors.primarySoft,
  },
  addSkillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  skillInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  skillInput: {
    flex: 1,
  },
  skillAddButton: {
    minHeight: 48,
    minWidth: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
  },
  skillAddText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  skillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoftBorder,
  },
  skillText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  modalText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalPrimaryButton: {
    backgroundColor: colors.primary,
  },
  modalSecondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primarySoftBorderAlt,
  },
  modalPrimaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  modalSecondaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  modalCloseButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  modalCloseText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: "700",
  },
});
