import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HODPersonalCharts from './charts'

export default async function HODPersonalAnalyticsPage(){
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) redirect('/login')

  const appraisals = await prisma.appraisal.findMany({
    where: { facultyId: parseInt(user.id) },
    include: { cycle: true },
    orderBy: { id: 'asc' },
  })

  const data = appraisals.map(a => ({
    id: a.id,
    label: `${a.cycle?.academicYear ?? ''}`.trim(),
    status: a.status,
    research: a.researchScore ?? 0,
    university: a.universityServiceScore ?? 0,
    community: a.communityServiceScore ?? 0,
    teaching: a.teachingQualityScore ?? 0,
    total: a.totalScore ?? 0,
  }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">My Performance Analytics</h1>
      <HODPersonalCharts rows={data} />
      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Cycle</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.label || r.id}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.total.toFixed(2)}</td>
                <td className="p-2">
                  <a className="underline" href={`/hod/appraisal/achievements`}>Open Achievements</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}