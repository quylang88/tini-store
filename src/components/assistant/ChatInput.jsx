import React, { useState, useEffect, useRef } from "react";
import { Send, Settings2 } from "lucide-react";
import AssistantIcon from "./AssistantIcon";
import FlashIcon from "./FlashIcon";
import LocalIcon from "./LocalIcon";

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
  selectedModel = "PRO",
}) => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Trạng thái hiệu ứng gõ chữ
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Khởi tạo index ngẫu nhiên, tránh logic ref khi render
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(() =>
    Math.floor(Math.random() * PLACEHOLDERS.length),
  );

  // Sử dụng ref để lưu hàng đợi đã xáo trộn
  const remainingIndicesRef = useRef(null);

  const typingSpeed = 25;
  const deletingSpeed = 15;
  const pauseTime = 1500;

  useEffect(() => {
    // Tạm dừng hiệu ứng nếu đang focus hoặc đang gõ
    if (isFocused || text) return;

    const getNextIndex = () => {
      // Khởi tạo lười (lazy) cho hàng đợi ở lần gọi đầu tiên
      if (remainingIndicesRef.current === null) {
        // Tạo danh sách index loại trừ index hiện tại để bắt đầu
        const indices = PLACEHOLDERS.map((_, i) => i).filter(
          (i) => i !== currentPlaceholderIndex,
        );
        remainingIndicesRef.current = shuffleArray(indices);
      }

      if (remainingIndicesRef.current.length === 0) {
        // Tạo danh sách index đã xáo trộn mới cho các vòng lặp tiếp theo
        const indices = PLACEHOLDERS.map((_, i) => i);
        remainingIndicesRef.current = shuffleArray(indices);
      }

      return remainingIndicesRef.current.pop();
    };

    const currentFullText = PLACEHOLDERS[currentPlaceholderIndex];

    const handleTyping = () => {
      setDisplayedText((current) => {
        if (isDeleting) {
          // Đang xóa
          if (current.length > 0) {
            return current.slice(0, -1);
          } else {
            // Xóa xong, chuyển sang câu tiếp theo từ hàng đợi
            setIsDeleting(false);
            // Gọi getNextIndex ở đây là an toàn (bên trong callback của effect)
            setCurrentPlaceholderIndex(getNextIndex());
            return "";
          }
        } else {
          // Đang gõ
          if (current.length < currentFullText.length) {
            return currentFullText.slice(0, current.length + 1);
          } else {
            // Gõ xong, đợi trước khi xóa
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
        {/* Model Selector Button */}
        <button
          type="button"
          onClick={onOpenModelSelector}
          disabled={disabled}
          className="p-3 bg-rose-100 text-rose-500 rounded-full hover:bg-rose-200 active:scale-90 transition-all flex items-center justify-center"
        >
          <Settings2 size={20} />
        </button>

        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 z-10">
            {selectedModel === "PRO" && (
              <AssistantIcon isActive={isFocused} size={18} />
            )}
            {selectedModel === "FLASH" && (
              <FlashIcon isActive={isFocused} size={18} />
            )}
            {selectedModel === "LOCAL" && (
              <LocalIcon isActive={isFocused} size={18} />
            )}
          </div>

          {/* Placeholder có hiệu ứng */}
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
