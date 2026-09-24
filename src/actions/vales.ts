'use server'

import { supabase } from '@/lib/supabase'
import type { Vale } from '@/types'
import { getCurrentAccumulationSummary } from '@/actions/settlements'
import { eurosToCents, formatCents } from '@/lib/tip-calculator'
import { revalidatePath } from 'next/cache'

export async function getAllVales(): Promise<Vale[]> {
  const { data, error } = await supabase
    .from('vales')
    .select('*, employee:employees(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createVale({
  employee_id,
  amount,
  date,
  notes,
}: {
  employee_id: string
  amount: number
  date: string
  notes?: string
}): Promise<Vale> {
  if (!employee_id) throw new Error('Selecione um funcionário.')
  if (!amount || amount <= 0) throw new Error('O valor do vale deve ser superior a zero.')
  if (!date) throw new Error('Selecione uma data para o vale.')

  // 1. Obter saldo acumulado atual
  const summary = await getCurrentAccumulationSummary()
  const empSummary = summary.employees.find(e => e.employee.id === employee_id)

  const availableCents = empSummary ? empSummary.available_vales_cents : 0
  const requestedCents = eurosToCents(amount)

  if (requestedCents > availableCents) {
    const empName = empSummary ? empSummary.employee.name : 'O funcionário'
    throw new Error(
      `${empName} possui apenas ${formatCents(availableCents)} de gorjeta acumulada disponível. Não é possível registar um vale de ${formatCents(requestedCents)}.`
    )
  }

  // 2. Inserir vale no banco de dados
  const { data, error } = await supabase
    .from('vales')
    .insert({
      employee_id,
      amount,
      date,
      notes: notes || null,
      settlement_id: null,
    })
    .select('*, employee:employees(*)')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/vales')
  revalidatePath('/history')
  return data
}

export async function deleteVale(id: string): Promise<void> {
  const { data: vale, error: fErr } = await supabase
    .from('vales')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fErr) throw new Error(fErr.message)
  if (!vale) throw new Error('Vale não encontrado.')
  if (vale.settlement_id) {
    throw new Error('Não é possível apagar um vale referente a um fechamento já realizado.')
  }

  const { error } = await supabase
    .from('vales')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/vales')
  revalidatePath('/history')
}
