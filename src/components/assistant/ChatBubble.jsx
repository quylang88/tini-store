import React, { useRef, useEffect, useState } from "react";
import { formatCurrency } from "../../utils/formatters/formatUtils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { MapPin, Check, X, Copy, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatBubble = ({ message, onAction }) => {
  const isUser = message.sender === "user";
  const scrollRef = useRef(null);
  const textRef = useRef(null);

  // Interaction states
  const [isPressed, setIsPressed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [enableSelection, setEnableSelection] = useState(false);
  const pressTimer = useRef(null);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  // --- LONG PRESS LOGIC ---
  const handlePointerDown = () => {
    if (enableSelection) return; // Nếu đang ở chế độ chọn text thì không kích hoạt long press

    pressTimer.current = setTimeout(() => {
      setIsPressed(true);
      setShowMenu(true);
      // Rung nhẹ (Haptic feedback) nếu có thể
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms threshold for long press
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    // Không tắt isPressed ngay nếu menu đang mở
    if (!showMenu) {
       setIsPressed(false);
    }
  };

  const handlePointerLeave = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (!showMenu) {
        setIsPressed(false);
    }
  };

  // --- MENU ACTIONS ---
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
    setIsPressed(false);
  };

  const handleSelectText = () => {
    setEnableSelection(true);
    setShowMenu(false);
    setIsPressed(false); // Tắt hiệu ứng active

    // Select text programmatically
    setTimeout(() => {
      if (textRef.current) {
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 50);
  };

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.chat-bubble-menu')) {
        setShowMenu(false);
        setIsPressed(false);
      }
    };

    if (showMenu) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);


  return (
    <div
      ref={scrollRef}
      className={`flex w-full mb-4 relative ${isUser ? "justify-end" : "justify-start"}`}
    >
      <motion.div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        animate={{ scale: isPressed ? 0.95 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm relative transition-colors duration-200 ${
          isUser
            ? "bg-rose-500 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
        } ${enableSelection ? "select-text cursor-text" : "select-none cursor-default touch-manipulation"}`}
      >
        {/* Nội dung văn bản */}
        <p ref={textRef} className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>

        {/* --- MENU LONG PRESS --- */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className={`chat-bubble-menu absolute z-50 min-w-[140px] bg-gray-800 text-white rounded-xl shadow-xl overflow-hidden flex flex-col py-1 ${isUser ? "right-0 top-full mt-2" : "left-0 top-full mt-2"}`}
            >
                <button onClick={handleCopy} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 active:bg-gray-600 text-left text-sm font-medium">
                    <Copy size={16} /> Sao chép
                </button>
                <div className="h-[1px] bg-gray-700 mx-2"></div>
                <button onClick={handleSelectText} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 active:bg-gray-600 text-left text-sm font-medium">
                    <Type size={16} /> Chọn văn bản
                </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Giao diện yêu cầu vị trí --- */}
        {!isUser && message.type === "location_request" && (
          <div className="mt-3 bg-blue-50 p-3 rounded-xl border border-blue-100 select-none">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-medium text-sm">
              <MapPin size={16} />
              <span>Yêu cầu truy cập vị trí</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Cho phép Misa truy cập vị trí hiện tại để hỗ trợ thông tin thời
              tiết, chỉ đường... chính xác hơn?
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onAction && onAction(message, "allow"); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <Check size={14} /> Cho phép
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAction && onAction(message, "deny"); }}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <X size={14} /> Từ chối
              </button>
            </div>
          </div>
        )}

        {/* Các loại nội dung đặc biệt */}
        {!isUser && message.type === "stats" && message.data && (
          <div className="mt-3 bg-rose-50 rounded-xl p-3 border border-rose-100 select-none">
            <div className="text-xs text-rose-500 uppercase font-bold tracking-wider mb-1">
              {message.data.label}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(message.data.value)}
            </div>
            {message.data.subtext && (
              <div className="text-xs text-gray-500 mt-1">
                {message.data.subtext}
              </div>
            )}
          </div>
        )}

        {!isUser &&
          message.type === "product_list" &&
          Array.isArray(message.data) && (
            <div className="mt-3 flex flex-col gap-2 select-none">
              {message.data.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 p-2 rounded-lg flex items-center gap-3 border border-gray-200"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded-md bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center shrink-0 text-xs text-gray-400">
                      IMG
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-semibold text-rose-600">
                        {formatCurrency(product.price)}
                      </span>
                      <span>• Kho: {product.stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {!isUser &&
          message.type === "order_list" &&
          Array.isArray(message.data) && (
            <div className="mt-3 flex flex-col gap-2 select-none">
              {message.data.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50 p-2 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">
                      #{order.id.toString().slice(-4)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(order.date), "dd/MM HH:mm", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {order.items.length} món
                    </span>
                    <span className="text-sm font-bold text-rose-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Thời gian */}
        <div
          className={`text-[10px] mt-1 text-right select-none ${isUser ? "text-rose-100" : "text-gray-400"}`}
        >
          {message.timestamp && format(new Date(message.timestamp), "HH:mm")}
        </div>
      </motion.div>
    </div>
  );
};

export default ChatBubble;
