// LESSON 2-3: SMS認証（OTP）のコアロジック
// - コードは6桁・有効期限60秒
// - 照合5回失敗で10分ロック
// - 送信は60秒に1回まで & 10分間に5回まで（連続送信の上限）
// - データベースにはコードそのものではなくハッシュのみ保存（ハッシュ保存）

import { createHash, randomInt } from "node:crypto";
import { sb } from "./supabase";

const CODE_TTL_MS = 60_000; // 有効期限60秒
const MAX_VERIFY_ATTEMPTS = 5; // 5回失敗でロック
const LOCK_MS = 10 * 60_000; // ロック時間10分
const RESEND_INTERVAL_MS = 60_000; // 再送は60秒に1回
const SEND_WINDOW_MS = 10 * 60_000; // 送信回数の集計窓
const MAX_SENDS_PER_WINDOW = 5; // 窓内の送信上限

type OtpRow = {
  phone: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  locked_until: string | null;
  send_count: number;
  window_started_at: string;
  last_sent_at: string;
};

function secret(): string {
  return process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
}

function hashCode(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}:${secret()}`).digest("hex");
}

// 日本の番号を +81 形式へ正規化（例: 090-1234-5678 → +819012345678）
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  const only = digits.replace(/\D/g, "");
  if (/^0\d{9,10}$/.test(only)) return "+81" + only.slice(1);
  return null;
}

async function getRow(phone: string): Promise<OtpRow | null> {
  const rows = (await sb.select(
    "otp_codes",
    `phone=eq.${encodeURIComponent(phone)}&select=*`
  )) as OtpRow[];
  return rows[0] ?? null;
}

// ---- SMS送信（Twilio設定済みなら実配信 / 未設定なら開発モード） ----
async function sendSms(phone: string, code: string): Promise<{ dev: boolean }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (sid && token && from) {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phone,
          From: from,
          Body: `【GACKT CONCIERGE】認証コード: ${code}（60秒間有効）`,
        }),
      }
    );
    if (!res.ok) throw new Error(`Twilio ${res.status}`);
    return { dev: false };
  }
  // 開発モード: 実際には送らない（コードは呼び出し元が画面に表示する）
  return { dev: true };
}

export type RequestResult =
  | { ok: true; dev: boolean; devCode?: string }
  | { ok: false; error: "locked" | "too_soon" | "send_limit"; waitSec?: number };

export async function requestCode(phone: string): Promise<RequestResult> {
  const now = Date.now();
  const row = await getRow(phone);

  if (row?.locked_until && new Date(row.locked_until).getTime() > now) {
    return {
      ok: false,
      error: "locked",
      waitSec: Math.ceil((new Date(row.locked_until).getTime() - now) / 1000),
    };
  }

  let sendCount = 0;
  let windowStart = now;
  if (row) {
    const ws = new Date(row.window_started_at).getTime();
    if (now - ws < SEND_WINDOW_MS) {
      sendCount = row.send_count;
      windowStart = ws;
      if (sendCount >= MAX_SENDS_PER_WINDOW) {
        return {
          ok: false,
          error: "send_limit",
          waitSec: Math.ceil((ws + SEND_WINDOW_MS - now) / 1000),
        };
      }
      const last = new Date(row.last_sent_at).getTime();
      if (now - last < RESEND_INTERVAL_MS) {
        return {
          ok: false,
          error: "too_soon",
          waitSec: Math.ceil((last + RESEND_INTERVAL_MS - now) / 1000),
        };
      }
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sb.upsert(
    "otp_codes",
    {
      phone,
      code_hash: hashCode(phone, code),
      expires_at: new Date(now + CODE_TTL_MS).toISOString(),
      attempts: 0,
      locked_until: null,
      send_count: sendCount + 1,
      window_started_at: new Date(windowStart).toISOString(),
      last_sent_at: new Date(now).toISOString(),
    },
    "phone"
  );

  const sent = await sendSms(phone, code);
  return sent.dev ? { ok: true, dev: true, devCode: code } : { ok: true, dev: false };
}

export type VerifyResult =
  | { ok: true; memberId: string }
  | {
      ok: false;
      error: "locked" | "expired" | "invalid" | "not_found";
      remaining?: number;
      waitSec?: number;
    };

export async function verifyCode(
  phone: string,
  code: string,
  name?: string
): Promise<VerifyResult> {
  const now = Date.now();
  const row = await getRow(phone);
  if (!row) return { ok: false, error: "not_found" };

  if (row.locked_until && new Date(row.locked_until).getTime() > now) {
    return {
      ok: false,
      error: "locked",
      waitSec: Math.ceil((new Date(row.locked_until).getTime() - now) / 1000),
    };
  }

  if (new Date(row.expires_at).getTime() < now) {
    return { ok: false, error: "expired" };
  }

  if (hashCode(phone, code) !== row.code_hash) {
    const attempts = row.attempts + 1;
    if (attempts >= MAX_VERIFY_ATTEMPTS) {
      await sb.update("otp_codes", `phone=eq.${encodeURIComponent(phone)}`, {
        attempts,
        locked_until: new Date(now + LOCK_MS).toISOString(),
      });
      return { ok: false, error: "locked", waitSec: LOCK_MS / 1000 };
    }
    await sb.update("otp_codes", `phone=eq.${encodeURIComponent(phone)}`, {
      attempts,
    });
    return {
      ok: false,
      error: "invalid",
      remaining: MAX_VERIFY_ATTEMPTS - attempts,
    };
  }

  // 成功: 使用済みコードを破棄し、会員名簿に登録（既存ならそのまま）
  await sb.delete("otp_codes", `phone=eq.${encodeURIComponent(phone)}`);
  const members = (await sb.upsert(
    "members",
    name ? { phone, name } : { phone },
    "phone"
  )) as { id: string }[];
  return { ok: true, memberId: members[0]?.id ?? "" };
}
