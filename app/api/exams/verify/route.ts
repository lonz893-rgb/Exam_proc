import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    // 1. Ensure the student actually provided a code
    if (!code) {
      return NextResponse.json({ success: false, message: "Exam code is required." }, { status: 400 })
    }

    // 2. Look up the exam in the database using the unique Test Code
    const query = `
      SELECT id, title, status 
      FROM exams 
      WHERE unique_id = ?
    `
    const results = (await executeQuery(query, [code])) as any[]

    // 3. If no exam matches that code, tell the frontend it's invalid
    if (results.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid test code. Please check and try again." 
      }, { status: 404 })
    }

    const exam = results[0]

    // 4. Return the exact status ('draft', 'active', or 'completed') so login.js can decide what to do
    return NextResponse.json({
      success: true,
      status: exam.status, 
      examId: exam.id,
      title: exam.title
    })

  } catch (error: any) {
    console.error("Verify exam error:", error)
    return NextResponse.json(
      { success: false, message: "Server error while verifying the exam. Please try again later." },
      { status: 500 }
    )
  }
}