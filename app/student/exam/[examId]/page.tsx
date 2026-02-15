"use client"

import { useRef, useState, useEffect, useCallback } from "react"
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
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")

  const router = useRouter()
  const { toast } = useToast()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [examData, setExamData] = useState<any>(null)

  useEffect(() => {
    const currentExam = localStorage.getItem("currentExam")
    if (currentExam) {
      const exam = JSON.parse(currentExam)
      setExamData({
        title: exam.title,
        formUrl: exam.formUrl,
        duration: exam.duration,
        uniqueId: exam.uniqueId,
      })
    } else {
      setExamData({
        title: "Mathematics Final Exam",
        formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf_example/viewform",
        duration: 120,
        uniqueId: "MATH2024001",
      })
    }
  }, [])

  // Detect if violations array has been tampered with
  const detectViolationTampering = useCallback(
    (previousCount: number, currentCount: number) => {
      // If violations were deleted, that's tampering
      if (currentCount < previousCount) {
        return true
      }
      return false
    },
    []
  )

  // Verify violation integrity
  const verifyViolationIntegrity = useCallback(() => {
    try {
      const stored = localStorage.getItem("examViolationsChecksum")
      const currentChecksum = violations.length.toString()
      
      if (stored && stored !== currentChecksum) {
        console.warn("[v0] Violation tampering detected!")
        return {
          tampered: true,
          storedChecksum: stored,
          currentChecksum: currentChecksum,
        }
      }
      return { tampered: false }
    } catch (error) {
      console.error("[v0] Error verifying violation integrity:", error)
      return { tampered: false }
    }
  }, [violations.length])

  const logViolation = useCallback(
    (type: string, description: string) => {
      const violation: Violation = {
        type,
        timestamp: new Date().toISOString(),
        description,
      }

      // Check for tampering before logging
      const integrity = verifyViolationIntegrity()
      if (integrity.tampered) {
        console.error("[v0] Violation log tampering detected before new violation!")
        // Log the tampering itself as a violation
        const tamperingViolation: Violation = {
          type: "VIOLATION_TAMPERING",
          timestamp: new Date().toISOString(),
          description: `Violation log tampering detected. Expected ${integrity.storedChecksum} violations but found ${integrity.currentChecksum}`,
        }
        setViolations((prev) => [...prev, tamperingViolation])
      }

      setViolations((prev) => [...prev, violation])

      // Store checksum for next verification
      localStorage.setItem("examViolationsChecksum", violations.length.toString())

      const studentData = localStorage.getItem("studentData")
      const student = studentData ? JSON.parse(studentData) : null
      const sessionId = localStorage.getItem("examSessionId")

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

      setWarningMessage(description)
      setShowWarning(true)
      setIsBlocked(true)

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
    [toast, params.examId, examData],
  )

  // Detect external scripts from public/scripts directory
  const detectExternalScripts = useCallback(() => {
    try {
      const scripts = document.querySelectorAll('script[src]')
      const publicScriptPattern = /public\/scripts\//i
      const detectedScripts: string[] = []
      
      scripts.forEach((script) => {
        const src = script.getAttribute('src') || ''
        if (publicScriptPattern.test(src)) {
          detectedScripts.push(src)
        }
      })
      
      return detectedScripts
    } catch (error) {
      console.error('[v0] Error detecting external scripts:', error)
      return []
    }
  }, [])

  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed:", err)
        // If fullscreen fails, log but don't block the exam
      })
    }
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen failed:", err)
      })
    }
  }, [])

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  useEffect(() => {
    if (!examStarted) return

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)

      if (!isCurrentlyFullscreen && examStarted) {
        logViolation("FULLSCREEN_EXIT", "Student exited fullscreen mode during exam")
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Force fullscreen re-entry after a short delay
        setTimeout(() => {
          enterFullscreen()
        }, 500)
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
=======
        // Immediately try to re-enter fullscreen
        enterFullscreen()
>>>>>>> Stashed changes
      }
    }

    const handleVisibilityChange = () => {
      // document.hidden is ONLY true when actually switching tabs or minimizing
      // It stays false when clicking iframes
      if (document.hidden && examStarted && !isBlocked) {
        logViolation("TAB_SWITCH", "Student switched tabs, minimized window, or switched applications")
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      updateActivity()

      if (examStarted) {
        if (e.altKey && e.key === "Tab") {
          e.preventDefault()
          logViolation("ALT_TAB", "Student attempted to use Alt+Tab to switch applications")
          return false
        }

        if (e.ctrlKey && e.altKey && e.key === "Tab") {
          e.preventDefault()
          logViolation("ALT_TAB", "Student attempted to use Alt+Tab to switch applications")
          return false
        }

        if (e.ctrlKey && (e.key === "t" || e.key === "n" || e.key === "w")) {
          e.preventDefault()
          logViolation("KEYBOARD_SHORTCUT", `Student attempted to use Ctrl+${e.key.toUpperCase()}`)
          return false
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
          e.preventDefault()
          logViolation("PASTE_ATTEMPT", "Student attempted to paste content")
          return false
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "c") {
          e.preventDefault()
          logViolation("COPY_ATTEMPT", "Student attempted to copy content")
          return false
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "x") {
          e.preventDefault()
          logViolation("CUT_ATTEMPT", "Student attempted to cut content")
          return false
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "a") {
          e.preventDefault()
          logViolation("SELECT_ALL", "Student attempted to select all content")
          return false
        }

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

    const handleClick = () => {
      updateActivity()
    }

    const handleScroll = () => {
      updateActivity()
    }

    const handleContextMenu = (e: MouseEvent) => {
      if (examStarted) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        logViolation("RIGHT_CLICK", "Student attempted to right-click")
        return false
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (examStarted && e.button === 2) {
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

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("click", handleClick)
    document.addEventListener("scroll", handleScroll, true)
    document.addEventListener("mousedown", handleMouseDown, true)
    document.addEventListener("contextmenu", handleContextMenu, true)
    document.addEventListener("selectstart", handleSelectStart)
    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("copy", handleCopy, true)
    document.addEventListener("cut", handleCut, true)
    window.addEventListener("contextmenu", handleContextMenu, true)

    // Periodic external script detection
    const scriptMonitorInterval = setInterval(() => {
      const externalScripts = detectExternalScripts()
      if (externalScripts.length > 0) {
        console.log("[v0] External scripts detected during exam:", externalScripts)
        logViolation("EXTERNAL_SCRIPT", `External script loaded during exam: ${externalScripts.join(', ')}`)
      }
    }, 15000) // Check every 15 seconds

    // Periodic violation integrity check
    const integrityCheckInterval = setInterval(() => {
      const integrity = verifyViolationIntegrity()
      if (integrity.tampered) {
        console.error("[v0] Violation tampering detected during periodic check!")
        // Directly create and send a tampering violation
        const studentData = localStorage.getItem("studentData")
        const student = studentData ? JSON.parse(studentData) : null
        const sessionId = localStorage.getItem("examSessionId")
        
        fetch("/api/violations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            violationType: "VIOLATION_TAMPERING",
            description: `Violation log tampering detected. Expected ${integrity.storedChecksum} violations but found ${integrity.currentChecksum}`,
            examId: params.examId,
            examSessionId: sessionId ? parseInt(sessionId) : null,
            timestamp: new Date().toISOString(),
            studentName: student?.name || "Unknown Student",
            examTitle: examData?.title || "Unknown Exam",
          }),
        }).catch((error) => console.log("[v0] Failed to log tampering violation:", error))
      }
    }, 20000) // Check every 20 seconds

    return () => {
      clearInterval(scriptMonitorInterval)
      clearInterval(integrityCheckInterval)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("click", handleClick)
      document.removeEventListener("scroll", handleScroll, true)
      document.removeEventListener("mousedown", handleMouseDown, true)
      document.removeEventListener("contextmenu", handleContextMenu, true)
      document.removeEventListener("selectstart", handleSelectStart)
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("copy", handleCopy, true)
      document.removeEventListener("cut", handleCut, true)
      window.removeEventListener("contextmenu", handleContextMenu, true)
    }
  }, [examStarted, logViolation, updateActivity, isBlocked, enterFullscreen, verifyViolationIntegrity])

  // Continuous fullscreen enforcement
=======
  // Continuous fullscreen enforcement - check every 500ms for faster response
>>>>>>> Stashed changes
  useEffect(() => {
    if (!examStarted) return

    const enforceFullscreen = setInterval(() => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
<<<<<<< Updated upstream
      if (!isCurrentlyFullscreen) {
        console.log("[v0] Fullscreen lost, forcing re-entry...")
        enterFullscreen()
      }
    }, 1000) // Check every second

    return () => clearInterval(enforceFullscreen)
  }, [examStarted, enterFullscreen])

  // Inactivity monitoring
=======
=======

=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
  // Continuous fullscreen enforcement - check every 500ms for faster response
  useEffect(() => {
    if (!examStarted) return

    const enforceFullscreen = setInterval(() => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      if (!isCurrentlyFullscreen && !isBlocked) {
        // Only try to re-enter if not currently showing a violation warning
        console.log("[v0] Fullscreen lost, attempting re-entry...")
        enterFullscreen()
      }
    }, 500) // Check twice per second for faster re-entry

    return () => clearInterval(enforceFullscreen)
  }, [examStarted, enterFullscreen, isBlocked])

  // Prevent page refresh/close during exam
  useEffect(() => {
    if (!examStarted) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // Required for Chrome
      return '' // Required for some browsers
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [examStarted])

  // Inactivity monitoring (keep this)
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  useEffect(() => {
    if (!examStarted) return

    const checkInactivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity
      if (timeSinceLastActivity > 300000) {
        logViolation("INACTIVITY", "Student inactive for more than 5 minutes")
      }
    }, 60000)

    return () => clearInterval(checkInactivity)
  }, [examStarted, lastActivity, logViolation])

  const handleStartExam = async () => {
    // Check for external scripts at exam start
    const externalScripts = detectExternalScripts()
    if (externalScripts.length > 0) {
      logViolation("EXTERNAL_SCRIPT", `External script detected at exam start: ${externalScripts.join(', ')}`)
    }

    enterFullscreen()
    setExamStarted(true)
    updateActivity()

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
          localStorage.setItem("examSessionId", data.sessionId.toString())
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

    setTimeout(() => {
      router.push("/")
    }, 2000)
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
      <style jsx>{`
        body {
          -webkit-app-region: no-drag;
          overflow-x: hidden;
        }
        
        input, textarea, select, button, label, a {
          -webkit-user-select: auto;
          -moz-user-select: auto;
          user-select: auto;
          cursor: pointer;
        }
      `}</style>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      {/* Proctoring Header - Minimal */}
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 flex items-center justify-between z-40 h-14">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">EXAM IN PROGRESS - MONITORED</span>
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      {/* Exam Content - Full Screen */}
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      <div className="fixed inset-0 top-14 bg-white overflow-hidden">
        {isBlocked ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-600 mb-2">Exam Temporarily Blocked</h2>
              <p className="text-gray-600">Please wait while the violation is being processed...</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={examData.formUrl}
            className="w-full h-full border-none"
            title="Exam Form"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  )
}
