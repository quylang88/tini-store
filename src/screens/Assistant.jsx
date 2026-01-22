import React, { useRef, useEffect, useState } from "react";
import { Bot, Palette } from "lucide-react";
import { motion } from "framer-motion";
import ChatBubble from "../components/assistant/ChatBubble";
import ChatInput from "../components/assistant/ChatInput";
import ModelSelector from "../components/assistant/ModelSelector";
import { processQuery } from "../services/aiAssistantService";
import { ASSISTANT_THEMES } from "../constants/assistantThemes";

const Assistant = ({
  products,
  orders,
  settings,
  messages,
  setMessages,
  isTyping,
  setIsTyping,
}) => {
  const messagesEndRef = useRef(null);

  // Theme State
  const [activeThemeId, setActiveThemeId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_theme_id") || "rose";
    }
    return "rose";
  });
  const activeTheme =
    ASSISTANT_THEMES[activeThemeId] || ASSISTANT_THEMES["rose"];

  const handleCycleTheme = () => {
    const themeIds = Object.keys(ASSISTANT_THEMES);
    const currentIndex = themeIds.indexOf(activeThemeId);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    const newThemeId = themeIds[nextIndex];
    setActiveThemeId(newThemeId);
    localStorage.setItem("ai_theme_id", newThemeId);
  };

  // State cho Model Selection
  const [modelMode, setModelMode] = useState("SMART"); // SMART | FLASH | LITE
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    const userMsg = {
      id: Date.now().toString(),
      type: "text",
      sender: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await processQuery(
        text,
        { products, orders, settings },
        modelMode,
      );

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "text",
          sender: "assistant",
          content: "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col h-full relative overflow-hidden"
      animate={{
        backgroundColor: activeTheme.bgGradient,
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-white/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-20 shadow-sm ${activeTheme.headerBg}`}
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
            <span
              className={`${activeTheme.headerBETA} text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse`}
            >
              BETA
            </span>
          </div>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {modelMode === "SMART" && "Misa Smart"}
            {modelMode === "FLASH" && "Misa Flash"}
            {modelMode === "LITE" && "Misa Lite"}
          </p>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={handleCycleTheme}
          className={`p-2.5 rounded-full transition-all shadow-sm active:scale-90 ring-1 ${activeTheme.themeBtnBg} ${activeTheme.themeBtnRing}`}
          title="Đổi giao diện"
        >
          <Palette size={20} className={activeTheme.themeBtnText} />
        </button>
      </div>

      {/* Message List - Added top padding for absolute header */}
      <div className="flex-1 overflow-y-auto p-4 pt-[80px] bg-transparent relative">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} theme={activeTheme} />
        ))}

        {isTyping && (
          <div className="flex justify-start mb-4">
            <div
              className={`bg-white border ${activeTheme.botBubbleBorder} px-5 py-3.5 rounded-[20px] rounded-tl-sm shadow-sm flex gap-1 items-center`}
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
      <ChatInput
        onSend={handleSendMessage}
        disabled={isTyping}
        onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        selectedModel={modelMode}
        theme={activeTheme}
      />

      {/* Safe Area Spacer */}
      <div className="h-14"></div>
    </motion.div>
  );
};

export default Assistant;
