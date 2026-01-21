import React, { useState, useEffect, useRef } from "react";
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

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Typewriter state
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize with a random index without ref logic during render
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(() =>
    Math.floor(Math.random() * PLACEHOLDERS.length)
  );

  // Use a ref to store the shuffled queue
  const remainingIndicesRef = useRef(null);

  const getNextIndex = () => {
    // Lazy initialization for the queue on first call
    if (remainingIndicesRef.current === null) {
      // Create list of all indices excluding the current one to start with
      const indices = PLACEHOLDERS.map((_, i) => i).filter(i => i !== currentPlaceholderIndex);
      remainingIndicesRef.current = shuffleArray(indices);
    }

    if (remainingIndicesRef.current.length === 0) {
      // Create a new shuffled list of all indices for subsequent loops
      const indices = PLACEHOLDERS.map((_, i) => i);
      remainingIndicesRef.current = shuffleArray(indices);
    }

    return remainingIndicesRef.current.pop();
  };

  const typingSpeed = 30;
  const deletingSpeed = 15;
  const pauseTime = 1500;

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
            // Finished deleting, switch to next phrase from the shuffled queue
            setIsDeleting(false);
            // Calling getNextIndex here is safe (inside effect callback)
            setCurrentPlaceholderIndex(getNextIndex());
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
      timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
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
