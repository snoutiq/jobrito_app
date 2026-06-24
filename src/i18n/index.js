import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getStoredLanguage } from "../services/storage";
import en from "./en.json";
import hi from "./hi.json";

const initializeI18n = async () => {
  if (i18n.isInitialized) {
    return;
  }

  const storedLanguage = await getStoredLanguage();

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    lng: storedLanguage || "en", // Use stored language or default to 'en'
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
  });
};

initializeI18n();

export default i18n;
