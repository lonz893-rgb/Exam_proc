import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uniqueId = searchParams.get("uniqueId")

    if (!uniqueId) {
      return NextResponse.json({ success: false, message: "Unique ID is required" }, { status: 400 })
    }

    const query = `
      SELECT e.*, t.name as teacher_name, t.department 
      FROM exams e 
      JOIN teachers t ON e.teacher_id = t.id 
      WHERE e.unique_id = ?
    `
    const results = (await executeQuery(query, [uniqueId])) as any[]

    if (results.length === 0) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 })
    }

    const exam = results[0]

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        formUrl: exam.form_url,
        duration: exam.duration_minutes,
        startTime: exam.start_time,
        endTime: exam.end_time,
        status: exam.status,
        uniqueId: exam.unique_id,
        teacherName: exam.teacher_name,
        department: exam.department,
      },
    })
  } catch (error) {
    console.error("Get exam by unique ID error:", error)
    return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
  }
}
