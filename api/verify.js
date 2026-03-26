// api/verify.js — Vercel Serverless Function v1.7.2
// รหัสทุกอย่างอยู่ใน Environment Variables ฝั่ง Server เท่านั้น
// ตั้งค่าที่ Vercel → Settings → Environment Variables:
//   UNLOCK_CODE  = รหัสปลดล็อค Full Version
//   ADMIN_PASS   = รหัสผ่าน Admin Panel
//   TRIAL_SECRET = ข้อความลับสำหรับ sign trial token (ตั้งอะไรก็ได้ เช่น "bp-secret-2024")

import crypto from "crypto";

const TRIAL_DAYS  = 60;
const SECRET      = process.env.TRIAL_SECRET || "bp-default-secret-change-me";

// สร้าง HMAC signature เพื่อ sign install date
function sign(deviceId, installTs) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${deviceId}:${installTs}`)
    .digest("hex")
    .slice(0, 32);
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { type, code, deviceId, token, installTs } = req.body || {};

  // ── 1. ตรวจสอบรหัสปลดล็อค ──────────────────────────
  if (type === "unlock") {
    const valid = code === (process.env.UNLOCK_CODE || "BP2024FREE");
    return res.json({ ok: valid });
  }

  // ── 2. ตรวจสอบรหัส Admin ───────────────────────────
  if (type === "admin") {
    const valid = code === (process.env.ADMIN_PASS || "admin1234");
    return res.json({ ok: valid });
  }

  // ── 3. ลงทะเบียน Trial ─────────────────────────────
  // Client ส่ง deviceId มา → Server สร้าง signed token พร้อม installTs
  // Client เก็บ token นี้ไว้ → ถ้าแก้ installTs ใน localStorage จะ invalid
  if (type === "trial_register") {
    if (!deviceId) return res.json({ ok: false, error: "missing deviceId" });
    const ts  = Date.now();
    const sig = sign(deviceId, ts);
    const tok = `${ts}.${sig}`;
    return res.json({ ok: true, token: tok, installTs: ts });
  }

  // ── 4. ตรวจสอบ Trial ────────────────────────────────
  // Client ส่ง deviceId + token → Server ตรวจ signature และคำนวณวันเหลือ
  if (type === "trial_check") {
    if (!deviceId || !token) return res.json({ ok: false, expired: true, daysLeft: 0 });
    try {
      const [tsStr, sig] = token.split(".");
      const ts = parseInt(tsStr, 10);
      if (isNaN(ts)) return res.json({ ok: false, expired: true, daysLeft: 0 });

      const expected = sign(deviceId, ts);
      if (sig !== expected) {
        // Token ถูกแก้ไข → ถือว่า expired ทันที
        return res.json({ ok: false, expired: true, daysLeft: 0, tampered: true });
      }

      const daysUsed = Math.floor((Date.now() - ts) / 86400000);
      const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed);
      return res.json({ ok: true, daysLeft, daysUsed, expired: daysLeft === 0 });
    } catch {
      return res.json({ ok: false, expired: true, daysLeft: 0 });
    }
  }

  return res.status(400).json({ ok: false, error: "unknown type" });
}
