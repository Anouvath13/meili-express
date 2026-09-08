import type { MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-gradient-brand text-white shadow-brand-btn',
  secondary: 'bg-white/12 border border-white/55 text-white',
  ghost: 'bg-brand-50 text-brand-800',
  dark: 'bg-ink-900 text-white',
}

export function GradientButton({
  children,
  variant = 'primary',
  className = '',
  to,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  variant?: Variant
  className?: string
  to?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const base = `inline-flex items-center justify-center rounded-full px-7 py-[15px] text-[15px] font-semibold cursor-pointer text-center transition-shadow disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={base}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={base} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
