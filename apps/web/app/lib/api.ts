function getApiBase(): string {
  const base =
    // server runtime can read both
    (typeof window === "undefined"
      ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
      : // browser bundle can read only NEXT_PUBLIC_*
        process.env.NEXT_PUBLIC_API_URL) || "";

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
    credentials: "include",
    cache: "no-store",
  });
  await assertOk(res, `GET ${path}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const API_BASE = getApiBase();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  await assertOk(res, `POST ${path}`);
  return (await res.json()) as T;
}

export async function apiUpload<T>(path: string, files: File[]): Promise<T> {
  const API_BASE = getApiBase();
  const form = new FormData();
  for (const f of files) form.append("files", f);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  await assertOk(res, `UPLOAD ${path}`);
  return (await res.json()) as T;
}