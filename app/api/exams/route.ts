import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json({ success: false, message: "Teacher ID is required" }, { status: 400 })
    }

    const query = `
      SELECT * FROM exams 
      WHERE teacher_id = ? 
      ORDER BY created_at DESC
    `

    const results = (await executeQuery(query, [teacherId])) as any[]

    return NextResponse.json({
      success: true,
      exams: results,
    })
  } catch (error: any) {
    console.error("Get exams error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch exams",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, formUrl, duration, startTime, endTime, teacherId, unique_id, uniqueId } = await request.json()

    // 1. Made validation slightly more flexible (removed formUrl check as it can default to N/A)
    if (!title || !teacherId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const finalUniqueId = unique_id || uniqueId || (title.substring(0, 4).toUpperCase() + Date.now().toString().slice(-6))

    // 2. THE FIX: Safe string manipulation instead of new Date().toISOString()
    // This stops the 8-hour timezone shift and prevents server crashes!
    const mysqlStartTime = startTime ? startTime.replace("T", " ") + (startTime.length === 16 ? ":00" : "") : null;
    const mysqlEndTime = endTime ? endTime.replace("T", " ") + (endTime.length === 16 ? ":00" : "") : null;

    const query = `
      INSERT INTO exams (title, description, form_url, duration_minutes, start_time, end_time, teacher_id, unique_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `

    const params = [
      title,
      description || null,
      formUrl || "N/A", 
      duration || 60,
      mysqlStartTime,
      mysqlEndTime,
      teacherId,
      finalUniqueId,
    ]

    console.log("Creating exam with params:", params)

    const result = (await executeQuery(query, params)) as any

    return NextResponse.json({
      success: true,
      message: "Exam created successfully",
      examId: result.insertId,
      uniqueId: finalUniqueId, 
    })
  } catch (error: any) {
    console.error("Create exam error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create exam",
        error: error.message,
      },
      { status: 500 },
    )
  }
}