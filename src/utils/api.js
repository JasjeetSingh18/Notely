
import { getUid } from "../../server/firebase.mjs";
export async function api(path, { method = 'GET', body, headers } = {}) {
    const res = await fetch(path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-owner': getUid() || 'anon',      // <— send Firebase UID here
            ...(headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}