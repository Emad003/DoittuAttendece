// ── HELPER ──
function res(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── FORMAT DATE → dd/mm/yyyy ──
function fmtDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var d = val.getDate(), m = val.getMonth()+1, y = val.getFullYear();
    return (d<10?'0'+d:String(d))+'/'+( m<10?'0'+m:String(m))+'/'+y;
  }
  return String(val);
}

// ── FORMAT TIME → hh:mm AM/PM ──
function fmtTime(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var h = val.getHours(), mn = val.getMinutes(), ap = h>=12?'PM':'AM';
    h = h%12||12;
    return (h<10?'0'+h:String(h))+':'+(mn<10?'0'+mn:String(mn))+' '+ap;
  }
  return String(val);
}

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── UPDATE ATTENDANCE STATUS ──
  if (action === 'updateAttendance') {
    var uSheet = ss.getSheetByName('Attendance');
    var uRows = uSheet.getDataRange().getValues();
    var uEnroll = String(e.parameter.enrollment||'').trim();
    var uDate   = String(e.parameter.date||'').trim();
    var uSubj   = String(e.parameter.subject||'').trim();
    var uStatus = String(e.parameter.status||'Present');
    var updated = false;
    for(var ui=1; ui<uRows.length; ui++){
      if(String(uRows[ui][0]).trim()===uEnroll &&
         fmtDate(uRows[ui][4])===uDate &&
         String(uRows[ui][2]).trim()===uSubj){
        uSheet.getRange(ui+1, 7).setValue(uStatus);
        updated = true; break;
      }
    }
    return res({result: updated?'updated':'not found'});
  }

  // ── SETUP HEADERS — call once to fix sheet ──
  if (action === 'setupHeaders') {
    var s0 = ss.getSheetByName('Attendance');
    s0.clearContents();
    s0.getRange(1,1,1,10).setValues([[
      'Enrollment','Name','Subject','SubjectCode','Date','Time','Status','Department','Course','Semester'
    ]]);
    s0.getRange('E:E').setNumberFormat('@STRING@');
    s0.getRange('F:F').setNumberFormat('@STRING@');
    return res({result:'headers fixed', columns:'Enrollment|Name|Subject|SubjectCode|Date|Time|Status|Department|Course|Semester'});
  }

  if (action === 'markAttendance') {
    var s1 = ss.getSheetByName('Attendance');
    // AUTO-FIX: check if first column header is correct
    var firstCell = s1.getLastRow() > 0 ? s1.getRange(1,1).getValue().toString().trim() : '';
    if (firstCell !== 'Enrollment') {
      // Wrong headers — clear and reset
      s1.clearContents();
      s1.getRange(1,1,1,10).setValues([[
        'Enrollment','Name','Subject','SubjectCode','Date','Time','Status','Department','Course','Semester'
      ]]);
      s1.getRange('E:E').setNumberFormat('@STRING@');
      s1.getRange('F:F').setNumberFormat('@STRING@');
    }
    var nr = s1.getLastRow()+1;
    s1.getRange(nr,1,1,10).setValues([[
      e.parameter.enrollment||'', e.parameter.name||'',
      e.parameter.subject||'', e.parameter.subjectCode||'',
      e.parameter.date||'', e.parameter.time||'',
      e.parameter.status||'Present', e.parameter.department||'',
      e.parameter.course||'', e.parameter.semester||''
    ]]);
    s1.getRange(nr,5).setNumberFormat('@STRING@');
    s1.getRange(nr,6).setNumberFormat('@STRING@');
    return res({result:'success'});
  }

  if (action === 'getAllAttendance') {
    var s2 = ss.getSheetByName('Attendance');
    if (!s2) return res({records:[],version:'v4'});
    var rows2 = s2.getDataRange().getValues();
    if (rows2.length <= 1) return res({records:[],version:'v4'});
    var recs = rows2.slice(1).map(function(r,i){
      return {
        id:i, enrollment:String(r[0]), name:String(r[1]),
        subject:String(r[2]), subjectCode:String(r[3]),
        date:fmtDate(r[4]), time:fmtTime(r[5]),
        status:String(r[6]), department:String(r[7]),
        course:String(r[8]), semester:String(r[9])
      };
    });
    return res({records:recs,version:'v4'});
  }

  if (action === 'checkAttendance') {
    var s3 = ss.getSheetByName('Attendance');
    if (!s3) return res({marked:false});
    var rows3 = s3.getDataRange().getValues();
    var enr=String(e.parameter.enrollment||'').trim();
    var subj=String(e.parameter.subject||'').trim();
    var code=String(e.parameter.subjectCode||'').trim();
    var dt=String(e.parameter.date||'').trim();
    var marked = rows3.slice(1).some(function(r){
      return String(r[0]).trim()===enr && fmtDate(r[4])===dt &&
        (String(r[2]).trim()===subj||String(r[2]).trim()===code||String(r[3]).trim()===code);
    });
    return res({marked:marked});
  }

  if (action === 'checkEmail') {
    var s4 = ss.getSheetByName('Students');
    var rows4 = s4.getDataRange().getValues();
    var em = e.parameter.email.toLowerCase();
    return res({exists: rows4.slice(1).some(function(r){return r[2].toString().toLowerCase()===em;})});
  }

  if (action === 'sendCancelNotice') { return sendCancelNotice(e); }

  if (action === 'sendOtp') {
    MailApp.sendEmail({
      to: e.parameter.email,
      subject: 'OTP — DOIT Attendance System',
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;border:1px solid #dce8fb;border-radius:14px"><h2 style="color:#0f4fa8">DOIT Tripura University</h2><p>Your OTP:</p><div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0f4fa8;padding:20px;background:#f0f5ff;border-radius:10px;text-align:center">'+e.parameter.otp+'</div><p style="color:#5a6a8a">Valid for 10 minutes. Do not share.</p></div>'
    });
    return res({sent:true});
  }

  if (action === 'login') {
    var s5 = ss.getSheetByName('Students');
    var rows5 = s5.getDataRange().getValues();
    var usr=e.parameter.user.toLowerCase().trim(), pw=e.parameter.pass.trim(), found=null;
    for(var i=1;i<rows5.length;i++){
      if((rows5[i][2].toString().toLowerCase().trim()===usr||rows5[i][4].toString().toLowerCase().trim()===usr)&&rows5[i][3].toString().trim()===pw){found=rows5[i];break;}
    }
    if(found) return res({success:true,name:found[0],enrollment:found[4],department:found[5],course:found[6],year:found[7],semester:found[8]});
    return res({success:false,message:'Invalid credentials.'});
  }

  if (action === 'facultyLogin') {
    var s6 = ss.getSheetByName('Faculty');
    var rows6 = s6.getDataRange().getValues();
    var fem=e.parameter.email.toLowerCase().trim(), fpw=e.parameter.pass.trim();
    for(var j=1;j<rows6.length;j++){
      if(rows6[j][1].toString().toLowerCase().trim()===fem&&rows6[j][2].toString().trim()===fpw){
        return res({success:true,name:rows6[j][0],email:rows6[j][1],department:rows6[j][3],subject:rows6[j][4]});
      }
    }
    return res({success:false,message:'Invalid faculty credentials.'});
  }

  if (action === 'getStudents') {
    var s7 = ss.getSheetByName('Students');
    var rows7 = s7.getDataRange().getValues();
    return res({students: rows7.slice(1).map(function(r){
      return {name:r[0],gender:r[1],email:r[2],enrollment:r[4],department:r[5],course:r[6],year:r[7],semester:r[8]};
    })});
  }

  if (action === 'getDescriptors') {
    var s8 = ss.getSheetByName('Students');
    var rows8 = s8.getDataRange().getValues();
    return res({students: rows8.slice(1).filter(function(r){return r[9];}).map(function(r){
      return {enrollment:r[4],name:r[0],faceDescriptor:r[9],department:r[5],course:r[6],semester:r[8]};
    })});
  }

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

  if (action === 'sendLowAlert') {
    MailApp.sendEmail({
      to: e.parameter.email,
      subject: '⚠️ Low Attendance Alert — DOIT',
      htmlBody: '<div style="font-family:Arial,sans-serif;padding:28px"><h2 style="color:#d93025">⚠️ Low Attendance Warning</h2><p>Dear <b>'+e.parameter.name+'</b>,</p><p>Your attendance in <b>'+e.parameter.subject+'</b> is <b style="color:#d93025">'+e.parameter.pct+'%</b> — below 75%.</p><p>— DOIT Attendance System</p></div>'
    });
    return res({sent:true});
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: ATTENDANCE CONTROL (Enable/Disable by Faculty)
  // ═══════════════════════════════════════════════════════════════

  if (action === 'setAttendanceControl') {
    var subjectCode = String(e.parameter.subjectCode||'').trim();
    var date = String(e.parameter.date||'').trim();
    var enabled = String(e.parameter.enabled||'false').trim();

    var acSheet = ss.getSheetByName('AttendanceControl');
    if (!acSheet) {
      acSheet = ss.insertSheet('AttendanceControl');
      acSheet.appendRow(['SubjectCode', 'Date', 'Enabled']);
    }

    var acRows = acSheet.getDataRange().getValues();
    var acUpdated = false;

    for (var ai = 1; ai < acRows.length; ai++) {
      var storedDate = fmtDate(acRows[ai][1]);
      if (String(acRows[ai][0]).trim() === subjectCode &&
          storedDate === date) {
        acSheet.getRange(ai + 1, 3).setValue(enabled);
        acUpdated = true;
        break;
      }
    }

    if (!acUpdated) {
      acSheet.appendRow([subjectCode, date, enabled]);
    }

    return res({success: true});
  }

  if (action === 'getAttendanceControl') {
    var date = String(e.parameter.date||'').trim();

    var acSheet = ss.getSheetByName('AttendanceControl');
    if (!acSheet) {
      return res({controls: []});
    }

    var acRows = acSheet.getDataRange().getValues();
    var controls = [];

    for (var ci = 1; ci < acRows.length; ci++) {
      // Convert stored date to dd/mm/yyyy format for comparison
      var storedDate = fmtDate(acRows[ci][1]);
      if (storedDate === date) {
        controls.push({
          subjectCode: String(acRows[ci][0]).trim(),
          date: storedDate,
          enabled: acRows[ci][2]
        });
      }
    }

    return res({controls: controls});
  }

  return res({error:'Unknown action'});
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'resetPassword') {
    var s = ss.getSheetByName('Students');
    var r = s.getDataRange().getValues();
    for(var i=1;i<r.length;i++){
      if(r[i][2].toString().toLowerCase()===data.email.toLowerCase()){
        s.getRange(i+1,4).setValue(data.password);
        return res({success:true});
      }
    }
    return res({success:false});
  }

  var sReg = ss.getSheetByName('Students');
  sReg.appendRow([data.name,data.gender,data.email,data.password,data.enrollment,data.department,data.course,data.year,data.semester,data.faceDescriptor||'',new Date().toLocaleString()]);
  return res({result:'success'});
}

function sendCancelNotice(e) {
  MailApp.sendEmail({
    to: e.parameter.email,
    subject: '❌ Class Cancelled — '+e.parameter.subject+' on '+e.parameter.date,
    htmlBody: '<div style="font-family:Arial,sans-serif;padding:28px;border:1px solid #dce8fb;border-radius:14px"><h2 style="color:#d93025">❌ Class Cancelled</h2><p>Dear <b>'+e.parameter.name+'</b>,</p><p><b>Subject:</b> '+e.parameter.subject+'<br><b>Date:</b> '+e.parameter.date+'<br><b>Reason:</b> '+e.parameter.reason+'</p><p style="color:#d93025">⚠️ Attendance will NOT be taken on this date.</p><p>— '+e.parameter.faculty+', DOIT Tripura University</p></div>'
  });
  return res({success:true});
}