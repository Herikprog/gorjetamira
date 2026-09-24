'use client'

import { useState, useTransition } from 'react'
import type { Employee } from '@/types'
import {
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
} from '@/actions/employees'

interface Props {
  employees: Employee[]
}

export default function EmployeeList({ employees: initialEmployees }: Props) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  function showMessage(msg: string, type: 'success' | 'error') {
    if (type === 'success') {
      setSuccess(msg)
      setError(null)
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(msg)
      setSuccess(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    startTransition(async () => {
      try {
        const created = await createEmployee(newName)
        setEmployees(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName('')
        setShowForm(false)
        showMessage(`Funcionário "${created.name}" adicionado.`, 'success')
      } catch (err: unknown) {
        showMessage((err as Error).message, 'error')
      }
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editingName.trim()) return
    startTransition(async () => {
      try {
        const updated = await updateEmployee(editingId, editingName)
        setEmployees(prev =>
          prev.map(emp => (emp.id === updated.id ? updated : emp))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        setEditingId(null)
        setEditingName('')
        showMessage('Nome atualizado com sucesso.', 'success')
      } catch (err: unknown) {
        showMessage((err as Error).message, 'error')
      }
    })
  }

  async function handleToggle(employee: Employee) {
    const action = employee.active ? 'desativar' : 'ativar'
    if (employee.active && !confirm(`Deseja ${action} "${employee.name}"?`)) return
    startTransition(async () => {
      try {
        const updated = await toggleEmployeeStatus(employee.id, !employee.active)
        setEmployees(prev => prev.map(emp => (emp.id === updated.id ? updated : emp)))
        showMessage(
          `Funcionário "${updated.name}" ${updated.active ? 'ativado' : 'desativado'}.`,
          'success'
        )
      } catch (err: unknown) {
        showMessage((err as Error).message, 'error')
      }
    })
  }

  const active = employees.filter(e => e.active)
  const inactive = employees.filter(e => !e.active)

  return (
    <div className="animate-fade-in">
      {/* Mensagens */}
      {success && (
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
          {success}
        </div>
      )}
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

      {/* Botão adicionar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { setShowForm(o => !o); setError(null) }}
          className="btn btn-primary"
          id="add-employee-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14"/>
          </svg>
          Adicionar funcionário
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="card animate-fade-in" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>
            Novo funcionário
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="label" htmlFor="new-employee-name">Nome</label>
              <input
                id="new-employee-name"
                className="input"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nome do funcionário"
                required
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending || !newName.trim()}
                id="create-employee-submit"
              >
                {isPending ? 'A guardar...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewName(''); setError(null) }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de funcionários ativos */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.75rem',
        }}>
          Ativos ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum funcionário ativo. Adicione um funcionário para começar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {active.map(emp => (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                isEditing={editingId === emp.id}
                editingName={editingName}
                onEditStart={() => { setEditingId(emp.id); setEditingName(emp.name) }}
                onEditCancel={() => { setEditingId(null); setEditingName('') }}
                onEditSubmit={handleUpdate}
                onEditNameChange={setEditingName}
                onToggle={() => handleToggle(emp)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Lista de funcionários inativos */}
      {inactive.length > 0 && (
        <section>
          <h2 style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}>
            Inativos ({inactive.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {inactive.map(emp => (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                isEditing={editingId === emp.id}
                editingName={editingName}
                onEditStart={() => { setEditingId(emp.id); setEditingName(emp.name) }}
                onEditCancel={() => { setEditingId(null); setEditingName('') }}
                onEditSubmit={handleUpdate}
                onEditNameChange={setEditingName}
                onToggle={() => handleToggle(emp)}
                isPending={isPending}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ============================================================
// Sub-componente: linha de funcionário
// ============================================================

interface RowProps {
  employee: Employee
  isEditing: boolean
  editingName: string
  onEditStart: () => void
  onEditCancel: () => void
  onEditSubmit: (e: React.FormEvent) => void
  onEditNameChange: (name: string) => void
  onToggle: () => void
  isPending: boolean
}

function EmployeeRow({
  employee,
  isEditing,
  editingName,
  onEditStart,
  onEditCancel,
  onEditSubmit,
  onEditNameChange,
  onToggle,
  isPending,
}: RowProps) {
  return (
    <div className="card animate-slide-in" style={{
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      opacity: employee.active ? 1 : 0.6,
    }}>
      {/* Avatar inicial */}
      <div style={{
        width: '2.25rem',
        height: '2.25rem',
        borderRadius: '50%',
        backgroundColor: employee.active ? 'var(--accent-light)' : 'var(--bg-muted)',
        color: employee.active ? 'var(--accent)' : 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.875rem',
        flexShrink: 0,
      }}>
        {employee.name.charAt(0).toUpperCase()}
      </div>

      {/* Nome / editor */}
      <div style={{ flex: 1 }}>
        {isEditing ? (
          <form onSubmit={onEditSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="input"
              style={{ maxWidth: '220px' }}
              value={editingName}
              onChange={e => onEditNameChange(e.target.value)}
              autoFocus
              required
              id={`edit-employee-${employee.id}`}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isPending}
            >
              Guardar
            </button>
            <button type="button" onClick={onEditCancel} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
          </form>
        ) : (
          <div>
            <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{employee.name}</span>
          </div>
        )}
      </div>

      {/* Badge de estado */}
      {!isEditing && (
        <span className={`badge ${employee.active ? 'badge-success' : 'badge-muted'}`}>
          {employee.active ? 'Ativo' : 'Inativo'}
        </span>
      )}

      {/* Ações */}
      {!isEditing && (
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          <button
            onClick={onEditStart}
            className="btn btn-ghost btn-sm"
            title="Editar nome"
            id={`edit-btn-${employee.id}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="btn btn-ghost btn-sm"
            disabled={isPending}
            title={employee.active ? 'Desativar' : 'Ativar'}
            id={`toggle-btn-${employee.id}`}
          >
            {employee.active ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
