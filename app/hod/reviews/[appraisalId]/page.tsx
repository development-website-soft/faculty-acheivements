'use server'

import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireHOD } from '@/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AchievementViewer from '@/components/dean/achievement-viewer';
import EvaluationForm from '@/components/dean/evaluation-form';
import { EvaluationStatus, ResearchKind } from '@prisma/client';

// --- SERVER ACTIONS ---
async function computeAll(appraisalId: number) {
    'use server'
    const appraisal = await prisma.appraisal.findUnique({
        where: { id: appraisalId },
        include: { researchActivities: true, universityServices: true, communityServices: true, courses: true }
    });
    if (!appraisal) throw new Error('Appraisal not found');

    // Simplified scoring logic
    const researchPts = appraisal.researchActivities.filter(r => r.kind === ResearchKind.PUBLISHED).length * 5;
    const universityServicePts = appraisal.universityServices.length * 2;
    const communityServicePts = appraisal.communityServices.length * 2;
    // Placeholder for teaching score
    const teachingQualityPts = appraisal.courses.reduce((acc, course) => acc + (course.studentsEvalAvg ?? 0), 0) / (appraisal.courses.length || 1);

    const totalScore = researchPts + universityServicePts + communityServicePts + teachingQualityPts;

    await prisma.$transaction([
        prisma.evaluation.upsert({
            where: { appraisalId_role: { appraisalId, role: 'HOD' } },
            update: { researchPts, universityServicePts, communityServicePts, teachingQualityPts, totalScore },
            create: { appraisalId, role: 'HOD', researchPts, universityServicePts, communityServicePts, teachingQualityPts, totalScore },
        }),
        prisma.appraisal.update({
            where: { id: appraisalId },
            data: {
                totalScore,
                status: appraisal.status === 'NEW' ? 'IN_REVIEW' : appraisal.status
            },
        })
    ]);
    revalidatePath(`/hod/reviews/${appraisalId}`);
}

async function sendScores(appraisalId: number) {
    'use server'
    await prisma.appraisal.update({
        where: { id: appraisalId },
        data: { status: 'SCORES_SENT' },
    });
    revalidatePath(`/hod/reviews/${appraisalId}`);
}

// --- DATA FETCHING ---
async function getAppraisalData(appraisalId: number, hodUserId: number) {
    const hod = await prisma.user.findUnique({ where: { id: hodUserId }, include: { department: true } });
    const appraisal = await prisma.appraisal.findUnique({
        where: { id: appraisalId },
        include: {
            faculty: { include: { department: true } },
            cycle: true,
            evaluations: true,
            awards: true, courses: true, researchActivities: true, scientificActivities: true, universityServices: true, communityServices: true,
        }
    });

    if (!appraisal || appraisal.faculty.departmentId !== hod?.departmentId || appraisal.faculty.role !== 'INSTRUCTOR' || appraisal.facultyId === hodUserId) {
        return null;
    }
    return appraisal;
}

// --- PAGE COMPONENT ---
export default async function ReviewPage({ params }: { params: Promise<{ appraisalId: string }> }) {
    const user = await requireHOD();
    const { appraisalId: appraisalIdStr } = await params;
    const appraisalId = parseInt(appraisalIdStr, 10);
    if (isNaN(appraisalId)) notFound();

    const appraisal = await getAppraisalData(appraisalId, parseInt(user.id));
    if (!appraisal) notFound();

    const { faculty, cycle, status } = appraisal;

    return (
        <div className="p-6 space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Instructor Appraisal Review</CardTitle>
                            <p className="text-muted-foreground">{faculty.name} - {faculty.department?.name ?? 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">{cycle.academicYear} - {cycle.semester}</p>
                            <Badge>{status}</Badge>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="achievements">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                </TabsList>
                <TabsContent value="achievements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Achievements</CardTitle>
                            <p className="text-muted-foreground">Read-only view of the instructor's submitted achievements.</p>
                        </CardHeader>
                        <CardContent>
                            <AchievementViewer appraisal={appraisal} />
                        </CardContent>
                    </Card>
                </TabsContent>
<TabsContent value="evaluation">
  <EvaluationForm
    appraisalId={appraisal.id}       
    role="HOD"                       
    computeAll={computeAll}          
    sendScores={sendScores}       
  />
</TabsContent>
            </Tabs>
        </div>
    );
}