import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ResourceKey =
  | 'awards'
  | 'courses'
  | 'research'
  | 'scientific'
  | 'university'
  | 'community'

const allowed: Record<ResourceKey, string[]> = {
  awards: ['name', 'area', 'organization', 'dateObtained', 'fileUrl'],
  courses: ['academicYear', 'semester', 'courseTitle', 'courseCode', 'credit', 'studentsCount', 'studentsEvalAvg'],
  research: ['title', 'kind', 'journalOrPublisher', 'participation', 'publicationDate', 'refereedArticleReference', 'fileUrl'],
  scientific: ['title', 'type', 'date', 'participation', 'organizingAuth', 'venue', 'fileUrl'],
  university: ['committeeOrTask', 'authority', 'participation', 'dateFrom', 'dateTo', 'fileUrl'],
  community: ['committeeOrTask', 'authority', 'participation', 'dateFrom', 'dateTo', 'fileUrl'],
}

const dateKeys: Record<ResourceKey, string[]> = {
  awards: ['dateObtained'],
  courses: [],
  research: ['publicationDate'],
  scientific: ['date'],
  university: ['dateFrom', 'dateTo'],
  community: ['dateFrom', 'dateTo'],
}

function pick(obj: any, keys: string[]) {
  const out: any = {}
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}

function normalizeDates(obj: any, keys: string[]) {
  for (const k of keys) if (obj[k]) obj[k] = new Date(obj[k])
}

function resourceToModel(resource: ResourceKey) {
  switch (resource) {
    case 'awards': return prisma.award
    case 'courses': return prisma.courseTaught
    case 'research': return prisma.researchActivity
    case 'scientific': return prisma.scientificActivity
    case 'university': return prisma.universityService
    case 'community': return prisma.communityService
  }
}

async function getCurrentAppraisalId(userId: number, req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cycleIdParam = searchParams.get('cycleId')
  const cycleId = cycleIdParam ? Number(cycleIdParam) : undefined
  if (cycleIdParam && Number.isNaN(cycleId)) return null

  const cycle = cycleId
    ? await prisma.appraisalCycle.findUnique({ where: { id: cycleId } })
    : await prisma.appraisalCycle.findFirst({ where: { isActive: true } })
  if (!cycle) return null

  const appraisal = await prisma.appraisal.findFirst({
    where: { facultyId: userId, cycleId: cycle.id },
  })
  return appraisal?.id ?? null
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resource, id } = await params
    const resourceKey = resource as ResourceKey
    if (!['awards','courses','research','scientific','university','community'].includes(resourceKey)) {
      return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
    const itemId = Number(id)
    if (Number.isNaN(itemId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const appraisalId = await getCurrentAppraisalId(Number(user.id), req)
    if (!appraisalId) return NextResponse.json({ error: 'No target appraisal' }, { status: 404 })

    const model = resourceToModel(resourceKey)
    const item = await (model as any).findUnique({ where: { id: itemId } })
    if (!item || item.appraisalId !== appraisalId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await (model as any).delete({ where: { id: itemId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resource, id } = await params
    const resourceKey = resource as ResourceKey
    if (!['awards','courses','research','scientific','university','community'].includes(resourceKey)) {
      return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
    }
    const itemId = Number(id)
    if (Number.isNaN(itemId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const appraisalId = await getCurrentAppraisalId(Number(user.id), req)
    if (!appraisalId) return NextResponse.json({ error: 'No target appraisal' }, { status: 404 })

    const model = resourceToModel(resourceKey)
    const item = await (model as any).findUnique({ where: { id: itemId } })
    if (!item || item.appraisalId !== appraisalId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const payload = pick(body, allowed[resourceKey])
    normalizeDates(payload, dateKeys[resourceKey])

    // normalization for courses
    if (resourceKey === 'courses') {
      if (payload.credit != null) payload.credit = Number(payload.credit)
      if (payload.studentsCount != null) payload.studentsCount = Number(payload.studentsCount)
      if (payload.studentsEvalAvg != null) payload.studentsEvalAvg = Number(payload.studentsEvalAvg)
      // Normalize semester enum values
      if (payload.semester) {
        const semesterMap: Record<string, string> = {
          "first": "FALL",
          "second": "SPRING",
          "summer": "SUMMER"
        };
        if (semesterMap[payload.semester.toLowerCase()]) {
          payload.semester = semesterMap[payload.semester.toLowerCase()];
        }
      }
    }

    if (resourceKey === 'research' && payload['kind']) {
      payload['kind'] = String(payload['kind']).toUpperCase()
    }

    const updated = await (model as any).update({ where: { id: itemId }, data: payload })
    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
