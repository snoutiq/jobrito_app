import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import colors from "../../constants/colors";
import { getStoredLanguage, setStoredLanguage,setSeenIntro } from "../../services/storage";


  export default function IntroLanguageScreen({ navigation }){
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
      setSelectedLanguage(language.startsWith("hi") ? "hi" : "en");
    };

    loadLanguage();

    return () => {
      mounted = false;
    };
  }, [i18n]);

  const handleSelect = async (language) => {
    setSelectedLanguage(language);
    await i18n.changeLanguage(language);
    await setStoredLanguage(language);
  };

  const handleContinue = async () => {
  await setStoredLanguage(selectedLanguage);
  await setSeenIntro();

  navigation.navigate("Role");
};

  const options = [
    {
      key: "en",
      label: "English",
      subtitle: t("introLanguage.subtitleEn"),
    },
    {
      key: "hi",
      label: "हिन्दी",
      subtitle: t("introLanguage.subtitleHi"),
    },
  ];

  return (
    <ScreenWrapper
      scroll={false}
      style={{ backgroundColor: colors.background }}
      contentStyle={styles.content}
    >
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="language" size={34} color="#fff" />
        </View>
        <Text style={styles.title}>{t("introLanguage.introLanguage")}</Text>
        <Text style={styles.subtitle}>{t("introLanguage.subtitle")}</Text>
      </View>

      <View style={styles.card}>
        {options.map((item, index) => {
          const active = selectedLanguage === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleSelect(item.key)}
              style={[
                styles.option,
                index === options.length - 1 && styles.optionLast,
                active && styles.optionActive,
              ]}
            >
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {item.label}
                </Text>
                <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLine} />
        <Text style={styles.footerBrand}>JobRito Hospitality Network</Text>
        <View style={styles.footerIcons}>
          <Ionicons name="restaurant-outline" size={16} color={colors.mutedText} />
          <Ionicons name="cafe-outline" size={16} color={colors.mutedText} />
          <Ionicons name="bed-outline" size={16} color={colors.mutedText} />
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Pressable onPress={handleContinue} style={styles.continueButton}>
          <Text style={styles.continueText}>{t("continue")}</Text>
        </Pressable>
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
    maxWidth: 280,
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
    backgroundColor: "#fff",
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionActive: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  optionText: {
    flex: 1,
    gap: 2,
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
  footer: {
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  footerLine: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  footerBrand: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  footerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bottomBar: {
    marginTop: "auto",
  },
  continueButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
