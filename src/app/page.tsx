import Link from 'next/link'
import { getActiveEmployees } from '@/actions/employees'
import { getTipsForWeek } from '@/actions/tips'
import { getAbsencesForDateRange } from '@/actions/absences'
import { calculateDayTips, eurosToCents, formatCents } from '@/lib/tip-calculator'
import { getCurrentWeekBounds, formatDate, formatDateShort } from '@/lib/dates'
import type { WeeklyEmployeeSummary } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { weekStart, weekEnd } = getCurrentWeekBounds()

  const [employees, weekTips, weekAbsences] = await Promise.all([
    getActiveEmployees(),
    getTipsForWeek(weekStart, weekEnd),
    getAbsencesForDateRange(weekStart, weekEnd),
  ])

  // Calcular acumulado da semana por funcionário
  const weeklyMap = new Map<string, WeeklyEmployeeSummary>()
  for (const emp of employees) {
    weeklyMap.set(emp.id, { employee: emp, total_cents: 0, days: [] })
  }

  let totalWeekCents = 0

  for (const tip of weekTips) {
    const dayAbsences = weekAbsences.filter(a => a.date === tip.date)
    const tipCents = eurosToCents(Number(tip.amount))
    totalWeekCents += tipCents

    const result = calculateDayTips({
      total_amount_cents: tipCents,
      employees,
      absences: dayAbsences,
    })

    for (const empResult of result.employees) {
      const entry = weeklyMap.get(empResult.employee.id)
      if (entry) {
        entry.total_cents += empResult.total_cents
        if (empResult.total_cents > 0 || dayAbsences.every(a => a.employee_id !== empResult.employee.id)) {
          entry.days.push({ date: tip.date, total_cents: empResult.total_cents })
        }
      }
    }
  }

  const weeklySummaries = [...weeklyMap.values()]
    .sort((a, b) => b.total_cents - a.total_cents)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Controlo de Gorjetas</h1>
        <p className="page-subtitle">
          Semana {formatDateShort(weekStart)} — {formatDateShort(weekEnd)}
        </p>
      </div>

      {/* Stats da semana */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div className="card stat-card">
          <span className="stat-label">Gorjetas da semana</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {formatCents(totalWeekCents)}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Funcionários ativos</span>
          <span className="stat-value">{employees.length}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Dias registados</span>
          <span className="stat-value">{weekTips.length} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 7</span></span>
        </div>
      </div>

      {/* Botão principal */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href={`/tips?date=${today}`}
          className="btn btn-primary"
          id="register-tips-btn"
          style={{
            padding: '0.875rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 'var(--radius)',
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14"/>
          </svg>
          Registar gorjetas de hoje
        </Link>
      </div>

      {/* Resumo por funcionário */}
      {weeklySummaries.length > 0 && (
        <section>
          <h2 style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}>
            Resumo semanal por funcionário
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {weeklySummaries.map((entry, idx) => (
              <div
                key={entry.employee.id}
                className="card"
                style={{
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  minWidth: '1.25rem',
                  textAlign: 'center',
                }}>
                  {idx + 1}
                </span>
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
                  {entry.employee.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontWeight: 500 }}>{entry.employee.name}</span>
                <span style={{ fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.015em' }}>
                  {formatCents(entry.total_cents)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {employees.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
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
