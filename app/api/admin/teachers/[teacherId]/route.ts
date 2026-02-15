import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { teacherId: string } }) {
  try {
    console.log("Updating teacher:", params.teacherId)
    const { name, email, department, status } = await request.json()

    if (!name || !email || !department) {
      return NextResponse.json({ success: false, message: "Name, email, and department are required" }, { status: 400 })
    }

    const query = `
      UPDATE teachers 
      SET name = ?, email = ?, department = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    const result = await executeQuery(query, [name, email, department, status, params.teacherId])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Teacher not found" }, { status: 404 })
    }

    console.log("Teacher updated successfully")
    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
    })
  } catch (error) {
    console.error("Error updating teacher:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update teacher", error: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { teacherId: string } }) {
  try {
    console.log("Deleting teacher:", params.teacherId)

    const query = "DELETE FROM teachers WHERE id = ?"
    const result = await executeQuery(query, [params.teacherId])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Teacher not found" }, { status: 404 })
    }

    console.log("Teacher deleted successfully")
    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete teacher", error: error.message },
      { status: 500 },
    )
  }
}
