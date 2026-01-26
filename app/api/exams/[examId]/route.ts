import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const { status } = await request.json()
    const { examId } = params

    if (!status || !examId) {
      return NextResponse.json({ success: false, message: "Status and exam ID are required" }, { status: 400 })
    }

    const validStatuses = ["draft", "active", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
    }

    const query = `UPDATE exams SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

    await executeQuery(query, [status, examId])

    const statusMessages = {
      active: "Exam activated successfully",
      draft: "Exam deactivated successfully",
      completed: "Exam marked as completed",
      cancelled: "Exam cancelled successfully",
    }

    return NextResponse.json({
      success: true,
      message: statusMessages[status] || "Exam status updated successfully",
    })
  } catch (error) {
    console.error("Update exam status error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update exam status",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const { examId } = params

    if (!examId) {
      return NextResponse.json({ success: false, message: "Exam ID is required" }, { status: 400 })
    }

    const query = `DELETE FROM exams WHERE id = ?`

    await executeQuery(query, [examId])

    return NextResponse.json({
      success: true,
      message: "Exam deleted successfully",
    })
  } catch (error) {
    console.error("Delete exam error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete exam",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
