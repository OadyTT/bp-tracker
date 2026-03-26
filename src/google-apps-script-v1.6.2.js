// ═══════════════════════════════════════════════════════════
//  HOME BP TRACKER — Google Apps Script v1.6.2
//
//  ต้อง Deploy ใหม่เป็น "New Deployment" ทุกครั้งที่แก้โค้ด
//
//  ฟีเจอร์:
//  1. บันทึกข้อมูลความดันลง Google Sheets
//  2. ส่ง Email แจ้งเตือน Admin เมื่อคนไข้กดซื้อ Full Version
//  3. ส่ง Line Notify (ต้องตั้งค่า LINE_NOTIFY_TOKEN)
// ═══════════════════════════════════════════════════════════

// ── ตั้งค่า Admin ──────────────────────────────────────────
var ADMIN_EMAIL       = "thitiphankk@gmail.com";
var LINE_NOTIFY_TOKEN = "";  // ← ใส่ Token จาก notify-bot.line.me/th/my

// ══════════════════════════════════════════════════════════
//  doPost — รับข้อมูลทุกประเภท
// ══════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var data = parseData(e);

    // ── แจ้งเตือนการซื้อ Full Version ──────────────────────
    if (data.type === "payment_request") {
      handlePaymentRequest(data);
      return ok("notification sent");
    }

    // ── กรองข้อมูล test ──────────────────────────────────
    if (data.patientName === "__TEST__" || String(data.date||"").indexOf("TEST-") === 0) {
      return ok("test ignored");
    }

    // ── บันทึกข้อมูลความดัน ──────────────────────────────
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, "BP_Records");

    sheet.appendRow([
      data.date         || "",
      data.morningTime  || "",
      data.morningSys   || "",
      data.morningDia   || "",
      data.morningPulse || "",
      data.eveningTime  || "",
      data.eveningSys   || "",
      data.eveningDia   || "",
      data.eveningPulse || "",
      data.patientName  || "",
      new Date().toLocaleString("th-TH")
    ]);

    return ok("saved row " + sheet.getLastRow());

  } catch (err) {
    Logger.log("ERROR: " + err.message);
    return ok("error: " + err.message);
  }
}

// ══════════════════════════════════════════════════════════
//  handlePaymentRequest — ส่ง Email + Line แจ้งเตือน Admin
// ══════════════════════════════════════════════════════════
function handlePaymentRequest(data) {
  var isTest   = data.isTest === true || data.isTest === "true";
  var testTag  = isTest ? "[TEST] " : "";
  var subject  = testTag + "🔔 BP Tracker: คนไข้ต้องการซื้อ Full Version";

  var bodyText =
    testTag + "มีคนไข้ต้องการซื้อ Full Version\n\n" +
    "ชื่อ: "       + (data.patientName || "ไม่ระบุ") + "\n" +
    "เบอร์โทร: "   + (data.phone       || "ไม่ระบุ") + "\n" +
    "เวลา: "       + (data.timestamp   || new Date().toLocaleString("th-TH")) + "\n" +
    "เวอร์ชันแอป: " + (data.appVersion  || "-")       + "\n\n" +
    "กรุณาส่งรหัสปลดล็อคทาง Line: Oady\n" +
    "หรือตอบกลับที่: " + ADMIN_EMAIL;

  var bodyHtml =
    "<div style='font-family:sans-serif;max-width:480px;padding:20px;border:1px solid #e2e8f0;border-radius:12px;'>" +
    "<h2 style='color:#0284c7;margin-bottom:4px;'>" + testTag + "🔔 BP Tracker</h2>" +
    "<p style='color:#64748b;margin-bottom:16px;'>มีคนไข้ต้องการซื้อ Full Version</p>" +
    "<table style='width:100%;border-collapse:collapse;font-size:15px;'>" +
    "<tr><td style='padding:8px 12px;background:#f0f9ff;border-radius:6px;font-weight:bold;width:120px;'>ชื่อ</td><td style='padding:8px 12px;'>" + (data.patientName || "ไม่ระบุ") + "</td></tr>" +
    "<tr><td style='padding:8px 12px;background:#f0f9ff;border-radius:6px;font-weight:bold;'>เบอร์โทร</td><td style='padding:8px 12px;'>" + (data.phone || "ไม่ระบุ") + "</td></tr>" +
    "<tr><td style='padding:8px 12px;background:#f0f9ff;border-radius:6px;font-weight:bold;'>เวลา</td><td style='padding:8px 12px;'>" + (data.timestamp || new Date().toLocaleString("th-TH")) + "</td></tr>" +
    "<tr><td style='padding:8px 12px;background:#f0f9ff;border-radius:6px;font-weight:bold;'>Version</td><td style='padding:8px 12px;'>" + (data.appVersion || "-") + "</td></tr>" +
    "</table>" +
    "<div style='margin-top:16px;padding:14px;background:#dcfce7;border-radius:8px;'>" +
    "<strong>✅ กรุณาส่งรหัสปลดล็อคทาง Line: Oady</strong>" +
    "</div></div>";

  // 1. ส่ง Email ─────────────────────────────────────────
  try {
    MailApp.sendEmail({
      to:       ADMIN_EMAIL,
      subject:  subject,
      body:     bodyText,
      htmlBody: bodyHtml,
    });
    Logger.log("Email sent to " + ADMIN_EMAIL);
  } catch(e) {
    Logger.log("Email error: " + e.message);
  }

  // 2. ส่ง Line Notify ───────────────────────────────────
  if (LINE_NOTIFY_TOKEN) {
    try {
      var lineMsg =
        "\n" + testTag + "🔔 BP Tracker — คนไข้ต้องการซื้อ Full Version\n" +
        "👤 ชื่อ: " + (data.patientName || "ไม่ระบุ") + "\n" +
        "📞 เบอร์: " + (data.phone || "ไม่ระบุ") + "\n" +
        "🕐 เวลา: " + (data.timestamp || new Date().toLocaleString("th-TH")) + "\n" +
        "💡 ส่งรหัสปลดล็อคทาง Line: Oady";

      UrlFetchApp.fetch("https://notify-api.line.me/api/notify", {
        method: "post",
        headers: { Authorization: "Bearer " + LINE_NOTIFY_TOKEN },
        payload: { message: lineMsg },
        muteHttpExceptions: true,
      });
      Logger.log("Line Notify sent");
    } catch(e) {
      Logger.log("Line error: " + e.message);
    }
  } else {
    Logger.log("LINE_NOTIFY_TOKEN ไม่ได้ตั้งค่า — ข้าม Line Notify");
  }

  // 3. บันทึกลงชีท "Payment_Log" ───────────────────────
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = getOrCreateSheet(ss, "Payment_Log");
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(["เวลา","ชื่อผู้ป่วย","เบอร์โทร","เวอร์ชัน","ทดสอบ"]);
      logSheet.getRange(1,1,1,5).setFontWeight("bold").setBackground("#0284c7").setFontColor("white");
    }
    logSheet.appendRow([
      new Date().toLocaleString("th-TH"),
      data.patientName || "",
      data.phone       || "",
      data.appVersion  || "",
      isTest ? "YES" : "NO",
    ]);
  } catch(e) {
    Logger.log("Log error: " + e.message);
  }
}

// ══════════════════════════════════════════════════════════
//  doGet — ทดสอบ ping
// ══════════════════════════════════════════════════════════
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === "ping") return ok("pong");
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, "BP_Records");
    return ok("BP Records rows: " + sheet.getLastRow());
  } catch(err) {
    return ok("error: " + err.message);
  }
}

// ══════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════
function parseData(e) {
  if (e && e.parameter && e.parameter.data) {
    try { return JSON.parse(e.parameter.data); } catch(er) {}
  }
  if (e && e.postData && e.postData.contents) {
    var ct = (e.postData.type || "").toLowerCase();
    if (ct.indexOf("json") > -1) {
      try { return JSON.parse(e.postData.contents); } catch(er) {}
    }
    if (ct.indexOf("urlencoded") > -1) {
      var params = {};
      e.postData.contents.split("&").forEach(function(pair) {
        var kv = pair.split("=");
        if (kv.length === 2) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1].replace(/\+/g," "));
      });
      if (params.data) { try { return JSON.parse(params.data); } catch(er) {} }
      return params;
    }
    try { return JSON.parse(e.postData.contents); } catch(er) {}
  }
  if (e && e.parameter) return e.parameter;
  return {};
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0 && name === "BP_Records") {
    var h = ["วันที่","เวลาเช้า","ตัวบน(เช้า)","ตัวล่าง(เช้า)","ชีพจร(เช้า)","เวลาเย็น","ตัวบน(เย็น)","ตัวล่าง(เย็น)","ชีพจร(เย็น)","ชื่อผู้ป่วย","บันทึกเมื่อ"];
    sheet.appendRow(h);
    sheet.getRange(1,1,1,h.length).setFontWeight("bold").setBackground("#0284c7").setFontColor("white").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ok:true, msg:msg||""}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════
//  ทดสอบ — กด Run ที่ฟังก์ชันนี้ใน Apps Script Editor
// ══════════════════════════════════════════════════════════
function testPaymentNotification() {
  var fakeEvent = {
    parameter: {
      data: JSON.stringify({
        type:        "payment_request",
        patientName: "คุณสมศรี ใจดี",
        phone:       "089-123-4567",
        adminEmail:  "thitiphankk@gmail.com",
        adminLine:   "Oady",
        isTest:      true,
        timestamp:   new Date().toLocaleString("th-TH"),
        appVersion:  "v1.6.2",
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log("Result: " + result.getContent());
}

function testSaveRecord() {
  var fakeEvent = {
    parameter: {
      data: JSON.stringify({
        date:"2026-03-20", morningTime:"07:30",
        morningSys:"125", morningDia:"82", morningPulse:"74",
        eveningTime:"", eveningSys:"", eveningDia:"", eveningPulse:"",
        patientName:"ทดสอบ TestUser"
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log("Save result: " + result.getContent());
}
