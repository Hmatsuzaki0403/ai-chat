import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getStore().snapshot();
  // ファン向けダッシュボードには成功統計のみ。systemErrors は運用者確認用に別枠で返す。
  return NextResponse.json(snap);
}
