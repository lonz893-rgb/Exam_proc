"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, GraduationCap, Eye, Sun, Moon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [teacherEmail, setTeacherEmail] = useState("")
  const [teacherPassword, setTeacherPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const router = useRouter()
  const { toast } = useToast()

  // Carousel Images (Ensure these are in your /public folder)
  const backgroundImages = [
    "/photo1.jpg",
    "/photo2.jpg",
    "/photo3.jpg"
  ]

  // Auto-rotate carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundImages.length)
    }, 6000)
    
    // Cleanup interval on unmount
    return () => clearInterval(timer)
  }, [backgroundImages.length])

  // Simplified Student Login: Just redirect to the exam immediately
  const handleStudentLogin = () => {
    setIsLoading(true)
    try {
      toast({
        title: "Access Granted",
        description: "Redirecting to exam...",
      })
      // Direct redirect to the proctoring interface (index.html in public folder)
      window.location.href = "/index.html" 
    } catch (error) {
      console.error("Redirection error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Teacher Login Logic (Kept Intact)
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

  // --- THEME CLASSES ---
  const themeBg = isDarkMode ? "bg-slate-950" : "bg-slate-50"
  const overlayBg = isDarkMode ? "bg-slate-950/70" : "bg-white/70"
  const headerBg = isDarkMode ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-slate-200"
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900"
  const textSecondary = isDarkMode ? "text-gray-300" : "text-gray-700"
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500"
  const cardBg = isDarkMode ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-slate-200"
  const featureCardBg = isDarkMode ? "bg-slate-900/90 border-slate-700 hover:border-slate-500" : "bg-white/90 border-slate-200 hover:border-slate-400"
  const iconWrapperBg = isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
  const inputBg = isDarkMode ? "bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 focus:bg-slate-800" : "bg-white border-slate-300 text-slate-900 placeholder:text-gray-400 focus:bg-white"
  const tabsListBg = isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-100 border-slate-200"
  const studentBoxBg = isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200"

  return (
    <div className={`relative min-h-screen font-sans selection:bg-blue-500 selection:text-white overflow-hidden flex flex-col transition-colors duration-300 ${themeBg}`}>
      
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
              transitionDuration: "3s" // Forces a slow, smooth fade
            }}
          />
        ))}
        <div className={`absolute inset-0 backdrop-blur-[2px] transition-colors duration-300 ${overlayBg}`}></div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 flex flex-col flex-grow">
        
        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-sm transition-all duration-300 ${headerBg}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <Shield className={`h-8 w-8 drop-shadow-md group-hover:scale-105 transition-transform duration-300 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                <h1 className={`text-2xl font-extrabold tracking-tight drop-shadow-md ${textPrimary}`}>
                  PROCTOOL
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className={`hidden sm:block text-sm font-medium px-4 py-1.5 rounded-full border shadow-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300 bg-white/10 border-white/10' : 'text-slate-700 bg-slate-200/50 border-slate-300'}`}>
                  Secure Online Proctoring System
                </div>
                {/* Theme Toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={isDarkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50" : "border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* --- SPLIT SCREEN LAYOUT --- */}
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-24 pb-12 flex justify-center">
          
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-20">
            
            {/* === LEFT COLUMN: Hero Text & Stacked Features === */}
            <div className="flex-1 w-full max-w-xl text-center lg:text-left animate-in fade-in slide-in-from-bottom-4 duration-1000 -mt-4 lg:-mt-12">
              <h2 className={`text-5xl md:text-6xl font-extrabold tracking-tight mb-6 drop-shadow-lg ${textPrimary}`}>
                Welcome to <br className="hidden lg:block"/>
                <span>PROCTOOL</span>
              </h2>
              <p className={`text-xl font-medium mb-10 leading-relaxed drop-shadow-md ${textSecondary}`}>
                Advanced exam monitoring with real-time detection, ensuring academic integrity through state-of-the-art security.
              </p>

              {/* Feature Cards */}
              <div className="flex flex-col gap-5">
                
                <div className={`group backdrop-blur-sm p-5 rounded-xl shadow-xl border transition-all duration-300 hover:-translate-y-1 flex items-start sm:items-center text-left gap-5 ${featureCardBg}`}>
                  <div className={`min-w-[56px] h-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300 shadow-sm border ${iconWrapperBg} ${isDarkMode ? 'group-hover:bg-blue-900/50' : 'group-hover:bg-blue-100'}`}>
                    <Eye className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${textPrimary}`}>Live Monitoring</h3>
                    <p className={`font-medium text-sm leading-relaxed ${textMuted}`}>Intelligent tracking of suspicious behavior and focus loss during examinations.</p>
                  </div>
                </div>

                <div className={`group backdrop-blur-sm p-5 rounded-xl shadow-xl border transition-all duration-300 hover:-translate-y-1 flex items-start sm:items-center text-left gap-5 ${featureCardBg}`}>
                  <div className={`min-w-[56px] h-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300 shadow-sm border ${iconWrapperBg} ${isDarkMode ? 'group-hover:bg-indigo-900/50' : 'group-hover:bg-indigo-100'}`}>
                    <Shield className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${textPrimary}`}>Highly Secure</h3>
                    <p className={`font-medium text-sm leading-relaxed ${textMuted}`}>Strict enforcement against tab switching, copy-pasting, and external shortcuts.</p>
                  </div>
                </div>

                <div className={`group backdrop-blur-sm p-5 rounded-xl shadow-xl border transition-all duration-300 hover:-translate-y-1 flex items-start sm:items-center text-left gap-5 ${featureCardBg}`}>
                  <div className={`min-w-[56px] h-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300 shadow-sm border ${iconWrapperBg} ${isDarkMode ? 'group-hover:bg-purple-900/50' : 'group-hover:bg-purple-100'}`}>
                    <Users className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${textPrimary}`}>Direct Access</h3>
                    <p className={`font-medium text-sm leading-relaxed ${textMuted}`}>Frictionless 1-click entry for students without complicated login processes.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* === RIGHT COLUMN: Login Form Container === */}
            <div className="w-full max-w-md lg:w-[420px] xl:w-[460px] shrink-0 relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both lg:mt-2">
              
              <Card className={`relative border shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden transition-colors duration-300 ${cardBg}`}>
                <div className="h-1.5 w-full bg-blue-600"></div>
                
                <CardHeader className="pt-8 pb-6">
                  <CardTitle className={`text-center text-3xl font-extrabold ${textPrimary}`}>Access Portal</CardTitle>
                  <CardDescription className={`text-center text-base font-medium mt-2 ${textMuted}`}>
                    Select your role to continue
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <Tabs defaultValue="student" className="w-full">
                    
                    {/* MODIFIED TABS */}
                    <TabsList className={`grid w-full grid-cols-2 h-14 p-1 rounded-xl border mb-8 transition-colors duration-300 ${tabsListBg}`}>
                      <TabsTrigger 
                        value="student" 
                        className={`flex items-center justify-center gap-2 h-full rounded-lg text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                      >
                        <GraduationCap className="h-5 w-5" /> Student
                      </TabsTrigger>
                      <TabsTrigger 
                        value="teacher" 
                        className={`flex items-center justify-center gap-2 h-full rounded-lg text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                      >
                        <Users className="h-5 w-5" /> Teacher
                      </TabsTrigger>
                    </TabsList>

                    {/* Student View */}
                    <TabsContent value="student" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                      <div className={`rounded-lg p-6 text-center border mb-2 transition-colors duration-300 ${studentBoxBg}`}>
                        <GraduationCap className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <p className={`text-sm font-bold ${textPrimary}`}>Ready to take your exam?</p>
                        <p className={`text-xs font-medium mt-1 ${textMuted}`}>Make sure you are in a quiet environment.</p>
                      </div>
                      <Button 
                        onClick={handleStudentLogin} 
                        className="w-full h-14 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all duration-300" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Preparing Workspace..." : "Proceed to Exam Room"}
                      </Button>
                    </TabsContent>

                    {/* Teacher View */}
                    <TabsContent value="teacher" className="focus-visible:outline-none focus-visible:ring-0">
                      <form onSubmit={handleTeacherLogin} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="teacherEmail" className={`text-sm font-bold ml-1 ${textSecondary}`}>Email Address</Label>
                          <Input
                            id="teacherEmail"
                            type="email"
                            placeholder="teacher@cec.edu"
                            value={teacherEmail}
                            onChange={(e) => setTeacherEmail(e.target.value)}
                            disabled={isLoading}
                            className={`h-14 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all px-4 text-base font-medium ${inputBg}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacherPassword" className={`text-sm font-bold ml-1 ${textSecondary}`}>Password</Label>
                          <Input
                            id="teacherPassword"
                            type="password"
                            placeholder="Enter your password"
                            value={teacherPassword}
                            onChange={(e) => setTeacherPassword(e.target.value)}
                            disabled={isLoading}
                            className={`h-14 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all px-4 text-base font-medium ${inputBg}`}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-14 text-lg font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all duration-300 mt-2" 
                          disabled={isLoading}
                        >
                          {isLoading ? "Authenticating..." : "Access Dashboard"}
                        </Button>
                      </form>
                    </TabsContent>
                    
                  </Tabs>
                </CardContent>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}