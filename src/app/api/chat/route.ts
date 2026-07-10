import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const LANGUAGE_NAMES: Record<string, string> = {
  ja: "日本語",
  en: "English",
  "zh-TW": "繁體中文（香港式繁体字）",
  yue: "廣東話（広東語）",
  es: "Español",
  ko: "한국어",
  fr: "Français",
  th: "ภาษาไทย",
};

const CATEGORIES = ["問い合わせ", "チケット希望", "告知反応", "その他"] as const;
type Category = typeof CATEGORIES[number];

async function gemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { message, language } = await req.json();
    if (!message || !language) {
      return NextResponse.json({ error: "Missing message or language" }, { status: 400 });
    }

    const langName = LANGUAGE_NAMES[language] ?? language;

    // 返答と分類を並行して実行
    const [reply, categoryRaw] = await Promise.all([
      gemini(
        `あなたはGACKTの専属スタッフAIです。世界中のファンからの問い合わせに対応します。
GACKTについての質問（活動歴、音楽、ライブ、チケット、近況など）に詳しく答えてください。
GACKTに関係のない話題には「GACKTに関するご質問をお待ちしております」と返してください。
返答は必ず${langName}で行ってください。他の言語は一切使わないでください。
丁寧で温かみのある文体で、ファンに寄り添うように答えてください。`,
        message
      ),
      gemini(
        `あなたはメッセージ分類AIです。ユーザーのメッセージを以下の4カテゴリのいずれか1つに分類してください。カテゴリ名だけを返してください。他の文字は一切不要です。
カテゴリ：問い合わせ／チケット希望／告知反応／その他
・問い合わせ：質問・相談・情報を求めている
・チケット希望：チケット購入・予約・申込みに関する内容
・告知反応：お知らせ・イベント・発表への反応やコメント
・その他：上記に当てはまらない場合`,
        message
      ),
    ]);

    const category: Category = CATEGORIES.includes(categoryRaw.trim() as Category)
      ? (categoryRaw.trim() as Category)
      : "その他";

    return NextResponse.json({ reply, category });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
