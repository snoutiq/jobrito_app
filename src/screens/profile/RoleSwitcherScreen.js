import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";
import { ROLE_LIST } from "../../constants/roles";
import { switchUserRole } from "../../redux/slices/userSlice";

export default function RoleSwitcherScreen({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentRole = useSelector((state) => state.user.activeRole);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const handleSave = async () => {
    const result = await dispatch(switchUserRole(selectedRole));
    if (switchUserRole.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  const getRoleLabel = (role) => {
    if (role === "job_seeker") return t("roleSelection.jobseeker", "Talent");
    if (role === "employer") return t("roleSelection.employer", "Post a Job");
    if (role === "chef") return t("roleSelection.chef", "Register as Chef");
    return role;
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>{t("switchRole", "Switch Role")}</Text>
        <Text style={styles.subtitle}>{t("selectActiveWorkspaceRole", "Select the active workspace role.")}</Text>
      </View>

      <View style={{ gap: 12 }}>
        {ROLE_LIST.map((role) => {
          const active = selectedRole === role;
          return (
            <Pressable
              key={role}
              onPress={() => setSelectedRole(role)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {getRoleLabel(role)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AppButton title={t("saveRole", "Save Role")} onPress={handleSave} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
  },
  option: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  optionTextActive: {
    color: colors.primaryDark,
  },
});
