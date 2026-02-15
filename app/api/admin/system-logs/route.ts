import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

// This prevents Next.js from showing old logs
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching system logs...")
    const { searchParams } = new URL(request.url)
    const limitInput = searchParams.get("limit") || "50";
    const limit = Math.min(Math.max(parseInt(limitInput, 10) || 50, 1), 500);

    // We use a template literal for LIMIT here to avoid the 
    // "Incorrect arguments to mysqld_stmt_execute" error.
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
      LIMIT ${limit}
    `;
    
    // Passing the limit as a number parameter
    const logs = await executeQuery(query, []);

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (error: any) {
    console.error("Error fetching system logs:", error)
    return NextResponse.json(
      { success: false, 
        message: "Failed to fetch system logs", 
        error: error.message 
      },
      { status: 500 },
    )
  }
}
