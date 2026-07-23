// LESSON 2-4: 会話形式登録の保存API
// GET  ?id=<memberId>            → 現在のプロフィール（途中再開用）
// POST {id, field, value}        → 1項目だけ即保存

import { NextRequest, NextResponse } from "next/server";
import { sb, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FIELDS = ["country", "region", "gender", "birth_year"] as const;
type Field = (typeof FIELDS)[number];

const COUNTRIES = ["jp", "hk", "tw", "kr", "us", "es", "fr", "th", "other"];
const GENDERS = ["male", "female", "other", "no_answer"];

function validate(field: Field, value: unknown): string | number | null {
  if (field === "country") {
    return typeof value === "string" && COUNTRIES.includes(value) ? value : null;
  }
  if (field === "region") {
    if (typeof value !== "string") return null;
    const v = value.trim().slice(0, 50);
    return v.length >= 1 ? v : null;
  }
  if (field === "gender") {
    return typeof value === "string" && GENDERS.includes(value) ? value : null;
  }
  if (field === "birth_year") {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1900 && n <= 2020 ? n : null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "not_configured" });
    }
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ ok: false, error: "bad_id" });
    }
    const rows = (await sb.select(
      "members",
      `id=eq.${id}&select=country,region,gender,birth_year,profile_completed_at`
    )) as Record<string, unknown>[];
    if (!rows[0]) return NextResponse.json({ ok: false, error: "not_found" });
    return NextResponse.json({ ok: true, profile: rows[0] });
  } catch (err) {
    console.error("[profile GET]", err);
    return NextResponse.json({ ok: false, error: "server" });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "not_configured" });
    }
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "");
    const field = String(body?.field ?? "") as Field;
    if (!UUID_RE.test(id) || !FIELDS.includes(field)) {
      return NextResponse.json({ ok: false, error: "bad_request" });
    }
    const value = validate(field, body?.value);
    if (value === null) {
      return NextResponse.json({ ok: false, error: "bad_value" });
    }
    const patch: Record<string, unknown> = { [field]: value };
    // 最後の質問（生まれた年）を保存したら完了時刻を記録
    if (field === "birth_year") {
      patch.profile_completed_at = new Date().toISOString();
    }
    await sb.update("members", `id=eq.${id}`, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile POST]", err);
    return NextResponse.json({ ok: false, error: "server" });
  }
}
