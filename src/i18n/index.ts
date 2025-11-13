import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './locales/ru/common.json';
import en from './locales/en/common.json';

export function initI18n() {
  if (i18n.isInitialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { ru: { translation: ru }, en: { translation: en } },
      fallbackLng: 'ru',
      supportedLngs: ['ru', 'en'],
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
      interpolation: { escapeValue: false },
      returnNull: false,
    });

  document.documentElement.lang = i18n.resolvedLanguage || 'ru';
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });

  return i18n;
}

export default i18n;


