import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════
const APP_VERSION  = "v1.9.0";
const BUILD_DATE   = "26 มี.ค. 2568";
const TRIAL_DAYS   = 60;
const ADMIN_EMAIL  = "thitiphankk@gmail.com";
const ADMIN_LINE   = "Oady";

// localStorage keys
const KEY_RECORDS   = "bp-records-v1";
const KEY_PATIENT   = "bp-patient-v1";
const KEY_UNLOCKED  = "bp-unlocked";
const KEY_ADMIN     = "bp-admin-cfg";
const KEY_BACKUP_TS = "bp-last-backup";
const KEY_LANG      = "bp-lang";
const KEY_FONTSCALE = "bp-fontscale";
const KEY_DEVICE    = "bp-device-id";
const KEY_TRIAL_TOK = "bp-trial-token";
const KEY_SHEET_TS  = "bp-sheet-sync-ts";

// Google Apps Script Web App URL
// ⚠️ ต้อง Deploy เป็น "New deployment" ทุกครั้งที่แก้ไข GAS
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxM33dLeillQUUizPrVRsjGWvhPkS2X54DDT41fe5Fev6Y7tnOBt8ds3EAmEtPoYYp58A/exec";

// ═══════════════════════════════════════════════
// i18n
// ═══════════════════════════════════════════════
const T = {
  TH: {
    appName: "บันทึกความดันโลหิต",
    appSub: "Home BP Tracker",
    record: "บันทึก",
    history: "ประวัติ",
    report: "รายงาน",
    settings: "ตั้งค่า",
    home: "หน้าหลัก",
    save: "💾 บันทึกความดัน",
    saving: "⏳ กำลังบันทึก...",
    morning: "ช่วงเช้า",
    evening: "ช่วงเย็น / กลางคืน",
    date: "วัน เดือน ปี",
    time: "เวลา",
    upper: "ตัวบน",
    lower: "ตัวล่าง",
    pulse: "ชีพจร",
    noData: "ยังไม่มีข้อมูล",
    startRecord: "เริ่มบันทึกความดันได้เลย",
    trial: "ทดลองใช้",
    daysLeft: "วันที่เหลือ",
    fullVer: "Full Version",
    upgrade: "💎 ดูรายละเอียด Full Version",
    normal: "ปกติ",
    elevated: "สูงเล็กน้อย",
    high1: "สูงระดับ 1",
    high2: "สูงระดับ 2",
    printA4: "🖨️ พิมพ์ / PDF (A4)",
    saveJPG: "📸 บันทึกรูปภาพ (JPG)",
    backupDevice: "📥 บันทึกไฟล์สำรอง",
    backupSheets: "☁️ อัปโหลดขึ้น Google Sheets",
    patientInfo: "ข้อมูลผู้ป่วย",
    name: "ชื่อ-นามสกุล",
    phone: "เบอร์โทรศัพท์",
    saveInfo: "บันทึกข้อมูล",
    fontSize: "ขนาดตัวอักษร",
    language: "ภาษา",
    small: "เล็ก",
    medium: "กลาง",
    large: "ใหญ่",
    xlarge: "ใหญ่มาก",
    addToHome: "เพิ่มแอปลงหน้าจอ",
    addedToHome: "✅ แอปอยู่บนหน้าจอแล้ว",
    readGuide: "อ่านคำแนะนำการใช้งาน",
    backupData: "Backup ข้อมูล",
    latest: "บันทึกล่าสุด",
    graph: "📈 กราฟ 14 วันล่าสุด",
    advice: "🩺 คำแนะนำสุขภาพ",
    ref: "อ้างอิง: WHO, AHA, ESC Guidelines 2023",
    delete: "ลบ",
    cancel: "ยกเลิก",
    close: "ปิด",
    confirm: "ยืนยัน",
    deleteConfirm: "ลบรายการนี้?",
    deleteAll: "🗑️ ลบข้อมูลทั้งหมด",
    advanced: "▼ แสดงตัวเลือกขั้นสูง",
    hideAdvanced: "▲ ซ่อนตัวเลือกขั้นสูง",
    sheetConnected: "✅ Google Sheets เชื่อมต่อสำเร็จ",
    sheetDisconnected: "🔴 Google Sheets เชื่อมต่อไม่ได้",
    sheetUnknown: "⚪ Google Sheets — ยังไม่ได้ทดสอบ",
    version: "เวอร์ชัน",
    updatedAt: "อัปเดต",
    editMorning: "+ เพิ่มข้อมูลเช้า",
    editEvening: "+ เพิ่มข้อมูลเย็น",
    existingData: "มีข้อมูลวันนี้แล้ว — เพิ่ม/แก้ไขได้เลย",
    newDay: "วันใหม่ — กรอกเช้า หรือ เย็น หรือทั้งคู่ก็ได้",
    unlockFull: "🔓 ปลดล็อค Full Version",
    enterCode: "ใส่รหัสปลดล็อค",
    notifyPay: "📲 แจ้งชำระเงิน",
    notifyDone: "✅ ส่งแจ้งเจ้าหน้าที่แล้ว",
    yourPhone: "เบอร์มือถือของคุณ",
    syncSuccess: "ส่งข้อมูลขึ้น Google Sheets สำเร็จ",
    syncFail: "ส่งข้อมูลไม่สำเร็จ — ตรวจสอบ Apps Script",
    syncOffline: "บันทึกในเครื่อง (ออฟไลน์)",
  },
  EN: {
    appName: "Blood Pressure Log",
    appSub: "Home BP Tracker",
    record: "Record",
    history: "History",
    report: "Report",
    settings: "Settings",
    home: "Home",
    save: "💾 Save Blood Pressure",
    saving: "⏳ Saving...",
    morning: "Morning",
    evening: "Evening / Night",
    date: "Date",
    time: "Time",
    upper: "Systolic",
    lower: "Diastolic",
    pulse: "Pulse",
    noData: "No records yet",
    startRecord: "Start recording your blood pressure",
    trial: "Trial",
    daysLeft: "Days Left",
    fullVer: "Full Version",
    upgrade: "💎 View Full Version Details",
    normal: "Normal",
    elevated: "Elevated",
    high1: "High Stage 1",
    high2: "High Stage 2",
    printA4: "🖨️ Print / PDF (A4)",
    saveJPG: "📸 Save as Image (JPG)",
    backupDevice: "📥 Save Backup File",
    backupSheets: "☁️ Upload to Google Sheets",
    patientInfo: "Patient Information",
    name: "Full Name",
    phone: "Phone Number",
    saveInfo: "Save Info",
    fontSize: "Font Size",
    language: "Language",
    small: "Small",
    medium: "Medium",
    large: "Large",
    xlarge: "X-Large",
    addToHome: "Add App to Home Screen",
    addedToHome: "✅ App already on Home Screen",
    readGuide: "Read User Guide",
    backupData: "Backup Data",
    latest: "Latest Record",
    graph: "📈 14-Day Trend",
    advice: "🩺 Health Recommendations",
    ref: "Source: WHO, AHA, ESC Guidelines 2023",
    delete: "Delete",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    deleteConfirm: "Delete this record?",
    deleteAll: "🗑️ Delete All Data",
    advanced: "▼ Show Advanced Options",
    hideAdvanced: "▲ Hide Advanced Options",
    sheetConnected: "✅ Google Sheets Connected",
    sheetDisconnected: "🔴 Google Sheets Not Connected",
    sheetUnknown: "⚪ Google Sheets — Not Tested Yet",
    version: "Version",
    updatedAt: "Updated",
    editMorning: "+ Add Morning Data",
    editEvening: "+ Add Evening Data",
    existingData: "Data exists for this date — add or edit below",
    newDay: "New day — fill morning, evening, or both",
    unlockFull: "🔓 Unlock Full Version",
    enterCode: "Enter unlock code",
    notifyPay: "📲 Notify Payment",
    notifyDone: "✅ Staff notified",
    yourPhone: "Your phone number",
    syncSuccess: "Synced to Google Sheets",
    syncFail: "Sync failed — check Apps Script",
    syncOffline: "Saved offline",
  },
};

// ═══════════════════════════════════════════════
// SVG Icons
// ═══════════════════════════════════════════════
const icon = (paths, s = 24, fill = false) => (
  <svg width={s} height={s} viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const Ic = {
  Home:   (s) => icon(<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>, s),
  Plus:   (s) => icon(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, s),
  List:   (s) => icon(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>, s),
  Camera: (s) => icon(<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>, s),
  Gear:   (s) => icon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>, s),
  Heart:  (s) => icon(<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>, s, true),
  Sun:    (s) => icon(<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>, s),
  Moon:   (s) => icon(<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>, s),
  Cloud:  (s) => icon(<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>, s),
  Phone:  (s) => icon(<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.69a16 16 0 006.29 6.29l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>, s),
  Lock:   (s) => icon(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>, s),
  Unlock: (s) => icon(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>, s),
  Shield: (s) => icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, s),
  Chart:  (s) => icon(<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>, s),
  Trash:  (s) => icon(<><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>, s),
  Edit:   (s) => icon(<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>, s),
  Check:  (s) => icon(<polyline points="20,6 9,17 4,12"/>, s),
  X:      (s) => icon(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, s),
  Info:   (s) => icon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, s),
  Star:   (s) => icon(<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>, s, true),
  Book:   (s) => icon(<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>, s),
  Mobile: (s) => icon(<><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>, s),
  Bell:   (s) => icon(<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>, s),
  Gem:    (s) => icon(<><polyline points="6,3 18,3 22,9 12,22 2,9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="12" y2="22"/><line x1="6" y1="3" x2="2" y2="9"/><line x1="18" y1="3" x2="22" y2="9"/></>, s),
  Warn:   (s) => icon(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, s),
  Hourglass: (s) => icon(<path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12m5-10v4.172a2 2 0 01-.586 1.414L12 12M7 22v-4.172a2 2 0 01.586-1.414L12 12M7 2v4.172a2 2 0 00.586 1.414L12 12"/>, s),
  QR:     (s) => icon(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="14"/><line x1="21" y1="17" x2="21" y2="21"/><line x1="17" y1="21" x2="21" y2="21"/></>, s),
  Upload: (s) => icon(<><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>, s),
  Download: (s) => icon(<><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></>, s),
  Print:  (s) => icon(<><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>, s),
  User:   (s) => icon(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>, s),
  Tag:    (s) => icon(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>, s),
  Globe:  (s) => icon(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>, s),
  Text:   (s) => icon(<><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>, s),
};

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════
const todayISO = () => new Date().toISOString().split("T")[0];
const nowStr = () => new Date().toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });

const toThai = (iso, lang = "TH") => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (lang === "EN") return `${d}/${m}/${y}`;
  const months = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${parseInt(d)} ${months[parseInt(m)]} ${parseInt(y) + 543}`;
};

const lsGet = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
};
const lsRaw = (key) => {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
};

// Device ID — unique per device, used for trial tracking
const getDeviceId = () => {
  let id = lsRaw(KEY_DEVICE);
  if (!id) {
    id = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY_DEVICE, id);
  }
  return id;
};

// ═══════════════════════════════════════════════
// BP Status (AHA guidelines)
// ═══════════════════════════════════════════════
const BP_LEVELS = ["ปกติ", "สูงเล็กน้อย", "สูงระดับ 1", "สูงระดับ 2"];

const bpStatus = (sys, dia) => {
  const s = parseInt(sys), d = parseInt(dia);
  if (!s || !d) return null;
  if (s < 120 && d < 80) return { label: "ปกติ",        labelEN: "Normal",    bg: "#dcfce7", fg: "#166534", bar: "#22c55e" };
  if (s < 130 && d < 80) return { label: "สูงเล็กน้อย", labelEN: "Elevated",  bg: "#fef9c3", fg: "#854d0e", bar: "#eab308" };
  if (s < 140 || d < 90) return { label: "สูงระดับ 1",  labelEN: "High St.1", bg: "#ffedd5", fg: "#9a3412", bar: "#f97316" };
  return                         { label: "สูงระดับ 2",  labelEN: "High St.2", bg: "#fee2e2", fg: "#991b1b", bar: "#ef4444" };
};

const rank = (st) => (st ? BP_LEVELS.indexOf(st.label) : -1);

// Font scale
const FS = { small: 0.85, medium: 1, large: 1.2, xlarge: 1.45 };

// ═══════════════════════════════════════════════
// Server calls
// ═══════════════════════════════════════════════
const verifyCode = async (type, code) => {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, code }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
};

const trialRegister = async (deviceId) => {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "trial_register", deviceId }),
    });
    return await res.json();
  } catch {
    return null;
  }
};

const trialCheck = async (deviceId, token) => {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "trial_check", deviceId, token }),
    });
    return await res.json();
  } catch {
    return null;
  }
};

// ─── Google Sheets Sync ──────────────────────────────────
// BUG FIX v1.9.0: เปลี่ยนจาก FormData + no-cors เป็น URL-encoded POST
// เพราะ FormData + no-cors ทำให้ GAS รับ parameter ไม่ได้บน mobile
//
// วิธีใหม่: ส่งเป็น URL-encoded form data ซึ่ง GAS จะรับได้ผ่าน e.parameter.data
// ใช้ mode:"no-cors" เนื่องจาก GAS ไม่ support CORS preflight
// ข้อจำกัด: no-cors ทำให้อ่าน response ไม่ได้ ดังนั้นถ้า fetch สำเร็จ (ไม่ throw)
// เราถือว่าข้อมูลถูกส่งไปแล้ว
const syncToSheet = async (entry, patientName) => {
  try {
    const payload = JSON.stringify({ ...entry, patientName });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);
    return { ok: true };
  } catch (e) {
    console.error("syncToSheet error:", e.message);
    return { ok: false, err: e.message };
  }
};

const syncAll = async (records, patientName, onProg) => {
  let ok = 0, fail = 0;
  for (let i = 0; i < records.length; i++) {
    if (onProg) onProg(i + 1, records.length);
    const res = await syncToSheet(records[i], patientName);
    if (res.ok) ok++;
    else fail++;
    await new Promise((r) => setTimeout(r, 400));
  }
  return { ok, fail };
};

const notifyAdmin = async (patientName, phone, isTest = false) => {
  try {
    const payload = JSON.stringify({
      type: "payment_request",
      patientName,
      phone,
      adminEmail: ADMIN_EMAIL,
      adminLine: ADMIN_LINE,
      isTest,
      timestamp: new Date().toLocaleString("th-TH"),
      appVersion: APP_VERSION,
    });
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(payload),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
};

// ═══════════════════════════════════════════════
// Input Component
// ═══════════════════════════════════════════════
const Input = ({ label, value, onChange, type = "text", placeholder, unit, readOnly, scale = 1 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: Math.round(6 * scale) }}>
    <label style={{ fontSize: Math.round(17 * scale), fontWeight: 700, color: "#334155" }}>{label}</label>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        type={type}
        value={value || ""}
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: `${Math.round(14 * scale)}px ${Math.round(16 * scale)}px`,
          borderRadius: 12,
          border: "2px solid #cbd5e1",
          fontSize: Math.round(20 * scale),
          background: readOnly ? "#f1f5f9" : "#f8fafc",
          outline: "none",
          fontFamily: "Sarabun, sans-serif",
          color: "#0f172a",
          boxSizing: "border-box",
          paddingRight: unit ? Math.round(56 * scale) : Math.round(16 * scale),
          fontWeight: 600,
        }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#0284c7"; }}
        onBlur={(e) => { e.target.style.borderColor = "#cbd5e1"; }}
      />
      {unit && (
        <span style={{ position: "absolute", right: 14, fontSize: Math.round(14 * scale), color: "#94a3b8", fontWeight: 700 }}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════
// BP Graph Component
// ═══════════════════════════════════════════════
const BPGraph = ({ records, lang = "TH" }) => {
  const last14 = records.slice(-14);
  if (last14.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 15 }}>
        {lang === "EN" ? "Need at least 2 records" : "ต้องมีข้อมูลอย่างน้อย 2 วัน"}
      </div>
    );
  }

  const W = 320, H = 160, PL = 36, PR = 10, PT = 10, PB = 30;
  const gW = W - PL - PR, gH = H - PT - PB;

  const sysV = last14.map((r) => (r.morningSys ? +r.morningSys : r.eveningSys ? +r.eveningSys : null));
  const diaV = last14.map((r) => (r.morningDia ? +r.morningDia : r.eveningDia ? +r.eveningDia : null));
  const all = [...sysV, ...diaV].filter(Boolean);
  if (!all.length) return null;

  const minV = Math.max(50, Math.min(...all) - 10);
  const maxV = Math.min(200, Math.max(...all) + 10);
  const xP = (i) => PL + (i / (last14.length - 1)) * gW;
  const yP = (v) => PT + (1 - (v - minV) / (maxV - minV)) * gH;

  const path = (vals) =>
    vals.map((v, i) => (v ? `${i === 0 || !vals[i - 1] ? "M" : "L"}${xP(i)},${yP(v)}` : "")).filter(Boolean).join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
        {[120, 130, 140].filter((g) => g >= minV && g <= maxV).map((g) => (
          <g key={g}>
            <line x1={PL} y1={yP(g)} x2={W - PR} y2={yP(g)} stroke="#fca5a5" strokeWidth="1" strokeDasharray="4" />
            <text x={PL - 2} y={yP(g) + 4} fontSize="9" fill="#ef4444" textAnchor="end">{g}</text>
          </g>
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#e2e8f0" strokeWidth="1" />
        <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#e2e8f0" strokeWidth="1" />
        {[minV, Math.round((minV + maxV) / 2), maxV].map((v) => (
          <text key={v} x={PL - 4} y={yP(v) + 4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}</text>
        ))}
        {last14.map((_, i) =>
          i % 3 === 0 && (
            <text key={i} x={xP(i)} y={H - 4} fontSize="8" fill="#94a3b8" textAnchor="middle">
              {last14[i].date.slice(8)}
            </text>
          )
        )}
        <path d={path(sysV)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
        <path d={path(diaV)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
        {sysV.map((v, i) => v && <circle key={"s" + i} cx={xP(i)} cy={yP(v)} r="3" fill="#ef4444" />)}
        {diaV.map((v, i) => v && <circle key={"d" + i} cx={xP(i)} cy={yP(v)} r="3" fill="#3b82f6" />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 6, fontSize: 13 }}>
        <span>
          <span style={{ display: "inline-block", width: 14, height: 3, background: "#ef4444", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }} />
          {lang === "EN" ? "Systolic" : "ตัวบน"}
        </span>
        <span>
          <span style={{ display: "inline-block", width: 14, height: 3, background: "#3b82f6", borderRadius: 2, verticalAlign: "middle", marginRight: 4 }} />
          {lang === "EN" ? "Diastolic" : "ตัวล่าง"}
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// Health Recommendation
// ═══════════════════════════════════════════════
const getRec = (records) => {
  const last7 = records.slice(-7);
  if (!last7.length) return null;

  const vals = last7.flatMap((r) => [
    r.morningSys ? { s: +r.morningSys, d: +r.morningDia } : null,
    r.eveningSys ? { s: +r.eveningSys, d: +r.eveningDia } : null,
  ]).filter(Boolean);
  if (!vals.length) return null;

  const avgS = Math.round(vals.reduce((a, v) => a + v.s, 0) / vals.length);
  const avgD = Math.round(vals.reduce((a, v) => a + v.d, 0) / vals.length);
  const st = bpStatus(avgS, avgD);

  const tips = {
    "ปกติ": {
      TH: ["✅ ความดันอยู่ในเกณฑ์ดี ดูแลต่อไป", "🥗 รับประทานผักผลไม้ครบ 5 หมู่", "🏃 ออกกำลังกาย 30 นาที/วัน"],
      EN: ["✅ BP is normal — keep it up", "🥗 Eat 5 servings of fruits & vegetables", "🏃 Exercise 30 min/day"],
    },
    "สูงเล็กน้อย": {
      TH: ["⚠️ ลดเกลือและโซเดียมในอาหาร", "🚶 เดิน 30–45 นาที/วัน", "😴 นอนหลับ 7–8 ชั่วโมง"],
      EN: ["⚠️ Reduce salt & sodium", "🚶 Walk 30–45 min/day", "😴 Sleep 7–8 hours"],
    },
    "สูงระดับ 1": {
      TH: ["🏥 ควรพบแพทย์เพื่อประเมิน", "🚫 งดอาหารเค็มและแอลกอฮอล์", "💊 รับประทานยาตามแพทย์สั่ง"],
      EN: ["🏥 See a doctor for evaluation", "🚫 Avoid salty food & alcohol", "💊 Take medication as prescribed"],
    },
    "สูงระดับ 2": {
      TH: ["🚨 ความดันสูงมาก พบแพทย์โดยด่วน", "🚫 ห้ามออกกำลังหนัก", "📞 เจ็บหน้าอก/ปวดศีรษะ รีบไป ER"],
      EN: ["🚨 Very high — see doctor urgently", "🚫 Avoid strenuous exercise", "📞 Chest pain/headache? Go to ER"],
    },
  };

  return { avgS, avgD, status: st, tips: (st ? tips[st.label] : null) || { TH: [], EN: [] } };
};

// ═══════════════════════════════════════════════
// Paywall Component
// ═══════════════════════════════════════════════
const Paywall = ({ adminCfg, onUnlock, onBack, lang = "TH", scale = 1 }) => {
  const t = T[lang];
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);
  const [nLoading, setNLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const fs = FS[scale] || 1;

  const tryUnlock = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const ok = await verifyCode("unlock", code.trim());
    setLoading(false);
    if (ok) onUnlock();
    else { setErr(true); setTimeout(() => setErr(false), 2500); }
  };

  const doNotify = async () => {
    if (!phone.trim()) return;
    setNLoading(true);
    await notifyAdmin(adminCfg.patientName || "ไม่ระบุ", phone, false);
    setNLoading(false);
    setNotified(true);
  };

  const hasPayInfo = adminCfg.price || adminCfg.qrUrl || adminCfg.bankName;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,132,199,0.97)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Sarabun, sans-serif", overflowY: "auto" }}>
      <div style={{ background: "white", borderRadius: 24, padding: 24, width: "100%", maxWidth: 400, margin: "auto" }}>
        {/* Back button */}
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: Math.round(16 * fs), cursor: "pointer", fontFamily: "Sarabun, sans-serif", marginBottom: 12, padding: 0 }}>
          ← {lang === "EN" ? "Back" : "ย้อนกลับ"}
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ color: "#0284c7", marginBottom: 6 }}>{Ic.Lock(Math.round(48 * fs))}</div>
          <div style={{ fontSize: Math.round(22 * fs), fontWeight: 800, color: "#0369a1" }}>
            {lang === "EN" ? "Trial Ended" : "หมดระยะทดลองใช้"}
          </div>
        </div>

        {/* Payment info */}
        {hasPayInfo && (
          <div style={{ background: "#f0f9ff", borderRadius: 14, padding: "14px 16px", marginBottom: 14, fontSize: Math.round(15 * fs), lineHeight: 2 }}>
            {adminCfg.price && <div>💰 {lang === "EN" ? "Price" : "ราคา"}: <strong>{adminCfg.price}</strong></div>}
            {adminCfg.bankName && <div>🏦 {adminCfg.bankName}</div>}
            {adminCfg.accountNo && <div>📋 {adminCfg.accountNo}</div>}
            {adminCfg.accountName && <div>👤 {adminCfg.accountName}</div>}
            {adminCfg.phone && <div>{Ic.Phone(16)} {adminCfg.phone}</div>}
          </div>
        )}

        {/* QR Code — FIX: เพิ่มตรวจว่า URL ไม่ใช่ empty string */}
        {adminCfg.qrUrl && adminCfg.qrUrl.startsWith("http") && (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <img
              src={adminCfg.qrUrl}
              alt="QR Code"
              style={{ width: Math.round(180 * fs), height: Math.round(180 * fs), borderRadius: 12, border: "2px solid #e2e8f0" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        )}

        {/* Notify payment */}
        {!notified ? (
          <div style={{ background: "#fefce8", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: Math.round(15 * fs), fontWeight: 700, color: "#92400e", marginBottom: 8 }}>{t.notifyPay}</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.yourPhone}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid #fde68a", fontSize: Math.round(17 * fs), fontFamily: "Sarabun, sans-serif", boxSizing: "border-box", marginBottom: 10, outline: "none" }}
            />
            <button
              onClick={doNotify}
              disabled={nLoading || !phone}
              style={{ width: "100%", padding: 13, background: nLoading ? "#94a3b8" : "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", border: "none", borderRadius: 10, fontSize: Math.round(17 * fs), fontWeight: 800, fontFamily: "Sarabun, sans-serif", cursor: "pointer" }}
            >
              {nLoading ? "⏳..." : t.notifyPay}
            </button>
          </div>
        ) : (
          <div style={{ background: "#dcfce7", borderRadius: 12, padding: 14, marginBottom: 14, textAlign: "center" }}>
            <div style={{ color: "#166534" }}>{Ic.Check(Math.round(24 * fs))}</div>
            <div style={{ fontSize: Math.round(15 * fs), fontWeight: 700, color: "#166534" }}>{t.notifyDone}</div>
            <div style={{ fontSize: Math.round(14 * fs), color: "#15803d" }}>Line: {ADMIN_LINE}</div>
          </div>
        )}

        {/* Unlock code input */}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          placeholder={t.enterCode}
          style={{
            width: "100%", padding: 14, borderRadius: 12,
            border: `2px solid ${err ? "#ef4444" : "#cbd5e1"}`,
            fontSize: Math.round(18 * fs), fontFamily: "Sarabun, sans-serif",
            boxSizing: "border-box", textAlign: "center", fontWeight: 700,
            outline: "none", marginBottom: err ? 6 : 12,
          }}
        />
        {err && (
          <div style={{ color: "#ef4444", fontSize: Math.round(14 * fs), marginBottom: 8, textAlign: "center" }}>
            ❌ {lang === "EN" ? "Invalid code" : "รหัสไม่ถูกต้อง"}
          </div>
        )}

        <button
          onClick={tryUnlock}
          disabled={loading}
          style={{
            width: "100%", padding: 16,
            background: loading ? "#94a3b8" : "linear-gradient(135deg,#0284c7,#075985)",
            color: "white", border: "none", borderRadius: 12,
            fontSize: Math.round(20 * fs), fontWeight: 800,
            fontFamily: "Sarabun, sans-serif", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? "⏳..." : <>{Ic.Unlock(20)} {t.unlockFull}</>}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  // ── State ──
  const [tab, setTab] = useState("home");
  const [records, setRecords] = useState([]);
  const [patient, setPatient] = useState({ name: "", phone: "" });
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProg, setSyncProg] = useState(null);
  const [lastBackup, setLastBackup] = useState("");
  const [lastSheetSync, setLastSheetSync] = useState("");
  const [sheetStatus, setSheetStatus] = useState("unknown");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [trialLeft, setTrialLeft] = useState(TRIAL_DAYS);
  const [daysUsed, setDaysUsed] = useState(0);
  const [trialLoading, setTrialLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [adminCfg, setAdminCfg] = useState({
    unlockCode: "", qrUrl: "", bankName: "", accountNo: "",
    accountName: "", price: "", phone: "", adminPass: "",
  });
  const [adminTap, setAdminTap] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [testNotifyLoading, setTestNotifyLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [lang, setLang] = useState(() => lsRaw(KEY_LANG) || "TH");
  const [fontScale, setFontScale] = useState(() => lsRaw(KEY_FONTSCALE) || "medium");
  const reportRef = useRef(null);

  const t = T[lang];
  const fs = FS[fontScale] || 1;
  const emptyForm = {
    date: todayISO(),
    morningTime: "", morningSys: "", morningDia: "", morningPulse: "",
    eveningTime: "", eveningSys: "", eveningDia: "", eveningPulse: "",
  };
  const [form, setForm] = useState(emptyForm);

  // ── Init ──
  useEffect(() => {
    setRecords(lsGet(KEY_RECORDS, []));
    setPatient(lsGet(KEY_PATIENT, { name: "", phone: "" }));
    setAdminCfg(lsGet(KEY_ADMIN, {
      unlockCode: "", qrUrl: "", bankName: "", accountNo: "",
      accountName: "", price: "", phone: "", adminPass: "",
    }));
    setLastBackup(lsRaw(KEY_BACKUP_TS));
    setLastSheetSync(lsRaw(KEY_SHEET_TS));
    const unlocked = lsGet(KEY_UNLOCKED, false);
    setIsUnlocked(unlocked);

    // Trial check (server-side)
    if (!unlocked) {
      const deviceId = getDeviceId();
      const token = lsRaw(KEY_TRIAL_TOK);
      (async () => {
        setTrialLoading(true);
        let result = null;

        if (token) {
          result = await trialCheck(deviceId, token);
          if (result?.tampered) {
            result = { ok: false, expired: true, daysLeft: 0 };
          }
        }

        if (!result?.ok) {
          const reg = await trialRegister(deviceId);
          if (reg?.ok) {
            localStorage.setItem(KEY_TRIAL_TOK, reg.token);
            result = { ok: true, daysLeft: TRIAL_DAYS, daysUsed: 0, expired: false };
          } else {
            // Fallback: localStorage-based trial
            let inst = localStorage.getItem("bp-install-date");
            if (!inst) {
              inst = new Date().toISOString();
              localStorage.setItem("bp-install-date", inst);
            }
            const used = Math.floor((Date.now() - new Date(inst)) / 86400000);
            result = { ok: true, daysLeft: Math.max(0, TRIAL_DAYS - used), daysUsed: used, expired: used >= TRIAL_DAYS };
          }
        }

        const left = result.daysLeft ?? TRIAL_DAYS;
        const used = result.daysUsed ?? (TRIAL_DAYS - left);
        setTrialLeft(left);
        setDaysUsed(used);
        if (result.expired || left === 0) setShowPaywall(true);
        setTrialLoading(false);
      })();
    } else {
      setTrialLoading(false);
    }

    // Load html2canvas
    if (!window._h2cLoaded) {
      window._h2cLoaded = true;
      const sc = document.createElement("script");
      sc.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(sc);
    }
    setLoaded(true);

    // PWA detection
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }
    const handleBIP = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handleBIP);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast$("✅ เพิ่มแอปลงหน้าจอสำเร็จ!");
    });
    return () => window.removeEventListener("beforeinstallprompt", handleBIP);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──
  const toast$ = (msg, type = "ok", dur = 3500) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), dur);
  };

  const doUnlock = () => {
    lsSet(KEY_UNLOCKED, true);
    setIsUnlocked(true);
    setShowPaywall(false);
    toast$("🎉 ปลดล็อคสำเร็จ! Full Version");
  };

  const isPremium = isUnlocked || (trialLeft > 0 && !trialLoading);

  const changeLang = (l) => { setLang(l); localStorage.setItem(KEY_LANG, l); };
  const changeFontScale = (f) => { setFontScale(f); localStorage.setItem(KEY_FONTSCALE, f); };

  // ── Form ──
  const changeDate = (newDate) => {
    const existing = records.find((r) => r.date === newDate);
    if (existing) {
      setForm({ ...existing });
      toast$(`📋 ${toThai(newDate, lang)}`, "ok", 2000);
    } else {
      setForm({ ...emptyForm, date: newDate });
    }
  };

  const setF = (key) => (val) => {
    if (key === "date") { changeDate(val); return; }
    setForm((f) => ({ ...f, [key]: val }));
  };

  // ── Submit ──
  const submit = async () => {
    if (!form.morningSys && !form.morningDia && !form.eveningSys && !form.eveningDia) {
      toast$(lang === "EN" ? "Enter at least one reading" : "กรอกค่าอย่างน้อย 1 ช่วง", "err");
      return;
    }
    if (!isPremium) { setShowPaywall(true); return; }

    setSaving(true);
    const idx = records.findIndex((r) => r.date === form.date);
    const existing = idx >= 0 ? records[idx] : null;

    const entry = {
      date: form.date,
      id: existing ? existing.id : Date.now(),
      morningTime: form.morningSys ? form.morningTime : (existing?.morningTime || ""),
      morningSys: form.morningSys || existing?.morningSys || "",
      morningDia: form.morningSys ? form.morningDia : (existing?.morningDia || ""),
      morningPulse: form.morningSys ? form.morningPulse : (existing?.morningPulse || ""),
      eveningTime: form.eveningSys ? form.eveningTime : (existing?.eveningTime || ""),
      eveningSys: form.eveningSys || existing?.eveningSys || "",
      eveningDia: form.eveningSys ? form.eveningDia : (existing?.eveningDia || ""),
      eveningPulse: form.eveningSys ? form.eveningPulse : (existing?.eveningPulse || ""),
    };

    const next = idx >= 0
      ? records.map((r, i) => (i === idx ? entry : r))
      : [...records, entry].sort((a, b) => a.date.localeCompare(b.date));

    setRecords(next);
    lsSet(KEY_RECORDS, next);

    // Sync to Google Sheets
    const res = await syncToSheet(entry, patient.name);
    if (res.ok) {
      const ts = nowStr();
      localStorage.setItem(KEY_SHEET_TS, ts);
      setLastSheetSync(ts);
      setSheetStatus("ok");
    } else {
      setSheetStatus("error");
    }

    const action = existing ? (lang === "EN" ? "Updated" : "อัปเดต") : (lang === "EN" ? "Saved" : "บันทึก");
    toast$(
      res.ok ? `✅ ${action} + Google Sheets` : `💾 ${action} (${t.syncOffline})`,
      res.ok ? "ok" : "warn"
    );

    setForm(emptyForm);
    setEditRecord(null);
    setSaving(false);
    setTab("history");
  };

  const openEdit = (r) => { setEditRecord(r); setForm({ ...r }); setTab("record"); };
  const delRecord = (id) => {
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    lsSet(KEY_RECORDS, next);
    setDeleteConfirm(null);
    toast$(lang === "EN" ? "Deleted" : "ลบแล้ว");
  };

  // ── Backup ──
  const exportBackup = async () => {
    const jsonStr = JSON.stringify({
      version: APP_VERSION, patient, records,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const filename = `bp-backup_${patient.name || "record"}_${todayISO()}.json`;
    const ts = nowStr();

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: "application/json" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "BP Backup" });
          localStorage.setItem(KEY_BACKUP_TS, ts);
          setLastBackup(ts);
          toast$("📥 " + t.backupDevice + " ✓");
          return;
        }
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    localStorage.setItem(KEY_BACKUP_TS, ts);
    setLastBackup(ts);
    toast$("📥 " + t.backupDevice + " ✓");
  };

  const backupToSheet = async () => {
    if (!records.length) { toast$(lang === "EN" ? "No data to backup" : "ยังไม่มีข้อมูล", "warn"); return; }
    setSyncing(true);
    setSyncProg({ current: 0, total: records.length });
    const res = await syncAll(records, patient.name, (cur, tot) => setSyncProg({ current: cur, total: tot }));
    setSyncing(false);
    setSyncProg(null);

    if (res.fail === 0) {
      const ts = nowStr();
      localStorage.setItem(KEY_SHEET_TS, ts);
      setLastSheetSync(ts);
      setSheetStatus("ok");
    } else {
      setSheetStatus(res.ok > 0 ? "ok" : "error");
    }

    toast$(
      res.fail === 0
        ? `✅ ${t.backupSheets} (${res.ok})`
        : `⚠️ ${res.ok}/${records.length}`,
      res.fail === 0 ? "ok" : "warn",
      5000
    );
  };

  const importBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.records) { setRecords(data.records); lsSet(KEY_RECORDS, data.records); }
        if (data.patient) { setPatient(data.patient); lsSet(KEY_PATIENT, data.patient); }
        toast$(`📤 ${data.records?.length || 0} records`);
      } catch {
        toast$("Invalid file", "err");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const testBackup = async () => {
    setTestResult({ testing: true });
    let devOk = false, sheetOk = false;

    try {
      const b = new Blob(["test"]);
      URL.revokeObjectURL(URL.createObjectURL(b));
      devOk = true;
    } catch { /* ignore */ }

    // ส่ง test record ไปยัง GAS
    const res = await syncToSheet(
      { date: "TEST-" + todayISO(), id: Date.now(), morningSys: "999", morningDia: "999", morningPulse: "", morningTime: "", eveningSys: "", eveningDia: "", eveningPulse: "", eveningTime: "" },
      "__TEST__"
    );
    sheetOk = res.ok;

    setTestResult({ testing: false, devOk, sheetOk });
    setSheetStatus(sheetOk ? "ok" : "error");
    toast$(
      `${lang === "EN" ? "Device" : "เครื่อง"}: ${devOk ? "✅" : "❌"}  ·  Google Sheets: ${sheetOk ? "✅" : "❌"}`,
      devOk && sheetOk ? "ok" : "warn",
      5000
    );
  };

  // ── Print A4 ──
  const doPrint = () => {
    if (!records.length) { toast$(t.noData, "warn"); return; }
    const rows = records.map((r) => {
      const ms = bpStatus(r.morningSys, r.morningDia);
      const es = bpStatus(r.eveningSys, r.eveningDia);
      const w = rank(ms) >= rank(es) ? (ms || es) : (es || ms);
      return `<tr>
        <td style="text-align:left">${toThai(r.date, lang)}</td>
        <td style="color:#92400e">${r.morningTime || "–"}</td>
        <td style="font-weight:700;color:${ms ? ms.fg : "#000"}">${r.morningSys || "–"}</td>
        <td>${r.morningDia || "–"}</td>
        <td>${r.morningPulse || "–"}</td>
        <td style="color:#1d4ed8">${r.eveningTime || "–"}</td>
        <td style="font-weight:700;color:${es ? es.fg : "#000"}">${r.eveningSys || "–"}</td>
        <td>${r.eveningDia || "–"}</td>
        <td>${r.eveningPulse || "–"}</td>
        <td style="background:${w ? w.bg : "#fff"};color:${w ? w.fg : "#000"};font-weight:700">${w ? (lang === "EN" ? w.labelEN : w.label) : ""}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet"/>
<style>*{font-family:'Sarabun',sans-serif;box-sizing:border-box;}body{margin:0;padding:12mm 15mm;}
@page{size:A4 portrait;margin:12mm 15mm;}h2{text-align:center;color:#0284c7;font-size:16pt;}
.sub{text-align:center;color:#475569;font-size:11pt;}.meta{text-align:center;color:#94a3b8;font-size:9pt;margin-bottom:12px;}
table{width:100%;border-collapse:collapse;font-size:10pt;}thead{display:table-header-group;}
th,td{border:1px solid #94a3b8;padding:5px;text-align:center;}
th{background:#0284c7;color:white;}tr:nth-child(even) td{background:#f8fafc;}
.footer{text-align:right;font-size:8pt;color:#94a3b8;margin-top:8px;}
.printbtn{display:block;margin:0 auto 14px;padding:10px 28px;background:#0284c7;color:white;border:none;border-radius:8px;font-size:14pt;cursor:pointer;font-family:'Sarabun',sans-serif;}
@media print{.printbtn{display:none;}}</style>
</head><body>
<button class="printbtn" onclick="window.print()">${t.printA4}</button>
<h2>${lang === "EN" ? "Blood Pressure Report" : "รายงานความดันโลหิต"}</h2>
${patient.name ? `<div class="sub">👤 ${patient.name}${patient.phone ? ` · 📞 ${patient.phone}` : ""}</div>` : ""}
<div class="meta">${toThai(todayISO(), lang)} · ${records.length} ${lang === "EN" ? "records" : "รายการ"} · ${APP_VERSION}</div>
<table><thead>
<tr><th rowspan="2">${t.date}</th><th colspan="4" style="background:#92400e">${t.morning}</th><th colspan="4" style="background:#1d4ed8">${t.evening}</th><th rowspan="2">${lang === "EN" ? "Status" : "สถานะ"}</th></tr>
<tr><th style="background:#b45309">${t.time}</th><th style="background:#b45309">${t.upper}</th><th style="background:#b45309">${t.lower}</th><th style="background:#b45309">${t.pulse}</th>
<th style="background:#2563eb">${t.time}</th><th style="background:#2563eb">${t.upper}</th><th style="background:#2563eb">${t.lower}</th><th style="background:#2563eb">${t.pulse}</th></tr>
</thead><tbody>${rows}</tbody></table>
<div class="footer">${APP_VERSION} · ${lang === "EN" ? "Normal <120/80 mmHg" : "ปกติ <120/80 mmHg"}</div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    toast$(lang === "EN" ? "Report opened — click Print" : "เปิดหน้ารายงานแล้ว — กดพิมพ์", "ok", 4000);
  };

  // ── Save JPG ──
  const saveJPG = async () => {
    if (!reportRef.current) return;
    if (!window.html2canvas) {
      toast$(lang === "EN" ? "Loading, please wait" : "กำลังโหลด รอแล้วลองใหม่", "warn");
      return;
    }
    setCapturing(true);
    try {
      const canvas = await window.html2canvas(reportRef.current, {
        scale: 2.5, useCORS: true, backgroundColor: "#ffffff", logging: false,
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.93);

      if (navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `bp-${patient.name || "record"}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          toast$("✅ Shared");
          setCapturing(false);
          return;
        }
      }

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `bp-${patient.name || "record"}_${todayISO()}.jpg`;
      a.click();
      toast$("✅ " + t.saveJPG);
    } catch {
      toast$(lang === "EN" ? "Error, try again" : "เกิดข้อผิดพลาด", "err");
    }
    setCapturing(false);
  };

  // ── PWA Install ──
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const doInstall = async () => {
    if (isInstalled) { toast$("✅ " + t.addedToHome, "ok", 3000); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") { setIsInstalled(true); toast$("✅ " + t.addedToHome); }
      setDeferredPrompt(null);
      return;
    }
    if (isIOS) { setShowIOSGuide(true); return; }
    toast$(lang === "EN" ? "Tap ⋮ menu → Add to Home screen" : "กด ⋮ เมนู → Add to Home screen", "ok", 6000);
  };

  // ── Admin ──
  const testNotify = async () => {
    setTestNotifyLoading(true);
    await notifyAdmin(patient.name || "Admin Test", patient.phone || "000", true);
    setTestNotifyLoading(false);
    toast$(lang === "EN" ? "Test notification sent" : "ส่งทดสอบแล้ว ตรวจ Email", "ok", 5000);
  };

  const handleVerTap = () => {
    const n = adminTap + 1;
    if (n >= 5) { setShowAdmin(true); setAdminTap(0); }
    else { setAdminTap(n); setTimeout(() => setAdminTap(0), 3000); }
  };

  // ── Derived ──
  const rec = getRec(records);
  const mStatus = bpStatus(form.morningSys, form.morningDia);
  const eStatus = bpStatus(form.eveningSys, form.eveningDia);
  const bpLevelLabel = (st) => (lang === "EN" ? st?.labelEN : st?.label);

  // ═══════════════════════════════════════════════
  // Styles
  // ═══════════════════════════════════════════════
  const S = {
    app:     { fontFamily: "'Sarabun', sans-serif", background: "#f0f9ff", minHeight: "100vh", maxWidth: 520, margin: "0 auto", paddingBottom: 90 },
    header:  { background: "linear-gradient(135deg,#0284c7,#075985)", padding: `${Math.round(22 * fs)}px 20px ${Math.round(18 * fs)}px`, color: "white" },
    card:    { background: "white", borderRadius: 18, padding: Math.round(20 * fs), margin: "0 14px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
    grid2:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: Math.round(14 * fs) },
    btnMain: { width: "100%", padding: `${Math.round(17 * fs)}px`, background: "linear-gradient(135deg,#0284c7,#075985)", color: "white", border: "none", borderRadius: 14, fontSize: Math.round(19 * fs), fontWeight: 800, fontFamily: "Sarabun, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
    btnGhost: { flex: 1, padding: `${Math.round(14 * fs)}px`, borderRadius: 12, border: "2px solid #0284c7", background: "white", color: "#0284c7", fontSize: Math.round(16 * fs), fontWeight: 700, fontFamily: "Sarabun, sans-serif", cursor: "pointer", textAlign: "center" },
    tabBar:  { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 520, background: "white", borderTop: "2px solid #e2e8f0", display: "flex", zIndex: 100 },
    tabItem: (active) => ({ flex: 1, padding: "10px 2px 8px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: active ? "#0284c7" : "#94a3b8", fontFamily: "Sarabun, sans-serif", fontSize: Math.round(12 * fs), fontWeight: active ? 800 : 500 }),
    badge:   (st) => ({ display: "inline-block", padding: `${Math.round(4 * fs)}px ${Math.round(10 * fs)}px`, borderRadius: 20, fontSize: Math.round(13 * fs), fontWeight: 800, background: st.bg, color: st.fg }),
    histCard: { background: "white", borderRadius: 16, padding: Math.round(18 * fs), margin: "0 14px 12px", boxShadow: "0 2px 6px rgba(0,0,0,0.07)", borderLeft: "5px solid" },
    secTitle: { fontSize: Math.round(19 * fs), fontWeight: 800, marginBottom: Math.round(15 * fs), display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  };

  // ── Loading Screen ──
  if (!loaded || trialLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Sarabun, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#0284c7", marginBottom: 10 }}>{Ic.Heart(Math.round(52 * fs))}</div>
          <div style={{ color: "#64748b", fontSize: Math.round(20 * fs) }}>{lang === "EN" ? "Loading..." : "กำลังโหลด..."}</div>
          {trialLoading && (
            <div style={{ color: "#94a3b8", fontSize: Math.round(14 * fs), marginTop: 6 }}>
              {lang === "EN" ? "Verifying trial..." : "กำลังตรวจสอบสิทธิ์..."}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{opacity:.4;}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "err" ? "#ef4444" : toast.type === "warn" ? "#f59e0b" : "#22c55e",
          color: "white", padding: `${Math.round(14 * fs)}px ${Math.round(24 * fs)}px`,
          borderRadius: 30, fontSize: Math.round(16 * fs), fontWeight: 700, zIndex: 9999,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)", maxWidth: "92vw", textAlign: "center", lineHeight: 1.5,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ═══ UPGRADE SCREEN ═══ */}
      {showUpgrade && (
        <div style={{ position: "fixed", inset: 0, zIndex: 800, overflowY: "auto", background: "#f0f9ff" }}>
          <div style={{ fontFamily: "Sarabun, sans-serif", maxWidth: 520, margin: "0 auto", paddingBottom: 30 }}>
            {/* Upgrade header */}
            <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)", padding: `${Math.round(24 * fs)}px 20px ${Math.round(28 * fs)}px`, color: "white", position: "relative" }}>
              <button onClick={() => setShowUpgrade(false)} style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "white", fontSize: Math.round(14 * fs), padding: "6px 12px", cursor: "pointer", fontFamily: "Sarabun, sans-serif" }}>
                ← {t.cancel}
              </button>
              <div style={{ textAlign: "center", paddingTop: 8 }}>
                <div style={{ color: "white", marginBottom: 6 }}>{Ic.Gem(Math.round(44 * fs))}</div>
                <div style={{ fontSize: Math.round(24 * fs), fontWeight: 800, marginBottom: 4 }}>{t.fullVer}</div>
                {trialLeft > 0 && (
                  <div style={{ marginTop: 12, background: "rgba(234,179,8,.2)", border: "1.5px solid rgba(234,179,8,.5)", borderRadius: 12, padding: "8px 16px", display: "inline-block", fontSize: Math.round(14 * fs) }}>
                    {Ic.Hourglass(16)} {t.trial}: <strong style={{ color: "#fde68a", fontSize: Math.round(18 * fs) }}>{trialLeft}</strong> {t.daysLeft}
                  </div>
                )}
              </div>
            </div>

            {/* Feature comparison table */}
            <div style={{ margin: "16px 14px 0", background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", textAlign: "center" }}>
                <div style={{ padding: "14px 8px", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }} />
                <div style={{ padding: "14px 8px", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#0284c7" }}>{Ic.Star(Math.round(20 * fs))}</div>
                  <div style={{ fontWeight: 800, fontSize: Math.round(14 * fs), marginTop: 2 }}>{lang === "EN" ? "Free" : "ฟรี"}</div>
                  <div style={{ fontSize: Math.round(12 * fs), color: "#64748b" }}>{TRIAL_DAYS} {lang === "EN" ? "days" : "วัน"}</div>
                </div>
                <div style={{ padding: "14px 8px", background: "linear-gradient(135deg,#0284c7,#075985)", borderBottom: "2px solid #0369a1" }}>
                  <div style={{ color: "white" }}>{Ic.Gem(Math.round(20 * fs))}</div>
                  <div style={{ fontWeight: 800, fontSize: Math.round(14 * fs), marginTop: 2, color: "white" }}>{t.fullVer}</div>
                  {/* BUG FIX: operator precedence — ใส่ parentheses ให้ ternary */}
                  <div style={{ fontSize: Math.round(12 * fs), color: "#bae6fd" }}>
                    {adminCfg.price || (lang === "EN" ? "One-time" : "จ่ายครั้งเดียว")}
                  </div>
                </div>
              </div>
              {[
                [lang === "EN" ? "Record BP" : "บันทึกความดัน", "✅", "✅"],
                [lang === "EN" ? "View history" : "ดูประวัติ", "✅", "✅"],
                [lang === "EN" ? "BP Trend Graph" : "กราฟแนวโน้ม", "❌", "✅"],
                [lang === "EN" ? "Health Advice" : "คำแนะนำสุขภาพ", "❌", "✅"],
                [lang === "EN" ? "PDF / JPG" : "รายงาน PDF / JPG", "❌", "✅"],
                [lang === "EN" ? "Cloud Backup" : "Backup Cloud", "❌", "✅"],
                [lang === "EN" ? "Unlimited" : "ไม่จำกัดวัน", "❌", "✅"],
              ].map(([feat, free, full], i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", borderBottom: i < 6 ? "1px solid #f1f5f9" : "none", background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                  <div style={{ padding: `${Math.round(10 * fs)}px 14px`, fontSize: Math.round(14 * fs), color: "#475569", borderRight: "1px solid #f1f5f9" }}>{feat}</div>
                  <div style={{ padding: `${Math.round(10 * fs)}px 0`, textAlign: "center", fontSize: Math.round(16 * fs), borderRight: "1px solid #f1f5f9" }}>{free}</div>
                  <div style={{ padding: `${Math.round(10 * fs)}px 0`, textAlign: "center", fontSize: Math.round(16 * fs) }}>{full}</div>
                </div>
              ))}
            </div>

            {/* Price + QR + CTA */}
            <div style={{ margin: "16px 14px 0", background: "white", borderRadius: 18, padding: Math.round(20 * fs), boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              {adminCfg.price && (
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: Math.round(13 * fs), color: "#64748b" }}>{lang === "EN" ? "Special Price" : "ราคาพิเศษ"}</div>
                  <div style={{ fontSize: Math.round(38 * fs), fontWeight: 800, color: "#0284c7", lineHeight: 1.1 }}>{adminCfg.price}</div>
                  <div style={{ fontSize: Math.round(14 * fs), color: "#22c55e", fontWeight: 700, marginTop: 4 }}>
                    {Ic.Check(16)} {lang === "EN" ? "One-time payment, lifetime use" : "จ่ายครั้งเดียว ใช้ได้ตลอดชีพ"}
                  </div>
                </div>
              )}

              {/* QR Code — FIX: ตรวจสอบว่า URL เริ่มด้วย http */}
              {adminCfg.qrUrl && adminCfg.qrUrl.startsWith("http") ? (
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: Math.round(15 * fs), fontWeight: 800, color: "#0369a1", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {Ic.QR(20)} {lang === "EN" ? "Scan QR to Pay" : "สแกน QR โอนเงินได้เลย"}
                  </div>
                  <div style={{ display: "inline-block", padding: 10, background: "white", borderRadius: 16, border: "3px solid #0284c7", boxShadow: "0 4px 16px rgba(2,132,199,0.2)" }}>
                    <img
                      src={adminCfg.qrUrl}
                      alt="QR Code"
                      style={{ width: Math.round(220 * fs), height: Math.round(220 * fs), display: "block", borderRadius: 8, objectFit: "contain" }}
                      onError={(e) => { e.target.parentElement.style.display = "none"; }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ background: "#fefce8", borderRadius: 14, padding: 14, marginBottom: 14, textAlign: "center", fontSize: Math.round(15 * fs), color: "#92400e", border: "1.5px solid #fde68a" }}>
                  {Ic.Phone(20)} Line: <strong>{ADMIN_LINE}</strong>
                  {adminCfg.phone && <span> · {adminCfg.phone}</span>}
                </div>
              )}

              {(adminCfg.bankName || adminCfg.accountNo) && (
                <div style={{ background: "#f0f9ff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, fontSize: Math.round(15 * fs), lineHeight: 2, border: "1px solid #bae6fd" }}>
                  {adminCfg.bankName && <div>🏦 <strong>{adminCfg.bankName}</strong></div>}
                  {adminCfg.accountNo && <div>{Ic.Tag(14)} <strong>{adminCfg.accountNo}</strong></div>}
                  {adminCfg.accountName && <div>{Ic.User(14)} <strong>{adminCfg.accountName}</strong></div>}
                </div>
              )}

              {adminCfg.phone && (
                <div style={{ textAlign: "center", marginBottom: 14, fontSize: Math.round(15 * fs), color: "#0369a1", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {Ic.Phone(16)} <a href={`tel:${adminCfg.phone}`} style={{ color: "#0284c7" }}>{adminCfg.phone}</a>
                </div>
              )}

              <button onClick={() => { setShowUpgrade(false); setShowPaywall(true); }} style={{ ...S.btnMain, boxShadow: "0 4px 16px rgba(2,132,199,0.4)" }}>
                {Ic.Unlock(Math.round(20 * fs))} {t.unlockFull}
              </button>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: Math.round(13 * fs), color: "#94a3b8" }}>
                Line: <strong>{ADMIN_LINE}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall */}
      {showPaywall && (
        <Paywall
          adminCfg={{ ...adminCfg, patientName: patient.name }}
          onUnlock={doUnlock}
          onBack={() => setShowPaywall(false)}
          lang={lang}
          scale={fontScale}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ color: "#ef4444", marginBottom: 10 }}>{Ic.Trash(Math.round(40 * fs))}</div>
            <div style={{ fontWeight: 800, fontSize: Math.round(20 * fs), marginBottom: 6 }}>{t.deleteConfirm}</div>
            <div style={{ color: "#64748b", fontSize: Math.round(17 * fs), marginBottom: 22 }}>{toThai(deleteConfirm.date, lang)}</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: Math.round(15 * fs), borderRadius: 12, border: "2px solid #e2e8f0", background: "white", fontSize: Math.round(17 * fs), fontFamily: "Sarabun, sans-serif", cursor: "pointer", fontWeight: 600 }}>{t.cancel}</button>
              <button onClick={() => delRecord(deleteConfirm.id)} style={{ flex: 1, padding: Math.round(15 * fs), borderRadius: 12, border: "none", background: "#ef4444", color: "white", fontSize: Math.round(17 * fs), fontWeight: 800, fontFamily: "Sarabun, sans-serif", cursor: "pointer" }}>{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress */}
      {syncing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 320, textAlign: "center" }}>
            <div style={{ color: "#0284c7", marginBottom: 10 }}>{Ic.Cloud(Math.round(40 * fs))}</div>
            <div style={{ fontWeight: 800, fontSize: Math.round(19 * fs), marginBottom: 8 }}>{lang === "EN" ? "Uploading..." : "กำลังอัปโหลด"}</div>
            <div style={{ color: "#64748b", fontSize: Math.round(15 * fs), marginBottom: 14 }}>{syncProg?.current} / {syncProg?.total}</div>
            <div style={{ background: "#e2e8f0", borderRadius: 10, height: 14, overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg,#0284c7,#0ea5e9)", height: "100%", borderRadius: 10, width: `${syncProg ? Math.round((syncProg.current / syncProg.total) * 100) : 0}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ marginTop: 8, fontSize: Math.round(14 * fs), color: "#64748b" }}>
              {syncProg ? Math.round((syncProg.current / syncProg.total) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
          <div style={{ background: "white", borderRadius: 22, padding: 22, width: "100%", maxWidth: 400, margin: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ color: "#0284c7" }}>{Ic.Book(Math.round(36 * fs))}</div>
              <div style={{ fontWeight: 800, fontSize: Math.round(22 * fs), color: "#0284c7" }}>{lang === "EN" ? "User Guide" : "คู่มือการใช้งาน"}</div>
            </div>
            {[
              { icon: Ic.Plus, t: "Record BP / บันทึก", d: lang === "EN" ? "Select date → Enter morning or evening values → Save" : "เลือกวันที่ → กรอกค่าเช้าหรือเย็น → กดบันทึก" },
              { icon: Ic.List, t: "History / ประวัติ", d: lang === "EN" ? "View records, graph, health tips. Tap ✏️ to edit" : "ดูรายการ กราฟ คำแนะนำ กด ✏️ เพื่อแก้ไข" },
              { icon: Ic.Camera, t: "Report / รายงาน", d: lang === "EN" ? "Save JPG image or print A4 PDF" : "บันทึกรูป JPG หรือพิมพ์ A4" },
              { icon: Ic.Gear, t: "Settings / ตั้งค่า", d: lang === "EN" ? "Set name, backup data, font size, language" : "ตั้งชื่อ สำรองข้อมูล ขนาดตัวอักษร ภาษา" },
              { icon: Ic.Heart, t: "BP Levels / เกณฑ์", d: "Normal <120/80 · Elevated 120-129 · High St.1 130-139 · High St.2 ≥140 mmHg" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 12 }}>
                <div style={{ color: "#0284c7", flexShrink: 0 }}>{item.icon(Math.round(26 * fs))}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: Math.round(16 * fs), marginBottom: 2 }}>{item.t}</div>
                  <div style={{ fontSize: Math.round(13 * fs), color: "#64748b", lineHeight: 1.6 }}>{item.d}</div>
                </div>
              </div>
            ))}
            <button onClick={() => setShowGuide(false)} style={{ ...S.btnMain, marginTop: 4 }}>OK ✓</button>
          </div>
        </div>
      )}

      {/* iOS Install Guide */}
      {showIOSGuide && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 800, display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "Sarabun, sans-serif" }}>
          <div style={{ background: "white", borderRadius: "22px 22px 0 0", padding: 28, width: "100%", maxWidth: 520, paddingBottom: 40 }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ color: "#0284c7" }}>{Ic.Mobile(Math.round(40 * fs))}</div>
              <div style={{ fontWeight: 800, fontSize: Math.round(21 * fs), color: "#0f172a", marginTop: 6 }}>
                {lang === "EN" ? "Add to iPhone Home Screen" : "เพิ่มแอปลงหน้าจอ iPhone"}
              </div>
            </div>
            {[
              { n: "1", icon: Ic.Upload, t: lang === "EN" ? "Tap Share ↗" : "กดปุ่ม Share ↗", d: lang === "EN" ? "Bottom center bar of Safari" : "แถบล่างตรงกลางของ Safari" },
              { n: "2", icon: Ic.Mobile, t: '"Add to Home Screen"', d: lang === "EN" ? "Scroll and find this option" : "เลื่อนหาแล้วกด" },
              { n: "3", icon: Ic.Check, t: lang === "EN" ? 'Tap "Add"' : 'กด "Add" มุมขวาบน', d: lang === "EN" ? "App icon appears on your screen" : "แอปจะปรากฏบนหน้าจอทันที" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: Math.round(40 * fs), height: Math.round(40 * fs), borderRadius: 12, background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(20 * fs), flexShrink: 0, fontWeight: 800 }}>{step.n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: Math.round(16 * fs), marginBottom: 2 }}>{step.icon(16)} {step.t}</div>
                  <div style={{ fontSize: Math.round(14 * fs), color: "#64748b" }}>{step.d}</div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: "center", margin: "14px 0", background: "#f0f9ff", border: "2px solid #bae6fd", borderRadius: 12, padding: "10px 20px", fontSize: Math.round(14 * fs), color: "#0369a1", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {Ic.Info(16)} {lang === "EN" ? "Share button is at the bottom of Safari" : "ปุ่ม Share อยู่แถบล่างของ Safari"}
            </div>
            <button onClick={() => setShowIOSGuide(false)} style={S.btnMain}>
              {lang === "EN" ? "Got it" : "เข้าใจแล้ว"} ✓
            </button>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
          <div style={{ background: "white", borderRadius: 22, padding: 22, width: "100%", maxWidth: 400, margin: "auto" }}>
            <div style={{ fontWeight: 800, fontSize: Math.round(22 * fs), marginBottom: 14, color: "#0284c7", display: "flex", alignItems: "center", gap: 8 }}>
              {Ic.Shield(22)} Admin Panel
            </div>

            {!adminAuth ? (
              <div>
                <Input label="รหัสผ่าน Admin" type="password" value={adminPass} onChange={setAdminPass} placeholder="admin password" scale={fs} />
                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <button onClick={() => { setShowAdmin(false); setAdminPass(""); }} style={S.btnGhost}>{t.cancel}</button>
                  <button
                    onClick={async () => {
                      setAdminLoading(true);
                      const ok = await verifyCode("admin", adminPass);
                      setAdminLoading(false);
                      if (ok) setAdminAuth(true);
                      else toast$("❌ Wrong password", "err");
                    }}
                    style={{ ...S.btnMain, flex: 1 }}
                    disabled={adminLoading}
                  >
                    {adminLoading ? "⏳..." : (lang === "EN" ? "Login" : "เข้าสู่ระบบ")}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 12, fontSize: Math.round(14 * fs), color: "#166534", lineHeight: 1.7 }}>
                  {Ic.Chart(16)} {records.length} records · {patient.name || "No name"}<br />
                  📧 {ADMIN_EMAIL} · Line: {ADMIN_LINE}
                </div>

                <div style={{ background: "#eff6ff", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: Math.round(15 * fs), color: "#1d4ed8", marginBottom: 8 }}>
                    {Ic.Bell(16)} {lang === "EN" ? "Test Notification" : "ทดสอบการแจ้งเตือน"}
                  </div>
                  <button
                    onClick={testNotify}
                    disabled={testNotifyLoading}
                    style={{ width: "100%", padding: 13, background: testNotifyLoading ? "#94a3b8" : "linear-gradient(135deg,#1d4ed8,#1e40af)", color: "white", border: "none", borderRadius: 10, fontSize: Math.round(15 * fs), fontWeight: 700, fontFamily: "Sarabun, sans-serif", cursor: "pointer" }}
                  >
                    {testNotifyLoading ? "⏳..." : `📧 ${lang === "EN" ? "Send Test Email" : "ทดสอบส่ง Email"}`}
                  </button>
                </div>

                <Input label={lang === "EN" ? "Price" : "ราคา Full Version"} value={adminCfg.price || ""} onChange={(v) => setAdminCfg((c) => ({ ...c, price: v }))} placeholder="299 บาท" scale={fs} />
                <Input label={lang === "EN" ? "Contact Phone" : "เบอร์ติดต่อ"} value={adminCfg.phone || ""} onChange={(v) => setAdminCfg((c) => ({ ...c, phone: v }))} placeholder="089-xxx-xxxx" scale={fs} />
                <Input label={lang === "EN" ? "Bank Name" : "ธนาคาร"} value={adminCfg.bankName || ""} onChange={(v) => setAdminCfg((c) => ({ ...c, bankName: v }))} placeholder="กสิกรไทย" scale={fs} />
                <Input label={lang === "EN" ? "Account No." : "เลขบัญชี"} value={adminCfg.accountNo || ""} onChange={(v) => setAdminCfg((c) => ({ ...c, accountNo: v }))} placeholder="xxx-x-xxxxx-x" scale={fs} />
                <Input label={lang === "EN" ? "Account Name" : "ชื่อบัญชี"} value={adminCfg.accountName || ""} onChange={(v) => setAdminCfg((c) => ({ ...c, accountName: v }))} placeholder="ชื่อ นามสกุล" scale={fs} />
                <Input label="QR Code URL" value={adminCfg.qrUrl || ""} onChange={(v) => setAdminCfg((c) => ({ ...c, qrUrl: v }))} placeholder="https://..." scale={fs} />

                <div style={{ background: "#fffbeb", borderRadius: 12, padding: 12, fontSize: Math.round(13 * fs), color: "#713f12", lineHeight: 1.7 }}>
                  {Ic.Info(14)} Vercel ENV: UNLOCK_CODE, ADMIN_PASS, TRIAL_SECRET<br />
                  LINE: Messaging API (LINE Notify ended Mar 31, 2025)
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setShowAdmin(false); setAdminAuth(false); setAdminPass(""); }} style={S.btnGhost}>{t.close}</button>
                  <button
                    onClick={() => {
                      lsSet(KEY_ADMIN, adminCfg);
                      toast$(lang === "EN" ? "Saved" : "บันทึกแล้ว");
                      setShowAdmin(false);
                      setAdminAuth(false);
                      setAdminPass("");
                    }}
                    style={{ ...S.btnMain, flex: 1, fontSize: Math.round(17 * fs) }}
                  >
                    {Ic.Download(18)} {t.saveInfo}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: Math.round(11 * fs), opacity: 0.75, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{t.appSub}</div>
            <div style={{ fontSize: Math.round(24 * fs), fontWeight: 800 }}>{t.appName}</div>
            {patient.name && (
              <div style={{ fontSize: Math.round(16 * fs), opacity: 0.9, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                {Ic.User(Math.round(16 * fs))} {patient.name}
              </div>
            )}
            {!isUnlocked && (
              <div style={{ fontSize: Math.round(12 * fs), background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "3px 10px", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                {Ic.Hourglass(12)} {t.trial}: {trialLeft} {t.daysLeft}
              </div>
            )}
            {isUnlocked && (
              <div style={{ fontSize: Math.round(12 * fs), background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "3px 10px", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
                {Ic.Gem(12)} {t.fullVer}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 14, padding: `${Math.round(7 * fs)}px ${Math.round(14 * fs)}px`, textAlign: "center" }}>
              <div style={{ fontSize: Math.round(26 * fs), fontWeight: 800, lineHeight: 1 }}>{records.length}</div>
              <div style={{ fontSize: Math.round(11 * fs), opacity: 0.85 }}>{lang === "EN" ? "records" : "รายการ"}</div>
            </div>
            <button onClick={handleVerTap} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "white", fontSize: Math.round(11 * fs), padding: "4px 10px", cursor: "pointer", fontFamily: "Sarabun, sans-serif" }}>
              {APP_VERSION}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Install Button */}
      {!isInstalled && (deferredPrompt || isIOS) && tab !== "home" && (
        <div style={{ position: "fixed", bottom: 82, right: 16, zIndex: 90 }}>
          <button onClick={doInstall} style={{ background: "linear-gradient(135deg,#0284c7,#075985)", color: "white", border: "none", borderRadius: 30, padding: "12px 18px", fontSize: Math.round(13 * fs), fontWeight: 700, fontFamily: "Sarabun, sans-serif", cursor: "pointer", boxShadow: "0 4px 16px rgba(2,132,199,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
            {Ic.Mobile(16)} {lang === "EN" ? "Install" : "เพิ่มแอป"}
          </button>
        </div>
      )}

      {/* ═══ HOME TAB ═══ */}
      {tab === "home" && (
        <div style={{ paddingTop: 18 }}>
          <div style={{ padding: "0 14px", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: Math.round(18 * fs), marginBottom: 14, color: "#0369a1" }}>
              {lang === "EN" ? "🚀 Get Started" : "🚀 เริ่มต้นใช้งาน"}
            </div>
            {[
              { num: 1, icon: Ic.Mobile, title: isInstalled ? t.addedToHome : t.addToHome, desc: isInstalled ? (lang === "EN" ? "App shortcut ready" : "ทางลัดพร้อมใช้แล้ว") : (lang === "EN" ? "Tap to add instantly" : "กดเพื่อเพิ่มทางลัดได้เลย"), color: isInstalled ? "#22c55e" : "#0284c7", bg: isInstalled ? "#f0fdf4" : "#eff6ff", action: doInstall },
              { num: 2, icon: Ic.Book, title: t.readGuide, desc: lang === "EN" ? "Learn how to use the app" : "ทำความเข้าใจก่อนเริ่มใช้", color: "#059669", bg: "#f0fdf4", action: () => setShowGuide(true) },
              { num: 3, icon: Ic.Cloud, title: t.backupData, desc: lang === "EN" ? "Save & upload to Google Sheets" : "เก็บข้อมูลสำรองและอัปโหลด", color: "#7c3aed", bg: "#faf5ff", action: () => setTab("settings") },
            ].map((step) => (
              <button key={step.num} onClick={step.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: step.bg, borderRadius: 16, padding: `${Math.round(15 * fs)}px ${Math.round(18 * fs)}px`, marginBottom: 12, border: `2px solid ${step.color}20`, cursor: "pointer", textAlign: "left", fontFamily: "Sarabun, sans-serif" }}>
                <div style={{ width: Math.round(44 * fs), height: Math.round(44 * fs), borderRadius: 12, background: step.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800 }}>
                  {step.num === 1 && (isInstalled ? Ic.Check(Math.round(22 * fs)) : Ic.Mobile(Math.round(22 * fs)))}
                  {step.num === 2 && Ic.Book(Math.round(22 * fs))}
                  {step.num === 3 && Ic.Cloud(Math.round(22 * fs))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: Math.round(16 * fs), fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontSize: Math.round(13 * fs), color: "#64748b" }}>{step.desc}</div>
                </div>
                <div style={{ fontSize: Math.round(22 * fs), color: step.color }}>›</div>
              </button>
            ))}
          </div>

          {/* Upgrade banner */}
          {!isUnlocked && (
            <div style={{ margin: "0 14px 14px" }}>
              <button onClick={() => setShowUpgrade(true)} style={{ width: "100%", background: "linear-gradient(135deg,#0f172a,#1e3a5f)", border: "none", borderRadius: 16, padding: `${Math.round(15 * fs)}px ${Math.round(20 * fs)}px`, cursor: "pointer", fontFamily: "Sarabun, sans-serif", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ color: "white" }}>{Ic.Gem(Math.round(32 * fs))}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "white", fontWeight: 800, fontSize: Math.round(15 * fs), marginBottom: 2 }}>{t.upgrade}</div>
                  <div style={{ color: "#93c5fd", fontSize: Math.round(12 * fs) }}>
                    {lang === "EN" ? "Graph · Advice · PDF · Unlimited" : "กราฟ · คำแนะนำ · PDF · ไม่จำกัดวัน"}
                    {adminCfg.price ? ` · ${adminCfg.price}` : ""}
                  </div>
                </div>
                <div style={{ color: "#60a5fa", fontSize: Math.round(22 * fs) }}>›</div>
              </button>
            </div>
          )}

          {/* Latest record */}
          {records.length > 0 && (() => {
            const last = records[records.length - 1];
            const ms = bpStatus(last.morningSys, last.morningDia);
            const es = bpStatus(last.eveningSys, last.eveningDia);
            const w = rank(ms) >= rank(es) ? (ms || es) : (es || ms);
            return (
              <div style={{ ...S.card, borderLeft: `5px solid ${w ? w.bar : "#22c55e"}` }}>
                <div style={{ fontWeight: 800, fontSize: Math.round(16 * fs), marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  {Ic.Heart(Math.round(16 * fs))} {t.latest} — {toThai(last.date, lang)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {last.morningSys && (
                    <div style={{ background: "#fefce8", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: Math.round(12 * fs), color: "#92400e", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        {Ic.Sun(12)} {t.morning} {last.morningTime && `· ${last.morningTime}`}
                      </div>
                      <div style={{ fontSize: Math.round(26 * fs), fontWeight: 800 }}>
                        {last.morningSys}<span style={{ fontSize: Math.round(15 * fs) }}>/{last.morningDia}</span>
                      </div>
                    </div>
                  )}
                  {last.eveningSys && (
                    <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: Math.round(12 * fs), color: "#1d4ed8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        {Ic.Moon(12)} {t.evening.split(" /")[0]} {last.eveningTime && `· ${last.eveningTime}`}
                      </div>
                      <div style={{ fontSize: Math.round(26 * fs), fontWeight: 800 }}>
                        {last.eveningSys}<span style={{ fontSize: Math.round(15 * fs) }}>/{last.eveningDia}</span>
                      </div>
                    </div>
                  )}
                </div>
                {w && <div style={{ marginTop: 8 }}><span style={S.badge(w)}>{bpLevelLabel(w)}</span></div>}
              </div>
            );
          })()}

          <div style={{ padding: "0 14px 16px" }}>
            <button onClick={() => setTab("record")} style={{ ...S.btnMain, fontSize: Math.round(21 * fs), padding: Math.round(19 * fs) }}>
              {Ic.Plus(Math.round(22 * fs))} {lang === "EN" ? "Record Today's BP" : "บันทึกความดันวันนี้"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ RECORD TAB ═══ */}
      {tab === "record" && (
        <div style={{ paddingTop: 16 }}>
          {editRecord && (
            <div style={{ margin: "0 14px 10px", background: "#fef9c3", borderRadius: 12, padding: "10px 14px", fontSize: Math.round(14 * fs), color: "#92400e", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{Ic.Edit(16)} {lang === "EN" ? "Editing" : "แก้ไข"}: {toThai(editRecord.date, lang)}</span>
              <button onClick={() => { setEditRecord(null); setForm(emptyForm); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9a3412", fontSize: 20 }}>✕</button>
            </div>
          )}

          <div style={S.card}>
            <Input label={`📅 ${t.date}`} type="date" value={form.date} onChange={setF("date")} scale={fs} />
            {(() => {
              const ex = records.find((r) => r.date === form.date);
              if (!ex) return <div style={{ marginTop: 10, fontSize: Math.round(14 * fs), color: "#94a3b8", background: "#f8fafc", borderRadius: 10, padding: "8px 12px" }}>{t.newDay}</div>;
              return (
                <div style={{ marginTop: 10, fontSize: Math.round(14 * fs), background: "#fefce8", borderRadius: 10, padding: "10px 12px", border: "1.5px solid #fde68a" }}>
                  <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 3 }}>{Ic.Edit(14)} {t.existingData}</div>
                  <div style={{ color: "#78350f", display: "flex", alignItems: "center", gap: 4 }}>
                    {ex.morningSys ? <span>{ex.morningSys}/{ex.morningDia}</span> : <span>–</span>}
                    <span style={{ margin: "0 6px" }}>·</span>
                    {ex.eveningSys ? <span>{ex.eveningSys}/{ex.eveningDia}</span> : <span>–</span>}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Morning */}
          <div style={{ ...S.card, borderTop: "4px solid #f59e0b" }}>
            <div style={{ ...S.secTitle, color: "#b45309" }}>
              <span style={{ color: "#f59e0b" }}>{Ic.Sun(Math.round(24 * fs))}</span> {t.morning}
              {mStatus && <span style={S.badge(mStatus)}>{bpLevelLabel(mStatus)}</span>}
            </div>
            <div style={{ marginBottom: Math.round(13 * fs) }}>
              <Input label={t.time} type="time" value={form.morningTime} onChange={setF("morningTime")} scale={fs} />
            </div>
            <div style={S.grid2}>
              <Input label={t.upper} type="number" value={form.morningSys} onChange={setF("morningSys")} placeholder="120" unit="mmHg" scale={fs} />
              <Input label={t.lower} type="number" value={form.morningDia} onChange={setF("morningDia")} placeholder="80" unit="mmHg" scale={fs} />
            </div>
            <div style={{ marginTop: Math.round(13 * fs) }}>
              <Input label={t.pulse} type="number" value={form.morningPulse} onChange={setF("morningPulse")} placeholder="75" unit="bpm" scale={fs} />
            </div>
          </div>

          {/* Evening */}
          <div style={{ ...S.card, borderTop: "4px solid #0284c7" }}>
            <div style={{ ...S.secTitle, color: "#0369a1" }}>
              <span style={{ color: "#0284c7" }}>{Ic.Moon(Math.round(24 * fs))}</span> {t.evening}
              {eStatus && <span style={S.badge(eStatus)}>{bpLevelLabel(eStatus)}</span>}
            </div>
            <div style={{ marginBottom: Math.round(13 * fs) }}>
              <Input label={t.time} type="time" value={form.eveningTime} onChange={setF("eveningTime")} scale={fs} />
            </div>
            <div style={S.grid2}>
              <Input label={t.upper} type="number" value={form.eveningSys} onChange={setF("eveningSys")} placeholder="120" unit="mmHg" scale={fs} />
              <Input label={t.lower} type="number" value={form.eveningDia} onChange={setF("eveningDia")} placeholder="80" unit="mmHg" scale={fs} />
            </div>
            <div style={{ marginTop: Math.round(13 * fs) }}>
              <Input label={t.pulse} type="number" value={form.eveningPulse} onChange={setF("eveningPulse")} placeholder="75" unit="bpm" scale={fs} />
            </div>
          </div>

          <div style={{ padding: `0 14px ${Math.round(16 * fs)}px` }}>
            <button onClick={submit} disabled={saving} style={S.btnMain}>{saving ? t.saving : t.save}</button>
          </div>

          {/* BP Level Guide */}
          <div style={S.card}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: Math.round(17 * fs), display: "flex", alignItems: "center", gap: 6 }}>
              {Ic.Chart(18)} {lang === "EN" ? "BP Level Guide" : "เกณฑ์ระดับความดัน"}
            </div>
            {[
              { labelTH: "ปกติ", labelEN: "Normal", range: "< 120/80", bg: "#dcfce7", fg: "#166534" },
              { labelTH: "สูงเล็กน้อย", labelEN: "Elevated", range: "120–129/< 80", bg: "#fef9c3", fg: "#854d0e" },
              { labelTH: "สูงระดับ 1", labelEN: "High Stage 1", range: "130–139/80–89", bg: "#ffedd5", fg: "#9a3412" },
              { labelTH: "สูงระดับ 2", labelEN: "High Stage 2", range: "≥ 140/≥ 90", bg: "#fee2e2", fg: "#991b1b" },
            ].map((s) => (
              <div key={s.labelTH} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ ...S.badge(s), minWidth: Math.round(110 * fs), textAlign: "center" }}>{lang === "EN" ? s.labelEN : s.labelTH}</span>
                <span style={{ color: "#475569", fontSize: Math.round(15 * fs) }}>{s.range} mmHg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {tab === "history" && (
        <div style={{ paddingTop: 16 }}>
          <div style={{ padding: `0 14px ${Math.round(12 * fs)}px`, display: "flex", gap: 10 }}>
            <button style={S.btnGhost} onClick={() => setTab("report")}>{Ic.Camera(Math.round(18 * fs))} {lang === "EN" ? "Report" : "รายงาน"}</button>
            {isPremium
              ? <button style={S.btnGhost} onClick={doPrint}>{Ic.Print(Math.round(18 * fs))} A4</button>
              : <button style={{ ...S.btnGhost, opacity: 0.5, borderColor: "#94a3b8", color: "#94a3b8" }} onClick={() => setShowUpgrade(true)}>{Ic.Lock(16)} A4</button>
            }
          </div>

          {/* Graph */}
          {records.length >= 2 && (isPremium ? (
            <div style={S.card}>
              <div style={{ fontWeight: 800, fontSize: Math.round(17 * fs), marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Chart(18)} {t.graph}</div>
              <BPGraph records={records} lang={lang} />
            </div>
          ) : (
            <div style={{ ...S.card, opacity: 0.8 }}>
              <div style={{ fontWeight: 700, fontSize: Math.round(15 * fs), color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Lock(16)} {t.graph}</div>
              <button onClick={() => setShowUpgrade(true)} style={{ ...S.btnMain, fontSize: Math.round(14 * fs), padding: 12, background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
                {Ic.Gem(16)} {t.upgrade}
              </button>
            </div>
          ))}

          {/* Health advice */}
          {rec && isPremium && (
            <div style={{ ...S.card, borderLeft: `5px solid ${rec.status?.bar || "#22c55e"}` }}>
              <div style={{ fontWeight: 800, fontSize: Math.round(17 * fs), marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Heart(18)} {t.advice}</div>
              <div style={{ fontSize: Math.round(14 * fs), color: "#475569", marginBottom: 8 }}>
                {lang === "EN" ? "7-day avg:" : "ค่าเฉลี่ย 7 วัน:"}{" "}
                <strong style={{ color: rec.status?.fg }}>{rec.avgS}/{rec.avgD} mmHg</strong>
                {rec.status && <span style={{ ...S.badge(rec.status), marginLeft: 8, fontSize: Math.round(12 * fs) }}>{bpLevelLabel(rec.status)}</span>}
              </div>
              {rec.tips[lang].map((tip, i) => (
                <div key={i} style={{ fontSize: Math.round(14 * fs), color: "#334155", padding: "6px 0", borderBottom: i < rec.tips[lang].length - 1 ? "1px solid #f1f5f9" : "" }}>{tip}</div>
              ))}
              <div style={{ fontSize: Math.round(12 * fs), color: "#94a3b8", marginTop: 8 }}>{t.ref}</div>
            </div>
          )}

          {/* Record list */}
          {records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: "#94a3b8" }}>
              <div style={{ color: "#cbd5e1", marginBottom: 14 }}>{Ic.List(60)}</div>
              <div style={{ fontWeight: 800, fontSize: Math.round(21 * fs) }}>{t.noData}</div>
              <div style={{ fontSize: Math.round(17 * fs), marginTop: 6 }}>{t.startRecord}</div>
            </div>
          ) : (
            [...records].reverse().map((r) => {
              const ms = bpStatus(r.morningSys, r.morningDia);
              const es = bpStatus(r.eveningSys, r.eveningDia);
              const worst = rank(ms) >= rank(es) ? (ms || es) : (es || ms);
              return (
                <div key={r.id} style={{ ...S.histCard, borderLeftColor: worst ? worst.bar : "#e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: Math.round(19 * fs) }}>{toThai(r.date, lang)}</div>
                      {worst && <span style={{ ...S.badge(worst), marginTop: 5, display: "inline-block" }}>{bpLevelLabel(worst)}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(r)} style={{ background: "#eff6ff", border: "none", borderRadius: 8, cursor: "pointer", padding: `${Math.round(4 * fs)}px ${Math.round(10 * fs)}px`, color: "#0284c7" }}>{Ic.Edit(Math.round(18 * fs))}</button>
                      <button onClick={() => setDeleteConfirm(r)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 4 }}>{Ic.X(Math.round(22 * fs))}</button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {r.morningSys ? (
                      <div style={{ background: "#fefce8", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: Math.round(12 * fs), color: "#92400e", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>{Ic.Sun(12)} {t.morning} {r.morningTime && `· ${r.morningTime}`}</div>
                        <div style={{ fontSize: Math.round(28 * fs), fontWeight: 800, lineHeight: 1.1 }}>{r.morningSys}<span style={{ fontSize: Math.round(17 * fs) }}>/{r.morningDia}</span></div>
                        <div style={{ fontSize: Math.round(13 * fs), color: "#64748b", marginTop: 3 }}>{Ic.Heart(12)} {r.morningPulse} bpm</div>
                      </div>
                    ) : (
                      <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <button onClick={() => openEdit(r)} style={{ background: "none", border: "2px dashed #cbd5e1", borderRadius: 10, padding: "8px 14px", color: "#94a3b8", fontSize: Math.round(13 * fs), cursor: "pointer", fontFamily: "Sarabun, sans-serif" }}>{t.editMorning}</button>
                      </div>
                    )}
                    {r.eveningSys ? (
                      <div style={{ background: "#eff6ff", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: Math.round(12 * fs), color: "#1d4ed8", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>{Ic.Moon(12)} {t.evening.split(" /")[0]} {r.eveningTime && `· ${r.eveningTime}`}</div>
                        <div style={{ fontSize: Math.round(28 * fs), fontWeight: 800, lineHeight: 1.1 }}>{r.eveningSys}<span style={{ fontSize: Math.round(17 * fs) }}>/{r.eveningDia}</span></div>
                        <div style={{ fontSize: Math.round(13 * fs), color: "#64748b", marginTop: 3 }}>{Ic.Heart(12)} {r.eveningPulse} bpm</div>
                      </div>
                    ) : (
                      <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <button onClick={() => openEdit(r)} style={{ background: "none", border: "2px dashed #cbd5e1", borderRadius: 10, padding: "8px 14px", color: "#94a3b8", fontSize: Math.round(13 * fs), cursor: "pointer", fontFamily: "Sarabun, sans-serif" }}>{t.editEvening}</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ REPORT TAB ═══ */}
      {tab === "report" && (
        <div style={{ paddingTop: 16 }}>
          <div style={{ padding: `0 14px ${Math.round(12 * fs)}px` }}>
            {isPremium ? (
              <>
                <button onClick={saveJPG} disabled={capturing} style={{ ...S.btnMain, background: capturing ? "#94a3b8" : "linear-gradient(135deg,#0f766e,#0d9488)", marginBottom: 10 }}>
                  {Ic.Camera(Math.round(20 * fs))} {capturing ? (lang === "EN" ? "Creating..." : "กำลังสร้าง...") : t.saveJPG}
                </button>
                <button onClick={doPrint} style={{ ...S.btnGhost, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {Ic.Print(Math.round(18 * fs))} {t.printA4}
                </button>
              </>
            ) : (
              <div style={{ background: "#f8fafc", borderRadius: 14, padding: 20, textAlign: "center", border: "2px dashed #e2e8f0" }}>
                <div style={{ color: "#94a3b8", marginBottom: 8 }}>{Ic.Lock(Math.round(32 * fs))}</div>
                <div style={{ fontWeight: 800, fontSize: Math.round(16 * fs), color: "#0f172a", marginBottom: 6 }}>
                  {lang === "EN" ? "JPG / PDF requires Full Version" : "บันทึก JPG / PDF เป็น Full Version"}
                </div>
                <button onClick={() => setShowUpgrade(true)} style={{ ...S.btnMain, fontSize: Math.round(16 * fs) }}>
                  {Ic.Gem(18)} {t.upgrade}
                </button>
              </div>
            )}
          </div>

          {/* Report table */}
          <div ref={reportRef} style={{ margin: "0 14px 14px", background: "white", borderRadius: 18, padding: Math.round(18 * fs), boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            <div style={{ borderBottom: "3px solid #0284c7", paddingBottom: 12, marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: Math.round(19 * fs), fontWeight: 800, color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {Ic.Heart(20)} {lang === "EN" ? "BP Report" : "รายงานความดันโลหิต"}
              </div>
              {patient.name && <div style={{ fontSize: Math.round(15 * fs), color: "#475569", marginTop: 4 }}>{patient.name}{patient.phone ? ` · ${patient.phone}` : ""}</div>}
              <div style={{ fontSize: Math.round(13 * fs), color: "#94a3b8", marginTop: 2 }}>
                {toThai(todayISO(), lang)} · {records.length} {lang === "EN" ? "records" : "รายการ"} · {APP_VERSION}
              </div>
            </div>

            {records.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: Math.round(17 * fs) }}>{t.noData}</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1.5px solid #e2e8f0", padding: "7px 8px", background: "#f0f9ff", fontSize: Math.round(12 * fs), textAlign: "left" }}>{t.date}</th>
                    <th colSpan={3} style={{ border: "1.5px solid #e2e8f0", padding: "7px 4px", background: "#fefce8", fontSize: Math.round(12 * fs), textAlign: "center" }}>{t.morning}</th>
                    <th colSpan={3} style={{ border: "1.5px solid #e2e8f0", padding: "7px 4px", background: "#eff6ff", fontSize: Math.round(12 * fs), textAlign: "center" }}>{t.evening.split(" /")[0]}</th>
                    <th style={{ border: "1.5px solid #e2e8f0", padding: "7px 4px", background: "#f0f9ff", fontSize: Math.round(12 * fs) }}>{lang === "EN" ? "Status" : "สถานะ"}</th>
                  </tr>
                  <tr>
                    <th style={{ border: "1.5px solid #e2e8f0", padding: "4px 8px" }} />
                    {[t.time, t.upper, t.lower, t.time, t.upper, t.lower].map((h, i) => (
                      <th key={i} style={{ border: "1.5px solid #e2e8f0", padding: "4px 5px", background: i < 3 ? "#fefce8" : "#eff6ff", fontSize: Math.round(11 * fs), fontWeight: 600 }}>{h}</th>
                    ))}
                    <th style={{ border: "1.5px solid #e2e8f0", padding: "4px 5px" }} />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const ms = bpStatus(r.morningSys, r.morningDia);
                    const es = bpStatus(r.eveningSys, r.eveningDia);
                    const w = rank(ms) >= rank(es) ? (ms || es) : (es || ms);
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 8px", fontWeight: 700, fontSize: Math.round(12 * fs), whiteSpace: "nowrap" }}>{toThai(r.date, lang)}</td>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 5px", textAlign: "center", fontSize: Math.round(11 * fs), color: "#92400e" }}>{r.morningTime || "–"}</td>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 5px", textAlign: "center", fontWeight: 800, fontSize: Math.round(14 * fs), color: ms ? ms.fg : "#1e293b" }}>{r.morningSys || "–"}</td>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 5px", textAlign: "center", fontWeight: 700, fontSize: Math.round(13 * fs) }}>{r.morningDia || "–"}</td>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 5px", textAlign: "center", fontSize: Math.round(11 * fs), color: "#1d4ed8" }}>{r.eveningTime || "–"}</td>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 5px", textAlign: "center", fontWeight: 800, fontSize: Math.round(14 * fs), color: es ? es.fg : "#1e293b" }}>{r.eveningSys || "–"}</td>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 5px", textAlign: "center", fontWeight: 700, fontSize: Math.round(13 * fs) }}>{r.eveningDia || "–"}</td>
                        <td style={{ border: "1.5px solid #e2e8f0", padding: "7px 4px", textAlign: "center" }}>
                          {w && <span style={{ ...S.badge(w), fontSize: Math.round(10 * fs), padding: "2px 5px" }}>{bpLevelLabel(w)}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ textAlign: "center", fontSize: Math.round(13 * fs), color: "#94a3b8", padding: `0 14px ${Math.round(18 * fs)}px`, lineHeight: 1.8 }}>
            {lang === "EN" ? "iOS: Share → Save Image · Android: Auto download" : "💡 iOS: กด Share → Save Image · Android: ดาวน์โหลดอัตโนมัติ"}
          </div>
        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {tab === "settings" && (
        <div style={{ paddingTop: 16 }}>
          {/* Patient info */}
          <div style={S.card}>
            <div style={{ fontWeight: 800, fontSize: Math.round(19 * fs), marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>{Ic.User(Math.round(20 * fs))} {t.patientInfo}</div>
            <div style={{ fontSize: Math.round(14 * fs), color: "#166534", background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              {Ic.Shield(14)} {lang === "EN" ? "Your data stays on this device only" : "ข้อมูลเก็บในมือถือนี้เท่านั้น"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: Math.round(13 * fs) }}>
              <Input label={t.name} value={patient.name} onChange={(v) => setPatient((p) => ({ ...p, name: v }))} placeholder={lang === "EN" ? "Your full name" : "ชื่อ-นามสกุล"} scale={fs} />
              <Input label={t.phone} type="tel" value={patient.phone} onChange={(v) => setPatient((p) => ({ ...p, phone: v }))} placeholder="0xx-xxx-xxxx" scale={fs} />
              <button onClick={() => { lsSet(KEY_PATIENT, patient); toast$(lang === "EN" ? "Saved" : "บันทึกแล้ว"); }} style={S.btnMain}>{Ic.Check(20)} {t.saveInfo}</button>
            </div>
          </div>

          {/* Font & Language */}
          <div style={S.card}>
            <div style={{ fontWeight: 800, fontSize: Math.round(19 * fs), marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>{Ic.Text(20)} {t.fontSize} & {t.language}</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: Math.round(15 * fs), fontWeight: 700, color: "#475569", marginBottom: 8 }}>{t.fontSize}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {[["small", t.small], ["medium", t.medium], ["large", t.large], ["xlarge", t.xlarge]].map(([val, label]) => (
                  <button key={val} onClick={() => changeFontScale(val)} style={{ padding: `${Math.round(10 * fs)}px 4px`, borderRadius: 10, border: `2px solid ${fontScale === val ? "#0284c7" : "#e2e8f0"}`, background: fontScale === val ? "#eff6ff" : "white", color: fontScale === val ? "#0284c7" : "#64748b", fontSize: Math.round(13 * fs) * FS[val], fontWeight: 700, fontFamily: "Sarabun, sans-serif", cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: Math.round(15 * fs), fontWeight: 700, color: "#475569", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Globe(16)} {t.language}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["TH", "🇹🇭 ภาษาไทย"], ["EN", "🇬🇧 English"]].map(([val, label]) => (
                  <button key={val} onClick={() => changeLang(val)} style={{ padding: `${Math.round(13 * fs)}px`, borderRadius: 12, border: `2px solid ${lang === val ? "#0284c7" : "#e2e8f0"}`, background: lang === val ? "#eff6ff" : "white", color: lang === val ? "#0284c7" : "#64748b", fontSize: Math.round(15 * fs), fontWeight: 700, fontFamily: "Sarabun, sans-serif", cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trial / Unlock status */}
          {!isUnlocked ? (
            <div style={{ ...S.card, borderLeft: "5px solid #f59e0b", background: "#fffbeb" }}>
              <div style={{ fontWeight: 800, fontSize: Math.round(19 * fs), marginBottom: 6, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>{Ic.Hourglass(20)} {t.trial}</div>
              <div style={{ fontSize: Math.round(15 * fs), color: "#713f12", marginBottom: 12 }}>
                {lang === "EN" ? "Used" : "ใช้ไป"} <strong>{daysUsed}</strong> {lang === "EN" ? "days" : "วัน"} · {lang === "EN" ? "Left" : "เหลือ"}{" "}
                <strong style={{ fontSize: Math.round(21 * fs), color: "#ef4444" }}>{trialLeft}</strong> {t.daysLeft}
              </div>
              {adminCfg.phone && (
                <div style={{ fontSize: Math.round(14 * fs), color: "#92400e", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Phone(14)} {adminCfg.phone}</div>
              )}
              <button onClick={() => setShowUpgrade(true)} style={{ ...S.btnMain, background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>{Ic.Gem(20)} {t.upgrade}</button>
            </div>
          ) : (
            <div style={{ ...S.card, borderLeft: "5px solid #22c55e" }}>
              <div style={{ fontWeight: 800, fontSize: Math.round(19 * fs), color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>{Ic.Gem(20)} {t.fullVer} ✓</div>
            </div>
          )}

          {/* Backup section */}
          <div style={{ ...S.card, borderTop: "4px solid #7c3aed" }}>
            <div style={{ fontWeight: 800, fontSize: Math.round(19 * fs), marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>{Ic.Cloud(20)} Backup</div>
            <div style={{ fontSize: Math.round(13 * fs), color: "#64748b", marginBottom: 14 }}>{lang === "EN" ? "Back up weekly to protect your data" : "แนะนำให้ backup ทุกสัปดาห์"}</div>

            {/* Test connection */}
            <div style={{ background: "#f0f9ff", borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: Math.round(15 * fs), color: "#0369a1", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Chart(16)} {lang === "EN" ? "Test Connection" : "ทดสอบการเชื่อมต่อ"}</div>
              <button onClick={testBackup} style={{ ...S.btnMain, background: "linear-gradient(135deg,#0369a1,#0284c7)", fontSize: Math.round(16 * fs) }}>
                {Ic.Shield(18)} {lang === "EN" ? "Test Backup" : "ทดสอบ Backup"}
              </button>
              {testResult && !testResult.testing && (
                <div style={{ marginTop: 10, fontSize: Math.round(13 * fs), lineHeight: 2 }}>
                  <div style={{ color: testResult.devOk ? "#166534" : "#991b1b" }}>{testResult.devOk ? "✅" : "❌"} {lang === "EN" ? "Device backup" : "Backup เครื่อง"}</div>
                  <div style={{ color: testResult.sheetOk ? "#166534" : "#991b1b" }}>{testResult.sheetOk ? "✅" : "❌"} Google Sheets</div>
                </div>
              )}
            </div>

            {/* Device backup */}
            <div style={{ background: "#faf5ff", borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: Math.round(15 * fs), color: "#7c3aed", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Download(16)} {lang === "EN" ? "Save to Device (.json)" : "บันทึกในเครื่อง (.json)"}</div>
              <button onClick={exportBackup} style={{ ...S.btnMain, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", fontSize: Math.round(16 * fs) }}>
                {Ic.Download(18)} {t.backupDevice}
              </button>
              {lastBackup && <div style={{ marginTop: 8, fontSize: Math.round(12 * fs), color: "#7c3aed", textAlign: "center" }}>{Ic.Tag(12)} {lastBackup}</div>}
            </div>

            {/* Google Sheets backup */}
            <div style={{ background: "#f0fdf4", borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: Math.round(15 * fs), color: "#059669", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Upload(16)} Google Sheets ({records.length})</div>
              {isPremium ? (
                <>
                  <button onClick={backupToSheet} disabled={syncing} style={{ ...S.btnMain, background: "linear-gradient(135deg,#059669,#047857)", fontSize: Math.round(16 * fs) }}>
                    {Ic.Upload(18)} {syncing ? (lang === "EN" ? "Uploading..." : "กำลังอัปโหลด...") : t.backupSheets}
                  </button>
                  {lastSheetSync && <div style={{ marginTop: 8, fontSize: Math.round(12 * fs), color: "#059669", textAlign: "center" }}>{Ic.Tag(12)} {lastSheetSync}</div>}
                </>
              ) : (
                <button onClick={() => setShowUpgrade(true)} style={{ ...S.btnMain, background: "linear-gradient(135deg,#0f172a,#1e3a5f)", fontSize: Math.round(16 * fs) }}>
                  {Ic.Lock(16)} {lang === "EN" ? "Cloud Backup — Full Version" : "Backup Cloud — Full Version"}
                </button>
              )}
            </div>

            {/* Import backup */}
            <div style={{ background: "#fff7ed", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: Math.round(15 * fs), color: "#c2410c", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>{Ic.Upload(16)} {lang === "EN" ? "Restore (.json)" : "นำเข้าข้อมูล (.json)"}</div>
              <label style={{ ...S.btnGhost, display: "flex", cursor: "pointer", borderColor: "#c2410c", color: "#c2410c", border: "2px solid #c2410c", borderRadius: 12, padding: Math.round(14 * fs), justifyContent: "center", alignItems: "center", gap: 6, fontFamily: "Sarabun, sans-serif", fontSize: Math.round(16 * fs), fontWeight: 700 }}>
                {Ic.Upload(18)} {lang === "EN" ? "Select backup file" : "เลือกไฟล์สำรอง"}
                <input type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          {/* Sheets status */}
          {(() => {
            const cfg = {
              unknown: { border: "#94a3b8", bg: "#f8fafc", icon: Ic.Info, title: t.sheetUnknown, sub: lang === "EN" ? "Save a record or test backup to check" : "บันทึกข้อมูลหรือทดสอบ Backup เพื่อตรวจสอบ" },
              ok:      { border: "#22c55e", bg: "#f0fdf4", icon: Ic.Check, title: t.sheetConnected, sub: lang === "EN" ? "Syncs automatically on each save" : "ซิงค์อัตโนมัติทุกครั้งที่บันทึก" },
              error:   { border: "#ef4444", bg: "#fef2f2", icon: Ic.Warn, title: t.sheetDisconnected, sub: lang === "EN" ? "Check Apps Script deployment" : "ตรวจสอบ Apps Script / Deploy ใหม่" },
            }[sheetStatus];
            return (
              <div style={{ ...S.card, borderLeft: `5px solid ${cfg.border}`, background: cfg.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: sheetStatus === "ok" ? "#22c55e" : sheetStatus === "error" ? "#ef4444" : "#94a3b8" }}>{cfg.icon(20)}</span>
                  <div style={{ fontWeight: 800, fontSize: Math.round(16 * fs), color: sheetStatus === "ok" ? "#166534" : sheetStatus === "error" ? "#991b1b" : "#64748b" }}>{cfg.title}</div>
                </div>
                <div style={{ fontSize: Math.round(14 * fs), color: "#475569" }}>{cfg.sub}</div>
                {lastSheetSync && sheetStatus === "ok" && (
                  <div style={{ fontSize: Math.round(12 * fs), color: "#22c55e", marginTop: 4 }}>{Ic.Tag(12)} {lastSheetSync}</div>
                )}
              </div>
            );
          })()}

          {/* Version */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: Math.round(17 * fs), display: "flex", alignItems: "center", gap: 6 }}>{Ic.Tag(18)} {t.version} {APP_VERSION}</div>
                <div style={{ fontSize: Math.round(14 * fs), color: "#64748b", marginTop: 4 }}>{t.updatedAt} {BUILD_DATE}</div>
                <div style={{ fontSize: Math.round(12 * fs), color: "#94a3b8", marginTop: 2 }}>
                  {lang === "EN" ? "Tap version in header 5x = Admin" : "แตะ version ที่ header 5 ครั้ง = Admin"}
                </div>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={S.card}>
            <button onClick={() => setShowDeleteZone((v) => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "Sarabun, sans-serif", fontSize: Math.round(14 * fs), color: "#94a3b8", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
              {Ic.Warn(14)} {showDeleteZone ? t.hideAdvanced : t.advanced}
            </button>
            {showDeleteZone && (
              <div style={{ marginTop: 14, borderTop: "2px dashed #fee2e2", paddingTop: 14 }}>
                <div style={{ fontWeight: 800, fontSize: Math.round(17 * fs), marginBottom: 6, color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>{Ic.Warn(18)} {t.deleteAll}</div>
                <div style={{ fontSize: Math.round(13 * fs), color: "#64748b", marginBottom: 10 }}>
                  {lang === "EN" ? "Please backup first — cannot be undone" : "แนะนำ backup ก่อน — ไม่สามารถกู้คืนได้"}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(lang === "EN" ? "Delete all data? Cannot undo." : "ยืนยันลบทั้งหมด?")) {
                      setRecords([]);
                      lsSet(KEY_RECORDS, []);
                      toast$(lang === "EN" ? "Deleted all" : "ล้างข้อมูลแล้ว");
                    }
                  }}
                  style={{ width: "100%", padding: Math.round(14 * fs), borderRadius: 12, border: "2px solid #ef4444", background: "white", color: "#ef4444", fontSize: Math.round(17 * fs), fontWeight: 700, fontFamily: "Sarabun, sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {Ic.Trash(18)} {t.deleteAll}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB BAR ═══ */}
      <div style={S.tabBar}>
        {[
          { id: "home", icon: Ic.Home, label: t.home },
          { id: "record", icon: Ic.Plus, label: t.record },
          { id: "history", icon: Ic.List, label: t.history },
          { id: "report", icon: Ic.Camera, label: t.report },
          { id: "settings", icon: Ic.Gear, label: t.settings },
        ].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} style={S.tabItem(tab === item.id)}>
            <span style={{ color: tab === item.id ? "#0284c7" : "#94a3b8" }}>{item.icon(Math.round(23 * fs))}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
