'use client'

import { useState } from 'react'
import type { CurrentAccumulationSummary, Employee } from '@/types'
import { formatCents } from '@/lib/tip-calculator'
import { formatDateShort } from '@/lib/dates'
import ValeModal from './ValeModal'
import SettleModal from './SettleModal'

interface CurrentAccumulationSectionProps {
  initialSummary: CurrentAccumulationSummary
  employees: Employee[]
  onRefresh: () => void
}

export default function CurrentAccumulationSection({
  initialSummary,
  employees,
  onRefresh,
}: CurrentAccumulationSectionProps) {
  const summary = initialSummary
  const [isValeModalOpen, setIsValeModalOpen] = useState(false)
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false)
  const [selectedEmpId, setSelectedEmpId] = useState<string | undefined>(undefined)

  function openValeModalFor(employeeId?: string) {
    setSelectedEmpId(employeeId)
    setIsValeModalOpen(true)
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Cabeçalho da Seção */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div>
          <h2 style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            <span style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              backgroundColor: summary.days_count > 0 ? 'var(--accent)' : 'var(--text-muted)',
              display: 'inline-block',
            }} />
            Gorjetas Atuais (Saldo Acumulado)
          </h2>
          {summary.period_start && summary.period_end ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Período ativo: {formatDateShort(summary.period_start)} — {formatDateShort(summary.period_end)}
            </p>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              Nenhum período ativo. As gorjetas registadas irão acumular aqui.
            </p>
          )}
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => openValeModalFor()}
            className="btn btn-secondary"
            id="open-vale-modal-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Vale de Gorjeta
          </button>

          <button
            onClick={() => setIsSettleModalOpen(true)}
            className="btn btn-primary"
            disabled={summary.days_count === 0}
            id="open-settle-modal-btn"
            style={{
              backgroundColor: 'var(--accent)',
              borderColor: 'var(--accent)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Zerar Gorjetas
          </button>
        </div>
      </div>

      {/* Stats do Acúmulo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card stat-card">
          <span className="stat-label">Dias acumulados</span>
          <span className="stat-value">{summary.days_count}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total gorjetas</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {formatCents(summary.total_tips_cents)}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Vales descontados</span>
          <span className="stat-value" style={{ color: summary.total_vales_cents > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {formatCents(summary.total_vales_cents)}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total a pagar</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {formatCents(summary.total_net_cents)}
          </span>
        </div>
      </div>

      {/* Tabela de Saldo por Funcionário */}
      {summary.employees.length > 0 ? (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <th style={{ padding: '0.875rem 1rem' }}>Funcionário</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Acumulado</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Vales</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>A receber</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center', width: '100px' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {summary.employees.map(empSum => (
                <tr key={empSum.employee.id} style={{
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.9375rem',
                }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        flexShrink: 0,
                      }}>
                        {empSum.employee.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{empSum.employee.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                    {formatCents(empSum.gross_tips_cents)}
                  </td>
                  <td style={{
                    padding: '0.875rem 1rem',
                    textAlign: 'right',
                    color: empSum.vales_cents > 0 ? 'var(--danger)' : 'var(--text-muted)',
                    fontWeight: empSum.vales_cents > 0 ? 600 : 400,
                  }}>
                    {empSum.vales_cents > 0 ? `-${formatCents(empSum.vales_cents)}` : '0,00 €'}
                  </td>
                  <td style={{
                    padding: '0.875rem 1rem',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    color: empSum.net_to_pay_cents > 0 ? 'var(--accent)' : 'var(--text-primary)',
                  }}>
                    {formatCents(empSum.net_to_pay_cents)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => openValeModalFor(empSum.employee.id)}
                      className="btn btn-ghost btn-sm"
                      title="Registar vale para este funcionário"
                    >
                      + Vale
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Nenhum funcionário ativo registado.</p>
        </div>
      )}

      {/* Modals */}
      <ValeModal
        isOpen={isValeModalOpen}
        onClose={() => setIsValeModalOpen(false)}
        employees={employees}
        accumulationSummary={summary}
        onSuccess={onRefresh}
        preselectedEmployeeId={selectedEmpId}
      />

      <SettleModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        summary={summary}
        onSuccess={onRefresh}
      />
    </div>
  )
}
