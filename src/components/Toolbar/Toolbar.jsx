import "./toolbar.css";

/** Top toolbar (headings, marks, lists, etc.) */
export default function Toolbar({ editor }) {
    if (!editor) return null;
    return (
        <div className="tl-toolbar">
            <Toggle editor={editor} active={editor.isActive("heading", { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Toggle>
            <Toggle editor={editor} active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Toggle>
            <Toggle editor={editor} active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Toggle>

            <span className="tl-sep" />

            <Toggle editor={editor} active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}>B</Toggle>
            <Toggle editor={editor} active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Toggle>
            <Toggle editor={editor} active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Toggle>
            <Toggle editor={editor} active={editor.isActive("highlight")}
                onClick={() => editor.chain().focus().toggleHighlight().run()}>HL</Toggle>

            <span className="tl-sep" />

            <Toggle editor={editor} active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</Toggle>
            <Toggle editor={editor} active={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Toggle>
            <Toggle editor={editor} active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;Quote&rdquo;</Toggle>

            <button className="btn tl-btn" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                HR
            </button>

            <span className="tl-spacer" />

            <button className="btn tl-btn" onClick={() => editor.chain().focus().undo().run()}>Undo</button>
            <button className="btn tl-btn" onClick={() => editor.chain().focus().redo().run()}>Redo</button>
            <button className="btn tl-btn ghost"
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
                Clear
            </button>
        </div>
    );
}




// NEED TO FIX ------------------------------------------------- Since they dont work
/** Bubble menu content (shows on selection) */
export function Bubble({ editor }) {
    if (!editor) return null;
    return (
        <div className="tl-bubble">
            <Toggle editor={editor} active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}>B</Toggle>
            <Toggle editor={editor} active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Toggle>
            <Toggle editor={editor} active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Toggle>

            <button className="btn tl-btn" onClick={() => {
                const url = prompt("Paste link URL");
                if (!url) return;
                editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}>
                Link
            </button>
            <button className="btn tl-btn ghost" onClick={() => editor.chain().focus().unsetLink().run()}>
                Unlink
            </button>
        </div>
    );
}

/** Floating menu content (near cursor / empty line) */
export function Floating({ editor }) {
    if (!editor) return null;
    return (
        <div className="tl-floating">
            <button className="btn tl-btn" onClick={() => editor.chain().focus().setParagraph().run()}>Paragraph</button>
            <button className="btn tl-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
            <button className="btn tl-btn" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
            <button className="btn tl-btn" onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
            <button className="btn tl-btn" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
            <button className="btn tl-btn" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{`{ }`}</button>
        </div>
    );
}

/** Re-usable toggle button */
function Toggle({ editor, active, onClick, children }) {
    const disabled = !editor || !editor.can().chain().focus().run();
    return (
        <button
            type="button"
            className={`btn tl-btn ${active ? "is-active" : ""}`}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}  // keep selection/focus
            onClick={onClick}
        >
            {children}
        </button>
    );
}
