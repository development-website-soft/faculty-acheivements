import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireHOD, requireDean } from '@/lib/auth-utils'

type Band = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'
function toBand(pct: number): Band {
  if (pct >= 90) return 'HIGH'
  if (pct >= 80) return 'EXCEEDS'
  if (pct >= 60) return 'MEETS'
  if (pct >= 50) return 'PARTIAL'
  return 'NEEDS'
}
const POINTS: Record<Band, number> = { HIGH:30, EXCEEDS:24, MEETS:18, PARTIAL:12, NEEDS:6 }

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const appraisalId = Number(params.id)
  if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let role: 'HOD'|'DEAN' = 'HOD'
  let user = await requireHOD().catch(() => null)
  if (!user) { user = await requireDean(); role = 'DEAN' }

  const app = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: { courses: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const vals = app.courses.map(c => c.studentsEvalAvg ?? 0)
  const avg = vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0
  const band = toBand(avg)
  const score = POINTS[band]
  const explanation = [`Students evaluation AVG: ${avg.toFixed(1)}%`, `→ ${band} (${score} pts).`].join('\n')

  const ev = await prisma.evaluation.upsert({
    where: { appraisalId_role: { appraisalId, role } },
    update: { teachingBand: band, teachingPts: score, teachingExplanation: explanation },
    create: { appraisalId, role, teachingBand: band, teachingPts: score, teachingExplanation: explanation },
  })
  const s1 = (ev.researchPts ?? 0) + (ev.universityServicePts ?? 0) + (ev.communityServicePts ?? 0) + score
  await prisma.appraisal.update({
    where: { id: appraisalId },
    data: { totalScore: s1 || null, status: app.status === 'NEW' ? 'IN_REVIEW' : app.status },
  })

  return NextResponse.json({ band, score, explanation, avg })
}
