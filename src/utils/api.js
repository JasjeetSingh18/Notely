// client-side API helper
// Uses VITE_API_BASE env var (set during build) or falls back to Render URL in dev
const FALLBACK_RENDER = "https://notely-397h.onrender.com";
const API_BASE =
  import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? FALLBACK_RENDER : "");

if (import.meta.env.DEV) {
  console.log("[api] effective API_BASE:", API_BASE || "(same-origin)");
}

function getClientUid() {
  try {
    return localStorage.getItem("uid") || "anon";
  } catch (e) {
    return "anon";
  }
}

export async function api(path, { method = "GET", body, headers } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-owner": getClientUid(),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
