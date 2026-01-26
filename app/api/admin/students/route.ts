import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    console.log("Fetching all students...")
    const query = "SELECT * FROM students ORDER BY created_at DESC"
    const students = await executeQuery(query)

    return NextResponse.json({
      success: true,
      students: students || [],
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch students", error: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Creating new student...")
    const { name, email, studentId, status } = await request.json()

    if (!name || !email || !studentId) {
      return NextResponse.json({ success: false, message: "Name, email, and student ID are required" }, { status: 400 })
    }

    // Check if student ID already exists
    const existingStudent = await executeQuery("SELECT id FROM students WHERE student_id = ?", [studentId])
    if (existingStudent && existingStudent.length > 0) {
      return NextResponse.json({ success: false, message: "Student ID already exists" }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = await executeQuery("SELECT id FROM students WHERE email = ?", [email])
    if (existingEmail && existingEmail.length > 0) {
      return NextResponse.json({ success: false, message: "Email already exists" }, { status: 400 })
    }

    const query = `
      INSERT INTO students (name, email, student_id, status, department, year_level) 
      VALUES (?, ?, ?, ?, 'General', 1)
    `
    const result = await executeQuery(query, [name, email, studentId, status || "active"])

    console.log("Student created successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Student created successfully",
      studentId: result.insertId,
    })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create student", error: error.message },
      { status: 500 },
    )
  }
}
