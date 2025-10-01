"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, CheckCircle } from "lucide-react"

interface AppraisalCycle {
  id: number
  academicYear: string
  semester: string
  isActive: boolean
}

interface AppraisalData {
  id: string
  academicYear: string
  semester: string
  status: string
  totalScore?: number
  submittedAt?: string
  completedAt?: string
}

export default function FacultyReportsPage() {
  const [cycles, setCycles] = useState<AppraisalCycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>("")
  const [includeAttachments, setIncludeAttachments] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [appraisalData, setAppraisalData] = useState<AppraisalData | null>(null)

  useEffect(() => {
    fetchCycles()
  }, [])

  useEffect(() => {
    if (selectedCycle) {
      fetchAppraisalData()
    }
  }, [selectedCycle])

  const fetchCycles = async () => {
    try {
      const response = await fetch("/api/admin/appraisal-cycles")
      if (response.ok) {
        const data = await response.json()
        setCycles(data)
      }
    } catch (error) {
      console.error("Error fetching cycles:", error)
    }
  }

  const fetchAppraisalData = async () => {
    try {
      const response = await fetch(`/api/appraisals?cycleId=${selectedCycle}`)
      if (response.ok) {
        const appraisals = await response.json()
        if (appraisals.length > 0) {
          setAppraisalData(appraisals[0])
        }
      }
    } catch (error) {
      console.error("Error fetching appraisal data:", error)
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedCycle || !appraisalData) return

    setIsGenerating(true)
    try {
      // In a real implementation, this would call an API to generate the PDF
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create a simple download link (placeholder)
      const link = document.createElement('a')
      link.href = '#' // Would be the actual PDF URL
      link.download = `appraisal-report-${appraisalData.academicYear}-${appraisalData.semester}.pdf`
      link.click()

      alert("Report generated successfully!")
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report")
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETE": return "bg-green-100 text-green-800"
      case "SCORES_SENT": return "bg-orange-100 text-orange-800"
      case "IN_REVIEW": return "bg-yellow-100 text-yellow-800"
      case "NEW": return "bg-blue-100 text-blue-800"
      case "RETURNED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Downloads</h1>
          <p className="text-muted-foreground">Generate PDF reports for your appraisal cycles</p>
        </div>
      </div>

      {/* Report Generator */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Appraisal Report
          </CardTitle>
          <CardDescription>
            Create a comprehensive PDF report containing your scores and achievements for a selected cycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cycle Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Appraisal Cycle</label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a cycle to generate report" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.academicYear} - {cycle.semester} {cycle.isActive && "(Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Preview */}
          {appraisalData && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-3">Report Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cycle:</span>
                  <span className="ml-2 font-medium">{appraisalData.academicYear} - {appraisalData.semester}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`ml-2 ${getStatusColor(appraisalData.status)}`}>
                    {appraisalData.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Score:</span>
                  <span className="ml-2 font-medium">{appraisalData.totalScore || "Pending"}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="ml-2 font-medium">
                    {appraisalData.submittedAt
                      ? new Date(appraisalData.submittedAt).toLocaleDateString()
                      : "Not submitted"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="attachments"
                checked={includeAttachments}
                onCheckedChange={setIncludeAttachments}
              />
              <label
                htmlFor="attachments"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include attachment list in report
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={!selectedCycle || !appraisalData || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate & Download PDF Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Contents Info */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Report Contents</CardTitle>
          <CardDescription>What will be included in your appraisal report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Performance Scores
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Overall total score</li>
                <li>• Research score (30% weight)</li>
                <li>• University service score (20% weight)</li>
                <li>• Community service score (20% weight)</li>
                <li>• Teaching quality score (30% weight)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Achievement Sections
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Awards and certificates</li>
                <li>• Courses taught</li>
                <li>• Research publications</li>
                <li>• Scientific activities</li>
                <li>• University service</li>
                <li>• Community service</li>
                {includeAttachments && <li>• Attachment references</li>}
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Additional Information</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Appraisal status and timestamps</li>
              <li>• Evaluator feedback and comments</li>
              <li>• Cycle information and deadlines</li>
              <li>• Performance trends and comparisons</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>Your previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reports generated yet</p>
            <p className="text-sm">Generate your first report using the form above</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
