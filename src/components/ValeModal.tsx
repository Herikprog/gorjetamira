'use client'

import { useState, useEffect } from 'react'
import type { Employee, CurrentAccumulationSummary } from '@/types'
import { createVale } from '@/actions/vales'
import { formatCents, eurosToCents } from '@/lib/tip-calculator'

interface ValeModalProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  accumulationSummary: CurrentAccumulationSummary
  onSuccess: () => void
  preselectedEmployeeId?: string
}

export default function ValeModal({
  isOpen,
  onClose,
  employees,
  accumulationSummary,
  onSuccess,
  preselectedEmployeeId,
}: ValeModalProps) {
  const [employeeId, setEmployeeId] = useState(preselectedEmployeeId || '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (preselectedEmployeeId) {
      setEmployeeId(preselectedEmployeeId)
    } else if (employees.length > 0 && !employeeId) {
      setEmployeeId(employees[0].id)
    }
  }, [preselectedEmployeeId, employees, employeeId])

  if (!isOpen) return null

  const selectedEmpSummary = accumulationSummary.employees.find(e => e.employee.id === employeeId)
  const availableCents = selectedEmpSummary ? selectedEmpSummary.available_vales_cents : 0
  const requestedCents = amount ? eurosToCents(Number(amount)) : 0
  const isOverLimit = requestedCents > availableCents

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) {
      setError('Selecione um funcionário.')
      return
    }
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Introduza um valor válido superior a zero.')
      return
    }

    if (isOverLimit) {
      setError(`O valor de ${formatCents(requestedCents)} excede o saldo disponível de ${formatCents(availableCents)}.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createVale({
        employee_id: employeeId,
        amount: numericAmount,
        date,
        notes,
      })
      setAmount('')
      setNotes('')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registar o vale.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div className="card animate-fade-in" style={{
        maxWidth: '28rem',
        width: '100%',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Vale de Gorjeta</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {error && (
          <div className="card card-accent" style={{
            borderColor: 'var(--danger)',
            backgroundColor: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            color: 'var(--danger)',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Funcionário */}
          <div>
            <label className="form-label" htmlFor="vale-employee-select">Funcionário</label>
            <select
              id="vale-employee-select"
              className="form-input"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              disabled={loading}
              required
            >
              <option value="" disabled>Selecione o funcionário</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Saldo Disponível Badge */}
          {selectedEmpSummary && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: availableCents > 0 ? 'var(--accent-light)' : 'var(--bg-secondary)',
              border: `1px solid ${availableCents > 0 ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Saldo disponível para vale:</span>
              <span style={{
                fontWeight: 700,
                color: availableCents > 0 ? 'var(--accent)' : 'var(--danger)',
              }}>
                {formatCents(availableCents)}
              </span>
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="form-label" htmlFor="vale-amount-input">Valor do vale (€)</label>
            <div style={{ position: 'relative' }}>
              <input
                id="vale-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="form-input"
                style={{ paddingRight: '2rem' }}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={loading}
                required
              />
              <span style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}>
                €
              </span>
            </div>
            {isOverLimit && amount !== '' && (
              <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.375rem', fontWeight: 500 }}>
                ⚠️ O valor introduzido ({formatCents(requestedCents)}) excede o saldo disponível ({formatCents(availableCents)}).
              </p>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="form-label" htmlFor="vale-date-input">Data do vale</label>
            <input
              id="vale-date-input"
              type="date"
              className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Observação */}
          <div>
            <label className="form-label" htmlFor="vale-notes-input">Observação (opcional)</label>
            <input
              id="vale-notes-input"
              type="text"
              placeholder="Ex: Adiantamento"
              className="form-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
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
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading || isOverLimit || !amount}
              id="submit-vale-btn"
            >
              {loading ? 'A guardar…' : 'Registar Vale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
