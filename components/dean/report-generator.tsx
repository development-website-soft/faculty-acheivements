'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AppraisalCycle, Department } from '@prisma/client';

export default function ReportGenerator() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters] = useState<{ cycles: AppraisalCycle[], departments: Department[] }>({ cycles: [], departments: [] });
    const [config, setConfig] = useState({
        cycleId: '',
        departmentId: '',
        includeTopBottom: false,
    });

    useEffect(() => {
        // Fetch cycles and departments for the filters
        async function getFilters() {
            // This could be a dedicated API or fetched from existing ones.
            // For simplicity, we reuse the dashboard API as it provides these.
            const res = await fetch('/api/dean/dashboard');
            const data = await res.json();
            if (data.filters) {
                setFilters(data.filters);
            }
        }
        getFilters();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        setReportData(null);
        
        const params = new URLSearchParams();
        params.append('cycleId', config.cycleId);
        if (config.departmentId) params.append('departmentId', config.departmentId);
        params.append('includeTopBottom', config.includeTopBottom.toString());

        try {
            const res = await fetch(`/api/dean/reports?${params.toString()}`);
            const data = await res.json();
            setReportData(data);
        } catch (error) {
            console.error("Failed to generate report", error);
            // You could show an error toast here
        }

        setLoading(false);
    };

    return (
        <div className="p-6 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Dean's Report</CardTitle>
                    <CardDescription>Create a formal PDF report for a specific cycle and department.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="cycle">Cycle (Required)</Label>
                            <Select value={config.cycleId} onValueChange={(v) => setConfig(c => ({ ...c, cycleId: v }))}>
                                <SelectTrigger id="cycle"><SelectValue placeholder="Select a Cycle" /></SelectTrigger>
                                <SelectContent>{filters.cycles.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.academicYear} - {c.semester}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="department">Department (Optional)</Label>
                            <Select value={config.departmentId} onValueChange={(v) => setConfig(c => ({ ...c, departmentId: v }))}>
                                <SelectTrigger id="department"><SelectValue placeholder="All Departments" /></SelectTrigger>
                                <SelectContent><SelectItem value="">All Departments</SelectItem>{filters.departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="include-top-bottom" checked={config.includeTopBottom} onCheckedChange={(v) => setConfig(c => ({ ...c, includeTopBottom: v }))} />
                        <Label htmlFor="include-top-bottom">Include Top/Bottom HODs</Label>
                    </div>
                    <Button onClick={handleGenerate} disabled={loading || !config.cycleId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate PDF
                    </Button>
                </CardContent>
            </Card>

            {reportData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Report Data Preview</CardTitle>
                        <CardDescription>This is the data that would be used to generate the PDF.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="p-4 bg-muted rounded-lg overflow-x-auto">{JSON.stringify(reportData, null, 2)}</pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
