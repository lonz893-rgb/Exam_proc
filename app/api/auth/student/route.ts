import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, uniqueFormId } = body

    // --- PHASE 1: STUDENT ID VERIFICATION ---
    // Triggered when the student clicks "Continue to Form Access"
    // We only check the 'students' table here.
    if (studentId && !uniqueFormId) {
      try {
        const studentQuery = "SELECT * FROM students WHERE student_id = ? AND status = 'active'"
        const studentResults = await executeQuery(studentQuery, [studentId])

        if (!studentResults || studentResults.length === 0) {
          return NextResponse.json(
            { success: false, message: "Student ID not found or account is inactive." },
            { status: 401 }
          )
        }

        // Success for Phase 1: page.tsx will now open the Unique Form ID modal
        return NextResponse.json({ 
          success: true, 
          message: "Student ID verified. Please enter the Unique Form ID." 
        })
      } catch (dbError: any) {
        console.error("Database Error in Phase 1:", dbError)
        return NextResponse.json(
          { success: false, message: "Unable to connect to student database: " + dbError.message },
          { status: 500 }
        )
      }
    }

    // --- PHASE 2: UNIQUE FORM ID VERIFICATION ---
    // Triggered when the student clicks "Access Exam" inside the modal
    // We check BOTH the 'exams' table and re-verify the student.
    if (studentId && uniqueFormId) {
      try {
        // 1. Verify the Exam exists and is active
        const examQuery = "SELECT * FROM exams WHERE unique_id = ? AND status = 'active'"
        const examResults = await executeQuery(examQuery, [uniqueFormId])

        if (!examResults || examResults.length === 0) {
          return NextResponse.json(
            { success: false, message: "Invalid Unique Form ID. Please check with your teacher." },
            { status: 401 }
          )
        }

        // 2. Re-verify the Student to get details for the session
        const studentResults = await executeQuery(
          "SELECT id, name, student_id FROM students WHERE student_id = ? AND status = 'active'", 
          [studentId]
        )
        
        if (!studentResults || studentResults.length === 0) {
           return NextResponse.json(
            { success: false, message: "Student session expired or invalid." },
            { status: 401 }
          )
        }

        const student = studentResults[0]

        // 3. Log the access (Non-critical: failure here won't stop the student)
        try {
          await executeQuery(
            "INSERT INTO system_logs (user_type, user_id, action, description, ip_address) VALUES (?, ?, ?, ?, ?)",
            [
              "student",
              student.id,
              "exam_access",
              `Accessing exam: ${uniqueFormId}`,
              request.headers.get("x-forwarded-for") || "unknown",
            ]
          )
        } catch (logError) {
          console.error("Log insertion failed:", logError)
        }

        // Final Success: page.tsx will now execute window.location.href = "/index.html"
        return NextResponse.json({
          success: true,
          student: {
            id: student.id,
            name: student.name,
            studentId: student.student_id,
          },
        })
      } catch (dbError: any) {
        console.error("Database Error in Phase 2:", dbError)
        return NextResponse.json(
          { success: false, message: "Unable to verify Exam ID: " + dbError.message },
          { status: 500 }
        )
      }
    }

    // Fallback for missing data
    return NextResponse.json(
      { success: false, message: "Missing Student ID or Unique Form ID" },
      { status: 400 }
    )

  } catch (error: any) {
    console.error("Critical System Error:", error)
    return NextResponse.json(
      { success: false, message: "An unexpected system error occurred.", error: error.message },
      { status: 500 }
    )
  }
}