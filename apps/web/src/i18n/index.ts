import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@meili/shared'
import en from './locales/en.json'
import lo from './locales/lo.json'
import zh from './locales/zh.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      lo: { translation: lo },
      zh: { translation: zh },
      en: { translation: en },
    },
    fallbackLng: 'lo',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

export default i18n
