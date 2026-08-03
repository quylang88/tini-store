import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Minus,
  Undo,
  Redo,
  Eraser,
} from "lucide-react";

// Sanitize HTML pasted from external apps (Word, Notes, Web, Messages)
const sanitizePastedHtml = (html) => {
  if (!html) return "";
  if (typeof document === "undefined" || typeof DOMParser === "undefined") {
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    clean = clean.replace(/<meta\b[^>]*>/gi, "");
    clean = clean.replace(/<b(\s+[^>]*)?>/gi, "<strong>").replace(/<\/b>/gi, "</strong>");
    clean = clean.replace(/<i(\s+[^>]*)?>/gi, "<em>").replace(/<\/i>/gi, "</em>");
    return clean;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent);
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const tagName = node.tagName.toLowerCase();

      // Skip script, style, meta, XML tags
      if (
        [
          "script",
          "style",
          "meta",
          "link",
          "title",
          "xml",
          "svg",
          "iframe",
          "object",
        ].includes(tagName)
      ) {
        return null;
      }

      let newTag = tagName;
      if (tagName === "b" || tagName === "strong") newTag = "strong";
      else if (tagName === "i" || tagName === "em") newTag = "em";
      else if (tagName === "u") newTag = "u";
      else if (tagName === "s" || tagName === "strike" || tagName === "del")
        newTag = "s";
      else if (tagName === "h1" || tagName === "h2") newTag = "h2";
      else if (["h3", "h4", "h5", "h6"].includes(tagName)) newTag = "h3";
      else if (["p", "div", "section", "article"].includes(tagName))
        newTag = "p";
      else if (tagName === "ul" || tagName === "ol" || tagName === "li")
        newTag = tagName;
      else if (tagName === "blockquote") newTag = "blockquote";
      else if (tagName === "hr") newTag = "hr";
      else if (tagName === "br") newTag = "br";
      else newTag = "span";

      const newElement = document.createElement(newTag);

      // Preserve inline text color or background color if present
      const color = node.style.color;
      const bgColor = node.style.backgroundColor;
      if (color && color !== "inherit") newElement.style.color = color;
      if (bgColor && bgColor !== "transparent")
        newElement.style.backgroundColor = bgColor;

      for (const child of Array.from(node.childNodes)) {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) {
          newElement.appendChild(cleanedChild);
        }
      }

      return newElement;
    };

    const fragment = document.createDocumentFragment();
    for (const child of Array.from(doc.body.childNodes)) {
      const cleaned = cleanNode(child);
      if (cleaned) {
        fragment.appendChild(cleaned);
      }
    }

    const container = document.createElement("div");
    container.appendChild(fragment);
    return container.innerHTML;
  } catch {
    return html;
  }
};

const ProductUsageInstructionsField = ({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  const editorRef = useRef(null);
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  const checkActiveStates = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const nextValue = value ?? "";
      if (currentHtml !== nextValue) {
        editorRef.current.innerHTML = nextValue;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || "";
      const finalValue = text.trim() === "" ? "" : html;
      onChange?.(finalValue);
      checkActiveStates();
    }
  };

  const execCommand = (command, val = null) => {
    if (disabled || readOnly || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const handlePaste = (e) => {
    if (disabled || readOnly || !editorRef.current) return;
    e.preventDefault();

    const htmlData = e.clipboardData?.getData("text/html");
    const textData = e.clipboardData?.getData("text/plain");

    let contentToInsert = "";
    if (htmlData && htmlData.trim()) {
      contentToInsert = sanitizePastedHtml(htmlData);
    } else if (textData) {
      contentToInsert = textData
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r\n|\r|\n/g, "<br>");
    }

    if (contentToInsert) {
      editorRef.current.focus();
      document.execCommand("insertHTML", false, contentToInsert);
      handleInput();
    }
  };

  const clearFormatting = () => {
    if (disabled || readOnly || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("removeFormat", false, null);
    handleInput();
  };

  return (
    <div className="space-y-1.5 relative">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-rose-700 uppercase">
          Hướng dẫn sử dụng
        </label>
      </div>

      {!readOnly && !disabled && (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-t-lg p-1.5 flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none shadow-xs touch-pan-x">
          {/* History */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("undo");
            }}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Hoàn tác (Undo)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("redo");
            }}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Làm lại (Redo)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5 shrink-0" />

          {/* Text Formatting */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("bold");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.bold
                ? "bg-rose-100 text-rose-700 font-bold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="In đậm (Bold)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("italic");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.italic
                ? "bg-rose-100 text-rose-700 font-bold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="In nghiêng (Italic)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("underline");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.underline
                ? "bg-rose-100 text-rose-700 font-bold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="Gạch chân (Underline)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("strikeThrough");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.strikeThrough
                ? "bg-rose-100 text-rose-700 font-bold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="Gạch ngang (Strikethrough)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5 shrink-0" />

          {/* Headings */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("formatBlock", "<h2>");
            }}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors font-bold text-xs"
            title="Tiêu đề lớn (Heading 1)"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("formatBlock", "<h3>");
            }}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors font-bold text-xs"
            title="Tiêu đề nhỏ (Heading 2)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5 shrink-0" />

          {/* Lists */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("insertUnorderedList");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.insertUnorderedList
                ? "bg-rose-100 text-rose-700 font-bold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="Danh sách dấu chấm (Bullet List)"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("insertOrderedList");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.insertOrderedList
                ? "bg-rose-100 text-rose-700 font-bold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="Danh sách số (Numbered List)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5 shrink-0" />

          {/* Alignment */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("justifyLeft");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.justifyLeft
                ? "bg-rose-100 text-rose-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="Căn trái"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("justifyCenter");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.justifyCenter
                ? "bg-rose-100 text-rose-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="Căn giữa"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("justifyRight");
            }}
            className={`p-1.5 rounded transition-colors ${
              activeStates.justifyRight
                ? "bg-rose-100 text-rose-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title="Căn phải"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5 shrink-0" />

          {/* Blockquote & Line */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("formatBlock", "blockquote");
            }}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Trích dẫn (Quote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand("insertHorizontalRule");
            }}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Đường phân cách (Horizontal Line)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5 shrink-0" />

          {/* Color & Highlight Swatches */}
          <div className="flex items-center gap-1 pl-1 border-l border-gray-200 shrink-0">
            <span className="text-[10px] text-gray-400 font-bold uppercase px-0.5 select-none">Chữ:</span>
            {[
              { color: "#e11d48", label: "Chữ đỏ" },
              { color: "#d97706", label: "Chữ cam" },
              { color: "#2563eb", label: "Chữ xanh" },
              { color: "#16a34a", label: "Chữ lá" },
              { color: "#1f2937", label: "Chữ đen" },
            ].map((c) => (
              <button
                key={`tc-${c.color}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  execCommand("foreColor", c.color);
                }}
                className="w-4 h-4 rounded-full border border-gray-300 transition-transform active:scale-125 shrink-0"
                style={{ backgroundColor: c.color }}
                title={c.label}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 pl-1 border-l border-gray-200 shrink-0">
            <span className="text-[10px] text-gray-400 font-bold uppercase px-0.5 select-none">Nền:</span>
            {[
              { color: "#fef08a", label: "Nền vàng" },
              { color: "#fecdd3", label: "Nền hồng" },
              { color: "#bbf7d0", label: "Nền xanh" },
              { color: "transparent", label: "Bỏ nền" },
            ].map((c) => (
              <button
                key={`bg-${c.color}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  execCommand(
                    "hiliteColor",
                    c.color === "transparent" ? "#ffffff" : c.color,
                  );
                }}
                className="w-4 h-4 rounded-full border border-gray-300 transition-transform active:scale-125 shrink-0 flex items-center justify-center text-[9px] font-bold text-gray-600"
                style={{
                  backgroundColor:
                    c.color === "transparent" ? "#ffffff" : c.color,
                }}
                title={c.label}
              >
                {c.color === "transparent" && "✕"}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-gray-200 mx-0.5 shrink-0" />

          {/* Clear Format */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              clearFormatting();
            }}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            title="Xoá định dạng"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div
        ref={editorRef}
        contentEditable={!disabled && !readOnly}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={checkActiveStates}
        onMouseUp={checkActiveStates}
        onSelect={checkActiveStates}
        data-placeholder="Nhập hướng dẫn sử dụng sản phẩm (hỗ trợ in đậm, gạch đầu dòng, tiêu đề...)..."
        dangerouslySetInnerHTML={{ __html: value ?? "" }}
        className={`min-h-28 max-h-72 w-full overflow-y-auto ${
          !readOnly && !disabled ? "rounded-b-lg border-t-0" : "rounded-lg"
        } border p-3 text-sm text-gray-900 outline-none transition-colors border-gray-200 focus:border-rose-400 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_strike]:line-through [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-rose-700 [&_h2]:mt-1.5 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-rose-700 [&_h3]:mt-1 [&_h3]:mb-0.5 [&_blockquote]:border-l-4 [&_blockquote]:border-rose-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_hr]:my-2 [&_hr]:border-gray-200 ${
          readOnly || disabled ? "bg-gray-50 text-gray-500" : "bg-white"
        }`}
      />
    </div>
  );
};

export default ProductUsageInstructionsField;
