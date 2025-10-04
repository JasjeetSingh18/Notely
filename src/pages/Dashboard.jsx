import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { logOut, getUid } from "/server/firebase.mjs"; // <-- import logOut
import "../css/dashboard.css";

export default function Dashboard() {
    const [notes, setNotes] = useState([]);
    const [q, setQ] = useState("");
    const nav = useNavigate();

    // ---------- REDIRECT IF NOT LOGGED IN ----------
    useEffect(() => {
        const uid = getUid();
        if (!uid) {
            nav("/"); // redirect to landing page if no UID
        }
    }, [nav]);

    // ---------- FETCH NOTES ----------
    useEffect(() => {
        (async () => {
            const list = await api("/api/docs"); // <-- from Mongo
            setNotes(list);
        })();
    }, []);

    const filtered = notes.filter(n =>
        (n.title || "").toLowerCase().includes(q.toLowerCase())
    );

    async function newDoc() {
        const doc = await api("/api/docs", { method: "POST", body: {} });
        nav(`/doc/${doc.id}`);
    }

    // ---------- SIGN OUT ----------
    const handleSignOut = async () => {
        await logOut(); // clears Firebase auth & localStorage
        nav("/"); // redirect to landing page
    };

    return (
        <div className="dash">
            <aside className="dash-side">
                <div className="brand">📝 Notely</div>
                <nav className="side-nav">
                    <a className="active">Docs</a>
                    <a>Version history</a>
                    <a>Trash</a>
                    <a>Account</a>
                    <a>Apps</a>
                    <a className="signoutDash" onClick={handleSignOut}>
                        ⏻ Sign out
                    </a>
                </nav>
            </aside>

            <main className="dash-main">
                <div className="dash-topbar">
                    <h1>Docs</h1>
                    <div className="actions">
                        <button className="btn" onClick={newDoc}>➕ New doc</button>
                        <button className="btn ghost">⬆️ Upload</button>
                    </div>
                </div>

                <div className="dash-search">
                    <input
                        placeholder="Search docs"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                    />
                </div>

                <section className="cards-grid">
                    {filtered.length === 0 && (
                        <div className="empty">No docs yet. Click <b>New doc</b>.</div>
                    )}
                    {filtered.map(n => (
                        <article key={n.id} className="card" onClick={() => nav(`/doc/${n.id}`)}>
                            <div className="card-icon">📄</div>
                            <div className="card-title">{n.title || "Untitled doc"}</div>
                            <div className="card-meta">
                                Edited {new Date(n.updatedAt).toLocaleString()}
                            </div>
                            <button className="kebab" onClick={e => e.stopPropagation()}>⋯</button>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    );
}