# Proctoring System - Complete Fixes Summary

## Issues Fixed

### 1. False Tab Switch Detection from Iframe Clicks ✅
**Problem:** Clicking on exam form elements (inside iframe) triggered "Student switched to another application or window" violations even though the user never left the page.

**Root Cause:** The `handleVisibilityChange` event listener was triggering on any iframe interaction that briefly affected visibility state, not just actual tab switches.

**Solution Implemented:**
- Added `hadFocusLoss` flag to track if window actually lost focus
- Created separate `handleBlurEvent` and `handleFocus` handlers
- Now violations only trigger when BOTH:
  1. Document becomes hidden (document.hidden === true)
  2. Window had actual focus loss (hadFocusLoss === true)
- This prevents iframe clicks from falsely triggering violations

**Files Modified:** `/app/student/exam/[examId]/page.tsx`
- Separated window focus tracking from visibility change detection
- Added focus and blur event listeners to window
- Updated handleVisibilityChange to check hadFocusLoss flag

---

### 2. Exam Sessions Not Being Created ✅
**Problem:** The teacher dashboard's "Live Monitoring" showed 0 active sessions even when students were actively taking exams. This prevented violations from being properly linked to exam sessions.

**Root Cause:** When students clicked "Start Proctored Exam", no exam session was created in the database. The app lacked a mechanism to track that a student started an exam.

**Solution Implemented:**
- Created POST endpoint at `/api/exam-sessions/route.ts` to create sessions
- Updated `handleStartExam` to:
  1. Call the exam sessions API
  2. Send examId, studentId, studentName, and sessionToken
  3. Store the returned sessionId in localStorage for later use
- Session is now created with status='active' in database

**Files Modified:** 
- `/app/student/exam/[examId]/page.tsx` - Added POST call to create session
- `/app/api/exam-sessions/route.ts` - Added POST handler to create sessions

---

### 3. Violations Not Linked to Exam Sessions ✅
**Problem:** Violations were being logged but not properly associated with exam sessions, making it impossible for the teacher dashboard to display which student violated rules.

**Root Cause:** 
1. Exam sessions weren't being created
2. Violations were logged without exam_session_id
3. Database joins were failing

**Solution Implemented:**
- Modified `logViolation` to:
  1. Retrieve examSessionId from localStorage (set when session created)
  2. Include examSessionId in the violation POST request
- Updated violations POST handler to:
  1. Parse examSessionId as integer (null if not provided)
  2. Properly insert into violations table with FK reference

**Files Modified:** 
- `/app/student/exam/[examId]/page.tsx` - Added sessionId retrieval and inclusion
- `/app/api/violations/route.ts` - Improved NULL handling for sessionId

---

### 4. Database Relationships/Foreign Keys Working Correctly ✅
**Database Schema Review:**
- exam_sessions table has:
  - FK to exams(id)
  - FK to students(id)
  - Proper status tracking (active/completed/terminated)
- violations table has:
  - FK to exam_sessions(id) with ON DELETE SET NULL
  - Stores exam_title and student_name for display
- exams table has:
  - FK to teachers(id) for filtering by teacher

**Verified:** All joins in GET endpoints work correctly:
- Teacher can query their exams
- Can join to exam_sessions for active sessions
- Can count violations per session
- Violations are properly linked to sessions

---

## How It Works End-to-End

1. **Student starts exam:**
   - Clicks "Start Proctored Exam"
   - `handleStartExam` calls `/api/exam-sessions` POST endpoint
   - Exam session created with status='active'
   - Session ID stored in localStorage

2. **Student violates rules:**
   - Event listener detects violation (right-click, copy, tab switch, etc.)
   - `logViolation` retrieves sessionId from localStorage
   - Sends POST to `/api/violations` with exam_session_id
   - Violation stored in database linked to session

3. **Teacher views monitoring:**
   - Dashboard calls `/api/exam-sessions` GET endpoint
   - Returns all active sessions for teacher's exams
   - Includes violation_count (subquery)
   - Dashboard displays live monitoring with student names and violation counts

4. **Teacher views violations log:**
   - Dashboard calls `/api/violations` GET endpoint  
   - Returns violations joined with exam_sessions and exams
   - Shows which exam, which student, what violation

---

## Testing the Fixes

### Test 1: False Tab Switch Detection
1. Open exam form
2. Click on form fields
3. ✅ Should NOT trigger violation
4. Minimize window or switch tabs
5. ✅ SHOULD trigger violation

### Test 2: Live Monitoring Display
1. Have student start exam
2. Teacher dashboard should show:
   - Student name in Live Monitoring
   - Active session count increases
   - Exam title displayed

### Test 3: Violations Display
1. Student performs violation (e.g., right-click)
2. Violation appears in teacher's Violations Log
3. Shows: student name, exam title, violation type, timestamp

---

## Files Modified

1. `/app/student/exam/[examId]/page.tsx`
   - Added exam session creation on start
   - Fixed tab switch detection with focus tracking
   - Link violations to exam sessions

2. `/app/api/exam-sessions/route.ts`
   - Added POST handler to create sessions
   - Captures IP and User-Agent
   - Returns sessionId for client storage

3. `/app/api/violations/route.ts`
   - Improved exam_session_id handling
   - Better NULL value management
   - Enhanced logging for debugging

---

## Database Schema (Verified)

```sql
exam_sessions:
- id (PK)
- exam_id (FK → exams)
- student_id (FK → students)
- session_token
- start_time
- end_time
- status (active|completed|terminated)
- ip_address
- user_agent

violations:
- id (PK)
- exam_session_id (FK → exam_sessions, ON DELETE SET NULL)
- student_name
- exam_title
- violation_type
- description
- severity
- timestamp
- metadata (JSON)
```
