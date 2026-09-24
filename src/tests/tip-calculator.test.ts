import { describe, it, expect } from 'vitest'
import { calculateDayTips, eurosToCents } from '@/lib/tip-calculator'
import type { Employee, Absence } from '@/types'

// ============================================================
// Helpers para criar dados de teste
// ============================================================

function makeEmployee(id: string, name: string, active = true): Employee {
  return { id, name, active, created_at: '', updated_at: '' }
}

function makeAbsence(
  employeeId: string,
  period: 'MORNING' | 'NIGHT' | 'FULL_DAY'
): Absence {
  return {
    id: `absence-${employeeId}-${period}`,
    date: '2026-09-22',
    employee_id: employeeId,
    period,
    created_at: '',
  }
}

const employees5 = [
  makeEmployee('emp-1', 'João'),
  makeEmployee('emp-2', 'Maria'),
  makeEmployee('emp-3', 'Pedro'),
  makeEmployee('emp-4', 'Ana'),
  makeEmployee('emp-5', 'Carlos'),
]

// ============================================================
// Testes
// ============================================================

describe('Motor de cálculo de gorjetas', () => {
  // Teste 1: Todos os funcionários presentes
  it('1. Todos os funcionários presentes — 100 € / 5 funcionários = 20 € cada', () => {
    const result = calculateDayTips({
      total_amount_cents: eurosToCents(100),
      employees: employees5,
      absences: [],
    })

    expect(result.employees).toHaveLength(5)
    result.employees.forEach(e => {
      expect(e.total_cents).toBe(2000) // 20,00 €
    })

    // Integridade: soma total
    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(eurosToCents(100))
  })

  // Teste 2: Ausência de manhã
  it('2. João ausente de manhã — 100 €', () => {
    const result = calculateDayTips({
      total_amount_cents: eurosToCents(100),
      employees: employees5,
      absences: [makeAbsence('emp-1', 'MORNING')],
    })

    const joao = result.employees.find(e => e.employee.id === 'emp-1')!
    // Manhã: 50 € / 4 = 12,50 € → João não participa
    // Noite: 50 € / 5 = 10 € → João participa
    expect(joao.morning_cents).toBe(0)
    expect(joao.night_cents).toBe(1000) // 10 €
    expect(joao.total_cents).toBe(1000) // 10 €

    const outros = result.employees.filter(e => e.employee.id !== 'emp-1')
    outros.forEach(e => {
      expect(e.total_cents).toBe(2250) // 22,50 €
    })

    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(eurosToCents(100))
  })

  // Teste 3: Ausência à noite
  it('3. João ausente à noite — 100 €', () => {
    const result = calculateDayTips({
      total_amount_cents: eurosToCents(100),
      employees: employees5,
      absences: [makeAbsence('emp-1', 'NIGHT')],
    })

    const joao = result.employees.find(e => e.employee.id === 'emp-1')!
    // Manhã: 50 € / 5 = 10 € → João participa
    // Noite: 50 € / 4 = 12,50 € → João não participa
    expect(joao.morning_cents).toBe(1000) // 10 €
    expect(joao.night_cents).toBe(0)
    expect(joao.total_cents).toBe(1000) // 10 €

    const outros = result.employees.filter(e => e.employee.id !== 'emp-1')
    outros.forEach(e => {
      expect(e.total_cents).toBe(2250) // 22,50 €
    })

    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(eurosToCents(100))
  })

  // Teste 4: Ausência de dia inteiro
  it('4. Pedro ausente dia inteiro — 100 €', () => {
    const result = calculateDayTips({
      total_amount_cents: eurosToCents(100),
      employees: employees5,
      absences: [makeAbsence('emp-3', 'FULL_DAY')],
    })

    const pedro = result.employees.find(e => e.employee.id === 'emp-3')!
    expect(pedro.total_cents).toBe(0)

    const outros = result.employees.filter(e => e.employee.id !== 'emp-3')
    outros.forEach(e => {
      expect(e.total_cents).toBe(2500) // 25 €
    })

    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(eurosToCents(100))
  })

  // Teste 5: Vários funcionários com diferentes ausências
  it('5. João ausente de manhã, Pedro ausente de dia inteiro — 150 €', () => {
    // Exemplo do enunciado: 150€, João MORNING, Pedro FULL_DAY
    // Manhã: 75€ / 4 = 18,75€ (João e Pedro ausentes de manhã)
    // Noite: 75€ / 4 = 18,75€ (Pedro ausente)
    // João: 0 + 18,75 = 18,75€
    // Pedro: 0
    // Outros 3: 18,75 + 18,75 = 37,50€ cada

    const result = calculateDayTips({
      total_amount_cents: eurosToCents(150),
      employees: employees5,
      absences: [
        makeAbsence('emp-1', 'MORNING'),
        makeAbsence('emp-3', 'FULL_DAY'),
      ],
    })

    const joao = result.employees.find(e => e.employee.id === 'emp-1')!
    const pedro = result.employees.find(e => e.employee.id === 'emp-3')!

    // Manhã: 75€ / 3 (Maria, Ana, Carlos) = 25€ cada
    // Noite: 75€ / 4 (João, Maria, Ana, Carlos) = 18,75€ cada
    expect(joao.morning_cents).toBe(0)
    expect(joao.night_cents).toBe(1875)  // 18,75€
    expect(joao.total_cents).toBe(1875)

    expect(pedro.morning_cents).toBe(0)
    expect(pedro.night_cents).toBe(0)
    expect(pedro.total_cents).toBe(0)

    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(eurosToCents(150))
  })

  // Teste 6: Gorjeta igual a zero
  it('6. Gorjeta zero — todos recebem 0 €', () => {
    const result = calculateDayTips({
      total_amount_cents: 0,
      employees: employees5,
      absences: [],
    })

    result.employees.forEach(e => {
      expect(e.total_cents).toBe(0)
    })

    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(0)
  })

  // Teste 7: Apenas um funcionário presente
  it('7. Apenas um funcionário ativo — recebe tudo', () => {
    const [only] = [makeEmployee('solo', 'Solo')]
    const result = calculateDayTips({
      total_amount_cents: eurosToCents(50),
      employees: [only],
      absences: [],
    })

    expect(result.employees[0].total_cents).toBe(eurosToCents(50))
    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(eurosToCents(50))
  })

  // Teste 8: Divisão com arredondamento (100 € / 3 funcionários)
  it('8. Arredondamento — 100 € / 3 = 33,34 + 33,33 + 33,33', () => {
    const three = [
      makeEmployee('a', 'A'),
      makeEmployee('b', 'B'),
      makeEmployee('c', 'C'),
    ]
    const result = calculateDayTips({
      total_amount_cents: eurosToCents(100),
      employees: three,
      absences: [],
    })

    // Manhã: 5000 / 3 = 1666 base + 2 cêntimos extra
    // Noite: 5000 / 3 = 1666 base + 2 cêntimos extra
    // A (index 0): 1667 + 1667 = 3334 = 33,34€
    // B (index 1): 1667 + 1667 = 3334 = 33,34€
    // C (index 2): 1666 + 1666 = 3332 = 33,32€
    // Total: 3334 + 3334 + 3332 = 10000 ✓

    const totals = result.employees.map(e => e.total_cents)
    const sum = totals.reduce((a, b) => a + b, 0)
    expect(sum).toBe(10000) // 100,00€ em cêntimos
  })

  // Teste 9: Integridade da soma em vários cenários
  it('9. Soma sempre igual ao total — cenário complexo com vários ausentes', () => {
    const sixEmployees = [
      makeEmployee('e1', 'Ana'),
      makeEmployee('e2', 'Bruno'),
      makeEmployee('e3', 'Carla'),
      makeEmployee('e4', 'Daniel'),
      makeEmployee('e5', 'Eva'),
      makeEmployee('e6', 'Filipe'),
    ]

    const absences: Absence[] = [
      makeAbsence('e1', 'MORNING'),
      makeAbsence('e3', 'FULL_DAY'),
      makeAbsence('e5', 'NIGHT'),
    ]

    const total = eurosToCents(177.33) // valor irregular para testar arredondamento
    const result = calculateDayTips({
      total_amount_cents: total,
      employees: sixEmployees,
      absences,
    })

    const sum = result.employees.reduce((acc, e) => acc + e.total_cents, 0)
    expect(sum).toBe(total)
  })
})
