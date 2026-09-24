// ============================================================
// Tipos globais da aplicação Gorjeta Mira
// ============================================================

export type AbsencePeriod = 'MORNING' | 'NIGHT' | 'FULL_DAY'

export interface Employee {
  id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Tip {
  id: string
  date: string       // formato ISO: 'YYYY-MM-DD'
  amount: number     // valor em euros (ex: 150.00)
  created_at: string
  updated_at: string
}

export interface Absence {
  id: string
  date: string       // formato ISO: 'YYYY-MM-DD'
  employee_id: string
  period: AbsencePeriod
  created_at: string
  employee?: Employee // relação carregada opcionalmente
}

// ============================================================
// Resultado do cálculo de gorjetas
// ============================================================

export interface ShiftResult {
  total_cents: number          // total do turno em cêntimos
  present_count: number        // nº de funcionários presentes
  per_person_base_cents: number
  remainder_cents: number      // cêntimos extra a distribuir
}

export interface EmployeeTipResult {
  employee: Employee
  morning_cents: number
  night_cents: number
  total_cents: number
}

export interface DayCalculationResult {
  date: string
  total_cents: number
  morning: ShiftResult
  night: ShiftResult
  employees: EmployeeTipResult[]
  // Garantia: sum(employees[*].total_cents) === total_cents
}

// ============================================================
// Inputs do motor de cálculo
// ============================================================

export interface CalculationInput {
  total_amount_cents: number
  employees: Employee[]        // apenas ativos
  absences: Absence[]
}

// ============================================================
// Tipos de formulário / UI
// ============================================================

export interface AbsenceFormData {
  employee_id: string
  period: AbsencePeriod
}

export interface TipFormData {
  date: string
  amount: string
}

// ============================================================
// Resumo semanal
// ============================================================

export interface WeeklyEmployeeSummary {
  employee: Employee
  total_cents: number
  days: {
    date: string
    total_cents: number
  }[]
}

export interface WeeklySummary {
  week_start: string  // segunda-feira
  week_end: string    // domingo
  total_tips_cents: number
  registered_days: number
  employees: WeeklyEmployeeSummary[]
}
