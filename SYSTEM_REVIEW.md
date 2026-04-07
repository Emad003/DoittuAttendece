# DOIT Attendance System - Complete Analysis

## System Overview
A complete student attendance system using face recognition, Google Sheets as backend, and Google Apps Script.

---

## 1. FILE STRUCTURE

| File | Purpose |
|------|---------|
| `index.html` | Landing page with mobile dropdown menu |
| `login.html` | Student login + Forgot Password with OTP |
| `register.html` | Student registration with face capture |
| `admin-login.html` | Faculty login |
| `dashboard.html` | Faculty dashboard (faculty portal) |
| `student-dashboard.html` | Student attendance stats |
| `attendance.html` | Face scan to mark attendance |
| `tag-html.html` | Duplicate of register.html |
| `login_temp.html` | Temporary/login test file |
| `weights/` | face-api.js AI models |

---

## 2. GOOGLE SHEET STRUCTURE

### Required Sheets:
1. **Students** - Column order: Name, Gender, Email, Password, Enrollment, Dept, Course, Year, Semester, FaceDescriptor
2. **Attendance** - Columns: Enrollment, Name, Subject, SubjectCode, Date, Time, Status, Department, Course, Semester
3. **Faculty** - Columns: Name, Email, Password, Department, Subject

---

## 3. APPS SCRIPT ACTIONS

All actions must be in the Apps Script:

```javascript
// ── COMPLETE ACTION LIST ──
'markAttendance'     → Save new attendance
'getAllAttendance'  → Fetch all attendance records
'updateAttendance' → Toggle Present/Absent
'deleteAttendance' → Delete a record
'login'             → Student login
'facultyLogin'      → Faculty login
'checkEmail'        → Check if email exists
'sendOtp'           → Send OTP for email verification
'resetPassword'    → Reset forgotten password
'getStudents'       → Fetch all students
'getDescriptors'    → Fetch students with face data
'sendLowAlert'      → Send low attendance email
'sendCancelNotice'  → Notify class cancellation
'checkAttendance'  → Check if already marked
```

---

## 4. FACE RECOGNITION FLOW

### Registration (register.html):
1. User fills form → Email OTP → Verify email
2. Camera opens → Capture face → Get face descriptor
3. Submit → Save to Google Sheet (column 10)

### Attendance (attendance.html):
1. Select subject → Start camera
2. Scan face → Get descriptor
3. Compare with all stored descriptors (threshold: 0.55)
4. If match found → Mark attendance as "Present"

---

## 5. IMPORTANT VARIABLES

### SHEET_URL (same in all files):
```
https://script.google.com/macros/s/AKfycbxq77REqZDT2ZZUk-bA0S9jjI7BSjnt_cZ3cBxutOrGubRd0lkBY1ArDpiWf8PCGe_m/exec
```

### FACE_API_URL:
```
./weights
```

---

## 6. KEY FUNCTIONS

### Login (login.html):
- Validates user input
- Calls `action=login`
- Stores student data in localStorage
- Redirects to student-dashboard.html

### Register (register.html):
- Email verification with OTP
- Face capture with face-api.js
- Stores faceDescriptor as JSON string

### Student Dashboard (student-dashboard.html):
- `loadDashboard()` → Fetches attendance, calculates stats
- `normalizeDate()` → Handles ISO and dd/mm/yyyy formats
- `renderTodayClasses()` → Shows today's timetable
- **Mark Attendance button** → Blue gradient with white camera icon (Font Awesome)

### Attendance Marking (attendance.html):
- `loadAllDescriptors()` → Fetches all student face data
- `scanFace()` → Detects face, matches with database
- `checkAlreadyMarked()` → Prevents duplicate marking
- `saveAttendance()` → Calls `action=markAttendance`
- **Navigation** → Dashboard button in nav bar for quick return
- **Result panel** → "Back to Dashboard" button appears after marking attendance

### Faculty Dashboard (dashboard.html):
- `loadDashboard()` → Shows date-wise attendance
- `toggleStatus()` → Toggle Present/Absent
- `deleteRecord()` → Delete attendance record
- `autoMarkAbsent()` → Mark all absent for a date
- `markManual()` → Manual attendance entry
- `sendAlert()` → Send low attendance warning

---

## 7. DATE/TIME FORMATS

### Storage format:
- Date: `dd/mm/yyyy` (e.g., "02/04/2026")
- Time: `hh:mm AM/PM` (e.g., "02:30 PM")

### Conversion functions:
```javascript
// ISO → dd/mm/yyyy
function normalizeDate(dateStr) {
  if(dateStr.includes('T')){
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  // ... more conversions
}
```

---

## 8. LOCALSTORAGE KEYS

| Key | Data |
|-----|------|
| `student` | Logged in student object (JSON) |
| `faculty` | Logged in faculty object (JSON) |
| `cancelledClasses` | Array of cancelled class dates |

---

## 9. MOBILE RESPONSIVE

### Responsive Breakpoints:
- `max-width: 799px` - Tablet/small laptop
- `max-width: 600px` - Mobile navigation change
- `max-width: 480px` - Small phone extra adjustments

### Pages with Mobile Styles:
- `index.html` - Landing page with mobile dropdown menu
- `login.html` - Already mobile optimized
- `register.html` - Already mobile optimized
- `student-dashboard.html` - Stats grid, reduced padding
- `attendance.html` - Subject grid, camera sizing
- `dashboard.html` - Sidebar toggle for mobile

### Mobile Menu (index.html):
- ☰ button appears on screens under 600px
- Dropdown menu with 3 options:
  - Student Login (`fa-user`)
  - Student Register (`fa-user-plus`)
  - Faculty Login (`fa-chalkboard-user`)

---

## 10. COMMON ISSUES & FIXES

### Issue 1: Delete not working
**Fix:** Add deleteAttendance to Apps Script
```javascript
if (action === 'deleteAttendance') {
  var delSheet = ss.getSheetByName('Attendance');
  var delRows = delSheet.getDataRange().getValues();
  var delEnroll = String(e.parameter.enrollment||'').trim();
  var delDate = String(e.parameter.date||'').trim();
  var delSubj = String(e.parameter.subject||'').trim();

  for(var di=1; di<delRows.length; di++){
    if(String(delRows[di][0]).trim() === delEnroll &&
       fmtDate(delRows[di][4]) === delDate &&
       String(delRows[di][2]).trim() === delSubj){
      delSheet.deleteRow(di + 1);
      return res({success: true});
    }
  }
  return res({success: false, error: 'Record not found'});
}
```

### Issue 2: Face models not loading
**Fix:** Run on local server (VS Code Live Server), not file://

### Issue 3: Login doesn't return faceDescriptor
**Fix:** Update login return:
```javascript
if(found) return res({success:true,name:found[0],enrollment:found[4],department:found[5],course:found[6],year:found[7],semester:found[8],faceDescriptor:found[9]});
```

---

## 11. DEPLOYMENT STEPS

1. Open Google Sheet → Extensions → Apps Script
2. Paste complete Apps Script code
3. Deploy → New Deployment → Web App
4. Execute as: Me
5. Who has access: Anyone
6. Copy URL and update SHEET_URL in all HTML files if changed

---

## 12. TESTING CHECKLIST

- [ ] Student can register with face
- [ ] Student can login
- [ ] Student can view dashboard
- [ ] Student can mark attendance via face scan
- [ ] Duplicate attendance blocked
- [ ] Back to Dashboard button works after marking attendance
- [ ] Dashboard button in nav works
- [ ] Faculty can login
- [ ] Faculty can view attendance
- [ ] Faculty can toggle status (Present↔Absent)
- [ ] Faculty can delete records
- [ ] Faculty can mark absent for all
- [ ] Low attendance alerts work
- [ ] Mobile menu works on index.html
- [ ] All pages responsive on mobile

---

## 13. FILE CONNECTIONS

```
index.html
    ↓ (mobile dropdown: login, register, admin-login)
login.html ←→ register.html
    ↓
student-dashboard.html ←→ attendance.html
    ↓
(admin-login.html)
    ↓
dashboard.html (Faculty)
```

---

## 14. UI CHANGES LOG

### Recent Updates:
- Added Dashboard button to attendance.html navigation
- Added "Back to Dashboard" button in result panel after marking attendance
- Updated Mark Attendance button with white camera icon (Font Awesome)
- Added comprehensive mobile responsive styles
- Added mobile dropdown menu with professional icons

---

## 15. QUICK REFERENCE - ASK ME THIS:

> "Check what's broken in my attendance system"
> → I'll analyze and identify issues

> "Why is [X] not working?"
> → I'll check the logic and provide fix

> "Add [X] feature"
> → I'll implement and explain

> "Update the Apps Script to add [X]"
> → I'll provide the exact code to add

---

END OF ANALYSIS