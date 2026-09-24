'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type {
  Tip, Employee, Absence, DayCalculationResult,
  WeeklyEmployeeSummary, WeeklySummary,
} from '@/types'
import { getAllTips } from '@/actions/tips'
import { getActiveEmployees, getEmployees } from '@/actions/employees'
import { getAbsencesForDate, getAbsencesForDateRange } from '@/actions/absences'
import { getTipsForWeek } from '@/actions/tips'
import { calculateDayTips, eurosToCents, formatCents } from '@/lib/tip-calculator'
import {
  formatDate, formatDateShort,
  getCurrentWeekBounds, getWeekBounds, offsetWeek,
} from '@/lib/dates'
import DailyResult from '@/components/DailyResult'
import WeeklySummaryComp from '@/components/WeeklySummary'

type Tab = 'history' | 'weekly'

const PERIOD_LABELS: Record<string, string> = {
  MORNING: 'Manhã',
  NIGHT: 'Noite',
  FULL_DAY: 'Dia inteiro',
}

export default function HistoryPageClient() {
  const [tab, setTab] = useState<Tab>('history')

  // ── Histórico ──────────────────────────────────────────────
  const [tips, setTips] = useState<Tip[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dayResult, setDayResult] = useState<DayCalculationResult | null>(null)
  const [dayAbsences, setDayAbsences] = useState<Absence[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [loadingDay, setLoadingDay] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  // ── Resumo semanal ─────────────────────────────────────────
  const { weekStart: currentStart } = getCurrentWeekBounds()
  const [weekStart, setWeekStart] = useState(currentStart)
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)

  // Carregar lista de gorjetas
  useEffect(() => {
    getAllTips(50).then(data => {
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
      // Para dias históricos, precisamos dos funcionários que estavam ativos NAQUELE dia
      // Como não armazenamos isso, usamos todos os funcionários (ativos + inativos que têm histórico)
      // Por simplicidade do MVP, usamos os ativos atuais
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

  // Carregar resumo semanal
  const loadWeekly = useCallback(async (start: string) => {
    setLoadingWeekly(true)
    setSelectedEmployee(null)
    try {
      const { weekEnd } = getWeekBounds(start)
      const [activeEmps, weekTips, weekAbsences] = await Promise.all([
        getActiveEmployees(),
        getTipsForWeek(start, weekEnd),
        getAbsencesForDateRange(start, weekEnd),
      ])

      const weeklyMap = new Map<string, WeeklyEmployeeSummary>()
      for (const emp of activeEmps) {
        weeklyMap.set(emp.id, { employee: emp, total_cents: 0, days: [] })
      }

      let totalCents = 0
      for (const tip of weekTips) {
        const dayAbsArr = weekAbsences.filter(a => a.date === tip.date)
        const tipCents = eurosToCents(Number(tip.amount))
        totalCents += tipCents
        const result = calculateDayTips({
          total_amount_cents: tipCents,
          employees: activeEmps,
          absences: dayAbsArr,
        })
        for (const empResult of result.employees) {
          const entry = weeklyMap.get(empResult.employee.id)
          if (entry) {
            entry.total_cents += empResult.total_cents
            entry.days.push({ date: tip.date, total_cents: empResult.total_cents })
          }
        }
      }

      const { weekEnd: we } = getWeekBounds(start)
      setWeeklySummary({
        week_start: start,
        week_end: we,
        total_tips_cents: totalCents,
        registered_days: weekTips.length,
        employees: [...weeklyMap.values()],
      })
    } finally {
      setLoadingWeekly(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'weekly') {
      loadWeekly(weekStart)
    }
  }, [tab, weekStart, loadWeekly])

  function handlePrevWeek() {
    setWeekStart(prev => offsetWeek(prev, -1))
  }
  function handleNextWeek() {
    setWeekStart(prev => offsetWeek(prev, 1))
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Histórico</h1>
        <p className="page-subtitle">Consulte os dias registados e o resumo semanal.</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        borderBottom: '2px solid var(--border)',
        marginBottom: '1.75rem',
      }}>
        {(['history', 'weekly'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            id={`tab-${t}`}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              transition: 'all 0.15s ease',
            }}
          >
            {t === 'history' ? 'Histórico diário' : 'Resumo semanal'}
          </button>
        ))}
      </div>

      {/* ── Tab: Histórico ── */}
      {tab === 'history' && (
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

      {/* ── Tab: Resumo semanal ── */}
      {tab === 'weekly' && (
        <div>
          {/* Navegação de semana */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            gap: '1rem',
          }}>
            <button onClick={handlePrevWeek} className="btn btn-secondary" id="prev-week-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Semana anterior
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                {weeklySummary
                  ? `${formatDateShort(weeklySummary.week_start)} — ${formatDateShort(weeklySummary.week_end)}`
                  : '…'
                }
              </div>
            </div>

            <button
              onClick={handleNextWeek}
              className="btn btn-secondary"
              id="next-week-btn"
              disabled={weekStart >= currentStart}
            >
              Próxima semana
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>

          {loadingWeekly ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : weeklySummary ? (
            selectedEmployee ? (
              <EmployeeWeekDetail
                employeeId={selectedEmployee}
                summary={weeklySummary}
                onBack={() => setSelectedEmployee(null)}
              />
            ) : (
              <WeeklySummaryComp
                summary={weeklySummary}
                onEmployeeClick={setSelectedEmployee}
              />
            )
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── Sub-componente: detalhe semanal por funcionário ──────────

function EmployeeWeekDetail({
  employeeId,
  summary,
  onBack,
}: {
  employeeId: string
  summary: WeeklySummary
  onBack: () => void
}) {
  const entry = summary.employees.find(e => e.employee.id === employeeId)
  if (!entry) return null

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn btn-ghost btn-sm" id="back-to-weekly">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1rem',
        }}>
          {entry.employee.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{entry.employee.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {formatDateShort(summary.week_start)} — {formatDateShort(summary.week_end)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.25rem' }}>
        {entry.days.map(day => (
          <div
            key={day.date}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontWeight: 500 }}>{formatDate(day.date)}</span>
            <span style={{ fontWeight: 700 }}>{formatCents(day.total_cents)}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--accent-light)',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Total da semana</span>
        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent)' }}>
          {formatCents(entry.total_cents)}
        </span>
      </div>
    </div>
  )
}
