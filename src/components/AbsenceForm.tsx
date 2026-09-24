'use client'

import { useState, useTransition } from 'react'
import type { Employee, Absence, AbsencePeriod } from '@/types'
import { createAbsence, deleteAbsence } from '@/actions/absences'

interface Props {
  date: string
  employees: Employee[]          // funcionários ativos
  absences: Absence[]
  onAbsencesChange: (absences: Absence[]) => void
}

const PERIOD_LABELS: Record<AbsencePeriod, string> = {
  MORNING: 'Manhã',
  NIGHT: 'Noite',
  FULL_DAY: 'Dia inteiro',
}

export default function AbsenceForm({ date, employees, absences, onAbsencesChange }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<AbsencePeriod>('MORNING')
  const [error, setError] = useState<string | null>(null)

  // Funcionários que ainda não têm ausência registada neste dia
  const availableEmployees = employees.filter(
    emp => !absences.some(a => a.employee_id === emp.id)
  )

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEmployee) return
    setError(null)

    startTransition(async () => {
      try {
        const created = await createAbsence(date, selectedEmployee, selectedPeriod)
        onAbsencesChange([...absences, created])
        setSelectedEmployee('')
        setSelectedPeriod('MORNING')
        setShowAdd(false)
      } catch (err: unknown) {
        setError((err as Error).message)
      }
    })
  }

  async function handleDelete(absenceId: string) {
    startTransition(async () => {
      try {
        await deleteAbsence(absenceId)
        onAbsencesChange(absences.filter(a => a.id !== absenceId))
        setError(null)
      } catch (err: unknown) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <div>
      {/* Aviso principal */}
      <div className="alert-info" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span>
            Todos os funcionários ativos são considerados <strong>presentes automaticamente</strong>.
            Registe apenas as ausências.
          </span>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--error-light)',
          border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--error)',
          fontSize: '0.875rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {/* Lista de ausências existentes */}
      {absences.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {absences.map(absence => (
            <div
              key={absence.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--warning-light)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  flexShrink: 0,
                }}>
                  {(absence.employee?.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                    {absence.employee?.name ?? 'Funcionário'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {PERIOD_LABELS[absence.period]}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(absence.id)}
                className="btn btn-danger btn-sm"
                disabled={isPending}
                id={`remove-absence-${absence.id}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de adição */}
      {showAdd ? (
        <form
          onSubmit={handleAdd}
          className="card animate-fade-in"
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <label className="label" htmlFor="absence-employee">Funcionário</label>
              <select
                id="absence-employee"
                className="input select"
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                required
              >
                <option value="">Selecionar...</option>
                {availableEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '140px' }}>
              <label className="label" htmlFor="absence-period">Período</label>
              <select
                id="absence-period"
                className="input select"
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value as AbsencePeriod)}
              >
                <option value="MORNING">Manhã</option>
                <option value="NIGHT">Noite</option>
                <option value="FULL_DAY">Dia inteiro</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || !selectedEmployee}
              id="add-absence-submit"
            >
              {isPending ? 'A guardar...' : 'Adicionar ausência'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setShowAdd(false); setError(null) }}
            >
              Cancelar
            </button>
          </div>

          {availableEmployees.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Todos os funcionários ativos já têm ausência registada neste dia.
            </p>
          )}
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="btn btn-secondary"
          disabled={availableEmployees.length === 0}
          id="add-absence-btn"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14"/>
          </svg>
          {availableEmployees.length === 0 && absences.length > 0
            ? 'Todos os funcionários com ausência registada'
            : '+ Adicionar ausência'
          }
        </button>
      )}
    </div>
  )
}
