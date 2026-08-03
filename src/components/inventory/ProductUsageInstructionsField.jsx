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

const BULLET_SYMBOL_REGEX =
  /^(?:[•⁃–—\-*+>:▪▫■□▲►✦✧★☆❖◆◇⚪⚫➔✓]|🔴|🔵|➡️|✔️|✅|o|v\.)\s+/iu;

const NUMBERED_SYMBOL_REGEX =
  /^(?:\(?\d+[.)]|\(?[a-zA-Z][.)]|\(?[ivxLCDM]+[.)])\s+/iu;

// Safely normalize Vietnamese Unicode diacritics (NFD -> NFC) & fix MS Word smart quotes / HTML entities
const decodeAndNormalizeVietnamese = (text) => {
  if (!text || typeof text !== "string") return "";

  let result = text;

  // Unicode NFC Normalization (combines base letters + diacritic accents into composed Vietnamese chars)
  try {
    result = result.normalize("NFC");
  } catch {
    // fallback
  }

  // Convert MS Word smart quotes & non-breaking spaces
  result = result
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, " ");

  return result;
};

// Sanitize HTML pasted from external apps (Word, Notes, Web, Messages)
const sanitizePastedHtml = (htmlInput) => {
  if (!htmlInput) return "";
  const html = decodeAndNormalizeVietnamese(htmlInput);

  if (typeof document === "undefined" || typeof DOMParser === "undefined") {
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    clean = clean.replace(/<meta\b[^>]*>/gi, "");
    clean = clean.replace(/<b(\s+[^>]*)?>/gi, "<strong>").replace(/<\/b>/gi, "</strong>");
    clean = clean.replace(/<i(\s+[^>]*)?>/gi, "<em>").replace(/<\/i>/gi, "</em>");
    // Strip inline colors to force black text
    clean = clean.replace(/\s*style="[^"]*"/gi, "");
    return clean;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = decodeAndNormalizeVietnamese(node.textContent);
        return document.createTextNode(textContent);
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
      else if (["p", "div", "section", "article"].includes(tagName)) {
        // If paragraph has left margin/padding (e.g. MS Word indent), map to blockquote
        const marginLeft = parseInt(
          node.style?.marginLeft || node.style?.paddingLeft || "0",
          10,
        );
        newTag = marginLeft >= 15 ? "blockquote" : "p";
      } else if (tagName === "ul" || tagName === "ol" || tagName === "li")
        newTag = tagName;
      else if (tagName === "blockquote") newTag = "blockquote";
      else if (tagName === "hr") newTag = "hr";
      else if (tagName === "br") newTag = "br";
      else newTag = "span";

      const newElement = document.createElement(newTag);

      // Force black text: DO NOT copy inline color or background-color from external source!

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

    // Convert any standalone bullet or numbered paragraphs into real <ul><li> or <ol><li>
    const paragraphs = Array.from(container.querySelectorAll("p, div, blockquote"));
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();

      if (BULLET_SYMBOL_REGEX.test(text)) {
        const cleanText = text.replace(BULLET_SYMBOL_REGEX, "");
        const li = document.createElement("li");
        li.innerHTML = cleanText;

        const prev = p.previousElementSibling;
        if (prev && prev.tagName.toLowerCase() === "ul") {
          prev.appendChild(li);
          p.remove();
        } else {
          const ul = document.createElement("ul");
          ul.appendChild(li);
          p.parentNode.replaceChild(ul, p);
        }
      } else if (NUMBERED_SYMBOL_REGEX.test(text)) {
        const cleanText = text.replace(NUMBERED_SYMBOL_REGEX, "");
        const li = document.createElement("li");
        li.innerHTML = cleanText;

        const prev = p.previousElementSibling;
        if (prev && prev.tagName.toLowerCase() === "ol") {
          prev.appendChild(li);
          p.remove();
        } else {
          const ol = document.createElement("ol");
          ol.appendChild(li);
          p.parentNode.replaceChild(ol, p);
        }
      }
    });

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
  const isFocusedRef = useRef(false);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const debounceTimerRef = useRef(null);
  const [historyStatus, setHistoryStatus] = useState({
    canUndo: false,
    canRedo: false,
  });

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

  const updateHistoryStatus = useCallback(() => {
    const canUndo = historyIndexRef.current > 0;
    const canRedo = historyIndexRef.current < historyRef.current.length - 1;
    setHistoryStatus({ canUndo, canRedo });
  }, []);

  const isNavigatingHistoryRef = useRef(false);

  const pushHistory = useCallback(
    (newHtml) => {
      if (isNavigatingHistoryRef.current) {
        return;
      }
      const history = historyRef.current;
      const currentIndex = historyIndexRef.current;

      if (currentIndex >= 0 && history[currentIndex] === newHtml) {
        return;
      }

      if (
        currentIndex + 1 < history.length &&
        history[currentIndex + 1] === newHtml
      ) {
        historyIndexRef.current += 1;
        updateHistoryStatus();
        return;
      }

      const nextHistory = history.slice(0, currentIndex + 1);
      nextHistory.push(newHtml);

      if (nextHistory.length > 50) {
        nextHistory.shift();
      }

      historyRef.current = nextHistory;
      historyIndexRef.current = nextHistory.length - 1;
      updateHistoryStatus();
    },
    [updateHistoryStatus],
  );

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

  const lastEmittedValueRef = useRef(null);

  // Sync value from outside ONLY on mount or when external prop changes while not active
  useEffect(() => {
    if (editorRef.current) {
      const nextValue = value ?? "";
      if (
        lastEmittedValueRef.current === null ||
        (lastEmittedValueRef.current !== nextValue &&
          document.activeElement !== editorRef.current)
      ) {
        lastEmittedValueRef.current = nextValue;
        editorRef.current.innerHTML = nextValue;
      }
      if (historyRef.current.length === 0) {
        historyRef.current = [nextValue];
        historyIndexRef.current = 0;
        updateHistoryStatus();
      }
    }
  }, [value, updateHistoryStatus]);

  const emitValue = useCallback(
    (finalValue) => {
      lastEmittedValueRef.current = finalValue;
      onChange?.(finalValue);
    },
    [onChange],
  );

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || "";
      const finalValue = text.trim() === "" ? "" : html;
      emitValue(finalValue);
      pushHistory(finalValue);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || "";
      const finalValue = text.trim() === "" ? "" : html;
      emitValue(finalValue);
      checkActiveStates();

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        pushHistory(finalValue);
      }, 250);
    }
  };

  const handleInputImmediate = () => {
    if (editorRef.current) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || "";
      const finalValue = text.trim() === "" ? "" : html;
      emitValue(finalValue);
      checkActiveStates();
      pushHistory(finalValue);
    }
  };

  const handleUndo = () => {
    if (disabled || readOnly || historyIndexRef.current <= 0) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    isNavigatingHistoryRef.current = true;
    historyIndexRef.current -= 1;
    const targetHtml = historyRef.current[historyIndexRef.current] ?? "";

    if (editorRef.current) {
      editorRef.current.innerHTML = targetHtml;
    }
    const text = editorRef.current?.textContent || "";
    const finalValue = text.trim() === "" ? "" : targetHtml;
    emitValue(finalValue);
    checkActiveStates();
    updateHistoryStatus();

    setTimeout(() => {
      isNavigatingHistoryRef.current = false;
    }, 150);
  };

  const handleRedo = () => {
    if (
      disabled ||
      readOnly ||
      historyIndexRef.current >= historyRef.current.length - 1
    )
      return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    isNavigatingHistoryRef.current = true;
    historyIndexRef.current += 1;
    const targetHtml = historyRef.current[historyIndexRef.current] ?? "";

    if (editorRef.current) {
      editorRef.current.innerHTML = targetHtml;
    }
    const text = editorRef.current?.textContent || "";
    const finalValue = text.trim() === "" ? "" : targetHtml;
    emitValue(finalValue);
    checkActiveStates();
    updateHistoryStatus();

    setTimeout(() => {
      isNavigatingHistoryRef.current = false;
    }, 150);
  };

  const execCommand = (command, val = null) => {
    if (disabled || readOnly || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    handleInputImmediate();
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
      const normalizedText = decodeAndNormalizeVietnamese(textData);
      const lines = normalizedText.split(/\r\n|\r|\n/);
      let inUl = false;
      let inOl = false;
      const htmlBuffer = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          if (inUl) {
            htmlBuffer.push("</ul>");
            inUl = false;
          }
          if (inOl) {
            htmlBuffer.push("</ol>");
            inOl = false;
          }
          htmlBuffer.push("<br>");
          return;
        }

        if (BULLET_SYMBOL_REGEX.test(trimmed)) {
          if (inOl) {
            htmlBuffer.push("</ol>");
            inOl = false;
          }
          if (!inUl) {
            htmlBuffer.push("<ul>");
            inUl = true;
          }
          const clean = trimmed.replace(BULLET_SYMBOL_REGEX, "");
          htmlBuffer.push(`<li>${clean}</li>`);
        } else if (NUMBERED_SYMBOL_REGEX.test(trimmed)) {
          if (inUl) {
            htmlBuffer.push("</ul>");
            inUl = false;
          }
          if (!inOl) {
            htmlBuffer.push("<ol>");
            inOl = true;
          }
          const clean = trimmed.replace(NUMBERED_SYMBOL_REGEX, "");
          htmlBuffer.push(`<li>${clean}</li>`);
        } else {
          if (inUl) {
            htmlBuffer.push("</ul>");
            inUl = false;
          }
          if (inOl) {
            htmlBuffer.push("</ol>");
            inOl = false;
          }
          htmlBuffer.push(`<p>${trimmed}</p>`);
        }
      });

      if (inUl) htmlBuffer.push("</ul>");
      if (inOl) htmlBuffer.push("</ol>");

      contentToInsert = htmlBuffer.join("");
    }

    if (contentToInsert) {
      editorRef.current.focus();
      document.execCommand("insertHTML", false, contentToInsert);
      handleInputImmediate();
    }
  };

  const clearFormatting = () => {
    if (disabled || readOnly || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("removeFormat", false, null);
    handleInputImmediate();
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
            disabled={!historyStatus.canUndo}
            onMouseDown={(e) => {
              e.preventDefault();
              handleUndo();
            }}
            className={`p-1.5 rounded transition-colors ${
              historyStatus.canUndo
                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-gray-300 cursor-not-allowed"
            }`}
            title="Hoàn tác (Undo)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!historyStatus.canRedo}
            onMouseDown={(e) => {
              e.preventDefault();
              handleRedo();
            }}
            className={`p-1.5 rounded transition-colors ${
              historyStatus.canRedo
                ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                : "text-gray-300 cursor-not-allowed"
            }`}
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
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={typeof window !== "undefined" ? undefined : { __html: value ?? "" }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={checkActiveStates}
        onMouseUp={checkActiveStates}
        onSelect={checkActiveStates}
        data-placeholder="Nhập hướng dẫn sử dụng sản phẩm (hỗ trợ in đậm, gạch đầu dòng, tiêu đề...)..."
        className={`min-h-28 max-h-72 w-full overflow-y-auto ${
          !readOnly && !disabled ? "rounded-b-lg border-t-0" : "rounded-lg"
        } border p-3 text-sm text-gray-900 outline-none transition-colors border-gray-200 focus:border-rose-400 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul_ul]:list-[circle] [&_ul_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol_ol]:list-[lower-alpha] [&_ol_ol]:pl-5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_strike]:line-through [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-rose-700 [&_h2]:mt-1.5 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-rose-700 [&_h3]:mt-1 [&_h3]:mb-0.5 [&_blockquote]:border-l-4 [&_blockquote]:border-rose-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_hr]:my-2 [&_hr]:border-gray-200 ${
          readOnly || disabled ? "bg-gray-50 text-gray-500" : "bg-white"
        }`}
      />
    </div>
  );
};

export default ProductUsageInstructionsField;
