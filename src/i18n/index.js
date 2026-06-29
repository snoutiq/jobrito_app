import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getStoredLanguage } from "../services/storage";
import en from "./en.json";
import hi from "./hi.json";
import mr from "./mr.json";
import ar from "./ar.json";

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
      mr: { translation: mr },
      ar_AE: { translation: ar },
      ar_SA: { translation: ar },
      en_EU: { translation: en },
    },
  });
};

initializeI18n();

export default i18n;
