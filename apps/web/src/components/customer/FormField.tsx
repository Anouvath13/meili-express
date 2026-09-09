import type { ChangeEventHandler } from 'react'

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  actionLabel,
  onAction,
  actionDisabled,
}: {
  label: string
  type?: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  error?: string
  hint?: string
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
}) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-ink-700">{label}</div>
      <div className="flex items-stretch gap-2.5">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`mt-2.5 w-full rounded-[14px] border px-5 py-[15px] text-[15px] text-ink-900 outline-none ${
            error ? 'border-error-border bg-error-bg' : 'border-ink-100 bg-white'
          }`}
        />
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="mt-2.5 whitespace-nowrap rounded-[14px] bg-brand-50 px-5 text-[13.5px] font-bold text-brand-800 disabled:opacity-50"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {error && <div className="mt-1.5 text-[12.5px] text-error-text">{error}</div>}
      {hint && !error && <div className="mt-1.5 text-[12.5px] leading-[1.6] text-ink-400">{hint}</div>}
    </div>
  )
}
