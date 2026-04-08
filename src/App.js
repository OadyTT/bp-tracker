import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
const APP_VERSION   = "v2.1.0";
const BUILD_DATE    = "7 เม.ย. 2568";
const TRIAL_DAYS    = 60;
const ROWS_PER_JPG  = 20;
const ROWS_PER_A4   = 25;
const ADMIN_EMAIL   = "thitiphankk@gmail.com";
const ADMIN_LINE    = "Oady";
const KEY_RECORDS   = "bp-records-v1";
const KEY_PATIENT   = "bp-patient-v1";        // legacy migration only
const KEY_PATIENTS  = "bp-patients-v1";
const KEY_ACTIVE_PID= "bp-active-pid";
const KEY_UNLOCKED  = "bp-unlocked";
const KEY_ADMIN     = "bp-admin-cfg";
const KEY_BACKUP_TS = "bp-last-backup";
const KEY_LANG      = "bp-lang";
const KEY_FONTSCALE = "bp-fontscale";
const KEY_DEVICE    = "bp-device-id";
const KEY_TRIAL_TOK = "bp-trial-token";
const KEY_SHEET_TS  = "bp-sheet-sync-ts";
const SCRIPT_URL    = "https://script.google.com/macros/s/AKfycbxN0gf9mWMF9I4fCazGo4WhyWONrStPMiwuM-Xnc6GZSRk7iXf1V6E_HR5NPPkWB2eZ9w/exec";
// ═══════════════════════════════════════════════

// ── i18n ────────────────────────────────────────
const T = {
  TH: {
    appName:"บันทึกความดันโลหิต", appSub:"Home BP Tracker",
    record:"บันทึก", history:"ประวัติ", report:"รายงาน", settings:"ตั้งค่า", home:"หน้าหลัก",
    save:"💾 บันทึกความดัน", saving:"⏳ กำลังบันทึก...",
    morning:"ช่วงเช้า", evening:"ช่วงเย็น / กลางคืน",
    date:"วัน เดือน ปี", time:"เวลา", upper:"ตัวบน", lower:"ตัวล่าง", pulse:"ชีพจร",
    noData:"ยังไม่มีข้อมูล", startRecord:"เริ่มบันทึกความดันได้เลย",
    trial:"ทดลองใช้", daysLeft:"วันที่เหลือ", fullVer:"Full Version",
    upgrade:"💎 ดูรายละเอียด Full Version",
    printA4:"🖨️ พิมพ์ / PDF (A4)", saveJPG:"📸 บันทึกรูปภาพ (JPG)",
    backupDevice:"📥 บันทึกไฟล์สำรอง", backupSheets:"☁️ อัปโหลดขึ้น Google Sheets",
    patientInfo:"ข้อมูลคนไข้", name:"ชื่อ-นามสกุล", phone:"เบอร์โทรศัพท์",
    saveInfo:"บันทึกข้อมูล", fontSize:"ขนาดตัวอักษร", language:"ภาษา",
    small:"เล็ก", medium:"กลาง", large:"ใหญ่", xlarge:"ใหญ่มาก",
    addToHome:"เพิ่มแอปลงหน้าจอ", addedToHome:"✅ แอปอยู่บนหน้าจอแล้ว",
    readGuide:"อ่านคำแนะนำการใช้งาน", backupData:"Backup ข้อมูล",
    latest:"บันทึกล่าสุด", graph:"📈 กราฟ 14 วันล่าสุด",
    advice:"🩺 คำแนะนำสุขภาพ", ref:"อ้างอิง: WHO, AHA, ESC Guidelines 2023",
    delete:"ลบ", cancel:"ยกเลิก", close:"ปิด", confirm:"ยืนยัน",
    deleteConfirm:"ลบรายการนี้?", deleteAll:"🗑️ ลบข้อมูลทั้งหมด (คนไข้นี้)",
    advanced:"▼ แสดงตัวเลือกขั้นสูง", hideAdvanced:"▲ ซ่อนตัวเลือกขั้นสูง",
    sheetConnected:"✅ Google Sheets เชื่อมต่อสำเร็จ",
    sheetDisconnected:"🔴 Google Sheets เชื่อมต่อไม่ได้",
    sheetUnknown:"⚪ Google Sheets — ยังไม่ได้ทดสอบ",
    version:"เวอร์ชัน", updatedAt:"อัปเดต",
    editMorning:"+ เพิ่มข้อมูลเช้า", editEvening:"+ เพิ่มข้อมูลเย็น",
    existingData:"มีข้อมูลวันนี้แล้ว — เพิ่ม/แก้ไขได้เลย",
    newDay:"วันใหม่ — กรอกเช้า หรือ เย็น หรือทั้งคู่ก็ได้",
    unlockFull:"🔓 ปลดล็อค Full Version", enterCode:"ใส่รหัสปลดล็อค",
    notifyPay:"📲 แจ้งชำระเงิน", notifyDone:"✅ ส่งแจ้งเจ้าหน้าที่แล้ว",
    yourPhone:"เบอร์มือถือของคุณ",
    uploadSlip:"📎 แนบหลักฐานการโอน", slipSent:"✅ ส่งหลักฐานแล้ว",
    patients:"คนไข้ทั้งหมด", addPatient:"+ เพิ่มคนไข้",
    selectPatient:"เลือกคนไข้", editPatient:"แก้ไขข้อมูลคนไข้",
    switchPatient:"เปลี่ยน", managePatients:"จัดการคนไข้", records:"รายการ",
    genCode:"สร้างรหัส Unlock", inputDeviceId:"ใส่ Device ID ของคนไข้",
    generatedCode:"รหัส Unlock ที่ได้", copyCode:"📋 คัดลอกรหัส", copied:"คัดลอกแล้ว ✓",
    deviceIdLabel:"Device ID ของคุณ (ส่งให้ Admin เพื่อรับรหัส Unlock)",
  },
  EN: {
    appName:"Blood Pressure Log", appSub:"Home BP Tracker",
    record:"Record", history:"History", report:"Report", settings:"Settings", home:"Home",
    save:"💾 Save Blood Pressure", saving:"⏳ Saving...",
    morning:"Morning", evening:"Evening / Night",
    date:"Date", time:"Time", upper:"Systolic", lower:"Diastolic", pulse:"Pulse",
    noData:"No records yet", startRecord:"Start recording your blood pressure",
    trial:"Trial", daysLeft:"Days Left", fullVer:"Full Version",
    upgrade:"💎 View Full Version Details",
    printA4:"🖨️ Print / PDF (A4)", saveJPG:"📸 Save as Image (JPG)",
    backupDevice:"📥 Save Backup File", backupSheets:"☁️ Upload to Google Sheets",
    patientInfo:"Patient Information", name:"Full Name", phone:"Phone Number",
    saveInfo:"Save Info", fontSize:"Font Size", language:"Language",
    small:"Small", medium:"Medium", large:"Large", xlarge:"X-Large",
    addToHome:"Add App to Home Screen", addedToHome:"✅ App already on Home Screen",
    readGuide:"Read User Guide", backupData:"Backup Data",
    latest:"Latest Record", graph:"📈 14-Day Trend",
    advice:"🩺 Health Recommendations", ref:"Source: WHO, AHA, ESC Guidelines 2023",
    delete:"Delete", cancel:"Cancel", close:"Close", confirm:"Confirm",
    deleteConfirm:"Delete this record?", deleteAll:"🗑️ Delete All Data (this patient)",
    advanced:"▼ Show Advanced Options", hideAdvanced:"▲ Hide Advanced Options",
    sheetConnected:"✅ Google Sheets Connected",
    sheetDisconnected:"🔴 Google Sheets Not Connected",
    sheetUnknown:"⚪ Google Sheets — Not Tested Yet",
    version:"Version", updatedAt:"Updated",
    editMorning:"+ Add Morning Data", editEvening:"+ Add Evening Data",
    existingData:"Data exists for this date — add or edit below",
    newDay:"New day — fill morning, evening, or both",
    unlockFull:"🔓 Unlock Full Version", enterCode:"Enter unlock code",
    notifyPay:"📲 Notify Payment", notifyDone:"✅ Staff notified",
    yourPhone:"Your phone number",
    uploadSlip:"📎 Attach Transfer Slip", slipSent:"✅ Slip sent",
    patients:"All Patients", addPatient:"+ Add Patient",
    selectPatient:"Select Patient", editPatient:"Edit Patient Info",
    switchPatient:"Switch", managePatients:"Manage Patients", records:"records",
    genCode:"Generate Unlock Code", inputDeviceId:"Enter patient's Device ID",
    generatedCode:"Generated Unlock Code", copyCode:"📋 Copy Code", copied:"Copied ✓",
    deviceIdLabel:"Your Device ID (send to Admin to get unlock code)",
  },
};

// ── SVG Icons ────────────────────────────────────
const Ic = {
  Home:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Plus:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  List:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Camera:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Gear:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Heart:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  Sun:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Cloud:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
  Phone:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.69a16 16 0 006.29 6.29l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Lock:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Unlock:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>,
  Shield:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Chart:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  Trash:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Edit:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Check:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>,
  X:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Info:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Star:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  Book:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  Mobile:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  Bell:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Gem:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,3 18,3 22,9 12,22 2,9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="12" y2="22"/><line x1="6" y1="3" x2="2" y2="9"/><line x1="18" y1="3" x2="22" y2="9"/></svg>,
  Warn:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Hourglass:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12m5-10v4.172a2 2 0 01-.586 1.414L12 12M7 22v-4.172a2 2 0 01.586-1.414L12 12M7 2v4.172a2 2 0 00.586 1.414L12 12"/></svg>,
  QR:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/><line x1="17" y1="21" x2="21" y2="21"/></svg>,
  Upload:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  Download:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>,
  Print:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  User:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Users:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Tag:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Globe:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  Text:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  Image:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>,
  Key:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  ChevDown:(s=24)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6,9 12,15 18,9"/></svg>,
};

// ── Helpers ─────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];
const nowStr   = () => new Date().toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"});
const toThai   = (iso,lang="TH") => {
  if(!iso) return "";
  const [y,m,d]=iso.split("-");
  if(lang==="EN") return `${d}/${m}/${y}`;
  const M=["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${parseInt(d)} ${M[parseInt(m)]} ${parseInt(y)+543}`;
};
const lsGet=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const lsRaw=(k)=>{try{return localStorage.getItem(k)||"";}catch{return "";}};
const newPid=()=>"p-"+Date.now()+"-"+Math.random().toString(36).slice(2,6);
const getDeviceId=()=>{let id=lsRaw(KEY_DEVICE);if(!id){id="dev-"+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(KEY_DEVICE,id);}return id;};

// ── BP Status ────────────────────────────────────
const BP_LEVELS=["ปกติ","สูงเล็กน้อย","สูงระดับ 1","สูงระดับ 2"];
const bpStatus=(sys,dia)=>{
  const s=parseInt(sys),d=parseInt(dia);if(!s||!d)return null;
  if(s<120&&d<80)return{label:"ปกติ",labelEN:"Normal",bg:"#dcfce7",fg:"#166534",bar:"#22c55e"};
  if(s<130&&d<80)return{label:"สูงเล็กน้อย",labelEN:"Elevated",bg:"#fef9c3",fg:"#854d0e",bar:"#eab308"};
  if(s<140||d<90)return{label:"สูงระดับ 1",labelEN:"High St.1",bg:"#ffedd5",fg:"#9a3412",bar:"#f97316"};
  return{label:"สูงระดับ 2",labelEN:"High St.2",bg:"#fee2e2",fg:"#991b1b",bar:"#ef4444"};
};
const rank=st=>st?BP_LEVELS.indexOf(st.label):-1;
const FS={small:0.85,medium:1,large:1.2,xlarge:1.45};

// ── GAS post (urlencoded — GAS requires this) ────
const gasPost=async(payload,ms=10000)=>{
  try{
    const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),ms);
    await fetch(SCRIPT_URL,{method:"POST",mode:"no-cors",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:"data="+encodeURIComponent(JSON.stringify(payload)),signal:ctrl.signal});
    clearTimeout(t);return{ok:true};
  }catch(e){return{ok:false,err:e.message};}
};

// ── API calls ─────────────────────────────────────
const verifyCode=async(type,code)=>{
  try{const r=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,code,deviceId:getDeviceId()})});const d=await r.json();return d.ok===true;}catch{return false;}
};
const trialRegister=async(deviceId)=>{try{const r=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"trial_register",deviceId})});return await r.json();}catch{return null;}};
const trialCheck=async(deviceId,token)=>{try{const r=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"trial_check",deviceId,token})});return await r.json();}catch{return null;}};
const apiGenCode=async(deviceId,adminPass)=>{try{const r=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"gen_code",deviceId,adminPass})});return await r.json();}catch{return null;}};
const syncToSheet=async(entry,patientName)=>gasPost({...entry,patientName});
const syncAll=async(records,patientName,onProg)=>{let ok=0,fail=0;for(let i=0;i<records.length;i++){onProg&&onProg(i+1,records.length);const r=await syncToSheet(records[i],patientName);if(r.ok)ok++;else fail++;await new Promise(res=>setTimeout(res,350));}return{ok,fail};};
const notifyAdmin=async(patientName,phone,isTest=false)=>gasPost({type:"payment_request",patientName,phone,adminEmail:ADMIN_EMAIL,adminLine:ADMIN_LINE,isTest,timestamp:new Date().toLocaleString("th-TH"),appVersion:APP_VERSION});

// ── Image compress ───────────────────────────────
const compressImage=async(file,maxPx=900,quality=0.72)=>new Promise((resolve,reject)=>{
  const img=new Image();const url=URL.createObjectURL(file);
  img.onload=()=>{
    URL.revokeObjectURL(url);
    const scale=Math.min(1,maxPx/Math.max(img.width,img.height));
    const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
    canvas.getContext("2d").drawImage(img,0,0,w,h);
    canvas.toBlob(b=>{const reader=new FileReader();reader.onload=e=>resolve(e.target.result.split(",")[1]);reader.onerror=reject;reader.readAsDataURL(b);},"image/jpeg",quality);
  };img.onerror=reject;img.src=url;
});
const uploadSlip=async(file,patientName,phone)=>{
  try{const b64=await compressImage(file);return gasPost({type:"slip_upload",patientName,phone,slipBase64:b64,mimeType:"image/jpeg",timestamp:new Date().toLocaleString("th-TH"),appVersion:APP_VERSION});}
  catch(e){return{ok:false,err:e.message};}
};

// ── Input Component ──────────────────────────────
const Input=({label,value,onChange,type="text",placeholder,unit,readOnly,scale=1})=>(
  <div style={{display:"flex",flexDirection:"column",gap:Math.round(6*scale)}}>
    <label style={{fontSize:Math.round(17*scale),fontWeight:700,color:"#334155"}}>{label}</label>
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <input type={type} value={value||""} readOnly={readOnly} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:`${Math.round(14*scale)}px ${Math.round(16*scale)}px`,borderRadius:12,border:"2px solid #cbd5e1",
          fontSize:Math.round(20*scale),background:readOnly?"#f1f5f9":"#f8fafc",outline:"none",
          fontFamily:"Sarabun,sans-serif",color:"#0f172a",boxSizing:"border-box",
          paddingRight:unit?Math.round(56*scale):Math.round(16*scale),fontWeight:600}}
        onFocus={e=>{if(!readOnly)e.target.style.borderColor="#0284c7"}} onBlur={e=>e.target.style.borderColor="#cbd5e1"}/>
      {unit&&<span style={{position:"absolute",right:14,fontSize:Math.round(14*scale),color:"#94a3b8",fontWeight:700}}>{unit}</span>}
    </div>
  </div>
);

// ── BP Graph ─────────────────────────────────────
const BPGraph=({records,lang="TH"})=>{
  const last14=records.slice(-14);
  if(last14.length<2)return<div style={{textAlign:"center",padding:"20px",color:"#94a3b8",fontSize:15}}>{lang==="EN"?"Need at least 2 records":"ต้องมีข้อมูลอย่างน้อย 2 วัน"}</div>;
  const W=320,H=160,PL=36,PR=10,PT=10,PB=30,gW=W-PL-PR,gH=H-PT-PB;
  const sysV=last14.map(r=>r.morningSys?+r.morningSys:(r.eveningSys?+r.eveningSys:null));
  const diaV=last14.map(r=>r.morningDia?+r.morningDia:(r.eveningDia?+r.eveningDia:null));
  const all=[...sysV,...diaV].filter(Boolean);if(!all.length)return null;
  const minV=Math.max(50,Math.min(...all)-10),maxV=Math.min(200,Math.max(...all)+10);
  const xP=i=>PL+(i/(last14.length-1))*gW,yP=v=>PT+(1-(v-minV)/(maxV-minV))*gH;
  const path=vals=>vals.map((v,i)=>v?`${i===0||!vals[i-1]?"M":"L"}${xP(i)},${yP(v)}`:"").filter(Boolean).join(" ");
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H} style={{display:"block",margin:"0 auto"}}>
        {[120,130,140].filter(g=>g>=minV&&g<=maxV).map(g=>(
          <g key={g}><line x1={PL} y1={yP(g)} x2={W-PR} y2={yP(g)} stroke="#fca5a5" strokeWidth="1" strokeDasharray="4"/>
          <text x={PL-2} y={yP(g)+4} fontSize="9" fill="#ef4444" textAnchor="end">{g}</text></g>
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        <line x1={PL} y1={H-PB} x2={W-PR} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        {[minV,Math.round((minV+maxV)/2),maxV].map(v=><text key={v} x={PL-4} y={yP(v)+4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}</text>)}
        {last14.map((_,i)=>i%3===0&&<text key={i} x={xP(i)} y={H-4} fontSize="8" fill="#94a3b8" textAnchor="middle">{last14[i].date.slice(8)}</text>)}
        <path d={path(sysV)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round"/>
        <path d={path(diaV)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>
        {sysV.map((v,i)=>v&&<circle key={i} cx={xP(i)} cy={yP(v)} r="3" fill="#ef4444"/>)}
        {diaV.map((v,i)=>v&&<circle key={i} cx={xP(i)} cy={yP(v)} r="3" fill="#3b82f6"/>)}
      </svg>
      <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:6,fontSize:13}}>
        <span><span style={{display:"inline-block",width:14,height:3,background:"#ef4444",borderRadius:2,verticalAlign:"middle",marginRight:4}}/>{lang==="EN"?"Systolic":"ตัวบน"}</span>
        <span><span style={{display:"inline-block",width:14,height:3,background:"#3b82f6",borderRadius:2,verticalAlign:"middle",marginRight:4}}/>{lang==="EN"?"Diastolic":"ตัวล่าง"}</span>
      </div>
    </div>
  );
};

// ── Health Rec ────────────────────────────────────
const getRec=records=>{
  const last7=records.slice(-7);if(!last7.length)return null;
  const vals=last7.flatMap(r=>[r.morningSys?{s:+r.morningSys,d:+r.morningDia}:null,r.eveningSys?{s:+r.eveningSys,d:+r.eveningDia}:null]).filter(Boolean);
  if(!vals.length)return null;
  const avgS=Math.round(vals.reduce((a,v)=>a+v.s,0)/vals.length),avgD=Math.round(vals.reduce((a,v)=>a+v.d,0)/vals.length);
  const st=bpStatus(avgS,avgD);
  const tips={"ปกติ":{TH:["✅ ความดันอยู่ในเกณฑ์ดี","🥗 รับประทานผักผลไม้ครบ 5 หมู่","🏃 ออกกำลังกาย 30 นาที/วัน"],EN:["✅ BP is normal — keep it up","🥗 Eat 5 servings of fruits & vegetables","🏃 Exercise 30 min/day"]},"สูงเล็กน้อย":{TH:["⚠️ ลดเกลือและโซเดียมในอาหาร","🚶 เดิน 30–45 นาที/วัน","😴 นอนหลับ 7–8 ชั่วโมง"],EN:["⚠️ Reduce salt & sodium","🚶 Walk 30–45 min/day","😴 Sleep 7–8 hours"]},"สูงระดับ 1":{TH:["🏥 ควรพบแพทย์เพื่อประเมิน","🚫 งดอาหารเค็มและแอลกอฮอล์","💊 รับประทานยาตามแพทย์สั่ง"],EN:["🏥 See a doctor for evaluation","🚫 Avoid salty food & alcohol","💊 Take medication as prescribed"]},"สูงระดับ 2":{TH:["🚨 ความดันสูงมาก พบแพทย์โดยด่วน","🚫 ห้ามออกกำลังหนัก","📞 เจ็บหน้าอก/ปวดศีรษะ รีบไป ER"],EN:["🚨 Very high — see doctor urgently","🚫 Avoid strenuous exercise","📞 Chest pain/headache? Go to ER"]}};
  return{avgS,avgD,status:st,tips:(st?tips[st.label]:null)||{TH:[],EN:[]}};
};

// ── Paywall ──────────────────────────────────────
const Paywall=({adminCfg,patientName,patientPhone,onUnlock,onBack,lang="TH",scale=1})=>{
  const t=T[lang];const fs=FS[scale]||1;
  const [code,setCode]=useState("");const [err,setErr]=useState(false);const [loading,setLoading]=useState(false);
  const [notified,setNotified]=useState(false);const [nLoading,setNLoading]=useState(false);
  const [phone,setPhone]=useState(patientPhone||"");
  const [slipLoading,setSlipLoading]=useState(false);const [slipSent,setSlipSent]=useState(false);
  const tryUnlock=async()=>{if(!code.trim())return;setLoading(true);const v=await verifyCode("unlock",code.trim());setLoading(false);if(v)onUnlock();else{setErr(true);setTimeout(()=>setErr(false),2500);}};
  const doNotify=async()=>{if(!phone.trim())return;setNLoading(true);await notifyAdmin(patientName||"ไม่ระบุ",phone,false);setNLoading(false);setNotified(true);};
  const handleSlip=async(e)=>{const file=e.target.files[0];if(!file)return;setSlipLoading(true);const r=await uploadSlip(file,patientName||"ไม่ระบุ",phone||patientPhone||"");setSlipLoading(false);if(r.ok)setSlipSent(true);e.target.value="";};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(2,132,199,0.97)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Sarabun,sans-serif",overflowY:"auto"}}>
      <div style={{background:"white",borderRadius:24,padding:24,width:"100%",maxWidth:400,margin:"auto"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#64748b",fontSize:Math.round(16*fs),cursor:"pointer",fontFamily:"Sarabun,sans-serif",marginBottom:12,padding:0}}>← {lang==="EN"?"Back":"ย้อนกลับ"}</button>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{color:"#0284c7",marginBottom:6}}>{Ic.Lock(Math.round(48*fs))}</div>
          <div style={{fontSize:Math.round(22*fs),fontWeight:800,color:"#0369a1"}}>{lang==="EN"?"Trial Ended":"หมดระยะทดลองใช้"}</div>
        </div>
        {(adminCfg.price||adminCfg.qrUrl||adminCfg.bankName)&&(
          <div style={{background:"#f0f9ff",borderRadius:14,padding:"14px 16px",marginBottom:14,fontSize:Math.round(15*fs),lineHeight:2}}>
            {adminCfg.price&&<div>💰 {lang==="EN"?"Price":"ราคา"}: <strong>{adminCfg.price}</strong></div>}
            {adminCfg.bankName&&<div>🏦 {adminCfg.bankName}</div>}
            {adminCfg.accountNo&&<div>📋 {adminCfg.accountNo}</div>}
            {adminCfg.accountName&&<div>👤 {adminCfg.accountName}</div>}
            {adminCfg.phone&&<div>{Ic.Phone(16)} {adminCfg.phone}</div>}
          </div>
        )}
        {adminCfg.qrUrl&&adminCfg.qrUrl.startsWith("http")&&(
          <div style={{textAlign:"center",marginBottom:14}}>
            <img src={adminCfg.qrUrl} alt="QR" style={{width:Math.round(180*fs),height:Math.round(180*fs),borderRadius:12,border:"2px solid #e2e8f0"}} onError={e=>e.target.style.display="none"}/>
          </div>
        )}
        {!notified?(
          <div style={{background:"#fefce8",borderRadius:12,padding:14,marginBottom:14}}>
            <div style={{fontSize:Math.round(15*fs),fontWeight:700,color:"#92400e",marginBottom:8}}>{t.notifyPay}</div>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={t.yourPhone}
              style={{width:"100%",padding:12,borderRadius:10,border:"1.5px solid #fde68a",fontSize:Math.round(17*fs),fontFamily:"Sarabun,sans-serif",boxSizing:"border-box",marginBottom:10,outline:"none"}}/>
            <button onClick={doNotify} disabled={nLoading||!phone}
              style={{width:"100%",padding:13,background:nLoading?"#94a3b8":"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",border:"none",borderRadius:10,fontSize:Math.round(17*fs),fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer",marginBottom:10}}>
              {nLoading?"⏳...":t.notifyPay}
            </button>
            {!slipSent?(
              <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:12,borderRadius:10,border:"2px dashed #fbbf24",background:"#fffbeb",color:"#92400e",fontSize:Math.round(15*fs),fontWeight:700,cursor:"pointer",fontFamily:"Sarabun,sans-serif",boxSizing:"border-box"}}>
                {slipLoading?<>⏳ {lang==="EN"?"Sending...":"กำลังส่ง..."}</>:<>{Ic.Image(18)}{" "}{t.uploadSlip}</>}
                <input type="file" accept="image/*" capture="environment" onChange={handleSlip} style={{display:"none"}} disabled={slipLoading}/>
              </label>
            ):(
              <div style={{textAlign:"center",color:"#166534",fontWeight:700,fontSize:Math.round(15*fs),background:"#dcfce7",borderRadius:10,padding:10}}>{Ic.Check(16)}{" "}{t.slipSent}</div>
            )}
          </div>
        ):(
          <div style={{background:"#dcfce7",borderRadius:12,padding:14,marginBottom:14,textAlign:"center"}}>
            <div style={{color:"#166534"}}>{Ic.Check(Math.round(24*fs))}</div>
            <div style={{fontSize:Math.round(15*fs),fontWeight:700,color:"#166534"}}>{t.notifyDone}</div>
            <div style={{fontSize:Math.round(14*fs),color:"#15803d"}}>Line: {ADMIN_LINE}</div>
          </div>
        )}
        <input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryUnlock()} placeholder={t.enterCode}
          style={{width:"100%",padding:14,borderRadius:12,border:`2px solid ${err?"#ef4444":"#cbd5e1"}`,fontSize:Math.round(18*fs),fontFamily:"Sarabun,sans-serif",boxSizing:"border-box",textAlign:"center",fontWeight:700,outline:"none",marginBottom:err?6:12}}/>
        {err&&<div style={{color:"#ef4444",fontSize:Math.round(14*fs),marginBottom:8,textAlign:"center"}}>❌ {lang==="EN"?"Invalid code":"รหัสไม่ถูกต้อง"}</div>}
        <button onClick={tryUnlock} disabled={loading}
          style={{width:"100%",padding:16,background:loading?"#94a3b8":"linear-gradient(135deg,#0284c7,#075985)",color:"white",border:"none",borderRadius:12,fontSize:Math.round(20*fs),fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading?"⏳...":<>{Ic.Unlock(20)}{" "}{t.unlockFull}</>}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════
export default function App(){
  // ── State ──────────────────────────────────────
  const [tab,setTab]=useState("home");
  const [records,setRecords]=useState([]);
  const [patients,setPatients]=useState([]);
  const [activePid,setActivePid]=useState("");
  const [showPatientPicker,setShowPatientPicker]=useState(false);
  const [editingPatient,setEditingPatient]=useState(null);
  const [patientForm,setPatientForm]=useState({name:"",phone:""});
  const [loaded,setLoaded]=useState(false);
  const [toast,setToast]=useState(null);
  const [saving,setSaving]=useState(false);
  const [capturing,setCapturing]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [syncProg,setSyncProg]=useState(null);
  const [lastBackup,setLastBackup]=useState("");
  const [lastSheetSync,setLastSheetSync]=useState("");
  const [sheetStatus,setSheetStatus]=useState("unknown");
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [showDeleteZone,setShowDeleteZone]=useState(false);
  const [editRecord,setEditRecord]=useState(null);
  const [trialLeft,setTrialLeft]=useState(TRIAL_DAYS);
  const [daysUsed,setDaysUsed]=useState(0);
  const [trialLoading,setTrialLoading]=useState(true);
  const [isUnlocked,setIsUnlocked]=useState(false);
  const [showPaywall,setShowPaywall]=useState(false);
  const [showUpgrade,setShowUpgrade]=useState(false);
  const [adminCfg,setAdminCfg]=useState({qrUrl:"",bankName:"",accountNo:"",accountName:"",price:"",phone:""});
  const [adminTap,setAdminTap]=useState(0);
  const [showAdmin,setShowAdmin]=useState(false);
  const [adminAuth,setAdminAuth]=useState(false);
  const [adminPass,setAdminPass]=useState("");
  const [adminLoading,setAdminLoading]=useState(false);
  const [testNotifyLoading,setTestNotifyLoading]=useState(false);
  const [showGuide,setShowGuide]=useState(false);
  const [testResult,setTestResult]=useState(null);
  const [deferredPrompt,setDeferredPrompt]=useState(null);
  const [isInstalled,setIsInstalled]=useState(false);
  const [showIOSGuide,setShowIOSGuide]=useState(false);
  const [genDeviceId,setGenDeviceId]=useState("");
  const [genLoading,setGenLoading]=useState(false);
  const [generatedCode,setGeneratedCode]=useState("");
  const [lang,setLang]=useState(()=>lsRaw(KEY_LANG)||"TH");
  const [fontScale,setFontScale]=useState(()=>lsRaw(KEY_FONTSCALE)||"medium");
  const reportRef=useRef(null);

  const t=T[lang];const fs=FS[fontScale]||1;
  const emptyForm={date:todayISO(),morningTime:"",morningSys:"",morningDia:"",morningPulse:"",eveningTime:"",eveningSys:"",eveningDia:"",eveningPulse:""};
  const [form,setForm]=useState(emptyForm);

  // ── Derived ───────────────────────────────────
  const activePatient=patients.find(p=>p.id===activePid)||{id:"",name:"",phone:""};
  const filteredRecords=records.filter(r=>r.patientId===activePid);

  // ── INIT + MIGRATION ──────────────────────────
  useEffect(()=>{
    let pts=lsGet(KEY_PATIENTS,null);
    let apid=lsRaw(KEY_ACTIVE_PID);
    const allRecords=lsGet(KEY_RECORDS,[]);

    if(!pts){
      const oldPt=lsGet(KEY_PATIENT,{name:"",phone:""});
      const defaultId=newPid();
      pts=[{id:defaultId,name:oldPt.name||"",phone:oldPt.phone||""}];
      apid=defaultId;
      lsSet(KEY_PATIENTS,pts);localStorage.setItem(KEY_ACTIVE_PID,apid);
      const migrated=allRecords.map(r=>r.patientId?r:{...r,patientId:defaultId});
      lsSet(KEY_RECORDS,migrated);setRecords(migrated);
    } else {setRecords(allRecords);}

    setPatients(pts);setActivePid(apid||pts[0]?.id||"");
    setAdminCfg(lsGet(KEY_ADMIN,{qrUrl:"",bankName:"",accountNo:"",accountName:"",price:"",phone:""}));
    setLastBackup(lsRaw(KEY_BACKUP_TS));setLastSheetSync(lsRaw(KEY_SHEET_TS)||"");
    const unlocked=lsGet(KEY_UNLOCKED,false);setIsUnlocked(unlocked);

    if(!unlocked){
      const deviceId=getDeviceId();const token=lsRaw(KEY_TRIAL_TOK);
      (async()=>{
        setTrialLoading(true);let result=null;
        if(token){result=await trialCheck(deviceId,token);if(result?.tampered)result={ok:false,expired:true,daysLeft:0};}
        if(!result?.ok){
          const reg=await trialRegister(deviceId);
          if(reg?.ok){localStorage.setItem(KEY_TRIAL_TOK,reg.token);result={ok:true,daysLeft:TRIAL_DAYS,daysUsed:0,expired:false};}
          else{let inst=localStorage.getItem("bp-install-date");if(!inst){inst=new Date().toISOString();localStorage.setItem("bp-install-date",inst);}const used=Math.floor((Date.now()-new Date(inst))/86400000);result={ok:true,daysLeft:Math.max(0,TRIAL_DAYS-used),daysUsed:used,expired:used>=TRIAL_DAYS};}
        }
        const left=result.daysLeft??TRIAL_DAYS;const used=result.daysUsed??(TRIAL_DAYS-left);
        setTrialLeft(left);setDaysUsed(used);if(result.expired||left===0)setShowPaywall(true);setTrialLoading(false);
      })();
    } else {setTrialLoading(false);}

    if(!window._h2cLoaded){window._h2cLoaded=true;const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";document.head.appendChild(sc);}
    setLoaded(true);
    if(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true)setIsInstalled(true);
    const hbi=e=>{e.preventDefault();setDeferredPrompt(e);};
    window.addEventListener("beforeinstallprompt",hbi);
    window.addEventListener("appinstalled",()=>{setIsInstalled(true);setDeferredPrompt(null);toast$("✅ เพิ่มแอปลงหน้าจอสำเร็จ!");});
    return()=>window.removeEventListener("beforeinstallprompt",hbi);
  },[]);

  const toast$=(msg,type="ok",dur=3500)=>{setToast({msg,type});setTimeout(()=>setToast(null),dur);};
  const doUnlock=()=>{lsSet(KEY_UNLOCKED,true);setIsUnlocked(true);setShowPaywall(false);toast$("🎉 ปลดล็อคสำเร็จ! Full Version");};
  const isPremium=isUnlocked||(trialLeft>0&&!trialLoading);
  const changeLang=l=>{setLang(l);localStorage.setItem(KEY_LANG,l);};
  const changeFontScale=f=>{setFontScale(f);localStorage.setItem(KEY_FONTSCALE,f);};
  const bpLevelLabel=st=>lang==="EN"?st?.labelEN:st?.label;

  // ── PATIENT CRUD ──────────────────────────────
  const savePatients=pts=>{setPatients(pts);lsSet(KEY_PATIENTS,pts);};
  const addPatient=()=>{
    if(!patientForm.name.trim())return;
    const pid=newPid();const newPt={id:pid,name:patientForm.name.trim(),phone:patientForm.phone.trim()};
    const next=[...patients,newPt];savePatients(next);
    setActivePid(pid);localStorage.setItem(KEY_ACTIVE_PID,pid);
    setEditingPatient(null);setPatientForm({name:"",phone:""});setShowPatientPicker(false);
    toast$(lang==="EN"?"Patient added":"เพิ่มคนไข้แล้ว");
  };
  const updatePatient=()=>{
    if(!patientForm.name.trim()||!editingPatient?.id)return;
    const next=patients.map(p=>p.id===editingPatient.id?{...p,name:patientForm.name.trim(),phone:patientForm.phone.trim()}:p);
    savePatients(next);setEditingPatient(null);setPatientForm({name:"",phone:""});toast$(lang==="EN"?"Saved":"บันทึกแล้ว");
  };
  const deletePatient=pid=>{
    const hasRecs=records.some(r=>r.patientId===pid);
    if(hasRecs&&!window.confirm(lang==="EN"?"This patient has records. Delete everything?":"คนไข้นี้มีข้อมูล ลบทั้งหมด?"))return;
    const nextPts=patients.filter(p=>p.id!==pid);
    if(!nextPts.length){toast$(lang==="EN"?"Need at least 1 patient":"ต้องมีคนไข้อย่างน้อย 1 คน","warn");return;}
    if(hasRecs){const nr=records.filter(r=>r.patientId!==pid);setRecords(nr);lsSet(KEY_RECORDS,nr);}
    savePatients(nextPts);
    if(activePid===pid){const np=nextPts[0].id;setActivePid(np);localStorage.setItem(KEY_ACTIVE_PID,np);}
    setEditingPatient(null);toast$(lang==="EN"?"Deleted":"ลบแล้ว");
  };
  const switchPatient=pid=>{
    setActivePid(pid);localStorage.setItem(KEY_ACTIVE_PID,pid);
    setShowPatientPicker(false);setForm(emptyForm);setEditRecord(null);
    toast$(patients.find(p=>p.id===pid)?.name||"","ok",1500);
  };

  // ── FORM ──────────────────────────────────────
  const changeDate=newDate=>{
    const ex=filteredRecords.find(r=>r.date===newDate);
    if(ex){setForm({...ex});toast$(`📋 ${toThai(newDate,lang)}`,"ok",2000);}
    else setForm({date:newDate,morningTime:"",morningSys:"",morningDia:"",morningPulse:"",eveningTime:"",eveningSys:"",eveningDia:"",eveningPulse:""});
  };
  const setF=k=>v=>{if(k==="date"){changeDate(v);return;}setForm(f=>({...f,[k]:v}));};

  // ── SUBMIT ────────────────────────────────────
  const submit=async()=>{
    if(!form.morningSys&&!form.morningDia&&!form.eveningSys&&!form.eveningDia){toast$(lang==="EN"?"Enter at least one reading":"กรอกค่าอย่างน้อย 1 ช่วง","err");return;}
    if(!isPremium){setShowPaywall(true);return;}
    if(!activePid){toast$(lang==="EN"?"Select a patient first":"เลือกคนไข้ก่อน","err");return;}
    setSaving(true);
    const ex=records.find(r=>r.date===form.date&&r.patientId===activePid);
    const entry={date:form.date,id:ex?ex.id:Date.now(),patientId:activePid,
      morningTime:form.morningSys?form.morningTime:(ex?.morningTime||""),
      morningSys:form.morningSys||ex?.morningSys||"",
      morningDia:form.morningSys?form.morningDia:(ex?.morningDia||""),
      morningPulse:form.morningSys?form.morningPulse:(ex?.morningPulse||""),
      eveningTime:form.eveningSys?form.eveningTime:(ex?.eveningTime||""),
      eveningSys:form.eveningSys||ex?.eveningSys||"",
      eveningDia:form.eveningSys?form.eveningDia:(ex?.eveningDia||""),
      eveningPulse:form.eveningSys?form.eveningPulse:(ex?.eveningPulse||""),};
    const next=ex?records.map(r=>r.id===ex.id?entry:r):[...records,entry].sort((a,b)=>a.date.localeCompare(b.date));
    setRecords(next);lsSet(KEY_RECORDS,next);
    const res=await syncToSheet(entry,activePatient.name);
    if(res.ok){const ts=nowStr();localStorage.setItem(KEY_SHEET_TS,ts);setLastSheetSync(ts);setSheetStatus("ok");}else setSheetStatus("error");
    toast$(res.ok?`✅ ${ex?"อัปเดต":"บันทึก"} + Google Sheets`:`💾 ${ex?"อัปเดต":"บันทึก"} (ออฟไลน์)`,res.ok?"ok":"warn");
    setForm(emptyForm);setEditRecord(null);setSaving(false);setTab("history");
  };
  const openEdit=r=>{setEditRecord(r);setForm({...r});setTab("record");};
  const delRecord=id=>{const next=records.filter(r=>r.id!==id);setRecords(next);lsSet(KEY_RECORDS,next);setDeleteConfirm(null);toast$(lang==="EN"?"Deleted":"ลบแล้ว");};

  // ── BACKUP ───────────────────────────────────
  const exportBackup=async()=>{
    const data={version:APP_VERSION,patients,activePid,records,exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const filename=`bp-backup_${activePatient.name||"all"}_${todayISO()}.json`;
    const ts=nowStr();
    if(navigator.share&&navigator.canShare){try{const file=new File([blob],filename,{type:"application/json"});if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"BP Backup"});localStorage.setItem(KEY_BACKUP_TS,ts);setLastBackup(ts);toast$("📥 "+t.backupDevice+" ✓");return;}}catch(e){if(e.name==="AbortError")return;}}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),10000);localStorage.setItem(KEY_BACKUP_TS,ts);setLastBackup(ts);toast$("📥 "+t.backupDevice+" ✓");
  };
  const backupToSheet=async()=>{
    if(!filteredRecords.length){toast$(lang==="EN"?"No data":"ยังไม่มีข้อมูล","warn");return;}
    setSyncing(true);setSyncProg({current:0,total:filteredRecords.length});
    const res=await syncAll(filteredRecords,activePatient.name,(cur,tot)=>setSyncProg({current:cur,total:tot}));
    setSyncing(false);setSyncProg(null);
    if(res.fail===0){const ts=nowStr();localStorage.setItem(KEY_SHEET_TS,ts);setLastSheetSync(ts);setSheetStatus("ok");}else setSheetStatus(res.ok>0?"ok":"error");
    toast$(res.fail===0?`✅ ${t.backupSheets} (${res.ok})`:`⚠️ ${res.ok}/${filteredRecords.length}`,res.fail===0?"ok":"warn",5000);
  };
  const importBackup=e=>{
    const file=e.target.files[0];if(!file)return;
    const r=new FileReader();r.onload=ev=>{try{
      const d=JSON.parse(ev.target.result);
      if(d.patients&&d.records){setPatients(d.patients);lsSet(KEY_PATIENTS,d.patients);const recs=d.records.sort((a,b)=>a.date.localeCompare(b.date));setRecords(recs);lsSet(KEY_RECORDS,recs);const apid=d.activePid||d.patients[0]?.id||"";setActivePid(apid);localStorage.setItem(KEY_ACTIVE_PID,apid);toast$(`📤 ${d.patients.length} patients · ${recs.length} records`);}
      else if(d.records){const recs=d.records.map(r=>({...r,patientId:r.patientId||activePid})).sort((a,b)=>a.date.localeCompare(b.date));setRecords(recs);lsSet(KEY_RECORDS,recs);toast$(`📤 ${recs.length} records`);}
    }catch{toast$("Invalid file","err");}};
    r.readAsText(file);e.target.value="";
  };
  const testBackup=async()=>{
    setTestResult({testing:true});let devOk=false,sheetOk=false;
    try{const b=new Blob(["test"]);URL.revokeObjectURL(URL.createObjectURL(b));devOk=true;}catch{}
    const res=await syncToSheet({date:"TEST-"+todayISO(),id:Date.now(),patientId:"TEST",morningSys:"999",morningDia:"999",morningPulse:"",morningTime:"",eveningSys:"",eveningDia:"",eveningPulse:"",eveningTime:""},"__TEST__");
    sheetOk=res.ok;setTestResult({testing:false,devOk,sheetOk});setSheetStatus(sheetOk?"ok":"error");
    toast$(`เครื่อง: ${devOk?"✅":"❌"}  ·  Google Sheets: ${sheetOk?"✅":"❌"}`,devOk&&sheetOk?"ok":"warn",5000);
  };

  // ── PRINT A4 (proper page-break per 25 rows) ─
  const doPrint=()=>{
    if(!filteredRecords.length){toast$(t.noData,"warn");return;}
    const chunks=[];for(let i=0;i<filteredRecords.length;i+=ROWS_PER_A4)chunks.push(filteredRecords.slice(i,i+ROWS_PER_A4));
    const thStyle=bg=>`border:1px solid #94a3b8;padding:5px 4px;background:${bg};color:white;text-align:center;`;
    const pageHtml=chunks.map((chunk,pi)=>{
      const rows=chunk.map((r,ri)=>{
        const ms=bpStatus(r.morningSys,r.morningDia),es=bpStatus(r.eveningSys,r.eveningDia);
        const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
        return`<tr style="background:${ri%2===0?"white":"#f8fafc"}">
          <td style="border:1px solid #cbd5e1;padding:5px 6px;text-align:left;white-space:nowrap;font-weight:700;">${toThai(r.date,lang)}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;color:#92400e;">${r.morningTime||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;font-weight:800;font-size:13pt;color:${ms?ms.fg:"#000"};">${r.morningSys||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;font-weight:700;">${r.morningDia||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;">${r.morningPulse||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;color:#1d4ed8;">${r.eveningTime||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;font-weight:800;font-size:13pt;color:${es?es.fg:"#000"};">${r.eveningSys||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;font-weight:700;">${r.eveningDia||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;">${r.eveningPulse||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:5px 4px;text-align:center;background:${w?w.bg:"#fff"};color:${w?w.fg:"#000"};font-weight:700;">${w?(lang==="EN"?w.labelEN:w.label):""}</td>
        </tr>`;
      }).join("");
      return`<div class="page">
        <h2 style="text-align:center;color:#0284c7;margin:0 0 4px;font-size:16pt;">❤️ ${lang==="EN"?"Blood Pressure Report":"รายงานความดันโลหิต"}</h2>
        ${activePatient.name?`<div style="text-align:center;color:#475569;font-size:11pt;">👤 ${activePatient.name}${activePatient.phone?` · 📞 ${activePatient.phone}`:""}</div>`:""}
        <div style="text-align:center;color:#94a3b8;font-size:9pt;margin-bottom:10px;">${toThai(todayISO(),lang)} · ${filteredRecords.length} ${lang==="EN"?"records":"รายการ"} · ${APP_VERSION} · ${lang==="EN"?"Page":"หน้า"} ${pi+1}/${chunks.length}</div>
        <table style="width:100%;border-collapse:collapse;font-size:10pt;">
          <thead>
            <tr>
              <th rowspan="2" style="${thStyle("#0284c7")}">${t.date}</th>
              <th colspan="4" style="${thStyle("#92400e")}">${t.morning}</th>
              <th colspan="4" style="${thStyle("#1d4ed8")}">${t.evening.split(" /")[0]}</th>
              <th rowspan="2" style="${thStyle("#0284c7")}">${lang==="EN"?"Status":"สถานะ"}</th>
            </tr>
            <tr>
              ${["#b45309","#b45309","#b45309","#b45309","#2563eb","#2563eb","#2563eb","#2563eb"].map((bg,i)=>`<th style="${thStyle(bg)}font-size:9pt;">${[t.time,t.upper,t.lower,t.pulse,t.time,t.upper,t.lower,t.pulse][i]}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="text-align:right;font-size:8pt;color:#94a3b8;margin-top:6px;">Normal &lt;120/80 mmHg · ${APP_VERSION}</div>
      </div>`;
    }).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet"/>
    <style>
      *{font-family:'Sarabun',sans-serif;box-sizing:border-box;}
      body{margin:0;}
      @page{size:A4 portrait;margin:10mm 12mm;}
      .page{padding:6mm 2mm;page-break-after:always;}
      .page:last-child{page-break-after:auto;}
      .printbtn{display:block;margin:12px auto;padding:10px 28px;background:#0284c7;color:white;border:none;border-radius:8px;font-size:13pt;cursor:pointer;font-family:'Sarabun',sans-serif;}
      @media print{.printbtn{display:none;}}
      thead{display:table-header-group;}
    </style></head>
    <body>
    <button class="printbtn" onclick="window.print()">${t.printA4}</button>
    ${pageHtml}
    </body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.target="_blank";a.rel="noopener";a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),60000);
    toast$(lang==="EN"?`Opened (${chunks.length} pages)`:`เปิดแล้ว (${chunks.length} หน้า)`,"ok",4000);
  };

  // ── SAVE JPG (20 rows/image, multi-file) ──────
  const saveJPG=async()=>{
    if(!filteredRecords.length){toast$(t.noData,"warn");return;}
    if(!window.html2canvas){toast$(lang==="EN"?"Loading, try again":"กำลังโหลด ลองใหม่","warn");return;}
    setCapturing(true);
    const chunks=[];for(let i=0;i<filteredRecords.length;i+=ROWS_PER_JPG)chunks.push(filteredRecords.slice(i,i+ROWS_PER_JPG));

    const buildHTML=(chunk,pageNum)=>{
      const rows=chunk.map((r,ri)=>{
        const ms=bpStatus(r.morningSys,r.morningDia),es=bpStatus(r.eveningSys,r.eveningDia);
        const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
        return`<tr style="background:${ri%2===0?"white":"#f8fafc"}">
          <td style="border:1px solid #cbd5e1;padding:7px 8px;text-align:left;white-space:nowrap;font-weight:700;color:#0f172a;">${toThai(r.date,lang)}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;color:#92400e;">${r.morningTime||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;font-weight:800;font-size:16px;color:${ms?ms.fg:"#0f172a"};">${r.morningSys||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;font-weight:700;">${r.morningDia||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;color:#64748b;">${r.morningPulse||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;color:#1d4ed8;">${r.eveningTime||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;font-weight:800;font-size:16px;color:${es?es.fg:"#0f172a"};">${r.eveningSys||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;font-weight:700;">${r.eveningDia||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;color:#64748b;">${r.eveningPulse||"–"}</td>
          <td style="border:1px solid #cbd5e1;padding:7px 5px;text-align:center;background:${w?w.bg:"#fff"};color:${w?w.fg:"#000"};font-weight:700;font-size:12px;">${w?(lang==="EN"?w.labelEN:w.label):""}</td>
        </tr>`;
      }).join("");
      const th=(bg,txt)=>`<th style="border:1px solid #94a3b8;padding:7px 5px;background:${bg};color:white;text-align:center;">${txt}</th>`;
      return`<div style="font-family:'Sarabun',sans-serif;background:white;padding:20px 22px;width:780px;">
        <div style="border-bottom:3px solid #0284c7;padding-bottom:10px;margin-bottom:12px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#0369a1;">❤️ ${lang==="EN"?"Blood Pressure Report":"รายงานความดันโลหิต"}</div>
          ${activePatient.name?`<div style="font-size:15px;color:#475569;margin-top:4px;">👤 ${activePatient.name}${activePatient.phone?` · 📞 ${activePatient.phone}`:""}</div>`:""}
          <div style="font-size:12px;color:#94a3b8;margin-top:3px;">${toThai(todayISO(),lang)} · ${filteredRecords.length} ${lang==="EN"?"records":"รายการ"} · ${APP_VERSION}${chunks.length>1?" · "+lang==="EN"?"Image ":"ภาพ "+(pageNum)+"/"+chunks.length:""}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              ${th("#0284c7",t.date)}
              <th colspan="4" style="border:1px solid #94a3b8;padding:7px;background:#92400e;color:white;text-align:center;">${t.morning}</th>
              <th colspan="4" style="border:1px solid #94a3b8;padding:7px;background:#1d4ed8;color:white;text-align:center;">${t.evening.split(" /")[0]}</th>
              ${th("#0284c7",lang==="EN"?"Status":"สถานะ")}
            </tr>
            <tr>
              <th style="border:1px solid #94a3b8;padding:5px;background:#0284c7;"></th>
              ${["#b45309","#b45309","#b45309","#b45309","#2563eb","#2563eb","#2563eb","#2563eb"].map((bg,i)=>th(bg,[t.time,t.upper,t.lower,t.pulse,t.time,t.upper,t.lower,t.pulse][i])).join("")}
              <th style="border:1px solid #94a3b8;padding:5px;background:#0284c7;"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="text-align:right;font-size:11px;color:#94a3b8;margin-top:8px;">${APP_VERSION} · Normal &lt;120/80 mmHg · ${lang==="EN"?"Source: WHO/AHA":"อ้างอิง: WHO/AHA"}</div>
      </div>`;
    };

    const files=[];
    for(let ci=0;ci<chunks.length;ci++){
      const div=document.createElement("div");div.style.cssText="position:fixed;left:-9999px;top:0;";
      div.innerHTML=buildHTML(chunks[ci],ci+1);document.body.appendChild(div);
      try{
        const canvas=await window.html2canvas(div,{scale:2.2,useCORS:true,backgroundColor:"#ffffff",logging:false});
        const blob=await new Promise(res=>canvas.toBlob(res,"image/jpeg",0.93));
        const filename=`bp-${activePatient.name||"record"}_${todayISO()}${chunks.length>1?`_${ci+1}of${chunks.length}`:""}.jpg`;
        files.push({blob,filename});
      }catch(e){}
      document.body.removeChild(div);
      await new Promise(r=>setTimeout(r,150));
    }

    if(!files.length){setCapturing(false);toast$(lang==="EN"?"Error":"เกิดข้อผิดพลาด","err");return;}
    if(files.length===1&&navigator.canShare){
      try{const file=new File([files[0].blob],files[0].filename,{type:"image/jpeg"});if(navigator.canShare({files:[file]})){await navigator.share({files:[file]});toast$("✅ Shared");setCapturing(false);return;}}
      catch(e){if(e.name==="AbortError"){setCapturing(false);return;}}
    }
    for(const f of files){const a=document.createElement("a");a.href=URL.createObjectURL(f.blob);a.download=f.filename;a.click();await new Promise(r=>setTimeout(r,600));URL.revokeObjectURL(a.href);}
    toast$(files.length>1?`✅ ${files.length} ${lang==="EN"?"images saved":"ภาพ"}`:"✅ "+t.saveJPG,"ok",4000);
    setCapturing(false);
  };

  // ── PWA + Admin ───────────────────────────────
  const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const doInstall=async()=>{
    if(isInstalled){toast$("✅ "+t.addedToHome,"ok",3000);return;}
    if(deferredPrompt){deferredPrompt.prompt();const{outcome}=await deferredPrompt.userChoice;if(outcome==="accepted"){setIsInstalled(true);toast$("✅ "+t.addedToHome);}setDeferredPrompt(null);return;}
    if(isIOS){setShowIOSGuide(true);return;}
    toast$(lang==="EN"?"Tap ⋮ → Add to Home screen":"กด ⋮ → Add to Home screen","ok",6000);
  };
  const testNotify=async()=>{setTestNotifyLoading(true);await notifyAdmin(activePatient.name||"Admin Test",activePatient.phone||"000",true);setTestNotifyLoading(false);toast$(lang==="EN"?"Test sent":"ส่งทดสอบแล้ว","ok",5000);};
  const handleVerTap=()=>{const n=adminTap+1;if(n>=5){setShowAdmin(true);setAdminTap(0);}else{setAdminTap(n);setTimeout(()=>setAdminTap(0),3000);}};
  const doGenCode=async()=>{
    if(!genDeviceId.trim())return;setGenLoading(true);setGeneratedCode("");
    const res=await apiGenCode(genDeviceId.trim(),adminPass);setGenLoading(false);
    if(res?.ok)setGeneratedCode(res.code);else toast$(lang==="EN"?"Failed — check admin password":"ผิดพลาด — ตรวจรหัส admin","err");
  };

  const rec=getRec(filteredRecords);
  const mStatus=bpStatus(form.morningSys,form.morningDia);
  const eStatus=bpStatus(form.eveningSys,form.eveningDia);

  // ── STYLES ────────────────────────────────────
  const S={
    app:{fontFamily:"'Sarabun', sans-serif",background:"#f0f9ff",minHeight:"100vh",maxWidth:520,margin:"0 auto",paddingBottom:90},
    header:{background:"linear-gradient(135deg,#0284c7,#075985)",padding:`${Math.round(22*fs)}px 20px ${Math.round(18*fs)}px`,color:"white"},
    card:{background:"white",borderRadius:18,padding:Math.round(20*fs),margin:"0 14px 14px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"},
    grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:Math.round(14*fs)},
    btnMain:{width:"100%",padding:`${Math.round(17*fs)}px`,background:"linear-gradient(135deg,#0284c7,#075985)",color:"white",border:"none",borderRadius:14,fontSize:Math.round(19*fs),fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
    btnGhost:{flex:1,padding:`${Math.round(14*fs)}px`,borderRadius:12,border:"2px solid #0284c7",background:"white",color:"#0284c7",fontSize:Math.round(16*fs),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer",textAlign:"center"},
    tabBar:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"white",borderTop:"2px solid #e2e8f0",display:"flex",zIndex:100},
    tabItem:a=>({flex:1,padding:"10px 2px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:a?"#0284c7":"#94a3b8",fontFamily:"Sarabun,sans-serif",fontSize:Math.round(12*fs),fontWeight:a?800:500}),
    badge:st=>({display:"inline-block",padding:`${Math.round(4*fs)}px ${Math.round(10*fs)}px`,borderRadius:20,fontSize:Math.round(13*fs),fontWeight:800,background:st.bg,color:st.fg}),
    histCard:{background:"white",borderRadius:16,padding:Math.round(18*fs),margin:"0 14px 12px",boxShadow:"0 2px 6px rgba(0,0,0,0.07)",borderLeft:"5px solid"},
    secTitle:{fontSize:Math.round(19*fs),fontWeight:800,marginBottom:Math.round(15*fs),display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
  };

  if(!loaded||trialLoading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Sarabun,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{color:"#0284c7",marginBottom:10}}>{Ic.Heart(Math.round(52*fs))}</div>
        <div style={{color:"#64748b",fontSize:Math.round(20*fs)}}>{lang==="EN"?"Loading...":"กำลังโหลด..."}</div>
        {trialLoading&&<div style={{color:"#94a3b8",fontSize:Math.round(14*fs),marginTop:6}}>{"กำลังตรวจสอบสิทธิ์..."}</div>}
      </div>
    </div>
  );

  return(
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{opacity:.4;}`}</style>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"#ef4444":toast.type==="warn"?"#f59e0b":"#22c55e",color:"white",padding:`${Math.round(14*fs)}px ${Math.round(24*fs)}px`,borderRadius:30,fontSize:Math.round(16*fs),fontWeight:700,zIndex:9999,boxShadow:"0 4px 24px rgba(0,0,0,0.18)",maxWidth:"92vw",textAlign:"center",lineHeight:1.5}}>{toast.msg}</div>}

      {/* Paywall */}
      {showPaywall&&<Paywall adminCfg={adminCfg} patientName={activePatient.name} patientPhone={activePatient.phone} onUnlock={doUnlock} onBack={()=>setShowPaywall(false)} lang={lang} scale={fontScale}/>}

      {/* ══ Patient Picker ══ */}
      {showPatientPicker&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"Sarabun,sans-serif"}} onClick={()=>{setShowPatientPicker(false);setEditingPatient(null);}}>
          <div style={{background:"white",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:520,padding:22,paddingBottom:36,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:Math.round(20*fs),color:"#0284c7",display:"flex",alignItems:"center",gap:8}}>{Ic.Users(22)}{" "}{t.selectPatient}</div>
              <button onClick={()=>{setShowPatientPicker(false);setEditingPatient(null);}} style={{background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>{Ic.X(18)}</button>
            </div>
            {patients.map(p=>{
              const pRecs=records.filter(r=>r.patientId===p.id);const isActive=p.id===activePid;
              return(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:14,marginBottom:8,background:isActive?"#eff6ff":"#f8fafc",border:`2px solid ${isActive?"#0284c7":"transparent"}`,cursor:"pointer"}} onClick={()=>switchPatient(p.id)}>
                  <div style={{width:Math.round(42*fs),height:Math.round(42*fs),borderRadius:12,background:isActive?"#0284c7":"#e2e8f0",color:isActive?"white":"#64748b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:800,fontSize:Math.round(20*fs)}}>
                    {p.name?p.name[0].toUpperCase():"?"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:Math.round(17*fs),color:"#0f172a",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      {p.name||(lang==="EN"?"(No name)":"(ไม่มีชื่อ)")}
                      {isActive&&<span style={{background:"#0284c7",color:"white",borderRadius:6,padding:"2px 7px",fontSize:Math.round(11*fs)}}>Active</span>}
                    </div>
                    <div style={{fontSize:Math.round(13*fs),color:"#64748b"}}>{p.phone&&p.phone+" · "}{pRecs.length} {t.records}</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={e=>{e.stopPropagation();setEditingPatient(p);setPatientForm({name:p.name,phone:p.phone});}} style={{background:"#eff6ff",border:"none",borderRadius:8,cursor:"pointer",padding:`${Math.round(5*fs)}px ${Math.round(9*fs)}px`,color:"#0284c7"}}>{Ic.Edit(16)}</button>
                    {patients.length>1&&<button onClick={e=>{e.stopPropagation();deletePatient(p.id);}} style={{background:"#fef2f2",border:"none",borderRadius:8,cursor:"pointer",padding:`${Math.round(5*fs)}px ${Math.round(9*fs)}px`,color:"#ef4444"}}>{Ic.Trash(16)}</button>}
                  </div>
                </div>
              );
            })}
            {/* Edit form */}
            {editingPatient&&editingPatient!=="new"&&(
              <div style={{background:"#f0f9ff",borderRadius:14,padding:14,marginBottom:14,border:"2px solid #bae6fd"}}>
                <div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#0369a1",marginBottom:10}}>{t.editPatient}</div>
                <input value={patientForm.name} onChange={e=>setPatientForm(f=>({...f,name:e.target.value}))} placeholder={t.name}
                  style={{width:"100%",padding:12,borderRadius:10,border:"1.5px solid #bae6fd",fontSize:Math.round(17*fs),fontFamily:"Sarabun,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
                <input value={patientForm.phone} onChange={e=>setPatientForm(f=>({...f,phone:e.target.value}))} placeholder={t.phone} type="tel"
                  style={{width:"100%",padding:12,borderRadius:10,border:"1.5px solid #bae6fd",fontSize:Math.round(17*fs),fontFamily:"Sarabun,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setEditingPatient(null);setPatientForm({name:"",phone:""}); }} style={{...S.btnGhost,fontSize:Math.round(15*fs)}}>{t.cancel}</button>
                  <button onClick={updatePatient} style={{...S.btnMain,fontSize:Math.round(15*fs),flex:1}}>{Ic.Check(16)}{" "}{t.saveInfo}</button>
                </div>
              </div>
            )}
            {/* Add new */}
            {editingPatient==="new"?(
              <div style={{background:"#f0fdf4",borderRadius:14,padding:14,border:"2px solid #86efac"}}>
                <div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#166534",marginBottom:10}}>{t.addPatient}</div>
                <input value={patientForm.name} onChange={e=>setPatientForm(f=>({...f,name:e.target.value}))} placeholder={t.name} autoFocus
                  style={{width:"100%",padding:12,borderRadius:10,border:"1.5px solid #86efac",fontSize:Math.round(17*fs),fontFamily:"Sarabun,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:8}}/>
                <input value={patientForm.phone} onChange={e=>setPatientForm(f=>({...f,phone:e.target.value}))} placeholder={t.phone} type="tel"
                  style={{width:"100%",padding:12,borderRadius:10,border:"1.5px solid #86efac",fontSize:Math.round(17*fs),fontFamily:"Sarabun,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setEditingPatient(null);setPatientForm({name:"",phone:""}); }} style={{...S.btnGhost,fontSize:Math.round(15*fs)}}>{t.cancel}</button>
                  <button onClick={addPatient} style={{...S.btnMain,fontSize:Math.round(15*fs),flex:1,background:"linear-gradient(135deg,#059669,#047857)"}}>{Ic.Plus(16)}{" "}{t.addPatient}</button>
                </div>
              </div>
            ):(
              <button onClick={()=>{setEditingPatient("new");setPatientForm({name:"",phone:""});}}
                style={{...S.btnMain,background:"linear-gradient(135deg,#059669,#047857)",fontSize:Math.round(17*fs),marginTop:4}}>
                {Ic.Plus(20)}{" "}{t.addPatient}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upgrade */}
      {showUpgrade&&(
        <div style={{position:"fixed",inset:0,zIndex:800,overflowY:"auto",background:"#f0f9ff"}}>
          <div style={{fontFamily:"Sarabun,sans-serif",maxWidth:520,margin:"0 auto",paddingBottom:30}}>
            <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",padding:`${Math.round(24*fs)}px 20px ${Math.round(28*fs)}px`,color:"white",position:"relative"}}>
              <button onClick={()=>setShowUpgrade(false)} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,color:"white",fontSize:Math.round(14*fs),padding:"6px 12px",cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>← {t.cancel}</button>
              <div style={{textAlign:"center",paddingTop:8}}>
                <div style={{color:"white",marginBottom:6}}>{Ic.Gem(Math.round(44*fs))}</div>
                <div style={{fontSize:Math.round(24*fs),fontWeight:800,marginBottom:4}}>{t.fullVer}</div>
                {trialLeft>0&&<div style={{marginTop:12,background:"rgba(234,179,8,.2)",border:"1.5px solid rgba(234,179,8,.5)",borderRadius:12,padding:"8px 16px",display:"inline-block",fontSize:Math.round(14*fs)}}>
                  {Ic.Hourglass(16)}{" "}{t.trial}: <strong style={{color:"#fde68a",fontSize:Math.round(18*fs)}}>{trialLeft}</strong> {t.daysLeft}
                </div>}
              </div>
            </div>
            <div style={{margin:"16px 14px 0",background:"white",borderRadius:18,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",textAlign:"center"}}>
                <div style={{padding:"14px 8px",background:"#f8fafc",borderBottom:"2px solid #e2e8f0",borderRight:"1px solid #e2e8f0"}}/>
                <div style={{padding:"14px 8px",background:"#f8fafc",borderBottom:"2px solid #e2e8f0",borderRight:"1px solid #e2e8f0"}}>
                  <div style={{color:"#0284c7"}}>{Ic.Star(Math.round(20*fs))}</div>
                  <div style={{fontWeight:800,fontSize:Math.round(14*fs),marginTop:2}}>{lang==="EN"?"Free":"ฟรี"}</div>
                  <div style={{fontSize:Math.round(12*fs),color:"#64748b"}}>{TRIAL_DAYS} {lang==="EN"?"days":"วัน"}</div>
                </div>
                <div style={{padding:"14px 8px",background:"linear-gradient(135deg,#0284c7,#075985)",borderBottom:"2px solid #0369a1"}}>
                  <div style={{color:"white"}}>{Ic.Gem(Math.round(20*fs))}</div>
                  <div style={{fontWeight:800,fontSize:Math.round(14*fs),marginTop:2,color:"white"}}>{t.fullVer}</div>
                  <div style={{fontSize:Math.round(12*fs),color:"#bae6fd"}}>{adminCfg.price||(lang==="EN"?"One-time":"จ่ายครั้งเดียว")}</div>
                </div>
              </div>
              {[[lang==="EN"?"Record BP":"บันทึกความดัน","✅","✅"],[lang==="EN"?"Multiple patients":"หลายคนไข้","✅","✅"],[lang==="EN"?"View history":"ดูประวัติ","✅","✅"],[lang==="EN"?"BP Graph":"กราฟ BP","❌","✅"],[lang==="EN"?"Health Advice":"คำแนะนำสุขภาพ","❌","✅"],[lang==="EN"?"Multi-page JPG":"JPG หลายภาพ","❌","✅"],[lang==="EN"?"PDF A4":"PDF A4","❌","✅"],[lang==="EN"?"Cloud Backup":"Backup Cloud","❌","✅"],[lang==="EN"?"Unlimited days":"ไม่จำกัดวัน","❌","✅"]].map(([feat,free,full],i,arr)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",borderBottom:i<arr.length-1?"1px solid #f1f5f9":"none",background:i%2===0?"white":"#f8fafc"}}>
                  <div style={{padding:`${Math.round(10*fs)}px 14px`,fontSize:Math.round(14*fs),color:"#475569",borderRight:"1px solid #f1f5f9"}}>{feat}</div>
                  <div style={{padding:`${Math.round(10*fs)}px 0`,textAlign:"center",fontSize:Math.round(16*fs),borderRight:"1px solid #f1f5f9"}}>{free}</div>
                  <div style={{padding:`${Math.round(10*fs)}px 0`,textAlign:"center",fontSize:Math.round(16*fs)}}>{full}</div>
                </div>
              ))}
            </div>
            <div style={{margin:"16px 14px 0",background:"white",borderRadius:18,padding:Math.round(20*fs),boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
              {adminCfg.price&&<div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:Math.round(38*fs),fontWeight:800,color:"#0284c7"}}>{adminCfg.price}</div>
                <div style={{fontSize:Math.round(14*fs),color:"#22c55e",fontWeight:700}}>{Ic.Check(16)}{" "}{lang==="EN"?"One-time, lifetime use":"จ่ายครั้งเดียว ใช้ตลอดชีพ"}</div>
              </div>}
              {adminCfg.qrUrl&&adminCfg.qrUrl.startsWith("http")&&(
                <div style={{textAlign:"center",marginBottom:14}}>
                  <div style={{fontSize:Math.round(15*fs),fontWeight:800,color:"#0369a1",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ic.QR(20)}{" "}{lang==="EN"?"Scan QR to Pay":"สแกน QR โอนเงิน"}</div>
                  <img src={adminCfg.qrUrl} alt="QR" style={{width:Math.round(200*fs),height:Math.round(200*fs),display:"block",margin:"0 auto",borderRadius:12,border:"3px solid #0284c7"}} onError={e=>e.target.style.display="none"}/>
                </div>
              )}
              {(adminCfg.bankName||adminCfg.accountNo)&&<div style={{background:"#f0f9ff",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:Math.round(15*fs),lineHeight:2,border:"1px solid #bae6fd"}}>
                {adminCfg.bankName&&<div>🏦 <strong>{adminCfg.bankName}</strong></div>}
                {adminCfg.accountNo&&<div>📋 <strong>{adminCfg.accountNo}</strong></div>}
                {adminCfg.accountName&&<div>👤 <strong>{adminCfg.accountName}</strong></div>}
              </div>}
              {adminCfg.phone&&<div style={{textAlign:"center",marginBottom:14,fontSize:Math.round(15*fs),fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ic.Phone(16)}{" "}<a href={`tel:${adminCfg.phone}`} style={{color:"#0284c7"}}>{adminCfg.phone}</a></div>}
              <button onClick={()=>{setShowUpgrade(false);setShowPaywall(true);}} style={{...S.btnMain}}>
                {Ic.Unlock(Math.round(20*fs))}{" "}{t.unlockFull}
              </button>
              <div style={{textAlign:"center",marginTop:10,fontSize:Math.round(13*fs),color:"#94a3b8"}}>Line: <strong>{ADMIN_LINE}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:22,padding:28,width:"100%",maxWidth:340,textAlign:"center"}}>
            <div style={{color:"#ef4444",marginBottom:10}}>{Ic.Trash(Math.round(40*fs))}</div>
            <div style={{fontWeight:800,fontSize:Math.round(20*fs),marginBottom:6}}>{t.deleteConfirm}</div>
            <div style={{color:"#64748b",fontSize:Math.round(17*fs),marginBottom:22}}>{toThai(deleteConfirm.date,lang)}</div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:Math.round(15*fs),borderRadius:12,border:"2px solid #e2e8f0",background:"white",fontSize:Math.round(17*fs),fontFamily:"Sarabun,sans-serif",cursor:"pointer",fontWeight:600}}>{t.cancel}</button>
              <button onClick={()=>delRecord(deleteConfirm.id)} style={{flex:1,padding:Math.round(15*fs),borderRadius:12,border:"none",background:"#ef4444",color:"white",fontSize:Math.round(17*fs),fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress */}
      {syncing&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:22,padding:28,width:"100%",maxWidth:320,textAlign:"center"}}>
            <div style={{color:"#0284c7",marginBottom:10}}>{Ic.Cloud(Math.round(40*fs))}</div>
            <div style={{fontWeight:800,fontSize:Math.round(19*fs),marginBottom:8}}>{lang==="EN"?"Uploading...":"กำลังอัปโหลด"}</div>
            <div style={{color:"#64748b",fontSize:Math.round(15*fs),marginBottom:14}}>{syncProg?.current} / {syncProg?.total}</div>
            <div style={{background:"#e2e8f0",borderRadius:10,height:14,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#0284c7,#0ea5e9)",height:"100%",borderRadius:10,width:`${syncProg?Math.round(syncProg.current/syncProg.total*100):0}%`,transition:"width 0.3s"}}/>
            </div>
          </div>
        </div>
      )}

      {/* Guide */}
      {showGuide&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
          <div style={{background:"white",borderRadius:22,padding:22,width:"100%",maxWidth:400,margin:"auto"}}>
            <div style={{textAlign:"center",marginBottom:14}}><div style={{color:"#0284c7"}}>{Ic.Book(Math.round(36*fs))}</div><div style={{fontWeight:800,fontSize:Math.round(22*fs),color:"#0284c7"}}>{lang==="EN"?"User Guide":"คู่มือการใช้งาน"}</div></div>
            {[{icon:Ic.Users,t:"Multi-patient",d:lang==="EN"?"Tap patient name in header → switch or add":"กดชื่อคนไข้ที่ header → สลับหรือเพิ่ม"},{icon:Ic.Plus,t:"Record BP / บันทึก",d:lang==="EN"?"Select date → Enter values → Save":"เลือกวันที่ → กรอกค่า → บันทึก"},{icon:Ic.Camera,t:"Report / รายงาน",d:lang==="EN"?"Multi-page JPG or A4 PDF":"JPG หลายภาพ หรือ PDF A4"},{icon:Ic.Heart,t:"BP Levels",d:"Normal <120/80 · Elevated 120-129 · High St.1 130-139 · High St.2 ≥140"}].map((item,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:12,padding:"12px 14px",background:"#f8fafc",borderRadius:12}}>
                <div style={{color:"#0284c7",flexShrink:0}}>{item.icon(Math.round(26*fs))}</div>
                <div><div style={{fontWeight:800,fontSize:Math.round(16*fs),marginBottom:2}}>{item.t}</div><div style={{fontSize:Math.round(13*fs),color:"#64748b",lineHeight:1.6}}>{item.d}</div></div>
              </div>
            ))}
            <button onClick={()=>setShowGuide(false)} style={{...S.btnMain,marginTop:4}}>OK ✓</button>
          </div>
        </div>
      )}

      {/* iOS Guide */}
      {showIOSGuide&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"Sarabun,sans-serif"}}>
          <div style={{background:"white",borderRadius:"22px 22px 0 0",padding:28,width:"100%",maxWidth:520,paddingBottom:40}}>
            <div style={{textAlign:"center",marginBottom:18}}><div style={{color:"#0284c7"}}>{Ic.Mobile(Math.round(40*fs))}</div><div style={{fontWeight:800,fontSize:Math.round(21*fs),marginTop:6}}>{lang==="EN"?"Add to iPhone Home Screen":"เพิ่มแอปลงหน้าจอ iPhone"}</div></div>
            {[["1",lang==="EN"?"Tap Share ↗":"กดปุ่ม Share ↗",lang==="EN"?"Bottom center of Safari":"แถบล่าง Safari"],["2",'"Add to Home Screen"',lang==="EN"?"Scroll and find it":"เลื่อนหาแล้วกด"],["3",lang==="EN"?'Tap "Add"':'กด "Add"',lang==="EN"?"App icon appears":"แอปปรากฏทันที"]].map(([n,title,sub],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<2?"1px solid #f1f5f9":"none"}}>
                <div style={{width:Math.round(40*fs),height:Math.round(40*fs),borderRadius:12,background:"#0284c7",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(20*fs),flexShrink:0,fontWeight:800}}>{n}</div>
                <div><div style={{fontWeight:800,fontSize:Math.round(16*fs),marginBottom:2}}>{title}</div><div style={{fontSize:Math.round(14*fs),color:"#64748b"}}>{sub}</div></div>
              </div>
            ))}
            <button onClick={()=>setShowIOSGuide(false)} style={{...S.btnMain,marginTop:18}}>{lang==="EN"?"Got it":"เข้าใจแล้ว"} ✓</button>
          </div>
        </div>
      )}

      {/* Admin */}
      {showAdmin&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
          <div style={{background:"white",borderRadius:22,padding:22,width:"100%",maxWidth:440,margin:"auto"}}>
            <div style={{fontWeight:800,fontSize:Math.round(22*fs),marginBottom:14,color:"#0284c7",display:"flex",alignItems:"center",gap:8}}>{Ic.Shield(22)}{" "}Admin Panel</div>
            {!adminAuth?(
              <div>
                <Input label="Admin Password" type="password" value={adminPass} onChange={setAdminPass} placeholder="admin password" scale={fs}/>
                <div style={{marginTop:12,display:"flex",gap:10}}>
                  <button onClick={()=>{setShowAdmin(false);setAdminPass("");}} style={S.btnGhost}>{t.cancel}</button>
                  <button onClick={async()=>{setAdminLoading(true);const v=await verifyCode("admin",adminPass);setAdminLoading(false);if(v)setAdminAuth(true);else toast$("❌ Wrong password","err");}} style={{...S.btnMain,flex:1}} disabled={adminLoading}>
                    {adminLoading?"⏳...":lang==="EN"?"Login":"เข้าสู่ระบบ"}
                  </button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{background:"#f0fdf4",borderRadius:12,padding:12,fontSize:Math.round(14*fs),color:"#166534",lineHeight:1.7}}>
                  {records.length} records · {patients.length} patients · {ADMIN_EMAIL}
                </div>
                {/* Generate unlock code */}
                <div style={{background:"#f0f9ff",borderRadius:14,padding:14,border:"2px solid #bae6fd"}}>
                  <div style={{fontWeight:800,fontSize:Math.round(16*fs),color:"#0369a1",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>{Ic.Key(18)}{" "}{t.genCode}</div>
                  <div style={{fontSize:Math.round(13*fs),color:"#64748b",marginBottom:8}}>{t.inputDeviceId}</div>
                  <input value={genDeviceId} onChange={e=>setGenDeviceId(e.target.value)} placeholder="dev-xxxxxxxxxxxxxxxx"
                    style={{width:"100%",padding:12,borderRadius:10,border:"1.5px solid #bae6fd",fontSize:Math.round(14*fs),fontFamily:"monospace",boxSizing:"border-box",marginBottom:10,outline:"none"}}/>
                  <button onClick={doGenCode} disabled={genLoading||!genDeviceId.trim()} style={{...S.btnMain,background:"linear-gradient(135deg,#0369a1,#0284c7)",fontSize:Math.round(16*fs)}}>
                    {genLoading?"⏳...":`🔑 ${t.genCode}`}
                  </button>
                  {generatedCode&&(
                    <div style={{marginTop:12,background:"#dcfce7",borderRadius:12,padding:16,textAlign:"center"}}>
                      <div style={{fontSize:Math.round(13*fs),color:"#166534",marginBottom:6}}>{t.generatedCode}</div>
                      <div style={{fontSize:Math.round(32*fs),fontWeight:800,color:"#166534",letterSpacing:8,fontFamily:"monospace"}}>{generatedCode}</div>
                      <button onClick={()=>{try{navigator.clipboard.writeText(generatedCode);}catch{}toast$(t.copied);}}
                        style={{marginTop:10,...S.btnGhost,border:"2px solid #166534",color:"#166534",width:"auto",padding:"10px 20px",fontSize:Math.round(14*fs)}}>
                        {t.copyCode}
                      </button>
                    </div>
                  )}
                </div>
                {/* Test notify */}
                <div style={{background:"#eff6ff",borderRadius:12,padding:14}}>
                  <div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#1d4ed8",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Bell(16)}{" "}{lang==="EN"?"Test Notify":"ทดสอบการแจ้งเตือน"}</div>
                  <button onClick={testNotify} disabled={testNotifyLoading} style={{width:"100%",padding:13,background:testNotifyLoading?"#94a3b8":"linear-gradient(135deg,#1d4ed8,#1e40af)",color:"white",border:"none",borderRadius:10,fontSize:Math.round(15*fs),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
                    {testNotifyLoading?"⏳...":`📧 ${lang==="EN"?"Send Test":"ทดสอบส่ง"}`}
                  </button>
                </div>
                {/* Config */}
                <Input label={lang==="EN"?"Price":"ราคา"} value={adminCfg.price||""} onChange={v=>setAdminCfg(c=>({...c,price:v}))} placeholder="299 บาท" scale={fs}/>
                <Input label={lang==="EN"?"Contact Phone":"เบอร์ติดต่อ"} value={adminCfg.phone||""} onChange={v=>setAdminCfg(c=>({...c,phone:v}))} placeholder="089-xxx-xxxx" scale={fs}/>
                <Input label={lang==="EN"?"Bank":"ธนาคาร"} value={adminCfg.bankName||""} onChange={v=>setAdminCfg(c=>({...c,bankName:v}))} placeholder="กสิกรไทย" scale={fs}/>
                <Input label={lang==="EN"?"Account No.":"เลขบัญชี"} value={adminCfg.accountNo||""} onChange={v=>setAdminCfg(c=>({...c,accountNo:v}))} placeholder="xxx-x-xxxxx-x" scale={fs}/>
                <Input label={lang==="EN"?"Account Name":"ชื่อบัญชี"} value={adminCfg.accountName||""} onChange={v=>setAdminCfg(c=>({...c,accountName:v}))} placeholder="ชื่อ นามสกุล" scale={fs}/>
                <Input label="QR Code URL" value={adminCfg.qrUrl||""} onChange={v=>setAdminCfg(c=>({...c,qrUrl:v}))} placeholder="https://..." scale={fs}/>
                <div style={{background:"#fffbeb",borderRadius:12,padding:12,fontSize:Math.round(12*fs),color:"#713f12",lineHeight:1.7}}>
                  Vercel ENV: ADMIN_PASS, TRIAL_SECRET<br/>
                  Unlock = HMAC(deviceId, TRIAL_SECRET).slice(0,8).toUpperCase()
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setShowAdmin(false);setAdminAuth(false);setAdminPass("");setGeneratedCode("");}} style={S.btnGhost}>{t.close}</button>
                  <button onClick={()=>{lsSet(KEY_ADMIN,adminCfg);toast$(lang==="EN"?"Saved":"บันทึกแล้ว");setShowAdmin(false);setAdminAuth(false);setAdminPass("");setGeneratedCode("");}} style={{...S.btnMain,flex:1,fontSize:Math.round(17*fs)}}>
                    {Ic.Download(18)}{" "}{t.saveInfo}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={S.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:Math.round(11*fs),opacity:.75,letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>{t.appSub}</div>
            <div style={{fontSize:Math.round(24*fs),fontWeight:800}}>{t.appName}</div>
            {/* Patient switcher button */}
            <button onClick={()=>{setShowPatientPicker(true);setEditingPatient(null);}}
              style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.22)",border:"none",borderRadius:10,padding:"7px 12px",marginTop:7,cursor:"pointer",color:"white",fontFamily:"Sarabun,sans-serif",fontSize:Math.round(15*fs),fontWeight:700}}>
              {Ic.Users(Math.round(16*fs))}
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{activePatient.name||t.selectPatient}</span>
              {Ic.ChevDown(Math.round(15*fs))}
            </button>
            {!isUnlocked&&<div style={{fontSize:Math.round(12*fs),background:"rgba(255,255,255,.15)",borderRadius:8,padding:"3px 10px",marginTop:5,display:"inline-flex",alignItems:"center",gap:4}}>{Ic.Hourglass(12)}{" "}{t.trial}: {trialLeft} {t.daysLeft}</div>}
            {isUnlocked&&<div style={{fontSize:Math.round(12*fs),background:"rgba(255,255,255,.15)",borderRadius:8,padding:"3px 10px",marginTop:5,display:"inline-flex",alignItems:"center",gap:4}}>{Ic.Gem(12)}{" "}{t.fullVer}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0,marginLeft:10}}>
            <div style={{background:"rgba(255,255,255,.2)",borderRadius:14,padding:`${Math.round(7*fs)}px ${Math.round(14*fs)}px`,textAlign:"center"}}>
              <div style={{fontSize:Math.round(26*fs),fontWeight:800,lineHeight:1}}>{filteredRecords.length}</div>
              <div style={{fontSize:Math.round(11*fs),opacity:.85}}>{lang==="EN"?"records":"รายการ"}</div>
            </div>
            <button onClick={handleVerTap} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,color:"white",fontSize:Math.round(11*fs),padding:"4px 10px",cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>{APP_VERSION}</button>
          </div>
        </div>
      </div>

      {/* Floating Install */}
      {!isInstalled&&(deferredPrompt||isIOS)&&tab!=="home"&&(
        <div style={{position:"fixed",bottom:82,right:16,zIndex:90}}>
          <button onClick={doInstall} style={{background:"linear-gradient(135deg,#0284c7,#075985)",color:"white",border:"none",borderRadius:30,padding:"12px 18px",fontSize:Math.round(13*fs),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer",boxShadow:"0 4px 16px rgba(2,132,199,0.5)",display:"flex",alignItems:"center",gap:6}}>
            {Ic.Mobile(16)}{" "}{lang==="EN"?"Install":"เพิ่มแอป"}
          </button>
        </div>
      )}

      {/* ═══ HOME ═══ */}
      {tab==="home"&&(
        <div style={{paddingTop:18}}>
          <div style={{padding:"0 14px",marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:Math.round(18*fs),marginBottom:14,color:"#0369a1"}}>🚀 {lang==="EN"?"Get Started":"เริ่มต้นใช้งาน"}</div>
            {[{title:isInstalled?t.addedToHome:t.addToHome,desc:isInstalled?(lang==="EN"?"Ready":"พร้อมใช้แล้ว"):(lang==="EN"?"Add shortcut":"เพิ่มทางลัด"),color:isInstalled?"#22c55e":"#0284c7",bg:isInstalled?"#f0fdf4":"#eff6ff",action:doInstall,icon:isInstalled?Ic.Check:Ic.Mobile},{title:t.readGuide,desc:lang==="EN"?"How to use":"วิธีใช้งาน",color:"#059669",bg:"#f0fdf4",action:()=>setShowGuide(true),icon:Ic.Book},{title:t.backupData,desc:lang==="EN"?"Save to cloud":"บันทึก Cloud",color:"#7c3aed",bg:"#faf5ff",action:()=>setTab("settings"),icon:Ic.Cloud}].map((step,si)=>(
              <button key={si} onClick={step.action} style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:step.bg,borderRadius:16,padding:`${Math.round(15*fs)}px ${Math.round(18*fs)}px`,marginBottom:12,border:`2px solid ${step.color}20`,cursor:"pointer",textAlign:"left",fontFamily:"Sarabun,sans-serif"}}>
                <div style={{width:Math.round(44*fs),height:Math.round(44*fs),borderRadius:12,background:step.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{step.icon(Math.round(22*fs))}</div>
                <div style={{flex:1}}><div style={{fontSize:Math.round(16*fs),fontWeight:800,color:"#0f172a",marginBottom:2}}>{step.title}</div><div style={{fontSize:Math.round(13*fs),color:"#64748b"}}>{step.desc}</div></div>
                <div style={{fontSize:Math.round(22*fs),color:step.color}}>›</div>
              </button>
            ))}
          </div>
          {!isUnlocked&&(
            <div style={{margin:"0 14px 14px"}}>
              <button onClick={()=>setShowUpgrade(true)} style={{width:"100%",background:"linear-gradient(135deg,#0f172a,#1e3a5f)",border:"none",borderRadius:16,padding:`${Math.round(15*fs)}px ${Math.round(20*fs)}px`,cursor:"pointer",fontFamily:"Sarabun,sans-serif",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
                <div style={{color:"white"}}>{Ic.Gem(Math.round(32*fs))}</div>
                <div style={{flex:1}}><div style={{color:"white",fontWeight:800,fontSize:Math.round(15*fs),marginBottom:2}}>{t.upgrade}</div><div style={{color:"#93c5fd",fontSize:Math.round(12*fs)}}>{lang==="EN"?"Multi-patient · Graph · JPG · PDF":"หลายคนไข้ · กราฟ · JPG · PDF"}{adminCfg.price?` · ${adminCfg.price}`:""}</div></div>
                <div style={{color:"#60a5fa",fontSize:Math.round(22*fs)}}>›</div>
              </button>
            </div>
          )}
          {filteredRecords.length>0&&(()=>{
            const last=filteredRecords[filteredRecords.length-1];
            const ms=bpStatus(last.morningSys,last.morningDia),es=bpStatus(last.eveningSys,last.eveningDia);
            const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
            return(
              <div style={{...S.card,borderLeft:`5px solid ${w?w.bar:"#22c55e"}`}}>
                <div style={{fontWeight:800,fontSize:Math.round(16*fs),marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Heart(Math.round(16*fs))}{" "}{t.latest} — {toThai(last.date,lang)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {last.morningSys&&<div style={{background:"#fefce8",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:Math.round(12*fs),color:"#92400e",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{Ic.Sun(12)}{" "}{t.morning}</div><div style={{fontSize:Math.round(26*fs),fontWeight:800}}>{last.morningSys}<span style={{fontSize:Math.round(15*fs)}}>/{last.morningDia}</span></div></div>}
                  {last.eveningSys&&<div style={{background:"#eff6ff",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:Math.round(12*fs),color:"#1d4ed8",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{Ic.Moon(12)}{" "}{t.evening.split(" /")[0]}</div><div style={{fontSize:Math.round(26*fs),fontWeight:800}}>{last.eveningSys}<span style={{fontSize:Math.round(15*fs)}}>/{last.eveningDia}</span></div></div>}
                </div>
                {w&&<div style={{marginTop:8}}><span style={S.badge(w)}>{bpLevelLabel(w)}</span></div>}
              </div>
            );
          })()}
          <div style={{padding:"0 14px 16px"}}>
            <button onClick={()=>setTab("record")} style={{...S.btnMain,fontSize:Math.round(21*fs),padding:Math.round(19*fs)}}>
              {Ic.Plus(Math.round(22*fs))}{" "}{lang==="EN"?"Record Today's BP":"บันทึกความดันวันนี้"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ RECORD ═══ */}
      {tab==="record"&&(
        <div style={{paddingTop:16}}>
          {editRecord&&(
            <div style={{margin:"0 14px 10px",background:"#fef9c3",borderRadius:12,padding:"10px 14px",fontSize:Math.round(14*fs),color:"#92400e",fontWeight:700,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>{Ic.Edit(16)}{" "}{lang==="EN"?"Editing":"แก้ไข"}: {toThai(editRecord.date,lang)}</span>
              <button onClick={()=>{setEditRecord(null);setForm(emptyForm);}} style={{background:"none",border:"none",cursor:"pointer",color:"#9a3412",fontSize:20}}>✕</button>
            </div>
          )}
          <div style={S.card}>
            <Input label={t.date} type="date" value={form.date} onChange={setF("date")} scale={fs}/>
            {(()=>{const ex=filteredRecords.find(r=>r.date===form.date);if(!ex)return<div style={{marginTop:10,fontSize:Math.round(14*fs),color:"#94a3b8",background:"#f8fafc",borderRadius:10,padding:"8px 12px"}}>{t.newDay}</div>;return<div style={{marginTop:10,fontSize:Math.round(14*fs),background:"#fefce8",borderRadius:10,padding:"10px 12px",border:"1.5px solid #fde68a"}}><div style={{fontWeight:700,color:"#92400e",marginBottom:3}}>{Ic.Edit(14)}{" "}{t.existingData}</div><div style={{color:"#78350f"}}>{ex.morningSys?ex.morningSys+"/"+ex.morningDia:"–"} · {ex.eveningSys?ex.eveningSys+"/"+ex.eveningDia:"–"}</div></div>;})()}
          </div>
          <div style={{...S.card,borderTop:"4px solid #f59e0b"}}>
            <div style={{...S.secTitle,color:"#b45309"}}><span style={{color:"#f59e0b"}}>{Ic.Sun(Math.round(24*fs))}</span>{t.morning}{mStatus&&<span style={S.badge(mStatus)}>{bpLevelLabel(mStatus)}</span>}</div>
            <div style={{marginBottom:Math.round(13*fs)}}><Input label={t.time} type="time" value={form.morningTime} onChange={setF("morningTime")} scale={fs}/></div>
            <div style={S.grid2}><Input label={t.upper} type="number" value={form.morningSys} onChange={setF("morningSys")} placeholder="120" unit="mmHg" scale={fs}/><Input label={t.lower} type="number" value={form.morningDia} onChange={setF("morningDia")} placeholder="80" unit="mmHg" scale={fs}/></div>
            <div style={{marginTop:Math.round(13*fs)}}><Input label={t.pulse} type="number" value={form.morningPulse} onChange={setF("morningPulse")} placeholder="75" unit="bpm" scale={fs}/></div>
          </div>
          <div style={{...S.card,borderTop:"4px solid #0284c7"}}>
            <div style={{...S.secTitle,color:"#0369a1"}}><span style={{color:"#0284c7"}}>{Ic.Moon(Math.round(24*fs))}</span>{t.evening}{eStatus&&<span style={S.badge(eStatus)}>{bpLevelLabel(eStatus)}</span>}</div>
            <div style={{marginBottom:Math.round(13*fs)}}><Input label={t.time} type="time" value={form.eveningTime} onChange={setF("eveningTime")} scale={fs}/></div>
            <div style={S.grid2}><Input label={t.upper} type="number" value={form.eveningSys} onChange={setF("eveningSys")} placeholder="120" unit="mmHg" scale={fs}/><Input label={t.lower} type="number" value={form.eveningDia} onChange={setF("eveningDia")} placeholder="80" unit="mmHg" scale={fs}/></div>
            <div style={{marginTop:Math.round(13*fs)}}><Input label={t.pulse} type="number" value={form.eveningPulse} onChange={setF("eveningPulse")} placeholder="75" unit="bpm" scale={fs}/></div>
          </div>
          <div style={{padding:`0 14px ${Math.round(16*fs)}px`}}><button onClick={submit} disabled={saving} style={S.btnMain}>{saving?t.saving:t.save}</button></div>
          <div style={S.card}>
            <div style={{fontWeight:800,marginBottom:12,fontSize:Math.round(17*fs)}}>{lang==="EN"?"BP Level Guide":"เกณฑ์ระดับความดัน"}</div>
            {[{labelTH:"ปกติ",labelEN:"Normal",range:"< 120/80",bg:"#dcfce7",fg:"#166534"},{labelTH:"สูงเล็กน้อย",labelEN:"Elevated",range:"120–129/< 80",bg:"#fef9c3",fg:"#854d0e"},{labelTH:"สูงระดับ 1",labelEN:"High Stage 1",range:"130–139/80–89",bg:"#ffedd5",fg:"#9a3412"},{labelTH:"สูงระดับ 2",labelEN:"High Stage 2",range:"≥ 140/≥ 90",bg:"#fee2e2",fg:"#991b1b"}].map(s=>(
              <div key={s.labelTH} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{...S.badge(s),minWidth:Math.round(110*fs),textAlign:"center"}}>{lang==="EN"?s.labelEN:s.labelTH}</span>
                <span style={{color:"#475569",fontSize:Math.round(15*fs)}}>{s.range} mmHg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ HISTORY ═══ */}
      {tab==="history"&&(
        <div style={{paddingTop:16}}>
          <div style={{padding:`0 14px ${Math.round(12*fs)}px`,display:"flex",gap:10}}>
            <button style={S.btnGhost} onClick={()=>setTab("report")}>{Ic.Camera(Math.round(18*fs))}{" "}{lang==="EN"?"Report":"รายงาน"}</button>
            {isPremium?<button style={S.btnGhost} onClick={doPrint}>{Ic.Print(Math.round(18*fs))}{" "}A4</button>:<button style={{...S.btnGhost,opacity:.5,borderColor:"#94a3b8",color:"#94a3b8"}} onClick={()=>setShowUpgrade(true)}>{Ic.Lock(16)}{" "}A4</button>}
          </div>
          {filteredRecords.length>=2&&(isPremium?<div style={S.card}><div style={{fontWeight:800,fontSize:Math.round(17*fs),marginBottom:12,display:"flex",alignItems:"center",gap:6}}>{Ic.Chart(18)}{" "}{t.graph}</div><BPGraph records={filteredRecords} lang={lang}/></div>:<div style={{...S.card,opacity:.8}}><div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#94a3b8",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>{Ic.Lock(16)}{" "}{t.graph}</div><button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,fontSize:Math.round(14*fs),padding:12,background:"linear-gradient(135deg,#0f172a,#1e3a5f)"}}>{Ic.Gem(16)}{" "}{t.upgrade}</button></div>)}
          {rec&&isPremium&&(
            <div style={{...S.card,borderLeft:`5px solid ${rec.status?.bar||"#22c55e"}`}}>
              <div style={{fontWeight:800,fontSize:Math.round(17*fs),marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Heart(18)}{" "}{t.advice}</div>
              <div style={{fontSize:Math.round(14*fs),color:"#475569",marginBottom:8}}>{lang==="EN"?"7-day avg:":"ค่าเฉลี่ย 7 วัน:"} <strong style={{color:rec.status?.fg}}>{rec.avgS}/{rec.avgD} mmHg</strong>{rec.status&&<span style={{...S.badge(rec.status),marginLeft:8,fontSize:Math.round(12*fs)}}>{bpLevelLabel(rec.status)}</span>}</div>
              {rec.tips[lang].map((tip,i)=><div key={i} style={{fontSize:Math.round(14*fs),color:"#334155",padding:"6px 0",borderBottom:i<rec.tips[lang].length-1?"1px solid #f1f5f9":""}}>{tip}</div>)}
              <div style={{fontSize:Math.round(12*fs),color:"#94a3b8",marginTop:8}}>{t.ref}</div>
            </div>
          )}
          {filteredRecords.length===0?(
            <div style={{textAlign:"center",padding:"70px 20px",color:"#94a3b8"}}>
              <div style={{color:"#cbd5e1",marginBottom:14}}>{Ic.List(60)}</div>
              <div style={{fontWeight:800,fontSize:Math.round(21*fs)}}>{t.noData}</div>
              <div style={{fontSize:Math.round(17*fs),marginTop:6}}>{t.startRecord}</div>
            </div>
          ):(
            [...filteredRecords].reverse().map(r=>{
              const ms=bpStatus(r.morningSys,r.morningDia),es=bpStatus(r.eveningSys,r.eveningDia);
              const worst=rank(ms)>=rank(es)?(ms||es):(es||ms);
              return(
                <div key={r.id} style={{...S.histCard,borderLeftColor:worst?worst.bar:"#e2e8f0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div><div style={{fontWeight:800,fontSize:Math.round(19*fs)}}>{toThai(r.date,lang)}</div>{worst&&<span style={{...S.badge(worst),marginTop:5,display:"inline-block"}}>{bpLevelLabel(worst)}</span>}</div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(r)} style={{background:"#eff6ff",border:"none",borderRadius:8,cursor:"pointer",padding:`${Math.round(4*fs)}px ${Math.round(10*fs)}px`,color:"#0284c7"}}>{Ic.Edit(Math.round(18*fs))}</button>
                      <button onClick={()=>setDeleteConfirm(r)} style={{background:"none",border:"none",cursor:"pointer",color:"#cbd5e1",padding:4}}>{Ic.X(Math.round(22*fs))}</button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {r.morningSys?<div style={{background:"#fefce8",borderRadius:12,padding:"12px 14px"}}><div style={{fontSize:Math.round(12*fs),color:"#92400e",fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>{Ic.Sun(12)}{" "}{t.morning} {r.morningTime&&`· ${r.morningTime}`}</div><div style={{fontSize:Math.round(28*fs),fontWeight:800,lineHeight:1.1}}>{r.morningSys}<span style={{fontSize:Math.round(17*fs)}}>/{r.morningDia}</span></div><div style={{fontSize:Math.round(13*fs),color:"#64748b",marginTop:3}}>{r.morningPulse} bpm</div></div>:<div style={{background:"#f8fafc",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"center"}}><button onClick={()=>openEdit(r)} style={{background:"none",border:"2px dashed #cbd5e1",borderRadius:10,padding:"8px 14px",color:"#94a3b8",fontSize:Math.round(13*fs),cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>{t.editMorning}</button></div>}
                    {r.eveningSys?<div style={{background:"#eff6ff",borderRadius:12,padding:"12px 14px"}}><div style={{fontSize:Math.round(12*fs),color:"#1d4ed8",fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>{Ic.Moon(12)}{" "}{t.evening.split(" /")[0]} {r.eveningTime&&`· ${r.eveningTime}`}</div><div style={{fontSize:Math.round(28*fs),fontWeight:800,lineHeight:1.1}}>{r.eveningSys}<span style={{fontSize:Math.round(17*fs)}}>/{r.eveningDia}</span></div><div style={{fontSize:Math.round(13*fs),color:"#64748b",marginTop:3}}>{r.eveningPulse} bpm</div></div>:<div style={{background:"#f8fafc",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"center"}}><button onClick={()=>openEdit(r)} style={{background:"none",border:"2px dashed #cbd5e1",borderRadius:10,padding:"8px 14px",color:"#94a3b8",fontSize:Math.round(13*fs),cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>{t.editEvening}</button></div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ REPORT ═══ */}
      {tab==="report"&&(
        <div style={{paddingTop:16}}>
          <div style={{padding:`0 14px ${Math.round(12*fs)}px`}}>
            {isPremium?<>
              <button onClick={saveJPG} disabled={capturing} style={{...S.btnMain,background:capturing?"#94a3b8":"linear-gradient(135deg,#0f766e,#0d9488)",marginBottom:6}}>
                {Ic.Camera(Math.round(20*fs))}{" "}{capturing?(lang==="EN"?"Creating...":"กำลังสร้าง..."):t.saveJPG}
              </button>
              {filteredRecords.length>0&&<div style={{fontSize:Math.round(13*fs),color:"#059669",textAlign:"center",marginBottom:10,fontWeight:600}}>
                📄 {Math.ceil(filteredRecords.length/ROWS_PER_JPG)} {lang==="EN"?"image(s)":"ภาพ"} · {Math.ceil(filteredRecords.length/ROWS_PER_A4)} {lang==="EN"?"A4 page(s)":"หน้า A4"}
              </div>}
              <button onClick={doPrint} style={{...S.btnGhost,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {Ic.Print(Math.round(18*fs))}{" "}{t.printA4}
              </button>
            </>:<div style={{background:"#f8fafc",borderRadius:14,padding:20,textAlign:"center",border:"2px dashed #e2e8f0"}}>
              <div style={{color:"#94a3b8",marginBottom:8}}>{Ic.Lock(Math.round(32*fs))}</div>
              <div style={{fontWeight:800,fontSize:Math.round(16*fs),color:"#0f172a",marginBottom:6}}>{lang==="EN"?"JPG / PDF requires Full Version":"บันทึก JPG / PDF เป็น Full Version"}</div>
              <button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,fontSize:Math.round(16*fs)}}>{Ic.Gem(18)}{" "}{t.upgrade}</button>
            </div>}
          </div>
          <div ref={reportRef} style={{margin:"0 14px 14px",background:"white",borderRadius:18,padding:Math.round(18*fs),boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
            <div style={{borderBottom:"3px solid #0284c7",paddingBottom:12,marginBottom:12,textAlign:"center"}}>
              <div style={{fontSize:Math.round(19*fs),fontWeight:800,color:"#0369a1",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ic.Heart(20)}{" "}{lang==="EN"?"BP Report":"รายงานความดัน"}</div>
              {activePatient.name&&<div style={{fontSize:Math.round(15*fs),color:"#475569",marginTop:4}}>{activePatient.name}{activePatient.phone?` · ${activePatient.phone}`:""}</div>}
              <div style={{fontSize:Math.round(13*fs),color:"#94a3b8",marginTop:2}}>{toThai(todayISO(),lang)} · {filteredRecords.length} {lang==="EN"?"records":"รายการ"} · {APP_VERSION}</div>
            </div>
            {filteredRecords.length===0?<div style={{textAlign:"center",padding:"30px 0",color:"#94a3b8",fontSize:Math.round(17*fs)}}>{t.noData}</div>:(
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    <th style={{border:"1.5px solid #e2e8f0",padding:"7px 8px",background:"#f0f9ff",fontSize:Math.round(12*fs),textAlign:"left"}}>{t.date}</th>
                    <th colSpan={3} style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",background:"#fefce8",fontSize:Math.round(12*fs),textAlign:"center"}}>{t.morning}</th>
                    <th colSpan={3} style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",background:"#eff6ff",fontSize:Math.round(12*fs),textAlign:"center"}}>{t.evening.split(" /")[0]}</th>
                    <th style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",background:"#f0f9ff",fontSize:Math.round(12*fs)}}>{lang==="EN"?"Status":"สถานะ"}</th>
                  </tr>
                  <tr>
                    <th style={{border:"1.5px solid #e2e8f0",padding:"4px 8px"}}/>
                    {[t.time,t.upper,t.lower,t.time,t.upper,t.lower].map((h,i)=>(
                      <th key={i} style={{border:"1.5px solid #e2e8f0",padding:"4px 5px",background:i<3?"#fefce8":"#eff6ff",fontSize:Math.round(11*fs),fontWeight:600}}>{h}</th>
                    ))}
                    <th style={{border:"1.5px solid #e2e8f0",padding:"4px 5px"}}/>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r,i)=>{
                    const ms=bpStatus(r.morningSys,r.morningDia),es=bpStatus(r.eveningSys,r.eveningDia);
                    const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
                    return(
                      <tr key={r.id} style={{background:i%2===0?"white":"#f8fafc"}}>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 8px",fontWeight:700,fontSize:Math.round(12*fs),whiteSpace:"nowrap"}}>{toThai(r.date,lang)}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontSize:Math.round(11*fs),color:"#92400e"}}>{r.morningTime||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:800,fontSize:Math.round(14*fs),color:ms?ms.fg:"#1e293b"}}>{r.morningSys||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:700,fontSize:Math.round(13*fs)}}>{r.morningDia||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontSize:Math.round(11*fs),color:"#1d4ed8"}}>{r.eveningTime||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:800,fontSize:Math.round(14*fs),color:es?es.fg:"#1e293b"}}>{r.eveningSys||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:700,fontSize:Math.round(13*fs)}}>{r.eveningDia||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",textAlign:"center"}}>{w&&<span style={{...S.badge(w),fontSize:Math.round(10*fs),padding:"2px 5px"}}>{bpLevelLabel(w)}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div style={{textAlign:"center",fontSize:Math.round(13*fs),color:"#94a3b8",padding:`0 14px ${Math.round(18*fs)}px`,lineHeight:1.8}}>
            {lang==="EN"?"iOS: Share → Save Image · Android: Auto download":"💡 iOS: กด Share → Save Image · Android: ดาวน์โหลดอัตโนมัติ"}
          </div>
        </div>
      )}

      {/* ═══ SETTINGS ═══ */}
      {tab==="settings"&&(
        <div style={{paddingTop:16}}>
          {/* Patient Info */}
          <div style={S.card}>
            <div style={{fontWeight:800,fontSize:Math.round(19*fs),marginBottom:8,display:"flex",alignItems:"center",gap:8}}>{Ic.User(Math.round(20*fs))}{" "}{t.patientInfo}</div>
            <div style={{fontSize:Math.round(14*fs),color:"#166534",background:"#f0fdf4",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:6}}>{Ic.Shield(14)}{" "}{lang==="EN"?"Data stays on this device only":"ข้อมูลเก็บในมือถือนี้เท่านั้น"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:Math.round(13*fs)}}>
              <Input label={t.name} value={activePatient.name} onChange={v=>{const next=patients.map(p=>p.id===activePid?{...p,name:v}:p);setPatients(next);}} placeholder={lang==="EN"?"Your full name":"ชื่อ-นามสกุล"} scale={fs}/>
              <Input label={t.phone} type="tel" value={activePatient.phone} onChange={v=>{const next=patients.map(p=>p.id===activePid?{...p,phone:v}:p);setPatients(next);}} placeholder="0xx-xxx-xxxx" scale={fs}/>
              <button onClick={()=>{lsSet(KEY_PATIENTS,patients);toast$(lang==="EN"?"Saved":"บันทึกแล้ว");}} style={S.btnMain}>{Ic.Check(20)}{" "}{t.saveInfo}</button>
            </div>
            {/* Device ID */}
            <div style={{background:"#f8fafc",borderRadius:10,padding:12,marginTop:14,border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:Math.round(13*fs),color:"#64748b",marginBottom:4,fontWeight:600}}>{t.deviceIdLabel}</div>
              <div style={{fontSize:Math.round(12*fs),color:"#475569",fontFamily:"monospace",wordBreak:"break-all",marginBottom:8}}>{getDeviceId()}</div>
              <button onClick={()=>{try{navigator.clipboard.writeText(getDeviceId());}catch{}toast$("📋 "+(lang==="EN"?"Copied":"คัดลอกแล้ว"));}}
                style={{...S.btnGhost,fontSize:Math.round(13*fs),padding:"8px 14px",width:"auto"}}>
                📋 Copy Device ID
              </button>
            </div>
          </div>

          {/* Manage Patients */}
          <div style={{...S.card,borderTop:"4px solid #0284c7"}}>
            <div style={{fontWeight:800,fontSize:Math.round(19*fs),marginBottom:12,display:"flex",alignItems:"center",gap:8}}>{Ic.Users(20)}{" "}{t.managePatients}</div>
            {patients.map(p=>{
              const pRecs=records.filter(r=>r.patientId===p.id);const isActive=p.id===activePid;
              return(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,marginBottom:8,background:isActive?"#eff6ff":"#f8fafc",border:`2px solid ${isActive?"#0284c7":"transparent"}`}}>
                  <div style={{width:Math.round(38*fs),height:Math.round(38*fs),borderRadius:10,background:isActive?"#0284c7":"#e2e8f0",color:isActive?"white":"#64748b",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:Math.round(18*fs),flexShrink:0}}>
                    {p.name?p.name[0].toUpperCase():"?"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:Math.round(15*fs),display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      {p.name||"–"}{isActive&&<span style={{background:"#0284c7",color:"white",borderRadius:6,padding:"1px 6px",fontSize:Math.round(10*fs)}}>Active</span>}
                    </div>
                    <div style={{fontSize:Math.round(12*fs),color:"#64748b"}}>{p.phone&&p.phone+" · "}{pRecs.length} {t.records}</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {!isActive&&<button onClick={()=>switchPatient(p.id)} style={{background:"#eff6ff",border:"none",borderRadius:8,cursor:"pointer",padding:`${Math.round(6*fs)}px ${Math.round(10*fs)}px`,color:"#0284c7",fontSize:Math.round(12*fs),fontFamily:"Sarabun,sans-serif",fontWeight:700}}>{t.switchPatient}</button>}
                    {patients.length>1&&<button onClick={()=>deletePatient(p.id)} style={{background:"#fef2f2",border:"none",borderRadius:8,cursor:"pointer",padding:`${Math.round(6*fs)}px ${Math.round(8*fs)}px`,color:"#ef4444"}}>{Ic.Trash(14)}</button>}
                  </div>
                </div>
              );
            })}
            <button onClick={()=>{setShowPatientPicker(true);setEditingPatient("new");setPatientForm({name:"",phone:""}); }} style={{...S.btnMain,background:"linear-gradient(135deg,#059669,#047857)",marginTop:4,fontSize:Math.round(17*fs)}}>
              {Ic.Plus(20)}{" "}{t.addPatient}
            </button>
          </div>

          {/* Font + Language */}
          <div style={S.card}>
            <div style={{fontWeight:800,fontSize:Math.round(19*fs),marginBottom:14,display:"flex",alignItems:"center",gap:8}}>{Ic.Text(20)}{" "}{t.fontSize} & {t.language}</div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:Math.round(15*fs),fontWeight:700,color:"#475569",marginBottom:8}}>{t.fontSize}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {[["small",t.small],["medium",t.medium],["large",t.large],["xlarge",t.xlarge]].map(([val,label])=>(
                  <button key={val} onClick={()=>changeFontScale(val)} style={{padding:`${Math.round(10*fs)}px 4px`,borderRadius:10,border:`2px solid ${fontScale===val?"#0284c7":"#e2e8f0"}`,background:fontScale===val?"#eff6ff":"white",color:fontScale===val?"#0284c7":"#64748b",fontSize:Math.round(13*fs)*FS[val],fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:Math.round(15*fs),fontWeight:700,color:"#475569",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>{Ic.Globe(16)}{" "}{t.language}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["TH","🇹🇭 ภาษาไทย"],["EN","🇬🇧 English"]].map(([val,label])=>(
                  <button key={val} onClick={()=>changeLang(val)} style={{padding:`${Math.round(13*fs)}px`,borderRadius:12,border:`2px solid ${lang===val?"#0284c7":"#e2e8f0"}`,background:lang===val?"#eff6ff":"white",color:lang===val?"#0284c7":"#64748b",fontSize:Math.round(15*fs),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Trial */}
          {!isUnlocked&&(
            <div style={{...S.card,borderLeft:"5px solid #f59e0b",background:"#fffbeb"}}>
              <div style={{fontWeight:800,fontSize:Math.round(19*fs),marginBottom:6,color:"#92400e",display:"flex",alignItems:"center",gap:8}}>{Ic.Hourglass(20)}{" "}{t.trial}</div>
              <div style={{fontSize:Math.round(15*fs),color:"#713f12",marginBottom:10}}>{lang==="EN"?"Used":"ใช้ไป"} <strong>{daysUsed}</strong> {lang==="EN"?"days · Left":"วัน · เหลือ"} <strong style={{fontSize:Math.round(21*fs),color:trialLeft<=10?"#ef4444":"#0284c7"}}>{trialLeft}</strong> {t.daysLeft}</div>
              <div style={{background:"#e2e8f0",borderRadius:8,height:10,overflow:"hidden",marginBottom:12}}>
                <div style={{height:"100%",borderRadius:8,width:`${Math.max(2,Math.round((daysUsed/TRIAL_DAYS)*100))}%`,background:trialLeft<=10?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#0284c7,#0ea5e9)",transition:"width 0.5s"}}/>
              </div>
              <button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>{Ic.Gem(20)}{" "}{t.upgrade}</button>
            </div>
          )}
          {isUnlocked&&<div style={{...S.card,borderLeft:"5px solid #22c55e"}}><div style={{fontWeight:800,fontSize:Math.round(19*fs),color:"#166534",display:"flex",alignItems:"center",gap:8}}>{Ic.Gem(20)}{" "}{t.fullVer} ✓</div></div>}

          {/* Backup */}
          <div style={{...S.card,borderTop:"4px solid #7c3aed"}}>
            <div style={{fontWeight:800,fontSize:Math.round(19*fs),marginBottom:6,display:"flex",alignItems:"center",gap:8}}>{Ic.Cloud(20)}{" "}Backup</div>
            <div style={{fontSize:Math.round(13*fs),color:"#64748b",marginBottom:14}}>{lang==="EN"?"Back up weekly to protect data":"แนะนำ backup ทุกสัปดาห์"}</div>
            <div style={{background:"#f0f9ff",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#0369a1",marginBottom:8}}>{lang==="EN"?"Test Connection":"ทดสอบการเชื่อมต่อ"}</div>
              <button onClick={testBackup} style={{...S.btnMain,background:"linear-gradient(135deg,#0369a1,#0284c7)",fontSize:Math.round(16*fs)}}>{Ic.Shield(18)}{" "}{lang==="EN"?"Test Backup":"ทดสอบ Backup"}</button>
              {testResult&&!testResult.testing&&(
                <div style={{marginTop:10,fontSize:Math.round(13*fs),lineHeight:2}}>
                  <div style={{color:testResult.devOk?"#166534":"#991b1b"}}>{testResult.devOk?"✅":"❌"} {lang==="EN"?"Device":"เครื่อง"}</div>
                  <div style={{color:testResult.sheetOk?"#166534":"#991b1b"}}>{testResult.sheetOk?"✅":"❌"} Google Sheets</div>
                </div>
              )}
            </div>
            <div style={{background:"#faf5ff",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#7c3aed",marginBottom:8}}>{lang==="EN"?"Save to Device (.json)":"บันทึกในเครื่อง (.json)"}</div>
              <button onClick={exportBackup} style={{...S.btnMain,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",fontSize:Math.round(16*fs)}}>{Ic.Download(18)}{" "}{t.backupDevice}</button>
              {lastBackup&&<div style={{marginTop:8,fontSize:Math.round(12*fs),color:"#7c3aed",textAlign:"center"}}>{lastBackup}</div>}
            </div>
            <div style={{background:"#f0fdf4",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#059669",marginBottom:8}}>Google Sheets ({filteredRecords.length})</div>
              {isPremium?<>
                <button onClick={backupToSheet} disabled={syncing} style={{...S.btnMain,background:"linear-gradient(135deg,#059669,#047857)",fontSize:Math.round(16*fs)}}>{Ic.Upload(18)}{" "}{syncing?(lang==="EN"?"Uploading...":"กำลังอัปโหลด..."):t.backupSheets}</button>
                {lastSheetSync&&<div style={{marginTop:8,fontSize:Math.round(12*fs),color:"#059669",textAlign:"center"}}>{lastSheetSync}</div>}
              </>:<button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,background:"linear-gradient(135deg,#0f172a,#1e3a5f)",fontSize:Math.round(16*fs)}}>{Ic.Lock(16)}{" "}Cloud Backup — Full Version</button>}
            </div>
            <div style={{background:"#fff7ed",borderRadius:14,padding:14}}>
              <div style={{fontWeight:700,fontSize:Math.round(15*fs),color:"#c2410c",marginBottom:8}}>{lang==="EN"?"Restore (.json)":"นำเข้าข้อมูล (.json)"}</div>
              <label style={{display:"flex",cursor:"pointer",border:"2px solid #c2410c",borderRadius:12,padding:Math.round(14*fs),justifyContent:"center",alignItems:"center",gap:6,fontFamily:"Sarabun,sans-serif",fontSize:Math.round(16*fs),fontWeight:700,color:"#c2410c"}}>
                {Ic.Upload(18)}{" "}{lang==="EN"?"Select backup file":"เลือกไฟล์สำรอง"}
                <input type="file" accept=".json" onChange={importBackup} style={{display:"none"}}/>
              </label>
            </div>
          </div>

          {/* Sheet status */}
          {(()=>{const cfg={unknown:{border:"#94a3b8",bg:"#f8fafc",icon:Ic.Info,title:t.sheetUnknown,sub:""},ok:{border:"#22c55e",bg:"#f0fdf4",icon:Ic.Check,title:t.sheetConnected,sub:""},error:{border:"#ef4444",bg:"#fef2f2",icon:Ic.Warn,title:t.sheetDisconnected,sub:""}}[sheetStatus];
            return<div style={{...S.card,borderLeft:`5px solid ${cfg.border}`,background:cfg.bg}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:sheetStatus==="ok"?"#22c55e":sheetStatus==="error"?"#ef4444":"#94a3b8"}}>{cfg.icon(20)}</span><div style={{fontWeight:800,fontSize:Math.round(16*fs)}}>{cfg.title}</div></div>{lastSheetSync&&sheetStatus==="ok"&&<div style={{fontSize:Math.round(12*fs),color:"#22c55e",marginTop:4}}>{lastSheetSync}</div>}</div>;
          })()}

          {/* Version */}
          <div style={S.card}>
            <div style={{fontWeight:800,fontSize:Math.round(17*fs),display:"flex",alignItems:"center",gap:6}}>{Ic.Tag(18)}{" "}{t.version} {APP_VERSION}</div>
            <div style={{fontSize:Math.round(14*fs),color:"#64748b",marginTop:4}}>{t.updatedAt} {BUILD_DATE}</div>
            <div style={{fontSize:Math.round(12*fs),color:"#94a3b8",marginTop:2}}>{lang==="EN"?"Tap version in header 5x = Admin":"แตะ version header 5 ครั้ง = Admin"}</div>
          </div>

          {/* Danger zone */}
          <div style={S.card}>
            <button onClick={()=>setShowDeleteZone(v=>!v)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"Sarabun,sans-serif",fontSize:Math.round(14*fs),color:"#94a3b8",padding:0,display:"flex",alignItems:"center",gap:6}}>
              {Ic.Warn(14)}{" "}{showDeleteZone?t.hideAdvanced:t.advanced}
            </button>
            {showDeleteZone&&<div style={{marginTop:14,borderTop:"2px dashed #fee2e2",paddingTop:14}}>
              <div style={{fontWeight:800,fontSize:Math.round(17*fs),marginBottom:6,color:"#ef4444"}}>{t.deleteAll}</div>
              <div style={{fontSize:Math.round(13*fs),color:"#64748b",marginBottom:10}}>{lang==="EN"?"Deletes records for current patient only · Cannot undo":"ลบข้อมูลคนไข้ที่ active อยู่ · ไม่สามารถกู้คืนได้"}</div>
              <button onClick={()=>{if(window.confirm(lang==="EN"?`Delete all records for ${activePatient.name||"this patient"}?`:`ยืนยันลบข้อมูลทั้งหมดของ${activePatient.name||"คนไข้นี้"}?`)){const next=records.filter(r=>r.patientId!==activePid);setRecords(next);lsSet(KEY_RECORDS,next);toast$(lang==="EN"?"Deleted":"ล้างข้อมูลแล้ว");}}} style={{width:"100%",padding:Math.round(14*fs),borderRadius:12,border:"2px solid #ef4444",background:"white",color:"#ef4444",fontSize:Math.round(17*fs),fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {Ic.Trash(18)}{" "}{t.deleteAll}
              </button>
            </div>}
          </div>
        </div>
      )}

      {/* ═══ TAB BAR ═══ */}
      <div style={S.tabBar}>
        {[{id:"home",icon:Ic.Home,label:t.home},{id:"record",icon:Ic.Plus,label:t.record},{id:"history",icon:Ic.List,label:t.history},{id:"report",icon:Ic.Camera,label:t.report},{id:"settings",icon:Ic.Gear,label:t.settings}].map(tt=>(
          <button key={tt.id} onClick={()=>setTab(tt.id)} style={S.tabItem(tab===tt.id)}>
            <span style={{color:tab===tt.id?"#0284c7":"#94a3b8"}}>{tt.icon(Math.round(23*fs))}</span>
            {tt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
