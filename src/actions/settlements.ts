'use server'

import { supabase } from '@/lib/supabase'
import type {
  CurrentAccumulationSummary,
  EmployeeAccumulationSummary,
  Settlement,
  SettlementEmployee,
  Vale,
} from '@/types'
import { getActiveEmployees } from '@/actions/employees'
import { getUnsettledTips } from '@/actions/tips'
import { getAbsencesForDateRange } from '@/actions/absences'
import { calculateDayTips, eurosToCents } from '@/lib/tip-calculator'
import { revalidatePath } from 'next/cache'

export async function getUnsettledVales(): Promise<Vale[]> {
  try {
    const { data, error } = await supabase
      .from('vales')
      .select('*, employee:employees(*)')
      .is('settlement_id', null)
      .order('date', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}

export async function getCurrentAccumulationSummary(): Promise<CurrentAccumulationSummary> {
  const [employees, tips, vales] = await Promise.all([
    getActiveEmployees().catch(() => []),
    getUnsettledTips().catch(() => []),
    getUnsettledVales().catch(() => []),
  ])

  if (tips.length === 0) {
    // Caso não haja gorjetas pendentes de fechamento
    const employeeSummaries: EmployeeAccumulationSummary[] = employees.map(emp => {
      const empVales = vales.filter(v => v.employee_id === emp.id)
      const valesCents = empVales.reduce((acc, v) => acc + eurosToCents(Number(v.amount)), 0)
      return {
        employee: emp,
        gross_tips_cents: 0,
        vales_cents: valesCents,
        net_to_pay_cents: -valesCents,
        available_vales_cents: 0,
      }
    })

    const totalValesCents = vales.reduce((acc, v) => acc + eurosToCents(Number(v.amount)), 0)

    return {
      days_count: 0,
      period_start: null,
      period_end: null,
      total_tips_cents: 0,
      total_vales_cents: totalValesCents,
      total_net_cents: -totalValesCents,
      employees: employeeSummaries,
    }
  }

  const periodStart = tips[0].date
  const periodEnd = tips[tips.length - 1].date

  // Buscar ausências para o intervalo de datas ativas
  const absences = await getAbsencesForDateRange(periodStart, periodEnd).catch(() => [])

  // Mapa de gorjetas brutas por funcionário
  const grossMap = new Map<string, number>()
  for (const emp of employees) {
    grossMap.set(emp.id, 0)
  }

  let totalTipsCents = 0

  for (const tip of tips) {
    const tipCents = eurosToCents(Number(tip.amount))
    totalTipsCents += tipCents

    const dayAbsences = absences.filter(a => a.date === tip.date)
    const result = calculateDayTips({
      total_amount_cents: tipCents,
      employees,
      absences: dayAbsences,
    })

    for (const empRes of result.employees) {
      const current = grossMap.get(empRes.employee.id) ?? 0
      grossMap.set(empRes.employee.id, current + empRes.total_cents)
    }
  }

  // Mapa de vales por funcionário
  const valesMap = new Map<string, number>()
  for (const v of vales) {
    const current = valesMap.get(v.employee_id) ?? 0
    valesMap.set(v.employee_id, current + eurosToCents(Number(v.amount)))
  }

  const totalValesCents = vales.reduce((acc, v) => acc + eurosToCents(Number(v.amount)), 0)

  // Construir resumo por funcionário
  const employeeSummaries: EmployeeAccumulationSummary[] = employees.map(emp => {
    const grossCents = grossMap.get(emp.id) ?? 0
    const valesCents = valesMap.get(emp.id) ?? 0
    const netCents = grossCents - valesCents
    const availableCents = Math.max(0, netCents)

    return {
      employee: emp,
      gross_tips_cents: grossCents,
      vales_cents: valesCents,
      net_to_pay_cents: netCents,
      available_vales_cents: availableCents,
    }
  })

  // Ordenar funcionários por valor bruto decrescente
  employeeSummaries.sort((a, b) => b.gross_tips_cents - a.gross_tips_cents)

  return {
    days_count: tips.length,
    period_start: periodStart,
    period_end: periodEnd,
    total_tips_cents: totalTipsCents,
    total_vales_cents: totalValesCents,
    total_net_cents: totalTipsCents - totalValesCents,
    employees: employeeSummaries,
  }
}

export async function createSettlement(paymentDateStr?: string): Promise<Settlement> {
  const summary = await getCurrentAccumulationSummary()

  if (summary.days_count === 0 || summary.total_tips_cents === 0) {
    throw new Error('Não há gorjetas acumuladas no momento para realizar o fechamento.')
  }

  const paymentDate = paymentDateStr || new Date().toISOString().split('T')[0]

  // 1. Inserir fechamento principal em `settlements`
  const { data: settlement, error: sErr } = await supabase
    .from('settlements')
    .insert({
      payment_date: paymentDate,
      period_start: summary.period_start!,
      period_end: summary.period_end!,
      total_days: summary.days_count,
      total_tips_cents: summary.total_tips_cents,
      total_vales_cents: summary.total_vales_cents,
      total_paid_cents: summary.total_net_cents,
    })
    .select()
    .single()

  if (sErr) {
    if (sErr.message.includes('settlements') || sErr.code === '42P01' || sErr.message.includes('does not exist')) {
      throw new Error('As novas tabelas do banco de dados no Supabase ainda não foram criadas. Execute o script SQL no SQL Editor do seu projeto Supabase.')
    }
    throw new Error(`Erro no Supabase ao criar fechamento: ${sErr.message}`)
  }

  // 2. Inserir detalhamento por funcionário em `settlement_employees`
  const empRows = summary.employees.map(e => ({
    settlement_id: settlement.id,
    employee_id: e.employee.id,
    gross_tips_cents: e.gross_tips_cents,
    vales_cents: e.vales_cents,
    net_paid_cents: e.net_to_pay_cents,
  }))

  const { error: seErr } = await supabase
    .from('settlement_employees')
    .insert(empRows)

  if (seErr) {
    throw new Error(`Erro ao registar funcionários no fechamento: ${seErr.message}`)
  }

  // 3. Marcar todas as gorjetas ativas com o settlement_id
  const { error: tErr } = await supabase
    .from('tips')
    .update({ settlement_id: settlement.id })
    .is('settlement_id', null)

  if (tErr) {
    console.error('Aviso ao atualizar settlement_id em tips:', tErr.message)
  }

  // 4. Marcar todos os vales ativos com o settlement_id
  const { error: vErr } = await supabase
    .from('vales')
    .update({ settlement_id: settlement.id })
    .is('settlement_id', null)

  if (vErr) {
    console.error('Aviso ao atualizar settlement_id em vales:', vErr.message)
  }

  revalidatePath('/')
  revalidatePath('/tips')
  revalidatePath('/history')
  revalidatePath('/vales')

  return settlement
}

export async function getSettlements(): Promise<Settlement[]> {
  try {
    const { data: settlements, error: sErr } = await supabase
      .from('settlements')
      .select('*')
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (sErr || !settlements || settlements.length === 0) return []

    const settlementIds = settlements.map(s => s.id)

    const { data: employees } = await supabase
      .from('settlement_employees')
      .select('*, employee:employees(*)')
      .in('settlement_id', settlementIds)

    const result: Settlement[] = settlements.map(s => {
      const sEmps = (employees ?? []).filter(e => e.settlement_id === s.id) as SettlementEmployee[]
      return {
        ...s,
        employees: sEmps,
      }
    })

    return result
  } catch {
    return []
  }
}

export async function getSettlementById(id: string): Promise<Settlement | null> {
  try {
    const { data: settlement, error: sErr } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (sErr || !settlement) return null

    const { data: employees } = await supabase
      .from('settlement_employees')
      .select('*, employee:employees(*)')
      .eq('settlement_id', id)

    return {
      ...settlement,
      employees: (employees ?? []) as SettlementEmployee[],
    }
  } catch {
    return null
  }
}
