import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '../../components/primitives/Container'
import { Hero } from '../../components/layout/Hero'
import { publicApi } from '../../lib/publicApi'
import { NewsCard } from './news/NewsCard'

export default function NewsListPage() {
  const { t } = useTranslation()
  const [category, setCategory] = useState<string | undefined>(undefined)

  const categories = useQuery({ queryKey: ['newsCategories'], queryFn: publicApi.newsCategories })
  const news = useQuery({ queryKey: ['news', { category }], queryFn: () => publicApi.news({ category }) })

  return (
    <div>
      <Hero kicker={t('news.kicker')} title={t('news.title')} compact />
      <Container className="py-14 sm:py-[88px]">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={`rounded-full px-[22px] py-[11px] text-[13.5px] font-semibold ${
              category === undefined ? 'bg-gradient-brand text-white shadow-brand-btn' : 'border border-ink-100 bg-white font-medium text-ink-500'
            }`}
          >
            {t('news.categoryAll')}
          </button>
          {(categories.data?.categories ?? []).map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`rounded-full px-[22px] py-[11px] text-[13.5px] font-semibold ${
                category === c.key ? 'bg-gradient-brand text-white shadow-brand-btn' : 'border border-ink-100 bg-white font-medium text-ink-500'
              }`}
            >
              {t(`news.categories.${c.key}`, { defaultValue: c.nameEn })}
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-[22px]">
          {(news.data?.items ?? []).map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
          {news.data && news.data.items.length === 0 && <div className="text-ink-400">{t('common.empty')}</div>}
        </div>
      </Container>
    </div>
  )
}
