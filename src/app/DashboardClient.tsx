'use client'

import Link from 'next/link'
import type { CurrentAccumulationSummary, Employee, Settlement } from '@/types'
import CurrentAccumulationSection from '@/components/CurrentAccumulationSection'
import SettlementList from '@/components/SettlementList'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  summary: CurrentAccumulationSummary
  employees: Employee[]
  settlements: Settlement[]
}

export default function DashboardClient({
  summary,
  employees,
  settlements,
}: DashboardClientProps) {
  const router = useRouter()

  function handleRefresh() {
    router.refresh()
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Controlo de Gorjetas</h1>
        <p className="page-subtitle">
          Acúmulo de gorjetas, adiantamentos e pagamentos dos funcionários.
        </p>
      </div>

      {/* Seção principal: Gorjetas Atuais (Saldo Acumulado) */}
      <CurrentAccumulationSection
        initialSummary={summary}
        employees={employees}
        onRefresh={handleRefresh}
      />

      {/* Botão de Atalho para Registar Gorjeta */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link
          href="/tips"
          className="btn btn-secondary"
          id="register-tips-btn"
          style={{
            padding: '0.875rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 'var(--radius)',
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14"/>
          </svg>
          Registar gorjeta ou ausências de um dia
        </Link>
      </div>

      {/* Seção de Histórico de Pagamentos (Fechamentos) */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <h2 style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Histórico de Pagamentos (Fechamentos)
          </h2>
          <Link href="/history" style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Ver todo o histórico →
          </Link>
        </div>

        <SettlementList settlements={settlements.slice(0, 5)} />
      </section>

      {employees.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
          <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Bem-vindo ao Gorjeta Mira!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Comece por adicionar os seus funcionários para poder registar e distribuir gorjetas.
          </p>
          <Link href="/employees" className="btn btn-primary" id="go-to-employees">
            Gerir funcionários
          </Link>
        </div>
      )}
    </div>
  )
}
