// api/verify.js — v2.1.0
// Handles: trial_register, trial_check, unlock (device-bound), gen_code, admin
const crypto = require("crypto");

const hmacHex = (data, secret) =>
  crypto.createHmac("sha256", secret).update(String(data)).digest("hex");

const TRIAL_DAYS_DEFAULT = 60;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { type, code, deviceId, token, adminPass } = req.body || {};
  const TRIAL_SECRET = process.env.TRIAL_SECRET || "bp-trial-secret-fallback";
  const ADMIN_PASS   = process.env.ADMIN_PASS   || "";
  const TRIAL_DAYS   = parseInt(process.env.TRIAL_DAYS || TRIAL_DAYS_DEFAULT, 10);

  // ── trial_register ─────────────────────────────
  if (type === "trial_register") {
    if (!deviceId) return res.json({ ok: false, msg: "no deviceId" });
    const issued  = Date.now();
    const payload = `${deviceId}:${issued}:${TRIAL_DAYS}`;
    const sig     = hmacHex(payload, TRIAL_SECRET).slice(0, 32);
    const newToken = Buffer.from(
      JSON.stringify({ deviceId, issued, days: TRIAL_DAYS, sig })
    ).toString("base64");
    return res.json({ ok: true, token: newToken, daysLeft: TRIAL_DAYS, daysUsed: 0, expired: false });
  }

  // ── trial_check ────────────────────────────────
  if (type === "trial_check") {
    if (!deviceId || !token) return res.json({ ok: false });
    try {
      const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
      if (parsed.deviceId !== deviceId) return res.json({ ok: false, tampered: true });
      const payload  = `${parsed.deviceId}:${parsed.issued}:${parsed.days}`;
      const expected = hmacHex(payload, TRIAL_SECRET).slice(0, 32);
      if (parsed.sig !== expected) return res.json({ ok: false, tampered: true });
      const daysUsed = Math.floor((Date.now() - parsed.issued) / 86_400_000);
      const daysLeft = Math.max(0, parsed.days - daysUsed);
      return res.json({ ok: true, daysLeft, daysUsed, expired: daysLeft === 0 });
    } catch {
      return res.json({ ok: false });
    }
  }

  // ── unlock (device-bound HMAC) ─────────────────
  // Code = HMAC(deviceId, TRIAL_SECRET).slice(0,8).toUpperCase()
  if (type === "unlock") {
    if (!deviceId || !code) return res.json({ ok: false });
    const expected = hmacHex(deviceId, TRIAL_SECRET).slice(0, 8).toUpperCase();
    return res.json({ ok: code.toUpperCase() === expected });
  }

  // ── gen_code (admin → generate device unlock code) ─
  if (type === "gen_code") {
    if (!ADMIN_PASS || adminPass !== ADMIN_PASS)
      return res.json({ ok: false, msg: "unauthorized" });
    if (!deviceId) return res.json({ ok: false, msg: "no deviceId" });
    const generatedCode = hmacHex(deviceId, TRIAL_SECRET).slice(0, 8).toUpperCase();
    return res.json({ ok: true, code: generatedCode });
  }

  // ── admin auth ─────────────────────────────────
  if (type === "admin") {
    return res.json({ ok: !!ADMIN_PASS && code === ADMIN_PASS });
  }

  return res.json({ ok: false, msg: "unknown type" });
}
