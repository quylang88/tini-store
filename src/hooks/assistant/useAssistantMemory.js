import { useState, useEffect } from "react";
import { summarizeChatHistory } from "../../services/aiAssistantService";

// Cấu hình an toàn
const MAX_BUFFER_SIZE = 50; // Tối đa 50 tin nhắn trong buffer
const BUFFER_TRIGGER_SIZE = 20; // Đủ 20 tin nhắn thì tóm tắt

export const useAssistantMemory = () => {
  const [chatSummary, setChatSummary] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_chat_summary") || "";
    }
    return "";
  });

  // Xử lý buffer tồn đọng khi khởi động
  useEffect(() => {
    const processPendingBuffer = async () => {
      const pendingJson = localStorage.getItem("ai_pending_buffer");
      if (pendingJson) {
        try {
          const pendingMessages = JSON.parse(pendingJson);

          if (!Array.isArray(pendingMessages) || pendingMessages.length === 0) {
            localStorage.removeItem("ai_pending_buffer");
            return;
          }

          console.log(
            `Phát hiện ${pendingMessages.length} tin nhắn tồn đọng. Đang dọn dẹp...`
          );

          const currentMem = localStorage.getItem("ai_chat_summary") || "";
          const newSummary = await summarizeChatHistory(
            currentMem,
            pendingMessages
          );

          setChatSummary(newSummary);
          localStorage.setItem("ai_chat_summary", newSummary);
          localStorage.removeItem("ai_pending_buffer");
          console.log("Đã dọn dẹp bộ nhớ đệm thành công!");
        } catch (e) {
          console.error("Lỗi xử lý buffer, tiến hành xóa bắt buộc:", e);
          localStorage.removeItem("ai_pending_buffer");
        }
      }
    };
    processPendingBuffer();
  }, []);

  // Hàm thêm tin nhắn vào buffer
  const appendToPendingBuffer = (newMsgs) => {
    let currentBuffer = [];
    try {
      currentBuffer = JSON.parse(
        localStorage.getItem("ai_pending_buffer") || "[]"
      );
    } catch {
      currentBuffer = [];
    }

    let updatedBuffer = [...currentBuffer, ...newMsgs];

    if (updatedBuffer.length > MAX_BUFFER_SIZE) {
      console.warn("Buffer quá tải, đang cắt bớt dữ liệu cũ...");
      updatedBuffer = updatedBuffer.slice(-MAX_BUFFER_SIZE);
    }

    localStorage.setItem("ai_pending_buffer", JSON.stringify(updatedBuffer));
    return updatedBuffer;
  };

  // Hàm kiểm tra và kích hoạt tóm tắt tự động
  const checkAndSummarizeBuffer = async (currentBuffer) => {
    if (currentBuffer.length >= BUFFER_TRIGGER_SIZE) {
      console.log("Buffer đạt ngưỡng, kích hoạt tóm tắt & dọn dẹp...");
      try {
        const newSummary = await summarizeChatHistory(
          chatSummary,
          currentBuffer
        );
        setChatSummary(newSummary);
        localStorage.setItem("ai_chat_summary", newSummary);
        localStorage.removeItem("ai_pending_buffer");
        console.log("Auto summarize done & Buffer cleared.");
      } catch (err) {
        console.error("Lỗi tóm tắt ngầm:", err);
      }
    }
  };

  // Hàm force summarize (dùng khi clear screen)
  const forceSummarizeBuffer = async () => {
    const pendingJson = localStorage.getItem("ai_pending_buffer");
    if (pendingJson) {
      try {
        const pendingMessages = JSON.parse(pendingJson);
        if (pendingMessages.length > 0) {
          const newSummary = await summarizeChatHistory(
            chatSummary,
            pendingMessages
          );
          setChatSummary(newSummary);
          localStorage.setItem("ai_chat_summary", newSummary);
        }
      } catch (e) {
        console.warn("Lỗi force summarize:", e);
      }
      localStorage.removeItem("ai_pending_buffer");
    }
  };

  return {
    chatSummary,
    setChatSummary,
    appendToPendingBuffer,
    checkAndSummarizeBuffer,
    forceSummarizeBuffer,
  };
};
