"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, AlertTriangle, Eye, Activity, Calendar, Clock, Search, MoreVertical, LogOut } from "lucide-react"
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

// --- Interfaces ---
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
  student_name: string
  examTitle: string
  exam_title: string
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
  is_google_sheets?: number
  violations?: Violation[]
}

export default function TeacherDashboard() {
  const [teacherData, setTeacherData] = useState<Teacher | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg'] // Ensure these images are in your public folder

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

  // --- Effects ---

  // Carousel Rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

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

  // Poll for live updates every 10 seconds
  useEffect(() => {
    if (!teacherData?.id) return
    const pollInterval = setInterval(() => {
      pollLiveData(teacherData.id)
    }, 10000)
    return () => clearInterval(pollInterval)
  }, [teacherData?.id])

  // Authentication Check
  useEffect(() => {
    const storedTeacherData = localStorage.getItem("teacherData")
    const userRole = localStorage.getItem("userRole")

    if (!storedTeacherData || userRole !== "teacher") {
      router.push("/")
      return
    }

    const teacher = JSON.parse(storedTeacherData)
    setTeacherData(teacher)
    loadTeacherData(teacher.id)
  }, [router])

  // --- Data Loading Functions ---

  const loadTeacherData = async (teacherId: number) => {
    try {
      setIsLoading(true)
      const examsResponse = await fetch(`/api/exams?teacherId=${teacherId}`)
      const examsData = await examsResponse.json()

      if (examsData.success) {
        const formattedExams = examsData.exams.map((exam: any) => ({
          id: exam.id.toString(),
          title: exam.title,
          description: exam.description,
          formUrl: exam.form_url,
          startTime: exam.start_time,
          endTime: exam.end_time,
          status: exam.status,
          createdAt: exam.created_at,
          uniqueId: exam.unique_id,
        }))
        setExams(formattedExams)
        const activeExams = formattedExams.filter((exam: Exam) => exam.status === "active")
        setStats((prev) => ({ ...prev, totalActive: activeExams.length }))
      }
      await pollLiveData(teacherId)
    } catch (error) {
      console.error("Error loading teacher data:", error)
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const pollLiveData = async (teacherId: number) => {
    try {
      const violationsResponse = await fetch(`/api/violations?teacherId=${teacherId}`)
      const violationsData = await violationsResponse.json()

      if (violationsData.success && violationsData.violations) {
        const formattedViolations = violationsData.violations.map((violation: any) => ({
          id: violation.id.toString(),
          exam_session_id: violation.exam_session_id,
          studentName: violation.student_name || "Unknown",
          student_name: violation.student_name || "Unknown",
          examTitle: violation.exam_title || "Unknown Exam",
          exam_title: violation.exam_title || "Unknown Exam",
          violationType: violation.violation_type || "UNKNOWN",
          description: violation.description || "",
          timestamp: violation.timestamp,
          severity: violation.severity || "medium",
        }))
        setViolations(formattedViolations)
        setStats((prev) => ({ ...prev, totalViolations: formattedViolations.length }))
      } else {
        setViolations([])
      }

      const sessionsResponse = await fetch(`/api/exam-sessions?teacherId=${teacherId}`)
      const sessionsData = await sessionsResponse.json()

      if (sessionsData.success && sessionsData.sessions) {
        setActiveSessions(sessionsData.sessions || [])
      } else {
        setActiveSessions([])
      }
    } catch (error) {
      console.error("[v0] Error polling live data:", error)
    }
  }

  // --- Handlers ---

  const handleCreateExam = async () => {
    if (!newExam.title || !newExam.formUrl || !teacherData) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }
    // Simple validation
    if (newExam.startTime && new Date(newExam.startTime) < new Date()) {
      toast({ title: "Error", description: "Start time cannot be in the past", variant: "destructive" })
      return
    }
    if (newExam.startTime && newExam.endTime && new Date(newExam.endTime) <= new Date(newExam.startTime)) {
      toast({ title: "Error", description: "End time must be after start time", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newExam, teacherId: teacherData.id }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Exam Created Successfully!", description: `${newExam.title} created with Unique Form ID: ${data.uniqueId}` })
        await loadTeacherData(teacherData.id)
        setShowCreateExam(false)
        setNewExam({ title: "", description: "", formUrl: "", startTime: "", endTime: "" })
      } else {
        toast({ title: "Error", description: data.message || "Failed to create exam", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error. Please try again.", variant: "destructive" })
    }
  }

  const handleExamStatusChange = async (examId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: data.message })
        if (teacherData) await loadTeacherData(teacherData.id)
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error", variant: "destructive" })
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) return
    try {
      const response = await fetch(`/api/exams/${examId}`, { method: "DELETE" })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: "Exam deleted successfully" })
        if (teacherData) await loadTeacherData(teacherData.id)
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete exam", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error", variant: "destructive" })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("teacherData")
    localStorage.removeItem("userRole")
    router.push("/")
  }

  // --- Render Helpers (Dark Mode Styles) ---

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "draft": return "bg-slate-700/30 text-slate-300 border-slate-600/30"
      case "completed": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "cancelled": return "bg-red-500/10 text-red-400 border-red-500/20"
      default: return "bg-slate-800 text-slate-400"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "medium": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "low": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default: return "bg-slate-800 text-slate-400"
    }
  }

  const getStatusActions = (exam: Exam) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
        {exam.status === "draft" && (
          <>
            <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "active")} className="focus:bg-slate-800 cursor-pointer">
              <Play className="h-4 w-4 mr-2 text-emerald-500" /> Activate Exam
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteExam(exam.id)} className="text-red-400 focus:bg-slate-800 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Exam
            </DropdownMenuItem>
          </>
        )}
        {exam.status === "active" && (
          <>
            <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "draft")} className="focus:bg-slate-800 cursor-pointer">
              <Pause className="h-4 w-4 mr-2 text-amber-500" /> Deactivate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "completed")} className="focus:bg-slate-800 cursor-pointer">
              <Square className="h-4 w-4 mr-2 text-blue-500" /> Mark Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "cancelled")} className="focus:bg-slate-800 cursor-pointer">
              <Square className="h-4 w-4 mr-2 text-red-500" /> Cancel Exam
            </DropdownMenuItem>
          </>
        )}
        {(exam.status === "completed" || exam.status === "cancelled") && (
          <>
            <DropdownMenuItem onClick={() => handleExamStatusChange(exam.id, "draft")} className="focus:bg-slate-800 cursor-pointer">
              <Pause className="h-4 w-4 mr-2" /> Reset to Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteExam(exam.id)} className="text-red-400 focus:bg-slate-800 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Delete Exam
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Filters
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

  const filteredSessions = activeSessions.filter((session) => {
    return (
      session.student_name.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
      session.student_id.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
      session.exam_title.toLowerCase().includes(monitoringSearch.toLowerCase())
    )
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium animate-pulse">Initializing System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* --- CAROUSEL BACKGROUND --- */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-fixed transition-opacity duration-[2000ms] ease-in-out ${
              index === currentSlide ? "opacity-30" : "opacity-0"
            }`}
            style={{ backgroundImage: `url('${slide}')` }}
          />
        ))}
        {/* Dark Gradient Overlay to ensure readability and match aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b]/90 to-[#0f172a] -z-10" />
      </div>

      {/* Header */}
      <header className="bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Proctool <span className="text-blue-400 text-sm font-normal uppercase tracking-wider ml-1">Admin</span></h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">{teacherData?.department}</span>
                  <span>•</span>
                  <span>{teacherData?.name}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-red-950/30">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Exams Card */}
          <Card className="bg-slate-800/60 backdrop-blur-md border-slate-700/50 shadow-xl hover:bg-slate-800/80 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Exams</CardTitle>
              <div className="bg-blue-500/10 p-2 rounded-full border border-blue-500/20">
                 <Users className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalActive}</div>
              <p className="text-xs text-slate-500 mt-1">Currently monitoring</p>
            </CardContent>
          </Card>

          {/* Violations Card */}
          <Card className="bg-slate-800/60 backdrop-blur-md border-slate-700/50 shadow-xl hover:bg-slate-800/80 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Violations</CardTitle>
              <div className="bg-red-500/10 p-2 rounded-full border border-red-500/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{stats.totalViolations}</div>
              <p className="text-xs text-slate-500 mt-1">Detected incidents</p>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-gradient-to-br from-blue-900/50 to-slate-800/60 backdrop-blur-md border-blue-500/30 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-200 uppercase tracking-wider">Quick Actions</CardTitle>
              <Plus className="h-5 w-5 text-blue-300" />
            </CardHeader>
            <CardContent className="relative z-10">
              <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0 font-semibold shadow-lg shadow-blue-900/20 transition-all">
                    Create New Exam
                  </Button>
                </DialogTrigger>
                {/* Modal Content - Dark Themed */}
                <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-white">Create New Exam</DialogTitle>
                    <DialogDescription className="text-slate-400">Configure exam settings and security.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex gap-3 items-start">
                      <div className="bg-blue-900/40 p-1.5 rounded-full mt-0.5">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="text-sm text-blue-200">
                        <strong>Unique Form ID:</strong> Auto-generated upon creation.
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Exam Title</Label>
                        <Input
                          placeholder="e.g. Final Assessment"
                          value={newExam.title}
                          onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Description</Label>
                        <Textarea
                          placeholder="Instructions..."
                          value={newExam.description}
                          onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 resize-none focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">Form URL</Label>
                        <Input
                          placeholder="https://forms.google.com/..."
                          value={newExam.formUrl}
                          onChange={(e) => setNewExam({ ...newExam, formUrl: e.target.value })}
                          className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-300">Start Time</Label>
                          <Input
                            type="datetime-local"
                            value={newExam.startTime}
                            onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })}
                            className="bg-slate-950 border-slate-700 text-white [color-scheme:dark]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300">End Time</Label>
                          <Input
                            type="datetime-local"
                            value={newExam.endTime}
                            onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })}
                            className="bg-slate-950 border-slate-700 text-white [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <Button onClick={handleCreateExam} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                      Create Exam & Generate ID
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="bg-slate-900/60 backdrop-blur border border-slate-700 p-1 rounded-xl shadow-lg">
            <TabsTrigger value="exams" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 rounded-lg px-4">
              <FileText className="h-4 w-4 mr-2" /> My Exams
            </TabsTrigger>
            <TabsTrigger value="violations" className="data-[state=active]:bg-slate-700 data-[state=active]:text-red-400 text-slate-400 rounded-lg px-4">
              <AlertTriangle className="h-4 w-4 mr-2" /> Violations Log
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-400 text-slate-400 rounded-lg px-4">
               <Activity className="h-4 w-4 mr-2" /> Live Monitoring
            </TabsTrigger>
          </TabsList>

          {/* EXAMS TAB */}
          <TabsContent value="exams" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Your Created Exams</h2>
              <Badge variant="outline" className="text-slate-400 border-slate-700 bg-slate-900/50">{exams.length} Total</Badge>
            </div>
            
            {exams.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-700 bg-slate-900/40">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-10 w-10 text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300">No exams yet</h3>
                  <p className="text-slate-500 mb-6">Create your first exam to start monitoring.</p>
                  <Button variant="outline" onClick={() => setShowCreateExam(true)} className="border-slate-600 text-blue-400 hover:bg-slate-800 hover:text-blue-300">Create Exam</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group hover:border-slate-600 transition-colors">
                    {/* Status Border Accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      exam.status === 'active' ? 'bg-emerald-500' : 
                      exam.status === 'completed' ? 'bg-blue-500' : 
                      exam.status === 'cancelled' ? 'bg-red-500' : 'bg-slate-600'
                    }`} />
                    
                    <div className="pl-3 space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white text-lg">{exam.title}</h3>
                        <Badge variant="outline" className={`border-0 font-medium ${getStatusColor(exam.status)}`}>
                          {exam.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm">{exam.description || "No description provided."}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs text-slate-500">
                         <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                           <span className="font-semibold text-slate-400">ID:</span>
                           <span className="font-mono text-blue-400">{exam.uniqueId}</span>
                         </div>
                         {exam.startTime && (
                           <div className="flex items-center gap-1.5">
                             <Calendar className="h-3.5 w-3.5" />
                             <span>{new Date(exam.startTime).toLocaleDateString()}</span>
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t border-slate-700/50 md:border-t-0 justify-end w-full md:w-auto">
                      {getStatusActions(exam)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* VIOLATIONS TAB */}
          <TabsContent value="violations" className="space-y-6">
            <Card className="bg-slate-800/60 backdrop-blur-md border-slate-700/50 shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-700/50 pb-4 bg-slate-900/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                       <AlertTriangle className="h-5 w-5 text-red-500" />
                       Violations Log
                   </CardTitle>
                   
                   <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                     <div className="relative">
                       <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                       <Input
                          placeholder="Search..."
                          value={violationSearch}
                          onChange={(e) => setViolationSearch(e.target.value)}
                          className="pl-9 w-full md:w-64 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500"
                        />
                     </div>
                     <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value)}
                        className="h-10 px-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">Severity: All</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredViolations.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="bg-slate-700/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-slate-600" />
                    </div>
                    <p>No violations found based on current filters.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {filteredViolations.map((violation) => (
                      <div key={violation.id} className="p-4 hover:bg-slate-700/30 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-200">{violation.studentName}</span>
                            <span className="text-slate-600 mx-1">|</span>
                            <span className="text-sm text-slate-400">{violation.examTitle}</span>
                          </div>
                          <p className="text-sm text-slate-500">{violation.description}</p>
                        </div>
                        
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between">
                          <Badge variant="outline" className={`${getSeverityColor(violation.severity)} border-0 font-bold`}>
                            {violation.severity.toUpperCase()}
                          </Badge>
                          <div className="text-xs text-slate-600 font-mono">
                            {new Date(violation.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MONITORING TAB */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="flex items-center gap-3 bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20 shadow-lg backdrop-blur-sm">
               <div className="relative">
                 <span className="absolute -right-1 -top-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <Activity className="h-6 w-6 text-emerald-500" />
               </div>
               <div>
                 <h3 className="font-semibold text-emerald-100">Live Proctoring Active</h3>
                 <p className="text-xs text-emerald-500/80">Updating in real-time...</p>
               </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
               <Input
                  placeholder="Filter active sessions..."
                  value={monitoringSearch}
                  onChange={(e) => setMonitoringSearch(e.target.value)}
                  className="pl-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                />
            </div>

            {activeSessions.length === 0 ? (
               <div className="text-center py-20 bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                  <div className="bg-slate-700/50 p-4 rounded-full inline-block mb-3">
                     <Eye className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-slate-300 font-medium">No Active Sessions</h3>
                  <p className="text-slate-500 text-sm">Students will appear here when they start an exam.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                    className={`
                      cursor-pointer rounded-xl border transition-all duration-200 overflow-hidden backdrop-blur-sm
                      ${selectedSession?.id === session.id 
                        ? 'bg-blue-900/20 border-blue-500/30 shadow-md ring-1 ring-blue-500/20' 
                        : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-300 font-semibold text-sm border border-slate-700">
                           {session.student_name.charAt(0)}
                         </div>
                         <div>
                            <h4 className="font-semibold text-slate-200">{session.student_name}</h4>
                            <p className="text-xs text-slate-500">{session.exam_title}</p>
                         </div>
                      </div>

                      {(() => {
                          const sessionViolations = violations.filter((v) => {
                             if (session.is_google_sheets === 1) {
                               return (
                                 v.exam_session_id === null &&
                                 v.studentName === session.student_name &&
                                 v.examTitle === session.exam_title + ' Exam'
                               )
                             } else {
                               return v.exam_session_id && v.exam_session_id === parseInt(session.id)
                             }
                          })
                          
                          return (
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                               {sessionViolations.length > 0 ? (
                                 <Badge className="bg-red-900/30 text-red-400 border border-red-900/50">
                                   <AlertTriangle className="h-3 w-3 mr-1" />
                                   {sessionViolations.length} Issue{sessionViolations.length !== 1 ? 's' : ''}
                                 </Badge>
                               ) : (
                                 <Badge variant="outline" className="bg-emerald-900/10 text-emerald-500 border-emerald-900/50">
                                   <Activity className="h-3 w-3 mr-1" /> Stable
                                 </Badge>
                               )}
                            </div>
                          )
                      })()}
                    </div>

                    {selectedSession?.id === session.id && (
                       <div className="bg-slate-900/50 border-t border-slate-700/50 p-4 animate-in slide-in-from-top-2">
                           {(() => {
                              const sessionViolations = violations.filter((v) => {
                                 if (session.is_google_sheets === 1) {
                                   return (v.exam_session_id === null && v.studentName === session.student_name && v.examTitle === session.exam_title + ' Exam')
                                 } else {
                                   return v.exam_session_id && v.exam_session_id === parseInt(session.id)
                                 }
                              })
                              
                              if (sessionViolations.length === 0) return <p className="text-slate-500 text-sm text-center">No violations detected.</p>

                              return (
                                <div className="space-y-2">
                                   {sessionViolations.map((v, i) => (
                                      <div key={i} className="flex items-start gap-3 bg-slate-900/80 p-3 rounded border border-slate-700/50">
                                         <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                         <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium text-slate-200">{v.violationType}</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-400`}>{v.severity}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{v.description}</p>
                                            <p className="text-[10px] text-slate-600 mt-1">{new Date(v.timestamp).toLocaleTimeString()}</p>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                              )
                           })()}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}