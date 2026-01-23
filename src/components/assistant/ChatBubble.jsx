import React, { useRef, useEffect, useState } from "react";
import { formatCurrency } from "../../utils/formatters/formatUtils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Copy, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic, HAPTIC_PATTERNS } from "../../utils/common/haptics";

const ChatBubble = ({ message, theme }) => {
  const isUser = message.sender === "user";
  const scrollRef = useRef(null);
  const textRef = useRef(null);
  const bubbleRef = useRef(null);

  // Default theme fallback if not provided
  const currentTheme = theme || {
    userBubbleBg: "bg-rose-500",
    userBubbleText: "text-white",
    botBubbleBorder: "border-gray-100",
    botStatsBg: "bg-rose-50",
    botStatsBorder: "border-rose-100",
    botStatsText: "text-rose-500",
    botPriceText: "text-rose-600",
    inputIconColor: "text-rose-500", // Fallback for menu icons
  };

  // Interaction states
  const [isPressed, setIsPressed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState("bottom"); // "top" or "bottom"
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
      // Calculate Menu Position
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // Nếu khoảng trống bên dưới < 220px (đủ cho menu + keyboard đè lên), hiện menu lên trên
        if (spaceBelow < 220) {
          setMenuPosition("top");
        } else {
          setMenuPosition("bottom");
        }
      }

      setIsPressed(true);
      setShowMenu(true);
      triggerHaptic(HAPTIC_PATTERNS.medium);
    }, 500); // Tăng lên 500ms để tránh hiện nhầm
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
      if (showMenu && !event.target.closest(".chat-bubble-menu")) {
        setShowMenu(false);
        setIsPressed(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMenu]);

  // Click outside to cancel text selection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target)) {
        setEnableSelection(false);
        window.getSelection().removeAllRanges();
      }
    };

    if (enableSelection) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [enableSelection]);

  // Design: iMessage Style Border Radius
  // User: Bo tròn hết, trừ góc dưới phải nhọn
  // Bot: Bo tròn hết, trừ góc dưới trái nhọn
  const borderRadiusClass = isUser
    ? "rounded-[18px] rounded-br-[2px]"
    : "rounded-[18px] rounded-bl-[2px]";

  return (
    <div
      ref={scrollRef}
      style={{ zIndex: showMenu ? 50 : "auto" }} // Fix z-index overlap issue
      className={`flex w-full mb-4 relative ${isUser ? "justify-end" : "justify-start"}`}
    >
      <motion.div
        ref={bubbleRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        animate={{ scale: isPressed ? 0.95 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`max-w-[85%] px-5 py-3.5 shadow-sm relative transition-colors duration-200 ${borderRadiusClass} ${
          isUser
            ? `${currentTheme.userBubbleBg} ${currentTheme.userBubbleText} shadow-md`
            : `bg-white text-gray-800 border ${currentTheme.botBubbleBorder} shadow-sm`
        } ${enableSelection ? "select-text cursor-text" : "select-none cursor-default touch-manipulation"}`}
      >
        {/* Nội dung văn bản */}
        <p
          ref={textRef}
          className="whitespace-pre-wrap text-[15px] leading-relaxed"
        >
          {message.content}
        </p>

        {/* --- MENU LONG PRESS --- */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
                y: menuPosition === "top" ? 10 : -10,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.8,
                y: menuPosition === "top" ? 10 : -10,
              }}
              style={{
                originY: menuPosition === "top" ? 1 : 0,
              }}
              className={`chat-bubble-menu absolute z-50 min-w-[160px] bg-white border border-gray-100 text-gray-700 rounded-xl shadow-xl overflow-hidden flex flex-col py-1 ${
                isUser ? "right-0" : "left-0"
              } ${
                menuPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
              }`}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-left text-sm font-medium transition-colors"
              >
                <Copy size={16} className={currentTheme.inputIconColor} /> Sao
                chép
              </button>
              <div className="h-[1px] bg-gray-100 mx-2"></div>
              <button
                onClick={handleSelectText}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-left text-sm font-medium transition-colors"
              >
                <Type size={16} className={currentTheme.inputIconColor} /> Chọn
                văn bản
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Các loại nội dung đặc biệt */}
        {!isUser && message.type === "stats" && message.data && (
          <div
            className={`mt-3 ${currentTheme.botStatsBg} rounded-xl p-3 border ${currentTheme.botStatsBorder} select-none`}
          >
            <div
              className={`text-xs ${currentTheme.botStatsText} uppercase font-bold tracking-wider mb-1`}
            >
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
                      <span
                        className={`font-semibold ${currentTheme.botPriceText}`}
                      >
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
                    <span
                      className={`text-sm font-bold ${currentTheme.botPriceText}`}
                    >
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Thời gian */}
        <div
          className={`text-[10px] mt-1 text-right select-none ${isUser ? "text-white/80" : "text-gray-400"}`}
        >
          {message.timestamp && format(new Date(message.timestamp), "HH:mm")}
        </div>
      </motion.div>
    </div>
  );
};

export default ChatBubble;
