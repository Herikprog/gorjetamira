'use client'

import { useState } from 'react'
import type { Vale, Employee, CurrentAccumulationSummary } from '@/types'
import { deleteVale } from '@/actions/vales'
import { formatCents } from '@/lib/tip-calculator'
import { formatDate } from '@/lib/dates'
import ValeModal from '@/components/ValeModal'
import { useRouter } from 'next/navigation'

interface ValesPageClientProps {
  initialVales: Vale[]
  employees: Employee[]
  summary: CurrentAccumulationSummary
}

export default function ValesPageClient({
  initialVales,
  employees,
  summary,
}: ValesPageClientProps) {
  const router = useRouter()
  const [vales, setVales] = useState<Vale[]>(initialVales)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleRefresh() {
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem a certeza que deseja cancelar/apagar este vale?')) return

    setDeletingId(id)
    setError(null)
    try {
      await deleteVale(id)
      setVales(prev => prev.filter(v => v.id !== id))
      handleRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao apagar vale.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredVales = vales.filter(v => {
    if (filterEmployeeId !== 'all' && v.employee_id !== filterEmployeeId) return false
    return true
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Vales de Gorjeta</h1>
          <p className="page-subtitle">
            Registo e consulta de adiantamentos efetuados aos funcionários.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          id="new-vale-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registar Vale
        </button>
      </div>

      {error && (
        <div className="card card-accent" style={{
          borderColor: 'var(--danger)',
          backgroundColor: 'color-mix(in srgb, var(--danger) 10%, transparent)',
          color: 'var(--danger)',
          padding: '0.875rem',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ width: '220px' }}>
          <label className="form-label" htmlFor="filter-employee">Filtrar por funcionário</label>
          <select
            id="filter-employee"
            className="form-input"
            value={filterEmployeeId}
            onChange={e => setFilterEmployeeId(e.target.value)}
          >
            <option value="all">Todos os funcionários</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Vales */}
      {filteredVales.length > 0 ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <th style={{ padding: '0.875rem 1rem' }}>Data</th>
                <th style={{ padding: '0.875rem 1rem' }}>Funcionário</th>
                <th style={{ padding: '0.875rem 1rem' }}>Observação</th>
                <th style={{ padding: '0.875rem 1rem' }}>Estado</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'center', width: '80px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVales.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9375rem' }}>
                  <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                    {formatDate(v.date)}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    {v.employee?.name || 'Funcionário'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                    {v.notes || '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {v.settlement_id ? (
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}>
                        Fechado no pagamento
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                      }}>
                        Pendente de fechamento
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                    -{formatCents(Math.round(Number(v.amount) * 100))}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                    {!v.settlement_id && (
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        disabled={deletingId === v.id}
                        title="Cancelar vale"
                      >
                        {deletingId === v.id ? '…' : 'Apagar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Nenhum vale registado no momento.</p>
        </div>
      )}

      {/* Modal de Criação de Vale */}
      <ValeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        accumulationSummary={summary}
        onSuccess={() => {
          handleRefresh()
        }}
      />
    </div>
  )
}
