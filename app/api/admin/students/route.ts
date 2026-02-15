import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching students...")
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacherId")
    const onlyTeacherStudents = searchParams.get("teacherOnly") === "true"

    // If teacherId is provided, filter by that teacher (for admin view or teacher self-serve)
    // If onlyTeacherStudents is true, enforce teacher filtering (for teacher dashboard)
    let query = "SELECT s.*, t.name as teacher_name FROM students s LEFT JOIN teachers t ON s.teacher_id = t.id"
    let params: any[] = []

    if (teacherId) {
      query += " WHERE s.teacher_id = ?"
      params = [teacherId]
    }

    query += " ORDER BY s.created_at DESC"

    const students = await executeQuery(query, params)

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

    // Get the first teacher as default assignment
    const firstTeacher = await executeQuery("SELECT id FROM teachers WHERE status = 'active' LIMIT 1")
    const defaultTeacherId = firstTeacher && firstTeacher.length > 0 ? firstTeacher[0].id : 1

    const query = `
      INSERT INTO students (name, email, student_id, status, department, year_level, teacher_id) 
      VALUES (?, ?, ?, ?, 'General', 1, ?)
    `
    const result = await executeQuery(query, [name, email, studentId, status || "active", defaultTeacherId])

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
