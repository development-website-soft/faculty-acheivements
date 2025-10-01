import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { ClipboardList, Award, TrendingUp, Calendar } from "lucide-react"

async function getFacultyStats(userId: string) {
  const [currentAppraisal] = await Promise.all([
    prisma.appraisal.findFirst({
      where: {
        facultyId: parseInt(userId),
      },
    }),
  ])

  // TODO: Implement achievement counting when model is available
  const totalAchievements = 0
  const recentAchievements: any[] = []

  return {
    currentAppraisal,
    totalAchievements,
    recentAchievements,
  }
}

export default async function FacultyDashboard() {
  const user = await getCurrentUser()
  const stats = await getFacultyStats(user!.id)

  const statCards = [
    {
      title: "Current Appraisal",
      value: stats.currentAppraisal?.status || "Not Started",
      description: `${new Date().getFullYear()} Academic Year`,
      icon: ClipboardList,
      color: "text-chart-1",
    },
    {
      title: "Total Achievements",
      value: stats.totalAchievements,
      description: "Career achievements",
      icon: Award,
      color: "text-chart-3",
    },
    {
      title: "Performance Score",
      value: stats.currentAppraisal?.totalScore ? `${stats.currentAppraisal.totalScore}%` : "Pending",
      description: "Current year score",
      icon: TrendingUp,
      color: "text-chart-2",
    },
    {
      title: "Last Updated",
      value: stats.currentAppraisal ? new Date(stats.currentAppraisal.updatedAt).toLocaleDateString() : "Never",
      description: "Appraisal last modified",
      icon: Calendar,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Track your performance and achievements.</p>
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
            <CardTitle className="text-card-foreground">Recent Achievements</CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAchievements.length > 0 ? (
                stats.recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.category} • {new Date(achievement.dateAchieved).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-accent">{achievement.points} pts</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No achievements recorded yet</p>
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
                    <p className="font-medium text-sm">Update Appraisal</p>
                    <p className="text-xs text-muted-foreground">Add achievements and self-evaluation</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-sm">Add Achievement</p>
                    <p className="text-xs text-muted-foreground">Record new accomplishment</p>
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
