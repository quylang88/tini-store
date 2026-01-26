import { useState, useEffect } from "react";
import { summarizeChatHistory } from "../../services/aiAssistantService";

// Cấu hình an toàn
const MAX_BUFFER_SIZE = 50; // Tối đa 50 tin nhắn trong buffer
const BUFFER_TRIGGER_SIZE = 20; // Đủ 20 tin nhắn thì tóm tắt

export const useAssistantMemory = ({ chatSummary, setChatSummary }) => {
  // Hook này giờ đây nhận state từ bên ngoài (App.jsx -> Assistant.jsx -> ...)
  // Không còn quản lý localStorage cho chatSummary nữa (để App.jsx lo).
  // Tuy nhiên, pending buffer vẫn giữ ở localStorage vì nó là dữ liệu tạm thời/nhỏ.

  const [isSummarizing, setIsSummarizing] = useState(false);

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
            `Phát hiện ${pendingMessages.length} tin nhắn tồn đọng. Đang dọn dẹp...`,
          );

          setIsSummarizing(true);
          // Sử dụng chatSummary từ props
          const currentMem = chatSummary || "";
          const newSummary = await summarizeChatHistory(
            currentMem,
            pendingMessages,
          );

          setChatSummary(newSummary);
          // Lưu xuống DB do App.jsx handle useEffect([chatSummary])
          localStorage.removeItem("ai_pending_buffer");
          console.log("Đã dọn dẹp bộ nhớ đệm thành công!");
        } catch (e) {
          console.error("Lỗi xử lý buffer, tiến hành xóa bắt buộc:", e);
          localStorage.removeItem("ai_pending_buffer");
        } finally {
          setIsSummarizing(false);
        }
      }
    };
    // Chạy 1 lần khi mount, nhưng cần chatSummary để merge
    // Nếu chatSummary chưa load xong (từ IDB), có thể chạy sai?
    // Nhưng Assistant chỉ được render khi App loaded.
    processPendingBuffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hàm thêm tin nhắn vào buffer
  const appendToPendingBuffer = (newMsgs) => {
    let currentBuffer = [];
    try {
      currentBuffer = JSON.parse(
        localStorage.getItem("ai_pending_buffer") || "[]",
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
      setIsSummarizing(true);
      try {
        const newSummary = await summarizeChatHistory(
          chatSummary,
          currentBuffer,
        );
        setChatSummary(newSummary);
        localStorage.removeItem("ai_pending_buffer");
        console.log("Auto summarize done & Buffer cleared.");
      } catch (err) {
        console.error("Lỗi tóm tắt ngầm:", err);
      } finally {
        setIsSummarizing(false);
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
          setIsSummarizing(true);
          const newSummary = await summarizeChatHistory(
            chatSummary,
            pendingMessages,
          );
          setChatSummary(newSummary);
        }
      } catch (e) {
        console.warn("Lỗi force summarize:", e);
      } finally {
        setIsSummarizing(false);
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
    isSummarizing,
  };
};
