import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@meili/shared'

// Placeholder resources — real copy lands per page as each batch is built
// (Public pages / Customer Zone / Admin Console), translated to lo/zh/en
// per Content Brief rule 0.1.
const resources = {
  lo: { translation: { appName: 'MEILI EXPRESS' } },
  zh: { translation: { appName: 'MEILI EXPRESS' } },
  en: { translation: { appName: 'MEILI EXPRESS' } },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'lo',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
  })

export default i18n
