"use client"

import { useEffect, useCallback, useState } from "react"

interface ProctoringMonitorProps {
  onViolation: (type: string, description: string) => void
  isActive: boolean
}

export function ProctoringMonitor({ onViolation, isActive }: ProctoringMonitorProps) {
  const [lastActivity, setLastActivity] = useState(Date.now())

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  const logViolation = useCallback(
    (type: string, description: string) => {
      console.log("[v0] Violation detected:", { type, description, timestamp: new Date().toISOString() })
      onViolation(type, description)
    },
    [onViolation],
  )

  const handleWindowBlur = useCallback(() => {
    if (isActive) {
      logViolation("WINDOW_SWITCH", "Student switched to another application or window")
    }
  }, [isActive, logViolation])

  useEffect(() => {
    if (!isActive) return

    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        logViolation("TAB_SWITCH", "Student switched tabs or minimized window")
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        logViolation("FULLSCREEN_EXIT", "Student exited fullscreen mode")
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      updateActivity()

      if (isActive) {
        // Block Alt+Tab and Ctrl+Alt+Tab
        if ((e.altKey && e.key === "Tab") || (e.ctrlKey && e.altKey && e.key === "Tab")) {
          e.preventDefault()
          logViolation("ALT_TAB", "Student attempted to use Alt+Tab to switch applications")
          return false
        }

        // Block new tab/window/close shortcuts
        if (e.ctrlKey && (e.key === "t" || e.key === "n" || e.key === "w")) {
          e.preventDefault()
          logViolation("KEYBOARD_SHORTCUT", `Student attempted to use Ctrl+${e.key.toUpperCase()}`)
          return false
        }

        // Block paste
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
          e.preventDefault()
          logViolation("PASTE_ATTEMPT", "Student attempted to paste content")
          return false
        }

        // Block copy
        if ((e.ctrlKey || e.metaKey) && e.key === "c") {
          e.preventDefault()
          logViolation("COPY_ATTEMPT", "Student attempted to copy content")
          return false
        }

        // Block cut
        if ((e.ctrlKey || e.metaKey) && e.key === "x") {
          e.preventDefault()
          logViolation("CUT_ATTEMPT", "Student attempted to cut content")
          return false
        }

        // Block select all
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

    const handleContextMenu = (e: MouseEvent) => {
      if (isActive) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        logViolation("RIGHT_CLICK", "Student attempted to right-click")
        return false
      }
    }

    const handlePaste = (e: ClipboardEvent) => {
      if (isActive) {
        e.preventDefault()
        logViolation("PASTE_ATTEMPT", "Student attempted to paste content")
        return false
      }
    }

    const handleCopy = (e: ClipboardEvent) => {
      if (isActive) {
        e.preventDefault()
        logViolation("COPY_ATTEMPT", "Student attempted to copy content")
        return false
      }
    }

    const handleCut = (e: ClipboardEvent) => {
      if (isActive) {
        e.preventDefault()
        logViolation("CUT_ATTEMPT", "Student attempted to cut content")
        return false
      }
    }

    const handleMouseMove = () => {
      updateActivity()
    }

    // Add all event listeners with capture phase for better interception
    document.addEventListener("visibilitychange", handleVisibilityChange, true)
    document.addEventListener("fullscreenchange", handleFullscreenChange, true)
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("contextmenu", handleContextMenu, true)
    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("copy", handleCopy, true)
    document.addEventListener("cut", handleCut, true)
    document.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("blur", handleWindowBlur, true)
    window.addEventListener("contextmenu", handleContextMenu, true)

    // Inactivity monitoring
    const inactivityCheck = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity
      if (timeSinceLastActivity > 300000) {
        // 5 minutes
        logViolation("INACTIVITY", "Student inactive for more than 5 minutes")
      }
    }, 60000) // Check every minute

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange, true)
      document.removeEventListener("fullscreenchange", handleFullscreenChange, true)
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("contextmenu", handleContextMenu, true)
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("copy", handleCopy, true)
      document.removeEventListener("cut", handleCut, true)
      document.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("blur", handleWindowBlur, true)
      window.removeEventListener("contextmenu", handleContextMenu, true)
      clearInterval(inactivityCheck)
    }
  }, [isActive, lastActivity, logViolation, updateActivity, handleWindowBlur])

  return null // This component doesn't render anything
}
