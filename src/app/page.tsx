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

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function Home() {
  const [selectedLang, setSelectedLang] = useState("ja");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: selectedLang }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply ?? "エラーが発生しました" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "エラーが発生しました" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-900 shadow-sm px-4 py-3 flex items-center gap-2">
        <span className="text-2xl">🌐</span>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">AI多言語チャットボット</h1>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-4 gap-4">
        {/* 言語選択ボタン */}
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

        {/* チャットエリア */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 min-h-64 flex flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500 text-sm m-auto">メッセージを送ってください</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
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

        {/* 入力欄 */}
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
      </main>
    </div>
  );
}
