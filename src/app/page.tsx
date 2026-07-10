"use client";

import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "ja",    label: "日本語",         flag: "🇯🇵" },
  { code: "en",    label: "English",        flag: "🇬🇧" },
  { code: "zh-TW", label: "繁體中文(香港)", flag: "🇭🇰" },
  { code: "yue",   label: "廣東話",         flag: "🇭🇰" },
  { code: "es",    label: "Español",        flag: "🇪🇸" },
  { code: "ko",    label: "한국어",          flag: "🇰🇷" },
  { code: "fr",    label: "Français",       flag: "🇫🇷" },
  { code: "th",    label: "ไทย",            flag: "🇹🇭" },
];

const CATEGORIES = ["問い合わせ", "チケット希望", "告知反応", "その他"] as const;

const CATEGORY_STYLES: Record<string, { badge: string; bar: string }> = {
  "問い合わせ":  { badge: "bg-sky-900/60 text-sky-300 border border-sky-700",       bar: "bg-sky-400" },
  "チケット希望": { badge: "bg-emerald-900/60 text-emerald-300 border border-emerald-700", bar: "bg-emerald-400" },
  "告知反応":   { badge: "bg-amber-900/60 text-amber-300 border border-amber-700",  bar: "bg-amber-400" },
  "その他":     { badge: "bg-slate-700/60 text-slate-400 border border-slate-600",  bar: "bg-slate-500" },
};

type Message = {
  role: "user" | "ai";
  text: string;
  category?: string;
  lang?: string;
};

type Stats = {
  total: number;
  byCategory: Record<string, number>;
  byLang: Record<string, number>;
};

const initStats = (): Stats => ({
  total: 0,
  byCategory: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
  byLang: Object.fromEntries(LANGUAGES.map((l) => [l.code, 0])),
});

export default function Home() {
  const [selectedLang, setSelectedLang] = useState("ja");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>(initStats());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const lang = selectedLang;

    setMessages((prev) => [...prev, { role: "user", text, lang }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: lang }),
      });
      const data = await res.json();
      const category: string = data.category ?? "その他";

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.reply ?? "エラーが発生しました", category, lang },
      ]);

      setStats((prev) => ({
        total: prev.total + 1,
        byCategory: { ...prev.byCategory, [category]: (prev.byCategory[category] ?? 0) + 1 },
        byLang: { ...prev.byLang, [lang]: (prev.byLang[lang] ?? 0) + 1 },
      }));
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "エラーが発生しました" }]);
    } finally {
      setLoading(false);
    }
  };

  const activeLangs = LANGUAGES.filter(({ code }) => (stats.byLang[code] ?? 0) > 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* ヘッダー */}
      <header className="border-b border-white/10 px-6 py-4 bg-slate-900/90">
        <p className="text-xs tracking-[0.25em] text-slate-500 uppercase mb-0.5">No language barriers</p>
        <h1 className="text-xl font-bold tracking-widest text-white uppercase">GACKT CONCIERGE</h1>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-6 gap-5">

        {/* ヒーロー */}
        <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-5 text-center">
          <h2 className="text-lg font-bold text-white mb-1">世界は、ひとつ。言葉は、すべて。</h2>
          <p className="text-sm text-slate-400">
            世界中のファンに、その言語のまま即対応するGACKT専属スタッフAI
          </p>
          <p className="text-xs text-slate-500 mt-1">
            下の言語ボタンを押すか、自由に入力して送信してください。どの言語で送っても、AIが同じ言語で返します。
          </p>
        </div>

        {/* 言語ボタン */}
        <div className="grid grid-cols-4 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`py-2 px-1 rounded-xl text-sm font-medium transition-all border ${
                selectedLang === lang.code
                  ? "bg-white text-slate-900 border-white shadow-lg"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-400 hover:bg-slate-700"
              }`}
            >
              <span className="mr-1">{lang.flag}</span>{lang.label}
            </button>
          ))}
        </div>

        {/* チャットエリア */}
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 min-h-64 flex flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-slate-500 text-sm m-auto">GACKTについて何でも聞いてください</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.category && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${CATEGORY_STYLES[msg.category]?.badge ?? "bg-slate-700 text-slate-400"}`}>
                  {msg.category}
                </span>
              )}
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-white text-slate-900 rounded-br-sm"
                  : "bg-slate-700 text-slate-100 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-slate-400">
                考え中...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 入力欄 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-900 px-6 py-3 rounded-xl font-bold transition-colors"
          >
            送信
          </button>
        </div>

        {/* ダッシュボード */}
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">ダッシュボード</h3>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* 合計 */}
            <div className="bg-slate-900/60 rounded-xl p-4 text-center border border-white/5">
              <p className="text-xs text-slate-500 mb-1">合計</p>
              <p className="text-4xl font-bold text-white">{stats.total}</p>
            </div>

            {/* 分類別 */}
            <div className="col-span-2 bg-slate-900/60 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-slate-500 mb-3">分類別</p>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map((cat) => {
                  const count = stats.byCategory[cat] ?? 0;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const style = CATEGORY_STYLES[cat];
                  return (
                    <div key={cat} className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${style.badge}`}>
                        {cat}
                      </span>
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-slate-400 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 言語別 */}
          <div>
            <p className="text-xs text-slate-500 mb-2">言語別</p>
            {activeLangs.length === 0 ? (
              <p className="text-xs text-slate-600">まだありません</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {activeLangs.map(({ code, flag, label }) => (
                  <div key={code} className="flex flex-col items-center bg-slate-900/60 border border-white/5 rounded-xl py-2 px-1 text-center">
                    <span className="text-lg">{flag}</span>
                    <span className="text-xs text-slate-400 mt-0.5 truncate w-full text-center">{label}</span>
                    <span className="text-sm font-bold text-white mt-0.5">{stats.byLang[code]}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-600 mt-3">送信のたびに件数がリアルタイムで増えます。チケット希望は売れ方分析の土台です。</p>
          </div>
        </div>

      </main>
    </div>
  );
}
