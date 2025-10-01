import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { ClipboardList, Users, Award, TrendingUp } from "lucide-react"
import { EvaluationStatus } from "@prisma/client"

async function getHODStats(departmentId: number) {
  const [totalFaculty, pendingAppraisals, totalAchievements, recentAppraisals] = await Promise.all([
    prisma.user.count({
      where: {
        role: "INSTRUCTOR",
        departmentId: departmentId,
        status: "ACTIVE",
      },
    }),
    prisma.appraisal.count({
      where: {
        faculty: {
          departmentId: departmentId,
          role: "INSTRUCTOR",
        },
        status: EvaluationStatus.NEW,
      },
    }),
    // For achievements, count from appraisals in department
    prisma.appraisal.count({
      where: {
        faculty: {
          departmentId: departmentId,
          role: "INSTRUCTOR",
        },
      },
    }),
    prisma.appraisal.findMany({
      where: {
        faculty: {
          departmentId: departmentId,
          role: "INSTRUCTOR",
        },
      },
      include: {
        faculty: {
          select: {
            name: true,
          },
        },
        cycle: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ])

  return {
    totalFaculty,
    pendingAppraisals,
    totalAchievements,
    recentAppraisals,
  }
}

export default async function HODDashboard() {
  const user = await getCurrentUser()
  if (!user?.departmentId) {
    return <div className="p-6">User not associated with a department.</div>
  }
  const stats = await getHODStats(parseInt(user.departmentId))

  const statCards = [
    {
      title: "Total Faculty",
      value: stats.totalFaculty,
      description: "Instructors in department",
      icon: Users,
      color: "text-chart-2",
    },
    {
      title: "Pending Appraisals",
      value: stats.pendingAppraisals,
      description: "Appraisals to review",
      icon: ClipboardList,
      color: "text-chart-4",
    },
    {
      title: "Department Achievements",
      value: stats.totalAchievements,
      description: "Total appraisals",
      icon: Award,
      color: "text-chart-3",
    },
    {
      title: "Performance Score",
      value: "85%",
      description: "Department average",
      icon: TrendingUp,
      color: "text-chart-1",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">HOD Dashboard</h1>
        <p className="text-muted-foreground">Department KPIs and analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Faculty Appraisals</CardTitle>
            <CardDescription>Latest appraisal submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAppraisals.length > 0 ? (
                stats.recentAppraisals.map((appraisal) => (
                  <div key={appraisal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {appraisal.faculty.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{appraisal.cycle.academicYear} - {appraisal.cycle.semester}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{appraisal.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent appraisals</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-sm">Review Appraisals</p>
                    <p className="text-xs text-muted-foreground">Evaluate faculty performance</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-sm">View Analytics</p>
                    <p className="text-xs text-muted-foreground">Department performance metrics</p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}