// CMS content (news/faq/reviews/rates) comes back with all 3 languages at
// once so switching the UI language doesn't need a refetch — this just
// picks the field matching the active i18next language.
export function pickLang(lang: string, values: { lo: string; zh: string; en: string }): string {
  if (lang === 'zh') return values.zh
  if (lang === 'en') return values.en
  return values.lo
}
