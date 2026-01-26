"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, GraduationCap, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function HomePage() {
  const [studentId, setStudentId] = useState("")
  const [uniqueFormId, setUniqueFormId] = useState("")
  const [teacherEmail, setTeacherEmail] = useState("")
  const [teacherPassword, setTeacherPassword] = useState("")
  const [showFormIdModal, setShowFormIdModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleStudentLogin = async () => {
    if (!studentId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Student ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("userRole", "student")
        localStorage.setItem("studentData", JSON.stringify(data.student))
        setShowFormIdModal(true)
        toast({
          title: "Success",
          description: `Welcome ${data.student.name}!`,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Student not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Student login error:", error)
      toast({
        title: "Error",
        description: "Connection error. Please check if the server is running.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormIdSubmit = async () => {
    if (!uniqueFormId.trim()) {
      toast({
        title: "Error",
        description: "Please enter the Unique Form ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/exams/by-unique-id?uniqueId=${uniqueFormId.toUpperCase()}`)
      const data = await response.json()

      if (data.success && data.exam) {
        const exam = data.exam

        if (exam.status !== "active") {
          toast({
            title: "Exam Not Available",
            description: "This exam is not currently active",
            variant: "destructive",
          })
          return
        }

        localStorage.setItem("currentExam", JSON.stringify(exam))
        router.push(`/student/exam/${exam.id}`)
      } else {
        toast({
          title: "Invalid Form ID",
          description: "The Unique Form ID you entered is not valid or the exam is not active",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Form ID error:", error)
      toast({
        title: "Error",
        description: "Connection error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeacherLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!teacherEmail.trim() || !teacherPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Attempting teacher login with:", { email: teacherEmail })

      const response = await fetch("/api/auth/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword }),
      })

      console.log("Teacher login response status:", response.status)
      const data = await response.json()
      console.log("Teacher login response data:", data)

      if (data.success) {
        localStorage.setItem("userRole", "teacher")
        localStorage.setItem("teacherData", JSON.stringify(data.teacher))

        toast({
          title: "Success",
          description: `Welcome ${data.teacher.name}!`,
        })

        router.push("/teacher/dashboard")
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Teacher login error:", error)
      toast({
        title: "Error",
        description: "Connection error. Please check if the server is running.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">IT Proctool</h1>
            </div>
            <div className="text-sm text-gray-600">Secure Online Proctoring System</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to IT Proctool</h2>
          <p className="text-xl text-gray-600 mb-8">
            Advanced online exam monitoring with real-time cheating detection
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Eye className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600">Advanced detection of suspicious behavior during exams</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure Environment</h3>
              <p className="text-gray-600">Fullscreen enforcement and tab switching prevention</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Direct Access</h3>
              <p className="text-gray-600">Enter unique form IDs to access exams directly</p>
            </div>
          </div>
        </div>

        {/* Login Section */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Access Portal</CardTitle>
            <CardDescription className="text-center">Choose your role to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="teacher" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teacher
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="Enter your Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleStudentLogin()}
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={handleStudentLogin} className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Continue to Form Access"}
                </Button>
              </TabsContent>

              <TabsContent value="teacher" className="space-y-4">
                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherEmail">Email</Label>
                    <Input
                      id="teacherEmail"
                      type="email"
                      placeholder="teacher@cec.edu"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherPassword">Password</Label>
                    <Input
                      id="teacherPassword"
                      type="password"
                      placeholder="Enter password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    onClick={(e) => {
                      e.preventDefault()
                      handleTeacherLogin()
                    }}
                  >
                    {isLoading ? "Authenticating..." : "Access Dashboard"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">
            <strong>Demo Credentials:</strong>
          </p>
          <p>Student ID: STU001, STU002, or STU003</p>
          <p>Teacher: teacher@cec.edu / teacher123</p>
          <p>Admin: admin@itproctool.edu / SecureAdmin2024!</p>
        </div>
      </main>

      {/* Unique Form ID Modal */}
      <Dialog open={showFormIdModal} onOpenChange={setShowFormIdModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Enter Unique Form ID</DialogTitle>
            <DialogDescription className="text-center">
              Enter the Unique Form ID provided by your teacher to access the exam
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uniqueFormId" className="text-base font-medium">
                Unique Form ID
              </Label>
              <Input
                id="uniqueFormId"
                placeholder="e.g., MATH2024001"
                value={uniqueFormId}
                onChange={(e) => setUniqueFormId(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleFormIdSubmit()}
                className="text-center text-lg"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleFormIdSubmit} className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access Exam"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowFormIdModal(false)
                setStudentId("")
                setUniqueFormId("")
              }}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
