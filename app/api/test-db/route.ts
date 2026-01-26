import { NextResponse } from "next/server"
import { executeQuery, testConnection } from "@/lib/db"

export async function GET() {
  try {
    console.log("Testing database connection...")
    console.log("Environment variables:")
    console.log("DB_HOST:", process.env.DB_HOST || "localhost")
    console.log("DB_USER:", process.env.DB_USER || "root")
    console.log("DB_NAME:", process.env.DB_NAME || "cec_exam_system")
    console.log("DB_PORT:", process.env.DB_PORT || "3306")

    // Test basic connection
    const connectionTest = await testConnection()
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: connectionTest.message,
          error: connectionTest.error,
          env: {
            host: process.env.DB_HOST || "localhost",
            user: process.env.DB_USER || "root",
            database: process.env.DB_NAME || "cec_exam_system",
            port: process.env.DB_PORT || "3306",
          },
        },
        { status: 500 },
      )
    }

    // Test tables exist
    console.log("Testing table existence...")
    const tables = await executeQuery("SHOW TABLES")
    console.log("Available tables:", tables)

    // Test sample data
    const teacherCount = await executeQuery("SELECT COUNT(*) as count FROM teachers")
    const studentCount = await executeQuery("SELECT COUNT(*) as count FROM students")

    // Test specific teacher
    const testTeacher = await executeQuery("SELECT * FROM teachers WHERE email = ?", ["teacher@cec.edu"])

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        tables: tables.length,
        tableList: tables,
        teachers: teacherCount[0]?.count || 0,
        students: studentCount[0]?.count || 0,
        testTeacher: testTeacher.length > 0 ? testTeacher[0] : "Not found",
      },
      env: {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        database: process.env.DB_NAME || "cec_exam_system",
        port: process.env.DB_PORT || "3306",
      },
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database test failed",
        error: error.message,
        stack: error.stack,
        env: {
          host: process.env.DB_HOST || "localhost",
          user: process.env.DB_USER || "root",
          database: process.env.DB_NAME || "cec_exam_system",
          port: process.env.DB_PORT || "3306",
        },
      },
      { status: 500 },
    )
  }
}
