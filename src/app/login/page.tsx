"use client";

// LESSON 2-3: ログイン（電話番号SMS認証）
import PhoneAuth from "@/components/PhoneAuth";

export default function LoginPage() {
  return <PhoneAuth mode="login" />;
}
