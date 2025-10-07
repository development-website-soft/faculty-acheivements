import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import { UserRole, EvaluationStatus } from '@prisma/client';

// A helper to unify the shape of different achievement types
const transformAchievement = (item: any, type: string) => {
    const base = {
        id: `${type}-${item.id}`,
        type,
        faculty: item.appraisal.faculty.name,
        department: item.appraisal.faculty.department?.name ?? 'N/A',
        appraisalId: item.appraisalId,
        status: item.appraisal.status,
        cycle: `${item.appraisal.cycle.academicYear}`,
    };

    switch (type) {
        case 'Award': return { ...base, title: item.name, date: item.dateObtained };
        case 'Research': return { ...base, title: item.title, date: item.publicationDate };
        case 'Course': return { ...base, title: item.courseTitle, date: new Date(item.appraisal.cycle.startDate) }; // No specific date, use cycle start
        default: return { ...base, title: item.title || item.name, date: item.createdAt };
    }
};

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== UserRole.HOD) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const statusParam = searchParams.get('status');
        const status = statusParam && Object.values(EvaluationStatus).includes(statusParam as EvaluationStatus)
            ? statusParam as EvaluationStatus
            : null;

        const userWithDept = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) }, include: { department: true } });
        if (!userWithDept?.departmentId) {
            return NextResponse.json({ achievements: [] });
        }
        const departmentId = userWithDept.departmentId;

        const baseWhere = {
            faculty: { departmentId },
            ...(status && { status })
        };

        const commonFindManyArgs = {
            where: {
                appraisal: baseWhere,
            },
            include: {
                appraisal: {
                    include: {
                        faculty: {
                            include: { department: true }
                        },
                        cycle: true
                    }
                }
            },
            take: 100, // Increased limit for better overview
        };

        let results = [];

        // Fetch all achievement types with proper includes
        const [
            awards,
            courses,
            research,
            scientific,
            university,
            community,
        ] = await Promise.all([
            (!type || type === 'Award') ? prisma.award.findMany({
                where: { appraisal: baseWhere },
                include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } }
            }) : [],
            (!type || type === 'Course') ? prisma.courseTaught.findMany({
                where: { appraisal: baseWhere },
                include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } }
            }) : [],
            (!type || type === 'Research') ? prisma.researchActivity.findMany({
                where: { appraisal: baseWhere },
                include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } }
            }) : [],
            (!type || type === 'Scientific') ? prisma.scientificActivity.findMany({
                where: { appraisal: baseWhere },
                include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } }
            }) : [],
            (!type || type === 'University') ? prisma.universityService.findMany({
                where: { appraisal: baseWhere },
                include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } }
            }) : [],
            (!type || type === 'Community') ? prisma.communityService.findMany({
                where: { appraisal: baseWhere },
                include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } }
            }) : [],
        ]);

        results.push(
            ...awards.map(item => transformAchievement(item, 'Award')),
            ...courses.map(item => ({ ...transformAchievement(item, 'Course'), title: item.courseTitle, date: new Date(item.appraisal.cycle.startDate) })),
            ...research.map(item => transformAchievement(item, 'Research')),
            ...scientific.map(item => transformAchievement(item, 'Scientific')),
            ...university.map(item => transformAchievement(item, 'University')),
            ...community.map(item => transformAchievement(item, 'Community')),
        );
        // Add other types similarly...

        if (search) {
            results = results.filter(r =>
                r.title.toLowerCase().includes(search.toLowerCase()) ||
                r.faculty.toLowerCase().includes(search.toLowerCase())
            );
        }

        results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({ achievements: results });

    } catch (error) {
        console.error('[HOD_ACHIEVEMENTS_API]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}