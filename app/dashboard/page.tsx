import { getCurrentUser } from "@/lib/auth-utils"
import FacultyDashboard from "./faculty-dashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  // The layout now guarantees the user is an instructor and is not null.
  return <FacultyDashboard user={user!} />
}
