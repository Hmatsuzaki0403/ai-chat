// 静的ナレッジベース（基礎プロフィール + 最新情報）
// ここが「無知は罪」対策の土台。LLMが使えない時のフォールバック応答にも使う。
// 日次クローラで official サイトから NEWS/TOURS を追記する運用を想定（P3）。

export type KBEntry = {
  id: string;
  keywords: string[]; // 部分一致で検索
  facts: string; // LLMへ渡す事実（日本語ベース。LLMが選択言語に翻訳して回答）
};

export const KNOWLEDGE_BASE: KBEntry[] = [
  {
    id: "debut",
    keywords: [
      "デビュー", "debut", "いつから", "経歴", "出道", "데뷔", "début", "เดบิวต์",
      "malice", "マリスミゼル", "歴史", "history",
    ],
    facts:
      "GACKTは1995年にヴィジュアル系バンドMALICE MIZERのボーカルとして加入し脚光を浴び、1999年に脱退後、同年『Mizérable』でソロデビューした。ソロデビューは1999年5月12日。",
  },
  {
    id: "profile",
    keywords: [
      "誕生日", "生まれ", "出身", "沖縄", "プロフィール", "profile", "birthday",
      "본명", "本名", "name", "身長",
    ],
    facts:
      "GACKTは1973年7月4日生まれ、沖縄県出身。ソロアーティスト・俳優・実業家として活動。语学に堪能で、日本語のほか英語・中国語・韓国語・フランス語を話す。",
  },
  {
    id: "songs",
    keywords: [
      "代表曲", "曲", "song", "歌", "vanilla", "another world", "楽曲", "노래",
      "chanson", "เพลง", "アルバム", "album",
    ],
    facts:
      "GACKTの代表曲には「Vanilla」「ANOTHER WORLD」「君のためにできること」「Last Song」「野に咲く花のように」などがある。最近の楽曲としてはドラマ主題歌の「FALL AGAIN」や新曲「STAND ALONE」がある。",
  },
  {
    id: "tour2026",
    keywords: [
      "ツアー", "tour", "コンサート", "concert", "ライブ", "live", "魔王", "シンフォニー",
      "symphony", "infinity", "公演", "演唱會", "콘서트", "คอนเสิร์ต", "次", "next",
    ],
    facts:
      "GACKTの次のツアーは「GACKT 魔王シンフォニー 2026 -INFINITY-」で、2026年7月14日にウェスタ川越 大ホールで開幕する。オリジナルツアーグッズと、G&L MEMBERS CLUB会員向けのゲネプロ（ドレスリハーサル）抽選が発表されている。",
  },
  {
    id: "tickets",
    keywords: [
      "チケット", "ticket", "買", "buy", "購入", "予約", "飛", "entradas", "billets",
      "티켓", "ตั๋ว", "申し込み", "先行",
    ],
    facts:
      "チケットの一般販売の詳細は公式サイトの「TOURS」セクションで案内される。G&L MEMBERS CLUB会員には先行・ゲネプロ抽選などの特典がある。最新の販売状況は公式サイトで確認するのが確実。",
  },
  {
    id: "lifestyle",
    keywords: [
      "食事", "1日1食", "トレーニング", "筋トレ", "ストイック", "生活", "lifestyle",
      "ケトン", "ファスティング", "diet",
    ],
    facts:
      "GACKTは1日1食の食生活と日々のトレーニングを長年続けていることで知られる。糖質を控えたスタイルを実践している。",
  },
  {
    id: "fanclub",
    keywords: [
      "ファンクラブ", "fanclub", "fan club", "g&l", "members", "会員", "入会",
    ],
    facts:
      "GACKTのオフィシャルファンクラブは「G&L MEMBERS CLUB」。会員はチケット先行やゲネプロ抽選などの特典を受けられる。詳細は公式サイトから。",
  },
];

// 簡易検索: キーワード一致でスコアリングして上位を返す
export function searchKB(query: string, topK = 3): KBEntry[] {
  const q = query.toLowerCase();
  const scored = KNOWLEDGE_BASE.map((e) => ({
    e,
    score: e.keywords.reduce(
      (s, kw) => (q.includes(kw.toLowerCase()) ? s + 1 : s),
      0
    ),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((x) => x.e);
}
