import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Student login attempt started...")
    const { studentId } = await request.json()

    if (!studentId) {
      console.log("Missing student ID")
      return NextResponse.json({ success: false, message: "Student ID is required" }, { status: 400 })
    }

    console.log("Looking up student with ID:", studentId)

    // Check if student exists
    const query = "SELECT * FROM students WHERE student_id = ? AND status = 'active'"
    const results = await executeQuery(query, [studentId])

    console.log("Student query results:", results)

    if (!results || results.length === 0) {
      console.log("Student not found")
      return NextResponse.json({ success: false, message: "Invalid student ID" }, { status: 401 })
    }

    const student = results[0]
    console.log("Found student:", { id: student.id, name: student.name, student_id: student.student_id })

    // Log the login
    try {
      const logQuery = `
        INSERT INTO system_logs (user_type, user_id, action, description, ip_address) 
        VALUES (?, ?, ?, ?, ?)
      `
      await executeQuery(logQuery, [
        "student",
        student.id,
        "login",
        `Student login: ${studentId}`,
        request.headers.get("x-forwarded-for") || "unknown",
      ])
    } catch (logError) {
      console.error("Failed to log student login:", logError)
      // Don't fail the login if logging fails
    }

    console.log("Student login successful")
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        studentId: student.student_id,
        email: student.email,
        department: student.department,
        yearLevel: student.year_level,
      },
    })
  } catch (error) {
    console.error("Student login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database connection error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
