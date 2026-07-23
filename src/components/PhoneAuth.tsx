"use client";

// LESSON 2-3: 電話番号SMS認証フォーム（ログイン/新規登録 共用）
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";

type Step = "phone" | "code" | "done";

const T: Record<
  Lang,
  {
    loginTitle: string; signupTitle: string; phone: string; name: string;
    sendCode: string; resendIn: string; resend: string; codeLabel: string;
    verify: string; success: string; toChat: string; back: string;
    devNote: string; expiresNote: string;
    errBadPhone: string; errTooSoon: string; errSendLimit: string;
    errLocked: string; errExpired: string; errInvalid: string;
    errNotConfigured: string; errServer: string;
  }
> = {
  ja: { loginTitle: "ログイン", signupTitle: "新規登録", phone: "電話番号（例: 09012345678）", name: "お名前（ニックネーム可）", sendCode: "認証コードを送る", resendIn: "再送まで", resend: "コードを再送する", codeLabel: "6桁の認証コード", verify: "確認する", success: "本人確認が完了しました！", toChat: "チャットへ進む →", back: "← 入口へ戻る", devNote: "開発モード: 本来はSMSで届きます。コード:", expiresNote: "コードの有効期限は60秒です", errBadPhone: "電話番号の形式が正しくありません。", errTooSoon: "送信間隔が短すぎます。少し待ってください。", errSendLimit: "送信回数の上限に達しました。時間をおいてください。", errLocked: "試行回数の上限に達したため、一時的にロックされています。", errExpired: "コードの有効期限（60秒）が切れました。再送してください。", errInvalid: "コードが違います。残り試行回数:", errNotConfigured: "サーバーの設定が未完了です（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）。", errServer: "エラーが発生しました。少し待ってからもう一度どうぞ。" },
  en: { loginTitle: "Log in", signupTitle: "Sign up", phone: "Phone number", name: "Your name (nickname OK)", sendCode: "Send verification code", resendIn: "Resend in", resend: "Resend code", codeLabel: "6-digit code", verify: "Verify", success: "Verification complete!", toChat: "Go to chat →", back: "← Back to entry", devNote: "Dev mode: normally sent via SMS. Code:", expiresNote: "The code expires in 60 seconds", errBadPhone: "Invalid phone number format.", errTooSoon: "Please wait before resending.", errSendLimit: "Send limit reached. Please try later.", errLocked: "Too many attempts. Temporarily locked.", errExpired: "The code expired (60s). Please resend.", errInvalid: "Wrong code. Attempts left:", errNotConfigured: "Server not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", errServer: "Something went wrong. Please try again." },
  "zh-hk": { loginTitle: "登入", signupTitle: "註冊", phone: "電話號碼", name: "姓名（可用暱稱）", sendCode: "發送驗證碼", resendIn: "重發倒數", resend: "重發驗證碼", codeLabel: "6位驗證碼", verify: "確認", success: "驗證完成！", toChat: "前往聊天 →", back: "← 返回入口", devNote: "開發模式：正式環境會以SMS發送。驗證碼:", expiresNote: "驗證碼有效期為60秒", errBadPhone: "電話號碼格式不正確。", errTooSoon: "發送太頻繁，請稍候。", errSendLimit: "已達發送上限，請稍後再試。", errLocked: "嘗試次數過多，暫時鎖定。", errExpired: "驗證碼已過期（60秒），請重發。", errInvalid: "驗證碼錯誤。剩餘次數:", errNotConfigured: "伺服器尚未設定完成。", errServer: "發生錯誤，請稍後再試。" },
  yue: { loginTitle: "登入", signupTitle: "註冊", phone: "電話號碼", name: "名（花名都得）", sendCode: "發送驗證碼", resendIn: "重發倒數", resend: "重發驗證碼", codeLabel: "6位驗證碼", verify: "確認", success: "驗證完成！", toChat: "去聊天 →", back: "← 返回入口", devNote: "開發模式：正式環境會用SMS發送。驗證碼:", expiresNote: "驗證碼60秒內有效", errBadPhone: "電話號碼格式唔啱。", errTooSoon: "發送得太密，等陣先。", errSendLimit: "已達發送上限，遲啲再試。", errLocked: "試得太多次，暫時鎖咗。", errExpired: "驗證碼過咗期（60秒），請重發。", errInvalid: "驗證碼唔啱。仲有次數:", errNotConfigured: "伺服器未設定好。", errServer: "出錯喇，等陣再試。" },
  es: { loginTitle: "Iniciar sesión", signupTitle: "Registrarse", phone: "Número de teléfono", name: "Tu nombre (apodo OK)", sendCode: "Enviar código", resendIn: "Reenviar en", resend: "Reenviar código", codeLabel: "Código de 6 dígitos", verify: "Verificar", success: "¡Verificación completada!", toChat: "Ir al chat →", back: "← Volver a la entrada", devNote: "Modo dev: normalmente llega por SMS. Código:", expiresNote: "El código caduca en 60 segundos", errBadPhone: "Formato de teléfono no válido.", errTooSoon: "Espera antes de reenviar.", errSendLimit: "Límite de envíos alcanzado.", errLocked: "Demasiados intentos. Bloqueado temporalmente.", errExpired: "El código caducó (60s). Reenvíalo.", errInvalid: "Código incorrecto. Intentos restantes:", errNotConfigured: "Servidor sin configurar.", errServer: "Ocurrió un error. Inténtalo de nuevo." },
  ko: { loginTitle: "로그인", signupTitle: "회원가입", phone: "전화번호", name: "이름(닉네임 가능)", sendCode: "인증코드 보내기", resendIn: "재전송까지", resend: "코드 재전송", codeLabel: "6자리 인증코드", verify: "확인", success: "본인 확인 완료!", toChat: "채팅으로 →", back: "← 입구로 돌아가기", devNote: "개발 모드: 실제로는 SMS로 발송됩니다. 코드:", expiresNote: "코드 유효시간은 60초입니다", errBadPhone: "전화번호 형식이 올바르지 않습니다.", errTooSoon: "잠시 후 다시 보내주세요.", errSendLimit: "전송 한도에 도달했습니다.", errLocked: "시도 횟수 초과로 일시 잠금되었습니다.", errExpired: "코드가 만료되었습니다(60초). 재전송하세요.", errInvalid: "코드가 다릅니다. 남은 횟수:", errNotConfigured: "서버 설정이 완료되지 않았습니다.", errServer: "오류가 발생했습니다. 다시 시도해주세요." },
  fr: { loginTitle: "Se connecter", signupTitle: "S'inscrire", phone: "Numéro de téléphone", name: "Votre nom (pseudo OK)", sendCode: "Envoyer le code", resendIn: "Renvoi dans", resend: "Renvoyer le code", codeLabel: "Code à 6 chiffres", verify: "Vérifier", success: "Vérification terminée !", toChat: "Aller au chat →", back: "← Retour à l'entrée", devNote: "Mode dev : normalement envoyé par SMS. Code :", expiresNote: "Le code expire dans 60 secondes", errBadPhone: "Format de numéro invalide.", errTooSoon: "Attendez avant de renvoyer.", errSendLimit: "Limite d'envois atteinte.", errLocked: "Trop de tentatives. Verrouillé temporairement.", errExpired: "Code expiré (60 s). Renvoyez-le.", errInvalid: "Code incorrect. Essais restants :", errNotConfigured: "Serveur non configuré.", errServer: "Une erreur est survenue. Réessayez." },
  th: { loginTitle: "เข้าสู่ระบบ", signupTitle: "สมัครสมาชิก", phone: "หมายเลขโทรศัพท์", name: "ชื่อ (ใช้ชื่อเล่นได้)", sendCode: "ส่งรหัสยืนยัน", resendIn: "ส่งใหม่ได้ใน", resend: "ส่งรหัสอีกครั้ง", codeLabel: "รหัส 6 หลัก", verify: "ยืนยัน", success: "ยืนยันตัวตนสำเร็จ!", toChat: "ไปที่แชท →", back: "← กลับหน้าแรก", devNote: "โหมดพัฒนา: ปกติจะส่งทาง SMS รหัส:", expiresNote: "รหัสมีอายุ 60 วินาที", errBadPhone: "รูปแบบหมายเลขไม่ถูกต้อง", errTooSoon: "กรุณารอสักครู่ก่อนส่งใหม่", errSendLimit: "ถึงขีดจำกัดการส่งแล้ว", errLocked: "พยายามหลายครั้งเกินไป ถูกล็อกชั่วคราว", errExpired: "รหัสหมดอายุ (60 วินาที) กรุณาส่งใหม่", errInvalid: "รหัสไม่ถูกต้อง เหลืออีก:", errNotConfigured: "เซิร์ฟเวอร์ยังตั้งค่าไม่เสร็จ", errServer: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
};

const ALL_LANGS: Lang[] = ["ja", "en", "zh-hk", "yue", "es", "ko", "fr", "th"];

export default function PhoneAuth({ mode }: { mode: "login" | "signup" }) {
  const [lang, setLang] = useState<Lang>("ja");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [normPhone, setNormPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const v =
        new URLSearchParams(window.location.search).get("lang") ||
        localStorage.getItem("lang");
      if (v && ALL_LANGS.includes(v as Lang)) setLang(v as Lang);
    } catch {
      /* ja のまま */
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const t = T[lang];

  const startCountdown = (sec: number) => {
    setCountdown(sec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1 && timerRef.current) clearInterval(timerRef.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const mapError = (data: { error?: string; remaining?: number; waitSec?: number }) => {
    switch (data.error) {
      case "bad_phone": return t.errBadPhone;
      case "too_soon": return `${t.errTooSoon} (${data.waitSec ?? ""}s)`;
      case "send_limit": return t.errSendLimit;
      case "locked": return t.errLocked;
      case "expired": return t.errExpired;
      case "invalid":
      case "not_found":
        return data.remaining !== undefined
          ? `${t.errInvalid} ${data.remaining}`
          : t.errExpired;
      case "not_configured": return t.errNotConfigured;
      default: return t.errServer;
    }
  };

  const sendCode = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setDevCode("");
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.ok) {
        setNormPhone(data.phone);
        if (data.devCode) setDevCode(data.devCode);
        setStep("code");
        setCode("");
        startCountdown(60);
      } else {
        setError(mapError(data));
      }
    } catch {
      setError(t.errServer);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: normPhone,
          code,
          name: mode === "signup" ? name : undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        try {
          localStorage.setItem(
            "member",
            JSON.stringify({ id: data.memberId, phone: data.phone })
          );
        } catch { /* 保存できなくても続行 */ }
        setStep("done");
      } else {
        setError(mapError(data));
        if (data.error === "expired" || data.error === "locked") setCode("");
      }
    } catch {
      setError(t.errServer);
    } finally {
      setBusy(false);
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
          <h2>{mode === "login" ? t.loginTitle : t.signupTitle}</h2>
          <p>{t.expiresNote}</p>
        </section>

        <div className="auth-card">
          {step === "phone" && (
            <>
              {mode === "signup" && (
                <input
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.name}
                  maxLength={50}
                />
              )}
              <input
                className="auth-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phone}
                inputMode="tel"
                maxLength={20}
              />
              <button
                className="auth-btn"
                onClick={sendCode}
                disabled={busy || !phone.trim() || (mode === "signup" && !name.trim())}
              >
                {busy ? "..." : t.sendCode}
              </button>
            </>
          )}

          {step === "code" && (
            <>
              {devCode && (
                <p className="dev-note">
                  {t.devNote} <strong>{devCode}</strong>
                </p>
              )}
              <input
                className="auth-input code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t.codeLabel}
                inputMode="numeric"
                maxLength={6}
              />
              <button
                className="auth-btn"
                onClick={verify}
                disabled={busy || code.length !== 6}
              >
                {busy ? "..." : t.verify}
              </button>
              {countdown > 0 ? (
                <p className="auth-sub">{t.resendIn} {countdown}s</p>
              ) : (
                <button className="auth-link" onClick={sendCode} disabled={busy}>
                  {t.resend}
                </button>
              )}
            </>
          )}

          {step === "done" && (
            <>
              <p className="auth-success">✅ {t.success}</p>
              <a className="auth-btn center" href={`/chat?lang=${lang}`}>
                {t.toChat}
              </a>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
        </div>

        <p className="guest-link">
          <Link href="/">{t.back}</Link>
        </p>
      </main>
    </>
  );
}
