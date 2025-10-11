import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EvaluationStatus } from '@prisma/client'
import ResultsActions from './results-actions'

export default async function ResultsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) redirect('/login')

  const cycle = await prisma.appraisalCycle.findFirst({ where: { isActive: true } })
  if (!cycle) {
    return (
      <div className="p-6">
        <Card className="bg-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No active appraisal cycle found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const appraisal = await prisma.appraisal.findFirst({
    where: { cycleId: cycle.id, facultyId: Number(user.id) },
    include: {
      evaluations: {
        include: {
          behaviorRatings: true
        }
      },
      cycle: true
    }
  })

  if (!appraisal) {
    return (
      <div className="p-6">
        <Card className="bg-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No appraisal found for the active cycle</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case EvaluationStatus.new: return "bg-blue-100 text-blue-800"
      case EvaluationStatus.sent: return "bg-orange-100 text-orange-800"
      case EvaluationStatus.complete: return "bg-green-100 text-green-800"
      case EvaluationStatus.returned: return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const scoreSections = [
    {
      title: "Research",
      score: appraisal.researchScore,
      weight: 30,
      icon: "🔬"
    },
    {
      title: "University Service",
      score: appraisal.universityServiceScore,
      weight: 20,
      icon: "🏛️"
    },
    {
      title: "Community Service",
      score: appraisal.communityServiceScore,
      weight: 20,
      icon: "🤝"
    },
    {
      title: "Teaching Quality",
      score: appraisal.teachingQualityScore,
      weight: 30,
      icon: "📚"
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Appraisal Results</h1>
        <div className="text-xs rounded px-2 py-1 border bg-white">
          Status: <span className="font-medium">{appraisal.status}</span>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Section</th>
              <th className="p-2 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2">Research</td>
              <td className="p-2">
                {appraisal.researchScore ? `${appraisal.researchScore.toFixed(2)}` : '—'}
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-2">University Service</td>
              <td className="p-2">
                {appraisal.universityServiceScore ? `${appraisal.universityServiceScore.toFixed(2)}` : '—'}
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Community Service</td>
              <td className="p-2">
                {appraisal.communityServiceScore ? `${appraisal.communityServiceScore.toFixed(2)}` : '—'}
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Teaching</td>
              <td className="p-2">
                {appraisal.teachingQualityScore ? `${appraisal.teachingQualityScore.toFixed(2)}` : '—'}
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-2 font-semibold">TOTAL</td>
              <td className="p-2 font-semibold">
                {appraisal.totalScore ? `${appraisal.totalScore.toFixed(2)}` : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {appraisal.status === EvaluationStatus.sent ? (
        <ResultsActions appraisalId={appraisal.id} />
      ) : (
        <div className="text-sm text-gray-600">
          This appraisal is read-only in the current status.
        </div>
      )}
    </div>
  )
}




