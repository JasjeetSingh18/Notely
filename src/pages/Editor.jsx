import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Toolbar, { Bubble as ToolbarBubble, Floating as ToolbarFloating } from "../components/Toolbar/Toolbar";

import { api } from "../utils/api";
import "../css/index.css";


export default function EditorPage() {
    const { id } = useParams();
    const nav = useNavigate();

    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! Select text and click Ask AI, or send a chat." }
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const saveTimer = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Start typing or insert using /" }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Highlight,
        ],
        content: "<h1>Loading…</h1>",
        editorProps: { attributes: { class: "prosemirror-content" } },
        onUpdate: ({ editor }) => {
            // Debounced autosave to Mongo
            const html = editor.getHTML();
            const div = document.createElement("div"); div.innerHTML = html;
            const title = div.querySelector("h1,h2,h3,p")?.textContent?.trim() || "Untitled doc";

            clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                api(`/api/docs/${id}`, { method: "PUT", body: { title, contentHtml: html } })
                    .catch(() => { }); // ignore transient errors in autosave
            }, 400);
        },
    });

    // Load the doc from Mongo on mount
    useEffect(() => {
        (async () => {
            try {
                const doc = await api(`/api/docs/${id}`);
                editor?.commands?.setContent(doc.contentHtml || "<h1>Untitled doc</h1><p></p>");

                const chatRes = await api(`/api/docs/${id}/chat`);
                const loadedMessages = chatRes.messages?.length
                    ? chatRes.messages
                    : [{ role: "assistant", content: "Hi! Select text and click Ask AI, or send a chat." }];

                setMessages(loadedMessages);

                setLoaded(true);
            } catch {
                nav("/"); // not found -> back to dashboard
            }
        })();
        return () => clearTimeout(saveTimer.current);
    }, [id, editor, nav]);

    if (!editor || !loaded) return null;



    // Can add the extra functionality for the ai prompt here when we get to that.
    function getSelectedText() {
        const { from, to } = editor.state.selection;
        return editor.state.doc.textBetween(from, to, " ");
    }

async function askAIFromSelection() {
    const selected = getSelectedText();
    if (!selected) {
        addMessages([{ role: "assistant", content: "Select some text first." }]);
        return;
    }

    try {
        const res = await fetch("/api/ai/inline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `Explain briefly: ${selected}`, contextHtml: editor.getHTML() }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        editor.chain().focus().insertContent(`<blockquote>${escapeHtml(data.answer)}</blockquote>`).run();
        addMessages([
            { role: "user", content: selected },
            { role: "assistant", content: data.answer },
        ]);
    } catch {
        const mock = `Mock answer for "${selected}". (Start Express for real /api.)`;
        editor.chain().focus().insertContent(`<blockquote>${escapeHtml(mock)}</blockquote>`).run();
        addMessages([
            { role: "user", content: selected },
            { role: "assistant", content: mock },
        ]);
    }
}

    async function addMessages(newMessages) {
    setMessages((prev) => {
        const updated = [...prev, ...newMessages];
        // Save to Mongo
        api(`/api/docs/${id}/chat`, {
        method: "PUT",
        body: { messages: updated },
        }).catch((err) => console.error("Chat save failed:", err));
        return updated;
    });
    }

async function sendChat(e) {
    e?.preventDefault?.();
    const prompt = input.trim();
    if (!prompt || sending) return;

    addMessages([{ role: "user", content: prompt }]);
    setInput("");
    setSending(true);

    try {
        const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, contextHtml: editor?.getHTML?.() ?? "" }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        addMessages([{ role: "assistant", content: data?.answer ?? "(no answer)" }]);
    } catch (err) {
        console.error("sendChat error:", err);
        addMessages([{ role: "assistant", content: "(Mock) Start Express or fix /api/ai/chat" }]);
    } finally {
        setSending(false);
    }
}

    // Default display when we open a document.

    // Need to fix the placement of the toolbar ---------------------------
    return (
        <div className="app">
            <header className="app-header">
                <div className="crumbs">
                    <span className="home-dot" /> <button className="link" onClick={() => nav("/")}>Docs</button>
                    <span className="sep">/</span>
                    <span>Note {id}</span>
                </div>
                <div className="hdr-actions">
                    <button className="btn ghost" onClick={askAIFromSelection}>Ask AI</button>
                    <button className="btn primary">Share</button>
                </div>

            </header>

            <div className="content">
                <div className="editor-panel">
                    <Toolbar editor={editor} />
                    <EditorContent editor={editor} />
                </div>


                <aside className="sidebar">
                    <div className="sidebar-header">AI Chat</div>
                    <div className="chat-scroll">
                        {messages.map((m, i) => (
                            <div key={i} className={`msg ${m.role}`}>
                                <b>{m.role === "user" ? "You" : "AI"}</b>
                                <div className="msg-body">{m.content}</div>
                            </div>
                        ))}
                    </div>
                    <form className="composer" onSubmit={sendChat}>
                        <textarea
                            placeholder="Ask AI"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendChat();
                                }
                            }}
                        />
                        <button type="submit" className="btn primary">
                            {sending ? "Sending…" : "Send"}
                        </button>
                    </form>
                </aside>
            </div>
        </div>
    );
}

function escapeHtml(s) {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
