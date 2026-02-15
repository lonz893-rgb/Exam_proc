import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    console.log("Updating student:", params.studentId)
    const { name, email, student_id, status } = await request.json()

    if (!name || !email || !student_id) {
      return NextResponse.json({ success: false, message: "Name, email, and student ID are required" }, { status: 400 })
    }

    const query = `
      UPDATE students 
      SET name = ?, email = ?, student_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    const result = await executeQuery(query, [name, email, student_id, status, params.studentId])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 })
    }

    console.log("Student updated successfully")
    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
    })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update student", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    console.log("Deleting student:", params.studentId)

    const query = "DELETE FROM students WHERE id = ?"
    const result = await executeQuery(query, [params.studentId])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 })
    }

    console.log("Student deleted successfully")
    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete student", error: error.message },
      { status: 500 },
    )
  }
}
