import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Send, Settings2, X } from "lucide-react";
import AssistantIcon from "./AssistantIcon";
import FlashIcon from "./FlashIcon";
import DeepIcon from "./DeepIcon";

const PLACEHOLDERS = [
  "Hôm nay cửa hàng thế nào...",
  "Gợi ý cách tăng doanh thu...",
  "Viết caption cho sản phẩm mới...",
  "Tổng hợp đơn hàng hôm nay...",
  "Kiểm tra tồn kho sắp hết...",
  "Phân tích khách hàng tiềm năng...",
];

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ChatInput = ({
  onSend,
  disabled,
  onOpenModelSelector,
  selectedModel = "standard",
  theme,
  onInputFocus,
  onInputBlur,
}) => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [iconY, setIconY] = useState(12); // Default padding-top (py-3 = 12px)

  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);

  // Default theme fallback
  const currentTheme = theme || {
    inputBg: "bg-white",
    inputFieldBg: "bg-gray-50",
    inputRing: "focus:ring-rose-300",
    sendButtonBg: "bg-rose-600",
    sendButtonShadow: "shadow-rose-200",
    settingsButtonBg: "bg-rose-100",
    settingsButtonText: "text-rose-500",
    inputIconColor: "text-rose-500", // Fallback if missing
  };

  // Trạng thái hiệu ứng gõ chữ
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(() =>
    Math.floor(Math.random() * PLACEHOLDERS.length),
  );

  const remainingIndicesRef = useRef(null);

  const typingSpeed = 25;
  const deletingSpeed = 15;
  const pauseTime = 1500;

  // Placeholder typing effect
  useEffect(() => {
    if (isFocused || text) return;

    const getNextIndex = () => {
      if (remainingIndicesRef.current === null) {
        const indices = PLACEHOLDERS.map((_, i) => i).filter(
          (i) => i !== currentPlaceholderIndex,
        );
        remainingIndicesRef.current = shuffleArray(indices);
      }

      if (remainingIndicesRef.current.length === 0) {
        const indices = PLACEHOLDERS.map((_, i) => i);
        remainingIndicesRef.current = shuffleArray(indices);
      }

      return remainingIndicesRef.current.pop();
    };

    const currentFullText = PLACEHOLDERS[currentPlaceholderIndex];

    const handleTyping = () => {
      setDisplayedText((current) => {
        if (isDeleting) {
          if (current.length > 0) {
            return current.slice(0, -1);
          } else {
            setIsDeleting(false);
            setCurrentPlaceholderIndex(getNextIndex());
            return "";
          }
        } else {
          if (current.length < currentFullText.length) {
            return currentFullText.slice(0, current.length + 1);
          } else {
            return current;
          }
        }
      });
    };

    let timer;
    if (!isDeleting && displayedText === currentFullText) {
      timer = setTimeout(() => setIsDeleting(true), pauseTime);
    } else {
      timer = setTimeout(
        handleTyping,
        isDeleting ? deletingSpeed : typingSpeed,
      );
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPlaceholderIndex, isFocused, text]);

  // Auto-resize logic
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 120 ? "auto" : "hidden";
  }, [text]);

  // Cursor tracking logic (Icon Animation)
  const updateIconPosition = () => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    // Copy styles
    const style = window.getComputedStyle(textarea);
    const props = [
      "boxSizing",
      "width",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "borderWidth",
      "fontSize",
      "fontFamily",
      "fontWeight",
      "lineHeight",
      "letterSpacing",
    ];
    props.forEach((p) => (mirror.style[p] = style[p]));
    mirror.style.width = `${textarea.clientWidth}px`;

    // Construct mirror content
    const cursor = textarea.selectionStart || 0;
    const val = textarea.value;
    const before = val.substring(0, cursor);
    const after = val.substring(cursor);

    mirror.textContent = "";
    const textBefore = document.createTextNode(before);
    const marker = document.createElement("span");
    marker.textContent = "|";
    const textAfter = document.createTextNode(after);

    mirror.appendChild(textBefore);
    mirror.appendChild(marker);
    mirror.appendChild(textAfter);

    // Calculate Y
    // offsetTop of marker is relative to mirror.
    // We want to center the icon (h=18) with the line (h~20).
    // marker.offsetTop gives top of the line (including paddingTop of container).
    // Example: paddingTop=12. Line 1 top=12.
    // Icon top should be approx 12 + 1 = 13.
    // We also subtract scrollTop to move icon up if user scrolls.
    const rawTop = marker.offsetTop;
    const centeredTop = rawTop + 1; // Fine-tune offset
    const finalY = centeredTop - textarea.scrollTop;

    setIconY(finalY);
  };

  // Update icon on interactions
  useEffect(() => {
    updateIconPosition();
  }, [text]); // Update when text changes

  const handleInteract = () => {
    requestAnimationFrame(updateIconPosition);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
      // Reset icon position
      setIconY(12);
    }
  };

  return (
    <div className={`${currentTheme.inputBg} border-t border-gray-100 p-3`}>
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        {/* Model Selector Button */}
        <button
          type="button"
          onClick={onOpenModelSelector}
          disabled={disabled}
          aria-label="Cài đặt chế độ AI"
          className={`p-3 ${currentTheme.settingsButtonBg} ${currentTheme.settingsButtonText} rounded-full active:scale-90 transition-all flex items-center justify-center shrink-0 h-[46px]`}
        >
          <Settings2 size={20} />
        </button>

        <div className="relative flex-1">
          {/* Animated Icon Container */}
          <div
            className={`absolute left-3 z-10 transition-transform duration-100 ease-out will-change-transform ${
              currentTheme.inputIconColor || "text-rose-500"
            }`}
            style={{
              top: 0,
              transform: `translateY(${iconY}px)`,
            }}
          >
            {selectedModel === "standard" && (
              <AssistantIcon isActive={isFocused} size={18} loop={true} />
            )}
            {selectedModel === "fast" && (
              <FlashIcon isActive={isFocused} size={18} loop={true} />
            )}
            {selectedModel === "deep" && (
              <DeepIcon isActive={isFocused} size={18} loop={true} />
            )}
          </div>

          {/* Placeholder with typing effect */}
          {!text && (
            <div
              className="absolute inset-0 flex items-start pl-10 pt-3 pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <span className="text-sm text-gray-400 truncate w-full leading-5">
                {isFocused ? "Hỏi Misa về bất kỳ điều gì..." : displayedText}
              </span>
            </div>
          )}

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (onInputFocus) onInputFocus();
            }}
            onBlur={() => {
              setIsFocused(false);
              if (onInputBlur) onInputBlur();
            }}
            onKeyUp={handleInteract}
            onClick={handleInteract}
            onScroll={handleInteract}
            disabled={disabled}
            rows={1}
            aria-label="Nhập câu hỏi cho trợ lý ảo"
            className={`w-full pl-10 pr-10 py-3 ${currentTheme.inputFieldBg} border border-gray-200 rounded-[24px] text-sm focus:outline-none focus:ring-2 ${currentTheme.inputRing} transition-all text-gray-800 resize-none block leading-5`}
            inputMode="text"
            enterKeyHint="enter"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            style={{ minHeight: "46px" }}
          />

          {/* Clear Button */}
          {text && (
            <button
              type="button"
              onClick={() => {
                setText("");
                if (textareaRef.current) textareaRef.current.focus();
              }}
              disabled={disabled}
              className="absolute right-2 top-2 p-1 text-gray-400 active:text-gray-600 transition-colors rounded-full"
              aria-label="Xoá nội dung"
            >
              <X size={16} />
            </button>
          )}

          {/* Mirror Div for Cursor Calculation */}
          <div
            ref={mirrorRef}
            className="absolute top-0 left-0 -z-50 invisible whitespace-pre-wrap break-words pointer-events-none"
            aria-hidden="true"
            style={{ visibility: "hidden" }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          aria-label="Gửi tin nhắn"
          className={`p-3 ${currentTheme.sendButtonBg} text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 transition-all shadow-sm ${currentTheme.sendButtonShadow} shrink-0 h-[46px] flex items-center justify-center`}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
