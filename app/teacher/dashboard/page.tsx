"use client"
export const dynamic = "force-dynamic"; // Add this line!
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, AlertTriangle, Eye, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus, FileText, Play, Pause, Square, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Teacher {
  id: number
  name: string
  email: string
  department: string
}

interface Exam {
  id: string
  title: string
  description: string
  formUrl: string
  duration: number
  startTime: string
  endTime: string
  status: "draft" | "active" | "completed" | "cancelled"
  createdAt: string
  uniqueId: string
}

interface Violation {
  id: string
  exam_session_id: number | null
  studentName: string
  examTitle: string
  violationType: string
  description: string
  severity: string
  timestamp: string
}

interface ExamSession {
  id: string
  exam_id: number
  exam_title: string
  student_name: string
  student_id: string
  status: string
  violation_count: number
  start_time: string
  duration_minutes: number
  violations?: Violation[]
}

export default function TeacherDashboard() {
  const [teacherData, setTeacherData] = useState<Teacher | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Search and filter states
  const [violationSearch, setViolationSearch] = useState("")
  const [monitoringSearch, setMonitoringSearch] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [selectedViolationType, setSelectedViolationType] = useState<string>("all")
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null)

  // Dialog states
  const [showCreateExam, setShowCreateExam] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)

  // Form states
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    formUrl: "",
    duration: 60,
    startTime: "",
    endTime: "",
  })

  const [stats, setStats] = useState({
    totalActive: 0,
    totalViolations: 0,
    flaggedStudents: 0,
  })

  const router = useRouter()
  const { toast } = useToast()

  // Helper function to format datetime for input
  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Set default start time to current time when dialog opens
  useEffect(() => {
    if (showCreateExam && !newExam.startTime) {
      const now = new Date()
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

      setNewExam((prev) => ({
        ...prev,
        startTime: formatDateTimeForInput(now),
        endTime: formatDateTimeForInput(oneHourLater),
      }))
    }
  }, [showCreateExam])

  // Optional: Poll for live updates every 10 seconds (only when on monitoring tab)
  useEffect(() => {
    if (!teacherData?.id) return

    const pollInterval = setInterval(() => {
      pollLiveData(teacherData.id)
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(pollInterval)
  }, [teacherData?.id])

  useEffect(() => {
    const storedTeacherData = localStorage.getItem("teacherData")
    const userRole = localStorage.getItem("userRole")

    if (!storedTeacherData || userRole !== "teacher") {
      router.push("/")
      return
    }

    const teacher = JSON.parse(storedTeacherData)
    setTeacherData(teacher)
    
    // Initial load
    loadTeacherData(teacher.id)
  }, [router])

  const loadTeacherData = async (teacherId: number) => {
    try {
      setIsLoading(true)

      // Load exams
      const examsResponse = await fetch(`/api/exams?teacherId=${teacherId}`)
      const examsData = await examsResponse.json()

      if (examsData.success) {
        const formattedExams = examsData.exams.map((exam: any) => ({
          id: exam.id.toString(),
          title: exam.title,
          description: exam.description,
          formUrl: exam.form_url,
          duration: exam.duration_minutes,
          startTime: exam.start_time,
          endTime: exam.end_time,
          status: exam.status,
          createdAt: exam.created_at,
          uniqueId: exam.unique_id,
        }))
        setExams(formattedExams)

        // Update stats
        const activeExams = formattedExams.filter((exam: Exam) => exam.status === "active")
        setStats((prev) => ({ ...prev, totalActive: activeExams.length }))
      }

      // Load violations and sessions
      await pollLiveData(teacherId)
    } catch (error) {
      console.error("Error loading teacher data:", error)
      toast({
        title: "Error",
        description: "Failed to load data from database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const pollLiveData = async (teacherId: number) => {
    try {
      console.log("[v0] Polling live data for teacher:", teacherId)
      
      // Load violations
      const violationsResponse = await fetch(`/api/violations?teacherId=${teacherId}`)
      const violationsData = await violationsResponse.json()

      console.log("[v0] Violations response:", violationsData)

      if (violationsData.success && violationsData.violations) {
        const formattedViolations = violationsData.violations.map((violation: any) => ({
          id: violation.id.toString(),
          exam_session_id: violation.exam_session_id,
          studentName: violation.student_name || "Unknown",
          examTitle: violation.exam_title || "Unknown Exam",
          violationType: violation.violation_type || "UNKNOWN",
          description: violation.description || "",
          // Inside pollLiveData mapping:
          timestamp: new Date(violation.timestamp).toLocaleString(),
          severity: violation.severity || "medium",
        }))
        console.log("[v0] Formatted violations:", formattedViolations)
        setViolations(formattedViolations)

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalViolations: formattedViolations.length,
        }))
      } else {
        console.log("[v0] No violations found or API error:", violationsData)
        setViolations([])
      }

      // Load active exam sessions
      const sessionsResponse = await fetch(`/api/exam-sessions?teacherId=${teacherId}`)
      const sessionsData = await sessionsResponse.json()

      console.log("[v0] Sessions response:", sessionsData)

      if (sessionsData.success && sessionsData.sessions) {
        setActiveSessions(sessionsData.sessions || [])
      } else {
        setActiveSessions([])
      }
    } catch (error) {
      console.error("[v0] Error polling live data:", error)
    }
  }

  const handleCreateExam = async () => {
    if (!newExam.title || !newExam.formUrl || !teacherData) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate start time is not in the past
    if (newExam.startTime && new Date(newExam.startTime) < new Date()) {
      toast({
        title: "Error",
        description: "Start time cannot be in the past",
        variant: "destructive",
      })
      return
    }

    // Validate end time is after start time
    if (newExam.startTime && newExam.endTime && new Date(newExam.endTime) <= new Date(newExam.startTime)) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newExam,
          teacherId: teacherData.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Exam Created Successfully!",
          description: `${newExam.title} created with Unique Form ID: ${data.uniqueId}`,
        })

        // Reload exams
        await loadTeacherData(teacherData.id)

        setShowCreateExam(false)
        setNewExam({
          title: "",
          description: "",
          formUrl: "",
          duration: 60,
          startTime: "",
          endTime: "",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create exam",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create exam error:", error)
      toast({
        title: "Error",
        description: "Connection error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExamStatusChange = async (examId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })

        // Reload exams
        if (teacherData) {
          await loadTeacherData(teacherData.id)
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update exam status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Exam deleted successfully",
        })

        // Reload exams
        if (teacherData) {
          await loadTeacherData(teacherData.id)
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete exam",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("teacherData")
    localStorage.removeItem("userRole")
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter violations based on search and severity
  const filteredViolations = violations.filter((violation) => {
    const matchesSearch = 
      violation.studentName.toLowerCase().includes(violationSearch.toLowerCase()) ||
      violation.examTitle.toLowerCase().includes(violationSearch.toLowerCase()) ||
      violation.description.toLowerCase().includes(violationSearch.toLowerCase()) ||
      violation.violationType.toLowerCase().includes(violationSearch.toLowerCase())
    
    const matchesSeverity = selectedSeverity === "all" || violation.severity === selectedSeverity
    const matchesType = selectedViolationType === "all" || violation.violationType === selectedViolationType
    
    return matchesSearch && matchesSeverity && matchesType
  })

  // Filter sessions based on search
  const filteredSessions = activeSessions.filter((session) => {
    return (
      session.student_name.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
      session.student_id.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
      session.exam_title.toLowerCase().includes(monitoringSearch.toLowerCase())
    )
  })

  // Get unique violation types for filter
  const uniqueViolationTypes = Array.from(new Set(violations.map((v) => v.violationType)))

  const getStatusActions = (exam: Exam) => {
    switch (exam.status) {
      case "draft":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "active")}>
                <Play className="h-4 w-4 mr-2" />
                Activate Exam
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteExam(exam.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Exam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      case "active":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "draft")}>
                <Pause className="h-4 w-4 mr-2" />
                Deactivate Exam
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "completed")}>
                <Square className="h-4 w-4 mr-2" />
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "cancelled")}>
                <Square className="h-4 w-4 mr-2" />
                Cancel Exam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      case "completed":
      case "cancelled":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "draft")}>
                <Pause className="h-4 w-4 mr-2" />
                Reset to Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteExam(exam.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Exam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">IT Proctool Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">
                  {teacherData?.name} - {teacherData?.department}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActive}</div>
              <p className="text-xs text-muted-foreground">Currently active exams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.totalViolations}</div>
              <p className="text-xs text-muted-foreground">Detected violations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Create New Exam</DialogTitle>
                    <DialogDescription>Set up a new proctored exam with form integration</DialogDescription>
                  </DialogHeader>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-1">
                    <div className="space-y-4 pb-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>📋 Unique Form ID:</strong> A unique ID will be automatically generated for this exam
                          that students will use to access the exam directly.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="examTitle">Exam Title *</Label>
                        <Input
                          id="examTitle"
                          placeholder="e.g., Mathematics Final Exam"
                          value={newExam.title}
                          onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">First 4 letters will be used for the unique ID</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="examDescription">Description</Label>
                        <Textarea
                          id="examDescription"
                          placeholder="Brief description of the exam"
                          value={newExam.description}
                          onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="formUrl">Form URL *</Label>
                        <Input
                          id="formUrl"
                          placeholder="https://forms.google.com/..."
                          value={newExam.formUrl}
                          onChange={(e) => setNewExam({ ...newExam, formUrl: e.target.value })}
                        />
                        <p className="text-xs text-gray-500">Supports Google Forms, Typeform, Microsoft Forms, etc.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="480"
                          value={newExam.duration}
                          onChange={(e) => setNewExam({ ...newExam, duration: Number.parseInt(e.target.value) || 60 })}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input
                            id="startTime"
                            type="datetime-local"
                            value={newExam.startTime}
                            onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                          />
                          <p className="text-xs text-gray-500">When students can begin the exam</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time (Optional)</Label>
                          <Input
                            id="endTime"
                            type="datetime-local"
                            value={newExam.endTime}
                            onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })}
                          />
                          <p className="text-xs text-gray-500">
                            Latest time to submit (leave empty for duration-based)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="flex-shrink-0 pt-4 border-t">
                    <Button onClick={handleCreateExam} className="w-full">
                      Create Exam & Generate Unique ID
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="exams">My Exams</TabsTrigger>
            <TabsTrigger value="violations">Violations Log</TabsTrigger>
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="exams" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      My Exams ({exams.length})
                    </CardTitle>
                    <CardDescription>Manage your created exams and forms</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exams.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No exams created yet. Create your first exam to get started!</p>
                    </div>
                  ) : (
                    exams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{exam.title}</h3>
                          <p className="text-sm text-gray-600">{exam.description}</p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(exam.createdAt).toLocaleDateString()} • Duration: {exam.duration} min
                          </p>
                          {exam.startTime && (
                            <p className="text-xs text-gray-500">Start: {new Date(exam.startTime).toLocaleString()}</p>
                          )}
                          <p className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block mt-1">
                            Form ID: {exam.uniqueId}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(exam.status)}>{exam.status}</Badge>
                          {getStatusActions(exam)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="violations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Violations ({filteredViolations.length} of {violations.length})
                </CardTitle>
                <CardDescription>Detailed log of all detected violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Search and Filter Controls */}
                  <div className="space-y-4 pb-4 border-b">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search violations by student, exam, or description..."
                        value={violationSearch}
                        onChange={(e) => setViolationSearch(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViolationSearch("")
                          setSelectedSeverity("all")
                          setSelectedViolationType("all")
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 mb-2 block">Filter by Severity</Label>
                        <select
                          value={selectedSeverity}
                          onChange={(e) => setSelectedSeverity(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Severities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600 mb-2 block">Filter by Type</Label>
                        <select
                          value={selectedViolationType}
                          onChange={(e) => setSelectedViolationType(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Types</option>
                          {uniqueViolationTypes.map((type) => (
                            <option key={type} value={type}>
                              {type.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Violations List */}
                  {filteredViolations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      {violations.length === 0 ? (
                        <>
                          <p>No violations detected yet. Great job maintaining exam integrity!</p>
                        </>
                      ) : (
                        <>
                          <p>No violations match your search or filters.</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-4"
                            onClick={() => {
                              setViolationSearch("")
                              setSelectedSeverity("all")
                              setSelectedViolationType("all")
                            }}
                          >
                            Clear Filters
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredViolations.map((violation) => (
                        <div key={violation.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{violation.studentName}</h3>
                              <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 font-mono text-xs">
                                {violation.violationType.replace(/_/g, " ")}
                              </Badge>
                              <Badge className={getSeverityColor(violation.severity)}>{violation.severity.toUpperCase()}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 font-medium">{violation.examTitle}</p>
                            <p className="text-sm text-gray-700">{violation.description}</p>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <p className="text-xs text-gray-500">{new Date(violation.timestamp).toLocaleString()}</p>
                              <span className="text-xs font-mono text-gray-500">ID: {violation.id}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Monitoring ({filteredSessions.length} of {activeSessions.length})
                </CardTitle>
                <CardDescription>Real-time monitoring of students currently taking exams - click on a session to view violations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="flex gap-2 pb-4 border-b">
                    <Input
                      placeholder="Search by student name, ID, or exam..."
                      value={monitoringSearch}
                      onChange={(e) => setMonitoringSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMonitoringSearch("")}
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Sessions List */}
                  {activeSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active exam sessions at the moment.</p>
                      <p className="text-sm">Students taking exams will appear here in real-time.</p>
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sessions match your search.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setMonitoringSearch("")}
                      >
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                          className="flex items-start justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-transparent hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{session.student_name}</h3>
                              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>
                                Active
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{session.exam_title}</p>
                            {(() => {
                              // Calculate violations for this session using session ID
                              const sessionViolations = violations.filter(
                                (v) => v.exam_session_id && v.exam_session_id === parseInt(session.id)
                              )
                              return (
                                <>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Student ID: {session.student_id}</span>
                                    <span>Started: {new Date(session.start_time).toLocaleTimeString()}</span>
                                    {sessionViolations.length > 0 && (
                                      <Badge className="bg-red-100 text-red-800">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {sessionViolations.length} Violation{sessionViolations.length !== 1 ? "s" : ""}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Expanded Violations View */}
                                  {selectedSession?.id === session.id && (
                                    <div className="mt-4 pt-4 border-t space-y-3">
                                      <h4 className="font-medium text-sm">Violations for this session ({sessionViolations.length}):</h4>
                                      {sessionViolations.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">No violations recorded for this session.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {sessionViolations.map((violation) => (
                                            <div key={violation.id} className="bg-white border border-red-100 rounded p-3 space-y-1">
                                              <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 font-mono text-xs">
                                                  {violation.violationType.replace(/_/g, " ")}
                                                </Badge>
                                                <Badge className={getSeverityColor(violation.severity)}>
                                                  {violation.severity.toUpperCase()}
                                                </Badge>
                                              </div>
                                              <p className="text-xs text-gray-700">{violation.description}</p>
                                              <p className="text-xs text-gray-500">{new Date(violation.timestamp).toLocaleString()}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
