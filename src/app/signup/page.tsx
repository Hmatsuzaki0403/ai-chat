"use client";

// LESSON 2-3: 新規登録（名前 + 電話番号SMS認証）
import PhoneAuth from "@/components/PhoneAuth";

export default function SignupPage() {
  return <PhoneAuth mode="signup" />;
}
