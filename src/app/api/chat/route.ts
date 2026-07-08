import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `あなたは多言語対応の窓口AIアシスタントです。
ユーザーのメッセージには必ず ${langName} で返答してください。
他の言語は使わないでください。
丁寧で親切に答えてください。`,
    });

    const result = await model.generateContent(message);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
