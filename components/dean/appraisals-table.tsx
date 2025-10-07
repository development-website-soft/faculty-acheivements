'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, Edit, Trophy } from 'lucide-react'
import { Appraisal, AppraisalCycle, User, Department, EvaluationStatus } from '@prisma/client'
import { useDebounce } from '@/hooks/use-debounce' // Assuming a debounce hook exists

// --- Types ---
type AppraisalWithDetails = Appraisal & {
  faculty: User & { department: Department | null };
  cycle: AppraisalCycle;
};

interface AppraisalsData {
  appraisals: AppraisalWithDetails[];
  cycles: AppraisalCycle[];
}

// --- Achievements Details Component ---
function AchievementDetails({ appraisalId }: { appraisalId: number }) {
    // For now, a placeholder. This would fetch and display achievements.
    return (
        <div className="p-4">
            <p>Achievements for appraisal {appraisalId} will be displayed here.</p>
            <p>A dedicated API route and component would be built for this.</p>
        </div>
    )
}

// --- Main Table Component ---
export default function AppraisalsTable() {
  const router = useRouter();
  const [data, setData] = useState<AppraisalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ cycle: '', status: '', search: '' });
  const debouncedSearch = useDebounce(filters.search, 300);

    const shouldEnableEvaluation = (appraisal: AppraisalWithDetails) => {
    // Always disable if status is complete
    if (appraisal.status === 'complete') return false;

    // If status is new, only enable within one month of cycle end
    if (appraisal.status === 'new') {
      const cycleEndDate = new Date(appraisal.cycle.endDate);
      const oneMonthBeforeEnd = new Date(cycleEndDate);
      oneMonthBeforeEnd.setMonth(oneMonthBeforeEnd.getMonth() - 1);

      const now = new Date();

      // Enable only if current date is within the last month before cycle ends
      const isWithinEvaluationPeriod = now >= oneMonthBeforeEnd && now <= cycleEndDate;

      // Debug logging - check browser console
      console.log(`Appraisal ID: ${appraisal.id}`);
      console.log(`Faculty: ${appraisal.faculty.name}`);
      console.log(`Status: ${appraisal.status}`);
      console.log(`Cycle: ${appraisal.cycle.academicYear}`);
      console.log(`Cycle end date: ${cycleEndDate.toISOString().split('T')[0]}`);
      console.log(`One month before end: ${oneMonthBeforeEnd.toISOString().split('T')[0]}`);
      console.log(`Current date: ${now.toISOString().split('T')[0]}`);
      console.log(`Is within evaluation period: ${isWithinEvaluationPeriod}`);
      console.log('---');

      return isWithinEvaluationPeriod;
    }

    // For other statuses (like 'sent'), enable evaluation
    return true;
  };


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.cycle) params.append('cycleId', filters.cycle);
      if (filters.status) params.append('status', filters.status);
      if (debouncedSearch) params.append('search', debouncedSearch);

      try {
        const res = await fetch(`/api/dean/appraisals?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch appraisals');
        const result = await res.json();
        setData(result);
        if (!filters.cycle && result.cycles.some((c: AppraisalCycle) => c.isActive)) {
            setFilters(prev => ({ ...prev, cycle: result.cycles.find((c: AppraisalCycle) => c.isActive)!.id.toString() }))
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters.cycle, filters.status, debouncedSearch]);

  const handleFilterChange = (key: 'cycle' | 'status' | 'search', value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>HOD Appraisals</CardTitle>
                <CardDescription>Browse and evaluate HOD appraisals in your college.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-2 mb-4">
                    <Input 
                        placeholder="Search by HOD name..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="max-w-sm"
                    />
                    <div className="flex gap-2">
                        <Select value={filters.cycle} onValueChange={(v) => handleFilterChange('cycle', v)}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
                            <SelectContent>
                                {data?.cycles.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.academicYear} - {c.semester}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {Object.values(EvaluationStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>HOD</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total Score</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                            ) : data?.appraisals.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No appraisals found.</TableCell></TableRow>
                            ) : (
                                data?.appraisals.map(appraisal => (
                                    <TableRow key={appraisal.id}>
                                        <TableCell className="font-medium">{appraisal.faculty.name}</TableCell>
                                        <TableCell>{appraisal.faculty.department?.name ?? 'N/A'}</TableCell>
                                        <TableCell><Badge variant="outline">{appraisal.status}</Badge></TableCell>
                                        <TableCell>{appraisal.totalScore?.toFixed(2) ?? '-'}</TableCell>
                                        <TableCell>{new Date(appraisal.updatedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="ghost" size="icon" title="Achievements"><Trophy className="h-4 w-4" /></Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-full sm:max-w-2xl"><SheetHeader><SheetTitle>Achievements: {appraisal.faculty.name}</SheetTitle></SheetHeader><AchievementDetails appraisalId={appraisal.id} /></SheetContent>
                                            </Sheet>
                                            <Button variant="ghost" size="icon" title="View" onClick={() => router.push(`/dean/view/${appraisal.id}`)}><Eye className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" title="Evaluate" disabled={!shouldEnableEvaluation(appraisal)} onClick={() => router.push(`/dean/reviews/${appraisal.id}`)}><Edit className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
