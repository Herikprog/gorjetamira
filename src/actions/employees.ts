'use server'

import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getActiveEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createEmployee(name: string): Promise<Employee> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('O nome do funcionário é obrigatório.')

  const { data, error } = await supabase
    .from('employees')
    .insert({ name: trimmed, active: true })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/employees')
  revalidatePath('/')
  return data
}

export async function updateEmployee(id: string, name: string): Promise<Employee> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('O nome do funcionário é obrigatório.')

  const { data, error } = await supabase
    .from('employees')
    .update({ name: trimmed })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/employees')
  return data
}

export async function toggleEmployeeStatus(id: string, active: boolean): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update({ active })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/employees')
  revalidatePath('/')
  return data
}
