import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHero } from '../../../components/customer/AppHero'
import { StatusBadge } from '../../../components/customer/StatusBadge'
import { Container } from '../../../components/primitives/Container'
import { customerApi } from '../../../lib/customerApi'

export default function ReferralPage() {
  const { t, i18n } = useTranslation()
  const code = useQuery({ queryKey: ['referral', 'code'], queryFn: customerApi.referralCode })
  const friends = useQuery({ queryKey: ['referral', 'friends'], queryFn: customerApi.referralFriends })
  const [copied, setCopied] = useState(false)

  const unlockedCount = friends.data?.items.filter((f) => f.status === 'unlocked').length ?? 0
  const earned = friends.data?.items.reduce((sum, f) => sum + f.pointsEarned, 0) ?? 0

  function handleCopy() {
    if (code.data && navigator.clipboard) navigator.clipboard.writeText(code.data.accountId)
    setCopied(true)
  }

  return (
    <div>
      <AppHero
        title={t('app.referral.title')}
        subtitle={t('app.referral.sub')}
        stats={[
          { value: String(friends.data?.items.length ?? 0), label: t('app.referral.friends') },
          { value: String(unlockedCount), label: t('app.referral.statusUnlocked') },
          { value: String(earned), label: t('app.referral.colEarn') },
        ]}
      />
      <Container className="py-10 sm:py-12">
        <div className="rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
          <div className="font-mono text-[10.5px] tracking-[0.14em] text-brand-900">{t('app.referral.myCode')}</div>
          <div className="mt-3.5 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center">
            <div className="font-mono text-[26px] font-medium tracking-[0.1em] text-ink-900">{code.data?.accountId ?? '—'}</div>
            <button
              type="button"
              onClick={handleCopy}
              className={`whitespace-nowrap rounded-full px-7 py-3.5 text-sm font-bold ${
                copied ? 'bg-success-bg text-success-text' : 'bg-gradient-brand text-white shadow-brand-btn'
              }`}
            >
              {copied ? t('app.referral.copied') : t('app.referral.copy')}
            </button>
          </div>
          <p className="mt-5 text-[14.5px] leading-[1.75] text-ink-500">{t('app.referral.rule')}</p>
        </div>

        <div className="mt-12">
          <div className="text-xl font-bold text-ink-900 sm:text-2xl">{t('app.referral.friends')}</div>
          <div className="mt-5 overflow-hidden rounded-[20px] bg-white shadow-card">
            <div className="hidden bg-[#FFF7F2] px-6 py-4 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
              <div className="flex-[1.6]">{t('app.referral.colFriend')}</div>
              <div className="flex-[1.2]">{t('app.referral.colDate')}</div>
              <div className="flex-[1.4]">{t('app.referral.colStatus')}</div>
              <div className="flex-1 text-right">{t('app.referral.colEarn')}</div>
            </div>
            {(friends.data?.items ?? []).map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-1.5 border-t border-[#f6f6f7] px-6 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-0 sm:py-4"
              >
                <div className="font-semibold text-ink-900 sm:flex-[1.6]">{f.name ?? f.phone}</div>
                <div className="text-ink-500 sm:flex-[1.2]">{new Date(f.linkedAt).toLocaleDateString(i18n.language)}</div>
                <div className="sm:flex-[1.4]">
                  <StatusBadge
                    label={t(f.status === 'unlocked' ? 'app.referral.statusUnlocked' : 'app.referral.statusLocked')}
                    positive={f.status === 'unlocked'}
                  />
                </div>
                <div className="font-semibold text-ink-900 sm:flex-1 sm:text-right">+{f.pointsEarned}</div>
              </div>
            ))}
            {friends.data && friends.data.items.length === 0 && <div className="p-6 text-ink-400">{t('app.referral.empty')}</div>}
          </div>
        </div>
      </Container>
    </div>
  )
}
