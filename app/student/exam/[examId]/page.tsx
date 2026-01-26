"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Shield, Clock, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Violation {
  type: string
  timestamp: string
  description: string
}

export default function ExamPage({ params }: { params: { examId: string } }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [examStarted, setExamStarted] = useState(false)
  const [violations, setViolations] = useState<Violation[]>([])
  const [isBlocked, setIsBlocked] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0) // Initialize with 0
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  // Get exam data from localStorage
  const [examData, setExamData] = useState<any>(null)

  useEffect(() => {
    // Load exam data from localStorage
    const currentExam = localStorage.getItem("currentExam")
    if (currentExam) {
      const exam = JSON.parse(currentExam)
      setExamData({
        title: exam.title,
        formUrl: exam.formUrl,
        duration: exam.duration,
        uniqueId: exam.uniqueId,
      })
      setTimeRemaining(exam.duration * 60) // Convert minutes to seconds
    } else {
      // Fallback to mock data if no current exam
      setExamData({
        title: "Mathematics Final Exam",
        formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf_example/viewform",
        duration: 120,
        uniqueId: "MATH2024001",
      })
      setTimeRemaining(120 * 60) // Convert minutes to seconds
    }
  }, [])

  const logViolation = useCallback(
    (type: string, description: string) => {
      const violation: Violation = {
        type,
        timestamp: new Date().toISOString(),
        description,
      }

      setViolations((prev) => [...prev, violation])

      // Get student data from localStorage
      const studentData = localStorage.getItem("studentData")
      const student = studentData ? JSON.parse(studentData) : null
      const sessionId = localStorage.getItem("examSessionId")

      // Send to server
      fetch("/api/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          violationType: type,
          description: description,
          examId: params.examId,
          examSessionId: sessionId ? parseInt(sessionId) : null,
          timestamp: new Date().toISOString(),
          studentName: student?.name || "Unknown Student",
          examTitle: examData?.title || "Unknown Exam",
        }),
      }).catch((error) => console.log("[v0] Failed to log violation:", error))

      console.log("[v0] Violation logged:", violation)

      // Show warning
      setWarningMessage(description)
      setShowWarning(true)
      setIsBlocked(true)

      // Auto-unblock after 10 seconds
      setTimeout(() => {
        setShowWarning(false)
        setIsBlocked(false)
      }, 10000)

      toast({
        title: "Violation Detected",
        description: description,
        variant: "destructive",
      })
    },
    [toast, params.examId],
  )

  // Fullscreen management
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }, [])

  // Activity monitoring
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  // Handle window blur detection (Alt+Tab, App switching)
  // This detects when the browser window loses focus completely


  // Track if focus was lost to detect real tab switches vs iframe interactions
  let hadFocusLoss = false
  let blurTime = 0

  // Event listeners
  useEffect(() => {
    if (!examStarted) return

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)

      if (!isCurrentlyFullscreen && examStarted) {
        logViolation("FULLSCREEN_EXIT", "Student exited fullscreen mode during exam")
      }
    }

    const handleVisibilityChange = () => {
      // document.hidden is ONLY true when actually switching tabs or minimizing
      // It stays false when clicking iframes
      if (document.hidden && examStarted && !isBlocked) {
        logViolation("TAB_SWITCH", "Student switched tabs, minimized window, or switched applications")
      }
    }

    const handleFocus = () => {
      hadFocusLoss = false
      blurTime = 0
    }

    const handleBlurEvent = () => {
      hadFocusLoss = true
      blurTime = Date.now()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      updateActivity()

      if (examStarted) {
        // Block Alt+Tab
        if (e.altKey && e.key === "Tab") {
          e.preventDefault()
          logViolation("ALT_TAB", "Student attempted to use Alt+Tab to switch applications")
          return false
        }

        // Block Ctrl+Alt+Tab
        if (e.ctrlKey && e.altKey && e.key === "Tab") {
          e.preventDefault()
          logViolation("ALT_TAB", "Student attempted to use Alt+Tab to switch applications")
          return false
        }

        // Block new tab/window/close tab shortcuts
        if (e.ctrlKey && (e.key === "t" || e.key === "n" || e.key === "w")) {
          e.preventDefault()
          logViolation("KEYBOARD_SHORTCUT", `Student attempted to use Ctrl+${e.key.toUpperCase()}`)
          return false
        }

        // Block paste (Ctrl+V and Cmd+V for Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
          e.preventDefault()
          logViolation("PASTE_ATTEMPT", "Student attempted to paste content")
          return false
        }

        // Block copy (Ctrl+C and Cmd+C for Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === "c") {
          e.preventDefault()
          logViolation("COPY_ATTEMPT", "Student attempted to copy content")
          return false
        }

        // Block cut (Ctrl+X and Cmd+X for Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === "x") {
          e.preventDefault()
          logViolation("CUT_ATTEMPT", "Student attempted to cut content")
          return false
        }

        // Block select all (Ctrl+A and Cmd+A for Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === "a") {
          e.preventDefault()
          logViolation("SELECT_ALL", "Student attempted to select all content")
          return false
        }

        // Block developer tools
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I") || (e.ctrlKey && e.shiftKey && e.key === "K")) {
          e.preventDefault()
          logViolation("DEV_TOOLS", "Student attempted to open developer tools")
          return false
        }
      }
    }

    const handleMouseMove = () => {
      updateActivity()
    }

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (examStarted) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        logViolation("RIGHT_CLICK", "Student attempted to right-click")
        return false
      }
    }

    // Also handle mousedown for right-click
    const handleMouseDown = (e: MouseEvent) => {
      if (examStarted && e.button === 2) {
        // button 2 is right-click
        e.preventDefault()
        e.stopPropagation()
        logViolation("RIGHT_CLICK", "Student attempted to right-click")
        return false
      }
    }

    const handlePaste = (e: ClipboardEvent) => {
      if (examStarted) {
        e.preventDefault()
        logViolation("PASTE_ATTEMPT", "Student attempted to paste content")
        return false
      }
    }

    const handleCopy = (e: ClipboardEvent) => {
      if (examStarted) {
        e.preventDefault()
        logViolation("COPY_ATTEMPT", "Student attempted to copy content")
        return false
      }
    }

    const handleCut = (e: ClipboardEvent) => {
      if (examStarted) {
        e.preventDefault()
        logViolation("CUT_ATTEMPT", "Student attempted to cut content")
        return false
      }
    }

    const handleSelectStart = (e: Event) => {
      if (examStarted) {
        e.preventDefault()
        return false
      }
    }

    const handleDragStart = (e: DragEvent) => {
      if (examStarted) {
        e.preventDefault()
        return false
      }
    }

    // Add all event listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mousedown", handleMouseDown, true)
    document.addEventListener("contextmenu", handleContextMenu, true)
    document.addEventListener("selectstart", handleSelectStart)
    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("copy", handleCopy, true)
    document.addEventListener("cut", handleCut, true)
    
    // Window focus/blur for detecting real tab switches vs iframe interactions
    window.addEventListener("blur", handleBlurEvent)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("contextmenu", handleContextMenu, true)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mousedown", handleMouseDown, true)
      document.removeEventListener("contextmenu", handleContextMenu, true)
      document.removeEventListener("selectstart", handleSelectStart)
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("copy", handleCopy, true)
      document.removeEventListener("cut", handleCut, true)
      window.removeEventListener("blur", handleBlurEvent)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("contextmenu", handleContextMenu, true)
    }
  }, [examStarted, logViolation, updateActivity])

  // Inactivity monitoring
  useEffect(() => {
    if (!examStarted) return

    const checkInactivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity
      if (timeSinceLastActivity > 300000) {
        // 5 minutes
        logViolation("INACTIVITY", "Student inactive for more than 5 minutes")
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkInactivity)
  }, [examStarted, lastActivity, logViolation])

  // Timer
  useEffect(() => {
    if (!examStarted) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleEndExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [examStarted])

  const handleStartExam = async () => {
    enterFullscreen()
    setExamStarted(true)
    updateActivity()

    // Create exam session in database
    const studentData = localStorage.getItem("studentData")
    const student = studentData ? JSON.parse(studentData) : null

    if (student) {
      try {
        const response = await fetch("/api/exam-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId: params.examId,
            studentId: student.id,
            studentName: student.name,
            sessionToken: `${params.examId}-${student.id}-${Date.now()}`,
          }),
        })

        const data = await response.json()
        console.log("[v0] Exam session created:", data)

        if (data.sessionId) {
          // Store session ID for use in violation logging
          localStorage.setItem("examSessionId", data.sessionId)
        }
      } catch (error) {
        console.error("[v0] Failed to create exam session:", error)
      }
    }

    toast({
      title: "Exam Started",
      description: "You are now being monitored. Good luck!",
    })
  }

  const handleEndExam = () => {
    setExamStarted(false)
    exitFullscreen()

    toast({
      title: "Exam Ended",
      description: "Your responses have been recorded.",
    })

    // Redirect back to dashboard
    setTimeout(() => {
      router.push("/")
    }, 2000)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (showWarning) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-red-600">Violation Detected</h2>
              <p className="text-gray-700">{warningMessage}</p>
              <p className="text-sm text-gray-600">
                Your teacher has been notified. The exam will resume in a few seconds.
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-2xl mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <Shield className="h-16 w-16 text-blue-600 mx-auto" />
              <h1 className="text-3xl font-bold text-gray-900">{examData.title}</h1>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">Proctoring Rules</h3>
                <ul className="text-sm text-amber-700 space-y-1 text-left">
                  <li>• You must remain in fullscreen mode throughout the exam</li>
                  <li>• Tab switching or window minimizing is not allowed</li>
                  <li>• Right-clicking is disabled</li>
                  <li>• Copy and paste (Ctrl+C/V) operations are blocked</li>
                  <li>• Using Alt+Tab to switch applications is monitored</li>
                  <li>• Extended inactivity will be flagged</li>
                  <li>• All violations are logged and reported to your teacher</li>
                </ul>
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span>Duration: {examData.duration} minutes</span>
              </div>

              <Button onClick={handleStartExam} size="lg" className="px-8">
                Start Proctored Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* CSS for interaction protection */}
      <style jsx>{`
        body {
          -webkit-app-region: no-drag;
          overflow-x: hidden;
        }
        
        /* Allow normal interaction with form elements */
        input, textarea, select, button, label, a {
          -webkit-user-select: auto;
          -moz-user-select: auto;
          user-select: auto;
          cursor: pointer;
        }
      `}</style>

      {/* Proctoring Header */}
      <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">EXAM IN PROGRESS - MONITORED</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(timeRemaining)}</span>
          </div>
          <Button
            onClick={handleEndExam}
            variant="outline"
            size="sm"
            className="bg-white text-red-600 hover:bg-gray-100"
          >
            End Exam
          </Button>
        </div>
      </div>

      {/* Exam Content */}
      <div className="p-4">
        {isBlocked ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-600 mb-2">Exam Temporarily Blocked</h2>
              <p className="text-gray-600">Please wait while the violation is being processed...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <iframe
              src={examData.formUrl}
              className="w-full h-screen border-0"
              title="Exam Form"
              sandbox="allow-forms allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  )
}
