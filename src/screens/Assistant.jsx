import React, { useState, useEffect } from "react";
import { Bot, Palette, Eraser } from "lucide-react";
import { motion } from "framer-motion";
import ChatBubble from "../components/assistant/ChatBubble";
import ChatInput from "../components/assistant/ChatInput";
import ModelSelector from "../components/assistant/ModelSelector";
import AssistantIcon from "../components/assistant/AssistantIcon";
import FlashIcon from "../components/assistant/FlashIcon";
import DeepIcon from "../components/assistant/DeepIcon";
import { AI_MODES } from "../services/ai/config";

// Hooks
import { useAssistantTheme } from "../hooks/assistant/useAssistantTheme";
import { useAssistantMode } from "../hooks/assistant/useAssistantMode";
import { useAssistantMemory } from "../hooks/assistant/useAssistantMemory";
import { useAssistantChat } from "../hooks/assistant/useAssistantChat";
import { useAutoScroll } from "../hooks/assistant/useAutoScroll";

const Assistant = ({
  products,
  orders,
  settings,
  messages,
  setMessages,
  isTyping,
  setIsTyping,
  setTabBarVisible,
}) => {
  // 1. Theme Logic
  const { activeTheme, handleCycleTheme } = useAssistantTheme();

  const [isInputFocused, setIsInputFocused] = React.useState(false);

  // --- FIX: Visual Viewport Logic for iOS ---
  // Dùng state để lưu chiều cao thực tế của vùng hiển thị
  const [viewportHeight, setViewportHeight] = useState("100dvh");

  useEffect(() => {
    // Chỉ chạy logic này nếu trình duyệt hỗ trợ visualViewport (iOS Safari/Chrome)
    if (!window.visualViewport) return;

    const handleResize = () => {
      // Cập nhật chiều cao container bằng đúng chiều cao nhìn thấy được
      setViewportHeight(`${window.visualViewport.height}px`);
      // Scroll window về 0 để tránh header bị đẩy lên trên
      window.scrollTo(0, 0);
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);

    // Set chiều cao ban đầu
    handleResize();

    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
    };
  }, []);
  // ------------------------------------------

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setTabBarVisible(false);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    setTabBarVisible(true);
  };

  // 2. Mode Logic
  const {
    modelMode,
    setModelMode,
    isModelSelectorOpen,
    setIsModelSelectorOpen,
  } = useAssistantMode();

  // 3. Memory Logic
  const {
    chatSummary,
    setChatSummary,
    appendToPendingBuffer,
    checkAndSummarizeBuffer,
    forceSummarizeBuffer,
  } = useAssistantMemory();

  // 4. Chat Logic
  const { loadingText, handleSendMessage, handleClearScreen } =
    useAssistantChat({
      messages,
      setMessages,
      setIsTyping,
      products,
      orders,
      settings,
      modelMode,
      chatSummary,
      setChatSummary,
      appendToPendingBuffer,
      checkAndSummarizeBuffer,
      forceSummarizeBuffer,
    });

  // 5. Scroll Logic
  const messagesEndRef = useAutoScroll([messages, loadingText]);

  return (
    <motion.div
      // --- FIX: Áp dụng chiều cao cứng từ visualViewport ---
      style={{ height: viewportHeight }}
      className="flex flex-col w-full relative overflow-hidden"
      animate={{
        backgroundColor: activeTheme.bgGradient,
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {/* HEADER: Chuyển từ absolute sang flex-none (static). 
        Điều này giúp layout cứng cáp hơn, header không bao giờ bị scroll mất.
      */}
      <div
        className={`flex-none pt-[env(safe-area-inset-top)] flex items-center gap-3 px-4 py-3 border-b border-white/50 backdrop-blur-sm z-20 shadow-sm ${activeTheme.headerBg}`}
      >
        <div
          className={`w-10 h-10 rounded-full ${activeTheme.headerIconBg} text-white flex items-center justify-center shadow-md`}
        >
          <Bot size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-start gap-1">
            <h1
              className={`font-bold text-lg relative ${activeTheme.headerText}`}
            >
              Trợ lý ảo Misa
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${navigator.onLine ? "bg-green-500" : "bg-red-500"} animate-pulse`}
              ></span>
              {modelMode === "standard" && AI_MODES.standard.label}
              {modelMode === "fast" && AI_MODES.fast.label}
              {modelMode === "deep" && AI_MODES.deep.label}
            </p>
            {chatSummary && (
              <span
                className={`text-[10px] ${activeTheme.themeBtnBg} ${activeTheme.themeBtnText} px-1.5 rounded-full flex items-center gap-0.5`}
              >
                {modelMode === "standard" && (
                  <AssistantIcon isActive={false} size={14} />
                )}
                {modelMode === "fast" && (
                  <FlashIcon isActive={false} size={14} />
                )}
                {modelMode === "deep" && (
                  <DeepIcon isActive={false} size={14} />
                )}
                Đang nhớ
              </span>
            )}
          </div>
        </div>

        {/* Nút Dọn Màn Hình */}
        {messages.length > 0 && (
          <button
            onClick={handleClearScreen}
            className={`p-2.5 mr-1 rounded-full transition-all shadow-sm active:scale-90 ring-1 ${activeTheme.themeBtnBg} ${activeTheme.themeBtnRing}`}
            title="Dọn màn hình (AI vẫn nhớ)"
          >
            <Eraser size={20} className={activeTheme.themeBtnText} />
          </button>
        )}

        <button
          onClick={handleCycleTheme}
          className={`p-2.5 rounded-full transition-all shadow-sm active:scale-90 ring-1 ${activeTheme.themeBtnBg} ${activeTheme.themeBtnRing}`}
        >
          <Palette size={20} className={activeTheme.themeBtnText} />
        </button>
      </div>

      {/* Message List: flex-1 để chiếm toàn bộ khoảng trống còn lại.
        Bỏ padding-top cứng (80px) vì header không còn là absolute nữa.
      */}
      <div className="flex-1 overflow-y-auto p-4 bg-transparent relative scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
            <p>Màn hình trống.</p>
            <p>Nhưng Misa vẫn nhớ chuyện cũ nha!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} theme={activeTheme} />
          ))
        )}

        {isTyping && (
          <div className="flex justify-start mb-4 flex-col gap-2">
            <div
              className={`bg-white border ${activeTheme.botBubbleBorder} px-5 py-3.5 rounded-[20px] rounded-tl-sm shadow-sm flex gap-1 items-center w-fit`}
            >
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
            {loadingText && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-gray-500 italic ml-2"
              >
                {loadingText}
              </motion.span>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ModelSelector
        selectedModel={modelMode}
        onSelect={setModelMode}
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        theme={activeTheme}
      />

      {/* Input Area */}
      <div className="flex-none z-30 bg-white">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isTyping}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
          selectedModel={modelMode}
          theme={activeTheme}
          onInputFocus={handleInputFocus}
          onInputBlur={handleInputBlur}
          isFocused={isInputFocused}
        />
      </div>

      {/* Spacer cho TabBar: 
        Khi input focus (bàn phím hiện), spacer = 0.
        Khi input blur (bàn phím ẩn), spacer = chiều cao TabBar + Safe area.
      */}
      <motion.div
        animate={{
          height: isInputFocused
            ? 0
            : "calc(52px + env(safe-area-inset-bottom))",
        }}
        transition={{ duration: 0.2 }}
        className="flex-none bg-white"
      />
    </motion.div>
  );
};

export default Assistant;
