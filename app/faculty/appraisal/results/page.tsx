// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Textarea } from "@/components/ui/textarea"
// import { Label } from "@/components/ui/label"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// import { CheckCircle, XCircle, FileText, AlertTriangle } from "lucide-react"

// interface AppraisalResult {
//   id: string
//   status: string
//   totalScore?: number
//   researchScore?: number
//   universityServiceScore?: number
//   communityServiceScore?: number
//   teachingQualityScore?: number
//   academicYear: string
//   cycle: {
//     semester: string
//   }
//   evaluations: any[]
// }

// export default function AppraisalResultsPage() {
//   const [appraisal, setAppraisal] = useState<AppraisalResult | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [showAppealDialog, setShowAppealDialog] = useState(false)
//   const [appealMessage, setAppealMessage] = useState("")

//   useEffect(() => {
//     fetchResults()
//   }, [])

//   const fetchResults = async () => {
//     try {
//       const response = await fetch("/api/appraisals?limit=1")
//       if (response.ok) {
//         const appraisals = await response.json()
//         if (appraisals.length > 0) {
//           setAppraisal(appraisals[0])
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching results:", error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleApprove = async () => {
//     if (!appraisal) return

//     try {
//       const response = await fetch(`/api/appraisals/${appraisal.id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status: "complete" })
//       })

//       if (response.ok) {
//         setAppraisal({ ...appraisal, status: "complete" })
//       }
//     } catch (error) {
//       console.error("Error approving appraisal:", error)
//     }
//   }

//   const handleAppeal = async () => {
//     if (!appraisal || !appealMessage.trim()) return

//     try {
//       const response = await fetch(`/api/appraisals/${appraisal.id}/appeal`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: appealMessage })
//       })

//       if (response.ok) {
//         setAppraisal({ ...appraisal, status: "returned" })
//         setShowAppealDialog(false)
//         setAppealMessage("")
//       }
//     } catch (error) {
//       console.error("Error submitting appeal:", error)
//     }
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "new": return "bg-blue-100 text-blue-800"
//       case "sent": return "bg-orange-100 text-orange-800"
//       case "complete": return "bg-green-100 text-green-800"
//       case "returned": return "bg-red-100 text-red-800"
//       default: return "bg-gray-100 text-gray-800"
//     }
//   }

//   if (isLoading) {
//     return <div className="p-6">Loading...</div>
//   }

//   if (!appraisal) {
//     return (
//       <div className="p-6">
//         <Card className="bg-card">
//           <CardContent className="text-center py-12">
//             <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//             <p className="text-muted-foreground">No appraisal results available</p>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   const scoreSections = [
//     {
//       title: "Research",
//       score: appraisal.researchScore,
//       weight: 30,
//       icon: "🔬"
//     },
//     {
//       title: "University Service",
//       score: appraisal.universityServiceScore,
//       weight: 20,
//       icon: "🏛️"
//     },
//     {
//       title: "Community Service",
//       score: appraisal.communityServiceScore,
//       weight: 20,
//       icon: "🤝"
//     },
//     {
//       title: "Teaching Quality",
//       score: appraisal.teachingQualityScore,
//       weight: 30,
//       icon: "📚"
//     }
//   ]

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-foreground">Appraisal Results</h1>
//           <p className="text-muted-foreground">
//             Academic Year {appraisal.academicYear} - {appraisal.cycle.semester}
//           </p>
//         </div>
//         <div className="flex items-center gap-4">
//           <Badge className={getStatusColor(appraisal.status)}>
//             {appraisal.status}
//           </Badge>
//           {appraisal.status === "sent" && (
//             <div className="flex gap-2">
//               <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
//                 <CheckCircle className="mr-2 h-4 w-4" />
//                 Approve
//               </Button>
//               <Button
//                 onClick={() => setShowAppealDialog(true)}
//                 variant="outline"
//                 className="text-red-600 border-red-600 hover:bg-red-50"
//               >
//                 <AlertTriangle className="mr-2 h-4 w-4" />
//                 Appeal
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Total Score */}
//       <Card className="bg-card">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <FileText className="h-5 w-5" />
//             Overall Score
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="text-center">
//             <div className="text-6xl font-bold text-accent mb-2">
//               {appraisal.totalScore || 0}%
//             </div>
//             <p className="text-muted-foreground">Total Performance Score</p>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Section Scores */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {scoreSections.map((section) => (
//           <Card key={section.title} className="bg-card">
//             <CardContent className="p-6">
//               <div className="flex items-center gap-4">
//                 <div className="text-2xl">{section.icon}</div>
//                 <div className="flex-1">
//                   <p className="text-sm text-muted-foreground">{section.title}</p>
//                   <p className="text-2xl font-bold text-card-foreground">
//                     {section.score || 0}%
//                   </p>
//                   <p className="text-xs text-muted-foreground">Weight: {section.weight}%</p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Evaluation Details */}
//       {appraisal.evaluations && appraisal.evaluations.length > 0 && (
//         <Card className="bg-card">
//           <CardHeader>
//             <CardTitle>Evaluation Details</CardTitle>
//             <CardDescription>Detailed feedback from evaluators</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {appraisal.evaluations.map((evaluation: any, index: number) => (
//                 <div key={index} className="border rounded-lg p-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <h4 className="font-semibold">{evaluation.role} Evaluation</h4>
//                     <Badge variant="outline">
//                       {new Date(evaluation.submittedAt).toLocaleDateString()}
//                     </Badge>
//                   </div>
//                   {evaluation.notes && (
//                     <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
//                   )}
//                   <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
//                     <div>
//                       <p className="text-muted-foreground">Research</p>
//                       <p className="font-semibold">{evaluation.researchPts || 0}/30</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground">University Service</p>
//                       <p className="font-semibold">{evaluation.universityServicePts || 0}/20</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground">Community Service</p>
//                       <p className="font-semibold">{evaluation.communityServicePts || 0}/20</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground">Teaching Quality</p>
//                       <p className="font-semibold">{evaluation.teachingQualityPts || 0}/30</p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Appeal Dialog */}
//       <Dialog open={showAppealDialog} onOpenChange={setShowAppealDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Submit Appeal</DialogTitle>
//             <DialogDescription>
//               Please provide details about why you are appealing this appraisal result.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <Label htmlFor="appeal-message">Appeal Message</Label>
//               <Textarea
//                 id="appeal-message"
//                 value={appealMessage}
//                 onChange={(e) => setAppealMessage(e.target.value)}
//                 placeholder="Explain your appeal..."
//                 rows={4}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowAppealDialog(false)}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleAppeal}
//               disabled={!appealMessage.trim()}
//               className="bg-red-600 hover:bg-red-700"
//             >
//               Submit Appeal
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }




import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ResultsActions from './results-actions' 

export default async function ResultsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) redirect('/login')

  const cycle = await prisma.appraisalCycle.findFirst({ where: { isActive: true } })
  if (!cycle) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-semibold">Appraisal Results</h1>
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
        <h1 className="p-6 text-xl font-semibold">Appraisal Results</h1>
        <div className="rounded-2xl border p-4 bg-white">
          No appraisal found for the active cycle.
        </div>
      </div>
    )
  }

  // Capabilities points mapping
  const CAP_POINTS: Record<string, number> = {
    HIGH: 20,
    EXCEEDS: 16,
    MEETS: 12,
    PARTIAL: 8,
    NEEDS: 4,
  }

  // Get capabilities for the role
  const getCapabilitiesForRole = (role: string) => {
    if (role === 'DEAN') {
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
        <h1 className="text-xl font-semibold">Appraisal Results</h1>
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

      {/* Capabilities Evaluations Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Capabilities Evaluations</h2>
        <div className="rounded-2xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Evaluator</th>
                <th className="p-2 text-left">Institutional Commitment</th>
                <th className="p-2 text-left">Collaboration & Teamwork</th>
                <th className="p-2 text-left">Professionalism</th>
                <th className="p-2 text-left">Client Service</th>
                <th className="p-2 text-left">Achieving Results</th>
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const capRows: any[] = []

                if (appraisal.evaluations && appraisal.evaluations.length > 0) {
                  appraisal.evaluations.forEach((evaluation, index) => {
                    const capabilities = getCapabilitiesForRole(evaluation.role)
                    const rubric = evaluation.rubric as any
                    const capSelections = rubric?.capabilities?.selections || {}

                    // Calculate capabilities scores
                    let capTotal = 0
                    if (Object.keys(capSelections).length > 0) {
                      const capScores = capabilities.map(cap => {
                        const band = capSelections[cap]
                        return band ? CAP_POINTS[band] || 0 : 0
                      })
                      capTotal = capScores.reduce((sum, score) => sum + score, 0)
                    } else {
                      capTotal = evaluation.capabilitiesPts ?? 0
                    }

                    capRows.push({
                      evaluator: `${evaluation.role} Evaluation`,
                      institutionalCommitment: '—',
                      collaborationTeamwork: '—',
                      professionalism: '—',
                      clientService: '—',
                      achievingResults: '—',
                      customerService: '—',
                      leadingIndividuals: '—',
                      leadingChange: '—',
                      strategicVision: '—',
                      total: capTotal,
                      isHeader: true,
                    })

                    // Individual capabilities scores
                    if (Object.keys(capSelections).length > 0) {
                      capabilities.forEach((cap, capIndex) => {
                        const band = capSelections[cap]
                        const score = band ? CAP_POINTS[band] : '—'
                        const row: any = {
                          evaluator: cap.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                          total: '—',
                          isHeader: false,
                        }
                        row[cap] = score
                        capRows.push(row)
                      })
                    } else {
                      // If no detailed capabilities, show the total
                      capRows.push({
                        evaluator: 'Capabilities',
                        institutionalCommitment: '—',
                        collaborationTeamwork: '—',
                        professionalism: '—',
                        clientService: '—',
                        achievingResults: '—',
                        customerService: '—',
                        leadingIndividuals: '—',
                        leadingChange: '—',
                        strategicVision: '—',
                        total: evaluation.capabilitiesPts ?? '—',
                        isHeader: false,
                      })
                    }

                    capRows.push({
                      evaluator: 'Capabilities Total',
                      institutionalCommitment: '—',
                      collaborationTeamwork: '—',
                      professionalism: '—',
                      clientService: '—',
                      achievingResults: '—',
                      customerService: '—',
                      leadingIndividuals: '—',
                      leadingChange: '—',
                      strategicVision: '—',
                      total: capTotal,
                      isHeader: false,
                    })
                  })
                }

                return capRows.length > 0 ? (
                  capRows.map((r, index) => (
                    <tr key={index} className={`border-t ${r.isHeader ? 'bg-gray-100 font-semibold' : ''}`}>
                      <td className="p-2">{r.evaluator}</td>
                      <td className="p-2">
                        {typeof r.institutionalCommitment === 'number' ? r.institutionalCommitment.toFixed(2) : r.institutionalCommitment}
                      </td>
                      <td className="p-2">
                        {typeof r.collaborationTeamwork === 'number' ? r.collaborationTeamwork.toFixed(2) : r.collaborationTeamwork}
                      </td>
                      <td className="p-2">
                        {typeof r.professionalism === 'number' ? r.professionalism.toFixed(2) : r.professionalism}
                      </td>
                      <td className="p-2">
                        {typeof r.clientService === 'number' ? r.clientService.toFixed(2) : r.clientService}
                      </td>
                      <td className="p-2">
                        {typeof r.achievingResults === 'number' ? r.achievingResults.toFixed(2) : r.achievingResults}
                      </td>
                      <td className="p-2">
                        {typeof r.total === 'number' ? r.total.toFixed(2) : r.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-2 text-center text-gray-500">
                      No capabilities evaluations available
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>

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
