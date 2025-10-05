// src/App.jsx
import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "./index.css";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Start typing or select text and click Ask AI.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    console.log("App mounted"); // <-- must appear once in Console
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing or insert using /",
      }),
    ],
    content: "<h1>Untitled doc</h1><p></p>",
    editorProps: {
      attributes: { class: "prosemirror-content" },
    },
  });

  if (!editor) return null;

  const getSelectedText = () => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  };

  async function askAIFromSelection() {
    const selected = getSelectedText();
    if (!selected) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Select some text first." },
      ]);
      return;
    }
    try {
      const data = await api("/api/ai/inline", {
        method: "POST",
        body: {
          prompt: `Explain briefly: ${selected}`,
          contextHtml: editor.getHTML(),
        },
      });
      editor
        .chain()
        .focus()
        .insertContent(`<blockquote>${escapeHtml(data.answer)}</blockquote>`)
        .run();
      setMessages((m) => [
        ...m,
        { role: "user", content: selected },
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      // fallback if Express isn't running
      const mock = `Mock answer for "${selected}". (Start the Express server to call the real /api.)`;
      editor
        .chain()
        .focus()
        .insertContent(`<blockquote>${escapeHtml(mock)}</blockquote>`)
        .run();
      setMessages((m) => [
        ...m,
        { role: "user", content: selected },
        { role: "assistant", content: mock },
      ]);
    }
  }

  async function sendChat() {
    console.log("sendChat() fired"); // <-- proves the click handler runs
    const prompt = input.trim();
    if (!prompt || sending) return;

    // optimistic UI
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setInput("");
    setSending(true);

    try {
      const contextHtml = editor?.getHTML?.() ?? ""; // safe if editor is null
      const data = await api("/api/ai/chat", {
        method: "POST",
        body: { prompt, contextHtml },
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data?.answer ?? "(no answer)" },
      ]);
    } catch (err) {
      console.error("sendChat error:", err); // <-- check Console if this hits
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "(Mock) Start Express or fix /api/ai/chat",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app">
      {/* Header like Grammarly */}
      <header className="app-header">
        <div className="crumbs">
          <span className="home-dot" /> <span>Untitled doc</span>
        </div>
        <div className="hdr-actions">
          <button className="btn ghost" onClick={askAIFromSelection}>
            Ask AI
          </button>
          <button className="btn primary">Share</button>
        </div>
      </header>

      {/* Main content: editor + sidebar */}
      <div className="content">
        <div className="editor-panel">
          <EditorContent editor={editor} />
        </div>

        <aside className="sidebar">
          <div className="sidebar-header">AI Chat</div>

          <div className="agents">
            <div className="agent">Grammarly Proofreader</div>
            <div className="agent">AI Grader</div>
            <div className="agent">Citation Finder</div>
            <div className="agent">AI Detector</div>
          </div>

          <div className="chat-scroll">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <b>{m.role === "user" ? "You" : "AI"}</b>
                <div className="msg-body">{m.content}</div>
              </div>
            ))}
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
          >
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
            <button
              type="submit"
              className="btn primary"
              disabled={!input.trim() || sending}
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
