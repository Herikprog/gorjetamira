'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Employee, Absence, Tip, DayCalculationResult } from '@/types'
import { getTipByDate } from '@/actions/tips'
import { getAbsencesForDate } from '@/actions/absences'
import { getActiveEmployees } from '@/actions/employees'
import { upsertTip } from '@/actions/tips'
import { calculateDayTips, eurosToCents, formatCents } from '@/lib/tip-calculator'
import { todayISO, formatDate } from '@/lib/dates'
import AbsenceForm from '@/components/AbsenceForm'
import DailyResult from '@/components/DailyResult'

export default function TipsPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialDate = searchParams.get('date') ?? todayISO()

  const [date, setDate] = useState(initialDate)
  const [amountStr, setAmountStr] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [tip, setTip] = useState<Tip | null>(null)
  const [result, setResult] = useState<DayCalculationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

  // Carregar dados quando a data muda
  const loadData = useCallback(async (d: string) => {
    setIsLoading(true)
    setResult(null)
    setSaveSuccess(false)
    setSaveError(null)
    try {
      const [emps, tipData, absData] = await Promise.all([
        getActiveEmployees(),
        getTipByDate(d),
        getAbsencesForDate(d),
      ])
      setEmployees(emps)
      setTip(tipData)
      setAbsences(absData)
      if (tipData) {
        setAmountStr(Number(tipData.amount).toFixed(2).replace('.', ','))
      } else {
        setAmountStr('')
      }
    } catch (err) {
      setSaveError('Erro ao carregar dados. Verifique a ligação ao Supabase.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(date)
  }, [date, loadData])

  // Recalcular resultado quando muda o valor ou ausências
  useEffect(() => {
    const cents = parseCents(amountStr)
    if (cents !== null && employees.length > 0) {
      const calc = calculateDayTips({
        total_amount_cents: cents,
        employees,
        absences,
      })
      setResult({ ...calc, date })
    } else {
      setResult(null)
    }
  }, [amountStr, absences, employees, date])

  function parseCents(str: string): number | null {
    if (!str.trim()) return null
    const normalized = str.replace(',', '.').replace(/[^0-9.]/g, '')
    const val = parseFloat(normalized)
    if (isNaN(val) || val < 0) return null
    return eurosToCents(val)
  }

  function validateAmount(): boolean {
    const cents = parseCents(amountStr)
    if (amountStr.trim() === '') {
      setAmountError('O valor das gorjetas é obrigatório.')
      return false
    }
    if (cents === null) {
      setAmountError('Valor inválido. Use o formato 150,00')
      return false
    }
    setAmountError(null)
    return true
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validateAmount()) return

    const cents = parseCents(amountStr)!
    const euros = cents / 100

    startTransition(async () => {
      try {
        const saved = await upsertTip(date, euros)
        setTip(saved)
        setSaveSuccess(true)
        setSaveError(null)
        setTimeout(() => setSaveSuccess(false), 3000)
        // Atualizar URL
        router.replace(`/tips?date=${date}`, { scroll: false })
      } catch (err: unknown) {
        setSaveError((err as Error).message)
      }
    })
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDate(e.target.value)
    router.replace(`/tips?date=${e.target.value}`, { scroll: false })
  }

  const amountCents = parseCents(amountStr) ?? 0

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Gorjetas</h1>
        <p className="page-subtitle">
          Registe as gorjetas e ausências. A divisão é calculada automaticamente.
        </p>
      </div>

      {/* Formulário principal */}
      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Seleção de data */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label" htmlFor="tip-date">Data</label>
            <input
              id="tip-date"
              type="date"
              className="input"
              value={date}
              onChange={handleDateChange}
              max={todayISO()}
            />
          </div>

          {/* Valor das gorjetas */}
          <div>
            <label className="label" htmlFor="tip-amount">
              Gorjetas do dia
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="tip-amount"
                type="text"
                inputMode="decimal"
                className="input"
                value={amountStr}
                onChange={e => {
                  setAmountStr(e.target.value)
                  setAmountError(null)
                }}
                onBlur={validateAmount}
                placeholder="0,00"
                style={{
                  paddingRight: '3rem',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  borderColor: amountError ? 'var(--error)' : undefined,
                }}
              />
              <span style={{
                position: 'absolute',
                right: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                pointerEvents: 'none',
              }}>€</span>
            </div>
            {amountError && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--error)', marginTop: '0.375rem' }}>
                {amountError}
              </p>
            )}
          </div>
        </div>

        {/* Mensagens */}
        {saveSuccess && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--success-light)',
            border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
            </svg>
            Gorjetas de {formatDate(date)} guardadas com sucesso.
          </div>
        )}

        {saveError && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--error-light)',
            border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--error)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}>
            {saveError}
          </div>
        )}

        {/* Botão de guardar */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending || isLoading}
          id="save-tips-btn"
          style={{ width: '100%', justifyContent: 'center', marginBottom: '2rem', padding: '0.875rem' }}
        >
          {isPending ? (
            <>
              <div className="spinner" style={{ width: '1rem', height: '1rem' }} />
              A guardar...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {tip ? 'Atualizar gorjetas' : 'Guardar gorjetas'}
            </>
          )}
        </button>
      </form>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {/* Secção de ausências */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '1.25rem' }}>
              Ausências
            </h2>

            {employees.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                Sem funcionários ativos. Adicione funcionários primeiro.
              </div>
            ) : (
              <AbsenceForm
                date={date}
                employees={employees}
                absences={absences}
                onAbsencesChange={setAbsences}
              />
            )}
          </div>

          {/* Resultado do cálculo */}
          {result && amountCents >= 0 && employees.length > 0 ? (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '1.25rem' }}>
                Resultado
              </h2>
              <DailyResult result={result} />
            </div>
          ) : employees.length === 0 && !isLoading ? (
            <div style={{
              padding: '1.25rem',
              backgroundColor: 'var(--error-light)',
              border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--error)',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}>
              Não existem funcionários ativos para realizar a divisão das gorjetas neste dia.
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
