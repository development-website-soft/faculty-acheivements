import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EvaluationStatus, UserRole } from "@prisma/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const appraisalId = Number(id)
    if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const appraisal = await prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: {
              select: {
                name: true,
                college: { select: { name: true } }
              }
            }
          },
        },
        cycle: {
          select: {
            academicYear: true,
            semester: true
          }
        },
        evaluations: true,
        awards: true,
        courses: true,
        researchActivities: true,
        scientificActivities: true,
        universityServices: true,
        communityServices: true,
        evidences: true,
      },
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    // Check permissions
    const canView =
      session.user.id === appraisal.facultyId ||
      (session.user.role === UserRole.HOD &&
        session.user.departmentId === appraisal.faculty?.departmentId) ||
      (session.user.role === UserRole.DEAN &&
        session.user.departmentId &&
        appraisal.faculty?.department?.collegeId === session.user.department?.collegeId) ||
      session.user.role === UserRole.ADMIN

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(appraisal)
  } catch (error) {
    console.error("Error fetching appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const appraisalId = Number(id)
    if (!Number.isFinite(appraisalId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    const { action, evaluations, comments, appealReason } = await request.json()

    const appraisal = await prisma.appraisal.findUnique({
      where: { id: appraisalId },
      include: {
        faculty: true,
        evaluations: true,
      },
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found" }, { status: 404 })
    }

    // Permission checks
    const isFaculty = session.user.id === appraisal.facultyId
    const isHod = session.user.role === UserRole.HOD && session.user.departmentId === appraisal.faculty?.departmentId
    const isDean = session.user.role === UserRole.DEAN && session.user.departmentId && appraisal.faculty?.department?.collegeId === session.user.department?.collegeId
    const isAdmin = session.user.role === UserRole.ADMIN

    let updateData: any = {}

    switch (action) {
      case "submit":
        if (!isFaculty) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        updateData = {
          status: EvaluationStatus.SCORES_SENT,
          submittedAt: new Date(),
        }
        break

      case "evaluate":
        if (!(isHod || isDean || isAdmin)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        // Update criteria evaluations and calculate final score
        let totalScore = 0
        let totalWeight = 0

        if (evaluations && evaluations.length > 0) {
          for (const evaluation of evaluations) {
            await prisma.criteriaEvaluation.upsert({
              where: {
                appraisalId_criteriaId: {
                  appraisalId: appraisalId,
                  criteriaId: evaluation.criteriaId,
                },
              },
              update: {
                finalPoints: evaluation.finalPoints,
                comments: evaluation.comments,
              },
              create: {
                appraisalId: appraisalId,
                criteriaId: evaluation.criteriaId,
                finalPoints: evaluation.finalPoints,
                comments: evaluation.comments,
              },
            })

            const criteria = await prisma.evaluationCriteria.findUnique({
              where: { id: evaluation.criteriaId },
            })

            if (criteria) {
              const percentage = (evaluation.finalPoints / criteria.maxPoints) * 100
              totalScore += percentage * (criteria.weight / 100)
              totalWeight += criteria.weight
            }
          }
        }

        updateData = {
          evaluatorId: session.user.id,
          finalScore: totalWeight > 0 ? totalScore : null,
          comments,
          status: EvaluationStatus.SCORES_SENT,
          evaluatedAt: new Date(),
        }
        break

      case "approve":
        if (!isFaculty) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        updateData = {
          status: EvaluationStatus.COMPLETE,
          completedAt: new Date(),
        }
        break

      case "appeal":
        if (!isFaculty) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
        updateData = {
          status: EvaluationStatus.RETURNED,
          appealReason,
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedAppraisal = await prisma.appraisal.update({
      where: { id: appraisalId },
      data: updateData,
      include: {
        faculty: {
          select: {
            name: true,
            email: true,
          },
        },
        evaluations: true,
      },
    })

    // Create notification
    if (["evaluate", "approve", "appeal"].includes(action)) {
      const notificationUserId = action === "evaluate" ? appraisal.facultyId : updatedAppraisal.evaluations.find(e => e.role === (isDean ? UserRole.HOD : UserRole.DEAN))?.appraisalId
      if (notificationUserId) {
        await prisma.notification.create({
          data: {
            userId: notificationUserId,
            title: `Appraisal ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            message: `Your appraisal for ${updatedAppraisal.cycle.academicYear} has been ${action}.`,
            type: `APPRAISAL_${action.toUpperCase()}`,
          },
        })
      }
    }

    return NextResponse.json(updatedAppraisal)
  } catch (error) {
    console.error("Error updating appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
