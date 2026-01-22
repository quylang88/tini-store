import { useState } from "react";
import { processQuery } from "../../services/aiAssistantService";

export const useAssistantChat = ({
  messages,
  setMessages,
  setIsTyping,
  products,
  orders,
  settings,
  modelMode,
  chatSummary,
  appendToPendingBuffer,
  checkAndSummarizeBuffer,
  forceSummarizeBuffer,
}) => {
  const [loadingText, setLoadingText] = useState(null);

  const handleSendMessage = async (text) => {
    const userMsg = {
      id: Date.now().toString(),
      type: "text",
      sender: "user",
      content: text,
      timestamp: new Date(),
    };

    // 1. Cập nhật UI ngay lập tức
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsTyping(true);
    setLoadingText(null);

    // 2. Lưu vào Buffer
    const currentBuffer = appendToPendingBuffer([userMsg]);

    // 3. Kiểm tra tóm tắt tự động
    checkAndSummarizeBuffer(currentBuffer);

    try {
      const response = await processQuery(
        text,
        { products, orders, settings },
        modelMode,
        newHistory,
        chatSummary,
        (status) => setLoadingText(status),
      );

      // Lưu câu trả lời của AI vào Buffer
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

  const handleClearScreen = async () => {
    if (messages.length === 0) return;

    // Force Summarize trước khi xóa màn hình
    setLoadingText("Đang lưu ký ức...");
    await forceSummarizeBuffer();
    setLoadingText(null);

    setMessages([]);
  };

  return {
    loadingText,
    handleSendMessage,
    handleClearScreen,
  };
};
