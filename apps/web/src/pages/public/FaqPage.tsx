import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '../../components/primitives/Container'
import { Hero } from '../../components/layout/Hero'
import { pickLang } from '../../lib/localize'
import { publicApi } from '../../lib/publicApi'

export default function FaqPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [openId, setOpenId] = useState<string | null>(null)

  const faq = useQuery({ queryKey: ['faq'], queryFn: publicApi.faq })
  const categories = faq.data?.categories ?? []
  const items = (faq.data?.items ?? []).filter((it) => !category || it.categoryId === category)

  return (
    <div>
      <Hero kicker={t('faq.kicker')} title={t('faq.title')} compact />
      <Container className="py-14 sm:py-[88px]">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={`rounded-full px-[22px] py-[11px] text-[13.5px] font-semibold ${
              category === undefined ? 'bg-gradient-brand text-white shadow-brand-btn' : 'border border-ink-100 bg-white font-medium text-ink-500'
            }`}
          >
            {t('faq.categoryAll')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-[22px] py-[11px] text-[13.5px] font-semibold ${
                category === c.id ? 'bg-gradient-brand text-white shadow-brand-btn' : 'border border-ink-100 bg-white font-medium text-ink-500'
              }`}
            >
              {pickLang(lang, { lo: c.nameLo, zh: c.nameZh, en: c.nameEn })}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3.5">
          {items.map((it) => {
            const open = openId === it.id
            const question = pickLang(lang, { lo: it.questionLo, zh: it.questionZh, en: it.questionEn })
            const answer = pickLang(lang, { lo: it.answerLo, zh: it.answerZh, en: it.answerEn })
            return (
              <div
                key={it.id}
                className={`overflow-hidden rounded-[18px] ${open ? 'border border-brand-300 bg-[#FFF7F2] shadow-card' : 'border border-ink-100 bg-white'}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : it.id)}
                  className="flex w-full items-center gap-5 px-7 py-6 text-left"
                >
                  <div className="text-[16.5px] font-semibold leading-[1.6] text-ink-900">{question}</div>
                  <div
                    className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[17px] ${
                      open ? 'bg-gradient-brand text-white' : 'bg-brand-50 text-brand-800'
                    }`}
                  >
                    {open ? '−' : '+'}
                  </div>
                </button>
                {open && <div className="max-w-[640px] px-7 pb-[26px] text-[15px] leading-[1.9] text-ink-500">{answer}</div>}
              </div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
