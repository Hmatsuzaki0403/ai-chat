// LESSON 2-5: 質問・クレーム受付API（会員とひもづけ + 自動分類）
// POST {memberId, message, lang} → 分類して inquiries に保存
// GET  ?id=<memberId>            → 本人の問い合わせ履歴

import { NextRequest, NextResponse } from "next/server";
import { classifyContact } from "@/lib/classify";
import { sb, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LEN = 1000;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "not_configured" });
    }
    const body = await req.json().catch(() => ({}));
    const memberId = String(body?.memberId ?? "");
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const lang = typeof body?.lang === "string" ? body.lang.slice(0, 8) : "ja";
    if (!UUID_RE.test(memberId)) {
      return NextResponse.json({ ok: false, error: "bad_member" });
    }
    if (!message || message.length > MAX_LEN) {
      return NextResponse.json({ ok: false, error: "bad_message" });
    }

    // 会員が実在するか確認（ひもづけの整合性）
    const members = (await sb.select(
      "members",
      `id=eq.${memberId}&select=id`
    )) as { id: string }[];
    if (!members[0]) {
      return NextResponse.json({ ok: false, error: "bad_member" });
    }

    // コース1のAI分類を再利用（決定的・絶対に失敗しない）
    const category = classifyContact(message);

    const rows = (await sb.insert("inquiries", {
      member_id: memberId,
      message,
      category,
      lang,
    })) as { id: string; created_at: string }[];

    return NextResponse.json({
      ok: true,
      category,
      id: rows[0]?.id,
      created_at: rows[0]?.created_at,
    });
  } catch (err) {
    console.error("[inquiries POST]", err);
    return NextResponse.json({ ok: false, error: "server" });
  }
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
    const rows = await sb.select(
      "inquiries",
      `member_id=eq.${id}&select=id,message,category,created_at&order=created_at.asc&limit=50`
    );
    return NextResponse.json({ ok: true, inquiries: rows });
  } catch (err) {
    console.error("[inquiries GET]", err);
    return NextResponse.json({ ok: false, error: "server" });
  }
}
