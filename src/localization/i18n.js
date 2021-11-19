import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  'en-US': {
    translation: require('./locales/en-US.json')
  }
}

i18n
  .use(new LanguageDetector(null, {
    order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'] 
  }))
  .use(initReactI18next)
  .init({
    resources,
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    fallbackLng: { 
        'default': ['en-US']
    }
  })

  export default i18n
