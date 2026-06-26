import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { getStoredLanguage, setStoredLanguage } from "../../services/storage";
import { updateUserLanguage } from "../../redux/slices/userSlice";

export default function LanguageScreen() {
  const dispatch = useDispatch();
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
  };

  const languageButtons = [
    {
      key: "en",
      label: "English",
      subtitle: "Use the app in English",
    },
    {
      key: "hi",
      label: "हिन्दी",
      subtitle: "हिंदी में ऐप का उपयोग करें",
    },
    // {
    //   key: "mr",
    //   label: "मराठी",
    //   subtitle: "मराठी मध्ये ॲप वापरा",
    // },
    // {
    //   key: "ar_AE",
    //   label: "العربية (UAE)",
    //   subtitle: "استخدم التطبيق بالعربية (Dubai)",
    // },
    // {
    //   key: "ar_SA",
    //   label: "العربية (KSA)",
    //   subtitle: "استخدم التطبيق بالعربية (KSA)",
    // },
    // {
    //   key: "en_EU",
    //   label: "English (Europe)",
    //   subtitle: "Use the app in European English",
    // },
  ];


  return (
    <ScreenWrapper
      edges={["left", "right", "bottom"]}
      style={{ backgroundColor: "#fff" }}
      contentStyle={{ backgroundColor: "#fff" }}
    >

      <View style={styles.card}>
        <Text style={styles.title}>{t("languageScreen.title")}</Text>
        <Text style={styles.description}>
          {t("languageScreen.description")}
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
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
    borderColor: "#D7E3F6",
    backgroundColor: "#F8FBFF",
  },
  languageButtonActive: {
    borderColor: colors.primary,
    backgroundColor: "#EEF5FF",
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
    color: colors.primaryDark,
  },
  buttonSubtitle: {
    color: colors.mutedText,
    fontSize: 12,
  },
  buttonSubtitleActive: {
    color: colors.primary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#B8C9E8",
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
});
