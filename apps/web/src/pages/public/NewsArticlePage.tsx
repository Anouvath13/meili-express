import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/primitives/Container'
import { GradientButton } from '../../components/primitives/GradientButton'
import { Hero } from '../../components/layout/Hero'
import { pickLang } from '../../lib/localize'
import { publicApi } from '../../lib/publicApi'

export default function NewsArticlePage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const article = useQuery({ queryKey: ['news', id], queryFn: () => publicApi.newsArticle(id!), enabled: !!id })

  if (!article.data) {
    return (
      <Container className="py-24 text-center text-ink-400">{article.isLoading ? t('common.loading') : t('common.error')}</Container>
    )
  }

  const a = article.data.article
  const title = pickLang(lang, { lo: a.titleLo, zh: a.titleZh, en: a.titleEn })
  const body = pickLang(lang, { lo: a.bodyLo, zh: a.bodyZh, en: a.bodyEn })
  const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString(lang) : '—'

  return (
    <div>
      <Hero kicker={t('news.kicker')} title={title} compact />
      <Container className="py-14 sm:py-[88px]">
        <GradientButton to="/news" variant="ghost" className="px-6 py-3 text-sm">
          {t('news.backToNews')}
        </GradientButton>
        <div className="mt-7 inline-block rounded-full bg-brand-100 px-3.5 py-[7px] text-[11.5px] font-semibold text-brand-900">{date}</div>
        <div className="mt-9 flex h-[300px] items-center justify-center rounded-[20px] bg-gradient-news font-mono text-[11px] tracking-[0.14em] text-[#C79A7A]">
          ARTICLE IMAGE PLACEHOLDER
        </div>
        <p className="mt-9 max-w-[660px] text-[17px] leading-[2] text-ink-700 text-pretty">{body}</p>
      </Container>
    </div>
  )
}
