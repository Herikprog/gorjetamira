import { getEmployees } from '@/actions/employees'
import EmployeeList from '@/components/EmployeeList'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const employees = await getEmployees()

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Funcionários</h1>
        <p className="page-subtitle">
          Gerir os membros da equipa. Funcionários inativos não participam nos novos cálculos.
        </p>
      </div>

      <EmployeeList employees={employees} />
    </div>
  )
}
