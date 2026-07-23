"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LANGS, UI, type Lang } from "@/lib/i18n";
import type { Category } from "@/lib/classify";

type Message =
  | { role: "user"; text: string }
  | { role: "bot"; text: string; category: Category }
  | { role: "error"; text: string; failedInput: string };

type Stats = {
  total: number;
  byCategory: Record<Category, number>;
  byLanguage: Partial<Record<Lang, number>>;
  systemErrors: number;
};

const MAX_LEN = 500;
const CATEGORY_CLASS: Record<Category, string> = {
  inquiry: "inquiry",
  ticket: "ticket",
  reaction: "reaction",
  other: "other",
};

export default function ChatPage() {
  const [lang, setLang] = useState<Lang>("ja");

  // 入口ページで選んだ言語を引き継ぐ（?lang= または localStorage）
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("lang");
      const saved = fromUrl || localStorage.getItem("lang");
      if (saved && LANGS.some((l) => l.code === saved)) {
        setLang(saved as Lang);
      }
    } catch {
      /* 読めなければ既定の日本語のまま */
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [healthy, setHealthy] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const ui = UI[lang];

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {
      /* 統計取得失敗はUIを止めない */
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      if (trimmed.length > MAX_LEN) return;

      setSending(true); // 送信ロック（多重送信防止）
      setMessages((m) => [...m, { role: "user", text: trimmed }]);
      setInput("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: trimmed, lang }),
        });
        const data = await res.json().catch(() => null);

        if (data?.ok) {
          setMessages((m) => [
            ...m,
            { role: "bot", text: data.reply, category: data.category as Category },
          ]);
          setHealthy(!data.degraded);
          refreshStats();
        } else {
          // 構造化エラー: 分類タグは付けない・統計にも入っていない
          setMessages((m) => [
            ...m,
            {
              role: "error",
              text: data?.error ?? ui.errBusy,
              failedInput: trimmed,
            },
          ]);
          if (!data?.userError) setHealthy(false);
        }
      } catch {
        setMessages((m) => [
          ...m,
          { role: "error", text: ui.errBusy, failedInput: trimmed },
        ]);
        setHealthy(false);
      } finally {
        setSending(false);
      }
    },
    [lang, sending, ui.errBusy, refreshStats]
  );

  const retry = useCallback(
    (failedInput: string, index: number) => {
      // エラーバブルを消してから再送
      setMessages((m) => m.filter((_, i) => i !== index));
      send(failedInput);
    },
    [send]
  );

  const overLimit = input.length > MAX_LEN;

  return (
    <>
      <header className="site">
        <div className="kicker">NO LANGUAGE BARRIERS</div>
        <h1>
          GACKT CONCIERGE
          <span className="health" title="service health">
            <span className={`dot ${healthy ? "" : "down"}`} />
            {healthy ? "operational" : "degraded"}
          </span>
        </h1>
      </header>

      <main className="container">
        <section className="hero">
          <h2>{ui.heroTitle}</h2>
          <p>{ui.heroSub}</p>
        </section>

        <div className="langs">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={l.code === lang ? "active" : ""}
              onClick={() => setLang(l.code)}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        <div className="chat" ref={chatRef}>
          {messages.length === 0 && <div className="empty">{ui.emptyChat}</div>}
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="msg user">
                  {msg.text}
                </div>
              );
            }
            if (msg.role === "bot") {
              return (
                <div key={i} className="botwrap">
                  <span className={`tag ${CATEGORY_CLASS[msg.category]}`}>
                    {ui[
                      msg.category === "inquiry"
                        ? "catInquiry"
                        : msg.category === "ticket"
                          ? "catTicket"
                          : msg.category === "reaction"
                            ? "catReaction"
                            : "catOther"
                    ]}
                  </span>
                  <div className="msg bot">{msg.text}</div>
                </div>
              );
            }
            return (
              <div key={i} className="botwrap">
                <div className="msg error">{msg.text}</div>
                <button className="retry-btn" onClick={() => retry(msg.failedInput, i)}>
                  {ui.retry}
                </button>
              </div>
            );
          })}
          {sending && (
            <div className="typing">
              <span>●</span> <span>●</span> <span>●</span>
            </div>
          )}
        </div>

        <div className="inputrow">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) send(input);
            }}
            placeholder={ui.placeholder}
            disabled={sending}
          />
          <button onClick={() => send(input)} disabled={sending || !input.trim() || overLimit}>
            {ui.send}
          </button>
        </div>
        <div className={`charcount ${overLimit ? "over" : ""}`}>
          {input.length} / {MAX_LEN}
        </div>

        <section className="dashboard">
          <h3>{ui.dashboard}</h3>
          <div className="dash-grid">
            <div className="card">
              <div className="label">{ui.total}</div>
              <div className="big">{stats?.total ?? 0}</div>
            </div>
            <div className="card">
              <div className="label">{ui.byCategory}</div>
              {(
                [
                  ["inquiry", ui.catInquiry],
                  ["ticket", ui.catTicket],
                  ["reaction", ui.catReaction],
                  ["other", ui.catOther],
                ] as [Category, string][]
              ).map(([cat, label]) => {
                const n = stats?.byCategory[cat] ?? 0;
                const max = Math.max(1, stats?.total ?? 1);
                return (
                  <div className="bar-row" key={cat}>
                    <span className={`tag ${CATEGORY_CLASS[cat]}`}>{label}</span>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${CATEGORY_CLASS[cat]}`}
                        style={{ width: `${(n / max) * 100}%` }}
                      />
                    </div>
                    <span className="num">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="label" style={{ color: "var(--muted)", fontSize: 13 }}>
            {ui.byLanguage}
          </div>
          <div className="langstats">
            {LANGS.filter((l) => (stats?.byLanguage[l.code] ?? 0) > 0).map((l) => (
              <div className="langstat" key={l.code}>
                <div className="flag">{l.flag}</div>
                <div className="name">{l.label}</div>
                <div className="n">{stats?.byLanguage[l.code]}</div>
              </div>
            ))}
          </div>
          <p className="dash-note">{ui.dashNote}</p>
        </section>
      </main>
    </>
  );
}
