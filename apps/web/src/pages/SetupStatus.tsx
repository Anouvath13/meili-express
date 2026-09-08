import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'

type HealthResponse = { ok: boolean; service: string }

export default function SetupStatus() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResponse>('/api/health'),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6">
      <div className="max-w-md w-full bg-white rounded-card-lg shadow-lg p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mb-6">
          <span className="text-brand-600 font-bold text-xl font-mono">M</span>
        </div>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">MEILI EXPRESS</h1>
        <p className="mt-2 text-sm text-ink-400 font-mono tracking-wide">PROJECT SCAFFOLD · STEP 1</p>

        <div className="mt-8 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
             style={{
               background: isError ? '#FFFBFA' : isLoading ? '#f2f2f4' : '#ECFDF3',
               color: isError ? '#B42318' : isLoading ? '#6b6d73' : '#027A48',
             }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'currentColor' }} />
          {isLoading && 'Connecting to API…'}
          {isError && 'API unreachable — is `npm run dev:api` running?'}
          {data && `API OK — ${data.service}`}
        </div>

        <p className="mt-6 text-xs text-ink-300 leading-relaxed">
          Public / Customer Zone / Admin Console routes land in later batches.
        </p>
      </div>
    </div>
  )
}
