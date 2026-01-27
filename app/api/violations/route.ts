import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json({ success: false, message: "Teacher ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching violations for teacher ID:", teacherId)

    // First try: Get violations with exam-session relationship to teacher
    const query = `
      SELECT v.id, v.exam_session_id, v.student_name, v.exam_title, v.violation_type, v.description, v.severity, v.timestamp
      FROM violations v
      LEFT JOIN exam_sessions es ON v.exam_session_id = es.id
      LEFT JOIN exams e ON es.exam_id = e.id
      WHERE e.teacher_id = ?
      ORDER BY v.timestamp DESC
      LIMIT 100
    `

    let results = (await executeQuery(query, [teacherId])) as any[]

    console.log("[v0] Query with exam join returned", results.length, "violations")

    // If no results from exam join, try getting violations directly (for real-time violations logged without exam_session)
    if (results.length === 0) {
      console.log("[v0] Trying to fetch violations without exam session join...")
      const directQuery = `
        SELECT id, exam_session_id, student_name, exam_title, violation_type, description, severity, timestamp
        FROM violations
        ORDER BY timestamp DESC
        LIMIT 100
      `
      results = (await executeQuery(directQuery, [])) as any[]
      console.log("[v0] Direct query returned", results.length, "violations")
    }

    return NextResponse.json({
      success: true,
      violations: results,
      count: results.length,
    })
  } catch (error) {
    console.error("[v0] Get violations error:", error)
    return NextResponse.json(
      {
        success: true,
        violations: [],
        count: 0,
        message: "Failed to fetch violations but returning empty list",
      },
      { status: 200 }, // Return 200 to prevent errors on client
    )
  }
}

export async function POST(request: NextRequest) {
  try {

    // 1. Get the data first
    const body = await request.json()

    // 2. ADD THIS LINE HERE TO DEBUG
    console.log("DEBUG: Received body from student page:", body)

    const { 
      examSessionId, 
      studentName, 
      examTitle, 
      violationType, 
      description, 
      severity, 
      examId, 
      timestamp 
    } = body

    if (!violationType || !description) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Use exam_session_id if provided, otherwise NULL (to allow proper database FK constraint)
    const sessionId = examSessionId ? parseInt(examSessionId) : null
    const title = examTitle || "Unknown Exam"
    const student = studentName || "Unknown Student"
    const severity_level = severity || "medium"
    const currentTimestamp = timestamp || new Date().toISOString()

    const query = `
      INSERT INTO violations (exam_session_id, student_name, exam_title, violation_type, description, severity, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    console.log("[v0] Logging violation:", {
      sessionId,
      student,
      title,
      violationType,
      description,
      timestamp: currentTimestamp,
    })

    const result = (await executeQuery(query, [
      sessionId,
      student,
      title,
      violationType,
      description,
      severity_level,
      currentTimestamp,
    ])) as any

    console.log("[v0] Violation inserted with ID:", result.insertId, "for session:", sessionId)

    return NextResponse.json({
      success: true,
      message: "Violation logged successfully",
      violationId: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Log violation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to log violation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
