import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { getStoredLanguage, setStoredLanguage } from "../../services/storage";
import { updateUserLanguage } from "../../redux/slices/userSlice";

export default function LanguageScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    let mounted = true;

    const loadLanguage = async () => {
      const storedLanguage = await getStoredLanguage();
      if (!mounted) {
        return;
      }
      const language = storedLanguage || i18n.language || "en";
      setSelectedLanguage(language);
    };

    loadLanguage();

    return () => {
      mounted = false;
    };
  }, [i18n]);

  const handleSelectLanguage = async (language) => {
    setSelectedLanguage(language);
    await i18n.changeLanguage(language);
    await setStoredLanguage(language);
    dispatch(updateUserLanguage(language)); // Sync with backend
    
    // Smooth back navigation after language is set
    setTimeout(() => {
      navigation.goBack();
    }, 250);
  };

  const languageButtons = [
    {
      key: "en",
      label: "English",
      subtitle: t("fullySupported", "Fully Supported"),
    },
    {
      key: "hi",
      label: "हिन्दी (Hindi)",
      subtitle: t("fullySupported", "Fully Supported"),
    },
    {
      key: "ar",
      label: "العربية (Arabic)",
      subtitle: t("inDevelopmentStayTuned", "In development — stay tuned for updates"),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { textAlign: "center" }]}>{t("preferredLanguage", "PREFERRED LANGUAGE")}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScreenWrapper
        edges={["left", "right", "bottom"]}
        style={{ backgroundColor: "#f2f2f3", flex: 1 }}
        contentStyle={{ backgroundColor: "#f2f2f3", padding: 16 }}
      >
        <View style={styles.cleanListContainer}>
          <Text style={styles.description}>
            {t("choosePreferredLanguageApp", "Choose your preferred language for the Jobrito app.")}
          </Text>

          <View style={styles.buttonList}>
            {languageButtons.map((item) => {
              const active = selectedLanguage === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handleSelectLanguage(item.key)}
                  style={[styles.languageButton, active && styles.languageButtonActive]}
                >
                  <View style={styles.buttonTextBlock}>
                    <Text style={[styles.buttonLabel, active && styles.buttonLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.buttonSubtitle, active && styles.buttonSubtitleActive]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScreenWrapper>
    </View>
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
    fontWeight: "800",
    color: "#0a0504",
  },
  cleanListContainer: {
    gap: 14,
  },
  description: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonList: {
    gap: 12,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 5, 4, 0.15)",
    backgroundColor: "#ffffff",
  },
  languageButtonActive: {
    borderColor: "#153e69",
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  buttonTextBlock: {
    flex: 1,
    gap: 2,
  },
  buttonLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  buttonLabelActive: {
    color: "#153e69",
  },
  buttonSubtitle: {
    color: colors.mutedText,
    fontSize: 12,
  },
  buttonSubtitleActive: {
    color: "#153e69",
  },
  radio: {
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
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#153e69",
  },
});
