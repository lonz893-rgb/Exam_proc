import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")

    if (!teacherId) {
      return NextResponse.json({ success: false, message: "Teacher ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching students for teacher:", teacherId)

    const query = `
      SELECT id, name, student_id, email, department, year_level, status, created_at, teacher_id
      FROM students
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `

    const results = (await executeQuery(query, [teacherId])) as any[]

    console.log("[v0] Found", results.length, "students for teacher", teacherId)

    return NextResponse.json({
      success: true,
      students: results || [],
      count: results.length,
    })
  } catch (error) {
    console.error("[v0] Get teacher students error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch students",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
