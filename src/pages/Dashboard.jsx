import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { logOut, getUid } from "../firebaseClient";
import "../css/dashboard.css";
import logo from "../assets/NotelyLogo.png";

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);
  const nav = useNavigate();
  const fileInputRef = useRef(null);

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

  const filtered = notes.filter((n) =>
    (n.title || "").toLowerCase().includes(q.toLowerCase())
  );

  async function newDoc() {
    const doc = await api("/api/docs", { method: "POST", body: {} });
    nav(`/doc/${doc.id}`);
  }

  // ---------- DELETE DOC ----------
  function confirmDelete(docId) {
    setDeleteConfirmId(docId);
    setOpenMenuId(null);
  }

  async function deleteDoc() {
    if (!deleteConfirmId) return;
    try {
      await api(`/api/docs/${deleteConfirmId}`, { method: "DELETE" });
      setNotes(notes.filter((n) => n.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast("Document deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting document:", error);
      setDeleteConfirmId(null);
      showToast("Failed to delete document. Please try again.", "error");
    }
  }

  function cancelDelete() {
    setDeleteConfirmId(null);
  }

  function showToast(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ---------- TOGGLE MENU ----------
  function toggleMenu(docId, e) {
    e.stopPropagation();
    setOpenMenuId(openMenuId === docId ? null : docId);
  }

  // ---------- CLOSE MENU ON OUTSIDE CLICK ----------
  useEffect(() => {
    function handleClickOutside() {
      if (openMenuId) setOpenMenuId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  // ---------- SIGN OUT ----------
  const handleSignOut = async () => {
    await logOut(); // clears Firebase auth & localStorage
    nav("/"); // redirect to landing page
  };

  // PDF parts
  function openPdfPicker() {
    fileInputRef.current?.click();
  }

  async function handlePdfFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast("Importing PDF…", "info");

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;

      const plainTitle = file.name.replace(/\.pdf$/i, "") || "Imported PDF";
      let html = `<h1>${plainTitle}</h1>`;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((it) => (typeof it.str === "string" ? it.str : ""))
          .join(" ")
          .replace(/\s+\n/g, "\n")
          .trim();

        if (text) {
          const paragraphs = text
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean);
          html += `<h3>Page ${i}</h3>${paragraphs
            .map((p) => `<p>${p}</p>`)
            .join("")}`;
        } else {
          html += `<h3>Page ${i}</h3><p><em>(No extractable text on this page)</em></p>`;
        }
      }

      const doc = await api("/api/docs", {
        method: "POST",
        body: { title: plainTitle, contentHtml: html },
      });

      showToast("PDF imported", "success");
      nav(`/doc/${doc.id}`);
    } catch (err) {
      console.error("PDF import error:", err);
      showToast(
        "Failed to import PDF (password-protected or scanned?)",
        "error"
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="brand">
          <img
            src={logo}
            alt="Notely Logo"
            style={{
              width: "24px",
              height: "24px",
              marginRight: "8px",
              verticalAlign: "middle",
            }}
          />
          Notely
        </div>
        <nav className="side-nav">
          <div className="nav-section">
            <a className="active nav-label">Docs</a>
            <div className="doc-list">
              {notes.slice(0, 10).map((n) => (
                <a
                  key={n.id}
                  className="doc-item"
                  onClick={() => nav(`/doc/${n.id}`)}
                  title={n.title || "Untitled doc"}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M8 1H3.5C3.10218 1 2.72064 1.15804 2.43934 1.43934C2.15804 1.72064 2 2.10218 2 2.5V11.5C2 11.8978 2.15804 12.2794 2.43934 12.5607C2.72064 12.842 3.10218 13 3.5 13H10.5C10.8978 13 11.2794 12.842 11.5607 12.5607C11.842 12.2794 12 11.8978 12 11.5V5L8 1Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 1V5H12"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="doc-item-title">
                    {n.title || "Untitled doc"}
                  </span>
                </a>
              ))}
              {notes.length === 0 && (
                <div className="doc-list-empty">No documents yet</div>
              )}
            </div>
          </div>
          <a className="signoutDash" onClick={handleSignOut}>
            ⏻ Sign out
          </a>
        </nav>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <h1>Docs</h1>
        </div>

        <div className="dash-search">
          <input
            placeholder="Search docs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <section className="cards-grid">
          {filtered.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📝</div>
              <h3 className="empty-title">No documents yet</h3>
              <p className="empty-text">
                Get started by creating your first document
              </p>
              <button className="empty-cta" onClick={newDoc}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 4V16M4 10H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Create your first doc
              </button>
            </div>
          )}
          {filtered.map((n) => (
            <article
              key={n.id}
              className="card"
              onClick={() => nav(`/doc/${n.id}`)}
            >
              <div className="card-icon">📄</div>
              <div className="card-title">{n.title || "Untitled doc"}</div>
              <div className="card-meta">
                Edited {new Date(n.updatedAt).toLocaleString()}
              </div>
              <button className="kebab" onClick={(e) => toggleMenu(n.id, e)}>
                ⋯
              </button>
              {openMenuId === n.id && (
                <div className="kebab-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(n.id);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
        {/* Hidden input for PDF upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={handlePdfFile}
        />

        {/* Floating Action Button */}
        <div className="fab-container">
          {/* ➕ New Document */}
          <button className="fab-item" onClick={newDoc}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 4V16M4 10H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>New doc</span>
          </button>

          {/* ⬆️ Upload PDF */}
          <button className="fab-item" onClick={openPdfPicker}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 14V4M10 4L6 8M10 4L14 8M4 16H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Upload</span>
          </button>

          {/* ⚪ Main Floating Button */}
          <button className="fab-main">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#FEE2E2" />
                <path
                  d="M24 16v8m0 4h.01M32 24c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z"
                  stroke="#DC2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="modal-title">Delete Document?</h2>
            <p className="modal-message">
              Are you sure you want to delete this document? This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-delete"
                onClick={deleteDoc}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M16.667 5L7.5 14.167 3.333 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {toast.type === "error" && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 6v4m0 4h.01M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
