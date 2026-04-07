Add these actions to your Google Apps Script:

// ── ATTENDANCE CONTROL ──
// Add a new sheet called "AttendanceControl" with columns: SubjectCode, Date, Enabled

function doGet(e) {
  var action = e.parameter.action;

  // ... existing actions ...

  // Add these new cases:
  if (action == 'setAttendanceControl') {
    return setAttendanceControl(e.parameter);
  }
  if (action == 'getAttendanceControl') {
    return getAttendanceControl(e.parameter);
  }
}

function setAttendanceControl(params) {
  var subjectCode = params.subjectCode;
  var date = params.date;
  var enabled = params.enabled;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AttendanceControl');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('AttendanceControl');
    sheet.appendRow(['SubjectCode', 'Date', 'Enabled']);
  }

  var data = sheet.getDataRange().getValues();
  var rowNum = -1;

  // Find existing record
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == subjectCode && data[i][1] == date) {
      rowNum = i + 1;
      break;
    }
  }

  if (rowNum > 0) {
    // Update existing
    sheet.getRange(rowNum, 3).setValue(enabled);
  } else {
    // Add new
    sheet.appendRow([subjectCode, date, enabled]);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAttendanceControl(params) {
  var date = params.date;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AttendanceControl');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ controls: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  var controls = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == date) {
      controls.push({
        subjectCode: data[i][0],
        date: data[i][1],
        enabled: data[i][2]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ controls: controls }))
    .setMimeType(ContentService.MimeType.JSON);
}