import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    console.log("[v0] Dashboard requested violations. Bypassing teacher filter for debugging.");

    // This query pulls EVERYTHING. It ignores whether teacher_id is NULL or matches.
    const query = `
      SELECT 
        v.id, 
        v.exam_session_id, 
        v.student_name, 
        v.exam_title, 
        v.violation_type, 
        v.description, 
        v.severity, 
        v.timestamp
      FROM violations v
      LEFT JOIN exam_sessions es ON v.exam_session_id = es.id
      LEFT JOIN exams e ON es.exam_id = e.id
      ORDER BY v.timestamp DESC
      LIMIT 100
    `

    // Notice we pass an empty array [] because we removed the "?" from the query
    const results = (await executeQuery(query, [])) as any[]

    console.log(`[v0] Found ${results.length} total violations in database.`);

    return NextResponse.json({
      success: true,
      violations: results,
      count: results.length,
    })
  } catch (error) {
    console.error("[v0] GET violations error:", error)
    return NextResponse.json(
      {
        success: true,
        violations: [],
        count: 0,
        message: "Error fetching data",
      },
      { status: 200 }
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
    const rawTimestamp = timestamp || new Date().toISOString();
    // Convert '2026-01-27T14:29:10.414Z' to '2026-01-27 14:29:10'
    const currentTimestamp = rawTimestamp.replace('T', ' ').split('.')[0];

    const query = `
  INSERT INTO violations (
    exam_session_id, student_name, exam_title, 
    violation_type, description, severity, timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

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