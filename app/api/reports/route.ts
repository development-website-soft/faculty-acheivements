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

  // Role-based filtering using proper relationships
  if (session.user.role === UserRole.INSTRUCTOR) {
    whereClause.facultyId = parseInt(session.user.id)
  } else if (session.user.role === UserRole.HOD) {
    // HOD can see appraisals from their department
    whereClause.faculty = {
      departmentId: parseInt(session.user.departmentId || '0')
    }
  } else if (session.user.role === UserRole.DEAN) {
    // DEAN can see appraisals from their college
    whereClause.faculty = {
      department: {
        collegeId: parseInt(session.user.collegeId || '0')
      }
    }
  }

  if (academicYear) whereClause.cycle = { academicYear }
  if (userId) whereClause.facultyId = parseInt(userId)

  const appraisals = await prisma.appraisal.findMany({
    where: whereClause,
    include: {
      faculty: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: {
            select: {
              id: true,
              name: true,
              college: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
      },
      cycle: {
        select: {
          academicYear: true,
          startDate: true,
          endDate: true,
        }
      },
      evaluations: true,
      awards: true,
      courses: true,
      researchActivities: true,
      scientificActivities: true,
      universityServices: true,
      communityServices: true,
    },
    orderBy: { cycle: { academicYear: "desc" } },
  })

  return {
    title: "Appraisals Report",
    generatedAt: new Date().toISOString(),
    totalRecords: appraisals.length,
    data: appraisals,
  }
}

async function generateAchievementsReport(session: any, academicYear?: string | null, userId?: string | null) {
  // Build the base where clause for appraisals first
  const appraisalWhereClause: any = {}

  // Role-based filtering using proper relationships
  if (session.user.role === UserRole.INSTRUCTOR) {
    appraisalWhereClause.facultyId = parseInt(session.user.id)
  } else if (session.user.role === UserRole.HOD) {
    // HOD can see achievements from their department
    appraisalWhereClause.faculty = {
      departmentId: parseInt(session.user.departmentId || '0')
    }
  } else if (session.user.role === UserRole.DEAN) {
    // DEAN can see achievements from their college
    appraisalWhereClause.faculty = {
      department: {
        collegeId: parseInt(session.user.collegeId || '0')
      }
    }
  }

  if (academicYear) {
    appraisalWhereClause.cycle = { academicYear }
  }
  if (userId) {
    appraisalWhereClause.facultyId = parseInt(userId)
  }

  // Get achievements from multiple models using the correct relationship
  const [awards, researchActivities, scientificActivities, universityServices, communityServices] = await Promise.all([
    prisma.award.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.researchActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.scientificActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.universityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.communityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                department: {
                  select: {
                    name: true,
                    college: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Combine all achievements
  const allAchievements: any[] = [
    ...awards.map((a: any) => ({ ...a, type: 'Award', category: 'Awards' })),
    ...researchActivities.map((a: any) => ({ ...a, type: 'Research', category: a.kind })),
    ...scientificActivities.map((a: any) => ({ ...a, type: 'Scientific', category: a.type })),
    ...universityServices.map((a: any) => ({ ...a, type: 'University Service', category: 'Service' })),
    ...communityServices.map((a: any) => ({ ...a, type: 'Community Service', category: 'Service' })),
  ]

  const summary = {
    totalAchievements: allAchievements.length,
    totalAwards: awards.length,
    totalResearch: researchActivities.length,
    totalScientific: scientificActivities.length,
    totalUniversityServices: universityServices.length,
    totalCommunityServices: communityServices.length,
    categorySummary: allAchievements.reduce((acc: any, achievement) => {
      acc[achievement.category] = (acc[achievement.category] || 0) + 1
      return acc
    }, {}),
  }

  return {
    title: "Achievements Report",
    generatedAt: new Date().toISOString(),
    summary,
    data: allAchievements,
  }
}

async function generatePerformanceReport(session: any, academicYear?: string | null, userId?: string | null) {
  // Build the base where clause for appraisals first
  const appraisalWhereClause: any = {}

  // Role-based filtering using proper relationships
  if (session.user.role === UserRole.INSTRUCTOR) {
    appraisalWhereClause.facultyId = parseInt(session.user.id)
  } else if (session.user.role === UserRole.HOD) {
    // HOD can see appraisals from their department
    appraisalWhereClause.faculty = {
      departmentId: parseInt(session.user.departmentId || '0')
    }
  } else if (session.user.role === UserRole.DEAN) {
    // DEAN can see appraisals from their college
    appraisalWhereClause.faculty = {
      department: {
        collegeId: parseInt(session.user.collegeId || '0')
      }
    }
  }

  if (academicYear) appraisalWhereClause.cycle = { academicYear }
  if (userId) appraisalWhereClause.facultyId = parseInt(userId)

  const [appraisals, awards, researchActivities, scientificActivities, universityServices, communityServices] = await Promise.all([
    prisma.appraisal.findMany({
      where: appraisalWhereClause,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true,
                college: {
                  select: { name: true }
                }
              }
            }
          },
        },
        cycle: {
          select: {
            academicYear: true,
          }
        },
        evaluations: true,
      },
    }),
    prisma.award.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.researchActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.scientificActivity.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.universityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
    prisma.communityService.findMany({
      where: {
        appraisal: appraisalWhereClause
      },
      include: {
        appraisal: {
          select: {
            facultyId: true,
          }
        }
      },
    }),
  ])

  // Combine all achievements and group by faculty
  const allAchievements: any[] = [
    ...awards.map((a: any) => ({ ...a, type: 'Award' })),
    ...researchActivities.map((a: any) => ({ ...a, type: 'Research' })),
    ...scientificActivities.map((a: any) => ({ ...a, type: 'Scientific' })),
    ...universityServices.map((a: any) => ({ ...a, type: 'University Service' })),
    ...communityServices.map((a: any) => ({ ...a, type: 'Community Service' })),
  ]

  const achievementsByFaculty = allAchievements.reduce((acc: any, achievement) => {
    const facultyId = achievement.appraisal.facultyId
    if (!acc[facultyId]) {
      acc[facultyId] = []
    }
    acc[facultyId].push(achievement)
    return acc
  }, {})

  const performanceData = appraisals.map((appraisal) => {
    const userAchievements = achievementsByFaculty[appraisal.facultyId] || []
    return {
      faculty: appraisal.faculty,
      cycle: appraisal.cycle,
      appraisal: {
        status: appraisal.status,
        totalScore: appraisal.totalScore,
        evaluations: appraisal.evaluations,
      },
      achievements: {
        total: userAchievements.length,
        awards: userAchievements.filter((a: any) => a.type === 'Award').length,
        research: userAchievements.filter((a: any) => a.type === 'Research').length,
        scientific: userAchievements.filter((a: any) => a.type === 'Scientific').length,
        universityServices: userAchievements.filter((a: any) => a.type === 'University Service').length,
        communityServices: userAchievements.filter((a: any) => a.type === 'Community Service').length,
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
