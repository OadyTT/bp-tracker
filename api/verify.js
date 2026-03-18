// api/verify.js
// Vercel Serverless Function — รหัสเก็บใน Environment Variables ฝั่ง Server
// ไม่มีรหัสในโค้ด client เลย

export default function handler(req, res) {
  // อนุญาต CORS จาก domain ของเรา
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { type, code } = req.body;

  // รหัสเก็บใน Vercel Environment Variables
  // ตั้งค่าที่ vercel.com → Project → Settings → Environment Variables
  const UNLOCK_CODE = process.env.UNLOCK_CODE || "BP2024FREE";
  const ADMIN_PASS  = process.env.ADMIN_PASS  || "admin1234";

  if (type === "unlock") {
    const valid = code === UNLOCK_CODE;
    return res.status(200).json({ ok: valid });
  }

  if (type === "admin") {
    const valid = code === ADMIN_PASS;
    return res.status(200).json({ ok: valid });
  }

  return res.status(400).json({ ok: false, error: "Unknown type" });
}
