import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get("cycleId")
    const format = searchParams.get("format") || "json" // json, pdf

    if (!cycleId) {
      return NextResponse.json({ error: "Cycle ID is required" }, { status: 400 })
    }

    // Get the current user ID
    const userId = session.user.id

    // Fetch appraisal data for the current user and cycle
    const appraisal = await prisma.appraisal.findFirst({
      where: {
        facultyId: parseInt(userId),
        cycleId: parseInt(cycleId),
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            academicRank: true,
            department: {
              select: {
                name: true,
                college: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        cycle: {
          select: {
            academicYear: true,
            startDate: true,
            endDate: true,
          },
        },
        awards: {
          orderBy: { dateObtained: "desc" },
        },
        courses: {
          orderBy: { createdAt: "desc" },
        },
        researchActivities: {
          orderBy: { publicationDate: "desc" },
        },
        scientificActivities: {
          orderBy: { date: "desc" },
        },
        universityServices: {
          orderBy: { dateFrom: "desc" },
        },
        communityServices: {
          orderBy: { dateFrom: "desc" },
        },
        evaluations: {
          include: {
            behaviorRatings: true,
          },
        },
      },
    })

    if (!appraisal) {
      return NextResponse.json({ error: "Appraisal not found for this cycle" }, { status: 404 })
    }

    // Calculate totals
    const totalAchievements =
      appraisal.awards.length +
      appraisal.courses.length +
      appraisal.researchActivities.length +
      appraisal.scientificActivities.length +
      appraisal.universityServices.length +
      appraisal.communityServices.length

    const reportData = {
      title: "Faculty Appraisal Report",
      generatedAt: new Date().toISOString(),
      faculty: appraisal.faculty,
      cycle: appraisal.cycle,
      appraisal: {
        id: appraisal.id,
        status: appraisal.status,
        totalScore: appraisal.totalScore,
        submittedAt: appraisal.submittedAt,
        createdAt: appraisal.createdAt,
        updatedAt: appraisal.updatedAt,
      },
      achievements: {
        total: totalAchievements,
        awards: appraisal.awards,
        courses: appraisal.courses,
        research: appraisal.researchActivities,
        scientific: appraisal.scientificActivities,
        universityServices: appraisal.universityServices,
        communityServices: appraisal.communityServices,
      },
      evaluations: appraisal.evaluations,
    }

    if (format === "pdf") {
      // For now, return JSON with a note that PDF generation would be implemented here
      // In a real implementation, you would use a PDF library like jsPDF or Puppeteer
      return NextResponse.json({
        ...reportData,
        message: "PDF generation would be implemented here using a library like jsPDF or Puppeteer",
        downloadUrl: "#" // Would be the actual PDF URL
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating faculty report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}