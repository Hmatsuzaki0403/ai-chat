import { NextRequest, NextResponse } from "next/server";
import { classify } from "@/lib/classify";
import { checkRateLimit, serialize, validateMessage } from "@/lib/guard";
import { UI, type Lang } from "@/lib/i18n";
import { generateAnswer } from "@/lib/llm";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_LANGS = new Set<Lang>([
  "ja", "en", "zh-hk", "yue", "es", "ko", "fr", "th",
]);

export async function POST(req: NextRequest) {
  let lang: Lang = "ja";
  const store = getStore();
  try {
    const body = await req.json().catch(() => ({}));
    if (VALID_LANGS.has(body?.lang)) lang = body.lang as Lang;
    const ui = UI[lang];

    // 1) 入力バリデーション（400系はユーザー起因。統計にもエラーにも数えない）
    const v = validateMessage(body?.message);
    if (!v.ok) {
      return NextResponse.json(
        {
          ok: false,
          userError: true,
          error: v.reason === "too_long" ? ui.errTooLong : ui.errBusy,
        },
        { status: 400 }
      );
    }

    // 2) レートリミット
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, userError: true, error: ui.errRateLimit },
        { status: 429 }
      );
    }

    // 3) 分類（応答生成から独立。絶対に失敗しない）
    const category = classify(v.message);

    // 4) 応答生成（同一IPは直列化。リトライ→フォールバックで必ず返る）
    const result = await serialize(ip, () => generateAnswer(v.message, lang));

    // 5) 統計: 成功応答のみ集計（フォールバック応答も「返せた」ので集計する）
    await store.recordOk(category, lang);

    return NextResponse.json({
      ok: true,
      reply: result.text,
      category,
      degraded: result.degraded,
    });
  } catch (err) {
    // ここに来るのは想定外の障害のみ。エラーは別カウンタへ（ファン向け統計を汚さない）
    await store.recordError();
    console.error("[chat] unexpected error:", err);
    return NextResponse.json(
      { ok: false, userError: false, error: UI[lang].errBusy },
      { status: 200 } // クライアントには構造化エラーとして返し、5xxは見せない
    );
  }
}
