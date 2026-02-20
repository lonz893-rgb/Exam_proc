"use client"
export const dynamic = "force-dynamic"; 
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Users, Database, AlertTriangle, Plus, Edit, Trash2, Eye, EyeOff, Sun, Moon, FileText, ChevronDown, ChevronUp, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Teacher {
  id: string
  name: string
  email: string
  department?: string
  status: "active" | "inactive"
  created_at: string
  password?: string 
}

interface Exam {
  id: string
  title: string
  unique_id?: string
  uniqueId?: string
  status: string
}

interface SystemLog {
  id: string
  log_type: string     
  user_type: string    
  message: string      
  timestamp: string    
  severity: string     
}

interface Admin {
  id: number
  name: string
  email: string
  role: string
}

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  
  // Visibility toggles for passwords
  const [showPassword, setShowPassword] = useState(false)
  const [showTeacherPassword, setShowTeacherPassword] = useState(false) 
  const [showEditTeacherPassword, setShowEditTeacherPassword] = useState(false) 
  
  const [adminData, setAdminData] = useState<Admin | null>(null)
  
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Accordion State for Teacher Exams
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
  const [teacherExams, setTeacherExams] = useState<Record<string, Exam[]>>({})
  const [isLoadingExams, setIsLoadingExams] = useState<Record<string, boolean>>({})
  
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

  // System logs search and filter states
  const [logSearch, setLogSearch] = useState("")
  const [selectedLogType, setSelectedLogType] = useState<string>("all")
  const [selectedUserType, setSelectedUserType] = useState<string>("all")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")

  // Dialog states
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  // Form states
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    password: "", 
    status: "active" as "active" | "inactive",
  })

  const [stats, setStats] = useState({
    totalTeachers: 0,
    activeExams: 0,
    totalViolations: 0,
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

  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuthenticated")
    const storedAdminData = localStorage.getItem("adminData")
    if (adminAuth === "true" && storedAdminData) {
      setIsAuthenticated(true)
      setAdminData(JSON.parse(storedAdminData))
      loadAdminData()
    }
  }, [])

  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      })

      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
        setAdminData(data.admin)
        localStorage.setItem("adminAuthenticated", "true")
        localStorage.setItem("adminData", JSON.stringify(data.admin))
        loadAdminData()
        toast({
          title: "Access Granted",
          description: `Welcome ${data.admin.name}`,
        })
      } else {
        toast({
          title: "Access Denied",
          description: data.message || "Invalid administrator credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection error. Please check if the server is running.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAdminData = async () => {
    try {
      setIsLoading(true)

      // Load teachers
      const teachersResponse = await fetch("/api/admin/teachers")
      const teachersData = await teachersResponse.json()
      if (teachersData.success) {
        setTeachers(teachersData.teachers)
      }

      // Load system logs
      const logsResponse = await fetch("/api/admin/system-logs?limit=50")
      const logsData = await logsResponse.json()
      if (logsData.success) {
        setSystemLogs(logsData.logs)
      }

      // FIX: Calculate Active Exams and Violations by fetching across ALL teachers
      let activeCount = 0;
      let violationsCount = 0;

      if (teachersData.success && teachersData.teachers) {
        const timestamp = Date.now();

        // Fire off all exam and violation requests simultaneously for speed
        const examPromises = teachersData.teachers.map((t: Teacher) => 
          fetch(`/api/exams?teacherId=${t.id}`).then(res => res.json()).catch(() => ({ success: false }))
        );
        
        const violationPromises = teachersData.teachers.map((t: Teacher) => 
          fetch(`/api/violations?teacherId=${t.id}&_t=${timestamp}`).then(res => res.json()).catch(() => ({ success: false }))
        );

        const allExamsResults = await Promise.all(examPromises);
        const allViolationsResults = await Promise.all(violationPromises);

        // Tally up active exams
        allExamsResults.forEach((result: any) => {
          if (result.success && result.exams) {
            activeCount += result.exams.filter((exam: any) => exam.status === "active").length;
          }
        });

        // Tally up violations
        allViolationsResults.forEach((result: any) => {
          if (result.success && result.violations) {
            violationsCount += result.violations.length;
          }
        });
      }

      // Update stats
      setStats({
        totalTeachers: teachersData.teachers?.length || 0,
        activeExams: activeCount, 
        totalViolations: violationsCount, 
      })
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load data from database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTeacher = async (teacherId: string) => {
    // If clicking the same teacher, collapse it
    if (expandedTeacher === teacherId) {
      setExpandedTeacher(null)
      return
    }

    setExpandedTeacher(teacherId)

    // Fetch exams for this teacher if we haven't already
    if (!teacherExams[teacherId]) {
      setIsLoadingExams((prev) => ({ ...prev, [teacherId]: true }))
      try {
        const response = await fetch(`/api/exams?teacherId=${teacherId}`)
        const data = await response.json()
        if (data.success) {
          setTeacherExams((prev) => ({ ...prev, [teacherId]: data.exams }))
        }
      } catch (error) {
        console.error("Failed to fetch teacher exams:", error)
      } finally {
        setIsLoadingExams((prev) => ({ ...prev, [teacherId]: false }))
      }
    }
  }

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeacher),
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "Teacher added successfully" })
        await loadAdminData()
        setShowAddTeacher(false)
        setNewTeacher({ name: "", email: "", password: "", status: "active" })
        setShowTeacherPassword(false) // Reset password visibility
      } else {
        toast({ title: "Error", description: data.message || "Failed to add teacher", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error. Please try again.", variant: "destructive" })
    }
  }

  const handleEditTeacher = async (teacher: Teacher) => {
    try {
      const response = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacher.name,
          email: teacher.email,
          password: teacher.password, 
          status: teacher.status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "Teacher updated successfully" })
        await loadAdminData()
        setEditingTeacher(null)
        setShowEditTeacherPassword(false)
      } else {
        toast({ title: "Error", description: data.message || "Failed to update teacher", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error. Please try again.", variant: "destructive" })
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, { method: "DELETE" })
      const data = await response.json()

      if (data.success) {
        toast({ title: "Success", description: "Teacher deleted successfully" })
        await loadAdminData()
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete teacher", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error. Please try again.", variant: "destructive" })
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setAdminData(null)
    localStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminData")
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case "active": return "bg-green-500/20 text-green-400 border border-green-500/30"
        case "suspended":
        case "inactive": return "bg-red-500/20 text-red-400 border border-red-500/30"
        default: return "bg-slate-500/20 text-slate-300 border border-slate-500/30"
      }
    } else {
      switch (status) {
        case "active": return "bg-green-100 text-green-700 border border-green-300"
        case "suspended":
        case "inactive": return "bg-red-100 text-red-700 border border-red-300"
        default: return "bg-slate-100 text-slate-700 border border-slate-300"
      }
    }
  }

  const getExamStatusColor = (status: string) => {
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

  // Filter system logs based on search and filters
  const filteredSystemLogs = systemLogs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase())
    const matchesLogType = selectedLogType === "all" || log.log_type === selectedLogType
    const matchesUserType = selectedUserType === "all" || log.user_type === selectedUserType

    return matchesSearch && matchesLogType && matchesUserType
  })

  // Get unique log types and user types for filters, ensuring 'student' is removed
  const uniqueLogTypes = Array.from(new Set(systemLogs.map((log) => log.log_type)))
  const uniqueUserTypes = Array.from(new Set(systemLogs.map((log) => log.user_type)))
    .filter(type => type.toLowerCase() !== 'student')

  // --- THEME CLASSES ---
  const themeBg = isDarkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"
  const overlayBg = isDarkMode ? "bg-slate-950/85" : "bg-white/85"
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900"
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500"
  const inputBg = isDarkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500"
  const dialogBg = isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
  const rowBg = isDarkMode ? "border-slate-800 bg-slate-800/30 hover:bg-slate-800/70" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
  const expandedBg = isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-200"
  const headerBg = isDarkMode ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
  const tagBg = isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-100 border-slate-300"
  const tagText = isDarkMode ? "text-slate-300" : "text-slate-700"
  const codeText = isDarkMode ? "text-blue-400" : "text-blue-600"

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
        
        {/* LOGIN SCREEN */}
        {!isAuthenticated ? (
          <div className="flex-grow flex items-center justify-center">
            <Card className={`w-full max-w-md mx-4 backdrop-blur-md shadow-2xl transition-colors duration-300 ${cardBg} ${isDarkMode ? 'border-red-900/50' : 'border-red-200'}`}>
              <CardHeader className="text-center relative">
                {/* Theme Toggle on Login */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className={`absolute right-4 top-4 ${textSecondary} hover:${textPrimary}`}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Shield className="h-12 w-12 text-red-500 drop-shadow-md mx-auto mb-4" />
                <CardTitle className={`text-2xl font-bold ${textPrimary}`}>IT Proctool Admin Portal</CardTitle>
                <CardDescription className={textSecondary}>Administrator credentials required</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className={isDarkMode ? "border-red-900/50 bg-red-900/20" : "border-red-200 bg-red-50"}>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className={isDarkMode ? "text-red-200 text-sm" : "text-red-800 text-sm"}>
                    This portal is for authorized administrators only. All access attempts are logged and monitored.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className={textPrimary}>Administrator Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@itproctool.edu"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={isLoading}
                    className={inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword" className={textPrimary}>Password</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter secure password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                      disabled={isLoading}
                      className={`${inputBg} pr-10`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`absolute right-0 top-0 h-full px-3 py-2 ${textSecondary} hover:bg-transparent`}
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleAdminLogin} className="w-full bg-red-600 hover:bg-red-500 text-white shadow-lg" disabled={isLoading}>
                  {isLoading ? "Authenticating..." : "Authenticate"}
                </Button>

                <div className={`text-center text-xs ${textSecondary}`}>Demo: admin@itproctool.edu / SecureAdmin2024!</div>
              </CardContent>
            </Card>
          </div>
        ) : isLoading && !teachers.length ? (
          /* LOADING SCREEN */
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className={textSecondary}>Loading admin dashboard...</p>
            </div>
          </div>
        ) : (
          /* DASHBOARD */
          <>
            <header className={`sticky top-0 z-50 backdrop-blur-md shadow-sm transition-colors duration-300 ${headerBg}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-3 group">
                    <Shield className="h-8 w-8 text-red-500 drop-shadow-md group-hover:scale-105 transition-transform duration-300" />
                    <div>
                      <h1 className={`text-xl font-bold drop-shadow-md ${textPrimary}`}>IT Proctool Admin Portal</h1>
                      <p className={`text-sm ${textSecondary}`}>
                        {adminData?.name} - {adminData?.role}
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
                      Secure Logout
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className={`backdrop-blur-sm shadow-xl transition-colors duration-300 ${cardBg}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${textSecondary}`}>Total Teachers</CardTitle>
                    <Users className={`h-4 w-4 ${textSecondary}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${textPrimary}`}>{stats.totalTeachers}</div>
                  </CardContent>
                </Card>

                <Card className={`backdrop-blur-sm shadow-xl transition-colors duration-300 ${cardBg}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${textSecondary}`}>Active Exams</CardTitle>
                    <Database className={`h-4 w-4 ${textSecondary}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">{stats.activeExams}</div>
                  </CardContent>
                </Card>

                <Card className={`backdrop-blur-sm shadow-xl transition-colors duration-300 flex flex-col justify-between ${cardBg}`}>
                  <div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className={`text-sm font-medium ${textSecondary}`}>System Status</CardTitle>
                      <Shield className={`h-4 w-4 ${textSecondary}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-bold text-green-500 flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                        Connected to MySQL
                      </div>
                    </CardContent>
                  </div>
                  {/* Added Proceed to Google Sheet Button */}
                  <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <Button 
                      onClick={() => window.open("https://docs.google.com/spreadsheets/d/1AtR9VxLeKRLtCWMnf5qxwMQ9RjCZDATqSobqIdm_8Zo/edit?gid=0#gid=0", "_blank")}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg"
                    >
                      <FileText className="h-4 w-4 mr-2" /> Proceed to Google Sheet
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Admin Tabs */}
              <Tabs defaultValue="teachers" className="space-y-6">
                <TabsList className={`backdrop-blur-sm p-1 rounded-lg h-12 shadow-md flex justify-start overflow-x-auto overflow-y-hidden custom-scrollbar transition-colors duration-300 ${cardBg}`}>
                  <TabsTrigger value="teachers" className={`h-full px-6 data-[state=active]:bg-red-600 data-[state=active]:text-white ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-semibold rounded-md transition-all whitespace-nowrap`}>Teacher Management</TabsTrigger>
                  <TabsTrigger value="system" className={`h-full px-6 data-[state=active]:bg-red-600 data-[state=active]:text-white ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-semibold rounded-md transition-all whitespace-nowrap`}>System Logs</TabsTrigger>
                </TabsList>

                {/* TEACHERS TAB */}
                <TabsContent value="teachers" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Card className={`backdrop-blur-sm shadow-2xl transition-colors duration-300 ${cardBg}`}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <CardTitle className={textPrimary}>Teacher Accounts ({teachers.length})</CardTitle>
                          <CardDescription className={`mt-1 ${textSecondary}`}>Manage teacher access and view their exams</CardDescription>
                        </div>
                        <Dialog open={showAddTeacher} onOpenChange={setShowAddTeacher}>
                          <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-500 text-white shadow-lg shrink-0">
                              <Plus className="h-4 w-4 mr-2" /> Add Teacher
                            </Button>
                          </DialogTrigger>
                          <DialogContent className={dialogBg}>
                            <DialogHeader>
                              <DialogTitle className={textPrimary}>Add New Teacher</DialogTitle>
                              <DialogDescription className={textSecondary}>Create a new teacher account</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="teacherName" className={textPrimary}>Full Name</Label>
                                <Input
                                  id="teacherName"
                                  value={newTeacher.name}
                                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                  placeholder="Enter teacher's full name"
                                  className={inputBg}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="teacherEmail" className={textPrimary}>Email</Label>
                                <Input
                                  id="teacherEmail"
                                  type="email"
                                  value={newTeacher.email}
                                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                  placeholder="teacher@itproctool.edu"
                                  className={inputBg}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="teacherPassword" className={textPrimary}>Password</Label>
                                <div className="relative">
                                  <Input
                                    id="teacherPassword"
                                    type={showTeacherPassword ? "text" : "password"}
                                    value={newTeacher.password}
                                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                    placeholder="Enter secure password"
                                    className={`${inputBg} pr-10`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={`absolute right-0 top-0 h-full px-3 py-2 ${textSecondary} hover:bg-transparent`}
                                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                                  >
                                    {showTeacherPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="teacherStatus" className={textPrimary}>Status</Label>
                                <Select
                                  value={newTeacher.status}
                                  onValueChange={(value: "active" | "inactive") =>
                                    setNewTeacher({ ...newTeacher, status: value })
                                  }
                                >
                                  <SelectTrigger className={inputBg}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className={dialogBg}>
                                    <SelectItem value="active" className="cursor-pointer">Active</SelectItem>
                                    <SelectItem value="inactive" className="cursor-pointer text-red-500">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleAddTeacher} className="w-full bg-red-600 hover:bg-red-500 text-white mt-4">
                                Add Teacher
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teachers.length === 0 ? (
                          <div className={`text-center py-12 border border-dashed rounded-xl ${isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-30 text-red-400" />
                            <p>No teachers found. Add your first teacher to get started!</p>
                          </div>
                        ) : (
                          teachers.map((teacher) => (
                            <div key={teacher.id} className={`flex flex-col border rounded-xl transition-colors shadow-sm ${rowBg}`}>
                              {/* TEACHER MAIN ROW (CLICKABLE) */}
                              <div 
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 cursor-pointer"
                                onClick={() => handleToggleTeacher(teacher.id)}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold text-lg ${textPrimary}`}>{teacher.name}</h3>
                                    {expandedTeacher === teacher.id ? (
                                      <ChevronUp className="h-5 w-5 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-slate-400" />
                                    )}
                                  </div>
                                  <p className={`text-sm ${textSecondary}`}>{teacher.email}</p>
                                  <p className={`text-xs mt-2 font-mono px-2 py-1 inline-block rounded border ${tagBg} ${tagText}`}>
                                    Created: {new Date(teacher.created_at).toLocaleDateString()}
                                  </p>
                                </div>

                                {/* Action Buttons (Stop propagation so click doesn't trigger the accordion) */}
                                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                                  <Badge className={getStatusColor(teacher.status)}>{teacher.status}</Badge>
                                  <div className="flex space-x-2">
                                    <Dialog
                                      open={editingTeacher?.id === teacher.id}
                                      onOpenChange={(open) => {
                                        if (!open) {
                                          setEditingTeacher(null)
                                          setShowEditTeacherPassword(false) 
                                        }
                                      }}
                                    >
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => setEditingTeacher({...teacher, password: ""})} className={`h-8 w-8 p-0 ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50' : 'border-slate-300 text-slate-600 hover:bg-slate-100 bg-white'}`}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className={dialogBg}>
                                        <DialogHeader>
                                          <DialogTitle className={textPrimary}>Edit Teacher</DialogTitle>
                                          <DialogDescription className={textSecondary}>Update teacher information</DialogDescription>
                                        </DialogHeader>
                                        {editingTeacher && (
                                          <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="editTeacherName" className={textPrimary}>Full Name</Label>
                                              <Input
                                                id="editTeacherName"
                                                value={editingTeacher.name}
                                                onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                                                className={inputBg}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="editTeacherEmail" className={textPrimary}>Email</Label>
                                              <Input
                                                id="editTeacherEmail"
                                                type="email"
                                                value={editingTeacher.email}
                                                onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                                                className={inputBg}
                                              />
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <Label htmlFor="editTeacherPassword" className={textPrimary}>New Password</Label>
                                              <div className="relative">
                                                <Input
                                                  id="editTeacherPassword"
                                                  type={showEditTeacherPassword ? "text" : "password"}
                                                  value={editingTeacher.password || ""}
                                                  onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                                                  placeholder="Leave blank to keep current password"
                                                  className={`${inputBg} pr-10`}
                                                />
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  className={`absolute right-0 top-0 h-full px-3 py-2 ${textSecondary} hover:bg-transparent`}
                                                  onClick={() => setShowEditTeacherPassword(!showEditTeacherPassword)}
                                                >
                                                  {showEditTeacherPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                              </div>
                                            </div>

                                            <div className="space-y-2">
                                              <Label htmlFor="editTeacherStatus" className={textPrimary}>Status</Label>
                                              <Select
                                                value={editingTeacher.status}
                                                onValueChange={(value: "active" | "inactive") =>
                                                  setEditingTeacher({ ...editingTeacher, status: value })
                                                }
                                              >
                                                <SelectTrigger className={inputBg}>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className={dialogBg}>
                                                  <SelectItem value="active" className="cursor-pointer">Active</SelectItem>
                                                  <SelectItem value="inactive" className="cursor-pointer text-red-500">Inactive</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <Button onClick={() => handleEditTeacher(editingTeacher)} className="w-full bg-red-600 hover:bg-red-500 text-white mt-4">
                                              Update Teacher
                                            </Button>
                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" className={`h-8 w-8 p-0 ${isDarkMode ? 'border-red-900/50 text-red-400 hover:bg-red-900/30 hover:text-red-300 bg-slate-900/50' : 'border-red-200 text-red-600 hover:bg-red-50 bg-white'}`}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className={dialogBg}>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                          <AlertDialogDescription className={textSecondary}>
                                            Are you sure you want to delete <strong className={textPrimary}>{teacher.name}</strong>? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-transparent border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteTeacher(teacher.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>

                              {/* EXAMS DROPDOWN LIST */}
                              {expandedTeacher === teacher.id && (
                                <div className={`p-4 border-t rounded-b-xl ${expandedBg}`}>
                                  <h4 className={`text-sm font-semibold mb-3 ${textPrimary}`}>Exams Created by {teacher.name}</h4>
                                  
                                  {isLoadingExams[teacher.id] ? (
                                    <p className={`text-sm flex items-center gap-2 ${textSecondary}`}>
                                      <Activity className="h-4 w-4 animate-spin"/> Loading exams...
                                    </p>
                                  ) : teacherExams[teacher.id] && teacherExams[teacher.id].length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {teacherExams[teacher.id].map(exam => (
                                        <div key={exam.id} className={`p-3 rounded border flex justify-between items-center ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-white'}`}>
                                          <div>
                                            <p className={`font-medium text-sm ${textPrimary}`}>{exam.title}</p>
                                            <p className={`text-xs font-mono mt-1 ${codeText}`}>Code: {exam.unique_id || exam.uniqueId || 'N/A'}</p>
                                          </div>
                                          <Badge className={getExamStatusColor(exam.status)}>{exam.status}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className={`text-sm italic ${textSecondary}`}>No exams created by this teacher yet.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SYSTEM LOGS TAB */}
                <TabsContent value="system" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Card className={`backdrop-blur-sm shadow-2xl transition-colors duration-300 ${cardBg}`}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
                        <Database className="h-5 w-5 text-red-500" /> System Activity Logs ({filteredSystemLogs.length} of {systemLogs.length})
                      </CardTitle>
                      <CardDescription className={`mt-1 ${textSecondary}`}>Monitor system events and security alerts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Search and Filter Controls */}
                        <div className={`space-y-4 pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search logs by message..."
                              value={logSearch}
                              onChange={(e) => setLogSearch(e.target.value)}
                              className={`flex-1 ${inputBg}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLogSearch("")
                                setSelectedLogType("all")
                                setSelectedUserType("all")
                              }}
                              className={`h-10 px-4 ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white'}`}
                            >
                              Clear
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className={`text-xs mb-2 block font-medium uppercase tracking-wider ${textSecondary}`}>Filter by Log Type</Label>
                              <select
                                value={selectedLogType}
                                onChange={(e) => setSelectedLogType(e.target.value)}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                              >
                                <option value="all">All Types</option>
                                {uniqueLogTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label className={`text-xs mb-2 block font-medium uppercase tracking-wider ${textSecondary}`}>Filter by User Type</Label>
                              <select
                                value={selectedUserType}
                                onChange={(e) => setSelectedUserType(e.target.value)}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                              >
                                <option value="all">All Users</option>
                                {uniqueUserTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Logs Display */}
                        {systemLogs.length === 0 ? (
                          <div className={`text-center py-12 border border-dashed rounded-xl ${isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-30 text-red-500" />
                            <p>No system logs found.</p>
                          </div>
                        ) : filteredSystemLogs.length === 0 ? (
                          <div className={`text-center py-12 border border-dashed rounded-xl ${isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-30 text-red-500" />
                            <p>No logs match your search or filters.</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`mt-4 ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50' : 'border-slate-300 text-slate-700 hover:bg-slate-100 bg-white'}`}
                              onClick={() => {
                                setLogSearch("")
                                setSelectedLogType("all")
                                setSelectedUserType("all")
                              }}
                            >
                              Clear Filters
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredSystemLogs.map((log) => (
                            <div key={log.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl transition-colors shadow-sm gap-4 ${rowBg}`}>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={`font-mono text-xs ${tagBg} ${tagText}`}>{log.log_type}</Badge>
                                  <Badge className={`font-mono text-xs ${tagBg} ${tagText}`}>{log.user_type}</Badge>
                                </div>
                                <p className={`text-sm ${textPrimary}`}>{log.message}</p>
                              </div>

                              <div className={`text-right text-xs font-mono px-2 py-1 rounded border shrink-0 ${tagBg} ${tagText}`}>
                                <p>{new Date(log.timestamp).toLocaleString()}</p>
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
          </>
        )}
      </div>
    </div>
  )
}