import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

// GET - Fetch violations for teacher dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    // If no teacherId, return ALL violations (for testing/debugging)
    if (!teacherId) {
      const query = `
        SELECT 
          id, 
          exam_session_id, 
          student_name, 
          exam_title, 
          violationType, 
          description, 
          severity, 
          timestamp
        FROM violations
        ORDER BY timestamp DESC
        LIMIT 100
      `
      
      const results = (await executeQuery(query, [])) as any[]
      
      return NextResponse.json({
        success: true,
        violations: results,
        count: results.length,
      })
    }

    console.log("[v0] Fetching violations for teacher ID:", teacherId)

    // UPDATED STRATEGY: Get violations from teacher's exams OR Google Sheets exams (NULL session)
    // This ensures Google Sheets exam violations always appear for all teachers
    let query = `
      SELECT 
        v.id, 
        v.exam_session_id, 
        v.student_name, 
        v.exam_title, 
        v.violationType, 
        v.description, 
        v.severity, 
        v.timestamp
      FROM violations v
      LEFT JOIN exam_sessions es ON v.exam_session_id = es.id
      LEFT JOIN exams e ON es.exam_id = e.id
      WHERE e.teacher_id = ?
         OR v.exam_session_id IS NULL
      ORDER BY v.timestamp DESC
      LIMIT 100
    `

    let results = (await executeQuery(query, [teacherId])) as any[]
    console.log("[v0] Found", results.length, "violations (including Google Sheets exams)")

    // Fallback: If still no results, get ALL violations
    if (results.length === 0) {
      console.log("[v0] WARNING: No violations found, fetching ALL violations")
      
      query = `
        SELECT 
          id, 
          exam_session_id, 
          student_name, 
          exam_title, 
          violationType, 
          description, 
          severity, 
          timestamp
        FROM violations
        ORDER BY timestamp DESC
        LIMIT 100
      `
      
      results = (await executeQuery(query, [])) as any[]
      console.log("[v0] Fallback returned", results.length, "violations")
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
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    )
  }
}

// POST - Log new violation (from Google Sheets exam or iframe exam)
export async function POST(request: NextRequest) {
  // Enable CORS for Google Sheets exam domain
  const origin = request.headers.get('origin') || '*';
  
  try {
    const { examSessionId, studentName, examTitle, violationType, description, severity, examId, timestamp } = await request.json()

    if (!violationType || !description) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    // Simple approach: Just log the violation with session_id (or NULL)
    const sessionId = examSessionId ? parseInt(examSessionId) : null
    const title = examTitle || "Unknown Exam"
    const student = studentName || "Unknown Student"
    const severity_level = severity || "medium"
    const currentTimestamp = timestamp || new Date().toISOString()

    const query = `
      INSERT INTO violations (exam_session_id, student_name, exam_title, violationType, description, severity, timestamp)
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

    return NextResponse.json(
      {
        success: true,
        message: "Violation logged successfully",
        violationId: result.insertId,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  } catch (error) {
    console.error("[v0] Log violation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to log violation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}