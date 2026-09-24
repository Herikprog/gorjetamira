// ============================================================
// Utilitários de datas — Gorjeta Mira
// ============================================================

/**
 * Formata uma data ISO (YYYY-MM-DD) para exibição pt-PT (DD/MM/YYYY)
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Formata uma data ISO curta (DD/MM)
 */
export function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

/**
 * Retorna hoje em formato ISO (YYYY-MM-DD) no fuso local
 */
export function todayISO(): string {
  const now = new Date()
  return toLocalISO(now)
}

/**
 * Converte um Date para string ISO local (YYYY-MM-DD)
 */
export function toLocalISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Retorna o início (segunda) e fim (domingo) da semana para uma data dada.
 */
export function getWeekBounds(dateStr: string): { weekStart: string; weekEnd: string } {
  const date = new Date(dateStr + 'T12:00:00')
  const dayOfWeek = date.getDay() // 0 = domingo
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    weekStart: toLocalISO(monday),
    weekEnd: toLocalISO(sunday),
  }
}

/**
 * Retorna o início e fim da semana atual
 */
export function getCurrentWeekBounds(): { weekStart: string; weekEnd: string } {
  return getWeekBounds(todayISO())
}

/**
 * Avança ou recua uma semana.
 */
export function offsetWeek(weekStart: string, direction: 1 | -1): string {
  const date = new Date(weekStart + 'T12:00:00')
  date.setDate(date.getDate() + direction * 7)
  return toLocalISO(date)
}
