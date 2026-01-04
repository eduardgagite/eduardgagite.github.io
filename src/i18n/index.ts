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
        order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
        lookupQuerystring: 'lang',
        caches: ['localStorage'],
      },
      interpolation: { escapeValue: false },
      returnNull: false,
    });

  document.documentElement.lang = i18n.resolvedLanguage || 'ru';
  
  // Update og:locale when language changes
  const updateOgLocale = (lng: string) => {
    const ogLocale = lng === 'ru' ? 'ru_RU' : 'en_US';
    let meta = document.querySelector<HTMLMetaElement>('meta[property="og:locale"]');
    if (meta) {
      meta.content = ogLocale;
    }
  };
  
  // Set initial og:locale
  updateOgLocale(i18n.resolvedLanguage || 'ru');
  
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
    updateOgLocale(lng);
  });

  return i18n;
}

export default i18n;


