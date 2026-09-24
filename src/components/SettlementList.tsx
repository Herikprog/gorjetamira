'use client'

import { useState } from 'react'
import type { Settlement } from '@/types'
import { formatCents } from '@/lib/tip-calculator'
import { formatDate } from '@/lib/dates'

interface SettlementListProps {
  settlements: Settlement[]
}

export default function SettlementList({ settlements }: SettlementListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(settlements[0]?.id || null)

  if (settlements.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Nenhum fechamento de pagamento realizado ainda.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {settlements.map((s, idx) => {
        const isExpanded = expandedId === s.id
        const settlementNumber = settlements.length - idx

        return (
          <div key={s.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Header do Fechamento */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isExpanded ? 'var(--accent-light)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s ease',
              }}
              id={`settlement-header-${s.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--accent)',
                }}>
                  #{settlementNumber}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    Pagamento em {formatDate(s.payment_date)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                    Período: {formatDate(s.period_start)} → {formatDate(s.period_end)} ({s.total_days} {s.total_days === 1 ? 'dia' : 'dias'})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--accent)' }}>
                    {formatCents(s.total_paid_cents)}
                  </div>
                  {s.total_vales_cents > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Bruto: {formatCents(s.total_tips_cents)} | Vales: -{formatCents(s.total_vales_cents)}
                    </div>
                  )}
                </div>

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </button>

            {/* Conteúdo Expandido */}
            {isExpanded && (
              <div style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
              }} className="animate-fade-in">
                <h4 style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.875rem',
                }}>
                  Detalhamento dos pagamentos por funcionário
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(s.employees || []).map(emp => (
                    <div
                      key={emp.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.875rem 1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{emp.employee?.name || 'Funcionário'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Gorjeta acumulada: <strong>{formatCents(emp.gross_tips_cents)}</strong>
                        </span>
                        <span style={{ color: emp.vales_cents > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          Vales: <strong>{emp.vales_cents > 0 ? `-${formatCents(emp.vales_cents)}` : '0,00 €'}</strong>
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                          Valor pago: {formatCents(emp.net_paid_cents)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
