# FileMenu Component

A comprehensive file management menu for the Notely editor, styled like Google Docs.

## Features

### File Menu

- **Save** - Auto-saves with visual confirmation toast (Ctrl+S)
- **Rename** - Rename the current document
- **Make a copy** - Duplicate the document
- **Download as**:
  - PDF Document (.pdf) - Uses html2pdf.js
  - Microsoft Word (.docx) - Uses docx library
  - Web Page (.html) - Full HTML export with styling
  - Plain Text (.txt) - Raw text extraction
- **Print** - Print-optimized view (Ctrl+P)

### Edit Menu

- Undo (Ctrl+Z)
- Redo (Ctrl+Y)
- Cut (Ctrl+X)
- Copy (Ctrl+C)
- Paste (Ctrl+V)
- Select all (Ctrl+A)

### View Menu

- Print layout
- Mode switching
- Document outline toggle

### Insert Menu

- Horizontal line
- Line break
- Link (Ctrl+K)

### Format Menu

- Bold (Ctrl+B)
- Italic (Ctrl+I)
- Underline (Ctrl+U)
- Clear formatting

## Usage

The FileMenu is automatically included in the Editor page and receives:

- `editor` - TipTap editor instance
- `docId` - Document ID for API calls
- `docTitle` - Current document title

```jsx
<FileMenu editor={editor} docId={id} docTitle={docTitle} />
```

## Dependencies

- `html2pdf.js` - PDF generation
- `docx` - Word document creation
- `file-saver` - Browser file downloads

## Styling

The menu uses a Google Docs-inspired design with:

- Fixed top positioning (48px height)
- Dropdown menus with animations
- Submenu support for nested options
- Keyboard shortcut displays
- Hover and active states
- Responsive adjustments for mobile

## Layout Integration

The FileMenu sits at the very top of the editor (z-index: 1001), with:

- App header positioned at top: 48px
- Content area starting at margin-top: 112px (48px menu + 64px header)
- Toolbar positioned at top: 112px
