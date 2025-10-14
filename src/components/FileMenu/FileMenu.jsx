import { useState, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from "docx";
import { saveAs } from "file-saver";
import "./FileMenu.css";

export default function FileMenu({ editor, docId, docTitle = "Untitled doc" }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  // Get clean document title
  const getCleanTitle = () => {
    return docTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "document";
  };

  // Save document (already auto-saves, this just shows confirmation)
  const handleSave = () => {
    setActiveMenu(null);
    // Show a brief toast notification
    const toast = document.createElement("div");
    toast.className = "save-toast";
    toast.textContent = "✓ Saved";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  // Download as plain text
  const downloadAsTxt = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${getCleanTitle()}.txt`);
    setActiveMenu(null);
  };

  // Download as HTML
  const downloadAsHtml = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { font-size: 26pt; margin-bottom: 12px; }
        h2 { font-size: 20pt; margin-top: 24px; margin-bottom: 8px; }
        h3 { font-size: 14pt; font-weight: 600; margin-top: 16px; margin-bottom: 6px; }
        p { margin: 12px 0; }
        blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin: 16px 0; color: #666; }
        ul, ol { margin: 12px 0; padding-left: 24px; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        pre { background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto; }
        mark { background: #fff3cd; padding: 2px 4px; }
        a { color: #1a73e8; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    saveAs(blob, `${getCleanTitle()}.html`);
    setActiveMenu(null);
  };

  // Download as PDF
  const downloadAsPdf = async () => {
    if (!editor) return;
    const html = editor.getHTML();

    // Create a temporary container with proper styling
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.cssText = `
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      line-height: 1.6;
      color: #202124;
    `;

    const opt = {
      margin: [15, 15, 15, 15],
      filename: `${getCleanTitle()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(container).save();
      setActiveMenu(null);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Download as DOCX
  const downloadAsDocx = async () => {
    if (!editor) return;

    try {
      const content = parseHtmlToDocx(editor.getHTML());
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: content,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${getCleanTitle()}.docx`);
      setActiveMenu(null);
    } catch (error) {
      console.error("DOCX generation failed:", error);
      alert("Failed to generate DOCX. Please try again.");
    }
  };

  // Parse HTML to DOCX paragraphs
  const parseHtmlToDocx = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const paragraphs = [];

    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          return new TextRun({ text });
        }
        return null;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        const children = Array.from(node.childNodes)
          .map(processNode)
          .filter(Boolean);

        switch (tagName) {
          case "h1":
            paragraphs.push(
              new Paragraph({
                text: node.textContent,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240, after: 120 },
              })
            );
            break;
          case "h2":
            paragraphs.push(
              new Paragraph({
                text: node.textContent,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );
            break;
          case "h3":
            paragraphs.push(
              new Paragraph({
                text: node.textContent,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 160, after: 80 },
              })
            );
            break;
          case "p":
            if (node.textContent.trim()) {
              paragraphs.push(
                new Paragraph({
                  children: children.length
                    ? children
                    : [new TextRun(node.textContent)],
                  spacing: { before: 120, after: 120 },
                })
              );
            }
            break;
          case "blockquote":
            paragraphs.push(
              new Paragraph({
                text: node.textContent,
                indent: { left: 720 },
                spacing: { before: 120, after: 120 },
              })
            );
            break;
          case "strong":
          case "b":
            return new TextRun({ text: node.textContent, bold: true });
          case "em":
          case "i":
            return new TextRun({ text: node.textContent, italics: true });
          case "u":
            return new TextRun({ text: node.textContent, underline: {} });
          case "mark":
            return new TextRun({ text: node.textContent, highlight: "yellow" });
          case "li":
            paragraphs.push(
              new Paragraph({
                text: `• ${node.textContent}`,
                spacing: { before: 80, after: 80 },
              })
            );
            break;
          case "br":
            return new TextRun({ text: "", break: 1 });
          default:
            // For other elements, just extract text
            if (node.textContent.trim()) {
              return new TextRun({ text: node.textContent });
            }
        }
      }
      return null;
    };

    doc.body.childNodes.forEach(processNode);

    // Ensure at least one paragraph exists
    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ text: "" }));
    }

    return paragraphs;
  };

  // Print document
  const handlePrint = () => {
    if (!editor) return;

    // Create a new window with the document content
    const printWindow = window.open("", "_blank");
    const html = editor.getHTML();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20mm; }
          }
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
          h1 { font-size: 26pt; margin-bottom: 12px; page-break-after: avoid; }
          h2 { font-size: 20pt; margin-top: 24px; margin-bottom: 8px; page-break-after: avoid; }
          h3 { font-size: 14pt; font-weight: 600; margin-top: 16px; margin-bottom: 6px; page-break-after: avoid; }
          p { margin: 12px 0; }
          blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin: 16px 0; color: #666; page-break-inside: avoid; }
          ul, ol { margin: 12px 0; padding-left: 24px; }
          li { margin: 4px 0; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          pre { background: #f5f5f5; padding: 12px; border-radius: 8px; page-break-inside: avoid; }
          mark { background: #fff3cd; padding: 2px 4px; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    setActiveMenu(null);
  };

  // Rename document (placeholder - would need API integration)
  const handleRename = () => {
    const newTitle = prompt("Enter new document name:", docTitle);
    if (newTitle && newTitle.trim()) {
      // This would need to call your API to update the title
      console.log("Rename to:", newTitle);
      alert("Rename functionality requires backend integration");
    }
    setActiveMenu(null);
  };

  // Make a copy (placeholder)
  const handleMakeCopy = () => {
    alert("Make a copy functionality requires backend integration");
    setActiveMenu(null);
  };

  return (
    <nav className="file-menu" ref={menuRef}>
      <div className="file-menu-items">
        {/* File Menu */}
        <div className="menu-item-wrapper">
          <button
            className={`menu-item ${activeMenu === "file" ? "active" : ""}`}
            onClick={() => toggleMenu("file")}
          >
            File
          </button>
          {activeMenu === "file" && (
            <div className="dropdown file-dropdown">
              <button className="dropdown-item" onClick={handleSave}>
                <span className="item-icon">⎙</span>
                <span>Save</span>
                <span className="shortcut">Ctrl+S</span>
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleRename}>
                <span className="item-icon">✎</span>
                <span>Rename</span>
              </button>
              <button className="dropdown-item" onClick={handleMakeCopy}>
                <span className="item-icon">⎘</span>
                <span>Make a copy</span>
              </button>
              <div className="dropdown-divider" />
              <div className="dropdown-item submenu-trigger">
                <span className="item-icon">↓</span>
                <span>Download as</span>
                <span className="arrow">▶</span>
                <div className="submenu">
                  <button className="dropdown-item" onClick={downloadAsPdf}>
                    <span>PDF Document (.pdf)</span>
                  </button>
                  <button className="dropdown-item" onClick={downloadAsDocx}>
                    <span>Microsoft Word (.docx)</span>
                  </button>
                  <button className="dropdown-item" onClick={downloadAsHtml}>
                    <span>Web Page (.html)</span>
                  </button>
                  <button className="dropdown-item" onClick={downloadAsTxt}>
                    <span>Plain Text (.txt)</span>
                  </button>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handlePrint}>
                <span className="item-icon">🖨️</span>
                <span>Print</span>
                <span className="shortcut">Ctrl+P</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="menu-item-wrapper">
          <button
            className={`menu-item ${activeMenu === "edit" ? "active" : ""}`}
            onClick={() => toggleMenu("edit")}
          >
            Edit
          </button>
          {activeMenu === "edit" && (
            <div className="dropdown edit-dropdown">
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.undo();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">↶</span>
                <span>Undo</span>
                <span className="shortcut">Ctrl+Z</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.redo();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">↷</span>
                <span>Redo</span>
                <span className="shortcut">Ctrl+Y</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  document.execCommand("cut");
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">✂</span>
                <span>Cut</span>
                <span className="shortcut">Ctrl+X</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  document.execCommand("copy");
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">⎘</span>
                <span>Copy</span>
                <span className="shortcut">Ctrl+C</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  document.execCommand("paste");
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">⎘</span>
                <span>Paste</span>
                <span className="shortcut">Ctrl+V</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.selectAll();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">☰</span>
                <span>Select all</span>
                <span className="shortcut">Ctrl+A</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="menu-item-wrapper">
          <button
            className={`menu-item ${activeMenu === "view" ? "active" : ""}`}
            onClick={() => toggleMenu("view")}
          >
            View
          </button>
          {activeMenu === "view" && (
            <div className="dropdown view-dropdown">
              <button
                className="dropdown-item"
                onClick={() => setActiveMenu(null)}
              >
                <span className="item-icon">▭</span>
                <span>Print layout</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => setActiveMenu(null)}
              >
                <span className="item-icon">⊡</span>
                <span>Mode</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => setActiveMenu(null)}
              >
                <span className="item-icon">⊟</span>
                <span>Show document outline</span>
              </button>
            </div>
          )}
        </div>

        {/* Insert Menu */}
        <div className="menu-item-wrapper">
          <button
            className={`menu-item ${activeMenu === "insert" ? "active" : ""}`}
            onClick={() => toggleMenu("insert")}
          >
            Insert
          </button>
          {activeMenu === "insert" && (
            <div className="dropdown insert-dropdown">
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.setHorizontalRule();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">―</span>
                <span>Horizontal line</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.setHardBreak();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">⏎</span>
                <span>Break</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => setActiveMenu(null)}
              >
                <span className="item-icon">⚓</span>
                <span>Link</span>
                <span className="shortcut">Ctrl+K</span>
              </button>
            </div>
          )}
        </div>

        {/* Format Menu */}
        <div className="menu-item-wrapper">
          <button
            className={`menu-item ${activeMenu === "format" ? "active" : ""}`}
            onClick={() => toggleMenu("format")}
          >
            Format
          </button>
          {activeMenu === "format" && (
            <div className="dropdown format-dropdown">
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.toggleBold();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">𝐁</span>
                <span>Bold</span>
                <span className="shortcut">Ctrl+B</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.toggleItalic();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">𝘐</span>
                <span>Italic</span>
                <span className="shortcut">Ctrl+I</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.toggleUnderline();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">U̲</span>
                <span>Underline</span>
                <span className="shortcut">Ctrl+U</span>
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  editor?.commands.clearNodes();
                  setActiveMenu(null);
                }}
              >
                <span className="item-icon">🧹</span>
                <span>Clear formatting</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
