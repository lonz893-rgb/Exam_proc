// Apps Script: exam webapp (FIXED - numeric ID-first, robust question loader + grading)
// Paste this whole file into your Apps Script project and deploy as a Web App.
// Expected sheet layout (columns):
// A: numeric id (1,2,3...) OR code like Q001 (optional, numeric recommended)
// B: question text
// C: answer (A/B/True/False etc.)
// D: optional per-question timer seconds (number)
function doGet(e) {
  return doPost(e);
}

function doPost(e) {
  // Robust parameter handling - supports both form-encoded and JSON
  let params = {};
  
  try {
    if (e && e.parameter && Object.keys(e.parameter).length > 0) {
      // Form-encoded parameters (from URLSearchParams)
      params = e.parameter;
    } else if (e && e.postData) {
      // JSON body
      if (e.postData.type === 'application/json') {
        params = JSON.parse(e.postData.contents);
      } else if (e.postData.contents) {
        // Try parsing as JSON anyway
        try {
          params = JSON.parse(e.postData.contents);
        } catch (jsonErr) {
          // Fall back to parameter
          params = e.parameter || {};
        }
      }
    } else {
      params = e.parameter || {};
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Parameter parsing error: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = params.action;
  const sheetCode = params.code;
  const lastName = params.lastName;
  const firstName = params.firstName;
  const submittedAnswers = params.submittedAnswers;
  const startTime = params.startTime;
  const endTime = params.endTime;
  const date = params.date;

  // Action: Check for duplicate submissions
  if (action === 'checkDuplicate') {
    if (!lastName || !firstName || !sheetCode) {
      return ContentService.createTextOutput(JSON.stringify({
        exists: false,
        error: "Missing lastName, firstName, or code"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return checkDuplicate(sheetCode, lastName, firstName);
  }

  // Action: Record final grade (legacy compatibility)
  if (action === 'recordGrade') {
    if (!lastName || !firstName || !sheetCode || !submittedAnswers || !startTime || !endTime || !date) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing required parameters"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return recordGrade(sheetCode, lastName, firstName, submittedAnswers, startTime, endTime, date);
  }

  // Action: Record partial/aborted submission
  if (action === 'recordPartial') {
    const status = params.status || 'partial';
    const timestamp = params.timestamp || null;
    return recordPartial(sheetCode, lastName, firstName, submittedAnswers || '{}', status, timestamp);
  }

  // Action: Load all questions and answers
  if (action === 'getAllQuestionsAndAnswers' && sheetCode) {
    return getAllQuestionsAndAnswers(sheetCode);
  }

  // Action: Record final results to columns F-M (CURRENT METHOD)
  if (action === 'recordResultsFM') {
    const score = params.score || '';
    const correct = params.correct || '';
    const mistakes = params.mistakes || '';
    return recordResultsFM(sheetCode, lastName, firstName, score, correct, mistakes, startTime || '', endTime || '', date || '');
  }

  // Action: Record violation
if (action === 'logViolation') {
    const violationType = e.parameter.violationType;
    const violationCount = e.parameter.violationCount;
    const questionNumber = e.parameter.questionNumber;
    const timestamp = e.parameter.timestamp;

    return logViolation(sheetCode, lastName, firstName, violationType, violationCount, questionNumber, timestamp);
  }

  return ContentService.createTextOutput(JSON.stringify({error: "Invalid action"}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizeToQ(raw) {
  var s = String(raw || '').trim();
  if (!s) return '';
  var u = s.toUpperCase();
  var mQ = u.match(/^Q0*(\d+)$/i);
  if (mQ) return 'Q' + ('000' + mQ[1]).slice(-3);
  var mN = u.match(/^0*(\d+)$/);
  if (mN) return 'Q' + ('000' + mN[1]).slice(-3);
  return 'Q' + Utilities.getUuid().slice(0, 6).toUpperCase();
}

// ============================================================================
// CHECK DUPLICATE SUBMISSION
// ============================================================================

function checkDuplicate(sheetCode, lastName, firstName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const testSheet = ss.getSheetByName(sheetCode);
    
    if (!testSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        exists: false,
        error: "Sheet not found for code: " + sheetCode
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const lastRow = testSheet.getLastRow();
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        exists: false
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = testSheet.getRange(1, 1, lastRow, 7).getValues();
    const normLast = String(lastName || '').toLowerCase().trim();
    const normFirst = String(firstName || '').toLowerCase().trim();

    let submissionStartRow = 2;
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) {
        submissionStartRow = i + 1;
        break;
      }
    }
    if (submissionStartRow > data.length) submissionStartRow = data.length + 1;

    for (let i = submissionStartRow - 1; i < data.length; i++) {
      if (data[i][0]) continue;
      const sheetLast = String(data[i][5] || '').toLowerCase().trim();
      const sheetFirst = String(data[i][6] || '').toLowerCase().trim();
      if (sheetLast === normLast && sheetFirst === normFirst) {
        return ContentService.createTextOutput(JSON.stringify({
          exists: true
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      exists: false
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      exists: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// RECORD PARTIAL SUBMISSION
// ============================================================================

function recordPartial(sheetCode, lastName, firstName, submittedAnswersJson, status, timestamp) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Lock timeout'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var testSheet = ss.getSheetByName(sheetCode);
    var subName = 'Submissions';
    var sub = ss.getSheetByName(subName);
    
    if (!sub) {
      sub = ss.insertSheet(subName);
      var headers = ['Timestamp', 'SheetCode', 'LastName', 'FirstName', 'Status', 'SubmittedAnswers', 'StartTime', 'EndTime', 'Date'];
      for (var h = 0; h < 8; h++) headers.push('TeacherCol' + (h + 1));
      sub.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    sub.insertRowBefore(2);

    var teacherView = [];
    if (testSheet) {
      try {
        teacherView = testSheet.getRange(2, 6, 1, 8).getValues()[0];
      } catch (e) {
        teacherView = [];
      }
    }

    var ts = timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

    var row = [];
    row.push(ts);
    row.push(sheetCode || '');
    row.push(lastName || '');
    row.push(firstName || '');
    row.push(status || 'partial');
    row.push(submittedAnswersJson || '');
    row.push('');
    row.push('');
    row.push('');
    for (var i = 0; i < 8; i++) row.push(teacherView[i] || '');

    sub.getRange(2, 1, 1, row.length).setValues([row]);

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// RECORD FINAL GRADE (LEGACY)
// ============================================================================

function recordGrade(sheetCode, lastName, firstName, submittedAnswersJson, startTime, endTime, date) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Lock timeout'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var testSheet = ss.getSheetByName(sheetCode);
    
    if (!testSheet) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = testSheet.getLastRow();
    var data = testSheet.getRange(1, 1, Math.max(lastRow, 2), 4).getValues();
    var correctMap = {};
    
    for (var r = 1; r < data.length; r++) {
      var rawId = String(data[r][0] || '').trim();
      var qCode = normalizeToQ(rawId || r);
      var ans = String(data[r][2] || '').trim();
      if (ans) correctMap[qCode] = ans.toUpperCase();
    }

    var submitted = {};
    try {
      submitted = JSON.parse(submittedAnswersJson);
    } catch (e) {
      submitted = {};
    }

    var score = 0;
    var total = Object.keys(correctMap).length;
    
    for (var qCode in submitted) {
      var userAns = String(submitted[qCode] || '').trim().toUpperCase();
      var correctAns = correctMap[qCode];
      if (correctAns && userAns === correctAns) {
        score++;
      }
    }

    var scorePercent = total > 0 ? Math.round((score / total) * 100) + '%' : '0%';
    var wrong = total - score;

    var subName = 'Submissions';
    var sub = ss.getSheetByName(subName);
    
    if (!sub) {
      sub = ss.insertSheet(subName);
      var headers = ['Timestamp', 'SheetCode', 'LastName', 'FirstName', 'Status', 'SubmittedAnswers', 'StartTime', 'EndTime', 'Date', 'Score', 'Correct', 'Mistakes'];
      sub.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    sub.insertRowBefore(2);

    var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var row = [ts, sheetCode, lastName, firstName, 'completed', submittedAnswersJson, startTime, endTime, date, scorePercent, score, wrong];
    
    sub.getRange(2, 1, 1, row.length).setValues([row]);

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      score: scorePercent,
      correct: score,
      wrong: wrong
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// RECORD RESULTS TO COLUMNS F-M (CURRENT METHOD)
// ============================================================================

function recordResultsFM(sheetCode, lastName, firstName, score, correct, mistakes, startTime, endTime, date) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Lock timeout'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetCode);

    if (!sheet) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet "' + sheetCode + '" not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Find first empty row in column F (starting from row 2)
    var lastRow = sheet.getLastRow();
    var targetRow = 2; // Start from row 2
    
    // If there's data, check column F to find first empty cell
    if (lastRow >= 2) {
      var columnFData = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
      for (var i = 0; i < columnFData.length; i++) {
        if (!columnFData[i][0] || columnFData[i][0] === '') {
          targetRow = i + 2;
          break;
        }
      }
      // If all cells have data, use the next row
      if (targetRow === 2 && columnFData[0][0]) {
        targetRow = lastRow + 1;
      }
    }

    // Format times to include seconds
    var formattedStartTime = String(startTime || '');
    var formattedEndTime = String(endTime || '');
    
    // Ensure times have seconds (HH:MM:SS format)
    if (formattedStartTime && !formattedStartTime.match(/\d{1,2}:\d{2}:\d{2}/)) {
      formattedStartTime = formattedStartTime + ':00';
    }
    if (formattedEndTime && !formattedEndTime.match(/\d{1,2}:\d{2}:\d{2}/)) {
      formattedEndTime = formattedEndTime + ':00';
    }

    // Write to columns F-M (columns 6-13)
    var valuesFM = [[
      String(lastName || ''),      // F
      String(firstName || ''),     // G
      String(score || ''),         // H
      String(correct || ''),       // I
      String(mistakes || ''),      // J
      formattedStartTime,          // K
      formattedEndTime,            // L
      String(date || '')           // M
    ]];

    sheet.getRange(targetRow, 6, 1, 8).setValues(valuesFM);

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      row: targetRow,
      message: 'Results saved to row ' + targetRow
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    lock.releaseLock();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// RECORD VIOLATION
// ============================================================================

/* ================= LOG VIOLATION ================= */
function logViolation(sheetCode, lastName, firstName, violationType, violationCount, questionNumber, timestamp) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Lock timeout' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var violationsSheet = ss.getSheetByName('Violations');
    if (!violationsSheet) {
      violationsSheet = ss.insertSheet('Violations');
      var headers = ['Timestamp', 'Test Code', 'Last Name', 'First Name', 'Violation Type', 'Violation #', 'Question #', 'Action Taken'];
      violationsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      violationsSheet.setFrozenRows(1);
    }

    var count = parseInt(violationCount) || 1;
    var actionTaken = '';
    if(count===1) actionTaken='Warning - 20s countdown';
    else if(count===2) actionTaken='Final Warning - 20s countdown';
    else actionTaken='EXAM SUBMITTED - Auto-terminated';

    violationsSheet.insertRowBefore(2);
    var ts = timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    var rowData=[ts,sheetCode||'',lastName||'',firstName||'',violationType||'Unknown',count,questionNumber||'N/A',actionTaken];
    violationsSheet.getRange(2,1,1,rowData.length).setValues([rowData]);

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ success:true,message:'Violation logged successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err){
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ success:false,error:err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// GET ALL QUESTIONS AND ANSWERS
// ============================================================================

function getAllQuestionsAndAnswers(sheetCode) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const testSheet = ss.getSheetByName(sheetCode);
    
    if (!testSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        questions: [],
        questionsMap: {},
        defaultTimerSeconds: 30,
        error: "Sheet not found for code: " + sheetCode
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const lastRow = testSheet.getLastRow();
    const data = testSheet.getRange(1, 1, Math.max(lastRow, 2), 5).getValues();
    
    let defaultTimerSeconds = 30;
    let globalExamTimerSeconds = null;

    // Process header/settings row (row 2)
    if (data.length > 1) {
      // D2: Per-question default timer
      const d2Value = data[1][3];
      if (d2Value !== '' && !isNaN(d2Value)) {
        defaultTimerSeconds = Math.max(10, Math.min(300, parseInt(d2Value, 10)));
      }
      
      // E2: Global exam duration in minutes
      const e2Value = data[1][4];
      if (e2Value !== '' && !isNaN(e2Value) && parseInt(e2Value, 10) > 0) {
        globalExamTimerSeconds = parseInt(e2Value, 10) * 60;
      }
    }

    const questionsList = [];
    let expectedNum = 1;

    for (let r = 1; r < data.length; r++) {
      const rawIdCell = String(data[r][0] || '').trim();
      const rawQuestion = String(data[r][1] || '').trim();
      const rawAnswer = String(data[r][2] || '').trim();
      const rawTimer = data[r][3];

      // Skip fully empty rows
      if (!rawIdCell && !rawQuestion && !rawAnswer && (rawTimer === '' || rawTimer == null)) {
        continue;
      }

      // Determine numeric id
      let num = null;
      if (/^\d+$/.test(rawIdCell)) {
        num = parseInt(rawIdCell, 10);
      } else {
        num = expectedNum;
      }

      let questionText = rawQuestion || `[MISSING QUESTION at row ${r + 1}]`;
      let answerText = rawAnswer || '-';

      // Per-question timer
      let timerSeconds = defaultTimerSeconds;
      if (rawTimer !== '' && !isNaN(rawTimer)) {
        timerSeconds = Math.max(10, Math.min(300, parseInt(rawTimer, 10)));
      }

      let formatted = questionText;
      try {
        formatted = formatQuestion(questionText);
      } catch (e) {
        formatted = questionText.replace(/\s+/g, ' ').trim();
      }

      const code = 'Q' + String(num).padStart(3, '0');

      questionsList.push({
        num: num,
        code: code,
        question: formatted,
        answer: answerText,
        timerSeconds: timerSeconds
      });

      expectedNum = num + 1;
    }

    const questionsMap = {};
    questionsList.forEach(q => {
      questionsMap[q.code] = {
        code: q.code,
        question: q.question,
        answer: q.answer,
        timerSeconds: q.timerSeconds
      };
    });

    const response = {
      questions: questionsList,
      questionsMap: questionsMap,
      defaultTimerSeconds: defaultTimerSeconds,
      globalExamTimerSeconds: globalExamTimerSeconds
    };
    
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    Logger.log('getAllQuestionsAndAnswers error: ' + err);
    return ContentService.createTextOutput(JSON.stringify({
      questions: [],
      questionsMap: {},
      defaultTimerSeconds: 30,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// HELPER: FORMAT QUESTION
// ============================================================================

function getQuestionType(rawQuestion) {
  const lowerQ = String(rawQuestion || '').toLowerCase();
  const hasA = lowerQ.includes('a.');
  const hasB = lowerQ.includes('b.');
  const hasC = lowerQ.includes('c.');
  const hasD = lowerQ.includes('d.');
  const choiceCount = [hasA, hasB, hasC, hasD].filter(Boolean).length;
  if (choiceCount >= 3) return 'multiple-choice';
  if (choiceCount >= 1) return 'partial-choices';
  return 'identification';
}

function formatQuestion(rawQuestion) {
  const qType = getQuestionType(rawQuestion);
  if (qType === 'identification') {
    return String(rawQuestion || '').trim().replace(/\s+/g, ' ');
  }

  let stem = rawQuestion;
  let options = [];
  let stemEnd = rawQuestion.search(/\?\s*[a-d]\./i);
  if (stemEnd === -1) stemEnd = rawQuestion.search(/\.\s*[a-d]\./i);
  
  if (stemEnd > 0) {
    stem = rawQuestion.substring(0, stemEnd).trim();
    const optionsPart = rawQuestion.substring(stemEnd).trim();
    const optionRegex = /([a-d])\.\s*(.*?)(?=\s*[a-d]\.|$)/gis;
    let match;
    while ((match = optionRegex.exec(optionsPart)) !== null) {
      options.push({
        letter: match[1].toLowerCase(),
        text: match[2].trim()
      });
    }
  } else {
    const parts = rawQuestion.split(/([a-d]\.)/i);
    stem = parts[0].trim();
    for (let j = 1; j < parts.length; j += 2) {
      if (parts[j] && parts[j + 1]) {
        const letter = parts[j].trim().toLowerCase();
        const text = parts[j + 1].trim();
        if (letter.length === 1 && 'abcd'.includes(letter)) {
          options.push({
            letter: letter,
            text: text
          });
        }
      }
    }
  }

  let formatted = stem;
  options.forEach(opt => {
    formatted += `<br> ${opt.letter}. ${opt.text}`;
  });

  if (qType === 'partial-choices') {
    formatted += `<br><small>(Partial choices - enter letter or full answer)</small>`;
  }

  formatted = formatted.replace(/\s*\n\s*/g, ' ').replace(/<br>\s*<br>/g, '<br>');
  return formatted;
}