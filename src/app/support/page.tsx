"use client";

// LESSON 2-5: ログイン後の質問・クレーム受付
// 会員（localStorageのmember）とひもづけて保存し、AI分類の結果をその場で表示。
// 過去の問い合わせ履歴も本人に見せる。

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import type { ContactCategory } from "@/lib/classify";

type Inquiry = {
  id: string;
  message: string;
  category: ContactCategory;
  created_at: string;
};

type Dict = {
  title: string; sub: string; placeholder: string; send: string;
  received: string; historyEmpty: string; needLogin: string; toLogin: string;
  backChat: string; errServer: string;
  cats: Record<ContactCategory, string>;
};

const T: Record<Lang, Dict> = {
  ja: { title: "質問・クレーム受付", sub: "内容はAIが自動で分類して、担当に届きます。", placeholder: "質問・ご意見・お困りごとを入力...", send: "送信", received: "受け付けました。", historyEmpty: "まだ問い合わせはありません。", needLogin: "この窓口は会員専用です。先にログインまたは新規登録をしてください。", toLogin: "入口へ →", backChat: "← チャットへ戻る", errServer: "送信に失敗しました。もう一度お試しください。", cats: { question: "質問", complaint: "クレーム", request: "要望", other: "その他" } },
  en: { title: "Questions & Complaints", sub: "Your message is auto-classified by AI and routed to our team.", placeholder: "Type your question, feedback, or issue...", send: "Send", received: "Received.", historyEmpty: "No inquiries yet.", needLogin: "This desk is members-only. Please log in or sign up first.", toLogin: "To entry →", backChat: "← Back to chat", errServer: "Failed to send. Please try again.", cats: { question: "Question", complaint: "Complaint", request: "Request", other: "Other" } },
  "zh-hk": { title: "查詢・投訴受理", sub: "內容會由AI自動分類並轉交負責人員。", placeholder: "請輸入查詢、意見或問題...", send: "發送", received: "已受理。", historyEmpty: "暫時無查詢紀錄。", needLogin: "此服務只限會員。請先登入或註冊。", toLogin: "去入口 →", backChat: "← 返回聊天", errServer: "發送失敗，請再試一次。", cats: { question: "查詢", complaint: "投訴", request: "要求", other: "其他" } },
  yue: { title: "查詢・投訴受理", sub: "內容會由AI自動分類，交畀負責人跟進。", placeholder: "打低你嘅查詢、意見或者問題...", send: "發送", received: "收到喇。", historyEmpty: "暫時未有查詢紀錄。", needLogin: "呢個服務只限會員。請先登入或者註冊。", toLogin: "去入口 →", backChat: "← 返去聊天", errServer: "發送唔到，再試一次。", cats: { question: "查詢", complaint: "投訴", request: "要求", other: "其他" } },
  es: { title: "Preguntas y reclamaciones", sub: "La IA clasifica tu mensaje automáticamente y lo envía al equipo.", placeholder: "Escribe tu pregunta, opinión o problema...", send: "Enviar", received: "Recibido.", historyEmpty: "Aún no hay consultas.", needLogin: "Servicio solo para miembros. Inicia sesión o regístrate primero.", toLogin: "A la entrada →", backChat: "← Volver al chat", errServer: "Error al enviar. Inténtalo de nuevo.", cats: { question: "Pregunta", complaint: "Reclamación", request: "Petición", other: "Otro" } },
  ko: { title: "질문・클레임 접수", sub: "내용은 AI가 자동 분류하여 담당자에게 전달됩니다.", placeholder: "질문・의견・불편사항을 입력...", send: "전송", received: "접수되었습니다.", historyEmpty: "아직 문의가 없습니다.", needLogin: "회원 전용 창구입니다. 먼저 로그인 또는 가입해주세요.", toLogin: "입구로 →", backChat: "← 채팅으로 돌아가기", errServer: "전송에 실패했습니다. 다시 시도해주세요.", cats: { question: "질문", complaint: "클레임", request: "요청", other: "기타" } },
  fr: { title: "Questions et réclamations", sub: "Votre message est classé automatiquement par l'IA et transmis à l'équipe.", placeholder: "Saisissez votre question, avis ou problème...", send: "Envoyer", received: "Bien reçu.", historyEmpty: "Aucune demande pour l'instant.", needLogin: "Guichet réservé aux membres. Connectez-vous ou inscrivez-vous d'abord.", toLogin: "Vers l'entrée →", backChat: "← Retour au chat", errServer: "Échec de l'envoi. Réessayez.", cats: { question: "Question", complaint: "Réclamation", request: "Demande", other: "Autre" } },
  th: { title: "รับคำถาม・ข้อร้องเรียน", sub: "AI จะจัดหมวดหมู่ข้อความของคุณและส่งต่อให้ทีมงาน", placeholder: "พิมพ์คำถาม ความเห็น หรือปัญหา...", send: "ส่ง", received: "รับเรื่องแล้ว", historyEmpty: "ยังไม่มีประวัติการติดต่อ", needLogin: "บริการนี้สำหรับสมาชิกเท่านั้น กรุณาเข้าสู่ระบบหรือสมัครก่อน", toLogin: "ไปหน้าแรก →", backChat: "← กลับไปแชท", errServer: "ส่งไม่สำเร็จ กรุณาลองใหม่", cats: { question: "คำถาม", complaint: "ข้อร้องเรียน", request: "คำขอ", other: "อื่นๆ" } },
};

const ALL_LANGS: Lang[] = ["ja", "en", "zh-hk", "yue", "es", "ko", "fr", "th"];

const CAT_CLASS: Record<ContactCategory, string> = {
  question: "inquiry",
  complaint: "complaint",
  request: "reaction",
  other: "other",
};

export default function SupportPage() {
  const [lang, setLang] = useState<Lang>("ja");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [noMember, setNoMember] = useState(false);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const t = T[lang];

  useEffect(() => {
    let id: string | null = null;
    try {
      const v =
        new URLSearchParams(window.location.search).get("lang") ||
        localStorage.getItem("lang");
      if (v && ALL_LANGS.includes(v as Lang)) setLang(v as Lang);
      const m = localStorage.getItem("member");
      if (m) id = (JSON.parse(m) as { id?: string }).id ?? null;
    } catch { /* 下のガードで処理 */ }
    if (!id) {
      setNoMember(true);
      return;
    }
    setMemberId(id);
    fetch(`/api/inquiries?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.inquiries as Inquiry[]);
        else if (data.error === "bad_id") setNoMember(true);
      })
      .catch(() => { /* 履歴が取れなくても送信はできる */ });
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [items, busy]);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || !memberId || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId, message, lang }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems((arr) => [
          ...arr,
          {
            id: data.id ?? String(arr.length),
            message,
            category: data.category as ContactCategory,
            created_at: data.created_at ?? "",
          },
        ]);
        setInput("");
      } else {
        setError(t.errServer);
      }
    } catch {
      setError(t.errServer);
    } finally {
      setBusy(false);
    }
  }, [input, memberId, busy, lang, t.errServer]);

  if (noMember) {
    return (
      <>
        <header className="site">
          <div className="kicker">NO LANGUAGE BARRIERS</div>
          <h1>GACKT CONCIERGE</h1>
        </header>
        <main className="container">
          <section className="hero">
            <h2>{t.title}</h2>
            <p>{t.needLogin}</p>
          </section>
          <p className="guest-link"><a href="/">{t.toLogin}</a></p>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="site">
        <div className="kicker">NO LANGUAGE BARRIERS</div>
        <h1>GACKT CONCIERGE</h1>
      </header>
      <main className="container">
        <section className="hero">
          <h2>{t.title}</h2>
          <p>{t.sub}</p>
        </section>

        <div className="chat onboarding" ref={listRef}>
          {items.length === 0 && <div className="empty">{t.historyEmpty}</div>}
          {items.map((q) => (
            <div key={q.id} className="ob-step">
              <div className="msg user">{q.message}</div>
              <div className="inq-meta">
                <span className={`tag ${CAT_CLASS[q.category]}`}>
                  {t.cats[q.category] ?? q.category}
                </span>
                <span className="inq-ok">✅ {t.received}</span>
                {q.created_at && (
                  <span className="inq-date">
                    {q.created_at.slice(0, 10)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="inputrow">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
            }}
            placeholder={t.placeholder}
            maxLength={1000}
            disabled={busy}
          />
          <button onClick={send} disabled={busy || !input.trim()}>
            {t.send}
          </button>
        </div>
        {error && <p className="auth-error">{error}</p>}

        <p className="guest-link">
          <a href={`/chat?lang=${lang}`}>{t.backChat}</a>
        </p>
      </main>
    </>
  );
}
