import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ResultsActions from './results-actions' 

export default async function HodResultsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) redirect('/login')

  const cycle = await prisma.appraisalCycle.findFirst({ where: { isActive: true } })
  if (!cycle) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-semibold">HOD Appraisal Results</h1>
        <div className="rounded-2xl border p-4 bg-white">No active cycle.</div>
      </div>
    )
  }

  const appraisal = await prisma.appraisal.findFirst({
    where: { cycleId: cycle.id, facultyId: Number(user.id) },
    include: {
      evaluations: true,
    },
  })

  if (!appraisal) {
    return (
      <div className="p-6 m-5 space-y-4">
        <h1 className="p-6 text-xl font-semibold">HOD Appraisal Results</h1>
        <div className="rounded-2xl border p-4 bg-white">
          No appraisal found for the active cycle.
        </div>
      </div>
    )
  }

  // Capabilities points mapping
  const CAP_POINTS: Record<string, number> = {
    HIGHLY_EXCEEDS: 20,
    EXCEEDS: 16,
    FULLY_MEETS: 12,
    PARTIALLY_MEETS: 8,
    NEEDS_IMPROVEMENT: 4,
  }

  // Get capabilities for HOD role
  const getCapabilitiesForRole = (role: string) => {
    if (role === 'HOD') {
      return [
        'institutionalCommitment',
        'customerService',
        'leadingIndividuals',
        'leadingChange',
        'strategicVision',
      ]
    } else {
      return [
        'institutionalCommitment',
        'collaborationTeamwork',
        'professionalism',
        'clientService',
        'achievingResults',
      ]
    }
  }

  // Helper function to format numbers
  const formatScore = (score: number | null | undefined) => {
    return typeof score === 'number' ? score.toFixed(2) : '—'
  }

  const isActionable = appraisal.status === 'sent'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">HOD Appraisal Results</h1>
        <div className="text-xs rounded px-2 py-1 border bg-white">
          Status: <span className="font-medium">{appraisal.status}</span>
        </div>
      </div>

      {/* Performance Evaluations Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Performance Evaluations</h2>
        <div className="rounded-2xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Evaluator</th>
                <th className="p-2 text-left">Research</th>
                <th className="p-2 text-left">University Service</th>
                <th className="p-2 text-left">Community Service</th>
                <th className="p-2 text-left">Teaching</th>
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const perfRows: any[] = []

                // Add aggregated performance scores if available
                if (appraisal.researchScore || appraisal.universityServiceScore || appraisal.communityServiceScore || appraisal.teachingQualityScore) {
                  const perfTotal = (appraisal.researchScore ?? 0) + (appraisal.universityServiceScore ?? 0) + (appraisal.communityServiceScore ?? 0) + (appraisal.teachingQualityScore ?? 0)

                  perfRows.push({
                    evaluator: 'Aggregated Scores',
                    research: appraisal.researchScore ?? '—',
                    university: appraisal.universityServiceScore ?? '—',
                    community: appraisal.communityServiceScore ?? '—',
                    teaching: appraisal.teachingQualityScore ?? '—',
                    total: perfTotal,
                    isHeader: true,
                  })

                  perfRows.push({
                    evaluator: 'Research',
                    research: appraisal.researchScore ?? '—',
                    university: '—',
                    community: '—',
                    teaching: '—',
                    total: '—',
                    isHeader: false,
                  })
                  perfRows.push({
                    evaluator: 'University Service',
                    research: '—',
                    university: appraisal.universityServiceScore ?? '—',
                    community: '—',
                    teaching: '—',
                    total: '—',
                    isHeader: false,
                  })
                  perfRows.push({
                    evaluator: 'Community Service',
                    research: '—',
                    university: '—',
                    community: appraisal.communityServiceScore ?? '—',
                    teaching: '—',
                    total: '—',
                    isHeader: false,
                  })
                  perfRows.push({
                    evaluator: 'Teaching',
                    research: '—',
                    university: '—',
                    community: '—',
                    teaching: appraisal.teachingQualityScore ?? '—',
                    total: '—',
                    isHeader: false,
                  })
                  perfRows.push({
                    evaluator: 'Performance Total',
                    research: '—',
                    university: '—',
                    community: '—',
                    teaching: '—',
                    total: perfTotal,
                    isHeader: false,
                  })
                }

                // Add detailed performance scores from evaluations
                if (appraisal.evaluations && appraisal.evaluations.length > 0) {
                  appraisal.evaluations.forEach((evaluation, index) => {
                    const perfTotal = (evaluation.researchPts ?? 0) +
                                     (evaluation.universityServicePts ?? 0) +
                                     (evaluation.communityServicePts ?? 0) +
                                     (evaluation.teachingQualityPts ?? 0)

                    perfRows.push({
                      evaluator: `${evaluation.role} Evaluation`,
                      research: evaluation.researchPts ?? '—',
                      university: evaluation.universityServicePts ?? '—',
                      community: evaluation.communityServicePts ?? '—',
                      teaching: evaluation.teachingQualityPts ?? '—',
                      total: perfTotal,
                      isHeader: true,
                    })

                    perfRows.push({
                      evaluator: 'Research',
                      research: evaluation.researchPts ?? '—',
                      university: '—',
                      community: '—',
                      teaching: '—',
                      total: '—',
                      isHeader: false,
                    })
                    perfRows.push({
                      evaluator: 'University Service',
                      research: '—',
                      university: evaluation.universityServicePts ?? '—',
                      community: '—',
                      teaching: '—',
                      total: '—',
                      isHeader: false,
                    })
                    perfRows.push({
                      evaluator: 'Community Service',
                      research: '—',
                      university: '—',
                      community: evaluation.communityServicePts ?? '—',
                      teaching: '—',
                      total: '—',
                      isHeader: false,
                    })
                    perfRows.push({
                      evaluator: 'Teaching',
                      research: '—',
                      university: '—',
                      community: '—',
                      teaching: evaluation.teachingQualityPts ?? '—',
                      total: '—',
                      isHeader: false,
                    })
                    perfRows.push({
                      evaluator: 'Performance Total',
                      research: '—',
                      university: '—',
                      community: '—',
                      teaching: '—',
                      total: perfTotal,
                      isHeader: false,
                    })
                  })
                }

                return perfRows.length > 0 ? (
                  perfRows.map((r, index) => (
                    <tr key={index} className={`border-t ${r.isHeader ? 'bg-gray-100 font-semibold' : ''}`}>
                      <td className="p-2">{r.evaluator}</td>
                      <td className="p-2">
                        {typeof r.research === 'number' ? r.research.toFixed(2) : r.research}
                      </td>
                      <td className="p-2">
                        {typeof r.university === 'number' ? r.university.toFixed(2) : r.university}
                      </td>
                      <td className="p-2">
                        {typeof r.community === 'number' ? r.community.toFixed(2) : r.community}
                      </td>
                      <td className="p-2">
                        {typeof r.teaching === 'number' ? r.teaching.toFixed(2) : r.teaching}
                      </td>
                      <td className="p-2">
                        {typeof r.total === 'number' ? r.total.toFixed(2) : r.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-gray-500">
                      No performance evaluations available
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capabilities Evaluations Tables */}
      {(() => {
        if (!appraisal.evaluations || appraisal.evaluations.length === 0) {
          return (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Capabilities Evaluations</h2>
              <div className="rounded-2xl border bg-white p-4 text-center text-gray-500">
                No capabilities evaluations available
              </div>
            </div>
          )
        }

        const evaluationsByRole = appraisal.evaluations.reduce((acc, evaluation) => {
          if (!acc[evaluation.role]) acc[evaluation.role] = []
          acc[evaluation.role].push(evaluation)
          return acc
        }, {} as Record<string, typeof appraisal.evaluations>)

        return Object.entries(evaluationsByRole).map(([role, evals]) => {
          const typedEvals = evals as typeof appraisal.evaluations
          const capabilities = getCapabilitiesForRole(role)
          const headers = capabilities.map(cap => cap.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))

          return (
            <div key={role} className="space-y-2">
              <h2 className="text-lg font-semibold">{role} Capabilities Evaluations</h2>
              <div className="rounded-2xl border bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Evaluator</th>
                      {headers.map(h => <th key={h} className="p-2 text-left">{h}</th>)}
                      <th className="p-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typedEvals.map((evaluation, index) => {
                      const rubric = evaluation.rubric as any
                      const capSelections = rubric?.capabilities?.selections || {}

                      let capTotal = 0
                      if (Object.keys(capSelections).length > 0) {
                        const capScores = capabilities.map(cap => {
                          const band = capSelections[cap]
                          return band ? CAP_POINTS[band.toUpperCase()] || 0 : 0
                        })
                        capTotal = capScores.reduce((sum, score) => sum + score, 0)
                      } else {
                        capTotal = evaluation.capabilitiesPts ?? 0
                      }

                      const capBands: Record<string, string> = {}
                      capabilities.forEach(cap => {
                        const band = capSelections[cap]
                        capBands[cap] = band ? band.toUpperCase() : '—'
                      })

                      const rows: any[] = []
                      rows.push({
                        evaluator: `${role} Evaluation`,
                        ...capabilities.reduce((acc, cap) => ({ ...acc, [cap]: capBands[cap] || '—' }), {}),
                        total: capTotal,
                        isHeader: true,
                      })

                      if (Object.keys(capSelections).length > 0) {
                        capabilities.forEach(cap => {
                          const band = capSelections[cap]
                          const score = band ? CAP_POINTS[band.toUpperCase()] : '—'
                          const row: any = {
                            evaluator: cap.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                            ...capabilities.reduce((acc, c) => ({ ...acc, [c]: c === cap ? score : '—' }), {}),
                            total: '—',
                            isHeader: false,
                          }
                          rows.push(row)
                        })
                      } else {
                        rows.push({
                          evaluator: 'Capabilities',
                          ...capabilities.reduce((acc, cap) => ({ ...acc, [cap]: '—' }), {}),
                          total: evaluation.capabilitiesPts ?? '—',
                          isHeader: false,
                        })
                      }

                      rows.push({
                        evaluator: 'Capabilities Total',
                        ...capabilities.reduce((acc, cap) => ({ ...acc, [cap]: '—' }), {}),
                        total: capTotal,
                        isHeader: false,
                      })

                      return rows.map((r, rIndex) => (
                        <tr key={`${index}-${rIndex}`} className={`border-t ${r.isHeader ? 'bg-gray-100 font-semibold' : ''}`}>
                          <td className="p-2">{r.evaluator}</td>
                          {capabilities.map(cap => (
                            <td key={cap} className="p-2">
                              {typeof r[cap] === 'number' ? r[cap].toFixed(2) : r[cap]}
                            </td>
                          ))}
                          <td className="p-2">
                            {typeof r.total === 'number' ? r.total.toFixed(2) : r.total}
                          </td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })
      })()}

      {isActionable ? (
        <ResultsActions appraisalId={appraisal.id} />
      ) : (
        <div className="text-sm text-gray-600">
          This appraisal is read-only in the current status.
        </div>
      )}
    </div>
  )
}
