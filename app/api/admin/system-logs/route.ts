import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching system logs...")
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "50"

    const query = `
      SELECT 
        id,
        user_type,
        user_id,
        action as log_type,
        description as message,
        timestamp,
        'medium' as severity
      FROM system_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `
    const logs = await executeQuery(query, [Number.parseInt(limit)])

    return NextResponse.json({
      success: true,
      logs: logs || [],
    })
  } catch (error) {
    console.error("Error fetching system logs:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch system logs", error: error.message },
      { status: 500 },
    )
  }
}
