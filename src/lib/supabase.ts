// Supabase REST API 薄いラッパー（サーバー専用・service_roleキー使用）
// 追加ライブラリ不要。環境変数: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function supabaseConfigured(): boolean {
  return cfg() !== null;
}

async function req(
  method: string,
  path: string,
  body?: unknown,
  prefer?: string
): Promise<unknown[]> {
  const c = cfg();
  if (!c) throw new Error("Supabase not configured");
  const res = await fetch(`${c.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: c.key,
      authorization: `Bearer ${c.key}`,
      "content-type": "application/json",
      prefer: prefer ?? "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${detail.slice(0, 200)}`);
  }
  if (res.status === 204) return [];
  return (await res.json()) as unknown[];
}

export const sb = {
  select: (table: string, query: string) => req("GET", `${table}?${query}`),
  insert: (table: string, row: object) => req("POST", table, row),
  upsert: (table: string, row: object, onConflict: string) =>
    req("POST", `${table}?on_conflict=${onConflict}`, row, "resolution=merge-duplicates,return=representation"),
  update: (table: string, query: string, patch: object) =>
    req("PATCH", `${table}?${query}`, patch),
  delete: (table: string, query: string) =>
    req("DELETE", `${table}?${query}`, undefined, "return=minimal"),
};
