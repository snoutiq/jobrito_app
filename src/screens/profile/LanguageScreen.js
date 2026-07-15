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
    }, 300);
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
    {
      key: "mr",
      label: "मराठी",
      subtitle: "मराठी मध्ये ॲप वापरा",
    },
    {
      key: "ar_AE",
      label: "العربية (UAE)",
      subtitle: "استخدم التطبيق بالعربية (Dubai)",
    },
    {
      key: "ar_SA",
      label: "العربية (KSA)",
      subtitle: "استخدم التطبيق بالعربية (KSA)",
    },
    {
      key: "en_EU",
      label: "English (Europe)",
      subtitle: "Use the app in European English",
    },
    {
      key: "ml",
      label: "മലയാളം",
      subtitle: "മലയാളത്തിൽ ആപ്പ് ഉപയോഗിക്കുക",
    },
    {
      key: "kn",
      label: "ಕನ್ನಡ",
      subtitle: "ಕನ್ನಡದಲ್ಲಿ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಿ",
    },
    {
      key: "te",
      label: "తెలుగు",
      subtitle: "తెలుగులో యాప్‌ని ఉపయోగించండి",
    },
    {
      key: "ta",
      label: "தமிழ்",
      subtitle: "தமிழில் பயன்பாட்டைப் பயன்படுத்தவும்",
    },
  ];


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0a0504" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("languageScreen.title")}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScreenWrapper
        edges={["left", "right", "bottom"]}
        style={{ backgroundColor: "#f2f2f3", flex: 1 }}
        contentStyle={{ backgroundColor: "#f2f2f3", padding: 16 }}
      >
        <View style={styles.card}>
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
    fontSize: 18,
    fontWeight: "800",
    color: "#0a0504",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
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
