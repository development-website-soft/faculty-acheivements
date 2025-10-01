import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireHOD, requireDean } from '@/lib/auth-utils'
import { toRatingBand, UiBand } from '@/lib/rating'
import type { RatingBand } from '@prisma/client'

// UI enum
const BandEnum = z.enum(['HIGH','EXCEEDS','MEETS','PARTIAL','NEEDS'])

// اختيارات Section 2 (مفاتيح معروفة + optional)
const SelectionsSchema = z.object({
  institutionalCommitment: BandEnum.optional(),
  collaborationTeamwork:   BandEnum.optional(),
  professionalism:         BandEnum.optional(),
  clientService:           BandEnum.optional(),
  achievingResults:        BandEnum.optional(),
}).optional().default({})

const Body = z.object({
  selections: SelectionsSchema,
  note: z.string().optional().nullable(),
})

// نقاط كل Band لكل بُعد (20 كحد أقصى لكل بُعد)
const CAP_POINTS: Record<UiBand, number> = {
  HIGH: 20, EXCEEDS: 16, MEETS: 12, PARTIAL: 8, NEEDS: 4
}

// من مجموع (0–100) إلى Band إجمالي
function bandFromCapabilitiesTotal(total: number): UiBand {
  if (total >= 90) return 'HIGH'
  if (total >= 80) return 'EXCEEDS'
  if (total >= 60) return 'MEETS'
  if (total >= 50) return 'PARTIAL'
  return 'NEEDS'
}

// دمج JSON آمن لحقل rubric
function mergeRubric(existing: any, patch: any) {
  const base = (existing && typeof existing === 'object') ? existing : {}
  return { ...base, ...patch }
}

async function handler(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const appraisalId = Number(id)
  if (Number.isNaN(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  // صلاحيات: HOD أولاً ثم Dean
  let role: 'HOD' | 'DEAN' = 'HOD'
  let user = await requireHOD().catch(() => null)
  if (!user) { user = await requireDean(); role = 'DEAN' }

  const app = await prisma.appraisal.findUnique({
    where: { id: appraisalId },
    include: {
      evaluations: { where: { role } }, // نحتاج الـrubric الحالي لهذا الـrole (إن وجد)
    },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { selections, note } = Body.parse(await req.json())

  // حساب النقاط وبناء شرح مرقّم + تحويل إلى RatingBand لكل بُعد للتخزين داخل rubric
  let total = 0
  const perDimBands: Record<string, RatingBand> = {}
  const lines: string[] = []
  const order: (keyof typeof selections)[] = [
    'institutionalCommitment',
    'collaborationTeamwork',
    'professionalism',
    'clientService',
    'achievingResults',
  ]

  order.forEach((k) => {
    const ui = selections[k] as UiBand | undefined
    if (!ui) return
    total += CAP_POINTS[ui]
    perDimBands[k] = toRatingBand(ui)
    lines.push(`${lines.length + 1}. ${k}: ${ui} (${CAP_POINTS[ui]} pts)`)
  })

  const uiOverall = bandFromCapabilitiesTotal(total)
  const dbOverall: RatingBand = toRatingBand(uiOverall)

  // جهّز rubric JSON الجديد (مع إبقاء بقية المفاتيح كما هي)
  const currentEval = app.evaluations[0] ?? null
  const currentRubric = currentEval?.rubric ?? null
  const newRubric = mergeRubric(currentRubric, {
    capabilities: {
      total,                             // 0..100
      overallBand: dbOverall,            // Prisma enum
      selections: perDimBands,           // تفصيل الأبعاد كـ RatingBand
      note: note ?? null,
    }
  })

  // تخزين: capabilitiesBand + rubric (JSON). لا نستخدم حقول غير موجودة.
  await prisma.evaluation.upsert({
    where: { appraisalId_role: { appraisalId, role } },
    update: {
      capabilitiesBand: dbOverall,
      rubric: newRubric as any,
      // يمكن استخدام "notes" إن رغبت بدمج الشرح النصي:
      // notes: [currentEval?.notes, `Capabilities total: ${total}/100`, ...lines].filter(Boolean).join('\n')
    },
    create: {
      appraisalId,
      role,
      capabilitiesBand: dbOverall,
      rubric: newRubric as any,
      // notes: [`Capabilities total: ${total}/100`, ...lines].join('\n')
    },
  })

  // أول تعديل ينقل NEW → IN_REVIEW
  await prisma.appraisal.update({
    where: { id: appraisalId },
    data: { status: app.status === 'NEW' ? 'IN_REVIEW' : app.status },
  })

  return NextResponse.json({
    ok: true,
    total,                // 0..100
    band: uiOverall,      // 'HIGH' | ...
    explanation: [`Capabilities total: ${total} / 100`, ...lines].join('\n'),
  })
}

export const PATCH = handler
export const POST = handler
