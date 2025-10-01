"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppraisalForm } from "@/components/appraisal/appraisal-form"
import { Plus, Eye, Edit, CheckCircle, XCircle, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// Using string literals for status values
type EvaluationStatus = "NEW" | "IN_REVIEW" | "SCORES_SENT" | "COMPLETE" | "RETURNED"

interface Appraisal {
  id: string
  academicYear: string
  status: EvaluationStatus
  finalScore?: number
  submittedAt?: string
  evaluatedAt?: string
  completedAt?: string
  evaluator?: {
    firstName: string
    lastName: string
  }
  evaluations: any[]
  _count: {
    awards: number
    courses: number
    researchActivities: number
    scientificActivities: number
    universityServices: number
    communityServices: number
    evidences: number
  }
}

export default function FacultyAppraisalPage() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchAppraisals()
  }, [])

  const fetchAppraisals = async () => {
    try {
      const response = await fetch("/api/appraisals")
      if (response.ok) {
        const data = await response.json()
        setAppraisals(data)
      }
    } catch (error) {
      console.error("Error fetching appraisals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createAppraisal = async () => {
    setIsCreating(true)
    try {
      const response = await fetch("/api/appraisals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear: new Date().getFullYear().toString() }),
      })

      if (response.ok) {
        fetchAppraisals()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create appraisal")
      }
    } catch (error) {
      console.error("Error creating appraisal:", error)
      alert("Failed to create appraisal")
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <Edit className="h-4 w-4" />
      case "IN_REVIEW":
        return <Clock className="h-4 w-4" />
      case "SCORES_SENT":
        return <Clock className="h-4 w-4" />
      case "COMPLETE":
        return <CheckCircle className="h-4 w-4" />
      case "RETURNED":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800"
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-800"
      case "SCORES_SENT":
        return "bg-orange-100 text-orange-800"
      case "COMPLETE":
        return "bg-green-100 text-green-800"
      case "RETURNED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Appraisals</h1>
          <p className="text-muted-foreground">Manage your performance appraisals</p>
        </div>
        <Button onClick={createAppraisal} disabled={isCreating} className="bg-accent text-accent-foreground">
          <Plus className="mr-2 h-4 w-4" />
          New Appraisal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appraisals.map((appraisal) => (
          <Card key={appraisal.id} className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-card-foreground">Academic Year {appraisal.academicYear}</CardTitle>
                <Badge className={getStatusColor(appraisal.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(appraisal.status)}
                    {appraisal.status}
                  </div>
                </Badge>
              </div>
              <CardDescription>
                Awards: {appraisal._count.awards} | Courses: {appraisal._count.courses} | Research: {appraisal._count.researchActivities} | Scientific: {appraisal._count.scientificActivities} | Services: {appraisal._count.universityServices + appraisal._count.communityServices} | Evidence: {appraisal._count.evidences}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {appraisal.finalScore && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Final Score:</span>
                  <span className="font-bold text-accent">{appraisal.finalScore}%</span>
                </div>
              )}

              {appraisal.evaluator && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Evaluator:</span>
                  <span className="text-sm">
                    {appraisal.evaluator.firstName} {appraisal.evaluator.lastName}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAppraisal(appraisal)
                    setShowForm(true)
                  }}
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {appraisal.status === "NEW" ? "Edit" : "View"}
                </Button>

                {appraisal.status === "IN_REVIEW" && (
                  <div className="flex gap-1">
                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      Appeal
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {appraisals.length === 0 && (
        <Card className="bg-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No appraisals found</p>
            <Button onClick={createAppraisal} disabled={isCreating} className="bg-accent text-accent-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Appraisal
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appraisal - Academic Year {selectedAppraisal?.academicYear}</DialogTitle>
            <DialogDescription>
              {selectedAppraisal?.status === "NEW"
                ? "Complete your self-evaluation"
                : "View your appraisal details"}
            </DialogDescription>
          </DialogHeader>
          {selectedAppraisal && (
            <AppraisalForm
              appraisalId={selectedAppraisal.id}
              isReadOnly={selectedAppraisal.status !== "NEW"}
              evaluations={selectedAppraisal.evaluations}
              onSave={() => {
                setShowForm(false)
                fetchAppraisals()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
