function getApiBase(): string {
  // In browser bundles, only NEXT_PUBLIC_* is available
  const base =
    (typeof window === "undefined"
      ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "";

  if (!base) {
    throw new Error(
      "Missing API base URL. Set NEXT_PUBLIC_API_URL (and optionally API_URL) in Vercel env vars."
    );
  }

  return base.replace(/\/$/, "");
}

async function assertOk(res: Response, label: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${label} failed (${res.status}): ${text || "Server error"}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
  });
  await assertOk(res, `GET ${path}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await assertOk(res, `POST ${path}`);
  return res.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, files: File[]): Promise<T> {
  const API_BASE = getApiBase();
  const form = new FormData();
  for (const f of files) form.append("files", f);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
  });

  await assertOk(res, `UPLOAD ${path}`);
  return res.json() as Promise<T>;
}