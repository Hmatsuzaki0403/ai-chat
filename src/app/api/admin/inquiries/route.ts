// LESSON 2-6: 管理者用API — 問い合わせ一覧（会員情報つき）+ 地域別集計
// 認証: リクエストヘッダー x-admin-key が環境変数 ADMIN_KEY と一致した時だけ応答する。
// フィルタ: category / lang / country / region / from / to（日付）

import { NextRequest, NextResponse } from "next/server";
import { sb, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

type Row = {
  id: string;
  message: string;
  category: string;
  lang: string;
  created_at: string;
  members: {
    name: string | null;
    country: string | null;
    region: string | null;
  } | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// 記号による攻撃を防ぐ簡易ガード（カンマ・括弧・アスタリスク等を拒否）
const SAFE_RE = /^[^,()*&=<>%]{1,50}$/;

export async function GET(req: NextRequest) {
  try {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
      return NextResponse.json({ ok: false, error: "not_configured" });
    }
    if (req.headers.get("x-admin-key") !== adminKey) {
      // 管理者だけ閲覧: キー不一致は一律拒否
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    if (!supabaseConfigured()) {
      return NextResponse.json({ ok: false, error: "not_configured" });
    }

    const p = req.nextUrl.searchParams;
    const filters: string[] = [];

    const category = p.get("category");
    if (category && ["question", "complaint", "request", "other"].includes(category)) {
      filters.push(`category=eq.${category}`);
    }
    const lang = p.get("lang");
    if (lang && /^[a-z-]{2,8}$/.test(lang)) {
      filters.push(`lang=eq.${lang}`);
    }
    const country = p.get("country");
    if (country && /^[a-z]{2,10}$/.test(country)) {
      filters.push(`members.country=eq.${country}`);
    }
    const region = p.get("region");
    if (region && SAFE_RE.test(region)) {
      filters.push(`members.region=ilike.${encodeURIComponent(`*${region}*`)}`);
    }
    const from = p.get("from");
    if (from && DATE_RE.test(from)) {
      filters.push(`created_at=gte.${from}T00:00:00Z`);
    }
    const to = p.get("to");
    if (to && DATE_RE.test(to)) {
      filters.push(`created_at=lte.${to}T23:59:59Z`);
    }

    // members!inner で会員情報を結合（国・地域フィルタも会員側の列に効く）
    const query =
      `select=id,message,category,lang,created_at,members!inner(name,country,region)` +
      (filters.length ? `&${filters.join("&")}` : "") +
      `&order=created_at.desc&limit=200`;

    const rows = (await sb.select("inquiries", query)) as Row[];

    // 地域別集計（国別 + 国内の地域別）
    const byCountry: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    for (const r of rows) {
      const c = r.members?.country ?? "unknown";
      const rg = `${c} / ${r.members?.region ?? "?"}`;
      byCountry[c] = (byCountry[c] ?? 0) + 1;
      byRegion[rg] = (byRegion[rg] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      byCountry,
      byRegion,
      inquiries: rows,
    });
  } catch (err) {
    console.error("[admin/inquiries]", err);
    return NextResponse.json({ ok: false, error: "server" });
  }
}
