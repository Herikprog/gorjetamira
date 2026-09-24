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
  settlement_id?: string | null
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

export interface Vale {
  id: string
  employee_id: string
  amount: number     // valor em euros (ex: 50.00)
  date: string       // formato ISO: 'YYYY-MM-DD'
  notes?: string | null
  settlement_id?: string | null
  created_at: string
  employee?: Employee
}

export interface SettlementEmployee {
  id: string
  settlement_id: string
  employee_id: string
  gross_tips_cents: number
  vales_cents: number
  net_paid_cents: number
  created_at: string
  employee?: Employee
}

export interface Settlement {
  id: string
  payment_date: string   // ISO 'YYYY-MM-DD'
  period_start: string   // ISO 'YYYY-MM-DD'
  period_end: string     // ISO 'YYYY-MM-DD'
  total_days: number
  total_tips_cents: number
  total_vales_cents: number
  total_paid_cents: number
  created_at: string
  employees?: SettlementEmployee[]
}

// ============================================================
// Acúmulo Atual (Saldo Atual / Período sem Fechamento)
// ============================================================

export interface EmployeeAccumulationSummary {
  employee: Employee
  gross_tips_cents: number        // gorjeta acumulada total
  vales_cents: number             // vales recebidos no período
  net_to_pay_cents: number        // gross - vales
  available_vales_cents: number   // saldo disponível para novos vales
}

export interface CurrentAccumulationSummary {
  days_count: number
  period_start: string | null
  period_end: string | null
  total_tips_cents: number
  total_vales_cents: number
  total_net_cents: number
  employees: EmployeeAccumulationSummary[]
}

// ============================================================
// Resultado do cálculo de gorjetas diário
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

export interface ValeFormData {
  employee_id: string
  amount: string
  date: string
  notes?: string
}

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
