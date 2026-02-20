const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

async function check(res: Response, label: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${label} failed (${res.status}): ${text}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", cache: "no-store" });
  await check(res, `GET ${path}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  await check(res, `POST ${path}`);
  return res.json();
}

export async function apiUpload<T>(path: string, files: File[]): Promise<T> {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", credentials: "include", body: form });
  await check(res, `UPLOAD ${path}`);
  return res.json();
}
