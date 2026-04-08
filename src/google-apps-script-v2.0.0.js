// ═══════════════════════════════════════════════════════════
//  HOME BP TRACKER — Google Apps Script v2.0.0
//
//  v2.0.0 อัปเดต:
//  - รับ slip รูปภาพจาก App → ส่งไป LINE OA Admin
//  - แก้ parseData() รองรับ URL-encoded form
//  - แก้ LINE Messaging API push
//  - เพิ่ม Slip Log sheet
//
//  ⚠️ Deploy → New deployment ทุกครั้งที่แก้ไข!
// ═══════════════════════════════════════════════════════════

var ADMIN_EMAIL        = "thitiphankk@gmail.com";
var LINE_CHANNEL_TOKEN = "/gdhpcJTuB77Nf7FETJyTVXAWmW3ei92mL1TKlcd8KkXLzQTB3R7MjHcKeFLIuw1C9zkCI43LGGNgWQMHTRIpZzMwuAHYDHRFZPZKEW1XUhcFgZmVQyckXL5P6BdJ5+Y+6aUKtm0x3dTMZFdx8cm0gdB04t89/1O/w1cDnyilFU=";
var LINE_USER_ID       = "Ub41fc0cdada0f290836a5b8258baccd1";

// ═══════════════════════════════════════════════
//  doPost
// ═══════════════════════════════════════════════
function doPost(e) {
  try {
    var data = parseData(e);
    Logger.log("doPost type: " + (data.type || "bp_record"));

    if (data.type === "payment_request") {
      handlePaymentRequest(data);
      return ok("notification sent");
    }

    if (data.type === "payment_slip") {
      handleSlipUpload(data);
      return ok("slip received");
    }

    // ── Batch sync — รับหลาย records ทีเดียว (เร็วกว่า appendRow วนลูป) ──
    if (data.type === "batch_sync") {
      return handleBatchSync(data);
    }

    if (data.patientName === "__TEST__" || String(data.date || "").indexOf("TEST-") === 0) {
      return ok("test ok");
    }

    // Save single BP record
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, "BP_Records");
    sheet.appendRow([
      data.date || "", data.morningTime || "", data.morningSys || "",
      data.morningDia || "", data.morningPulse || "", data.eveningTime || "",
      data.eveningSys || "", data.eveningDia || "", data.eveningPulse || "",
      data.patientName || "", new Date().toLocaleString("th-TH")
    ]);
    return ok("saved row " + sheet.getLastRow());
  } catch (err) {
    Logger.log("ERROR: " + err.message);
    return ok("error: " + err.message);
  }
}

// ═══════════════════════════════════════════════
//  handleBatchSync — รับ records[] แล้วเขียนทีเดียว
//  เร็วกว่า appendRow วนลูปประมาณ 10-50 เท่า
// ═══════════════════════════════════════════════
function handleBatchSync(data) {
  try {
    var records = data.records || [];
    if (!records.length) return ok("no records");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, "BP_Records");
    var now = new Date().toLocaleString("th-TH");

    // สร้าง 2D array สำหรับ setValues (เร็วกว่า appendRow มาก)
    var rows = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      // ข้าม test records
      if (r.patientName === "__TEST__" || String(r.date || "").indexOf("TEST-") === 0) continue;
      rows.push([
        r.date || "",
        r.morningTime || "",
        r.morningSys || "",
        r.morningDia || "",
        r.morningPulse || "",
        r.eveningTime || "",
        r.eveningSys || "",
        r.eveningDia || "",
        r.eveningPulse || "",
        r.patientName || data.patientName || "",
        now
      ]);
    }

    if (rows.length > 0) {
      // เขียนทั้งหมดในครั้งเดียว — SpreadsheetApp batch write
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
      Logger.log("✅ Batch saved " + rows.length + " rows (setValues)");
    }

    return ok("batch saved " + rows.length + " rows");
  } catch (err) {
    Logger.log("❌ Batch error: " + err.message);
    return ok("batch error: " + err.message);
  }
}

// ═══════════════════════════════════════════════
//  handleSlipUpload — รับ slip → save to Drive → ส่ง LINE
// ═══════════════════════════════════════════════
function handleSlipUpload(data) {
  var name  = data.patientName || "ไม่ระบุ";
  var phone = data.phone || "ไม่ระบุ";
  var ts    = data.timestamp || new Date().toLocaleString("th-TH");
  var base64 = data.imageBase64 || "";

  // 1. Save image to Google Drive
  var imageUrl = "";
  if (base64) {
    try {
      // base64 format: data:image/jpeg;base64,xxxxx
      var parts = base64.split(",");
      var mimeType = "image/jpeg";
      if (parts[0]) {
        var match = parts[0].match(/data:([^;]+)/);
        if (match) mimeType = match[1];
      }
      var rawData = parts.length > 1 ? parts[1] : parts[0];
      var blob = Utilities.newBlob(Utilities.base64Decode(rawData), mimeType, "slip_" + name + "_" + Date.now() + ".jpg");

      // สร้างโฟลเดอร์ BP_Slips ถ้ายังไม่มี
      var folders = DriveApp.getFoldersByName("BP_Slips");
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("BP_Slips");
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrl = file.getUrl();
      Logger.log("✅ Slip saved to Drive: " + imageUrl);
    } catch (e) {
      Logger.log("❌ Drive save error: " + e.message);
    }
  }

  // 2. Send Email with slip info
  try {
    var subject = "📎 BP Tracker: คนไข้ส่งสลิปโอนเงิน";
    var htmlBody =
      '<div style="font-family:sans-serif;max-width:480px;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">' +
      '<h2 style="color:#f59e0b;">📎 สลิปโอนเงิน — BP Tracker</h2>' +
      '<table style="width:100%;font-size:15px;border-collapse:collapse;">' +
      '<tr style="background:#fef9c3;"><td style="padding:8px;font-weight:bold;">ชื่อ</td><td style="padding:8px;">' + name + '</td></tr>' +
      '<tr><td style="padding:8px;font-weight:bold;">เบอร์โทร</td><td style="padding:8px;">' + phone + '</td></tr>' +
      '<tr style="background:#fef9c3;"><td style="padding:8px;font-weight:bold;">เวลา</td><td style="padding:8px;">' + ts + '</td></tr>' +
      '</table>' +
      (imageUrl ? '<p>📸 <a href="' + imageUrl + '">ดูรูปสลิป</a></p>' : '<p>❌ ไม่สามารถบันทึกรูปได้</p>') +
      '<div style="margin-top:16px;padding:14px;background:#fef3c7;border-radius:8px;">' +
      '<strong>🔑 ตรวจสอบสลิปแล้ว ส่งรหัสปลดล็อคทาง LINE (ID: Oady)</strong></div></div>';

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: "สลิปจาก: " + name + " (" + phone + ") " + (imageUrl || "ไม่มีรูป"),
      htmlBody: htmlBody,
    });
    Logger.log("✅ Slip email sent");
  } catch (e) {
    Logger.log("❌ Slip email error: " + e.message);
  }

  // 3. Send LINE notification with slip link
  if (LINE_CHANNEL_TOKEN && LINE_USER_ID) {
    try {
      var msg = "📎 สลิปโอนเงิน — BP Tracker\n" +
                "👤 ชื่อ: " + name + "\n" +
                "📞 เบอร์: " + phone + "\n" +
                "🕐 เวลา: " + ts + "\n" +
                (imageUrl ? "📸 ดูสลิป: " + imageUrl : "❌ ไม่มีรูปสลิป") + "\n" +
                "🔑 ตรวจสอบแล้วส่งรหัสปลดล็อค";

      var payload = JSON.stringify({
        to: LINE_USER_ID,
        messages: [{ type: "text", text: msg }]
      });

      var response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + LINE_CHANNEL_TOKEN },
        payload: payload,
        muteHttpExceptions: true,
      });
      Logger.log("LINE slip notify: HTTP " + response.getResponseCode());
    } catch (e) {
      Logger.log("❌ LINE slip error: " + e.message);
    }
  }

  // 4. Log to Slip_Log sheet
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = getOrCreateSheet(ss, "Slip_Log");
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(["เวลา", "ชื่อ", "เบอร์โทร", "สลิป URL", "สถานะ"]);
      logSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f59e0b").setFontColor("white");
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([ts, name, phone, imageUrl || "ไม่มีรูป", "รอตรวจสอบ"]);
  } catch (e) {
    Logger.log("❌ Slip log error: " + e.message);
  }
}

// ═══════════════════════════════════════════════
//  handlePaymentRequest — Email + LINE
// ═══════════════════════════════════════════════
function handlePaymentRequest(data) {
  var isTest  = data.isTest === true || data.isTest === "true";
  var testTag = isTest ? "[TEST] " : "";
  var name    = data.patientName || "ไม่ระบุ";
  var phone   = data.phone || "ไม่ระบุ";
  var ts      = data.timestamp || new Date().toLocaleString("th-TH");
  var ver     = data.appVersion || "-";

  // Email
  try {
    var subject = testTag + "🔔 BP Tracker: คนไข้ต้องการซื้อ Full Version";
    var htmlBody =
      '<div style="font-family:sans-serif;max-width:480px;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">' +
      '<h2 style="color:#0284c7;">' + testTag + '🔔 BP Tracker</h2>' +
      '<p>มีคนไข้ต้องการซื้อ Full Version</p>' +
      '<table style="width:100%;font-size:15px;border-collapse:collapse;">' +
      '<tr style="background:#f0f9ff;"><td style="padding:8px;font-weight:bold;width:120px;">ชื่อ</td><td style="padding:8px;">' + name + '</td></tr>' +
      '<tr><td style="padding:8px;font-weight:bold;">เบอร์โทร</td><td style="padding:8px;">' + phone + '</td></tr>' +
      '<tr style="background:#f0f9ff;"><td style="padding:8px;font-weight:bold;">เวลา</td><td style="padding:8px;">' + ts + '</td></tr>' +
      '<tr><td style="padding:8px;font-weight:bold;">Version</td><td style="padding:8px;">' + ver + '</td></tr>' +
      '</table>' +
      '<div style="margin-top:16px;padding:14px;background:#dcfce7;border-radius:8px;">' +
      '<strong>✅ ส่งรหัสปลดล็อคทาง LINE (ID: Oady)</strong></div></div>';
    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: subject, body: subject + "\n" + name + " " + phone, htmlBody: htmlBody });
    Logger.log("✅ Email sent");
  } catch (e) { Logger.log("❌ Email: " + e.message); }

  // LINE
  if (LINE_CHANNEL_TOKEN && LINE_USER_ID) {
    try {
      var msg = testTag + "🔔 BP Tracker — แจ้งชำระเงิน\n👤 " + name + "\n📞 " + phone + "\n🕐 " + ts + "\n💡 ส่งรหัสปลดล็อคทาง LINE: Oady";
      UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
        method: "post", contentType: "application/json",
        headers: { "Authorization": "Bearer " + LINE_CHANNEL_TOKEN },
        payload: JSON.stringify({ to: LINE_USER_ID, messages: [{ type: "text", text: msg }] }),
        muteHttpExceptions: true,
      });
    } catch (e) { Logger.log("❌ LINE: " + e.message); }
  }

  // Log
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = getOrCreateSheet(ss, "Payment_Log");
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(["เวลา", "ชื่อ", "เบอร์โทร", "เวอร์ชัน", "ทดสอบ"]);
      logSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0284c7").setFontColor("white");
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([new Date().toLocaleString("th-TH"), name, phone, ver, isTest ? "YES" : "NO"]);
  } catch (e) { Logger.log("❌ Log: " + e.message); }
}

// ═══════════════════════════════════════════════
//  doGet
// ═══════════════════════════════════════════════
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === "ping") return ok("pong v2.0.0");
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return ok("rows: " + getOrCreateSheet(ss, "BP_Records").getLastRow());
  } catch (err) { return ok("error: " + err.message); }
}

// ═══════════════════════════════════════════════
//  parseData — FIX: รองรับ URL-encoded จาก App v2.0.0
// ═══════════════════════════════════════════════
function parseData(e) {
  if (e && e.parameter && e.parameter.data) {
    try { return JSON.parse(e.parameter.data); } catch (er) { Logger.log("parse param.data failed"); }
  }
  if (e && e.postData && e.postData.contents) {
    var ct = (e.postData.type || "").toLowerCase();
    var raw = e.postData.contents;
    if (ct.indexOf("json") > -1) { try { return JSON.parse(raw); } catch (er) {} }
    if (ct.indexOf("urlencoded") > -1) {
      var params = {};
      raw.split("&").forEach(function (pair) {
        var kv = pair.split("=");
        if (kv.length === 2) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1].replace(/\+/g, " "));
      });
      if (params.data) { try { return JSON.parse(params.data); } catch (er) {} }
      return params;
    }
    try { return JSON.parse(raw); } catch (er) {}
  }
  if (e && e.parameter) return e.parameter;
  return {};
}

// ═══════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0 && name === "BP_Records") {
    var h = ["วันที่","เวลาเช้า","ตัวบน(เช้า)","ตัวล่าง(เช้า)","ชีพจร(เช้า)","เวลาเย็น","ตัวบน(เย็น)","ตัวล่าง(เย็น)","ชีพจร(เย็น)","ชื่อผู้ป่วย","บันทึกเมื่อ"];
    sheet.appendRow(h);
    sheet.getRange(1, 1, 1, h.length).setFontWeight("bold").setBackground("#0284c7").setFontColor("white").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ok(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: msg || "" })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════
//  ทดสอบ
// ═══════════════════════════════════════════════
function testPaymentNotification() {
  doPost({ parameter: { data: JSON.stringify({ type: "payment_request", patientName: "คุณทดสอบ", phone: "089-xxx-xxxx", isTest: true, timestamp: new Date().toLocaleString("th-TH"), appVersion: "v2.0.0" }) } });
}

function testSlipUpload() {
  // ทดสอบโดยไม่มีรูป (จะส่ง text แทน)
  doPost({ parameter: { data: JSON.stringify({ type: "payment_slip", patientName: "คุณทดสอบ Slip", phone: "089-xxx-xxxx", imageBase64: "", timestamp: new Date().toLocaleString("th-TH") }) } });
}

function testLinePush() {
  if (!LINE_CHANNEL_TOKEN || !LINE_USER_ID) { Logger.log("❌ ตั้ง TOKEN + USER_ID ก่อน"); return; }
  var r = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "post", contentType: "application/json",
    headers: { "Authorization": "Bearer " + LINE_CHANNEL_TOKEN },
    payload: JSON.stringify({ to: LINE_USER_ID, messages: [{ type: "text", text: "🧪 Test LINE push from BP Tracker v2.0.0" }] }),
    muteHttpExceptions: true,
  });
  Logger.log("HTTP " + r.getResponseCode() + ": " + r.getContentText());
}

function testSaveRecord() {
  doPost({ parameter: { data: JSON.stringify({ date: "2026-03-27", morningTime: "07:30", morningSys: "125", morningDia: "82", morningPulse: "74", eveningTime: "", eveningSys: "", eveningDia: "", eveningPulse: "", patientName: "ทดสอบ v2.0.0" }) } });
}

// ทดสอบ Batch sync (เร็วกว่า single record)
function testBatchSync() {
  var records = [];
  for (var i = 1; i <= 5; i++) {
    records.push({
      date: "2026-03-" + (20 + i),
      morningTime: "07:00",
      morningSys: String(110 + i),
      morningDia: String(70 + i),
      morningPulse: "72",
      eveningTime: "19:00",
      eveningSys: String(115 + i),
      eveningDia: String(75 + i),
      eveningPulse: "68",
      patientName: "Batch Test"
    });
  }
  var start = new Date();
  var result = doPost({
    parameter: {
      data: JSON.stringify({
        type: "batch_sync",
        records: records,
        patientName: "Batch Test",
        total: records.length
      })
    }
  });
  var elapsed = new Date() - start;
  Logger.log("Batch result: " + result.getContent());
  Logger.log("⏱️ Time: " + elapsed + "ms for " + records.length + " records");
  Logger.log("⚡ = " + Math.round(elapsed / records.length) + "ms per record");
}
