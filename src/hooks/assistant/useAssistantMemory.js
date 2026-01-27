import { useState, useEffect } from "react";
import { summarizeChatHistory } from "../../services/aiAssistantService";

// Cấu hình an toàn
const MAX_BUFFER_SIZE = 50; // Tối đa 50 tin nhắn trong buffer
const BUFFER_TRIGGER_SIZE = 20; // Đủ 20 tin nhắn thì tóm tắt

export const useAssistantMemory = ({
  chatSummary,
  setChatSummary,
  pendingBuffer,
  setPendingBuffer
}) => {
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Xử lý buffer tồn đọng khi khởi động (nếu có dữ liệu load từ DB)
  useEffect(() => {
    const processPendingBuffer = async () => {
      // Chỉ xử lý nếu có pendingBuffer và nó không rỗng
      // Lưu ý: pendingBuffer ở đây là giá trị tại thời điểm mount (do deps=[])
      // Điều này đúng ý đồ: Chỉ xử lý những gì tồn đọng từ phiên trước.
      if (pendingBuffer && pendingBuffer.length > 0) {
        try {
          console.log(
            `Phát hiện ${pendingBuffer.length} tin nhắn tồn đọng. Đang dọn dẹp...`,
          );

          setIsSummarizing(true);
          const currentMem = chatSummary || "";
          const newSummary = await summarizeChatHistory(
            currentMem,
            pendingBuffer,
          );

          setChatSummary(newSummary);

          // Clear buffer sau khi summarize thành công
          setPendingBuffer([]);
          console.log("Đã dọn dẹp bộ nhớ đệm thành công!");
        } catch (e) {
          console.error("Lỗi xử lý buffer:", e);
        } finally {
          setIsSummarizing(false);
        }
      }
    };

    processPendingBuffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount để xử lý dữ liệu tồn đọng

  // Hàm thêm tin nhắn vào buffer
  const appendToPendingBuffer = (newMsgs) => {
    const currentBuffer = pendingBuffer || [];
    let updatedBuffer = [...currentBuffer, ...newMsgs];

    if (updatedBuffer.length > MAX_BUFFER_SIZE) {
      console.warn("Buffer quá tải, đang cắt bớt dữ liệu cũ...");
      updatedBuffer = updatedBuffer.slice(-MAX_BUFFER_SIZE);
    }

    setPendingBuffer(updatedBuffer);
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
        setPendingBuffer([]);
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
    if (pendingBuffer && pendingBuffer.length > 0) {
      try {
        setIsSummarizing(true);
        const newSummary = await summarizeChatHistory(
          chatSummary,
          pendingBuffer,
        );
        setChatSummary(newSummary);
        setPendingBuffer([]);
      } catch (e) {
        console.warn("Lỗi force summarize:", e);
      } finally {
        setIsSummarizing(false);
      }
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
