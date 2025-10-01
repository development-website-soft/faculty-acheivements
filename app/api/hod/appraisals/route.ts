import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import { UserRole, EvaluationStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== UserRole.HOD) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');
    const status = searchParams.get('status') as EvaluationStatus;
    const search = searchParams.get('search');

    // Get HOD's department
    const userWithDept = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { department: true },
    });

    if (!userWithDept?.departmentId) {
      return NextResponse.json({ appraisals: [], cycles: [] });
    }
    const departmentId = userWithDept.departmentId;

    // Build query
    const whereClause: any = {
      faculty: {
        departmentId: departmentId,
        role: 'INSTRUCTOR',
      },
    };

    if (cycleId) {
      whereClause.cycleId = parseInt(cycleId);
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.faculty = {
        ...whereClause.faculty,
        name: { contains: search, mode: 'insensitive' },
      };
    }

    // Fetch appraisals
    const appraisals = await prisma.appraisal.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: {
            name: true,
            department: true,
          },
        },
        cycle: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Fetch cycles for filter dropdown
    const cycles = await prisma.appraisalCycle.findMany({
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ appraisals, cycles });

  } catch (error) {
    console.error('[HOD_APPRAISALS_API]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}