import type { ReactNode } from 'react'

// -------------------------------------------------------------------- table
export function AdminTable({ columns, children }: { columns: { label: string; flex?: number }[]; children: ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-[20px] bg-white shadow-card">
      <div className="hidden gap-4 bg-[#FFF7F2] px-6 py-4 font-mono text-[10.5px] tracking-[0.14em] text-brand-900 sm:flex">
        {columns.map((c) => (
          <div key={c.label} style={{ flex: c.flex ?? 1 }}>
            {c.label}
          </div>
        ))}
      </div>
      {children}
    </div>
  )
}

export function AdminTableRow({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-[#f6f6f7] px-6 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-4">
      {children}
      {actions && <div className="flex flex-wrap gap-2 sm:ml-auto sm:shrink-0">{actions}</div>}
    </div>
  )
}

export function AdminCell({
  flex,
  children,
  mono,
  dim,
  strong,
}: {
  flex?: number
  children: ReactNode
  mono?: boolean
  dim?: boolean
  strong?: boolean
}) {
  return (
    <div
      className={`min-w-0 text-[14.5px] leading-[1.6] break-words ${mono ? 'font-mono' : ''} ${dim ? 'text-ink-500' : 'text-ink-900'} ${strong ? 'font-semibold' : ''}`}
      style={{ flex: flex ?? 1 }}
    >
      {children}
    </div>
  )
}

export function AdminEmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-6 py-8 text-center text-ink-400">{children}</div>
}

// -------------------------------------------------------------------- badge
type Tone = 'ok' | 'warn' | 'bad'
const TONE_STYLE: Record<Tone, { bg: string; color: string }> = {
  ok: { bg: '#ECFDF3', color: '#027A48' },
  warn: { bg: '#FFF3EB', color: '#C2470A' },
  bad: { bg: '#FEF3F2', color: '#B42318' },
}

export function AdminBadge({ label, tone = 'warn' }: { label: string; tone?: Tone }) {
  return (
    <span
      className="inline-flex whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold"
      style={{ background: TONE_STYLE[tone].bg, color: TONE_STYLE[tone].color }}
    >
      {label}
    </span>
  )
}

// ------------------------------------------------------------------ action
type ActionKind = 'default' | 'primary' | 'danger'
const ACTION_STYLE: Record<ActionKind, string> = {
  default: 'bg-white border border-ink-100 text-ink-700',
  primary: 'bg-ink-900 text-white',
  danger: 'bg-error-bg text-error-text',
};

export function ActionButton({ label, kind = 'default', onClick, disabled }: { label: string; kind?: ActionKind; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[12.5px] font-semibold disabled:opacity-50 ${ACTION_STYLE[kind]}`}
    >
      {label}
    </button>
  )
}

// ------------------------------------------------------------------ filter
export function FilterPills({ options, active, onChange }: { options: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(i)}
          className={`rounded-full px-5 py-2.5 text-[13px] font-semibold ${
            active === i ? 'bg-ink-900 text-white' : 'border border-ink-100 bg-white text-ink-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// -------------------------------------------------------------------- kpi
export function AdminKpiCard({ kicker, value, note }: { kicker: string; value: string; note: string }) {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-card">
      <div className="font-mono text-[10.5px] tracking-[0.14em] text-brand-900">{kicker}</div>
      <div className="mt-2.5 text-[28px] font-bold tracking-tight text-ink-900 break-words">{value}</div>
      <div className="mt-2.5 text-[13px] leading-[1.7] text-ink-500">{note}</div>
    </div>
  )
}

// -------------------------------------------------------------------- form
export function FormCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="rounded-[22px] bg-white p-6 shadow-card sm:p-[30px]">
      <div className="text-lg font-bold text-ink-900">{title}</div>
      {sub && <div className="mt-1.5 text-[13.5px] text-ink-400">{sub}</div>}
      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  area,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  area?: boolean
  error?: string
}) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-ink-700">{label}</div>
      {area ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2.5 w-full resize-y rounded-[14px] border px-4 py-3 text-[15px] outline-none ${error ? 'border-error-border bg-error-bg' : 'border-ink-100'}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2.5 w-full rounded-[14px] border px-4 py-3 text-[15px] outline-none ${error ? 'border-error-border bg-error-bg' : 'border-ink-100'}`}
        />
      )}
      {error && <div className="mt-1.5 text-[12.5px] text-error-text">{error}</div>}
    </div>
  )
}

export function PrimaryButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-1 rounded-full bg-gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-brand-btn disabled:opacity-60"
    >
      {label}
    </button>
  )
}

export function Notice({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'error' | 'info' }) {
  const style =
    tone === 'success'
      ? 'bg-success-bg text-success-text'
      : tone === 'error'
        ? 'bg-error-bg text-error-text'
        : 'bg-[#FFF7F2] text-brand-800 border border-brand-300';
  return <div className={`mt-4 rounded-2xl px-4 py-3 text-[13px] leading-[1.6] ${style}`}>{children}</div>
}
