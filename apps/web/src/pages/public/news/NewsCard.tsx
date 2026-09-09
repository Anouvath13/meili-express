import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LogoMark } from '../../../components/primitives/Logo'
import { pickLang } from '../../../lib/localize'
import type { NewsListItem } from '../../../lib/publicApi'

export function NewsCard({ item }: { item: NewsListItem }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const title = pickLang(lang, { lo: item.titleLo, zh: item.titleZh, en: item.titleEn })
  const categoryLabel = t(`news.categories.${item.category}`, { defaultValue: item.category })
  const date = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(lang) : '—'

  return (
    <Link
      to={`/news/${item.id}`}
      className="min-w-[240px] flex-1 overflow-hidden rounded-[20px] bg-white shadow-card transition-shadow hover:shadow-card-lg"
    >
      <div className="flex h-[150px] items-center justify-center bg-gradient-news">
        <div className="opacity-50">
          <LogoMark size={34} />
        </div>
      </div>
      <div className="p-7">
        <div className="inline-block rounded-full bg-brand-100 px-[13px] py-1.5 text-[11.5px] font-semibold text-brand-900">
          {categoryLabel}
        </div>
        <div className="mt-3.5 text-[17px] font-semibold leading-[1.55] text-ink-900">{title}</div>
        <div className="mt-4 text-[12.5px] text-ink-300">{date}</div>
      </div>
    </Link>
  )
}
