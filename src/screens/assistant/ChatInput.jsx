import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import AssistantIcon from "../../screens/assistant/AssistantIcon";

const PLACEHOLDERS = [
  "Hôm nay cửa hàng thế nào...",
  "Gợi ý cách tăng doanh thu...",
  "Viết caption cho sản phẩm mới...",
  "Tổng hợp đơn hàng hôm nay...",
  "Kiểm tra tồn kho sắp hết...",
  "Phân tích khách hàng tiềm năng...",
];

const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Typewriter state
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(() =>
    Math.floor(Math.random() * PLACEHOLDERS.length),
  );
  const typingSpeed = 50;
  const deletingSpeed = 30;
  const pauseTime = 2000;

  useEffect(() => {
    if (isFocused || text) return; // Pause animation if focused or typing

    const currentFullText = PLACEHOLDERS[currentPlaceholderIndex];

    const handleTyping = () => {
      setDisplayedText((current) => {
        if (isDeleting) {
          // Deleting
          if (current.length > 0) {
            return current.slice(0, -1);
          } else {
            // Finished deleting, switch to next phrase
            setIsDeleting(false);
            setCurrentPlaceholderIndex((prev) => {
              let next;
              do {
                next = Math.floor(Math.random() * PLACEHOLDERS.length);
              } while (next === prev && PLACEHOLDERS.length > 1);
              return next;
            });
            return "";
          }
        } else {
          // Typing
          if (current.length < currentFullText.length) {
            return currentFullText.slice(0, current.length + 1);
          } else {
            // Finished typing, wait before deleting
            return current;
          }
        }
      });
    };

    let timer;

    if (!isDeleting && displayedText === currentFullText) {
      // Pause at full text
      timer = setTimeout(() => setIsDeleting(true), pauseTime);
    } else {
      // Typing or deleting
      timer = setTimeout(
        handleTyping,
        isDeleting ? deletingSpeed : typingSpeed,
      );
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPlaceholderIndex, isFocused, text]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 z-10">
            <AssistantIcon isActive={isFocused} size={18} />
          </div>

          {/* Animated Placeholder */}
          {!text && (
            <div className="absolute inset-0 flex items-center pl-10 pointer-events-none overflow-hidden">
              <span className="text-sm text-gray-400 truncate w-full">
                {isFocused ? "Hỏi Misa về bất kỳ điều gì..." : displayedText}
                {!isFocused && <span className="animate-pulse">|</span>}
              </span>
            </div>
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all text-gray-800"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-3 bg-rose-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 active:scale-90 transition-all shadow-sm shadow-rose-200"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
