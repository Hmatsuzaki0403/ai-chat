"use client";

// LESSON 2-2時点の仮ページ。本実装は LESSON 2-3（認証）で行う。
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";

const TEXT: Record<Lang, { title: string; note: string; back: string }> = {
  ja: { title: "ログイン", note: "このページは次のレッスン（LESSON 2-3）で作ります。", back: "← 入口へ戻る" },
  en: { title: "Log in", note: "This page will be built in the next lesson (LESSON 2-3).", back: "← Back to entry" },
  "zh-hk": { title: "登入", note: "此頁將在下一課（LESSON 2-3）建立。", back: "← 返回入口" },
  yue: { title: "登入", note: "呢頁會喺下一課（LESSON 2-3）整。", back: "← 返回入口" },
  es: { title: "Iniciar sesión", note: "Esta página se creará en la próxima lección (LESSON 2-3).", back: "← Volver a la entrada" },
  ko: { title: "로그인", note: "이 페이지는 다음 레슨(LESSON 2-3)에서 만듭니다.", back: "← 입구로 돌아가기" },
  fr: { title: "Se connecter", note: "Cette page sera créée dans la prochaine leçon (LESSON 2-3).", back: "← Retour à l'entrée" },
  th: { title: "เข้าสู่ระบบ", note: "หน้านี้จะสร้างในบทเรียนถัดไป (LESSON 2-3)", back: "← กลับไปหน้าแรก" },
};

const ALL_LANGS: Lang[] = ["ja", "en", "zh-hk", "yue", "es", "ko", "fr", "th"];

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>("ja");

  useEffect(() => {
    try {
      const v =
        new URLSearchParams(window.location.search).get("lang") ||
        localStorage.getItem("lang");
      if (v && ALL_LANGS.includes(v as Lang)) setLang(v as Lang);
    } catch {
      /* 既定の日本語のまま */
    }
  }, []);

  const t = TEXT[lang];
  return (
    <>
      <header className="site">
        <div className="kicker">NO LANGUAGE BARRIERS</div>
        <h1>GACKT CONCIERGE</h1>
      </header>
      <main className="container">
        <section className="hero">
          <h2>{t.title}</h2>
          <p>{t.note}</p>
        </section>
        <p className="guest-link">
          <Link href="/">{t.back}</Link>
        </p>
      </main>
    </>
  );
}
