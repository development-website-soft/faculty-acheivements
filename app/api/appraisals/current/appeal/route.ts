import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function POST(req:NextRequest){
const session = await getServerSession(authOptions)
const user = session?.user as any
if (!user) return NextResponse.json({ error:'Unauthorized' }, { status: 401 })
const { message } = await req.json().catch(()=>({}))
const cycle = await prisma.appraisalCycle.findFirst({ where: { isActive: true } })
if (!cycle) return NextResponse.json({ error:'No active cycle' }, { status: 400 })
const app = await prisma.appraisal.findFirst({ where: { cycleId: cycle.id, facultyId: parseInt(user.id) } })
if (!app || app.status !== 'sent') return NextResponse.json({ error:'Not actionable' }, { status: 400 })
await prisma.$transaction([
prisma.appraisal.update({ where: { id: app.id }, data: { status: 'returned' } }),
prisma.appeal.create({ data: { appraisalId: app.id, byUserId: parseInt(user.id), message: message ?? '' } })
])
return NextResponse.json({ ok:true })
}