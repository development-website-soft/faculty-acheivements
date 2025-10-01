import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';

// A helper to unify the shape of different achievement types
const transformAchievement = (item: any, type: string) => {
    const base = {
        id: `${type}-${item.id}`,
        type,
        faculty: item.appraisal.faculty.name,
        department: item.appraisal.faculty.department?.name ?? 'N/A',
        appraisalId: item.appraisalId,
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

        const userWithDept = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) }, include: { department: true } });
        if (!userWithDept?.departmentId) {
            return NextResponse.json({ achievements: [] });
        }
        const departmentId = userWithDept.departmentId;

        const commonFindManyArgs = {
            where: {
                appraisal: { faculty: { departmentId } },
            },
            include: { appraisal: { include: { faculty: { include: { department: true } }, cycle: true } } },
            take: 50, // Limit results for performance
        };

        let results = [];
        if (!type || type === 'Award') {
            const awards = await prisma.award.findMany(commonFindManyArgs);
            results.push(...awards.map(item => transformAchievement(item, 'Award')));
        }
        if (!type || type === 'Research') {
            const research = await prisma.researchActivity.findMany(commonFindManyArgs);
            results.push(...research.map(item => transformAchievement(item, 'Research')));
        }
        // Add other types similarly...

        if (search) {
            results = results.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
        }

        results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({ achievements: results });

    } catch (error) {
        console.error('[HOD_ACHIEVEMENTS_API]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}