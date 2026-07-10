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

// gackt.com からテキスト情報を取得
async function fetchGacktInfo(): Promise<string> {
  try {
    const res = await fetch("https://gackt.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });
    const html = await res.text();

    // HTMLタグを除去してテキストだけ残す
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 先頭5000文字に絞る（トークン節約）
    return text.slice(0, 5000);
  } catch {
    return "";
  }
}

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

    // 公式サイトの情報取得と返答・分類を並行実行
    const [siteInfo, categoryRaw] = await Promise.all([
      fetchGacktInfo(),
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

    const systemPrompt = `あなたはGACKTの専属スタッフAIです。世界中のファンからの問い合わせに対応します。

以下はGACKT公式サイト（gackt.com）から取得した最新情報です。この情報を優先的に参照して回答してください：

---
${siteInfo}
---

回答ルール：
- GACKTに関する質問には、上記の公式情報をもとに詳しく答えてください。
- 公式サイトに情報がない場合は、一般的なGACKT知識で補完してください。
- GACKTと無関係な話題には「GACKTに関するご質問をお待ちしております」と返してください。
- 返答は必ず${langName}で行ってください。他の言語は一切使わないでください。
- 丁寧で温かみのある文体で、ファンに寄り添うように答えてください。`;

    const reply = await gemini(systemPrompt, message);

    const category: Category = CATEGORIES.includes(categoryRaw.trim() as Category)
      ? (categoryRaw.trim() as Category)
      : "その他";

    return NextResponse.json({ reply, category });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}
