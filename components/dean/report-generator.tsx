"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, BarChart3, Award, Loader2, Users, Building } from "lucide-react"

interface ReportGeneratorProps {
  userRole: string
}

export default function ReportGenerator({ userRole }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState("appraisals")
  const [format, setFormat] = useState("json")
  const [academicYear, setAcademicYear] = useState("all")
  const [department, setDepartment] = useState("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")

  const reportTypes = [
    { value: "appraisals", label: "Appraisals Report", icon: FileText },
    { value: "achievements", label: "Achievements Report", icon: Award },
    { value: "performance", label: "Performance Report", icon: BarChart3 },
    { value: "department", label: "Department Summary", icon: Building },
    { value: "faculty", label: "Faculty Overview", icon: Users },
  ]

  const formats = [
    { value: "json", label: "JSON" },
    { value: "csv", label: "CSV" },
    { value: "pdf", label: "PDF" },
  ]

  // Generate academic year options
  const currentYear = new Date().getFullYear()
  const academicYears = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString())

  // Mock department options - in real app, this would come from API
  const departments = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Engineering"
  ]

  const handleGenerateReport = async () => {
    if (!reportType) {
      setError("Please select a report type")
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
      })

      if (academicYear && academicYear !== "all") {
        params.append("academicYear", academicYear)
      }

      if (department && department !== "all") {
        params.append("department", department)
      }

      const response = await fetch(`/api/dean/reports?${params}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to generate report")
      }

      if (format === "csv") {
        // Download CSV file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportType}-report.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (format === "pdf") {
        // Download PDF file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportType}-report.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        // Display JSON data
        const data = await response.json()
        console.log("Report data:", data)
        // You could open a modal or navigate to a report view page here
        alert(`Report generated successfully! ${data.totalRecords || data.data?.length || 0} records found.`)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <BarChart3 className="h-5 w-5" />
          Generate Reports
        </CardTitle>
        <CardDescription>Create detailed reports for analysis and documentation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year</Label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department (Optional)</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleGenerateReport} disabled={isGenerating} className="w-full">
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Download className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </CardContent>
    </Card>
  )
}
