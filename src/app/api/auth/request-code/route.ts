import { NextRequest, NextResponse } from "next/server";
import { normalizePhone, requestCode } from "@/lib/otp";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!supabaseConfigured()) {
      return NextResponse.json(
        { ok: false, error: "not_configured" },
        { status: 200 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone(String(body?.phone ?? ""));
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "bad_phone" },
        { status: 200 }
      );
    }
    const result = await requestCode(phone);
    return NextResponse.json({ ...result, phone });
  } catch (err) {
    console.error("[auth/request-code]", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 200 });
  }
}
