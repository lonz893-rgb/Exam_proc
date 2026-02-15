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

  // PHASE 1: Verify Student ID
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
      // Sending ONLY studentId to trigger Phase 1 in the backend
      const response = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })

      const data = await response.json()

      if (data.success) {
        // Store student data and open the second verification step
        localStorage.setItem("userRole", "student")
        if (data.student) {
          localStorage.setItem("studentData", JSON.stringify(data.student))
        }
        
        setShowFormIdModal(true)
        toast({
          title: "ID Verified",
          description: data.student ? `Welcome ${data.student.name}!` : "Please enter your Exam Form ID.",
        })
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Student ID not found.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Student verification error:", error)
      toast({
        title: "Connection Error",
        description: "Could not reach the server. Please check your database settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // PHASE 2: Verify Unique Form ID
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
      // Sending BOTH IDs to trigger Phase 2 in the backend
      const response = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, uniqueFormId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Access Granted",
          description: "Form ID verified. Redirecting to exam...",
        })
        
        // Final Redirect to the proctoring interface (index.html in public folder)
        window.location.href = "/index.html" 
      } else {
        toast({
          title: "Access Denied",
          description: data.message || "Invalid Unique Form ID",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Form ID submission error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeacherLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!teacherEmail.trim() || !teacherPassword.trim()) {
      toast({ title: "Error", description: "Please enter both credentials", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword }),
      })

      const data = await response.json()
      if (data.success) {
        localStorage.setItem("userRole", "teacher")
        localStorage.setItem("teacherData", JSON.stringify(data.teacher))
        router.push("/teacher/dashboard")
      } else {
        toast({ title: "Error", description: data.message || "Invalid credentials", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection error.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to IT Proctool</h2>
          <p className="text-xl text-gray-600 mb-8">Advanced exam monitoring with real-time detection</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Eye className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Monitoring</h3>
              <p className="text-gray-600">Suspicious behavior detection</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Secure</h3>
              <p className="text-gray-600">Tab switching prevention</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Direct Access</h3>
              <p className="text-gray-600">Access via Unique Form IDs</p>
            </div>
          </div>
        </div>

        <Card className="max-w-md mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Access Portal</CardTitle>
            <CardDescription className="text-center text-lg">Choose your role</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="student" className="gap-2"><GraduationCap className="h-4 w-4" /> Student</TabsTrigger>
                <TabsTrigger value="teacher" className="gap-2"><Users className="h-4 w-4" /> Teacher</TabsTrigger>
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
                    className="h-12"
                  />
                </div>
                <Button onClick={handleStudentLogin} className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
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
                      className="h-12"
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
                      className="h-12"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
                    {isLoading ? "Authenticating..." : "Access Dashboard"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Unique Form ID Modal */}
      <Dialog open={showFormIdModal} onOpenChange={setShowFormIdModal}>
        <DialogContent className="max-w-md p-8">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Exam Verification</DialogTitle>
            <DialogDescription className="text-center text-base">
              Enter the Unique Form ID provided by your teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="uniqueFormId" className="text-lg font-medium">Unique Form ID</Label>
              <Input
                id="uniqueFormId"
                placeholder="e.g., MATH2024001"
                value={uniqueFormId}
                onChange={(e) => setUniqueFormId(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleFormIdSubmit()}
                className="text-center text-xl h-14 font-mono tracking-widest"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleFormIdSubmit} className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
                {isLoading ? "Checking ID..." : "Start Exam"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowFormIdModal(false)
                  setUniqueFormId("")
                }}
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}