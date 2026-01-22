import React, { useRef, useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import ChatBubble from "../components/assistant/ChatBubble";
import ChatInput from "../components/assistant/ChatInput";
import ModelSelector from "../components/assistant/ModelSelector";
import { processQuery } from "../services/aiAssistantService";

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

  // State cho Model Selection
  const [modelMode, setModelMode] = useState("PRO"); // PRO | FLASH | LOCAL
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
        backgroundColor: ["#fff1f2", "#fff7ed", "#fffbeb", "#fff1f2"],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/50 bg-rose-50 backdrop-blur-sm absolute top-0 left-0 right-0 z-20 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 text-white flex items-center justify-center shadow-md">
          <Bot size={24} />
        </div>
        <div>
          <div className="flex items-start gap-1">
            <h1 className="font-bold text-rose-900 text-lg relative">
              Trợ lý ảo Misa
            </h1>
            <span className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
              BETA
            </span>
          </div>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {modelMode === "PRO" && "Misa Smart"}
            {modelMode === "FLASH" && "Misa Flash"}
            {modelMode === "LITE" && "Misa Lite"}
          </p>
        </div>
      </div>

      {/* Message List - Added top padding for absolute header */}
      <div className="flex-1 overflow-y-auto p-4 pt-[80px] bg-transparent relative">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
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
      />

      {/* Input Area */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isTyping}
        onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        selectedModel={modelMode}
      />

      {/* Safe Area Spacer */}
      <div className="h-14"></div>
    </motion.div>
  );
};

export default Assistant;
