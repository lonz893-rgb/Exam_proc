import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json({ success: false, message: "Teacher ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching active exam sessions for teacher:", teacherId)

    const query = `
      SELECT 
        es.id,
        es.exam_id,
        e.title as exam_title,
        e.duration_minutes,
        s.name as student_name,
        s.student_id,
        es.start_time,
        es.status,
        es.ip_address,
        es.user_agent,
        (SELECT COUNT(*) FROM violations WHERE exam_session_id = es.id) as violation_count
      FROM exam_sessions es
      JOIN exams e ON es.exam_id = e.id
      JOIN students s ON es.student_id = s.id
      WHERE e.teacher_id = ? AND es.status = 'active'
      ORDER BY es.start_time DESC
      LIMIT 100
    `

    const results = (await executeQuery(query, [teacherId])) as any[]

    console.log("[v0] Found", results.length, "active exam sessions")

    return NextResponse.json({
      success: true,
      sessions: results,
      count: results.length,
    })
  } catch (error) {
    console.error("[v0] Get exam sessions error:", error)
    return NextResponse.json(
      {
        success: true,
        sessions: [],
        message: "No active sessions or error fetching",
      },
      { status: 200 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { examId, studentId, studentName, sessionToken } = await request.json()

    if (!examId || !studentId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: examId, studentId" },
        { status: 400 },
      )
    }

    console.log("[v0] Creating exam session:", {
      examId,
      studentId,
      studentName,
      sessionToken,
    })

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const query = `
      INSERT INTO exam_sessions (exam_id, student_id, session_token, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `

    const result = (await executeQuery(query, [examId, studentId, sessionToken, ip, userAgent])) as any

    console.log("[v0] Exam session created with ID:", result.insertId)

    return NextResponse.json({
      success: true,
      message: "Exam session created successfully",
      sessionId: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Create exam session error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create exam session",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
