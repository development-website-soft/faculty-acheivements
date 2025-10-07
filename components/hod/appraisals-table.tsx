'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, Eye, Edit } from 'lucide-react'
import { Appraisal, AppraisalCycle, EvaluationStatus } from '@prisma/client'
import { useDebounce } from '@/hooks/use-debounce'

type AppraisalWithDetails = Appraisal & {
  faculty: { name: string; department: { name: string } | null };
  cycle: AppraisalCycle;
};

interface AppraisalsData {
  appraisals: AppraisalWithDetails[];
  cycles: AppraisalCycle[];
}

export default function HODAppraisalsTable() {
  const router = useRouter();
  const [data, setData] = useState<AppraisalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ cycle: '', status: '', search: '' });
  const debouncedSearch = useDebounce(filters.search, 300);

  // Helper function to check if evaluation should be enabled
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
    setError(null); 
    const params = new URLSearchParams();
    if (filters.cycle) params.append('cycleId', filters.cycle);
    if (filters.status) params.append('status', filters.status);
    if (debouncedSearch) params.append('search', debouncedSearch);

    try {
      const res = await fetch(`/api/hod/appraisals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch appraisals');
      const result = await res.json();
      setData(result);
      if (!filters.cycle && result?.cycles?.some((c: AppraisalCycle) => c.isActive)) {
        const active = result.cycles.find((c: AppraisalCycle) => c.isActive);
        if (active) setFilters(prev => ({ ...prev, cycle: String(active.id) }));
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
                <CardTitle>Instructor Appraisals</CardTitle>
                <CardDescription>Browse and evaluate instructor appraisals in your department.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-2 mb-4">
                    <Input
                        placeholder="Search by instructor name..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="max-w-sm"
                    />
                    <div className="flex gap-2">
                        <Select value={filters.cycle} onValueChange={(v) => handleFilterChange('cycle', v)}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Cycle" /></SelectTrigger>
                            <SelectContent>
                                {data?.cycles?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.academicYear}</SelectItem>)}
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

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Instructor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total Score</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                            ) : data?.appraisals.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">No appraisals found.</TableCell></TableRow>
                            ) : (
                                data?.appraisals.map(appraisal => (
                                    <TableRow key={appraisal.id}>
                                        <TableCell className="font-medium">{appraisal.faculty.name}</TableCell>
                                        <TableCell><Badge variant="outline">{appraisal.status}</Badge></TableCell>
                                        <TableCell>{appraisal.totalScore?.toFixed(2) ?? '-'}</TableCell>
                                        <TableCell>{new Date(appraisal.updatedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" title="View" onClick={() => router.push(`/hod/view/${appraisal.id}`)}><Eye className="h-4 w-4" /></Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              title="Evaluate"
                                              disabled={!shouldEnableEvaluation(appraisal)}
                                              onClick={() => router.push(`/hod/reviews/${appraisal.id}`)}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
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