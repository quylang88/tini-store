import React, { useRef, useEffect, useState } from "react";
import { Bot, Palette, Sparkles, Eraser } from "lucide-react";
import { motion } from "framer-motion";
import ChatBubble from "../components/assistant/ChatBubble";
import ChatInput from "../components/assistant/ChatInput";
import ModelSelector from "../components/assistant/ModelSelector";
import AssistantIcon from "../components/assistant/AssistantIcon";
import FlashIcon from "../components/assistant/FlashIcon";
import DeepIcon from "../components/assistant/DeepIcon";
import {
  processQuery,
  summarizeChatHistory,
} from "../services/aiAssistantService";
import { ASSISTANT_THEMES } from "../constants/assistantThemes";
import { AI_MODES } from "../services/ai/config";

// --- CẤU HÌNH AN TOÀN BỘ NHỚ ---
const MAX_BUFFER_SIZE = 50; // Chỉ cho phép lưu tối đa 20 tin nhắn trong bộ nhớ đệm. Quá số này sẽ tự xóa tin cũ.
const BUFFER_TRIGGER_SIZE = 20; // Đủ 20 tin nhắn thì kích hoạt tóm tắt để dọn dẹp.

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

  // --- 1. MEMORY STATE (BỘ NHỚ DÀI HẠN) ---
  const [chatSummary, setChatSummary] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_chat_summary") || "";
    }
    return "";
  });

  // --- 2. LOGIC "BUFFER CLEANUP" (DỌN DẸP KHI KHỞI ĐỘNG) ---
  useEffect(() => {
    const processPendingBuffer = async () => {
      const pendingJson = localStorage.getItem("ai_pending_buffer");
      if (pendingJson) {
        try {
          const pendingMessages = JSON.parse(pendingJson);

          // [SAFETY VALVE 1] Nếu buffer rỗng hoặc lỗi, xóa ngay
          if (!Array.isArray(pendingMessages) || pendingMessages.length === 0) {
            localStorage.removeItem("ai_pending_buffer");
            return;
          }

          console.log(
            `Phát hiện ${pendingMessages.length} tin nhắn tồn đọng. Đang dọn dẹp...`,
          );

          // Gọi hàm tóm tắt để chuyển hóa buffer thành ký ức dài hạn
          const currentMem = localStorage.getItem("ai_chat_summary") || "";
          const newSummary = await summarizeChatHistory(
            currentMem,
            pendingMessages,
          );

          // Lưu bộ nhớ mới
          setChatSummary(newSummary);
          localStorage.setItem("ai_chat_summary", newSummary);

          // [QUAN TRỌNG] Xóa buffer ngay sau khi xử lý xong
          localStorage.removeItem("ai_pending_buffer");
          console.log("Đã dọn dẹp bộ nhớ đệm thành công!");
        } catch (e) {
          console.error("Lỗi xử lý buffer, tiến hành xóa bắt buộc:", e);
          // Nếu lỗi (VD: JSON hỏng), xóa luôn để tránh kẹt bộ nhớ
          localStorage.removeItem("ai_pending_buffer");
        }
      }
    };
    processPendingBuffer();
  }, []);

  // --- HÀM HELPER: THÊM VÀO BUFFER VỚI GIỚI HẠN (SAFETY VALVE 2) ---
  const appendToPendingBuffer = (newMsgs) => {
    let currentBuffer = [];
    try {
      currentBuffer = JSON.parse(
        localStorage.getItem("ai_pending_buffer") || "[]",
      );
    } catch {
      currentBuffer = [];
    }

    // Gộp tin nhắn mới
    let updatedBuffer = [...currentBuffer, ...newMsgs];

    // [CƠ CHẾ TỰ DỌN DẸP] Nếu Buffer quá lớn (do lỗi API ko tóm tắt được), cắt bớt phần cũ
    if (updatedBuffer.length > MAX_BUFFER_SIZE) {
      console.warn("Buffer quá tải, đang cắt bớt dữ liệu cũ...");
      // Giữ lại MAX_BUFFER_SIZE tin nhắn mới nhất
      updatedBuffer = updatedBuffer.slice(-MAX_BUFFER_SIZE);
    }

    localStorage.setItem("ai_pending_buffer", JSON.stringify(updatedBuffer));
    return updatedBuffer;
  };

  // --- THEME STATE ---
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

  const [modelMode, setModelMode] = useState("standard");
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [loadingText, setLoadingText] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingText]);

  // --- HÀM XỬ LÝ KHI GỬI TIN NHẮN ---
  const handleSendMessage = async (text) => {
    const userMsg = {
      id: Date.now().toString(),
      type: "text",
      sender: "user",
      content: text,
      timestamp: new Date(),
    };

    // 1. Cập nhật UI (RAM) - Hiển thị ngay lập tức
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsTyping(true);
    setLoadingText(null);

    // 2. Lưu vào Buffer (Ổ cứng tạm) - Có cơ chế giới hạn Max Size
    const currentBuffer = appendToPendingBuffer([userMsg]);

    // 3. Kiểm tra xem đã đến lúc "Dọn dẹp" (Summarize) chưa?
    if (currentBuffer.length >= BUFFER_TRIGGER_SIZE) {
      console.log("Buffer đạt ngưỡng, kích hoạt tóm tắt & dọn dẹp...");

      // Chạy ngầm (không await để UI mượt)
      summarizeChatHistory(chatSummary, currentBuffer)
        .then((newSummary) => {
          setChatSummary(newSummary);
          localStorage.setItem("ai_chat_summary", newSummary);

          // [QUAN TRỌNG] Tóm tắt xong thì XÓA BUFFER ngay
          localStorage.removeItem("ai_pending_buffer");
          console.log("Auto summarize done & Buffer cleared.");
        })
        .catch((err) => console.error("Lỗi tóm tắt ngầm:", err));
    }

    try {
      const response = await processQuery(
        text,
        { products, orders, settings },
        modelMode,
        newHistory,
        chatSummary,
        (status) => setLoadingText(status),
      );

      // Lưu câu trả lời của AI vào Buffer luôn
      const aiMsgForBuffer = { sender: "assistant", content: response.content };
      appendToPendingBuffer([aiMsgForBuffer]);

      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "text",
          sender: "assistant",
          content: "Xin lỗi, Misa bị vấp dây điện rồi.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- HÀM CLEAR SCREEN (DỌN MÀN HÌNH + LƯU KÝ ỨC) ---
  const handleClearScreen = async () => {
    if (messages.length === 0) return;

    // Force Summarize: Lưu những gì đang có trên buffer vào ký ức trước khi xóa màn hình
    const pendingJson = localStorage.getItem("ai_pending_buffer");
    if (pendingJson) {
      setLoadingText("Đang lưu ký ức...");
      try {
        const pendingMessages = JSON.parse(pendingJson);
        if (pendingMessages.length > 0) {
          const newSummary = await summarizeChatHistory(
            chatSummary,
            pendingMessages,
          );
          setChatSummary(newSummary);
          localStorage.setItem("ai_chat_summary", newSummary);
        }
      } catch (e) {
        console.warn("Lỗi force summarize:", e);
      }
      // Luôn xóa buffer sau khi clear screen
      localStorage.removeItem("ai_pending_buffer");
      setLoadingText(null);
    }

    setMessages([]);
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

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 pt-[80px] bg-transparent relative">
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

      <ChatInput
        onSend={handleSendMessage}
        disabled={isTyping}
        onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        selectedModel={modelMode}
        theme={activeTheme}
      />
      <div className="h-14"></div>
    </motion.div>
  );
};

export default Assistant;
