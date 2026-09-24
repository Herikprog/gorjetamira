import { getActiveEmployees } from '@/actions/employees'
import { getCurrentAccumulationSummary, getSettlements } from '@/actions/settlements'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [employees, summary, settlements] = await Promise.all([
    getActiveEmployees(),
    getCurrentAccumulationSummary(),
    getSettlements(),
  ])

  return (
    <DashboardClient
      summary={summary}
      employees={employees}
      settlements={settlements}
    />
  )
}
