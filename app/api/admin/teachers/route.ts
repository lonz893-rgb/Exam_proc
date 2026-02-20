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
  } catch (error: any) {
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
    // MODIFIED: We now pull 'password' instead of 'department'
    const { name, email, password, status } = await request.json()

    // MODIFIED: Check for password instead of department
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingTeacher = await executeQuery("SELECT id FROM teachers WHERE email = ?", [email]) as any[]
    if (existingTeacher && existingTeacher.length > 0) {
      return NextResponse.json({ success: false, message: "Email already exists" }, { status: 400 })
    }

    // MODIFIED: Hash the actual password provided by the Admin instead of a default one
    const hashedPassword = await bcrypt.hash(password, 10)
    const fallbackDepartment = "N/A" // Safety fallback so the database doesn't crash

    const query = `
      INSERT INTO teachers (name, email, password_hash, department, status, employee_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const employeeId = `EMP${Date.now().toString().slice(-6)}`
    
    const result = await executeQuery(query, [name, email, hashedPassword, fallbackDepartment, status || "active", employeeId]) as any

    console.log("Teacher created successfully:", result)

    return NextResponse.json({
      success: true,
      message: "Teacher created successfully",
      teacherId: result.insertId,
    })
  } catch (error: any) {
    console.error("Error creating teacher:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create teacher", error: error.message },
      { status: 500 },
    )
  }
}