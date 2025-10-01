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
    const reportType = searchParams.get("type") // appraisals, achievements, performance
    const format = searchParams.get("format") || "json" // json, csv, pdf
    const academicYear = searchParams.get("academicYear")
    const userId = searchParams.get("userId")

    let data: any = {}

    switch (reportType) {
      case "appraisals":
        data = await generateAppraisalsReport(session, academicYear, userId)
        break
      case "achievements":
        data = await generateAchievementsReport(session, academicYear, userId)
        break
      case "performance":
        data = await generatePerformanceReport(session, academicYear, userId)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    if (format === "csv") {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportType}-report.csv"`,
        },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateAppraisalsReport(session: any, academicYear?: string | null, userId?: string | null) {
  const whereClause: any = {}

  // Role-based filtering
  if (session.user.role === UserRole.FACULTY) {
    whereClause.userId = session.user.id
  } else if (session.user.role === UserRole.HOD) {
    whereClause.collegeId = session.user.collegeId
    whereClause.majorId = session.user.majorId
  } else if (session.user.role === UserRole.DEAN) {
    whereClause.collegeId = session.user.collegeId
  }

  if (academicYear) whereClause.academicYear = academicYear
  if (userId) whereClause.userId = userId

  const appraisals = await prisma.appraisal.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          major: { select: { name: true } },
        },
      },
      evaluator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      evaluations: {
        include: {
          criteria: true,
        },
      },
      _count: {
        select: {
          achievements: true,
        },
      },
    },
    orderBy: { academicYear: "desc" },
  })

  return {
    title: "Appraisals Report",
    generatedAt: new Date().toISOString(),
    totalRecords: appraisals.length,
    data: appraisals,
  }
}

async function generateAchievementsReport(session: any, academicYear?: string | null, userId?: string | null) {
  const whereClause: any = {}

  // Role-based filtering
  if (session.user.role === UserRole.FACULTY) {
    whereClause.userId = session.user.id
  } else if (session.user.role === UserRole.HOD) {
    whereClause.collegeId = session.user.collegeId
    whereClause.majorId = session.user.majorId
  } else if (session.user.role === UserRole.DEAN) {
    whereClause.collegeId = session.user.collegeId
  }

  if (academicYear) whereClause.academicYear = academicYear
  if (userId) whereClause.userId = userId

  const achievements = await prisma.achievement.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          major: { select: { name: true } },
        },
      },
      college: { select: { name: true } },
      major: { select: { name: true } },
    },
    orderBy: { dateAchieved: "desc" },
  })

  const summary = {
    totalAchievements: achievements.length,
    totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
    verifiedAchievements: achievements.filter((a) => a.isVerified).length,
    categorySummary: achievements.reduce((acc: any, achievement) => {
      acc[achievement.category] = (acc[achievement.category] || 0) + 1
      return acc
    }, {}),
  }

  return {
    title: "Achievements Report",
    generatedAt: new Date().toISOString(),
    summary,
    data: achievements,
  }
}

async function generatePerformanceReport(session: any, academicYear?: string | null, userId?: string | null) {
  const whereClause: any = {}

  // Role-based filtering
  if (session.user.role === UserRole.FACULTY) {
    whereClause.userId = session.user.id
  } else if (session.user.role === UserRole.HOD) {
    whereClause.collegeId = session.user.collegeId
    whereClause.majorId = session.user.majorId
  } else if (session.user.role === UserRole.DEAN) {
    whereClause.collegeId = session.user.collegeId
  }

  if (academicYear) whereClause.academicYear = academicYear
  if (userId) whereClause.userId = userId

  const [appraisals, achievements] = await Promise.all([
    prisma.appraisal.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            major: { select: { name: true } },
          },
        },
        evaluations: {
          include: {
            criteria: true,
          },
        },
      },
    }),
    prisma.achievement.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ])

  const performanceData = appraisals.map((appraisal) => {
    const userAchievements = achievements.filter((a) => a.userId === appraisal.userId)
    return {
      user: appraisal.user,
      appraisal: {
        academicYear: appraisal.academicYear,
        status: appraisal.status,
        finalScore: appraisal.finalScore,
        evaluations: appraisal.evaluations,
      },
      achievements: {
        total: userAchievements.length,
        totalPoints: userAchievements.reduce((sum, a) => sum + a.points, 0),
        verified: userAchievements.filter((a) => a.isVerified).length,
      },
    }
  })

  return {
    title: "Performance Report",
    generatedAt: new Date().toISOString(),
    totalRecords: performanceData.length,
    data: performanceData,
  }
}

function convertToCSV(data: any): string {
  if (!data.data || data.data.length === 0) {
    return "No data available"
  }

  const headers = Object.keys(data.data[0])
  const csvContent = [
    headers.join(","),
    ...data.data.map((row: any) =>
      headers
        .map((header) => {
          const value = row[header]
          if (typeof value === "object" && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""')
          }
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(","),
    ),
  ].join("\n")

  return csvContent
}
