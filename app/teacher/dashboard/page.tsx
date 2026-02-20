"use client"
export const dynamic = "force-dynamic"; 
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, AlertTriangle, Eye, Activity, Plus, FileText, Play, Pause, Square, Trash2, List, Sun, Moon } from "lucide-react"
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
  is_google_sheets?: boolean
}

// Enhanced Interface to prevent TypeScript build errors
interface EnhancedExamSession extends ExamSession {
  sessionViolations: Violation[];
  matchingViolations: Violation[];
}

export default function TeacherDashboard() {
  const [teacherData, setTeacherData] = useState<Teacher | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true)

  // --- CAROUSEL STATE ---
  const [currentSlide, setCurrentSlide] = useState(0)
  const backgroundImages = [
    "/photo1.jpg",
    "/photo2.jpg",
    "/photo3.jpg"
  ]
  // ----------------------

  // Search and filter states
  const [monitoringSearch, setMonitoringSearch] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [selectedViolationType, setSelectedViolationType] = useState<string>("all")
  const [selectedSession, setSelectedSession] = useState<EnhancedExamSession | null>(null)

  // Dialog states
  const [showCreateExam, setShowCreateExam] = useState(false)

  // Form states
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    examCode: "", 
    duration: 60,
    startTime: "",
    endTime: "",
  })

  const [stats, setStats] = useState({
    totalActive: 0,
    flaggedStudents: 0,
  })

  const router = useRouter()
  const { toast } = useToast()

  // --- CAROUSEL EFFECT ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [backgroundImages.length])
  // -----------------------

  // Helper function to format datetime for input
  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Original Formatter: Keeps Teacher Logs untouched and working perfectly
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      let safeString = dateString.trim().replace(' ', 'T');
      if (!safeString.endsWith('Z') && !safeString.includes('+') && !safeString.includes('-')) {
        safeString += 'Z';
      }
      
      const dateObj = new Date(safeString);
      if (isNaN(dateObj.getTime())) return dateString;

      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(dateObj);
    } catch (e) {
      return dateString;
    }
  }

  // FIX: Dedicated formatter exclusively for Activity Logs to mathematically correct the 8-hour delay
  const formatActivityDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return dateString;

      // Add exactly 8 hours to counteract the UTC shift specific to the activity logs/violations
      dateObj.setHours(dateObj.getHours() + 8);

      return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(dateObj);
    } catch (e) {
      return dateString;
    }
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
          uniqueId: exam.unique_id || exam.uniqueId || exam.id.toString(),
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
      setIsRefreshing(true)
      const timestamp = Date.now()
      
      // Load violations
      const violationsResponse = await fetch(`/api/violations?teacherId=${teacherId}&_t=${timestamp}`)
      const violationsData = await violationsResponse.json()

      if (violationsData.success && violationsData.violations) {
        const formattedViolations = violationsData.violations.map((violation: any) => ({
          id: violation.id.toString(),
          exam_session_id: violation.exam_session_id,
          studentName: violation.student_name || "Unknown",
          examTitle: violation.exam_title || "Unknown Exam",
          violationType: violation.violation_type || "UNKNOWN",
          description: violation.description || "",
          timestamp: violation.timestamp,
          severity: violation.severity || "medium",
        }))
        setViolations(formattedViolations)
      } else {
        setViolations([])
      }

      // Load active exam sessions
      const sessionsResponse = await fetch(`/api/exam-sessions?teacherId=${teacherId}&_t=${timestamp}`)
      const sessionsData = await sessionsResponse.json()

      if (sessionsData.success && sessionsData.sessions) {
        setActiveSessions(sessionsData.sessions || [])
      } else {
        setActiveSessions([])
      }
    } catch (error) {
      console.error("[v0] Error fetching live data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreateExam = async () => {
    if (!newExam.title || !newExam.examCode || !teacherData) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Title and Exam Code are required)",
        variant: "destructive",
      })
      return
    }

    if (newExam.startTime && newExam.endTime && new Date(newExam.endTime) <= new Date(newExam.startTime)) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare times securely for MySQL
      const formattedStartTime = newExam.startTime ? newExam.startTime.replace("T", " ") + ":00" : null;
      const formattedEndTime = newExam.endTime ? newExam.endTime.replace("T", " ") + ":00" : null;

      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newExam.title,
          description: newExam.description,
          examCode: newExam.examCode, 
          unique_id: newExam.examCode, 
          uniqueId: newExam.examCode, 
          teacherId: teacherData.id, 
          teacher_id: teacherData.id, 
          duration: newExam.duration,
          duration_minutes: newExam.duration,
          formUrl: "N/A",
          form_url: "N/A",
          startTime: formattedStartTime,
          start_time: formattedStartTime,
          endTime: formattedEndTime,
          end_time: formattedEndTime
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Exam Created Successfully!",
          description: `${newExam.title} created with Code: ${newExam.examCode}`,
        })
        await loadTeacherData(teacherData.id)
        setShowCreateExam(false)
        setNewExam({ title: "", description: "", examCode: "", duration: 60, startTime: "", endTime: "" })
      } else {
        const errorMsg = data.error || data.message || "Failed to create exam";
        const isDuplicate = errorMsg.toLowerCase().includes("duplicate");
        
        toast({ 
          title: "Error", 
          description: isDuplicate ? "That Exam Code is already in use. Please try a different code." : errorMsg, 
          variant: "destructive" 
        })
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
        toast({ title: "Error", description: data.message || "Failed to update exam status", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error. Please try again.", variant: "destructive" })
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
      toast({ title: "Error", description: "Connection error. Please try again.", variant: "destructive" })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("teacherData")
    localStorage.removeItem("userRole")
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case "active": return "bg-green-500/20 text-green-400 border border-green-500/30"
        case "draft": return "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        case "completed": return "bg-slate-500/20 text-slate-300 border border-slate-500/30"
        case "cancelled": return "bg-red-500/20 text-red-400 border border-red-500/30"
        default: return "bg-slate-500/20 text-slate-300 border border-slate-500/30"
      }
    } else {
      switch (status) {
        case "active": return "bg-green-100 text-green-700 border border-green-300"
        case "draft": return "bg-blue-100 text-blue-700 border border-blue-300"
        case "completed": return "bg-slate-200 text-slate-700 border border-slate-400"
        case "cancelled": return "bg-red-100 text-red-700 border border-red-300"
        default: return "bg-slate-100 text-slate-700 border border-slate-300"
      }
    }
  }

  const getSeverityColor = (severity: string) => {
    if (isDarkMode) {
      switch (severity) {
        case "high": return "bg-red-500/20 text-red-400 border border-red-500/30"
        case "medium": return "bg-orange-500/20 text-orange-400 border border-orange-500/30"
        case "low": return "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        default: return "bg-slate-500/20 text-slate-300 border border-slate-500/30"
      }
    } else {
      switch (severity) {
        case "high": return "bg-red-100 text-red-700 border border-red-300"
        case "medium": return "bg-orange-100 text-orange-700 border border-orange-300"
        case "low": return "bg-blue-100 text-blue-700 border border-blue-300"
        default: return "bg-slate-100 text-slate-700 border border-slate-300"
      }
    }
  }

  const uniqueViolationTypes = Array.from(new Set(violations.map((v) => v.violationType)))

  const teacherExamCodes = exams.map(e => e.uniqueId?.toLowerCase().trim()).filter(Boolean);
  const teacherExamTitles = exams.map(e => e.title?.toLowerCase().trim()).filter(Boolean);

  const sessionsWithViolations: EnhancedExamSession[] = activeSessions.map(session => {
    let sessionViolations: Violation[] = [];

    if (session.is_google_sheets) {
      sessionViolations = violations.filter((v) => {
        const vStudent = v.studentName?.trim().toLowerCase();
        const vExam = v.examTitle?.trim().toLowerCase();
        const sStudent = session.student_name?.trim().toLowerCase();
        const sExam = (session.exam_title + ' Exam')?.trim().toLowerCase();
        return v.exam_session_id === null && vStudent === sStudent && (vExam === sExam || vExam === session.exam_title?.trim().toLowerCase());
      });
    } else {
      sessionViolations = violations.filter((v) => v.exam_session_id && v.exam_session_id === parseInt(session.id));
    }
    
    const matchingViolations = sessionViolations.filter(v => {
      const matchesSeverity = selectedSeverity === "all" || v.severity === selectedSeverity;
      const matchesType = selectedViolationType === "all" || v.violationType === selectedViolationType;
      return matchesSeverity && matchesType;
    });

    return { ...session, sessionViolations, matchingViolations };
  });

  const filteredSessions = sessionsWithViolations.filter((session) => {
    const sessionExamIdentifier = session.exam_title?.toLowerCase().trim() || "";

    const isOwnExam = 
      teacherExamCodes.includes(sessionExamIdentifier) || 
      teacherExamTitles.includes(sessionExamIdentifier) || 
      exams.some(e => e.id.toString() === session.exam_id?.toString());

    if (!isOwnExam) return false;

    const matchesSearch = 
      session.student_name.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
      session.student_id.toLowerCase().includes(monitoringSearch.toLowerCase()) ||
      session.exam_title.toLowerCase().includes(monitoringSearch.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedSeverity !== "all" || selectedViolationType !== "all") {
      return session.matchingViolations.length > 0;
    }

    return true;
  });

  const trueTotalViolations = sessionsWithViolations
    .filter((session) => {
      const sessionExamIdentifier = session.exam_title?.toLowerCase().trim() || "";
      return teacherExamCodes.includes(sessionExamIdentifier) || 
             teacherExamTitles.includes(sessionExamIdentifier) || 
             exams.some(e => e.id.toString() === session.exam_id?.toString());
    })
    .reduce((sum, session) => sum + session.sessionViolations.length, 0);


  // --- THEME CLASSES ---
  const themeBg = isDarkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"
  const overlayBg = isDarkMode ? "bg-slate-950/85" : "bg-white/85"
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900"
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500"
  const inputBg = isDarkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500"
  const dialogBg = isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
  const rowBg = isDarkMode ? "border-slate-800 bg-slate-800/30 hover:bg-slate-800/70" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
  const headerBg = isDarkMode ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
  const emptyBoxBg = isDarkMode ? "bg-slate-900/50 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-300 text-slate-500"
  const dropItemHover = isDarkMode ? "focus:bg-slate-800 focus:text-white" : "focus:bg-slate-100 focus:text-slate-900"

  const getStatusActions = (exam: Exam) => {
    switch (exam.status) {
      case "draft":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={isDarkMode ? "border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white bg-slate-800/50" : "border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"}>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={dialogBg}>
              <DropdownMenuItem className={`cursor-pointer ${dropItemHover}`} onClick={() => handleExamStatusChange(exam.id, "active")}>
                <Play className="h-4 w-4 mr-2 text-green-500" /> Activate Exam
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer text-red-500 ${isDarkMode ? 'focus:bg-slate-800' : 'focus:bg-slate-100'}`} onClick={() => handleDeleteExam(exam.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Exam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      case "active":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={isDarkMode ? "border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white bg-slate-800/50" : "border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"}>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={dialogBg}>
              <DropdownMenuItem className={`cursor-pointer ${dropItemHover}`} onClick={() => handleExamStatusChange(exam.id, "draft")}>
                <Pause className="h-4 w-4 mr-2 text-yellow-500" /> Deactivate Exam
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${dropItemHover}`} onClick={() => handleExamStatusChange(exam.id, "completed")}>
                <Square className="h-4 w-4 mr-2 text-blue-500" /> Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer ${dropItemHover}`} onClick={() => handleExamStatusChange(exam.id, "cancelled")}>
                <Square className="h-4 w-4 mr-2 text-slate-400" /> Cancel Exam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      case "completed":
      case "cancelled":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={isDarkMode ? "border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white bg-slate-800/50" : "border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"}>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={dialogBg}>
              <DropdownMenuItem className={`cursor-pointer ${dropItemHover}`} onClick={() => handleExamStatusChange(exam.id, "draft")}>
                <Pause className="h-4 w-4 mr-2 text-yellow-500" /> Reset to Draft
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer text-red-500 ${isDarkMode ? 'focus:bg-slate-800' : 'focus:bg-slate-100'}`} onClick={() => handleDeleteExam(exam.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete Exam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeBg}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={textSecondary}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen font-sans overflow-hidden flex flex-col transition-colors duration-300 ${themeBg}`}>
      
      {/* --- CAROUSEL BACKGROUND --- */}
      <div className="fixed inset-0 z-0">
        {backgroundImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{ 
              backgroundImage: `url('${img}')`,
              transitionDuration: "3s" 
            }}
          />
        ))}
        <div className={`absolute inset-0 backdrop-blur-[2px] transition-colors duration-300 ${overlayBg}`}></div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 flex flex-col flex-grow">
        
        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-md shadow-sm transition-colors duration-300 ${headerBg}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <Shield className={`h-8 w-8 drop-shadow-md group-hover:scale-105 transition-transform duration-300 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                <div>
                  <h1 className={`text-xl font-bold drop-shadow-md ${textPrimary}`}>PROCTOOL Dashboard</h1>
                  <p className={`text-sm ${textSecondary}`}>
                    {teacherData?.name} {teacherData?.department && teacherData.department !== "N/A" ? `- ${teacherData.department}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50" : "border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className={isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50" : "border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className={`backdrop-blur-sm shadow-xl transition-colors duration-300 ${cardBg}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${textSecondary}`}>Active Exams</CardTitle>
                <Users className={`h-4 w-4 ${textSecondary}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${textPrimary}`}>{stats.totalActive}</div>
                <p className={`text-xs mt-1 ${textSecondary}`}>Currently active exams</p>
              </CardContent>
            </Card>

            <Card className={`backdrop-blur-sm shadow-xl transition-colors duration-300 ${cardBg}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${textSecondary}`}>Total Violations</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${textSecondary}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{trueTotalViolations}</div>
                <p className={`text-xs mt-1 ${textSecondary}`}>Detected violations</p>
              </CardContent>
            </Card>

            <Card className={`backdrop-blur-sm shadow-xl transition-colors duration-300 ${cardBg}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${textSecondary}`}>Quick Actions</CardTitle>
                <Plus className={`h-4 w-4 ${textSecondary}`} />
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg">
                      <Plus className="h-4 w-4 mr-2" /> Create New Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`max-w-lg max-h-[90vh] overflow-hidden flex flex-col ${dialogBg}`}>
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className={textPrimary}>Create New Exam</DialogTitle>
                      <DialogDescription className={textSecondary}>Set up a new proctored exam</DialogDescription>
                    </DialogHeader>

                    {/* Form Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                      <div className="space-y-4 pb-4 mt-2">
                        
                        <div className="space-y-2">
                          <Label htmlFor="examTitle" className={textPrimary}>Exam Title *</Label>
                          <Input id="examTitle" placeholder="e.g., Mathematics Final Exam" value={newExam.title} onChange={(e) => setNewExam({ ...newExam, title: e.target.value })} className={inputBg} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="examCode" className={textPrimary}>Exam Code *</Label>
                          <Input id="examCode" placeholder="e.g., MATH101" value={newExam.examCode} onChange={(e) => setNewExam({ ...newExam, examCode: e.target.value })} className={`${inputBg} uppercase`} />
                          <p className={`text-xs ${textSecondary}`}>Students will use this exact code to access the exam.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="examDescription" className={textPrimary}>Description</Label>
                          <Textarea id="examDescription" placeholder="Brief description of the exam" value={newExam.description} onChange={(e) => setNewExam({ ...newExam, description: e.target.value })} rows={3} className={inputBg} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="duration" className={textPrimary}>Duration (minutes)</Label>
                          <Input id="duration" type="number" min="1" max="480" value={newExam.duration} onChange={(e) => setNewExam({ ...newExam, duration: Number.parseInt(e.target.value) || 60 })} className={inputBg} />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startTime" className={textPrimary}>Start Time</Label>
                            <Input id="startTime" type="datetime-local" value={newExam.startTime} onChange={(e) => setNewExam({ ...newExam, startTime: e.target.value })} className={inputBg} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endTime" className={textPrimary}>End Time (Optional)</Label>
                            <Input id="endTime" type="datetime-local" value={newExam.endTime} onChange={(e) => setNewExam({ ...newExam, endTime: e.target.value })} className={inputBg} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex-shrink-0 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <Button onClick={handleCreateExam} className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        Create Exam
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={() => window.open("https://docs.google.com/spreadsheets/d/1AtR9VxLeKRLtCWMnf5qxwMQ9RjCZDATqSobqIdm_8Zo/edit?gid=0#gid=0", "_blank")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg"
                >
                  <FileText className="h-4 w-4 mr-2" /> Proceed to Google Sheet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="exams" className="space-y-6">
            <TabsList className={`backdrop-blur-sm p-1 rounded-lg h-12 shadow-md transition-colors duration-300 ${cardBg}`}>
              <TabsTrigger value="exams" className={`h-full px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-semibold rounded-md transition-all`}>Teacher Logs</TabsTrigger>
              <TabsTrigger value="monitoring" className={`h-full px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-semibold rounded-md transition-all`}>Activity Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="exams" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className={`backdrop-blur-sm shadow-2xl transition-colors duration-300 ${cardBg}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
                    <FileText className="h-5 w-5 text-blue-500" /> My Exams Sessions ({exams.length})
                  </CardTitle>
                  <CardDescription className={`mt-1 ${textSecondary}`}>Manage your created exams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {exams.length === 0 ? (
                      <div className={`text-center py-12 border border-dashed rounded-xl ${emptyBoxBg}`}>
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30 text-blue-500" />
                        <p>No exams created yet. Create your first exam to get started!</p>
                      </div>
                    ) : (
                      exams.map((exam) => (
                        <div key={exam.id} className={`flex items-center justify-between p-4 border rounded-xl transition-colors shadow-sm ${rowBg}`}>
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg ${textPrimary}`}>{exam.title}</h3>
                            <p className={`text-sm mt-1 ${textSecondary}`}>{exam.description}</p>
                            <p className={`text-xs mt-2 ${textSecondary}`}>
                              Created: {new Date(exam.createdAt).toLocaleDateString()} • Duration: {exam.duration} min
                            </p>
                            {exam.startTime && <p className={`text-xs ${textSecondary}`}>Start: {formatDisplayDate(exam.startTime)}</p>}
                            <p className="text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded inline-block mt-2">
                              Exam Code: {exam.uniqueId}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
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

            <TabsContent value="monitoring" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className={`backdrop-blur-sm shadow-2xl transition-colors duration-300 ${cardBg}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
                        <List className="h-5 w-5 text-blue-500" />
                        Activity Logs ({filteredSessions.length} of {activeSessions.length})
                      </CardTitle>
                      <CardDescription className={`mt-1 ${textSecondary}`}>Logs of students currently taking exams</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => teacherData && pollLiveData(teacherData.id)}
                      disabled={isRefreshing}
                      className={`flex items-center gap-2 ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white'}`}
                    >
                      <Activity className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Manual Refresh'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    <div className={`space-y-4 pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search by student name, ID, or exam..."
                          value={monitoringSearch}
                          onChange={(e) => setMonitoringSearch(e.target.value)}
                          className={`flex-1 ${inputBg}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMonitoringSearch("")
                            setSelectedSeverity("all")
                            setSelectedViolationType("all")
                          }}
                          className={`h-10 px-4 ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white'}`}
                        >
                          Clear Filters
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className={`text-xs mb-2 block font-medium uppercase tracking-wider ${textSecondary}`}>Filter by Severity</Label>
                          <select
                            value={selectedSeverity}
                            onChange={(e) => setSelectedSeverity(e.target.value)}
                            className={`w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                          >
                            <option value="all">All Severities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label className={`text-xs mb-2 block font-medium uppercase tracking-wider ${textSecondary}`}>Filter by Type</Label>
                          <select
                            value={selectedViolationType}
                            onChange={(e) => setSelectedViolationType(e.target.value)}
                            className={`w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
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

                    {/* Sessions List */}
                    {activeSessions.length === 0 ? (
                      <div className={`text-center py-12 border border-dashed rounded-xl ${emptyBoxBg}`}>
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-30 text-blue-500" />
                        <p className={`text-lg font-medium mb-1 ${textPrimary}`}>No active exam sessions</p>
                        <p className="text-sm">Students taking exams will appear here.</p>
                      </div>
                    ) : filteredSessions.length === 0 ? (
                      <div className={`text-center py-12 border border-dashed rounded-xl ${emptyBoxBg}`}>
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-30 text-blue-500" />
                        <p>No sessions match your current filters.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`mt-4 ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                          onClick={() => {
                            setMonitoringSearch("")
                            setSelectedSeverity("all")
                            setSelectedViolationType("all")
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredSessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                            className={`flex items-start justify-between p-4 border rounded-xl transition-all cursor-pointer shadow-sm ${rowBg} ${isDarkMode ? 'hover:border-blue-500/50' : 'hover:border-blue-300'}`}
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-bold text-lg ${textPrimary}`}>{session.student_name}</h3>
                              </div>
                              <p className={`text-sm font-medium ${textSecondary}`}>{session.exam_title}</p>
                              
                              <div className={`flex items-center gap-4 text-xs mt-2 ${textSecondary}`}>
                                <span className={`px-2 py-1 rounded border shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>ID: {session.student_id}</span>
                                
                                {/* FIX: Activity Logs now use the dedicated formatActivityDate to correct the shift */}
                                <span>Started: {formatActivityDate(session.start_time)}</span>
                                
                                {/* @ts-ignore */}
                                {session.matchingViolations && session.matchingViolations.length > 0 && (
                                  <Badge className={isDarkMode ? "bg-red-900/30 text-red-400 border border-red-800" : "bg-red-100 text-red-700 border border-red-300"}>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {/* @ts-ignore */}
                                    {session.matchingViolations.length} Violation{session.matchingViolations.length !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>

                              {/* Expanded Violations View */}
                              {selectedSession?.id === session.id && (
                                <div className={`mt-4 pt-4 border-t space-y-3 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                  {/* @ts-ignore */}
                                  <h4 className={`font-semibold text-sm ${textPrimary}`}>Violations Matching Filters ({session.matchingViolations.length}):</h4>
                                  {/* @ts-ignore */}
                                  {session.matchingViolations.length === 0 ? (
                                    <p className={`text-xs italic p-2 rounded border ${isDarkMode ? 'text-green-400 bg-green-900/10 border-green-900/30' : 'text-green-700 bg-green-50 border-green-200'}`}>No violations recorded for this session that match your filter.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {/* @ts-ignore */}
                                      {session.matchingViolations.map((violation: Violation) => (
                                        <div key={violation.id} className={`border rounded-lg p-3 space-y-2 shadow-inner ${isDarkMode ? 'bg-slate-900 border-red-900/50' : 'bg-white border-red-200'}`}>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`font-mono text-xs ${isDarkMode ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                              {violation.violationType.replace(/_/g, " ")}
                                            </Badge>
                                            <Badge className={getSeverityColor(violation.severity)}>
                                              {violation.severity.toUpperCase()}
                                            </Badge>
                                          </div>
                                          <p className={`text-xs leading-relaxed ${textPrimary}`}>{violation.description}</p>
                                          {/* FIX: Activity Logs now use the dedicated formatActivityDate */}
                                          <p className={`text-[10px] font-mono ${textSecondary}`}>{formatActivityDate(violation.timestamp)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
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
    </div>
  )
}