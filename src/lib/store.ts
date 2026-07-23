// 統計ストア: status="ok" の応答のみを集計する。エラーは別カウンタで運用者向けに保持。
// デフォルトはプロセス内メモリ（デモ・小規模用）。
// 本番は STATS_BACKEND=kv + Vercel KV / Postgres に差し替え可能な抽象化にしてある。

import type { Category } from "./classify";
import type { Lang } from "./i18n";

export type StatsSnapshot = {
  total: number;
  byCategory: Record<Category, number>;
  byLanguage: Partial<Record<Lang, number>>;
  systemErrors: number; // 運用者向け。ダッシュボードのファン向け統計には混ぜない
};

type Store = {
  recordOk(category: Category, lang: Lang): Promise<void>;
  recordError(): Promise<void>;
  snapshot(): Promise<StatsSnapshot>;
};

// ---- In-memory 実装（デフォルト） ----
const mem: StatsSnapshot = {
  total: 0,
  byCategory: { inquiry: 0, ticket: 0, reaction: 0, other: 0 },
  byLanguage: {},
  systemErrors: 0,
};

const memoryStore: Store = {
  async recordOk(category, lang) {
    mem.total += 1;
    mem.byCategory[category] += 1;
    mem.byLanguage[lang] = (mem.byLanguage[lang] ?? 0) + 1;
  },
  async recordError() {
    mem.systemErrors += 1; // total には加えない = 例外を作らない
  },
  async snapshot() {
    return structuredClone(mem);
  },
};

// ---- KV 実装への差し替えポイント ----
// Vercel KV を使う場合は @vercel/kv を追加し、ここに kvStore を実装して
// STATS_BACKEND=kv で切り替える。インターフェースは同一。
export function getStore(): Store {
  return memoryStore;
}
