// ============================================================
// Motor de cálculo de gorjetas — Gorjeta Mira
//
// Lógica puramente funcional, sem dependências de UI ou BD.
// Trabalha internamente em cêntimos para evitar imprecisões
// de ponto flutuante.
//
// Garantia: sum(result.employees[*].total_cents) === total_amount_cents
// ============================================================

import type {
  CalculationInput,
  DayCalculationResult,
  Employee,
  EmployeeTipResult,
  ShiftResult,
  Absence,
} from '@/types'

/**
 * Converte euros para cêntimos (inteiro).
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

/**
 * Converte cêntimos para euros.
 */
export function centsToEuros(cents: number): number {
  return cents / 100
}

/**
 * Formata cêntimos como string de euros (ex: 1250 → "12,50 €")
 */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

/**
 * Determina se um funcionário está presente num determinado turno.
 *
 * Regra:
 * - Funcionário ativo sem ausência → presente nos dois turnos
 * - MORNING: ausente de manhã, presente à noite
 * - NIGHT: presente de manhã, ausente à noite
 * - FULL_DAY: ausente nos dois turnos
 */
function isPresentInShift(
  employeeId: string,
  shift: 'morning' | 'night',
  absences: Absence[]
): boolean {
  const absence = absences.find(a => a.employee_id === employeeId)
  if (!absence) return true

  if (absence.period === 'FULL_DAY') return false
  if (absence.period === 'MORNING' && shift === 'morning') return false
  if (absence.period === 'NIGHT' && shift === 'night') return false

  return true
}

/**
 * Divide um valor total (em cêntimos) entre N funcionários.
 * Distribui os cêntimos restantes de forma determinística
 * (pelos primeiros na lista).
 *
 * Garante: sum(resultado) === total_cents
 */
function divideAmongEmployees(
  total_cents: number,
  employees: Employee[]
): number[] {
  if (employees.length === 0) return []
  if (total_cents === 0) return employees.map(() => 0)

  const base = Math.floor(total_cents / employees.length)
  const remainder = total_cents % employees.length

  return employees.map((_, index) => base + (index < remainder ? 1 : 0))
}

/**
 * Motor principal de cálculo.
 *
 * @param input - valor total, lista de funcionários ativos, ausências do dia
 * @returns resultado completo do dia por funcionário e por turno
 */
export function calculateDayTips(input: CalculationInput): DayCalculationResult {
  const { total_amount_cents, employees, absences } = input

  // Funcionários ativos (devem ser passados já filtrados, mas refiltramos por segurança)
  const activeEmployees = employees.filter(e => e.active)

  // Dividir gorjetas pelos dois turnos inicialmente
  let morningTotal = Math.floor(total_amount_cents / 2)
  let nightTotal = total_amount_cents - morningTotal // absorve resto de divisão ímpar

  // Presentes em cada turno
  const morningPresent = activeEmployees.filter(e =>
    isPresentInShift(e.id, 'morning', absences)
  )
  const nightPresent = activeEmployees.filter(e =>
    isPresentInShift(e.id, 'night', absences)
  )

  // Distribuir cêntimos por turno
  const morningAmounts = divideAmongEmployees(morningTotal, morningPresent)
  const nightAmounts = divideAmongEmployees(nightTotal, nightPresent)

  // Construir mapa de resultados por funcionário
  const employeeMap = new Map<string, EmployeeTipResult>()

  for (const emp of activeEmployees) {
    employeeMap.set(emp.id, {
      employee: emp,
      morning_cents: 0,
      night_cents: 0,
      total_cents: 0,
    })
  }

  morningPresent.forEach((emp, index) => {
    const result = employeeMap.get(emp.id)!
    result.morning_cents = morningAmounts[index]
  })

  nightPresent.forEach((emp, index) => {
    const result = employeeMap.get(emp.id)!
    result.night_cents = nightAmounts[index]
  })

  // Calcular totais individuais
  const employeeResults: EmployeeTipResult[] = []
  for (const result of employeeMap.values()) {
    result.total_cents = result.morning_cents + result.night_cents
    employeeResults.push(result)
  }

  // Resumo por turno
  const morningShift: ShiftResult = {
    total_cents: morningTotal,
    present_count: morningPresent.length,
    per_person_base_cents: morningPresent.length > 0
      ? Math.floor(morningTotal / morningPresent.length)
      : 0,
    remainder_cents: morningPresent.length > 0
      ? morningTotal % morningPresent.length
      : 0,
  }

  const nightShift: ShiftResult = {
    total_cents: nightTotal,
    present_count: nightPresent.length,
    per_person_base_cents: nightPresent.length > 0
      ? Math.floor(nightTotal / nightPresent.length)
      : 0,
    remainder_cents: nightPresent.length > 0
      ? nightTotal % nightPresent.length
      : 0,
  }

  return {
    date: '',
    total_cents: total_amount_cents,
    morning: morningShift,
    night: nightShift,
    employees: employeeResults,
  }
}
