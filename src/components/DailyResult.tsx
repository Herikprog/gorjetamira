import type { DayCalculationResult } from '@/types'
import { formatCents } from '@/lib/tip-calculator'

interface Props {
  result: DayCalculationResult
}

export default function DailyResult({ result }: Props) {
  const { morning, night, employees, total_cents } = result

  const perPersonMorning = morning.present_count > 0
    ? Math.floor(morning.total_cents / morning.present_count)
    : 0

  const perPersonNight = night.present_count > 0
    ? Math.floor(night.total_cents / night.present_count)
    : 0

  return (
    <div className="animate-fade-in">
      {/* Total do dia */}
      <div style={{
        padding: '1.25rem',
        backgroundColor: 'var(--accent-light)',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        borderRadius: 'var(--radius)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.875rem' }}>
          Total das gorjetas
        </span>
        <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent)', letterSpacing: '-0.025em' }}>
          {formatCents(total_cents)}
        </span>
      </div>

      {/* Breakdown por turno */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <ShiftCard
          label="Manhã"
          icon="🌅"
          total={morning.total_cents}
          presentCount={morning.present_count}
          perPerson={perPersonMorning}
          remainder={morning.remainder_cents}
        />
        <ShiftCard
          label="Noite"
          icon="🌙"
          total={night.total_cents}
          presentCount={night.present_count}
          perPerson={perPersonNight}
          remainder={night.remainder_cents}
        />
      </div>

      {/* Resultado por funcionário */}
      <div>
        <h3 style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.75rem',
        }}>
          Resultado por funcionário
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {employees
            .sort((a, b) => b.total_cents - a.total_cents)
            .map((emp, idx) => (
              <div
                key={emp.employee.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  gap: '0.75rem',
                  opacity: emp.total_cents === 0 ? 0.5 : 1,
                }}
              >
                {/* Posição */}
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  minWidth: '1.25rem',
                  textAlign: 'center',
                }}>
                  {emp.total_cents > 0 ? idx + 1 : '—'}
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
                  {emp.employee.name.charAt(0).toUpperCase()}
                </div>

                {/* Nome */}
                <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9375rem' }}>
                  {emp.employee.name}
                </span>

                {/* Detalhes manhã/noite */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}>
                  <span title="Manhã">🌅 {formatCents(emp.morning_cents)}</span>
                  <span title="Noite">🌙 {formatCents(emp.night_cents)}</span>
                </div>

                {/* Total */}
                <span style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: emp.total_cents > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                  minWidth: '5rem',
                  textAlign: 'right',
                }}>
                  {formatCents(emp.total_cents)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function ShiftCard({
  label,
  icon,
  total,
  presentCount,
  perPerson,
  remainder,
}: {
  label: string
  icon: string
  total: number
  presentCount: number
  perPerson: number
  remainder: number
}) {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.125rem' }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.015em' }}>
        {formatCents(total)}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <div>{presentCount} presentes</div>
        {presentCount > 0 && (
          <div>
            {formatCents(perPerson)}/pessoa
            {remainder > 0 && (
              <span style={{ fontSize: '0.75rem' }}> (+{remainder} cênt. extra)</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
