export type Lang =
  | "ja"
  | "en"
  | "zh-hk"
  | "yue"
  | "es"
  | "ko"
  | "fr"
  | "th";

export const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "ja", flag: "🇯🇵", label: "日本語" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "zh-hk", flag: "🇭🇰", label: "繁體中文(香港)" },
  { code: "yue", flag: "🇭🇰", label: "廣東話" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "ko", flag: "🇰🇷", label: "한국어" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "th", flag: "🇹🇭", label: "ไทย" },
];

type UIStrings = {
  heroTitle: string;
  heroSub: string;
  placeholder: string;
  send: string;
  emptyChat: string;
  retry: string;
  errBusy: string;
  errTooLong: string;
  errRateLimit: string;
  dashboard: string;
  total: string;
  byCategory: string;
  byLanguage: string;
  dashNote: string;
  catInquiry: string;
  catTicket: string;
  catReaction: string;
  catOther: string;
};

export const UI: Record<Lang, UIStrings> = {
  ja: {
    heroTitle: "GACKTについて何でも聞いてね",
    heroSub: "言語を選んで送信してください。AIが同じ言語で返します。",
    placeholder: "メッセージを入力...",
    send: "送信",
    emptyChat: "GACKTについて何でも聞いてください",
    retry: "再送する",
    errBusy:
      "ただいま混み合っています。少し時間をおいて、下の「再送する」を押してください。",
    errTooLong: "メッセージが長すぎます。500文字以内でお願いします。",
    errRateLimit: "送信が速すぎます。少し待ってからもう一度どうぞ。",
    dashboard: "ダッシュボード",
    total: "合計",
    byCategory: "分類別",
    byLanguage: "言語別",
    dashNote:
      "送信のたびに件数がリアルタイムで増えます。チケット希望は売れ方分析の土台です。（エラー応答は集計に含まれません）",
    catInquiry: "問い合わせ",
    catTicket: "チケット希望",
    catReaction: "告知反応",
    catOther: "その他",
  },
  en: {
    heroTitle: "Ask me anything about GACKT",
    heroSub: "Pick a language and send. The AI replies in the same language.",
    placeholder: "Type a message...",
    send: "Send",
    emptyChat: "Ask anything about GACKT",
    retry: "Resend",
    errBusy:
      "We're a bit busy right now. Please wait a moment and press \"Resend\".",
    errTooLong: "Your message is too long. Please keep it under 500 characters.",
    errRateLimit: "You're sending too fast. Please wait a moment.",
    dashboard: "Dashboard",
    total: "Total",
    byCategory: "By category",
    byLanguage: "By language",
    dashNote:
      "Counts update in real time with every message. (Error responses are excluded from stats.)",
    catInquiry: "Inquiry",
    catTicket: "Ticket wish",
    catReaction: "Reaction",
    catOther: "Other",
  },
  "zh-hk": {
    heroTitle: "關於GACKT，隨便問",
    heroSub: "選擇語言後發送，AI會以同一語言回覆。",
    placeholder: "輸入訊息...",
    send: "發送",
    emptyChat: "關於GACKT，隨便問",
    retry: "重新發送",
    errBusy: "目前繁忙，請稍候再按「重新發送」。",
    errTooLong: "訊息太長，請控制在500字以內。",
    errRateLimit: "發送太快了，請稍等片刻。",
    dashboard: "儀表板",
    total: "合計",
    byCategory: "按分類",
    byLanguage: "按語言",
    dashNote: "每次發送即時更新。（錯誤回應不計入統計）",
    catInquiry: "查詢",
    catTicket: "想買票",
    catReaction: "公告反應",
    catOther: "其他",
  },
  yue: {
    heroTitle: "關於GACKT，咩都可以問",
    heroSub: "揀好語言再發送，AI會用同一種語言覆你。",
    placeholder: "輸入訊息...",
    send: "發送",
    emptyChat: "關於GACKT，咩都可以問",
    retry: "再發一次",
    errBusy: "而家有啲繁忙，請等一陣再撳「再發一次」。",
    errTooLong: "訊息太長喇，請保持500字以內。",
    errRateLimit: "發送得太快喇，請等一陣。",
    dashboard: "儀表板",
    total: "合計",
    byCategory: "按分類",
    byLanguage: "按語言",
    dashNote: "每次發送即時更新。（錯誤回應唔計入統計）",
    catInquiry: "查詢",
    catTicket: "想買飛",
    catReaction: "公告反應",
    catOther: "其他",
  },
  es: {
    heroTitle: "Pregúntame lo que quieras sobre GACKT",
    heroSub: "Elige un idioma y envía. La IA responde en el mismo idioma.",
    placeholder: "Escribe un mensaje...",
    send: "Enviar",
    emptyChat: "Pregunta lo que quieras sobre GACKT",
    retry: "Reenviar",
    errBusy: "Estamos ocupados. Espera un momento y pulsa \"Reenviar\".",
    errTooLong: "Mensaje demasiado largo. Máximo 500 caracteres.",
    errRateLimit: "Envías demasiado rápido. Espera un momento.",
    dashboard: "Panel",
    total: "Total",
    byCategory: "Por categoría",
    byLanguage: "Por idioma",
    dashNote:
      "Se actualiza en tiempo real. (Los errores no se incluyen en las estadísticas.)",
    catInquiry: "Consulta",
    catTicket: "Entradas",
    catReaction: "Reacción",
    catOther: "Otros",
  },
  ko: {
    heroTitle: "GACKT에 대해 무엇이든 물어보세요",
    heroSub: "언어를 선택하고 전송하세요. AI가 같은 언어로 답합니다.",
    placeholder: "메시지를 입력...",
    send: "전송",
    emptyChat: "GACKT에 대해 무엇이든 물어보세요",
    retry: "다시 보내기",
    errBusy: "지금 혼잡합니다. 잠시 후 \"다시 보내기\"를 눌러주세요.",
    errTooLong: "메시지가 너무 깁니다. 500자 이내로 부탁드립니다.",
    errRateLimit: "전송이 너무 빠릅니다. 잠시 기다려주세요.",
    dashboard: "대시보드",
    total: "합계",
    byCategory: "분류별",
    byLanguage: "언어별",
    dashNote: "전송할 때마다 실시간으로 갱신됩니다. (오류 응답은 집계에서 제외)",
    catInquiry: "문의",
    catTicket: "티켓 희망",
    catReaction: "공지 반응",
    catOther: "기타",
  },
  fr: {
    heroTitle: "Demandez-moi tout sur GACKT",
    heroSub: "Choisissez une langue et envoyez. L'IA répond dans la même langue.",
    placeholder: "Écrivez un message...",
    send: "Envoyer",
    emptyChat: "Demandez tout sur GACKT",
    retry: "Renvoyer",
    errBusy:
      "Service occupé. Attendez un instant puis appuyez sur « Renvoyer ».",
    errTooLong: "Message trop long. 500 caractères maximum.",
    errRateLimit: "Envois trop rapides. Patientez un instant.",
    dashboard: "Tableau de bord",
    total: "Total",
    byCategory: "Par catégorie",
    byLanguage: "Par langue",
    dashNote:
      "Mis à jour en temps réel. (Les erreurs sont exclues des statistiques.)",
    catInquiry: "Question",
    catTicket: "Billets",
    catReaction: "Réaction",
    catOther: "Autre",
  },
  th: {
    heroTitle: "ถามอะไรก็ได้เกี่ยวกับ GACKT",
    heroSub: "เลือกภาษาแล้วส่งข้อความ AI จะตอบเป็นภาษาเดียวกัน",
    placeholder: "พิมพ์ข้อความ...",
    send: "ส่ง",
    emptyChat: "ถามอะไรก็ได้เกี่ยวกับ GACKT",
    retry: "ส่งอีกครั้ง",
    errBusy: "ขณะนี้มีผู้ใช้จำนวนมาก กรุณารอสักครู่แล้วกด \"ส่งอีกครั้ง\"",
    errTooLong: "ข้อความยาวเกินไป กรุณาไม่เกิน 500 ตัวอักษร",
    errRateLimit: "ส่งเร็วเกินไป กรุณารอสักครู่",
    dashboard: "แดชบอร์ด",
    total: "รวม",
    byCategory: "ตามหมวดหมู่",
    byLanguage: "ตามภาษา",
    dashNote: "อัปเดตแบบเรียลไทม์ทุกครั้งที่ส่ง (ไม่รวมข้อผิดพลาดในสถิติ)",
    catInquiry: "สอบถาม",
    catTicket: "อยากได้ตั๋ว",
    catReaction: "ตอบรับข่าว",
    catOther: "อื่นๆ",
  },
};

export const LANG_NAME_FOR_PROMPT: Record<Lang, string> = {
  ja: "Japanese",
  en: "English",
  "zh-hk": "Traditional Chinese (Hong Kong)",
  yue: "Cantonese (written colloquial Cantonese)",
  es: "Spanish",
  ko: "Korean",
  fr: "French",
  th: "Thai",
};
