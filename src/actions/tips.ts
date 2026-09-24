'use server'

import { supabase } from '@/lib/supabase'
import type { Tip } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getTipByDate(date: string): Promise<Tip | null> {
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .eq('date', date)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function upsertTip(date: string, amount: number): Promise<Tip> {
  if (amount < 0) throw new Error('O valor das gorjetas não pode ser negativo.')

  const { data, error } = await supabase
    .from('tips')
    .upsert(
      { date, amount },
      { onConflict: 'date' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/tips')
  revalidatePath('/history')
  revalidatePath('/')
  return data
}

export async function getUnsettledTips(): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .is('settlement_id', null)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTipsForWeek(weekStart: string, weekEnd: string): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAllTips(limit = 100): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}
