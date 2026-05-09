import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en/translation.json";
import hi from "./locales/hi/translation.json";
import kn from "./locales/kn/translation.json";
import ta from "./locales/ta/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn },
      ta: { translation: ta },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "hi", "kn", "ta"],
    interpolation: {
      escapeValue: false,
    },
    // Enables `_one` / `_other` suffix plural keys used across locales (e.g. exams.subjectsCount_*).
    compatibilityJSON: "v4",
  });

export default i18n;
