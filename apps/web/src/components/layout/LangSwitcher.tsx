import { useTranslation } from 'react-i18next'

const LANGS: { code: string; label: string; short: string }[] = [
  { code: 'lo', label: 'ລາວ', short: 'ລາວ' },
  { code: 'zh', label: '中文', short: '中' },
  { code: 'en', label: 'EN', short: 'EN' },
]

export function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()
  const current = i18n.language

  return (
    <div className="flex gap-[2px] rounded-full bg-brand-50 p-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => i18n.changeLanguage(l.code)}
          className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors ${
            current === l.code ? 'bg-white font-bold text-brand-700 shadow-[0_1px_3px_rgba(120,40,0,0.18)]' : 'text-brand-900/60'
          }`}
        >
          {compact ? l.short : l.label}
        </button>
      ))}
    </div>
  )
}
