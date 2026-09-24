'use server'

import { supabase } from '@/lib/supabase'
import type { Vale } from '@/types'
import { getCurrentAccumulationSummary } from '@/actions/settlements'
import { eurosToCents, formatCents } from '@/lib/tip-calculator'
import { revalidatePath } from 'next/cache'

export async function getAllVales(): Promise<Vale[]> {
  try {
    const { data, error } = await supabase
      .from('vales')
      .select('*, employee:employees(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return []
    return data ?? []
  } catch {
    return []
  }
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
}): Promise<{
  success: boolean
  error?: string
  data?: Vale
}> {
  try {
    if (!employee_id) return { success: false, error: 'Selecione um funcionário.' }
    if (!amount || amount <= 0) return { success: false, error: 'O valor do vale deve ser superior a zero.' }
    if (!date) return { success: false, error: 'Selecione uma data para o vale.' }

    const summary = await getCurrentAccumulationSummary()
    const empSummary = summary.employees.find(e => e.employee.id === employee_id)

    const availableCents = empSummary ? empSummary.available_vales_cents : 0
    const requestedCents = eurosToCents(amount)

    if (requestedCents > availableCents) {
      const empName = empSummary ? empSummary.employee.name : 'O funcionário'
      return {
        success: false,
        error: `${empName} possui apenas ${formatCents(availableCents)} de gorjeta acumulada disponível. Não é possível registar um vale de ${formatCents(requestedCents)}.`,
      }
    }

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

    if (error) {
      return {
        success: false,
        error: `Erro no Supabase ao criar vale: ${error.message}. Certifique-se de criar a tabela vales no SQL Editor do Supabase.`,
      }
    }

    revalidatePath('/')
    revalidatePath('/vales')
    revalidatePath('/history')

    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro inesperado ao registar o vale.',
    }
  }
}

export async function deleteVale(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: vale, error: fErr } = await supabase
      .from('vales')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fErr || !vale) return { success: false, error: 'Vale não encontrado.' }
    if (vale.settlement_id) {
      return { success: false, error: 'Não é possível apagar um vale referente a um fechamento já realizado.' }
    }

    const { error } = await supabase
      .from('vales')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    revalidatePath('/vales')
    revalidatePath('/history')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao apagar vale.',
    }
  }
}
