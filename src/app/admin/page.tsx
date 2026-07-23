"use client";

// LESSON 2-6: 管理画面 — 問い合わせ一覧 + フィルタ + 地域別集計
// 管理者キー（Vercelの環境変数 ADMIN_KEY）を知っている人だけ閲覧できる。

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  message: string;
  category: string;
  lang: string;
  created_at: string;
  members: { name: string | null; country: string | null; region: string | null } | null;
};

type Data = {
  total: number;
  byCountry: Record<string, number>;
  byRegion: Record<string, number>;
  inquiries: Row[];
};

const CAT_LABEL: Record<string, string> = {
  question: "質問", complaint: "クレーム", request: "要望", other: "その他",
};
const CAT_CLASS: Record<string, string> = {
  question: "inquiry", complaint: "complaint", request: "reaction", other: "other",
};
const COUNTRY_LABEL: Record<string, string> = {
  jp: "🇯🇵 日本", hk: "🇭🇰 香港", tw: "台湾", kr: "🇰🇷 韓国", us: "🇺🇸 アメリカ",
  es: "🇪🇸 スペイン", fr: "🇫🇷 フランス", th: "🇹🇭 タイ", other: "その他", unknown: "未回答",
};
const LANG_LABEL: Record<string, string> = {
  ja: "🇯🇵 日本語", en: "🇬🇧 English", "zh-hk": "🇭🇰 繁體中文", yue: "🇭🇰 廣東話",
  es: "🇪🇸 Español", ko: "🇰🇷 한국어", fr: "🇫🇷 Français", th: "🇹🇭 ไทย",
};

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);

  // フィルタ
  const [fCategory, setFCategory] = useState("");
  const [fLang, setFLang] = useState("");
  const [fCountry, setFCountry] = useState("");
  const [fRegion, setFRegion] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("adminKey");
      if (saved) setKey(saved);
    } catch { /* なくてもよい */ }
  }, []);

  const load = useCallback(
    async (adminKey: string) => {
      if (!adminKey || busy) return;
      setBusy(true);
      setError("");
      try {
        const q = new URLSearchParams();
        if (fCategory) q.set("category", fCategory);
        if (fLang) q.set("lang", fLang);
        if (fCountry) q.set("country", fCountry);
        if (fRegion) q.set("region", fRegion);
        if (fFrom) q.set("from", fFrom);
        if (fTo) q.set("to", fTo);
        const res = await fetch(`/api/admin/inquiries?${q.toString()}`, {
          headers: { "x-admin-key": adminKey },
          cache: "no-store",
        });
        const json = await res.json();
        if (json.ok) {
          setData(json as Data);
          setAuthed(true);
          try { localStorage.setItem("adminKey", adminKey); } catch { /* ok */ }
        } else if (json.error === "unauthorized") {
          setAuthed(false);
          setError("管理者キーが違います。");
        } else if (json.error === "not_configured") {
          setError("環境変数 ADMIN_KEY がVercelに設定されていません。");
        } else {
          setError("読み込みに失敗しました。もう一度お試しください。");
        }
      } catch {
        setError("読み込みに失敗しました。もう一度お試しください。");
      } finally {
        setBusy(false);
      }
    },
    [busy, fCategory, fLang, fCountry, fRegion, fFrom, fTo]
  );

  if (!authed) {
    return (
      <>
        <header className="site">
          <div className="kicker">ADMIN ONLY</div>
          <h1>GACKT CONCIERGE 管理画面</h1>
        </header>
        <main className="container">
          <section className="hero">
            <h2>管理者ログイン</h2>
            <p>管理者キーを入力してください（Vercelの環境変数 ADMIN_KEY の値）</p>
          </section>
          <div className="auth-card">
            <input
              className="auth-input"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load(key); }}
              placeholder="管理者キー"
            />
            <button className="auth-btn" onClick={() => load(key)} disabled={busy || !key}>
              {busy ? "確認中..." : "入る"}
            </button>
            {error && <p className="auth-error">{error}</p>}
          </div>
        </main>
      </>
    );
  }

  const maxCountry = Math.max(1, ...Object.values(data?.byCountry ?? { x: 1 }));
  const maxRegion = Math.max(1, ...Object.values(data?.byRegion ?? { x: 1 }));

  return (
    <>
      <header className="site">
        <div className="kicker">ADMIN ONLY</div>
        <h1>GACKT CONCIERGE 管理画面</h1>
      </header>
      <main className="container wide">
        {/* フィルタ */}
        <section className="dashboard" style={{ marginBottom: 20 }}>
          <h3>フィルタ</h3>
          <div className="filters">
            <select value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
              <option value="">種別: すべて</option>
              <option value="question">質問</option>
              <option value="complaint">クレーム</option>
              <option value="request">要望</option>
              <option value="other">その他</option>
            </select>
            <select value={fLang} onChange={(e) => setFLang(e.target.value)}>
              <option value="">言語: すべて</option>
              {Object.entries(LANG_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
              <option value="">国: すべて</option>
              {Object.entries(COUNTRY_LABEL).filter(([k]) => k !== "unknown").map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              placeholder="地域（例: 東京）"
              value={fRegion}
              onChange={(e) => setFRegion(e.target.value)}
            />
            <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} />
            <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} />
            <button className="auth-btn slim" onClick={() => load(key)} disabled={busy}>
              {busy ? "..." : "絞り込む"}
            </button>
          </div>
        </section>

        {/* 集計 */}
        <div className="dash-grid" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="label">該当件数</div>
            <div className="big">{data?.total ?? 0}</div>
          </div>
          <div className="card">
            <div className="label">国別集計</div>
            {Object.entries(data?.byCountry ?? {})
              .sort((a, b) => b[1] - a[1])
              .map(([c, n]) => (
                <div className="bar-row" key={c}>
                  <span className="tag other">{COUNTRY_LABEL[c] ?? c}</span>
                  <div className="bar-track">
                    <div className="bar-fill inquiry" style={{ width: `${(n / maxCountry) * 100}%` }} />
                  </div>
                  <span className="num">{n}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="label">地域別集計（国 / 地域）</div>
          {Object.entries(data?.byRegion ?? {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([r, n]) => (
              <div className="bar-row" key={r}>
                <span className="tag other region-tag">{r}</span>
                <div className="bar-track">
                  <div className="bar-fill ticket" style={{ width: `${(n / maxRegion) * 100}%` }} />
                </div>
                <span className="num">{n}</span>
              </div>
            ))}
        </div>

        {/* 一覧 */}
        <div className="card">
          <div className="label" style={{ marginBottom: 10 }}>問い合わせ一覧（新しい順・最大200件）</div>
          <div className="tablewrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日時</th><th>種別</th><th>会員</th><th>国</th><th>地域</th><th>言語</th><th>内容</th>
                </tr>
              </thead>
              <tbody>
                {(data?.inquiries ?? []).map((r) => (
                  <tr key={r.id}>
                    <td>{r.created_at.slice(0, 16).replace("T", " ")}</td>
                    <td><span className={`tag ${CAT_CLASS[r.category] ?? "other"}`}>{CAT_LABEL[r.category] ?? r.category}</span></td>
                    <td>{r.members?.name ?? "-"}</td>
                    <td>{COUNTRY_LABEL[r.members?.country ?? "unknown"] ?? r.members?.country}</td>
                    <td>{r.members?.region ?? "-"}</td>
                    <td>{LANG_LABEL[r.lang] ?? r.lang}</td>
                    <td className="msgcell">{r.message}</td>
                  </tr>
                ))}
                {data && data.inquiries.length === 0 && (
                  <tr><td colSpan={7} style={{ color: "var(--muted)" }}>該当する問い合わせはありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {error && <p className="auth-error">{error}</p>}
      </main>
    </>
  );
}
