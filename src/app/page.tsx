"use client";

// LESSON 2-2: 入口ページ — 言語を選んで、ログイン／新規登録へ進む
import { useState } from "react";
import Link from "next/link";
import { LANGS, type Lang } from "@/lib/i18n";

const ENTRY_TEXT: Record<
  Lang,
  { welcome: string; sub: string; login: string; signup: string; guest: string }
> = {
  ja: { welcome: "ようこそ", sub: "言語を選んで、ログインまたは新規登録へ進んでください。", login: "ログイン", signup: "新規登録", guest: "ログインせずにチャットを試す" },
  en: { welcome: "Welcome", sub: "Choose your language, then log in or sign up.", login: "Log in", signup: "Sign up", guest: "Try the chat without logging in" },
  "zh-hk": { welcome: "歡迎", sub: "請選擇語言，然後登入或註冊。", login: "登入", signup: "註冊", guest: "不登入直接試用聊天" },
  yue: { welcome: "歡迎", sub: "揀好語言，再登入或者註冊。", login: "登入", signup: "註冊", guest: "唔登入直接試吓聊天" },
  es: { welcome: "Bienvenido", sub: "Elige tu idioma y luego inicia sesión o regístrate.", login: "Iniciar sesión", signup: "Registrarse", guest: "Probar el chat sin iniciar sesión" },
  ko: { welcome: "환영합니다", sub: "언어를 선택한 후 로그인 또는 회원가입으로 진행하세요.", login: "로그인", signup: "회원가입", guest: "로그인 없이 채팅 체험하기" },
  fr: { welcome: "Bienvenue", sub: "Choisissez votre langue, puis connectez-vous ou inscrivez-vous.", login: "Se connecter", signup: "S'inscrire", guest: "Essayer le chat sans se connecter" },
  th: { welcome: "ยินดีต้อนรับ", sub: "เลือกภาษา แล้วเข้าสู่ระบบหรือสมัครสมาชิก", login: "เข้าสู่ระบบ", signup: "สมัครสมาชิก", guest: "ลองแชทโดยไม่ต้องเข้าสู่ระบบ" },
};

export default function EntryPage() {
  const [lang, setLang] = useState<Lang>("ja");
  const t = ENTRY_TEXT[lang];

  const remember = () => {
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* プライベートモード等では保存できなくてもよい */
    }
  };

  return (
    <>
      <header className="site">
        <div className="kicker">NO LANGUAGE BARRIERS</div>
        <h1>GACKT CONCIERGE</h1>
      </header>

      <main className="container">
        <section className="hero">
          <h2>{t.welcome}</h2>
          <p>{t.sub}</p>
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

        <div className="entry-actions">
          <Link
            href={`/login?lang=${lang}`}
            className="entry-btn primary"
            onClick={remember}
          >
            {t.login}
          </Link>
          <Link
            href={`/signup?lang=${lang}`}
            className="entry-btn"
            onClick={remember}
          >
            {t.signup}
          </Link>
        </div>

        <p className="guest-link">
          <Link href={`/chat?lang=${lang}`} onClick={remember}>
            {t.guest} →
          </Link>
        </p>
      </main>
    </>
  );
}
