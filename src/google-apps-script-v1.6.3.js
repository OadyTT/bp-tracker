// ═══════════════════════════════════════════════════════════
//  HOME BP TRACKER — Google Apps Script v1.6.3
//
//  แก้ไข: ลบ LINE Notify (ยกเลิก 31 มี.ค. 2568)
//  เปลี่ยนเป็น LINE Messaging API แทน
//
//  ช่องทางแจ้งเตือน:
//  1. Email (ใช้งานได้ทันที ไม่ต้องตั้งค่า)
//  2. LINE Messaging API (ต้องตั้งค่า — ดูวิธีด้านล่าง)
//  3. บันทึกลง Sheet "Payment_Log"
//
//  วิธีตั้งค่า LINE Messaging API:
//  1. ไปที่ developers.line.biz → สร้าง Provider + Channel (Messaging API)
//  2. ไปที่ Channel Settings → Messaging API → Channel access token
//  3. กด "Issue" → Copy token ใส่ใน LINE_CHANNEL_TOKEN ด้านล่าง
//  4. ไปที่ LINE OA → เพิ่มเพื่อน Bot
//  5. ส่งข้อความอะไรก็ได้ให้ Bot → Bot จะได้ User ID
//  6. ดู User ID จาก Execution log เมื่อ run testGetLineUserId()
// ═══════════════════════════════════════════════════════════

// ── ตั้งค่า ─────────────────────────────────────────────
var ADMIN_EMAIL        = "thitiphankk@gmail.com";
var LINE_CHANNEL_TOKEN = "/gdhpcJTuB77Nf7FETJyTVXAWmW3ei92mL1TKlcd8KkXLzQTB3R7MjHcKeFLIuw1C9zkCI43LGGNgWQMHTRIpZzMwuAHYDHRFZPZKEW1XUhcFgZmVQyckXL5P6BdJ5+Y+6aUKtm0x3dTMZFdx8cm0gdB04t89/1O/w1cDnyilFU=";   // ← Channel access token จาก LINE Developers
var LINE_USER_ID       = "Ub41fc0cdada0f290836a5b8258baccd1";   // ← User ID ของ Admin (ดูจาก testGetLineUserId)

// ══════════════════════════════════════════════════════════
//  doPost
// ══════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var data = parseData(e);

    if (data.type === "payment_request") {
      handlePaymentRequest(data);
      return ok("notification sent");
    }

    if (data.patientName === "__TEST__" || String(data.date||"").indexOf("TEST-") === 0) {
      return ok("test ignored");
    }

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, "BP_Records");
    sheet.appendRow([
      data.date || "", data.morningTime || "", data.morningSys || "",
      data.morningDia || "", data.morningPulse || "", data.eveningTime || "",
      data.eveningSys || "", data.eveningDia || "", data.eveningPulse || "",
      data.patientName || "", new Date().toLocaleString("th-TH")
    ]);
    return ok("saved row " + sheet.getLastRow());

  } catch(err) {
    Logger.log("ERROR: " + err.message);
    return ok("error: " + err.message);
  }
}

// ══════════════════════════════════════════════════════════
//  handlePaymentRequest — Email + LINE Messaging API
// ══════════════════════════════════════════════════════════
function handlePaymentRequest(data) {
  var isTest  = data.isTest === true || data.isTest === "true";
  var testTag = isTest ? "[TEST] " : "";
  var name    = data.patientName || "ไม่ระบุ";
  var phone   = data.phone       || "ไม่ระบุ";
  var ts      = data.timestamp   || new Date().toLocaleString("th-TH");
  var ver     = data.appVersion  || "-";

  // 1. ── Email ───────────────────────────────────────────
  try {
    var subject = testTag + "🔔 BP Tracker: คนไข้ต้องการซื้อ Full Version";
    var htmlBody =
      "<div style='font-family:sans-serif;max-width:480px;padding:20px;" +
      "border:1px solid #e2e8f0;border-radius:12px;'>" +
      "<h2 style='color:#0284c7;'>" + testTag + "🔔 BP Tracker</h2>" +
      "<p>มีคนไข้ต้องการซื้อ Full Version</p>" +
      "<table style='width:100%;font-size:15px;border-collapse:collapse;'>" +
      "<tr style='background:#f0f9ff;'><td style='padding:8px;font-weight:bold;width:120px;'>ชื่อ</td><td style='padding:8px;'>" + name + "</td></tr>" +
      "<tr><td style='padding:8px;font-weight:bold;'>เบอร์โทร</td><td style='padding:8px;'>" + phone + "</td></tr>" +
      "<tr style='background:#f0f9ff;'><td style='padding:8px;font-weight:bold;'>เวลา</td><td style='padding:8px;'>" + ts + "</td></tr>" +
      "<tr><td style='padding:8px;font-weight:bold;'>Version</td><td style='padding:8px;'>" + ver + "</td></tr>" +
      "</table>" +
      "<div style='margin-top:16px;padding:14px;background:#dcfce7;border-radius:8px;'>" +
      "<strong>✅ กรุณาส่งรหัสปลดล็อคทาง LINE (ID: Oady)</strong></div></div>";

    MailApp.sendEmail({
      to: ADMIN_EMAIL, subject: subject,
      body: subject + "\nชื่อ: " + name + "\nเบอร์: " + phone + "\nเวลา: " + ts,
      htmlBody: htmlBody,
    });
    Logger.log("Email sent to " + ADMIN_EMAIL);
  } catch(e) {
    Logger.log("Email error: " + e.message);
  }

  // 2. ── LINE Messaging API ──────────────────────────────
  if (LINE_CHANNEL_TOKEN && LINE_USER_ID) {
    try {
      var msg = testTag + "🔔 BP Tracker — คนไข้ต้องการซื้อ Full Version\n" +
                "👤 ชื่อ: " + name + "\n" +
                "📞 เบอร์: " + phone + "\n" +
                "🕐 เวลา: " + ts + "\n" +
                "💡 ส่งรหัสปลดล็อคทาง LINE: Oady";

      var payload = JSON.stringify({
        to: LINE_USER_ID,
        messages: [{ type: "text", text: msg }]
      });

      var response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + LINE_CHANNEL_TOKEN
        },
        payload: payload,
        muteHttpExceptions: true,
      });
      Logger.log("LINE response: " + response.getContentText());
    } catch(e) {
      Logger.log("LINE error: " + e.message);
    }
  } else {
    Logger.log("LINE_CHANNEL_TOKEN หรือ LINE_USER_ID ยังไม่ได้ตั้งค่า — ข้าม LINE");
  }

  // 3. ── บันทึกลง Payment_Log ────────────────────────────
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = getOrCreateSheet(ss, "Payment_Log");
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(["เวลา","ชื่อผู้ป่วย","เบอร์โทร","เวอร์ชัน","ทดสอบ"]);
      logSheet.getRange(1,1,1,5).setFontWeight("bold").setBackground("#0284c7").setFontColor("white");
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([
      new Date().toLocaleString("th-TH"), name, phone, ver, isTest ? "YES" : "NO"
    ]);
  } catch(e) {
    Logger.log("Log error: " + e.message);
  }
}

// ══════════════════════════════════════════════════════════
//  doGet
// ══════════════════════════════════════════════════════════
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === "ping") return ok("pong");
    // รับ webhook จาก LINE เพื่อดึง User ID
    if (e && e.parameter && e.parameter.action === "line_webhook") {
      return ok("LINE webhook ready");
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return ok("BP Records rows: " + getOrCreateSheet(ss,"BP_Records").getLastRow());
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
        if (kv.length === 2)
          params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1].replace(/\+/g," "));
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
    var h = ["วันที่","เวลาเช้า","ตัวบน(เช้า)","ตัวล่าง(เช้า)","ชีพจร(เช้า)",
             "เวลาเย็น","ตัวบน(เย็น)","ตัวล่าง(เย็น)","ชีพจร(เย็น)","ชื่อผู้ป่วย","บันทึกเมื่อ"];
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
//  ทดสอบ — กด Run ที่ฟังก์ชันด้านล่าง
// ══════════════════════════════════════════════════════════

// ทดสอบส่งแจ้งเตือน (Email + LINE ถ้าตั้งค่าแล้ว)
function testPaymentNotification() {
  var fakeEvent = {
    parameter: {
      data: JSON.stringify({
        type: "payment_request",
        patientName: "คุณสมศรี ใจดี (TEST)",
        phone: "089-123-4567",
        isTest: true,
        timestamp: new Date().toLocaleString("th-TH"),
        appVersion: "v1.6.3",
      })
    }
  };
  Logger.log("Result: " + doPost(fakeEvent).getContent());
}

// ดึง User ID จาก LINE (ต้องตั้ง Webhook URL = Script URL ใน LINE OA ก่อน)
function testGetLineUserId() {
  Logger.log("LINE_CHANNEL_TOKEN: " + (LINE_CHANNEL_TOKEN ? "ตั้งแล้ว" : "ยังไม่ได้ตั้ง"));
  Logger.log("LINE_USER_ID: " + (LINE_USER_ID || "ยังไม่ได้ตั้ง"));
  if (!LINE_CHANNEL_TOKEN) {
    Logger.log("วิธีได้ User ID: เพิ่มเพื่อน Bot → ส่งข้อความ 'hi' → ดู User ID ใน LINE Developers → Messaging API → Webhook");
  }
}

// ทดสอบบันทึกข้อมูลความดัน
function testSaveRecord() {
  var fakeEvent = {
    parameter: {
      data: JSON.stringify({
        date:"2026-03-20", morningTime:"07:30", morningSys:"125",
        morningDia:"82", morningPulse:"74", eveningTime:"",
        eveningSys:"", eveningDia:"", eveningPulse:"", patientName:"ทดสอบ"
      })
    }
  };
  Logger.log("Save: " + doPost(fakeEvent).getContent());
}
