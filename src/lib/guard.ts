// リクエストガード: IPレートリミット + セッション直列化 + 入力バリデーション

const MAX_MESSAGE_LEN = 500;
const RATE_LIMIT = 10; // 1分あたり
const WINDOW_MS = 60_000;

const buckets = new Map<string, number[]>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    buckets.set(ip, arr);
    return false;
  }
  arr.push(now);
  buckets.set(ip, arr);
  return true;
}

export function validateMessage(
  message: unknown
): { ok: true; message: string } | { ok: false; reason: "empty" | "too_long" } {
  if (typeof message !== "string" || !message.trim()) {
    return { ok: false, reason: "empty" };
  }
  const trimmed = message.trim();
  if (trimmed.length > MAX_MESSAGE_LEN) {
    return { ok: false, reason: "too_long" };
  }
  return { ok: true, message: trimmed };
}

// セッション（IP）ごとの直列化: 同一クライアントの連打をキューイングし、
// LLM APIへの同時リクエストによるレート制限自爆を防ぐ
const chains = new Map<string, Promise<unknown>>();

export function serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn); // 前段が失敗しても次は実行
  const guard = next.catch(() => {});
  chains.set(key, guard);
  // メモリリーク防止: 自分が末尾のままチェーンが終わったら掃除
  guard.then(() => {
    if (chains.get(key) === guard) chains.delete(key);
  });
  return next;
}
