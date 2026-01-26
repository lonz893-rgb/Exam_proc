import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("Fetching all teachers...")
    const query = "SELECT * FROM teachers ORDER BY created_at DESC"
    const teachers = await executeQuery(query)

    return NextResponse.json({
      success: true,
      teachers: teachers || [],
    })
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch teachers", error: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Creating new teacher...")
    const { name, email, department, status } = await request.json()

    if (!name || !email || !department) {
      return NextResponse.json({ success: false, message: "Name, email, and department are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingTeacher = await executeQuery("SELECT id FROM teachers WHERE email = ?", [email])
    if (existingTeacher && existingTeacher.length > 0) {
      return NextResponse.json({ success: false, message: "Email already exists" }, { status: 400 })
    }

    // Generate default password and hash it
    const defaultPassword = "password123"
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    const query = `
      INSERT INTO teachers (name, email, password_hash, department, status, employee_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const employeeId = `EMP${Date.now().toString().slice(-6)}`
    const result = await executeQuery(query, [name, email, hashedPassword, department, status || "active", employeeId])

    console.log("Teacher created successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Teacher created successfully",
      teacherId: result.insertId,
      defaultPassword: defaultPassword,
    })
  } catch (error) {
    console.error("Error creating teacher:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create teacher", error: error.message },
      { status: 500 },
    )
  }
}
