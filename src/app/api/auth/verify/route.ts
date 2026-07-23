import { NextRequest, NextResponse } from "next/server";
import { normalizePhone, verifyCode } from "@/lib/otp";
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
    const code = String(body?.code ?? "").trim();
    const name =
      typeof body?.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 50)
        : undefined;
    if (!phone || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 200 }
      );
    }
    const result = await verifyCode(phone, code, name);
    return NextResponse.json({ ...result, phone });
  } catch (err) {
    console.error("[auth/verify]", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 200 });
  }
}
