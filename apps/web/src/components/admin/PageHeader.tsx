import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[32px]">{title}</h1>
        <p className="mt-2.5 max-w-[560px] text-[14.5px] leading-[1.8] text-ink-500">{subtitle}</p>
      </div>
      {action && <div className="shrink-0 sm:ml-auto">{action}</div>}
    </div>
  )
}

export function BlockedBanner({ message }: { message: string }) {
  return <div className="mt-6 rounded-[20px] border border-brand-300 bg-[#FFF7F2] p-6 text-[14.5px] leading-[1.85] text-brand-800">{message}</div>
}
