import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Toolbar, {
  Bubble as ToolbarBubble,
  Floating as ToolbarFloating,
} from "../components/Toolbar/Toolbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Document } from "@tiptap/extension-document";

import { api } from "../utils/api";
import "../css/index.css";

export default function EditorPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Select text and click Ask AI, or send a chat.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [lastMode, setLastMode] = useState(null);
  const [insertLabel, setInsertLabel] = useState("Insert");
  const NonEmptyDocument = Document.extend({
    content: "block+",
  });
  const BackspaceKeepParagraph = Extension.create({
    addKeyboardShortcuts() {
      return {
        Backspace: () => {
          // If the editor is empty after the backspace, re-seed with a paragraph.
          if (this.editor.isEmpty) {
            this.editor.commands.setContent("<p></p>", false);
            this.editor.commands.focus();
            return true; // handled
          }
          return false;
        },
      };
    },
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const saveTimer = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    const chatEl = chatScrollRef.current;
    if (chatEl)
      chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const editor = useEditor({
    extensions: [
      NonEmptyDocument,
      StarterKit,
      Placeholder.configure({ placeholder: "Start typing or insert using /" }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Highlight,
      BackspaceKeepParagraph,
    ],
    content: "<h1>Loading…</h1>",
    editorProps: { attributes: { class: "prosemirror-content" } },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const div = document.createElement("div");
      div.innerHTML = html;
      const title =
        div.querySelector("h1,h2,h3,p")?.textContent?.trim() || "Untitled doc";

      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api(`/api/docs/${id}`, {
          method: "PUT",
          body: { title, contentHtml: html },
        }).catch(() => {});
      }, 400);
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const doc = await api(`/api/docs/${id}`);
        editor?.commands?.setContent(
          doc.contentHtml || "<h1>Untitled doc</h1><p></p>"
        );
        const chatRes = await api(`/api/docs/${id}/chat`);
        setMessages(
          chatRes.messages?.length
            ? chatRes.messages
            : [
                {
                  role: "assistant",
                  content: "Hi! Select text and click Ask AI, or send a chat.",
                },
              ]
        );
        setLoaded(true);
      } catch {
        nav("/");
      }
    })();
    return () => clearTimeout(saveTimer.current);
  }, [id, editor, nav]);

  if (!editor || !loaded) return null;

  // --- helpers ---
  function getSelectedText() {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  }

  async function addMessages(newMessages) {
    setMessages((prev) => {
      const updated = [...prev, ...newMessages];
      api(`/api/docs/${id}/chat`, {
        method: "PUT",
        body: { messages: updated },
      }).catch(console.error);
      return updated;
    });
  }

  // --- MAIN FUNCTIONS ---

  // Sends selected text to AI → result appears in chat (not in note)
  async function askAIFromSelection(mode) {
    const selected = getSelectedText();
    if (!selected) {
      setToast("Please select some text first.");
      return;
    }

    const wordCount = selected.trim().split(/\s+/).length;
    if (wordCount > 100) {
      setToast(
        `Selected text is too long (${wordCount} words). Please select a shorter section.`
      );
      return;
    }

    setToast("Generating…");
    setLastMode(mode); // 👈 store the last mode used

    try {
      const data = await api("/api/ai/inline", {
        method: "POST",
        body: {
          prompt: `${mode.toUpperCase()} the following: ${selected}`,
          contextHtml: editor.getHTML(),
          mode,
        },
      });

      await addMessages([
        { role: "user", content: `${mode.toUpperCase()}:\n${selected}` },
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      await addMessages([
        {
          role: "assistant",
          content: `Mock ${mode} response for "${selected}".`,
        },
      ]);
    } finally {
      setToast("");
    }
  }

  // Inserts last AI message into the editor
  function insertLatestAIResponse() {
    const lastAI = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAI) {
      setToast("No AI response found to insert.");
      return;
    }

    const to = editor.state.selection.to;
    const clean = formatAIAnswer(lastAI.content).trim();
    const label = lastMode ? lastMode.toUpperCase() : "AI";

    editor
      .chain()
      .focus()
      .insertContentAt(
        to,
        `<blockquote><strong>${label}:</strong> ${clean}</blockquote><p></p>`
      )
      .run();

    setToast(`Inserted ${label} response into note.`);
  }

  async function enhanceSelection() {
    const { from, to } = editor.state.selection;
    const selected = getSelectedText();
    if (!selected) {
      setToast("Please select some text to enhance.");
      return;
    }

    setToast("Enhancing…");

    try {
      const data = await api("/api/ai/enhance", {
        method: "POST",
        body: { prompt: selected, contextHtml: editor.getHTML() },
      });
      const enhancedText = data?.answer || selected;

      // Format AI answer (bold, italics, lists)
      const clean = formatAIAnswer(enhancedText);

      // Replace the selected text directly
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, clean)
        .run();
    } catch (err) {
      console.error("Enhance error:", err);
      setToast("Failed to enhance. Try again.");
    } finally {
      setToast("");
    }
  }

  // --- chat send ---

  async function sendChat(e) {
    e?.preventDefault?.();
    const prompt = input.trim();
    if (!prompt) {
      setToast("Please enter a message before sending.");
      return;
    }
    if (sending) return;

    // Update chat UI
    addMessages([{ role: "user", content: prompt }]);
    setInput("");
    setSending(true);

    // Change insert button label while awaiting response
    setInsertLabel("Insert AI Answer");

    try {
      const data = await api("/api/ai/chat", {
        method: "POST",
        body: { prompt, contextHtml: editor?.getHTML?.() ?? "" },
      });
      addMessages([
        { role: "assistant", content: data?.answer ?? "(no answer)" },
      ]);
    } catch (err) {
      console.error("sendChat error:", err);
      addMessages([
        {
          role: "assistant",
          content: "(Mock) Start Express or fix /api/ai/chat",
        },
      ]);
    } finally {
      setSending(false);
      // Reset button label after AI finishes responding
      setInsertLabel("Insert");
    }
  }

  // Default display when we open a document.

  // Need to fix the placement of the toolbar ---------------------------
  return (
    <div className="app">
      <header className="app-header">
        <div className="crumbs">
          <span className="home-dot" />{" "}
          <button className="link" onClick={() => nav("/")}>
            Docs
          </button>
          <span className="sep">/</span>
          <span>Note:</span>
        </div>
        <div className="hdr-actions">
          <button
            className="btn ghost"
            onClick={() => askAIFromSelection("explain")}
          >
            Explain
          </button>
          <button
            className="btn ghost"
            onClick={() => askAIFromSelection("expand")}
          >
            Expand
          </button>
          <button
            className="btn ghost"
            onClick={() => askAIFromSelection("summarize")}
          >
            Summarize
          </button>
          <button
            className="btn ghost"
            onClick={() => askAIFromSelection("question")}
          >
            Question
          </button>
          <button
            className="btn ghost"
            onClick={() => askAIFromSelection("connect")}
          >
            Connect
          </button>
          <button className="btn primary" onClick={enhanceSelection}>
            Enhance
          </button>
        </div>
      </header>

      <div className="content">
        <div className="editor-panel">
          <Toolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>

        <aside className="sidebar">
          <div className="sidebar-header">AI Chat</div>
          <div className="chat-scroll" ref={chatScrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <b>{m.role === "user" ? "You" : "AI"}</b>
                <div className="msg-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
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
                  sendChat(e);
                }
              }}
            />
            <div className="composer-buttons">
              <button type="submit" className="btn primary">
                {sending ? "Sending…" : "Send"}
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={sending} // prevents clicking while generating
                onClick={() => insertLatestAIResponse("expand")}
              >
                {insertLabel}
              </button>
            </div>
          </form>
        </aside>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function formatAIAnswer(text) {
  if (!text) return "";

  // Bold and italic
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  // Lines
  const lines = text.split("\n");
  let result = "";
  let inList = false;

  for (const line of lines) {
    const match = line.match(/^\s*[*-]\s+(.*)/);
    if (match) {
      if (!inList) {
        inList = true;
        result += "<ul>";
      }
      result += `<li>${match[1]}</li>`;
    } else {
      if (inList) {
        inList = false;
        result += "</ul>";
      }
      if (line.trim()) result += `<p>${line}</p>`;
    }
  }
  if (inList) result += "</ul>";
  return result;
}
