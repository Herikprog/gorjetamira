'use server'

import { supabase } from '@/lib/supabase'
import type { Absence, AbsencePeriod } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getAbsencesForDate(date: string): Promise<Absence[]> {
  const { data, error } = await supabase
    .from('absences')
    .select('*, employee:employees(*)')
    .eq('date', date)

  if (error) throw new Error(error.message)
  return (data ?? []) as Absence[]
}

export async function getAbsencesForDateRange(
  startDate: string,
  endDate: string
): Promise<Absence[]> {
  const { data, error } = await supabase
    .from('absences')
    .select('*, employee:employees(*)')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw new Error(error.message)
  return (data ?? []) as Absence[]
}

export async function createAbsence(
  date: string,
  employeeId: string,
  period: AbsencePeriod
): Promise<Absence> {
  // Verificar se já existe ausência para este funcionário neste dia
  const { data: existing } = await supabase
    .from('absences')
    .select('id')
    .eq('date', date)
    .eq('employee_id', employeeId)
    .maybeSingle()

  if (existing) {
    throw new Error('Este funcionário já tem uma ausência registada neste dia.')
  }

  const { data, error } = await supabase
    .from('absences')
    .insert({ date, employee_id: employeeId, period })
    .select('*, employee:employees(*)')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/tips')
  revalidatePath('/history')
  return data as Absence
}

export async function deleteAbsence(id: string): Promise<void> {
  const { error } = await supabase
    .from('absences')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/tips')
  revalidatePath('/history')
}
