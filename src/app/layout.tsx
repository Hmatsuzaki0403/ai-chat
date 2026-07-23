import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GACKT CONCIERGE — NO LANGUAGE BARRIERS",
  description:
    "GACKTについて8言語で答えるファン向けAIコンシェルジュ。リアルタイム分析ダッシュボード付き。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
