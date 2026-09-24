import { Suspense } from 'react'
import HistoryPageClient from './HistoryPageClient'

export const metadata = {
  title: 'Histórico — Gorjeta Mira',
  description: 'Consulte o histórico de gorjetas e o resumo semanal por funcionário.',
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    }>
      <HistoryPageClient />
    </Suspense>
  )
}
