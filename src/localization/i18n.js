import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const LOCALES = {
  'en-US': {
    translation: require('./locales/en-US.json'),
  },
  'es-ES': {
    translation: require('./locales/es-ES.json'),
  },
};

i18n
  .use(
    new LanguageDetector(null, {
      order: [
        'querystring',
        'cookie',
        'localStorage',
        'sessionStorage',
        'navigator',
        'htmlTag',
        'path',
        'subdomain',
      ],
    })
  )
  .use(initReactI18next)
  .init({
    resources: LOCALES,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    fallbackLng: {
      default: ['en-US'],
    },
  });

i18n.services.formatter.add('errorParam', (value, lng, options) =>
  value ? `(${options.label}: ${value})` : null
);

export default i18n;
