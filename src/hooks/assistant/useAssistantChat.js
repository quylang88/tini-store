import { useState } from "react";
import { processQuery } from "../../services/aiAssistantService";
import { getRandomGreeting } from "../../services/ai/chatHelpers";
import { detectIntent } from "../../services/ai/intentService";

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

    // 0. Xác định Intent trước để quyết định có lưu memory không
    let intent = "CHAT";
    try {
      setLoadingText("Misa đang suy nghĩ...");
      intent = await detectIntent(text);
    } catch (e) {
      console.warn("Intent detection failed inside useAssistantChat", e);
    }

    // 2. Lưu vào Buffer (Chỉ khi KHÔNG phải CHAT)
    if (intent !== "CHAT") {
      const currentBuffer = appendToPendingBuffer([userMsg]);
      // 3. Kiểm tra tóm tắt tự động
      checkAndSummarizeBuffer(currentBuffer);
    }

    try {
      const response = await processQuery(
        text,
        { products, orders, settings },
        modelMode,
        newHistory,
        chatSummary,
        (status) => setLoadingText(status),
        intent, // Pass explicit intent
      );

      // Nếu là Text thường -> Lưu vào Buffer (Chỉ khi KHÔNG phải CHAT)
      if (response.type !== "tool_request") {
        if (intent !== "CHAT") {
          const aiMsgForBuffer = {
            sender: "assistant",
            content: response.content,
          };
          appendToPendingBuffer([aiMsgForBuffer]);
        }
      } else {
        // Nếu là Tool Request -> KHÔNG lưu vào Buffer ngay (đợi Confirm xong mới lưu kết quả)
        // Hoặc có thể lưu "AI yêu cầu..." tùy logic, nhưng tạm thời để UI xử lý
      }

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
      setLoadingText(null); // Clear loading status
    }
  };

  const handleClearScreen = async () => {
    if (messages.length === 0) return;

    // Force Summarize trước khi xóa màn hình
    setLoadingText("Đang lưu ký ức...");
    await forceSummarizeBuffer();
    setLoadingText(null);

    // Reset về một câu chào mới ngẫu nhiên (tránh trùng câu cũ nếu có)
    const currentGreeting = messages.length > 0 ? messages[0].content : null;
    setMessages([getRandomGreeting(currentGreeting)]);
  };

  return {
    loadingText,
    handleSendMessage,
    handleClearScreen,
  };
};
