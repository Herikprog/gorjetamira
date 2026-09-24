import { Suspense } from 'react'
import TipsPageClient from './TipsPageClient'

export const metadata = {
  title: 'Gorjetas — Gorjeta Mira',
  description: 'Registar gorjetas diárias e ausências de funcionários.',
}

export default function TipsPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    }>
      <TipsPageClient />
    </Suspense>
  )
}
