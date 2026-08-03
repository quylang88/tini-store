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

// Detect Mojibake / corrupted Shift-JIS / Latin-1 replacement characters in HTML paste
const isCorruptedMojibake = (str) => {
  if (!str || typeof str !== "string") return false;
  return (
    /[\u862F\uFA00-\uFAFF\uFF65-\uFF9F\u679C\u96EA\uFFFD]/.test(str) ||
    /ﾃ|ﾆ|福|蘯|ｺ|ｹ|卜|雪/.test(str)
  );
};

// Section Heading Regex (e.g., "1. Công dụng", "2. Thành phần", "3. Hướng dẫn sử dụng", "I. THÀNH PHẦN", "A. CÔNG DỤNG")
const SECTION_HEADING_REGEX =
  /^(?:(?:\d+|[IVXLCDM]+|[A-Z])[.)]\s+)?(?:công dụng|thành phần|hướng dẫn sử dụng|liều dùng|cách dùng|đối tượng sử dụng|thông tin sản phẩm|ưu điểm|đặc điểm)\b/iu;

const NUMERIC_SECTION_HEADING_REGEX =
  /^(?:\d+|[IVXLCDM]+|[A-Za-z])[.)]\s+[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴa-zà-ỹ]/u;

// Universal Windows-1252 / ISO-8859-1 byte mapping table
const CHAR_TO_BYTE_MAP = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

const charToByte = (char) => {
  const code = char.charCodeAt(0);
  if (code <= 0xff) return code;
  return CHAR_TO_BYTE_MAP[code] || 0x3f;
};

// Regex to detect valid precomposed Vietnamese NFC characters
const VALID_VIETNAMESE_NFC_REGEX =
  /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ]/;

const MOJIBAKE_MARKER_REGEX = /Ã|á»|áº|Ä\u2018|Æ°|Æ¡|CẤ/;

// Universal Dynamic UTF-8 Mojibake Repair Engine (Token-based & 100% Dynamic)
const fixVietnameseMojibake = (str) => {
  if (!str || typeof str !== "string") return "";

  // Guard: If text already contains valid Vietnamese NFC characters,
  // it is definitely NOT Mojibake — return immediately without modification!
  if (VALID_VIETNAMESE_NFC_REGEX.test(str)) {
    return str;
  }

  // Quick check: If no Mojibake markers exist in string, return immediately!
  if (!MOJIBAKE_MARKER_REGEX.test(str)) {
    return str;
  }

  // Helper to decode a single word / token safely
  const decodeToken = (token) => {
    // If token is clean (no Mojibake markers), leave it alone!
    if (!MOJIBAKE_MARKER_REGEX.test(token)) {
      return token;
    }

    try {
      const bytes = new Uint8Array(Array.from(token).map(charToByte));
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const decoded = decoder.decode(bytes);

      if (
        !decoded.includes("\uFFFD") &&
        VALID_VIETNAMESE_NFC_REGEX.test(decoded)
      ) {
        return decoded.normalize("NFC");
      }
    } catch {
      // ignore
    }

    return token;
  };

  // Replace each token matching non-whitespace sequence safely
  return str.replace(/([^\s<>"':;?!,.()]+)/g, (match) => decodeToken(match));
};

// Safely normalize Vietnamese Unicode diacritics (NFD -> NFC) & fix MS Word / Mobile smart quotes & spaces
const decodeAndNormalizeVietnamese = (text) => {
  if (!text || typeof text !== "string") return "";

  let result = fixVietnameseMojibake(text);

  // Unicode NFC Normalization (combines base letters + diacritic accents into composed Vietnamese chars)
  try {
    result = result.normalize("NFC");
  } catch {
    // fallback
  }

  // Fix Apple / Android / Word non-breaking spaces & zero-width spaces
  result = result
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u00A0\u200B\uFEFF]/g, " ");

  return result;
};

// Sanitize HTML pasted from external apps (Word, Notes, Web, Messages)
const sanitizePastedHtml = (htmlInput) => {
  if (!htmlInput) return "";
  // Do NOT run decodeAndNormalizeVietnamese on raw HTML — it can corrupt HTML
  // attributes and structure. Vietnamese text normalization is handled per-text-node
  // inside cleanNode() below.
  let html;
  try { html = htmlInput.normalize("NFC"); } catch { html = htmlInput; }

  if (typeof document === "undefined" || typeof DOMParser === "undefined") {
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    clean = clean.replace(/<meta\b[^>]*>/gi, "");
    clean = clean.replace(/<b(\s+[^>]*)?>/gi, "<strong>").replace(/<\/b>/gi, "</strong>");
    clean = clean.replace(/<i(\s+[^>]*)?>/gi, "<em>").replace(/<\/i>/gi, "</em>");
    // Strip ALL inline styles to force consistent text rendering
    clean = clean.replace(/\s*style="[^"]*"/gi, "");
    return clean;
  }

  try {
    const parser = new DOMParser();
    // Strip existing charset meta tags to avoid conflicts with our own
    const htmlNoCharset = html.replace(/<meta[^>]*charset[^>]*>/gi, "");
    const doc = parser.parseFromString(
      `<meta charset="utf-8">${htmlNoCharset}`,
      "text/html",
    );

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = decodeAndNormalizeVietnamese(node.textContent);
        return document.createTextNode(textContent);
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const tagName = node.tagName.toLowerCase();
      const elementId = (node.id || "").toLowerCase();

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

      // Ignore Google Docs Mobile wrapper <b id="docs-internal-guid-..."> or Apple wrapper
      const isDocsWrapper = elementId.includes("docs-internal-guid");

      // Read inline styles
      const style = node.style || {};
      const fontWeight = (style.fontWeight || "").toString().toLowerCase();
      const fontStyle = (style.fontStyle || "").toString().toLowerCase();
      const textDecoration = (
        style.textDecorationLine ||
        style.textDecoration ||
        ""
      )
        .toString()
        .toLowerCase();

      // Check if explicitly normal weight
      const isExplicitlyNormal =
        fontWeight === "normal" ||
        fontWeight === "400" ||
        fontWeight === "300" ||
        fontWeight === "200" ||
        fontWeight === "100";

      const isBoldTag =
        (tagName === "b" || tagName === "strong") && !isDocsWrapper;
      const isBoldStyle =
        (fontWeight === "bold" ||
          fontWeight === "bolder" ||
          parseInt(fontWeight, 10) >= 600) &&
        !isExplicitlyNormal;

      const isBold = (isBoldTag || isBoldStyle) && !isExplicitlyNormal;

      const isItalic =
        (tagName === "i" ||
          tagName === "em" ||
          fontStyle === "italic" ||
          fontStyle === "oblique") &&
        fontStyle !== "normal";

      const isUnderline =
        (tagName === "u" || textDecoration.includes("underline")) &&
        !textDecoration.includes("none");

      const isStrike =
        (tagName === "s" ||
          tagName === "strike" ||
          tagName === "del" ||
          textDecoration.includes("line-through")) &&
        !textDecoration.includes("none");

      // Heading detection: ONLY on block heading tags h1-h6
      const isHeading1 = tagName === "h1" || tagName === "h2";
      const isHeading2 =
        tagName === "h3" ||
        tagName === "h4" ||
        tagName === "h5" ||
        tagName === "h6";

      // Determine base element tag
      let newTag = "span";
      if (isHeading1) newTag = "h2";
      else if (isHeading2) newTag = "h3";
      else if (["p", "div", "section", "article"].includes(tagName)) {
        const paddingLeft = parseInt(
          style.paddingLeft || style.marginLeft || "0",
          10,
        );
        newTag = paddingLeft >= 15 ? "blockquote" : "p";
      } else if (tagName === "ul" || tagName === "ol" || tagName === "li") {
        newTag = tagName;
      } else if (tagName === "blockquote") newTag = "blockquote";
      else if (tagName === "hr") newTag = "hr";
      else if (tagName === "br") newTag = "br";

      let newElement = document.createElement(newTag);

      const paddingLeft = parseInt(
        style.paddingLeft || style.marginLeft || "0",
        10,
      );
      if (paddingLeft > 0 && newTag === "p") {
        newElement.style.paddingLeft = `${Math.min(paddingLeft, 80)}px`;
      }

      // Force black text: DO NOT copy inline color or background-color from external source!

      for (const child of Array.from(node.childNodes)) {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) {
          newElement.appendChild(cleanedChild);
        }
      }

      // Apply formatting wrappers ONLY if element is an inline text tag (span, b, i, u, s, strong, em)
      const isInlineElement = [
        "span",
        "b",
        "i",
        "u",
        "s",
        "strong",
        "em",
        "font",
        "a",
      ].includes(tagName);

      if (isInlineElement) {
        if (isBold && newTag !== "strong") {
          const strong = document.createElement("strong");
          strong.appendChild(newElement);
          newElement = strong;
        }
        if (isItalic && newTag !== "em") {
          const em = document.createElement("em");
          em.appendChild(newElement);
          newElement = em;
        }
        if (isUnderline && newTag !== "u") {
          const u = document.createElement("u");
          u.appendChild(newElement);
          newElement = u;
        }
        if (isStrike && newTag !== "s") {
          const s = document.createElement("s");
          s.appendChild(newElement);
          newElement = s;
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

    // Convert any standalone section heading paragraphs (e.g., "1. Công dụng", "2. Thành phần") into real <h2>
    const allBlocks = Array.from(
      container.querySelectorAll("p, div, blockquote"),
    );
    allBlocks.forEach((p) => {
      const text = p.textContent.trim();

      const isHeading =
        (SECTION_HEADING_REGEX.test(text) ||
          NUMERIC_SECTION_HEADING_REGEX.test(text)) &&
        text.length <= 80 &&
        !/[;:?!]$/.test(text);

      if (isHeading && p.tagName.toLowerCase() !== "h2") {
        const h2 = document.createElement("h2");
        h2.innerHTML = p.innerHTML;
        p.parentNode.replaceChild(h2, p);
        return;
      }

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

const processInlineFormatting = (text) => {
  if (!text) return "";
  let result = text;
  // Convert markdown bold **text** or __text__ to <strong>
  result = result.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>");
  // Convert markdown italic *text* or _text_ to <em>
  result = result.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
  return result;
};

// Converts plain text with indentations and lists into nested HTML structure
const parsePlainTextToHtml = (textData) => {
  if (!textData || !textData.trim()) return "";

  const lines = textData.split(/\r\n|\r|\n/);
  const htmlBuffer = [];
  const listStack = []; // stores { depth, type: 'ul'|'ol' }

  const closeListsToDepth = (targetDepth) => {
    while (
      listStack.length > 0 &&
      listStack[listStack.length - 1].depth > targetDepth
    ) {
      const top = listStack.pop();
      htmlBuffer.push(`</${top.type}>`);
      if (listStack.length > 0) {
        htmlBuffer.push("</li>");
      }
    }
  };

  lines.forEach((line) => {
    if (!line.trim()) {
      closeListsToDepth(-1);
      htmlBuffer.push("<br>");
      return;
    }

    // Calculate indent level (tabs = 4 spaces)
    const indentMatch = line.match(/^[ \t]*/)[0];
    let indentSpaces = 0;
    for (const char of indentMatch) {
      if (char === "\t") indentSpaces += 4;
      else indentSpaces += 1;
    }

    const trimmed = line.trim();

    // Check if line is a Section Heading
    const isHeading =
      (SECTION_HEADING_REGEX.test(trimmed) ||
        NUMERIC_SECTION_HEADING_REGEX.test(trimmed)) &&
      trimmed.length <= 80 &&
      !/[;:?!]$/.test(trimmed);

    if (isHeading) {
      closeListsToDepth(-1);
      htmlBuffer.push(`<h2>${processInlineFormatting(trimmed)}</h2>`);
      return;
    }

    const isBullet = BULLET_SYMBOL_REGEX.test(trimmed);
    const isNumbered = NUMBERED_SYMBOL_REGEX.test(trimmed);

    if (isBullet || isNumbered) {
      const listType = isBullet ? "ul" : "ol";
      const regex = isBullet ? BULLET_SYMBOL_REGEX : NUMBERED_SYMBOL_REGEX;
      const rawContent = trimmed.replace(regex, "");
      const formattedContent = processInlineFormatting(rawContent);

      const currentTop = listStack[listStack.length - 1];

      if (!currentTop || indentSpaces > currentTop.depth) {
        listStack.push({ depth: indentSpaces, type: listType });
        htmlBuffer.push(`<${listType}><li>${formattedContent}`);
      } else if (indentSpaces < currentTop.depth) {
        closeListsToDepth(indentSpaces);
        const topAfterPop = listStack[listStack.length - 1];
        if (topAfterPop && topAfterPop.type === listType) {
          htmlBuffer.push(`</li><li>${formattedContent}`);
        } else {
          if (topAfterPop) {
            listStack.pop();
            htmlBuffer.push(`</${topAfterPop.type}></li>`);
          }
          listStack.push({ depth: indentSpaces, type: listType });
          htmlBuffer.push(`<${listType}><li>${formattedContent}`);
        }
      } else {
        if (currentTop.type === listType) {
          htmlBuffer.push(`</li><li>${formattedContent}`);
        } else {
          htmlBuffer.push(`</li></${currentTop.type}>`);
          listStack.pop();
          listStack.push({ depth: indentSpaces, type: listType });
          htmlBuffer.push(`<${listType}><li>${formattedContent}`);
        }
      }
    } else {
      closeListsToDepth(-1);
      const formattedContent = processInlineFormatting(trimmed);
      if (indentSpaces > 0) {
        const paddingEm = Math.min(indentSpaces * 0.75, 4);
        htmlBuffer.push(
          `<p style="padding-left: ${paddingEm}em;">${formattedContent}</p>`,
        );
      } else {
        htmlBuffer.push(`<p>${formattedContent}</p>`);
      }
    }
  });

  closeListsToDepth(-1);
  return htmlBuffer.join("");
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

    // Check if htmlData exists AND is NOT corrupted with Shift-JIS / Latin-1 Mojibake
    if (htmlData && htmlData.trim() && !isCorruptedMojibake(htmlData)) {
      contentToInsert = sanitizePastedHtml(htmlData);
    }

    // Fall back to pristine textData whenever htmlData is missing or corrupted by Mojibake
    if (!contentToInsert && textData) {
      // Only NFC-normalize plain text, skip Mojibake repair for clean Vietnamese text
      let normalizedText;
      try { normalizedText = textData.normalize("NFC"); } catch { normalizedText = textData; }
      normalizedText = normalizedText.replace(/[\u00A0\u200B\uFEFF]/g, " ");
      contentToInsert = parsePlainTextToHtml(normalizedText);
    }

    if (contentToInsert) {
      // Ensure final content is NFC-normalized for Vietnamese
      try { contentToInsert = contentToInsert.normalize("NFC"); } catch { /* ignore */ }
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
