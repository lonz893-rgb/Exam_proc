"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Users, Database, AlertTriangle, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
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

interface Student {
  id: string
  name: string
  email: string
  student_id: string
  status: "active" | "suspended"
  created_at: string
}

interface Teacher {
  id: string
  name: string
  email: string
  department: string
  status: "active" | "inactive"
  created_at: string
}

interface SystemLog {
  id: string
  log_type: "login" | "violation" | "system" | "error"
  user_type: "student" | "teacher" | "admin" | "system"
  message: string
  timestamp: string
  severity: "low" | "medium" | "high"
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
  const [showPassword, setShowPassword] = useState(false)
  const [adminData, setAdminData] = useState<Admin | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Dialog states
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  // Form states
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    studentId: "",
    status: "active" as "active" | "suspended",
  })
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    department: "",
    status: "active" as "active" | "inactive",
  })

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeExams: 0,
    totalViolations: 0,
  })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if already authenticated
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

      // Load students
      const studentsResponse = await fetch("/api/admin/students")
      const studentsData = await studentsResponse.json()
      if (studentsData.success) {
        setStudents(studentsData.students)
      }

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

      // Update stats
      setStats({
        totalStudents: studentsData.students?.length || 0,
        totalTeachers: teachersData.teachers?.length || 0,
        activeExams: 0, // This would come from exams API
        totalViolations: 0, // This would come from violations API
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

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.studentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newStudent.name,
          email: newStudent.email,
          studentId: newStudent.studentId,
          status: newStudent.status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Student added successfully",
        })

        // Reload data
        await loadAdminData()

        setShowAddStudent(false)
        setNewStudent({ name: "", email: "", studentId: "", status: "active" })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add student",
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

  const handleEditStudent = async (student: Student) => {
    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: student.name,
          email: student.email,
          student_id: student.student_id,
          status: student.status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Student updated successfully",
        })

        // Reload data
        await loadAdminData()
        setEditingStudent(null)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update student",
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

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Student deleted successfully",
        })

        // Reload data
        await loadAdminData()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete student",
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

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTeacher),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Teacher added successfully",
        })

        // Reload data
        await loadAdminData()

        setShowAddTeacher(false)
        setNewTeacher({ name: "", email: "", department: "", status: "active" })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add teacher",
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

  const handleEditTeacher = async (teacher: Teacher) => {
    try {
      const response = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          status: teacher.status,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Teacher updated successfully",
        })

        // Reload data
        await loadAdminData()
        setEditingTeacher(null)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update teacher",
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

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Teacher deleted successfully",
        })

        // Reload data
        await loadAdminData()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete teacher",
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
    setIsAuthenticated(false)
    setAdminData(null)
    localStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminData")
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
      case "inactive":
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-4 border-red-200">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-red-600">IT Proctool Admin Portal</CardTitle>
            <CardDescription>Administrator credentials required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This portal is for authorized administrators only. All access attempts are logged and monitored.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Administrator Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@itproctool.edu"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter secure password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={handleAdminLogin} className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Authenticate"}
            </Button>

            <div className="text-center text-xs text-gray-600">Demo: admin@itproctool.edu / SecureAdmin2024!</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading && !students.length && !teachers.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">IT Proctool Admin Portal</h1>
                <p className="text-sm text-red-100">
                  {adminData?.name} - {adminData?.role}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 border-white hover:bg-red-50 bg-transparent"
            >
              Secure Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeExams}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-green-600">✅ Connected to MySQL</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Management</TabsTrigger>
            <TabsTrigger value="system">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Student Accounts ({students.length})</CardTitle>
                    <CardDescription>Manage student registrations and access</CardDescription>
                  </div>
                  <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Create a new student account</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="studentName">Full Name</Label>
                          <Input
                            id="studentName"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                            placeholder="Enter student's full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="studentEmail">Email</Label>
                          <Input
                            id="studentEmail"
                            type="email"
                            value={newStudent.email}
                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                            placeholder="student@itproctool.edu"
                          />
                        </div>
                        <div>
                          <Label htmlFor="studentId">Student ID</Label>
                          <Input
                            id="studentId"
                            value={newStudent.studentId}
                            onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                            placeholder="STU001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="studentStatus">Status</Label>
                          <Select
                            value={newStudent.status}
                            onValueChange={(value: "active" | "suspended") =>
                              setNewStudent({ ...newStudent, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddStudent} className="w-full">
                          Add Student
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No students found. Add your first student to get started!</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <p className="text-xs text-gray-500">
                            ID: {student.student_id} • Created: {new Date(student.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                          <div className="flex space-x-1">
                            <Dialog
                              open={editingStudent?.id === student.id}
                              onOpenChange={(open) => !open && setEditingStudent(null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingStudent(student)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Student</DialogTitle>
                                  <DialogDescription>Update student information</DialogDescription>
                                </DialogHeader>
                                {editingStudent && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="editStudentName">Full Name</Label>
                                      <Input
                                        id="editStudentName"
                                        value={editingStudent.name}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editStudentEmail">Email</Label>
                                      <Input
                                        id="editStudentEmail"
                                        type="email"
                                        value={editingStudent.email}
                                        onChange={(e) =>
                                          setEditingStudent({ ...editingStudent, email: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editStudentId">Student ID</Label>
                                      <Input
                                        id="editStudentId"
                                        value={editingStudent.student_id}
                                        onChange={(e) =>
                                          setEditingStudent({ ...editingStudent, student_id: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editStudentStatus">Status</Label>
                                      <Select
                                        value={editingStudent.status}
                                        onValueChange={(value: "active" | "suspended") =>
                                          setEditingStudent({ ...editingStudent, status: value })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={() => handleEditStudent(editingStudent)} className="w-full">
                                      Update Student
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {student.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStudent(student.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Teacher Accounts ({teachers.length})</CardTitle>
                    <CardDescription>Manage teacher access and permissions</CardDescription>
                  </div>
                  <Dialog open={showAddTeacher} onOpenChange={setShowAddTeacher}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Teacher
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Teacher</DialogTitle>
                        <DialogDescription>Create a new teacher account</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="teacherName">Full Name</Label>
                          <Input
                            id="teacherName"
                            value={newTeacher.name}
                            onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                            placeholder="Enter teacher's full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="teacherEmail">Email</Label>
                          <Input
                            id="teacherEmail"
                            type="email"
                            value={newTeacher.email}
                            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                            placeholder="teacher@itproctool.edu"
                          />
                        </div>
                        <div>
                          <Label htmlFor="teacherDepartment">Department</Label>
                          <Input
                            id="teacherDepartment"
                            value={newTeacher.department}
                            onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                            placeholder="Mathematics"
                          />
                        </div>
                        <div>
                          <Label htmlFor="teacherStatus">Status</Label>
                          <Select
                            value={newTeacher.status}
                            onValueChange={(value: "active" | "inactive") =>
                              setNewTeacher({ ...newTeacher, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddTeacher} className="w-full">
                          Add Teacher
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teachers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No teachers found. Add your first teacher to get started!</p>
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{teacher.name}</h3>
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                          <p className="text-xs text-gray-500">
                            Department: {teacher.department} • Created:{" "}
                            {new Date(teacher.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(teacher.status)}>{teacher.status}</Badge>
                          <div className="flex space-x-1">
                            <Dialog
                              open={editingTeacher?.id === teacher.id}
                              onOpenChange={(open) => !open && setEditingTeacher(null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingTeacher(teacher)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Teacher</DialogTitle>
                                  <DialogDescription>Update teacher information</DialogDescription>
                                </DialogHeader>
                                {editingTeacher && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="editTeacherName">Full Name</Label>
                                      <Input
                                        id="editTeacherName"
                                        value={editingTeacher.name}
                                        onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editTeacherEmail">Email</Label>
                                      <Input
                                        id="editTeacherEmail"
                                        type="email"
                                        value={editingTeacher.email}
                                        onChange={(e) =>
                                          setEditingTeacher({ ...editingTeacher, email: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editTeacherDepartment">Department</Label>
                                      <Input
                                        id="editTeacherDepartment"
                                        value={editingTeacher.department}
                                        onChange={(e) =>
                                          setEditingTeacher({ ...editingTeacher, department: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="editTeacherStatus">Status</Label>
                                      <Select
                                        value={editingTeacher.status}
                                        onValueChange={(value: "active" | "inactive") =>
                                          setEditingTeacher({ ...editingTeacher, status: value })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="active">Active</SelectItem>
                                          <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={() => handleEditTeacher(editingTeacher)} className="w-full">
                                      Update Teacher
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 bg-transparent">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {teacher.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Activity Logs ({systemLogs.length})</CardTitle>
                <CardDescription>Monitor system events and security alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No system logs found.</p>
                    </div>
                  ) : (
                    systemLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.log_type}</Badge>
                            <Badge variant="outline">{log.user_type}</Badge>
                          </div>
                          <p className="text-sm">{log.message}</p>
                        </div>

                        <div className="text-right text-sm text-gray-600">
                          <p>{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
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
