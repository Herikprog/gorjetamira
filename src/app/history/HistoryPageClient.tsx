'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type {
  Tip, Employee, Absence, DayCalculationResult, Settlement,
} from '@/types'
import { getAllTips } from '@/actions/tips'
import { getActiveEmployees, getEmployees } from '@/actions/employees'
import { getAbsencesForDate } from '@/actions/absences'
import { getSettlements } from '@/actions/settlements'
import { calculateDayTips, eurosToCents, formatCents } from '@/lib/tip-calculator'
import { formatDate } from '@/lib/dates'
import DailyResult from '@/components/DailyResult'
import SettlementList from '@/components/SettlementList'

type Tab = 'settlements' | 'daily'

const PERIOD_LABELS: Record<string, string> = {
  MORNING: 'Manhã',
  NIGHT: 'Noite',
  FULL_DAY: 'Dia inteiro',
}

export default function HistoryPageClient() {
  const [tab, setTab] = useState<Tab>('settlements')

  // ── Fechamentos (Pagamentos) ──────────────────────────────────────────────
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loadingSettlements, setLoadingSettlements] = useState(true)

  // ── Dias Registados ──────────────────────────────────────────────
  const [tips, setTips] = useState<Tip[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dayResult, setDayResult] = useState<DayCalculationResult | null>(null)
  const [dayAbsences, setDayAbsences] = useState<Absence[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loadingDay, setLoadingDay] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  // Carregar Fechamentos
  useEffect(() => {
    getSettlements()
      .then(data => setSettlements(data))
      .finally(() => setLoadingSettlements(false))
  }, [])

  // Carregar lista de gorjetas diárias
  useEffect(() => {
    getAllTips(100).then(data => {
      setTips(data)
      setLoadingList(false)
    })
    getEmployees().then(setAllEmployees)
  }, [])

  // Carregar detalhe de um dia
  const loadDay = useCallback(async (date: string) => {
    setLoadingDay(true)
    setSelectedDay(date)
    try {
      const [activeEmps, absData] = await Promise.all([
        getActiveEmployees(),
        getAbsencesForDate(date),
      ])
      const tip = tips.find(t => t.date === date)
      if (!tip) { setLoadingDay(false); return }

      const absWithEmp = absData.map(a => ({
        ...a,
        employee: allEmployees.find(e => e.id === a.employee_id),
      })) as Absence[]

      setDayAbsences(absWithEmp)

      const tipCents = eurosToCents(Number(tip.amount))
      const result = calculateDayTips({
        total_amount_cents: tipCents,
        employees: activeEmps,
        absences: absData,
      })
      setDayResult({ ...result, date })
    } finally {
      setLoadingDay(false)
    }
  }, [tips, allEmployees])

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Histórico</h1>
        <p className="page-subtitle">Consulte o histórico de fechamentos de pagamentos e dias registados.</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        borderBottom: '2px solid var(--border)',
        marginBottom: '1.75rem',
      }}>
        {(['settlements', 'daily'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            id={`tab-${t}`}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              transition: 'all 0.15s ease',
            }}
          >
            {t === 'settlements' ? 'Pagamentos (Fechamentos)' : 'Dias Registados'}
          </button>
        ))}
      </div>

      {/* ── Tab: Pagamentos (Fechamentos) ── */}
      {tab === 'settlements' && (
        <div>
          {loadingSettlements ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <SettlementList settlements={settlements} />
          )}
        </div>
      )}

      {/* ── Tab: Dias Registados ── */}
      {tab === 'daily' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Lista de dias */}
          <div>
            {loadingList ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : tips.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>Nenhum dia registado ainda.</p>
                <Link href="/tips" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Registar gorjetas
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {tips.map(tip => (
                  <button
                    key={tip.id}
                    onClick={() => loadDay(tip.date)}
                    id={`history-day-${tip.date}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      backgroundColor: selectedDay === tip.date ? 'var(--accent-light)' : 'var(--bg-card)',
                      border: `1px solid ${selectedDay === tip.date ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {formatDate(tip.date)}
                      </div>
                      {tip.settlement_id && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          ✓ Fechamento realizado
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '1.0625rem',
                        color: selectedDay === tip.date ? 'var(--accent)' : 'var(--text-primary)',
                      }}>
                        {formatCents(eurosToCents(Number(tip.amount)))}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalhe do dia selecionado */}
          {selectedDay && (
            <div className="animate-fade-in">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  {formatDate(selectedDay)}
                </h2>
                <button
                  onClick={() => { setSelectedDay(null); setDayResult(null) }}
                  className="btn btn-ghost btn-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {loadingDay ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : dayResult ? (
                <>
                  {dayAbsences.length > 0 && (
                    <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem',
                      }}>
                        Ausências
                      </div>
                      {dayAbsences.map(a => (
                        <div key={a.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.875rem',
                          padding: '0.25rem 0',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <span>{a.employee?.name ?? 'Funcionário'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{PERIOD_LABELS[a.period]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <DailyResult result={dayResult} />
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
