"use client";

// LESSON 2-4: 会話形式の登録フロー
// 国 → 県/州 → 性別 → 生まれた年 を1問ずつ聞き、各ステップで即保存。
// ページを閉じても、次に開くと未回答の質問から再開する。

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";

type Field = "country" | "region" | "gender" | "birth_year";
const STEPS: Field[] = ["country", "region", "gender", "birth_year"];

type Profile = {
  country: string | null;
  region: string | null;
  gender: string | null;
  birth_year: number | null;
};

const COUNTRY_OPTS = ["jp", "hk", "tw", "kr", "us", "es", "fr", "th", "other"];
const GENDER_OPTS = ["male", "female", "other", "no_answer"];

type Dict = {
  title: string; sub: string;
  qCountry: string; qRegion: string; qRegionJp: string; qGender: string; qYear: string;
  yearPh: string; regionPh: string; send: string;
  done: string; toChat: string; saving: string;
  errYear: string; errServer: string; needLogin: string; toLogin: string;
  countries: Record<string, string>; genders: Record<string, string>;
};

const T: Record<Lang, Dict> = {
  ja: { title: "プロフィール登録", sub: "いくつか質問させてください（途中でやめても続きから再開できます）", qCountry: "お住まいの国はどちらですか？", qRegion: "州・地域はどちらですか？", qRegionJp: "都道府県はどちらですか？（例: 東京都）", qGender: "性別を教えてください", qYear: "生まれた年（西暦）を教えてください", yearPh: "例: 1998", regionPh: "入力してください", send: "送信", done: "登録が完了しました！ありがとう。", toChat: "チャットへ進む →", saving: "保存中...", errYear: "1900〜2020の4桁の西暦で入力してください", errServer: "保存に失敗しました。もう一度お試しください。", needLogin: "先にログインまたは新規登録をしてください。", toLogin: "入口へ →", countries: { jp: "🇯🇵 日本", hk: "🇭🇰 香港", tw: "台湾", kr: "🇰🇷 韓国", us: "🇺🇸 アメリカ", es: "🇪🇸 スペイン", fr: "🇫🇷 フランス", th: "🇹🇭 タイ", other: "その他" }, genders: { male: "男性", female: "女性", other: "その他", no_answer: "回答しない" } },
  en: { title: "Profile setup", sub: "A few quick questions (you can leave and resume anytime)", qCountry: "Which country do you live in?", qRegion: "Which state/region?", qRegionJp: "Which prefecture? (e.g., Tokyo)", qGender: "What is your gender?", qYear: "What year were you born?", yearPh: "e.g., 1998", regionPh: "Type here", send: "Send", done: "All set! Thank you.", toChat: "Go to chat →", saving: "Saving...", errYear: "Enter a 4-digit year between 1900 and 2020", errServer: "Failed to save. Please try again.", needLogin: "Please log in or sign up first.", toLogin: "To entry →", countries: { jp: "🇯🇵 Japan", hk: "🇭🇰 Hong Kong", tw: "Taiwan", kr: "🇰🇷 Korea", us: "🇺🇸 USA", es: "🇪🇸 Spain", fr: "🇫🇷 France", th: "🇹🇭 Thailand", other: "Other" }, genders: { male: "Male", female: "Female", other: "Other", no_answer: "Prefer not to say" } },
  "zh-hk": { title: "個人資料登記", sub: "簡單問幾條問題（中途離開可隨時繼續）", qCountry: "你住喺邊個國家/地區？", qRegion: "邊個州/地區？", qRegionJp: "邊個都道府縣？", qGender: "請選擇性別", qYear: "請輸入出生年份（西曆）", yearPh: "例: 1998", regionPh: "請輸入", send: "發送", done: "登記完成！多謝。", toChat: "前往聊天 →", saving: "儲存中...", errYear: "請輸入1900〜2020之間的4位年份", errServer: "儲存失敗，請再試一次。", needLogin: "請先登入或註冊。", toLogin: "去入口 →", countries: { jp: "🇯🇵 日本", hk: "🇭🇰 香港", tw: "台灣", kr: "🇰🇷 韓國", us: "🇺🇸 美國", es: "🇪🇸 西班牙", fr: "🇫🇷 法國", th: "🇹🇭 泰國", other: "其他" }, genders: { male: "男", female: "女", other: "其他", no_answer: "不回答" } },
  yue: { title: "個人資料登記", sub: "簡單問幾條嘢（中途走咗都可以返嚟繼續）", qCountry: "你住喺邊度？", qRegion: "邊個州/地區？", qRegionJp: "邊個都道府縣？", qGender: "你嘅性別係？", qYear: "你邊年出世？（西曆）", yearPh: "例: 1998", regionPh: "打喺度", send: "發送", done: "搞掂晒！多謝。", toChat: "去聊天 →", saving: "儲緊...", errYear: "請輸入1900〜2020之間嘅4位年份", errServer: "儲唔到，再試一次。", needLogin: "請先登入或者註冊。", toLogin: "去入口 →", countries: { jp: "🇯🇵 日本", hk: "🇭🇰 香港", tw: "台灣", kr: "🇰🇷 韓國", us: "🇺🇸 美國", es: "🇪🇸 西班牙", fr: "🇫🇷 法國", th: "🇹🇭 泰國", other: "其他" }, genders: { male: "男", female: "女", other: "其他", no_answer: "唔答" } },
  es: { title: "Registro de perfil", sub: "Unas preguntas rápidas (puedes salir y continuar luego)", qCountry: "¿En qué país vives?", qRegion: "¿Qué estado/región?", qRegionJp: "¿Qué prefectura?", qGender: "¿Cuál es tu género?", qYear: "¿En qué año naciste?", yearPh: "ej.: 1998", regionPh: "Escribe aquí", send: "Enviar", done: "¡Listo! Gracias.", toChat: "Ir al chat →", saving: "Guardando...", errYear: "Introduce un año de 4 dígitos entre 1900 y 2020", errServer: "Error al guardar. Inténtalo de nuevo.", needLogin: "Primero inicia sesión o regístrate.", toLogin: "A la entrada →", countries: { jp: "🇯🇵 Japón", hk: "🇭🇰 Hong Kong", tw: "Taiwán", kr: "🇰🇷 Corea", us: "🇺🇸 EE.UU.", es: "🇪🇸 España", fr: "🇫🇷 Francia", th: "🇹🇭 Tailandia", other: "Otro" }, genders: { male: "Hombre", female: "Mujer", other: "Otro", no_answer: "Prefiero no decir" } },
  ko: { title: "프로필 등록", sub: "몇 가지만 여쭤볼게요 (중간에 나가도 이어서 할 수 있어요)", qCountry: "어느 나라에 사시나요?", qRegion: "어느 주/지역인가요?", qRegionJp: "어느 도도부현인가요?", qGender: "성별을 알려주세요", qYear: "태어난 연도(서기)를 알려주세요", yearPh: "예: 1998", regionPh: "입력하세요", send: "전송", done: "등록 완료! 감사합니다.", toChat: "채팅으로 →", saving: "저장 중...", errYear: "1900〜2020 사이의 4자리 연도를 입력하세요", errServer: "저장에 실패했습니다. 다시 시도해주세요.", needLogin: "먼저 로그인 또는 회원가입을 해주세요.", toLogin: "입구로 →", countries: { jp: "🇯🇵 일본", hk: "🇭🇰 홍콩", tw: "대만", kr: "🇰🇷 한국", us: "🇺🇸 미국", es: "🇪🇸 스페인", fr: "🇫🇷 프랑스", th: "🇹🇭 태국", other: "기타" }, genders: { male: "남성", female: "여성", other: "기타", no_answer: "답하지 않음" } },
  fr: { title: "Création du profil", sub: "Quelques questions rapides (vous pouvez reprendre plus tard)", qCountry: "Dans quel pays vivez-vous ?", qRegion: "Quel état / quelle région ?", qRegionJp: "Quelle préfecture ?", qGender: "Quel est votre genre ?", qYear: "Quelle est votre année de naissance ?", yearPh: "ex. : 1998", regionPh: "Saisissez ici", send: "Envoyer", done: "C'est terminé ! Merci.", toChat: "Aller au chat →", saving: "Enregistrement...", errYear: "Entrez une année à 4 chiffres entre 1900 et 2020", errServer: "Échec de l'enregistrement. Réessayez.", needLogin: "Connectez-vous ou inscrivez-vous d'abord.", toLogin: "Vers l'entrée →", countries: { jp: "🇯🇵 Japon", hk: "🇭🇰 Hong Kong", tw: "Taïwan", kr: "🇰🇷 Corée", us: "🇺🇸 États-Unis", es: "🇪🇸 Espagne", fr: "🇫🇷 France", th: "🇹🇭 Thaïlande", other: "Autre" }, genders: { male: "Homme", female: "Femme", other: "Autre", no_answer: "Ne préfère pas dire" } },
  th: { title: "ลงทะเบียนโปรไฟล์", sub: "ขอถามสั้นๆ ไม่กี่ข้อ (ออกกลางคันแล้วกลับมาต่อได้)", qCountry: "คุณอาศัยอยู่ประเทศไหน?", qRegion: "รัฐ/ภูมิภาคไหน?", qRegionJp: "จังหวัดไหน?", qGender: "เพศของคุณคือ?", qYear: "คุณเกิดปีค.ศ.อะไร?", yearPh: "เช่น 1998", regionPh: "พิมพ์ที่นี่", send: "ส่ง", done: "เสร็จเรียบร้อย! ขอบคุณ", toChat: "ไปที่แชท →", saving: "กำลังบันทึก...", errYear: "กรอกปี 4 หลักระหว่าง 1900-2020", errServer: "บันทึกไม่สำเร็จ กรุณาลองใหม่", needLogin: "กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อน", toLogin: "ไปหน้าแรก →", countries: { jp: "🇯🇵 ญี่ปุ่น", hk: "🇭🇰 ฮ่องกง", tw: "ไต้หวัน", kr: "🇰🇷 เกาหลี", us: "🇺🇸 สหรัฐฯ", es: "🇪🇸 สเปน", fr: "🇫🇷 ฝรั่งเศส", th: "🇹🇭 ไทย", other: "อื่นๆ" }, genders: { male: "ชาย", female: "หญิง", other: "อื่นๆ", no_answer: "ไม่ระบุ" } },
};

const ALL_LANGS: Lang[] = ["ja", "en", "zh-hk", "yue", "es", "ko", "fr", "th"];

export default function OnboardingPage() {
  const [lang, setLang] = useState<Lang>("ja");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [noMember, setNoMember] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const t = T[lang];

  // 言語と会員IDを復元 → プロフィール取得（途中再開）
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
    fetch(`/api/profile?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProfile(data.profile as Profile);
        else setNoMember(true);
      })
      .catch(() => setNoMember(true));
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [profile, busy]);

  const currentStep: Field | null = profile
    ? STEPS.find((s) => profile[s] === null || profile[s] === undefined) ?? null
    : null;

  const save = useCallback(
    async (field: Field, value: string | number) => {
      if (!memberId || busy) return;
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: memberId, field, value }),
        });
        const data = await res.json();
        if (data.ok) {
          setProfile((p) => (p ? { ...p, [field]: value } : p)); // 即保存→画面反映
          setInput("");
        } else {
          setError(data.error === "bad_value" && field === "birth_year" ? t.errYear : t.errServer);
        }
      } catch {
        setError(t.errServer);
      } finally {
        setBusy(false);
      }
    },
    [memberId, busy, t.errYear, t.errServer]
  );

  const questionText = (s: Field): string => {
    if (s === "country") return t.qCountry;
    if (s === "region") return profile?.country === "jp" ? t.qRegionJp : t.qRegion;
    if (s === "gender") return t.qGender;
    return t.qYear;
  };

  const answerLabel = (s: Field): string => {
    if (!profile) return "";
    if (s === "country") return t.countries[profile.country ?? ""] ?? "";
    if (s === "region") return profile.region ?? "";
    if (s === "gender") return t.genders[profile.gender ?? ""] ?? "";
    return String(profile.birth_year ?? "");
  };

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

        <div className="chat onboarding" ref={chatRef}>
          {profile &&
            STEPS.map((s) => {
              const answered = profile[s] !== null && profile[s] !== undefined;
              const isCurrent = s === currentStep;
              if (!answered && !isCurrent) return null;
              return (
                <div key={s} className="ob-step">
                  <div className="msg bot">{questionText(s)}</div>
                  {answered && <div className="msg user">{answerLabel(s)}</div>}
                  {isCurrent && s === "country" && (
                    <div className="chips">
                      {COUNTRY_OPTS.map((c) => (
                        <button key={c} className="chip" disabled={busy} onClick={() => save("country", c)}>
                          {t.countries[c]}
                        </button>
                      ))}
                    </div>
                  )}
                  {isCurrent && s === "gender" && (
                    <div className="chips">
                      {GENDER_OPTS.map((g) => (
                        <button key={g} className="chip" disabled={busy} onClick={() => save("gender", g)}>
                          {t.genders[g]}
                        </button>
                      ))}
                    </div>
                  )}
                  {isCurrent && (s === "region" || s === "birth_year") && (
                    <div className="inputrow ob">
                      <input
                        value={input}
                        onChange={(e) =>
                          setInput(
                            s === "birth_year"
                              ? e.target.value.replace(/\D/g, "").slice(0, 4)
                              : e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.nativeEvent.isComposing && input.trim()) {
                            save(s, s === "birth_year" ? Number(input) : input.trim());
                          }
                        }}
                        placeholder={s === "birth_year" ? t.yearPh : t.regionPh}
                        inputMode={s === "birth_year" ? "numeric" : "text"}
                        disabled={busy}
                      />
                      <button
                        onClick={() => save(s, s === "birth_year" ? Number(input) : input.trim())}
                        disabled={busy || !input.trim() || (s === "birth_year" && input.length !== 4)}
                      >
                        {busy ? t.saving : t.send}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

          {profile && currentStep === null && (
            <div className="ob-step">
              <div className="msg bot">🎉 {t.done}</div>
              <a className="auth-btn center" href={`/chat?lang=${lang}`}>{t.toChat}</a>
            </div>
          )}

          {!profile && <div className="empty">...</div>}
        </div>

        {error && <p className="auth-error">{error}</p>}
      </main>
    </>
  );
}
