import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    const query = "SELECT * FROM proctoring_settings"
    const results = (await executeQuery(query)) as any[]

    // Convert to key-value object
    const settings: any = {}
    results.forEach((setting: any) => {
      settings[setting.setting_name] = setting.setting_value
    })

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const query = `
        UPDATE proctoring_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE setting_name = ?
      `
      await executeQuery(query, [value, key])
    }

    // Log the action
    const logQuery = `
      INSERT INTO system_logs (log_type, user_type, message) 
      VALUES (?, ?, ?)
    `
    await executeQuery(logQuery, ["system", "admin", "System settings updated"])

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("Update settings error:", error)
    return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
  }
}
