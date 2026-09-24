import { getAllVales } from '@/actions/vales'
import { getActiveEmployees } from '@/actions/employees'
import { getCurrentAccumulationSummary } from '@/actions/settlements'
import ValesPageClient from './ValesPageClient'

export const dynamic = 'force-dynamic'

export default async function ValesPage() {
  const [vales, employees, summary] = await Promise.all([
    getAllVales(),
    getActiveEmployees(),
    getCurrentAccumulationSummary(),
  ])

  return (
    <ValesPageClient
      initialVales={vales}
      employees={employees}
      summary={summary}
    />
  )
}
