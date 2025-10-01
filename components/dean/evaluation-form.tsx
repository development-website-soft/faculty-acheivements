// 'use client'

// import * as React from 'react'
// import { useMemo, useState, useEffect } from 'react'
// import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import { Label } from '@/components/ui/label'
// import { Textarea } from '@/components/ui/textarea'
// import { cn } from '@/lib/utils'

// function Explanation({ text }: { text?: string }) {
//   if (!text || !text.trim()) return <span className="text-muted-foreground">—</span>

//   const parts = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
//   const header = parts[0]?.endsWith(':') ? parts.shift() : undefined
//   const items = parts.map(s =>
    
//     s.replace(/^\d+[\).]\s*|^[\-\u2022]\s*/,'')
//   )

//   return (
//     <div className="text-sm text-muted-foreground">
//       {header && <p className="mb-1">{header}</p>}
//       {items.length > 0 ? (
//         <ol className="list-decimal pl-5 space-y-0.5">
//           {items.map((li, i) => <li key={i}>{li}</li>)}
//         </ol>
//       ) : null}
//     </div>
//   )
// }


// /* ===================== Types ===================== */
// type BandKey = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'
// type RoleKey = 'HOD'|'DEAN'
// type EvalRow = {
//   role: RoleKey

//   researchBand?: BandKey|null; researchPts?: number|null; researchExplanation?: string|null; researchNote?: string|null;
//   universityServiceBand?: BandKey|null; universityServicePts?: number|null; universityServiceExplanation?: string|null; universityServiceNote?: string|null;
//   communityServiceBand?: BandKey|null; communityServicePts?: number|null; communityServiceExplanation?: string|null; communityServiceNote?: string|null;
//   teachingBand?: BandKey|null; teachingPts?: number|null; teachingExplanation?: string|null; teachingNote?: string|null;

//   // Section 2 (Capabilities) persisted summary:
//   capabilitiesPts?: number|null;             // 0..100
//   capabilitiesDetailJson?: Record<string, any>|null // per-dimension selections (optional)
// }
// type AppraisalLite = {
//   id: number
//   status: 'NEW'|'IN_REVIEW'|'SCORES_SENT'|'COMPLETE'|'RETURNED'
//   evaluations?: EvalRow[]
// }

// /* ===================== Band Labels ===================== */
// const BAND_LABEL: Record<BandKey, string> = {
//   HIGH: 'Highly Exceeds',
//   EXCEEDS: 'Exceeds',
//   MEETS: 'Fully Meets',
//   PARTIAL: 'Partially Meets',
//   NEEDS: 'Needs Improvement',
// }

// /* ===================== Section 1 — Rubrics & Points ===================== */
// const PERF_POINTS = {
//   research:  { HIGH:30, EXCEEDS:24, MEETS:18, PARTIAL:12, NEEDS:6 },
//   university:{ HIGH:20, EXCEEDS:16, MEETS:12, PARTIAL: 8, NEEDS:4 },
//   community: { HIGH:20, EXCEEDS:16, MEETS:12, PARTIAL: 8, NEEDS:4 },
//   teaching:  { HIGH:30, EXCEEDS:24, MEETS:18, PARTIAL:12, NEEDS:6 },
// } as const

// const performanceRubric = {
//   research: {
//     weight: 30,
//     bands: {
//       HIGH:    { points: 30, summary: `Completion of one of the following:
//                   1. Publishing 3 or more international research papers.
//                   2. Publishing 2 or more international books.
//                   3. Completing 3 or more contract projects.
//                   4. Completion of( 2 international research papers, an international book, a contract project, and reviewing an international research paper).
//                   5. One or more internationally registered patents.
//                   6. Completion of 3 of the tems mentioned in the “exceeds expectations” column.` },
//       EXCEEDS: { points: 24, summary: `Completion of one of the following:
//                   1. Publishing 2 international research papers.
//                   2. Publishing an international book.
//                   3. Publishing 2 or more indexed books.
//                   4. Completing 2 contract projects.
//                   5. Completing one of the following: a. An international research paper and a book. b.An international research paper and a contract project. c. An international research paper and reviewing an international research paper. d.An international research paper and participating as speaker at an international conference.
//                   6. Completion of 3 of the items mentioned in the “fully meets expectations” column.
//                   7. Registration of one or more patents.` },
//       MEETS:   { points: 18, summary: `Completion of one of the following:
//                   1. Publishing an international research paper.
//                   2. Publishing an indexed book.
//                   3. Completion of a contract project.
//                   4. Reviewing 2 or more international research papers.
//                   5. Participating as a speaker at an international conference.
//                   6. Registration of a patent.` },
//       PARTIAL: { points: 12, summary: `Completion of one of the following:
//                   1. Publishing in a local journal.
//                   2. Publishing informative articles.
//                   3. Participating in one or more conferences.` },
//       NEEDS:   { points:  6, summary: `Work characterized by all or part of the following:
//         No accomplishments as per the items mentioned in “partially meets expectations” column. Other accomplishments shall be mentioned as applicable.` },
//     }
//   },
//   university: {
//     weight: 20,
//     bands: {
//       HIGH:    { points: 20, summary: `Completion of 5 or more of the following:
//                   1. Participating in standing/ad-hoc committees.
//                   2. Participating in conferences/workshops/seminars (chair/coordinator/member).
//                   3. Delivering at least one lecture (dept/college/university level).
//                   4. Proposing development initiatives (research/administrative).
//                   5. Proposing an academic program adopted/discussed by University Council.
//                   6. Participating in other university services (e.g., admission interviews).
//                   7. Supervising Ph.D./Master Dissertations/graduation projects.` },
//       EXCEEDS: { points: 16, summary: `Completion of 4 of the following:
//                   1. Participating in standing/ad-hoc committees.
//                   2. Participating in conferences/workshops/seminars (chair/coordinator/member).
//                   3. Delivering at least one lecture (dept/college/university level).
//                   4. Proposing development initiatives (research/administrative).
//                   5. Proposing an academic program adopted/discussed by University Council.
//                   6. Participating in other university services (e.g., admission interviews).
//                   7. Supervising Ph.D./Master Dissertations/graduation projects.` },
//       MEETS:   { points: 12, summary: `Completion of 3 of the following:
//                   1. Participating in standing/ad-hoc committees.
//                   2. Participating in conferences/workshops/seminars (chair/coordinator/member).
//                   3. Delivering at least one lecture (dept/college/university level).
//                   4. Proposing development initiatives (research/administrative).
//                   5. Proposing an academic program adopted/discussed by University Council.
//                   6. Participating in other university services (e.g., admission interviews).
//                   7. Supervising Ph.D./Master Dissertations/graduation projects.` },
//       PARTIAL: { points:  8, summary: `Completion 2 of the following:
//                   1. Participating in standing/ad-hoc committees.
//                   2. Participating in conferences/workshops/seminars (chair/coordinator/member).
//                   3. Delivering at least one lecture (dept/college/university level).
//                   4. Proposing development initiatives (research/administrative).
//                   5. Proposing an academic program adopted/discussed by University Council.
//                   6. Participating in other university services (e.g., admission interviews).
//                   7. Supervising Ph.D./Master Dissertations/graduation projects.` },
//       NEEDS:   { points:  4, summary: `Completion one of the following:
//                   1. Participating in standing/ad-hoc committees.
//                   2. Participating in conferences/workshops/seminars (chair/coordinator/member).
//                   3. Delivering at least one lecture (dept/college/university level).
//                   4. Proposing development initiatives (research/administrative).
//                   5. Proposing an academic program adopted/discussed by University Council.
//                   6. Participating in other university services (e.g., admission interviews).
//                   7. Supervising Ph.D./Master Dissertations/graduation projects.` },
//     }
//   },
//   community: {
//     weight: 20,
//     bands: {
//       HIGH:    { points: 20, summary: `Completion of 5 or more of the following:
//                   1. Delivering public lectures serving the community.
//                   2. Participating in activities of professional/cultural societies.
//                   3. Membership in technical/ad-hoc committees or boards.
//                   4. Providing scientific consultation/workshops/seminars.
//                   5. Participating in media activities (articles, TV, radio).
//                   6. Acting as judge/referee in official contests (local/regional/international).
//                   7. Other community service activities.` },
//       EXCEEDS: { points: 16, summary: `Completion of 4 of the following:
//                   1. Delivering public lectures serving the community.
//                   2. Participating in activities of professional/cultural societies.
//                   3. Membership in technical/ad-hoc committees or boards.
//                   4. Providing scientific consultation/workshops/seminars.
//                   5. Participating in media activities (articles, TV, radio).
//                   6. Acting as judge/referee in official contests (local/regional/international).
//                   7. Other community service activities.` },
//       MEETS:   { points: 12, summary: `Completion of 3 of the following:
//                   1. Delivering public lectures serving the community.
//                   2. Participating in activities of professional/cultural societies.
//                   3. Membership in technical/ad-hoc committees or boards.
//                   4. Providing scientific consultation/workshops/seminars.
//                   5. Participating in media activities (articles, TV, radio).
//                   6. Acting as judge/referee in official contests (local/regional/international).
//                   7. Other community service activities.` },
//       PARTIAL: { points:  8, summary: `Completion of 2 of the following:
//                   1. Delivering public lectures serving the community.
//                   2. Participating in activities of professional/cultural societies.
//                   3. Membership in technical/ad-hoc committees or boards.
//                   4. Providing scientific consultation/workshops/seminars.
//                   5. Participating in media activities (articles, TV, radio).
//                   6. Acting as judge/referee in official contests (local/regional/international).
//                   7. Other community service activities.` },
//       NEEDS:   { points:  4, summary: `Completion of one of the following:
//                   1. Delivering public lectures serving the community.
//                   2. Participating in activities of professional/cultural societies.
//                   3. Membership in technical/ad-hoc committees or boards.
//                   4. Providing scientific consultation/workshops/seminars.
//                   5. Participating in media activities (articles, TV, radio).
//                   6. Acting as judge/referee in official contests (local/regional/international).
//                   7. Other community service activities.` },
//     }
//   },
//   teaching: {
//     weight: 30,
//     bands: {
//       HIGH:    { points: 30, summary: `Student evaluation not less than 90%.` },
//       EXCEEDS: { points: 24, summary: `Student evaluation between 80%–89%.` },
//       MEETS:   { points: 18, summary: `Student evaluation between 60%–79%.` },
//       PARTIAL: { points: 12, summary: `Student evaluation between 50%–59%.` },
//       NEEDS:   { points:  6, summary: `Student evaluation less than 50%.` },
//     }
//   },
// }

// /* ===================== Section 2 — Capabilities ===================== */
// type CapKey =
//   | 'institutionalCommitment'
//   | 'collaborationTeamwork'
//   | 'professionalism'
//   | 'clientService'
//   | 'achievingResults'

// const CAP_LABEL: Record<CapKey, string> = {
//   institutionalCommitment: 'Institutional Commitment (Behavioral)',
//   collaborationTeamwork:   'Collaboration and Teamwork (Special)',
//   professionalism:         'Professionalism (Behavioral)',
//   clientService:           'Client Service (Behavioral)',
//   achievingResults:        'Achieving Results (Behavioral)',
// }

// // كل بُعد 20 نقطة: HIGH=20, EXCEEDS=16, MEETS=12, PARTIAL=8, NEEDS=4
// const CAP_POINTS_20: Record<BandKey, number> = {
//   HIGH: 20, EXCEEDS: 16, MEETS: 12, PARTIAL: 8, NEEDS: 4,
// }

// const CAP_PFX = {
//   HIGH:    'Work characterized by a very high degree of professionalism (90%–100%):',
//   EXCEEDS: 'Work characterized by a high degree of professionalism (80%–89%):',
//   MEETS:   'Work characterized by a good degree of professionalism (60%–79%):',
//   PARTIAL: 'Work characterized by an average degree of professionalism (50%–59%):',
//   NEEDS:   'Work characterized by a degree of professionalism lower than 50%:',
// } as const

// const CAP_EXPLANATIONS: Record<CapKey, Record<BandKey, string>> = {
//   institutionalCommitment: {
//     HIGH: [CAP_PFX.HIGH,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
//     EXCEEDS: [CAP_PFX.EXCEEDS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
//     MEETS: [CAP_PFX.MEETS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
//     PARTIAL: [CAP_PFX.PARTIAL,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
//     NEEDS: [CAP_PFX.NEEDS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
//   },
//   collaborationTeamwork: {
//     HIGH: [CAP_PFX.HIGH,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
//     EXCEEDS: [CAP_PFX.EXCEEDS,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
//     MEETS: [CAP_PFX.MEETS,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
//     PARTIAL: [CAP_PFX.PARTIAL,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
//     NEEDS: [CAP_PFX.NEEDS,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
//   },
//   professionalism: {
//     HIGH: [CAP_PFX.HIGH,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
//     EXCEEDS: [CAP_PFX.EXCEEDS,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
//     MEETS: [CAP_PFX.MEETS,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
//     PARTIAL: [CAP_PFX.PARTIAL,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
//     NEEDS: [CAP_PFX.NEEDS,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
//   },
//   clientService: {
//     HIGH: [CAP_PFX.HIGH,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
//     EXCEEDS: [CAP_PFX.EXCEEDS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
//     MEETS: [CAP_PFX.MEETS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
//     PARTIAL: [CAP_PFX.PARTIAL,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
//     NEEDS: [CAP_PFX.NEEDS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
//   },
//   achievingResults: {
//     HIGH: [CAP_PFX.HIGH,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Provides detailed reports on conferences & how to utilize recommendations.'].join('\n'),
//     EXCEEDS: [CAP_PFX.EXCEEDS,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Provides detailed reports on conferences & how to utilize recommendations.'].join('\n'),
//     MEETS: [CAP_PFX.MEETS,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Provides detailed reports on conferences & how to utilize recommendations.'].join('\n'),
//     PARTIAL: [CAP_PFX.PARTIAL,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Provides detailed reports on conferences & how to utilize recommendations.'].join('\n'),
//     NEEDS: [CAP_PFX.NEEDS,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Provides detailed reports on conferences & how to utilize recommendations.'].join('\n'),
//   },
// }

// /* ===================== Small Helpers ===================== */
// function BandChips({ value, onChange, disabled }:{
//   value?: BandKey; onChange:(b:BandKey)=>void; disabled?: boolean
// }) {
//   const keys: BandKey[] = ['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS']
//   return (
//     <div className="flex flex-wrap gap-2">
//       {keys.map(k=>(
//         <button
//           key={k}
//           type="button"
//           disabled={disabled}
//           onClick={()=>onChange(k)}
//           className={cn('px-3 py-1 rounded-full border text-sm',
//             value===k ? 'bg-primary text-primary-foreground border-primary':'bg-white hover:bg-accent',
//             disabled && 'opacity-50 cursor-not-allowed')}
//           aria-pressed={value===k}
//         >
//           {BAND_LABEL[k]}
//         </button>
//       ))}
//     </div>
//   )
// }

// /* ===================== Research Rubric Modal (Section 1 only) ===================== */
// function ResearchRubricModal({
//   open, onOpenChange, current, onUse
// }:{
//   open:boolean; onOpenChange:(v:boolean)=>void; current?:BandKey; onUse:(b:BandKey)=>void
// }) {
//   const [tab, setTab] = useState<BandKey>(current ?? 'MEETS')
//   useEffect(()=>{ if(open) setTab(current ?? 'MEETS') }, [open, current])
//   const order: BandKey[] = ['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS']
//   const rb = performanceRubric.research
//   return (
//     <div className={cn('fixed inset-0 z-50', open ? '' : 'hidden')}>
//       <div className="absolute inset-0 bg-black/50" onClick={()=>onOpenChange(false)} />
//       <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[92vw] max-w-2xl p-4">
//         <div className="flex items-start justify-between">
//           <div>
//             <div className="text-lg font-semibold">Research & Scientific Activities — Rubric</div>
//             <div className="text-sm text-muted-foreground">Weight: {rb.weight}%</div>
//           </div>
//           <button className="text-sm text-muted-foreground" onClick={()=>onOpenChange(false)}>Close</button>
//         </div>

//         <div className="mt-3">
//           <div className="flex flex-wrap gap-2">
//             {order.map(k=>(
//               <button
//                 key={k}
//                 className={cn('px-3 py-1 rounded-full border text-sm',
//                   tab===k ? 'bg-primary text-primary-foreground border-primary':'bg-white hover:bg-accent')}
//                 onClick={()=>setTab(k)}
//               >
//                 {BAND_LABEL[k]} ({rb.bands[k].points})
//               </button>
//             ))}
//           </div>

//           <div className="mt-4 space-y-2">
//             <div className="font-medium">
//               {BAND_LABEL[tab]} — {rb.bands[tab].points} pts
//             </div>
//             <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{rb.bands[tab].summary}</pre>
//           </div>
//         </div>

//         <div className="mt-4 flex justify-end gap-2">
//           <Button variant="secondary" onClick={()=>onOpenChange(false)}>Cancel</Button>
//           <Button onClick={()=>{ onUse(tab); onOpenChange(false) }}>Use this band</Button>
//         </div>
//       </div>
//     </div>
//   )
// }

// /* ===================== Main Component ===================== */
// export default function EvaluationForm({ appraisal }:{ appraisal: AppraisalLite }) {
//   const readOnly = appraisal.status === 'SCORES_SENT' || appraisal.status === 'COMPLETE'
//   const myEval = useMemo(
//     () => appraisal.evaluations?.find(e=>e.role==='HOD') ?? appraisal.evaluations?.find(e=>e.role==='DEAN') ?? null,
//     [appraisal.evaluations]
//   )

//   const [saving, setSaving] = useState(false)

//   /* ---------- Section 1 State ---------- */
//   const [research, setResearch] = useState({
//     band: myEval?.researchBand ?? undefined as BandKey|undefined,
//     score: myEval?.researchPts ?? undefined as number|undefined,
//     explanation: myEval?.researchExplanation ?? '',
//     note: myEval?.researchNote ?? ''
//   })
//   const [uni, setUni] = useState({
//     band: myEval?.universityServiceBand ?? undefined as BandKey|undefined,
//     score: myEval?.universityServicePts ?? undefined as number|undefined,
//     explanation: myEval?.universityServiceExplanation ?? '',
//     note: myEval?.universityServiceNote ?? ''
//   })
//   const [comm, setComm] = useState({
//     band: myEval?.communityServiceBand ?? undefined as BandKey|undefined,
//     score: myEval?.communityServicePts ?? undefined as number|undefined,
//     explanation: myEval?.communityServiceExplanation ?? '',
//     note: myEval?.communityServiceNote ?? ''
//   })
//   const [teach, setTeach] = useState({
//     band: myEval?.teachingBand ?? undefined as BandKey|undefined,
//     score: myEval?.teachingPts ?? undefined as number|undefined,
//     explanation: myEval?.teachingExplanation ?? '',
//     note: myEval?.teachingNote ?? ''
//   })
//   const [viewOpen, setViewOpen] = useState(false)

//   async function patchCriterion(payload: any) {
//     setSaving(true)
//     try {
//       await fetch(`/api/appraisals/${appraisal.id}/evaluation/criterion`, {
//         method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload)
//       })
//     } finally { setSaving(false) }
//   }

//   function selectBand(kind:'research'|'university'|'community'|'teaching', b:BandKey) {
//     const pts = PERF_POINTS[kind][b]
//     const summary = (performanceRubric as any)[kind].bands[b].summary as string

//     if (kind==='research') {
//       const next = { ...research, band:b, score:pts, explanation:summary }
//       setResearch(next)
//       patchCriterion({ criterion:'research', band:b, score:pts, explanation:summary, note:research.note })
//     }
//     if (kind==='university') {
//       const next = { ...uni, band:b, score:pts, explanation:summary }
//       setUni(next)
//       patchCriterion({ criterion:'universityService', band:b, score:pts, explanation:summary, note:uni.note })
//     }
//     if (kind==='community') {
//       const next = { ...comm, band:b, score:pts, explanation:summary }
//       setComm(next)
//       patchCriterion({ criterion:'communityService', band:b, score:pts, explanation:summary, note:comm.note })
//     }
//     if (kind==='teaching') {
//       const next = { ...teach, band:b, score:pts, explanation:summary }
//       setTeach(next)
//       patchCriterion({ criterion:'teaching', band:b, score:pts, explanation:summary, note:teach.note })
//     }
//   }

//   async function computeTeachingFromCourses() {
//     const res = await fetch(`/api/appraisals/${appraisal.id}/evaluation/compute-teaching`, { method:'POST' })
//     const j = await res.json()
//     if (res.ok) setTeach(p=>({ ...p, band:j.band as BandKey, score:j.score, explanation:j.explanation }))
//     else alert(j.error || 'Failed to compute teaching')
//   }
//   async function computeUniversity() {
//     const res = await fetch(`/api/appraisals/${appraisal.id}/evaluation/compute-university-service`, { method:'POST' })
//     const j = await res.json()
//     if (res.ok) setUni(p=>({ ...p, band:j.band as BandKey, score:j.score, explanation:j.explanation }))
//     else alert(j.error || 'Failed to compute university service')
//   }
//   async function computeCommunity() {
//     const res = await fetch(`/api/appraisals/${appraisal.id}/evaluation/compute-community-service`, { method:'POST' })
//     const j = await res.json()
//     if (res.ok) setComm(p=>({ ...p, band:j.band as BandKey, score:j.score, explanation:j.explanation }))
//     else alert(j.error || 'Failed to compute community service')
//   }

//   const totalSection1 =
//     (research.score ?? 0) +
//     (uni.score ?? 0) +
//     (comm.score ?? 0) +
//     (teach.score ?? 0)

//   /* ---------- Section 2 State ---------- */
//   const CAP_ORDER: CapKey[] = [
//     'institutionalCommitment',
//     'collaborationTeamwork',
//     'professionalism',
//     'clientService',
//     'achievingResults',
//   ]

//   // hydrate from saved JSON if available
//   const initialCapSelections: Partial<Record<CapKey, BandKey>> = useMemo(()=>{
//     const store = (myEval?.capabilitiesDetailJson ?? {}) as Record<string, any>
//     const m: Partial<Record<CapKey, BandKey>> = {}
//     CAP_ORDER.forEach(k=>{
//       const row = store[k]
//       if (row?.band) m[k] = row.band as BandKey
//     })
//     return m
//   }, [myEval?.capabilitiesDetailJson])

//   const [capSelections, setCapSelections] = useState<Partial<Record<CapKey, BandKey>>>(initialCapSelections)
//   const capPicked = CAP_ORDER.reduce((n,k)=> n + (capSelections[k] ? 1 : 0), 0)
//   const capLocalTotal = CAP_ORDER.reduce((sum, k)=>{
//     const b = capSelections[k]; return sum + (b ? CAP_POINTS_20[b] : 0)
//   }, 0) // out of 100
//   const [capSaved, setCapSaved] = useState<number|undefined>(myEval?.capabilitiesPts ?? undefined)

//   function pickCap(k: CapKey, b: BandKey) {
//     setCapSelections(prev=>({ ...prev, [k]: b }))
//   }

//   async function saveCapabilities() {
//     setSaving(true)
//     try {
//       const res = await fetch(`/api/appraisals/${appraisal.id}/evaluation/capabilities`, {
//         method: 'PATCH',
//         headers: { 'Content-Type':'application/json' },
//         body: JSON.stringify({ selections: capSelections }) 
//       })
//       const j = await res.json()
//       if (!res.ok) throw new Error(j.error || 'Failed')
//       setCapSaved(j.capabilitiesPts ?? capLocalTotal)
//     } catch (e:any) {
//       alert(e.message || 'Failed to save capabilities')
//     } finally {
//       setSaving(false)
//     }
//   }

//   /* ---------- Workflow ---------- */
//   const section1Done = [research.score, uni.score, comm.score, teach.score].every(v=>typeof v==='number')
//   const section2Done = CAP_ORDER.every(k => !!capSelections[k]) || typeof capSaved === 'number'
//   const canSend = !readOnly && section1Done && section2Done

//   async function sendScores(){
//     const res = await fetch(`/api/appraisals/${appraisal.id}/workflow/send-scores`, { method:'POST' })
//     if (!res.ok){ const j = await res.json().catch(()=>({})); alert(j.error || 'Failed'); return }
//     location.reload()
//   }

//   /* ===================== RENDER ===================== */
//   return (
//     <div className="space-y-6">
//       {/* =================== Section 1 =================== */}
//       <Card>
//         <CardHeader>
//           <CardTitle> Evaluation of Performance</CardTitle>
//           <CardDescription>Choose a band for each criterion. Score and explanation fill automatically from the official rubric. “View” is available for Research only.</CardDescription>
//         </CardHeader>

//         <CardContent className="space-y-6">
//           {/* Header Row */}
//           <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-sm font-medium text-muted-foreground">
//             <div className="md:col-span-5">Criteria</div>
//             <div className="md:col-span-2">Score</div>
//             <div className="md:col-span-5">Explanation</div>
//           </div>

//           {/* Research */}
//           <div className="rounded-2xl border p-4 bg-white">
//             <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
//               <div className="md:col-span-5">
//                 <div className="font-medium">Research & Scientific Activities</div>
//                 <div className="text-xs text-muted-foreground">Weight: 30%</div>
//               </div>
//               <div className="md:col-span-2">
//                 <Badge variant="secondary">
//                   {research.band ? `${BAND_LABEL[research.band]} (${research.score})` : '—'}
//                 </Badge>
//               </div>
//                 <div className="md:col-span-5">
//                 <Explanation text={research.explanation} />
//                 </div>
//             </div>
//             <div className="mt-3 flex flex-wrap items-center gap-2">
//               <BandChips value={research.band} onChange={(b)=>selectBand('research', b)} disabled={readOnly || saving}/>
//               <Button variant="outline" size="sm" onClick={()=>setViewOpen(true)} disabled={readOnly}>View</Button>
//             </div>
//             <div className="mt-3">
//               <Label>Note</Label>
//               <Textarea
//                 value={research.note}
//                 onChange={(e)=> setResearch(p=>({ ...p, note:e.target.value }))}
//                 onBlur={()=> patchCriterion({ criterion:'research', band:research.band, score:research.score, explanation:research.explanation, note:research.note })}
//                 disabled={readOnly || saving}
//                 placeholder="Add your note for this criterion…"
//                 className="mt-1"
//               />
//             </div>
//           </div>

//           {/* University Service */}
//           <div className="rounded-2xl border p-4 bg-white">
//             <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
//               <div className="md:col-span-5">
//                 <div className="font-medium">University Service</div>
//                 <div className="text-xs text-muted-foreground">Weight: 20%</div>
//               </div>
//               <div className="md:col-span-2">
//                 <Badge variant="secondary">
//                   {uni.band ? `${BAND_LABEL[uni.band]} (${uni.score})` : '—'}
//                 </Badge>
//               </div>
//                 <div className="md:col-span-5">
//                 <Explanation text={uni.explanation} />
//                 </div>

//             </div>
//             <div className="mt-3 flex flex-wrap items-center gap-2">
//               <BandChips value={uni.band} onChange={(b)=>selectBand('university', b)} disabled={readOnly || saving}/>
//               <Button variant="outline" size="sm" onClick={computeUniversity} disabled={readOnly || saving}>Compute</Button>
//             </div>
//             <div className="mt-3">
//               <Label>Note</Label>
//               <Textarea
//                 value={uni.note}
//                 onChange={(e)=> setUni(p=>({ ...p, note:e.target.value }))}
//                 onBlur={()=> patchCriterion({ criterion:'universityService', band:uni.band, score:uni.score, explanation:uni.explanation, note:uni.note })}
//                 disabled={readOnly || saving}
//                 placeholder="Add your note for this criterion…"
//                 className="mt-1"
//               />
//             </div>
//           </div>

//           {/* Community Service */}
//           <div className="rounded-2xl border p-4 bg-white">
//             <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
//               <div className="md:col-span-5">
//                 <div className="font-medium">Community Service</div>
//                 <div className="text-xs text-muted-foreground">Weight: 20%</div>
//               </div>
//               <div className="md:col-span-2">
//                 <Badge variant="secondary">
//                   {comm.band ? `${BAND_LABEL[comm.band]} (${comm.score})` : '—'}
//                 </Badge>
//               </div>
//                 <div className="md:col-span-5">
//                 <Explanation text={comm.explanation} />
//                 </div>

//             </div>
//             <div className="mt-3 flex flex-wrap items-center gap-2">
//               <BandChips value={comm.band} onChange={(b)=>selectBand('community', b)} disabled={readOnly || saving}/>
//               <Button variant="outline" size="sm" onClick={computeCommunity} disabled={readOnly || saving}>Compute</Button>
//             </div>
//             <div className="mt-3">
//               <Label>Note</Label>
//               <Textarea
//                 value={comm.note}
//                 onChange={(e)=> setComm(p=>({ ...p, note:e.target.value }))}
//                 onBlur={()=> patchCriterion({ criterion:'communityService', band:comm.band, score:comm.score, explanation:comm.explanation, note:comm.note })}
//                 disabled={readOnly || saving}
//                 placeholder="Add your note for this criterion…"
//                 className="mt-1"
//               />
//             </div>
//           </div>

//           {/* Quality of Teaching */}
//           <div className="rounded-2xl border p-4 bg-white">
//             <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
//               <div className="md:col-span-5">
//                 <div className="font-medium">Quality of Teaching</div>
//                 <div className="text-xs text-muted-foreground">Weight: 30%</div>
//               </div>
//               <div className="md:col-span-2">
//                 <Badge variant="secondary">
//                   {teach.band ? `${BAND_LABEL[teach.band]} (${teach.score})` : '—'}
//                 </Badge>
//               </div>
//                 <div className="md:col-span-5">
//                 <Explanation text={teach.explanation} />
//                 </div>

//             </div>
//             <div className="mt-3 flex flex-wrap items-center gap-2">
//               <BandChips value={teach.band} onChange={(b)=>selectBand('teaching', b)} disabled={readOnly || saving}/>
//               <Button variant="outline" size="sm" onClick={computeTeachingFromCourses} disabled={readOnly || saving}>Compute from Courses</Button>
//             </div>
//             <div className="mt-3">
//               <Label>Note</Label>
//               <Textarea
//                 value={teach.note}
//                 onChange={(e)=> setTeach(p=>({ ...p, note:e.target.value }))}
//                 onBlur={()=> patchCriterion({ criterion:'teaching', band:teach.band, score:teach.score, explanation:teach.explanation, note:teach.note })}
//                 disabled={readOnly || saving}
//                 placeholder="Add your note for this criterion…"
//                 className="mt-1"
//               />
//             </div>
//           </div>

//           {/* Totals for Section 1 */}
//           <div className="rounded-2xl border p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//             <div className="text-sm text-muted-foreground">Section 1 Total (Research 30 + University 20 + Community 20 + Teaching 30)</div>
//             <div className="text-2xl font-bold">{totalSection1.toFixed(2)} / 100</div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* =================== Section 2 — Capabilities (no View) =================== */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Capabilities</CardTitle>
//           <CardDescription>Pick a band for each capability. Explanation is auto-filled from the official rubric. No “View” button for this section.</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {CAP_ORDER.map(k=>{
//             const selected = capSelections[k]
//             const explanation = selected ? CAP_EXPLANATIONS[k][selected] : ''
//             return (
//               <div key={k} className="rounded-2xl border p-4 bg-white space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="font-medium">{CAP_LABEL[k]}</div>
//                   <Badge variant="secondary">{selected ? `${BAND_LABEL[selected]} (${CAP_POINTS_20[selected]})` : '—'}</Badge>
//                 </div>
//                 <BandChips value={selected} onChange={(b)=>pickCap(k,b)} disabled={readOnly || saving}/>
//                 <div>
//                   <Label>Explanation</Label>
//                   <Textarea readOnly value={explanation} className="mt-1 min-h-[120px]" />
//                 </div>
//               </div>
//             )
//           })}

//           {/* Totals for Section 2 */}
//           <div className="rounded-2xl border p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//             <div className="text-sm text-muted-foreground">
//               Selected {capPicked}/5 capabilities.
//             </div>
//             <div className="flex items-center gap-3">
//               <Badge variant="outline">Preview: {capLocalTotal} / 100</Badge>
//               <Badge variant="secondary">{typeof capSaved === 'number' ? `Saved: ${capSaved} / 100` : 'Not saved'}</Badge>
//               <Button onClick={saveCapabilities} disabled={readOnly || saving || capPicked===0}>Save Capabilities</Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ======= Final Actions ======= */}
//       <Card>
//         <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4">
//           <div className="text-sm text-muted-foreground">
//             First compute/save moves appraisal to <b>IN_REVIEW</b>. Send Scores is enabled when both sections are complete.
//           </div>
//           <Button onClick={sendScores} disabled={!canSend || saving}>Send Scores</Button>
//         </CardContent>
//       </Card>

//       {/* Research rubric modal */}
//       <ResearchRubricModal
//         open={viewOpen}
//         onOpenChange={setViewOpen}
//         current={research.band}
//         onUse={(b)=>selectBand('research', b)}
//       />
//     </div>
//   )
// }









'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Eye, Save, Calculator, Info } from 'lucide-react'
import router from 'next/router'

// ---------- Types ----------
type EvalRole = 'HOD' | 'DEAN'
type BandKey = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'
type PerfKey = 'research'|'university'|'community'|'teaching'

const BAND_LABEL: Record<BandKey,string> = {
  HIGH: 'Highly Exceeds',
  EXCEEDS: 'Exceeds',
  MEETS: 'Fully Meets',
  PARTIAL: 'Partially Meets',
  NEEDS: 'Needs Improvement',
}
const BAND_ORDER: BandKey[] = ['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS']

type PerfState = Record<PerfKey, {
  band?: BandKey
  points?: number
  note?: string
  explanation?: string
}>

type CapState = Record<string, {
  band?: BandKey
  points?: number
  note?: string
  explanation?: string
}>

// ---------- Shared helpers ----------
const CAP_PFX = {
  HIGH: 'Work characterized by a very high degree of professionalism (90%–100%):',
  EXCEEDS: 'Work characterized by a high degree of professionalism (80%–89%):',
  MEETS: 'Work characterized by a good degree of professionalism (60%–79%):',
  PARTIAL: 'Work characterized by an average degree of professionalism (50%–59%):',
  NEEDS: 'Work characterized by a degree of professionalism lower than 50%:',
}

function numbered(lines: string[]): string {
  const withNums = lines.map((l, i) => {
    const trimmed = l.trim()
    if (!trimmed) return ''
    const already = /^\d+[\).]/.test(trimmed)
    return already ? trimmed : `${i+1}) ${trimmed}`
  })
  return withNums.join('\n')
}
function formatNumbered(text: string) {
  return text.split('\n').map((line, i) => <div key={i}>{line}</div>)
}

// ---------- Role Rubrics: Section 1 (Performance) ----------
const S1_API_KEY: Record<PerfKey, 'research'|'universityService'|'communityService'|'teaching'> = {
  research: 'research',
  university: 'universityService',
  community: 'communityService',
  teaching: 'teaching',
}

const PERF_HOD = {
  research:   { weight: 30, bands: {
    HIGH:    { points: 30, summary: numbered([
      'Completion of one of the following:',
      'Publishing 3 or more international research papers.',
      'Publishing 2 or more international books.',
      'Completing 3 or more contract projects.',
      '2 international papers + an international book + a contract project + reviewing an international paper.',
      'One or more internationally registered patents.',
      '3 of the items mentioned in the "exceeds expectations" column.',
    ])},
    EXCEEDS: { points: 24, summary: [
      'Completion of one of the following:',
      '1) Publishing 2 international research papers.',
      '2) Publishing an international book.',
      '3) Publishing 2 or more indexed books.',
      '4) Completing 2 contract projects.',
      '5) ONE of:',
      '   a) Int’l research paper + a book.',
      '   b) Int’l research paper + a contract project.',
      '   c) Int’l research paper + reviewing an int’l paper.',
      '   d) Int’l research paper + participating as speaker at an int’l conference.',
      '6) 3 of the items mentioned in the "fully meets" column.',
      '7) Registration of one or more patents.',
    ].join('\n')},
    MEETS:   { points: 18, summary: numbered([
      'Completion of one of the following:',
      'Publishing an international research paper.',
      'Publishing an indexed book.',
      'Completion of a contract project.',
      'Reviewing 2 or more international research papers.',
      'Participating as a speaker at an international conference.',
      'Registration of a patent.',
    ])},
    PARTIAL: { points: 12, summary: numbered([
      'Completion of one of the following:',
      'Publishing in a local journal.',
      'Publishing informative articles.',
      'Participating in one or more conferences.',
    ])},
    NEEDS:   { points:  6, summary: numbered([
      'Work characterized by all or part of the following:',
      'No accomplishments as per the items in "Partially Meets"; other accomplishments (if any) should be mentioned.',
    ])},
  }},
  university: { weight: 20, bands: {
    HIGH:    { points: 20, summary: numbered([
      'Completion of 5 or more of the following:',
      'Participating in standing/ad-hoc committees.',
      'Conferences/workshops/seminars (chair/coordinator/member).',
      'Delivering at least one lecture (dept/college/university).',
      'Development initiatives (research/administrative).',
      'Academic program adopted/discussed by University Council.',
      'Other services (e.g., admission interviews).',
      'Supervising Ph.D./Master/graduation projects.',
    ])},
    EXCEEDS: { points: 16, summary: numbered([
      'Completion of 4 of the items above.',
      'Standing/ad-hoc committees.',
      'Conferences/workshops/seminars (chair/coordinator/member).',
      'One lecture (dept/college/university).',
      'Development initiatives (research/administrative).',
      'Program adopted/discussed by University Council.',
      'Other services (e.g., admission interviews).',
      'Supervising Ph.D./Master/graduation projects.',
    ])},
    MEETS:   { points: 12, summary: numbered([
      'Completion of 3 of the items above.',
      'Standing/ad-hoc committees.',
      'Conferences/workshops/seminars (chair/coordinator/member).',
      'One lecture (dept/college/university).',
      'Development initiatives (research/administrative).',
      'Program adopted/discussed by University Council.',
      'Other services (e.g., admission interviews).',
      'Supervising Ph.D./Master/graduation projects.',
    ])},
    PARTIAL: { points:  8, summary: numbered([
      'Completion of 2 of the items above.',
      'Standing/ad-hoc committees.',
      'Conferences/workshops/seminars.',
      'One lecture.',
      'Development initiatives.',
      'Program proposal.',
      'Other services.',
      'Supervising projects.',
    ])},
    NEEDS:   { points:  4, summary: numbered([
      'Completion of one of the items above.',
    ])},
  }},
  community: { weight: 20, bands: {
    HIGH:    { points: 20, summary: numbered([
      'Completion of 5 or more items:',
      'Public lectures.',
      'Professional/cultural societies.',
      'Technical/ad-hoc committees/boards.',
      'Consultations/workshops/seminars.',
      'Media activities (articles/TV/radio).',
      'Judge/referee in contests.',
      'Other community services.',
    ])},
    EXCEEDS: { points: 16, summary: numbered([
      'Completion of 4 of the items above.',
    ])},
    MEETS:   { points: 12, summary: numbered([
      'Completion of 3 of the items above.',
    ])},
    PARTIAL: { points:  8, summary: numbered([
      'Completion of 2 of the items above.',
    ])},
    NEEDS:   { points:  4, summary: numbered([
      'Completion of 1 of the items above.',
    ])},
  }},
  teaching:  { weight: 30, bands: {
    HIGH:    { points: 30, summary: 'Student evaluation not less than 90%.' },
    EXCEEDS: { points: 24, summary: 'Student evaluation between 80%–89%.' },
    MEETS:   { points: 18, summary: 'Student evaluation between 60%–79%.' },
    PARTIAL: { points: 12, summary: 'Student evaluation between 50%–59%.' },
    NEEDS:   { points:  6, summary: 'Student evaluation less than 50%.' },
  }},
} as const

// Dean → HOD (الأوزان المختلفة: University 30, Teaching 20)
const PERF_DEAN = {
  research:   { weight: 30, bands: PERF_HOD.research.bands },
  university: { weight: 30, bands: {
    HIGH:    { points: 30, summary: numbered([
      'Completion of 5 or more items (6 pts each):',
      'Standing/ad-hoc committees.',
      'Conferences/workshops/seminars (chair/coordinator/member).',
      'One lecture (dept/college/university).',
      'Development initiatives (research/administrative).',
      'Academic program adopted by University Council.',
      'Other services (e.g., admission interviews).',
    ])},
    EXCEEDS: { points: 24, summary: numbered([
      'Completion of 4 of the items above (6 pts each).',
    ])},
    MEETS:   { points: 18, summary: numbered([
      'Completion of 3 of the items above (6 pts each).',
    ])},
    PARTIAL: { points: 12, summary: numbered([
      'Completion of 2 of the items above (6 pts each).',
    ])},
    NEEDS:   { points:  6, summary: numbered([
      'Completion of one of the items above (6 pts).',
    ])},
  }},
  community:  { weight: 20, bands: PERF_HOD.community.bands },
  teaching:   { weight: 20, bands: {
    HIGH:    { points: 20, summary: 'Student evaluation not less than 90%.' },
    EXCEEDS: { points: 16, summary: 'Student evaluation between 80%–89%.' },
    MEETS:   { points: 12, summary: 'Student evaluation between 60%–79%.' },
    PARTIAL: { points:  8, summary: 'Student evaluation between 50%–59%.' },
    NEEDS:   { points:  4, summary: 'Student evaluation less than 50%.' },
  }},
} as const

// ---------- Role Rubrics: Section 2 (Capabilities) ----------
const CAPS_HOD = {
  keys: [
    'institutionalCommitment',
    'collaborationTeamwork',
    'professionalism',
    'clientService',
    'achievingResults',
  ],
  titles: {
    institutionalCommitment: '1) Institutional Commitment',
    collaborationTeamwork:   '2) Collaboration & Teamwork',
    professionalism:         '3) Professionalism',
    clientService:           '4) Client Service',
    achievingResults:        '5) Achieving Results',
  } as Record<string,string>,
  points: { HIGH: 20, EXCEEDS: 16, MEETS: 12, PARTIAL: 8, NEEDS: 4 } as Record<BandKey, number>,
  explanations: {
    institutionalCommitment: {
      HIGH: [CAP_PFX.HIGH,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
    },
    collaborationTeamwork: {
      HIGH: [CAP_PFX.HIGH,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Collaborates with colleagues and works within a team.','2) Participates in conducting workshops/programs at the Unit for Teaching Excellence & Leadership.'].join('\n'),
    },
    professionalism: {
      HIGH: [CAP_PFX.HIGH,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Sets comprehensive plans for teaching & evaluating courses.','2) Committed to syllabus implementation.','3) Develops courses regularly.','4) Uses varied assessments; writes exams & tools skillfully.','5) Completes HEA CPD fellowship (UK) via accredited UoB program.'].join('\n'),
    },
    clientService: {
      HIGH: [CAP_PFX.HIGH,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning.','5) Committed to academic advising.'].join('\n'),
    },
    achievingResults: {
      HIGH: [CAP_PFX.HIGH,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Reports on conferences & uses recommendations.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Reports on conferences & uses recommendations.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Reports on conferences & uses recommendations.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Reports on conferences & uses recommendations.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Submits a comprehensive portfolio on taught courses.','2) Gives feedback on tests & assignments.','3) Participates in accreditation/institutional review (ETQA).','4) Keeps contact with graduates & conveys proposals.','5) Reports on conferences & uses recommendations.'].join('\n'),
    },
  } as Record<string, Record<BandKey,string>>,
}

const CAPS_DEAN = {
  keys: [
    'institutionalCommitment',
    'customerService',
    'leadingIndividuals',
    'leadingChange',
    'strategicVision',
  ],
  titles: {
    institutionalCommitment: '1) Institutional Commitment',
    customerService:         '2) Customer Service',
    leadingIndividuals:      '3) Leading Individuals',
    leadingChange:           '4) Leading Change',
    strategicVision:         '5) Strategic Vision',
  } as Record<string,string>,
  points: { HIGH: 20, EXCEEDS: 16, MEETS: 12, PARTIAL: 8, NEEDS: 4 } as Record<BandKey, number>,
  explanations: {
    institutionalCommitment: {
      HIGH: [CAP_PFX.HIGH,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Observes University traditions, customs and values.','2) Adheres to regulations, rules and decisions.','3) Effectively carries out mandated tasks.','4) Adheres to time and deadlines.','5) Addresses problems and proposes suitable solutions.','6) Constantly develops self via university programs (in-person/remote).'].join('\n'),
    },
    customerService: {
      HIGH: [CAP_PFX.HIGH,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning means.','5) Communicates with staff/students, solves problems, facilitates needs via contacting concerned faculty.','6) Provides feedback to students on exams/assignments.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning means.','5) Communicates with staff/students, solves problems, facilitates needs via contacting concerned faculty.','6) Provides feedback to students on exams/assignments.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning means.','5) Communicates with staff/students, solves problems, facilitates needs via contacting concerned faculty.','6) Provides feedback to students on exams/assignments.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning means.','5) Communicates with staff/students, solves problems, facilitates needs via contacting concerned faculty.','6) Provides feedback to students on exams/assignments.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Employs different teaching methods.','2) Organized; communicates ideas clearly.','3) Uses modern technology in teaching.','4) Utilizes e-learning means.','5) Communicates with staff/students, solves problems, facilitates needs via contacting concerned faculty.','6) Provides feedback to students on exams/assignments.'].join('\n'),
    },
    leadingIndividuals: {
      HIGH: [CAP_PFX.HIGH,'1) Manages faculty members with high professionalism.','2) Develops members’ capabilities (encourage / propose development courses).','3) Delegates tasks suitably; forms committees; follows up performance.','4) Encourages effective participation and a free, creative, disciplined environment.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Manages faculty members with high professionalism.','2) Develops members’ capabilities (encourage / propose development courses).','3) Delegates tasks suitably; forms committees; follows up performance.','4) Encourages effective participation and a free, creative, disciplined environment.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Manages faculty members with high professionalism.','2) Develops members’ capabilities (encourage / propose development courses).','3) Delegates tasks suitably; forms committees; follows up performance.','4) Encourages effective participation and a free, creative, disciplined environment.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Manages faculty members with high professionalism.','2) Develops members’ capabilities (encourage / propose development courses).','3) Delegates tasks suitably; forms committees; follows up performance.','4) Encourages effective participation and a free, creative, disciplined environment.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Manages faculty members with high professionalism.','2) Develops members’ capabilities (encourage / propose development courses).','3) Delegates tasks suitably; forms committees; follows up performance.','4) Encourages effective participation and a free, creative, disciplined environment.'].join('\n'),
    },
    leadingChange: {
      HIGH: [CAP_PFX.HIGH,'1) Realizes the University’s development vision & implements its plan.','2) Flexible with development/change aligned with University & Kingdom strategies (Higher Education / Research).','3) Contributes to department development in various areas.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Realizes the University’s development vision & implements its plan.','2) Flexible with development/change aligned with University & Kingdom strategies (Higher Education / Research).','3) Contributes to department development in various areas.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Realizes the University’s development vision & implements its plan.','2) Flexible with development/change aligned with University & Kingdom strategies (Higher Education / Research).','3) Contributes to department development in various areas.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Realizes the University’s development vision & implements its plan.','2) Flexible with development/change aligned with University & Kingdom strategies (Higher Education / Research).','3) Contributes to department development in various areas.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Realizes the University’s development vision & implements its plan.','2) Flexible with development/change aligned with University & Kingdom strategies (Higher Education / Research).','3) Contributes to department development in various areas.'].join('\n'),
    },
    strategicVision: {
      HIGH: [CAP_PFX.HIGH,'1) Sets an action plan based on the University strategy during his/her term.','2) Proposes new academic programs via committees exploring labor market needs.','3) Regularly identifies strengths/weaknesses and proposes adequate solutions.','4) Proposes program amendments to the University Council aligned with market and reviewers.'].join('\n'),
      EXCEEDS: [CAP_PFX.EXCEEDS,'1) Sets an action plan based on the University strategy during his/her term.','2) Proposes new academic programs via committees exploring labor market needs.','3) Regularly identifies strengths/weaknesses and proposes adequate solutions.','4) Proposes program amendments to the University Council aligned with market and reviewers.'].join('\n'),
      MEETS: [CAP_PFX.MEETS,'1) Sets an action plan based on the University strategy during his/her term.','2) Proposes new academic programs via committees exploring labor market needs.','3) Regularly identifies strengths/weaknesses and proposes adequate solutions.','4) Proposes program amendments to the University Council aligned with market and reviewers.'].join('\n'),
      PARTIAL: [CAP_PFX.PARTIAL,'1) Sets an action plan based on the University strategy during his/her term.','2) Proposes new academic programs via committees exploring labor market needs.','3) Regularly identifies strengths/weaknesses and proposes adequate solutions.','4) Proposes program amendments to the University Council aligned with market and reviewers.'].join('\n'),
      NEEDS: [CAP_PFX.NEEDS,'1) Sets an action plan based on the University strategy during his/her term.','2) Proposes new academic programs via committees exploring labor market needs.','3) Able to discover strengths/weaknesses; proposes solutions.','4) Proposes program amendments aligned with labor market and reviewers.'].join('\n'),
    },
  } as Record<string, Record<BandKey,string>>,
}

// ---------- Role Config ----------
const ROLE_CFG = {
  HOD: {
    section1Title: 'Evaluation of Performance',
    perf: PERF_HOD,
    cap: CAPS_HOD,
  },
  DEAN: {
    section1Title: 'Evaluation of Performance (Dean → HOD)',
    perf: PERF_DEAN,
    cap: CAPS_DEAN,
  }
} as const

// ---------- Component ----------
type Props = {
  appraisalId: number
  role: EvalRole
}

export default function EvaluationForm({ appraisalId, role }: Props) {
  const cfg = ROLE_CFG[role]

  const [perf, setPerf] = useState<PerfState>({
    research: {}, university: {}, community: {}, teaching: {},
  })
  const [caps, setCaps] = useState<CapState>(
    Object.fromEntries(cfg.cap.keys.map(k => [k, {}]))
  )
  const [saving, setSaving] = useState(false)

  const performanceTotal = useMemo(() =>
    (perf.research.points ?? 0) + (perf.university.points ?? 0) +
    (perf.community.points ?? 0) + (perf.teaching.points ?? 0)
  ,[perf])

  const capabilitiesTotal = useMemo(() =>
    cfg.cap.keys.reduce((sum, k) => sum + (caps[k]?.points ?? 0), 0)
  ,[caps, cfg.cap.keys])

  const overallTotal = performanceTotal + capabilitiesTotal

  function pickPerf(key: PerfKey, band: BandKey) {
    const b = cfg.perf[key].bands[band]
    setPerf(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        band,
        points: b.points,
        explanation: [`${BAND_LABEL[band]} (${b.points} pts)`, b.summary].join('\n'),
      }
    }))
  }

  function pickCap(key: string, band: BandKey) {
    const pts = cfg.cap.points[band]
    const exp = cfg.cap.explanations[key][band]
    setCaps(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        band,
        points: pts,
        explanation: [`${BAND_LABEL[band]} (${pts} pts)`, exp].join('\n'),
      }
    }))
  }

  // APIs
const base = `/api/appraisals/${appraisalId}/evaluation`

async function patchCriterion(k: PerfKey, v: PerfState[PerfKey]) {
  if (!v?.band) return

  const payload = {
    criterion: S1_API_KEY[k],     
    band: v.band,                 
    score: v.points,              
    explanation: v.explanation,    
    note: v.note ?? undefined,   
    role,                         
  }

  const res = await fetch(`${base}/criterion`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`criterion ${k} failed (${res.status}) ${txt}`)
  }
}

async function patchCapabilities() {
    const selections: Record<string, BandKey|undefined> =
      Object.fromEntries(cfg.cap.keys.map(k => [k, caps[k]?.band]))
    return fetch(`${base}/capabilities`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ selections, role })
    })
  }

async function saveAll() {
  setSaving(true)
  try {
    await Promise.all(
      (Object.keys(perf) as PerfKey[]).map((k) => patchCriterion(k, perf[k]))
    )

    await patchCapabilities()

    alert('Saved successfully.')
  //router.push(`/hod/reviews/${appraisalId}/self-development-plan`)

  } catch (e) {
    console.error(e)
    alert('Save failed. Check console.')
  } finally {
    setSaving(false)
  }
}


  // UI blocks
  function BandRow(props: { value?: BandKey; onPick: (b:BandKey)=>void }) {
    const { value, onPick } = props
    return (
      <div className="flex flex-wrap gap-2">
        {BAND_ORDER.map(b => (
          <Button
            key={b}
            type="button"
            variant={value===b ? 'default' : 'outline'}
            onClick={() => onPick(b)}
            className="capitalize"
          >
            {BAND_LABEL[b]}
          </Button>
        ))}
      </div>
    )
  }

  function PerfCard(props: {
    k: PerfKey
    title: string
    showView?: boolean
  }) {
    const { k, title, showView } = props
    const w = cfg.perf[k].weight
    const state = perf[k]
    const selectedBand = state.band
    const score = state.points ?? 0

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                <Badge variant="secondary">{w}%</Badge>
                <Badge>{score.toFixed(0)} pts</Badge>
                {showView && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" /> View</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>{title} — Rubric</DialogTitle></DialogHeader>
                      <Tabs defaultValue="HIGH">
                        <TabsList className="flex flex-wrap">
                          {BAND_ORDER.map(b => <TabsTrigger key={b} value={b} className="capitalize">{BAND_LABEL[b]}</TabsTrigger>)}
                        </TabsList>
                        {BAND_ORDER.map(b => (
                          <TabsContent key={b} value={b} className="mt-4 space-y-3">
                            <Badge className="capitalize">{BAND_LABEL[b]} — {cfg.perf[k].bands[b].points} pts</Badge>
                            <div className="prose text-sm whitespace-pre-wrap">
                              {formatNumbered(cfg.perf[k].bands[b].summary)}
                            </div>
                            <div className="pt-2">
                              <Button onClick={() => pickPerf(k,b)} className="w-full">Use this band</Button>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <BandRow value={selectedBand} onPick={(b)=>pickPerf(k,b)} />
            </div>

            {/* Explanation on right */}
            <div className="rounded-md border p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-1 text-sm font-medium">
                <Info className="h-4 w-4" /> Explanation
              </div>
              <div className="text-sm whitespace-pre-wrap min-h-[80px]">
                {state.explanation ? formatNumbered(state.explanation) : <span className="text-muted-foreground">Select a band to auto-fill the explanation.</span>}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="mt-3">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Write an optional note..."
              value={state.note ?? ''}
              onChange={(e)=> setPerf(prev => ({ ...prev, [k]: { ...prev[k], note: e.target.value } }))}
              className="mt-1"
            />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Section item score: <span className="font-semibold">{score.toFixed(0)} / {w}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  function CapCard(props: { k: string; title: string }) {
    const { k, title } = props
    const state = caps[k]
    const selectedBand = state?.band
    const score = state?.points ?? 0

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                <Badge>Max 20%</Badge>
                <Badge>{score.toFixed(0)} pts</Badge>
              </div>
              <BandRow value={selectedBand} onPick={(b)=>pickCap(k,b)} />
            </div>

            <div className="rounded-md border p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-1 text-sm font-medium">
                <Info className="h-4 w-4" /> Explanation
              </div>
              <div className="text-sm whitespace-pre-wrap min-h-[80px]">
                {state?.explanation ? formatNumbered(state.explanation) : <span className="text-muted-foreground">Select a band to auto-fill the explanation.</span>}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="mt-3">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Write an optional note..."
              value={state?.note ?? ''}
              onChange={(e)=> setCaps(prev => ({ ...prev, [k]: { ...prev[k], note: e.target.value } }))}
              className="mt-1"
            />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Capability score: <span className="font-semibold">{score.toFixed(0)} / 20</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1 */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{cfg.section1Title}</h2>
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Section Total</CardTitle>
            <CardDescription>
              Research ({cfg.perf.research.weight}) + University ({cfg.perf.university.weight}) + Community ({cfg.perf.community.weight}) + Teaching ({cfg.perf.teaching.weight})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="text-base px-3 py-1">Section 1 Total: {performanceTotal.toFixed(0)} / 100</Badge>
          </CardContent>
        </Card>

        <PerfCard k="research"   title="1) Research & Scientific Activities" showView />
        <PerfCard k="university" title="2) University Service" showView />
        <PerfCard k="community"  title="3) Community Service" showView />
        <PerfCard k="teaching"   title="4) Quality of Teaching" showView />
      </div>

      {/* SECTION 2 */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold"> Capabilities</h2>
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Section Total</CardTitle>
            <CardDescription>5 capabilities × (20/16/12/8/4) each.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="text-base px-3 py-1">Section 2 Total: {capabilitiesTotal.toFixed(0)} / 100</Badge>
          </CardContent>
        </Card>

        {cfg.cap.keys.map((k) => (
          <CapCard key={k} k={k} title={cfg.cap.titles[k]} />
        ))}
      </div>

      {/* OVERALL */}
      <Card>
        <CardHeader>
          <CardTitle>Overall</CardTitle>
          <CardDescription>Sum of Section 1 (100) + Section 2 (100).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3 flex-wrap">
          <Badge className="text-lg px-4 py-2">Overall Total: {overallTotal.toFixed(0)} / 200</Badge>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => { /* local only */ }}>
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Score
            </Button>
            <Button type="button" onClick={saveAll} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
