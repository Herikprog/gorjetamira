'use client'

import { useState } from 'react'
import type { CurrentAccumulationSummary } from '@/types'
import { createSettlement } from '@/actions/settlements'
import { formatCents } from '@/lib/tip-calculator'
import { formatDateShort } from '@/lib/dates'

interface SettleModalProps {
  isOpen: boolean
  onClose: () => void
  summary: CurrentAccumulationSummary
  onSuccess: () => void
}

export default function SettleModal({
  isOpen,
  onClose,
  summary,
  onSuccess,
}: SettleModalProps) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      const res = await createSettlement(paymentDate)
      if (!res.success) {
        setError(res.error || 'Erro ao realizar o fechamento.')
        return
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar o fechamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div className="card animate-fade-in" style={{
        maxWidth: '36rem',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Confirmar fechamento</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Esta ação irá guardar o pagamento no histórico e zerar o saldo atual.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {error && (
          <div className="card card-accent" style={{
            borderColor: 'var(--danger)',
            backgroundColor: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            color: 'var(--danger)',
            padding: '0.875rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.4',
          }}>
            <strong>⚠️ Atenção:</strong> {error}
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {/* Card Resumo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}>
            <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
              <span className="stat-label">Período</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>
                {summary.period_start && summary.period_end
                  ? `${formatDateShort(summary.period_start)} → ${formatDateShort(summary.period_end)}`
                  : '—'}
              </span>
            </div>
            <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
              <span className="stat-label">Dias acumulados</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem', display: 'block', marginTop: '0.25rem' }}>
                {summary.days_count}
              </span>
            </div>
            <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
              <span className="stat-label">Total gorjetas</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--accent)', display: 'block', marginTop: '0.25rem' }}>
                {formatCents(summary.total_tips_cents)}
              </span>
            </div>
          </div>

          {/* Data do Pagamento */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="settle-payment-date">Data do Pagamento</label>
            <input
              id="settle-payment-date"
              type="date"
              className="form-input"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Detalhe por Funcionário */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}>
              Valores a pagar por funcionário
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {summary.employees.map(empSum => (
                <div
                  key={empSum.employee.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{empSum.employee.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      Bruto: {formatCents(empSum.gross_tips_cents)}
                    </span>
                    {empSum.vales_cents > 0 && (
                      <span style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>
                        Vales: -{formatCents(empSum.vales_cents)}
                      </span>
                    )}
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {formatCents(empSum.net_to_pay_cents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1 }}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{
              flex: 1,
              backgroundColor: 'var(--accent)',
              borderColor: 'var(--accent)',
            }}
            disabled={loading}
            id="confirm-settle-btn"
          >
            {loading ? 'A processar…' : 'Confirmar e Zerar'}
          </button>
        </div>
      </div>
    </div>
  )
}
