// インテント分類: 応答生成と完全に分離した決定的キーワード分類器。
// LLMが落ちても分類は必ず成立し、逆に分類が本応答を巻き込むこともない。

export type Category = "inquiry" | "ticket" | "reaction" | "other";

const TICKET_WORDS = [
  "チケット", "ticket", "買いたい", "買える", "購入", "予約", "先行", "抽選",
  "entradas", "billets", "티켓", "ตั๋ว", "飛", "boleto", "buy",
];

const REACTION_WORDS = [
  "最高", "楽しみ", "嬉しい", "泣いた", "震えた", "感動", "おめでとう", "すごい",
  "amazing", "awesome", "can't wait", "excited", "congrats", "love",
  "期待", "応援", "大好き", "神", "えぐい", "kakkoii", "かっこいい",
];

const INQUIRY_WORDS = [
  "いつ", "どこ", "何", "誰", "どう", "教えて", "ですか", "？", "?",
  "when", "where", "what", "who", "how", "why", "which",
  "언제", "어디", "무엇", "quand", "où", "cuándo", "dónde", "ไหน", "อะไร", "เมื่อไหร่",
  "幾時", "邊度", "咩",
];

export function classify(text: string): Category {
  const t = text.toLowerCase();
  // 優先度: チケット > 告知反応 > 問い合わせ > その他
  if (TICKET_WORDS.some((w) => t.includes(w.toLowerCase()))) return "ticket";
  if (REACTION_WORDS.some((w) => t.includes(w.toLowerCase()))) return "reaction";
  if (INQUIRY_WORDS.some((w) => t.includes(w.toLowerCase()))) return "inquiry";
  return "other";
}

// ---- LESSON 2-5: 質問・クレーム受付の分類（コース1のAI分類を再利用・拡張） ----
export type ContactCategory = "question" | "complaint" | "request" | "other";

const COMPLAINT_WORDS = [
  "クレーム", "苦情", "最悪", "ひどい", "酷い", "困って", "怒", "不満", "返金",
  "届かない", "壊れ", "できない", "エラー", "騙", "詐欺", "遅い", "対応が",
  "complaint", "terrible", "awful", "refund", "angry", "broken", "not working",
  "worst", "disappointed", "問題", "不具合",
];

const REQUEST_WORDS = [
  "してほしい", "して欲しい", "要望", "リクエスト", "追加して", "対応して",
  "できるように", "希望", "お願いします", "改善",
  "please add", "request", "feature", "would like", "wish", "hope you",
];

export function classifyContact(text: string): ContactCategory {
  const t = text.toLowerCase();
  // 優先度: クレーム > 要望 > 質問 > その他
  if (COMPLAINT_WORDS.some((w) => t.includes(w.toLowerCase()))) return "complaint";
  if (REQUEST_WORDS.some((w) => t.includes(w.toLowerCase()))) return "request";
  if (INQUIRY_WORDS.some((w) => t.includes(w.toLowerCase()))) return "question";
  return "other";
}
