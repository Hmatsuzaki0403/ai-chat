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
