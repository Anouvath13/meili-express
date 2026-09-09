import type { TFunction } from 'i18next'
import { ApiError } from './api'

// Backend errors carry a machine-readable `code` (added specifically so a
// 3-language UI isn't stuck showing the Thai dev-facing message) — falls
// back to app.errors.generic for anything unmapped.
export function apiErrorMessage(err: unknown, t: TFunction): string {
  if (err instanceof ApiError && err.code) {
    return t(`app.errors.${err.code}`, { defaultValue: t('app.errors.generic') })
  }
  return t('app.errors.generic')
}
