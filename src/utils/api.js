export async function api(path, { method = "GET", body, headers } = {}) {
    const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json", ...(headers || {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
}
