import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import AppButton from "../../components/buttons/AppButton";
import colors from "../../constants/colors";
import { ROLE_LIST } from "../../constants/roles";
import { setActiveRole } from "../../redux/slices/userSlice";
import { getStoredLanguage, setStoredRole } from "../../services/storage";
import { setSeenRoleSelection } from "../../services/storage";

export default function RoleSelectionScreen({ navigation }){
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const storedRole = useSelector((state) => state.user.activeRole);
  const [selectedRole, setSelectedRole] = useState(storedRole || ROLE_LIST[0]);

  useEffect(() => {
    const checkStoredLanguage = async () => {
      const language = await getStoredLanguage();
      console.log("Language stored in AsyncStorage:", language);
    };

    checkStoredLanguage();
  }, []);

  const handleSelect = async (role) => {
    setSelectedRole(role);
    dispatch(setActiveRole(role));
    await setStoredRole(role);
  };

  const handleContinue = async () => {
  await setStoredRole(selectedRole);
  await setSeenRoleSelection();

  navigation.navigate("Login");
};

  return (
    <ScreenWrapper
      scroll={false}
      style={{ backgroundColor: colors.background }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-add" size={34} color={colors.white} />
        </View>
        <Text style={styles.title}>{t("intro.title")}</Text>
        <Text style={styles.subtitle}>
          {t("intro.subtitle")}
        </Text>
      </View>

      <View style={styles.card}>
        {ROLE_LIST.map((role, index) => {
          const active = selectedRole === role;
          return (
            <Pressable
              key={role}
              onPress={() => handleSelect(role)}
              style={[
                styles.option,
                index === ROLE_LIST.length - 1 && styles.optionLast,
                active && styles.optionActive,
              ]}
            >
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {t(`roleSelection.${role.toLowerCase().replace(" ", "")}`)}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {t(`roleSelection.description.${role.toLowerCase().replace(" ", "")}`)}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <AppButton title={t("continue")} onPress={handleContinue} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 20,
    gap: 16,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingTop: 20,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionActive: {
    backgroundColor: "#EEF4FF",
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  optionLabelActive: {
    color: colors.primaryDark,
  },
  optionSubtitle: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.mutedText,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  actions: {
    marginTop: "auto",
  },
});
