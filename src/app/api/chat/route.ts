import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const LANGUAGE_NAMES: Record<string, string> = {
  ja: "日本語",
  en: "English",
  "zh-TW": "繁體中文（台湾式繁体字）",
  yue: "廣東話（広東語）",
  es: "Español",
  ko: "한국어",
  fr: "Français",
  th: "ภาษาไทย",
};

export async function POST(req: NextRequest) {
  try {
    const { message, language } = await req.json();

    if (!message || !language) {
      return NextResponse.json({ error: "Missing message or language" }, { status: 400 });
    }

    const langName = LANGUAGE_NAMES[language] ?? language;
    const apiKey = process.env.GEMINI_API_KEY;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `あなたは多言語対応の窓口AIアシスタントです。ユーザーのメッセージには必ず${langName}で返答してください。他の言語は使わないでください。丁寧で親切に答えてください。` }],
          },
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini API error:", JSON.stringify(data));
      return NextResponse.json({ error: "API error", detail: data }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "エラーが発生しました";
    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
