// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/auth-utils';
// import { UserRole } from '@prisma/client';

// // A helper to unify the shape of different achievement types
// const transformAchievement = (item: any, type: string) => {
//     const base = {
//         id: `${type}-${item.id}`,
//         type,
//         faculty: item.appraisal.faculty.name,
//         department: item.appraisal.faculty.department?.name ?? 'N/A',
//         appraisalId: item.appraisalId,
//     };

//     switch (type) {
//         case 'Award': return { ...base, title: item.name, date: item.dateObtained };
//         case 'Research': return { ...base, title: item.title, date: item.publicationDate };
//         case 'Course': return { ...base, title: item.courseTitle, date: new Date(item.appraisal.cycle.startDate) }; // No specific date, use cycle start
//         default: return { ...base, title: item.title || item.name, date: item.createdAt };
//     }
// };

// export async function GET(request: Request) {
//     try {
//         const session = await getSession();
//         if (!session?.user || (session.user.role !== UserRole.DEAN && session.user.role !== UserRole.ADMIN)) {
//             return new NextResponse('Unauthorized', { status: 401 });
//         }

//         const { searchParams } = new URL(request.url);
//         const type = searchParams.get('type');
//         const search = searchParams.get('search');
//         // Other filters (cycle, department, date range) can be added here

//         const userWithDept = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) }, include: { department: true } });
//         if (!userWithDept?.department?.collegeId) {
//             return NextResponse.json({ achievements: [] });
//         }
//         const collegeId = userWithDept.department.collegeId;

//         const commonFindManyArgs = {
//             where: {
//                 appraisal: { faculty: { department: { collegeId } } },
//             },
//             include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } },
//             take: 50, // Limit results for performance
//         };

//         let results = [];
//         if (!type || type === 'Award') {
//             const awards = await prisma.award.findMany(commonFindManyArgs);
//             results.push(...awards.map(item => transformAchievement(item, 'Award')));
//         }
//         if (!type || type === 'Research') {
//             const research = await prisma.researchActivity.findMany(commonFindManyArgs);
//             results.push(...research.map(item => transformAchievement(item, 'Research')));
//         }
//         // Add other types similarly...

//         if (search) {
//             results = results.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
//         }

//         results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

//         return NextResponse.json({ achievements: results });

//     } catch (error) {
//         console.error('[DEAN_ACHIEVEMENTS_API]', error);
//         return new NextResponse('Internal Server Error', { status: 500 });
//     }
// }






// app/api/dean/achievements/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'

type DeanAchType =
  | 'Award'
  | 'Research'
  | 'UniversityService'
  | 'CommunityService'
  | 'Course'

type TargetRole = 'HOD' | 'INSTRUCTOR'

function toSafeDate(d?: Date | null): string {
  return d ? new Date(d).toISOString() : new Date(0).toISOString()
}

function transformAchievement(
  item: any,
  type: DeanAchType
): {
  id: string
  type: DeanAchType
  faculty: string
  department: string
  appraisalId: number
  title: string
  date: string
} {
  const base = {
    id: `${type}-${item.id}`,
    type,
    faculty: item.appraisal?.faculty?.name ?? 'N/A',
    department: item.appraisal?.faculty?.department?.name ?? 'N/A',
    appraisalId: Number(item.appraisalId ?? item.appraisal?.id ?? 0),
  }

  switch (type) {
    case 'Award':
      return {
        ...base,
        title: item.name ?? 'Award',
        date: toSafeDate(item.dateObtained ?? item.createdAt ?? item.appraisal?.updatedAt),
      }
    case 'Research':
      return {
        ...base,
        title: item.title ?? 'Research',
        date: toSafeDate(item.publicationDate ?? item.createdAt ?? item.appraisal?.updatedAt),
      }
    case 'UniversityService':
      return {
        ...base,
        title: item.committeeOrTask ?? 'University Service',
        date: toSafeDate(item.dateFrom ?? item.dateTo ?? item.createdAt ?? item.appraisal?.updatedAt),
      }
    case 'CommunityService':
      return {
        ...base,
        title: item.committeeOrTask ?? 'Community Service',
        date: toSafeDate(item.dateFrom ?? item.dateTo ?? item.createdAt ?? item.appraisal?.updatedAt),
      }
    case 'Course':
    default:
      return {
        ...base,
        title: item.courseTitle ?? item.title ?? 'Course',
        date: toSafeDate(item.createdAt ?? item.appraisal?.cycle?.startDate ?? item.appraisal?.updatedAt),
      }
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || (session.user.role !== UserRole.DEAN && session.user.role !== UserRole.ADMIN)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const typeParamRaw = (searchParams.get('type') || '').trim()
    const typeParam = (['Award','Research','UniversityService','CommunityService','Course'] as const)
      .includes(typeParamRaw as DeanAchType)
      ? (typeParamRaw as DeanAchType)
      : ('' as const)

    // NEW: target=HOD | INSTRUCTOR (default HOD for Dean view)
    const targetRaw = (searchParams.get('target') || 'HOD').toUpperCase()
    const target: TargetRole = targetRaw === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'HOD'

    const cycleIdParam = searchParams.get('cycleId')
    const search = (searchParams.get('search') || '').trim()

    // Dean مرتبط بقسم → نستخرج collegeId من القسم
    const me = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      include: { department: true },
    })
    const collegeId = me?.department?.collegeId
    if (!collegeId) {
      return NextResponse.json({ achievements: [] })
    }

    // فلترة الأساس: فقط مستخدمون داخل نفس الكلية وبالدور المطلوب (HOD افتراضيًا)
    const baseWhere = {
      faculty: {
        role: target === 'HOD' ? UserRole.HOD : UserRole.INSTRUCTOR,
        department: { collegeId: Number(collegeId) },
      },
      ...(cycleIdParam ? { cycleId: Number(cycleIdParam) } : {}),
    }

    const results: Array<ReturnType<typeof transformAchievement>> = []
    const want = (t: DeanAchType) => !typeParam || typeParam === t
    const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const })

    // Awards
    if (want('Award')) {
      const awards = await prisma.award.findMany({
        where: {
          appraisal: { is: baseWhere },
          ...(search ? { name: contains(search) } : {}),
        },
        include: {
          appraisal: { include: { faculty: { include: { department: true } }, cycle: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
      results.push(...awards.map((a) => transformAchievement(a, 'Award')))
    }

    // Research
    if (want('Research')) {
      const research = await prisma.researchActivity.findMany({
        where: {
          appraisal: { is: baseWhere },
          ...(search ? { title: contains(search) } : {}),
        },
        include: {
          appraisal: { include: { faculty: { include: { department: true } }, cycle: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
      results.push(...research.map((r) => transformAchievement(r, 'Research')))
    }

    // University Service
    if (want('UniversityService')) {
      const uni = await prisma.universityService.findMany({
        where: {
          appraisal: { is: baseWhere },
          ...(search ? { committeeOrTask: contains(search) } : {}),
        },
        include: {
          appraisal: { include: { faculty: { include: { department: true } }, cycle: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
      results.push(...uni.map((u) => transformAchievement(u, 'UniversityService')))
    }

    // Community Service
    if (want('CommunityService')) {
      const com = await prisma.communityService.findMany({
        where: {
          appraisal: { is: baseWhere },
          ...(search ? { committeeOrTask: contains(search) } : {}),
        },
        include: {
          appraisal: { include: { faculty: { include: { department: true } }, cycle: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
      results.push(...com.map((c) => transformAchievement(c, 'CommunityService')))
    }

    // Courses
    if (want('Course')) {
      const courses = await prisma.courseTaught.findMany({
        where: {
          appraisal: { is: baseWhere },
          ...(search ? { courseTitle: contains(search) } : {}),
        },
        include: {
          appraisal: { include: { faculty: { include: { department: true } }, cycle: true } },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
      results.push(...courses.map((c) => transformAchievement(c, 'Course')))
    }

    // ترتيب تنازلي بالتاريخ
    results.sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({ achievements: results })
  } catch (error) {
    console.error('[DEAN_ACHIEVEMENTS_API]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
