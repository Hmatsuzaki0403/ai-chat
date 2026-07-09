"use client";

import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "yue", label: "廣東話" },
  { code: "es", label: "Español" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "th", label: "ไทย" },
];

const CATEGORIES = ["問い合わせ", "チケット希望", "告知反応", "その他"] as const;

const CATEGORY_STYLES: Record<string, { badge: string; bar: string }> = {
  "問い合わせ":  { badge: "bg-blue-100 text-blue-700",   bar: "bg-blue-500" },
  "チケット希望": { badge: "bg-green-100 text-green-700", bar: "bg-green-500" },
  "告知反応":   { badge: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-400" },
  "その他":     { badge: "bg-gray-100 text-gray-500",    bar: "bg-gray-400" },
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
  const [showDash, setShowDash] = useState(false);
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

  const langLabel = (code: string) => LANGUAGES.find((l) => l.code === code)?.label ?? code;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <header className="bg-white dark:bg-gray-900 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌐</span>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">AI多言語チャットボット</h1>
        </div>
        <button
          onClick={() => setShowDash((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-gray-700 hover:bg-indigo-100 transition-colors"
        >
          📊 {showDash ? "チャットに戻る" : `ダッシュボード (${stats.total}件)`}
        </button>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-4 gap-4">
        {showDash ? (
          /* ── ダッシュボード ── */
          <div className="flex flex-col gap-4">
            {/* 合計 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-xs text-gray-400 mb-1">合計件数</p>
              <p className="text-5xl font-bold text-indigo-600">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">件</p>
            </div>

            {/* 分類別 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">分類別</p>
              <div className="flex flex-col gap-3">
                {CATEGORIES.map((cat) => {
                  const count = stats.byCategory[cat] ?? 0;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const style = CATEGORY_STYLES[cat];
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{cat}</span>
                        <span className="text-gray-500 dark:text-gray-400">{count}件 ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 言語別 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">言語別</p>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(({ code, label }) => {
                  const count = stats.byLang[code] ?? 0;
                  return (
                    <div key={code} className="flex justify-between items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm">
                      <span className="text-gray-700 dark:text-gray-200">{label}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── チャット ── */
          <>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">言語を選んでください / Select Language</p>
              <div className="grid grid-cols-4 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`py-2 px-1 rounded-xl text-sm font-medium transition-all border ${
                      selectedLang === lang.code
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-indigo-400"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 min-h-64 flex flex-col gap-3 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-gray-400 dark:text-gray-500 text-sm m-auto">メッセージを送ってください</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {msg.category && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${CATEGORY_STYLES[msg.category]?.badge ?? "bg-gray-100 text-gray-500"}`}>
                      {msg.category}
                    </span>
                  )}
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === "user" && msg.lang && (
                    <span className="text-xs text-gray-400 mt-0.5">{langLabel(msg.lang)}</span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-gray-500 dark:text-gray-400">
                    考え中...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="メッセージを入力..."
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition-colors"
              >
                送信
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
