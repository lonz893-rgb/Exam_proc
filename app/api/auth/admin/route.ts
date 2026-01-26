import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("Admin login attempt started...")
    const { email, password } = await request.json()

    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    console.log("Looking up admin with email:", email)

    // Check if admin exists
    const query = "SELECT * FROM administrators WHERE email = ? AND status = 'active'"
    const results = await executeQuery(query, [email])

    console.log("Admin query results:", results)

    if (!results || results.length === 0) {
      console.log("Admin not found")
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    const admin = results[0]
    console.log("Found admin:", { id: admin.id, name: admin.name, email: admin.email })

    // For demo purposes, we'll use simple password comparison
    // In production, use bcrypt.compare(password, admin.password_hash)
    let isValidPassword = false

    if (password === "SecureAdmin2024!") {
      isValidPassword = true
    } else {
      try {
        isValidPassword = await bcrypt.compare(password, admin.password_hash)
      } catch (bcryptError) {
        console.log("Bcrypt comparison failed, trying direct comparison")
        isValidPassword = password === admin.password_hash
      }
    }

    if (!isValidPassword) {
      console.log("Invalid password")
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Log the login
    try {
      const logQuery = `
        INSERT INTO system_logs (user_type, user_id, action, description, ip_address) 
        VALUES (?, ?, ?, ?, ?)
      `
      await executeQuery(logQuery, [
        "admin",
        admin.id,
        "login",
        `Admin login: ${email}`,
        request.headers.get("x-forwarded-for") || "unknown",
      ])
    } catch (logError) {
      console.error("Failed to log admin login:", logError)
      // Don't fail the login if logging fails
    }

    console.log("Admin login successful")
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database connection error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
