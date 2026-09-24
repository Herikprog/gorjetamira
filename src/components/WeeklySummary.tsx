import type { WeeklySummary } from '@/types'
import { formatCents } from '@/lib/tip-calculator'

interface Props {
  summary: WeeklySummary
  onEmployeeClick?: (employeeId: string) => void
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatDateShort(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export default function WeeklySummary({ summary, onEmployeeClick }: Props) {
  const { week_start, week_end, total_tips_cents, registered_days, employees } = summary

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho da semana */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card stat-card">
          <span className="stat-label">Total da semana</span>
          <span className="stat-value-sm" style={{ color: 'var(--accent)' }}>
            {formatCents(total_tips_cents)}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Dias registados</span>
          <span className="stat-value-sm">{registered_days} / 7</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Período</span>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {formatDateShort(week_start)} — {formatDateShort(week_end)}
          </span>
        </div>
      </div>

      {/* Tabela por funcionário */}
      {employees.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Sem dados para esta semana.
        </div>
      ) : (
        <div>
          <h3 style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}>
            Total por funcionário
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {employees
              .sort((a, b) => b.total_cents - a.total_cents)
              .map((entry, idx) => (
                <button
                  key={entry.employee.id}
                  onClick={() => onEmployeeClick?.(entry.employee.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.875rem 1rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '0.75rem',
                    cursor: onEmployeeClick ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  className={onEmployeeClick ? 'card' : ''}
                  id={`weekly-emp-${entry.employee.id}`}
                >
                  {/* Posição */}
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    minWidth: '1.25rem',
                    textAlign: 'center',
                  }}>
                    {idx + 1}
                  </span>

                  {/* Avatar */}
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

                  {/* Nome + dias */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                      {entry.employee.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {entry.days.length} dia{entry.days.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Total */}
                  <span style={{
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em',
                  }}>
                    {formatCents(entry.total_cents)}
                  </span>

                  {onEmployeeClick && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
