// client-side API helper
// Uses VITE_API_BASE env var (set during build) or falls back to same-origin
const API_BASE = import.meta.env.VITE_API_BASE || "";

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
