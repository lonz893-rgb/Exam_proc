import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import bcrypt from "bcryptjs" // ADDED: Need this to hash the new password

export async function PUT(request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const { teacherId } = await params;
    console.log("Updating teacher:", teacherId)
    const body = await request.json();
    
    // MODIFIED: Pull password instead of department
    const { name, email, password, status } = body;
    

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required" }, { status: 400 })
    }

    let query = "";
    let queryParams: any[] = [];
    const fallbackDepartment = "N/A"; // Safety fallback

    // MODIFIED: Check if the admin provided a new password to update
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE teachers 
        SET name = ?, email = ?, password_hash = ?, department = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      queryParams = [name, email, hashedPassword, fallbackDepartment, status, teacherId];
    } else {
      // If password is blank, update everything EXCEPT the password
      query = `
        UPDATE teachers 
        SET name = ?, email = ?, department = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      queryParams = [name, email, fallbackDepartment, status, teacherId];
    }
    
    const result = await executeQuery(query, queryParams) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Teacher not found" }, { status: 404 })
    }

    console.log("Teacher updated successfully")
    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating teacher:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update teacher", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  try {
    const { teacherId } = await params;
    console.log("Deleting teacher:", teacherId)

    const query = "DELETE FROM teachers WHERE id = ?"
    const result = await executeQuery(query, [teacherId]) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Teacher not found" }, { status: 404 })
    }

    console.log("Teacher deleted successfully")
    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting teacher:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete teacher", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}