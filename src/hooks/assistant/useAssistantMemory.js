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
          // Trong trường hợp lỗi, có thể chọn giữ lại buffer hoặc xoá.
          // Ở đây ta giữ nguyên để lần sau thử lại, hoặc user có thể xoá tay nếu cần.
          // Tuy nhiên, logic cũ là xoá bắt buộc để tránh kẹt loop.
          // setPendingBuffer([]);
        } finally {
          setIsSummarizing(false);
        }
      }
    };

    // Chỉ chạy logic này ONE-TIME khi component mount VÀ dữ liệu đã ready.
    // Tuy nhiên, vì pendingBuffer được quản lý bởi App và truyền xuống,
    // useEffect này có thể chạy mỗi khi pendingBuffer thay đổi.
    // Ta cần cơ chế để chỉ chạy "lần đầu tiên" khi app khởi động.
    // NHƯNG: Logic cũ của `useAssistantMemory` chạy trong `Assistant.jsx`.
    // Khi `Assistant` mount, nó check localStorage.
    // Giờ đây `pendingBuffer` là state. Nếu ta muốn giữ behavior "mở App -> check buffer -> summarize",
    // thì ta nên check ngay khi data load xong ở App.jsx hoặc ở đây.

    // Ở đây ta sẽ check: nếu pendingBuffer có nhiều tin nhắn cũ (do load từ DB), ta summarize.
    // Để tránh loop vô tận khi đang chat (khi đó pendingBuffer cũng có data),
    // ta có thể dựa vào một flag hoặc logic nào đó?
    // Logic cũ: `useEffect([], ...)` -> Chỉ chạy khi mount.
    // OK, ta giữ `[]` nhưng cần đảm bảo `pendingBuffer` đã có giá trị ban đầu từ prop.
    // Do đó, ta cần thêm `pendingBuffer` vào deps nhưng phải chặn chạy lại liên tục.

    // Tạm thời disable auto-process on mount ở level này, vì App.jsx load data async.
    // Khi Assistant mount, pendingBuffer đã là mới nhất.
    // Nếu App vừa load xong và Assistant chưa mount -> không chạy.
    // Nếu user mở tab Assistant -> mount -> chạy check.

    // Vấn đề: `pendingBuffer` thay đổi liên tục khi chat.
    // Ta chỉ muốn process những gì "tồn đọng" từ phiên trước.
    // Nhưng phiên trước = những gì trong DB.
    // Vậy logic check length > 0 là OK, nhưng phải cẩn thận khi user đang chat.

    // Giải pháp: Chỉ check nếu buffer ĐÃ đầy quá ngưỡng ngay lúc mount?
    // Hoặc giữ nguyên logic cũ: Check localStorage (giờ là prop).
    // Nếu ta để `useEffect` phụ thuộc `[]`, nó chỉ chạy 1 lần khi Assistant mount.
    // Lúc đó `pendingBuffer` là giá trị khởi tạo (từ DB).
    if (pendingBuffer.length > 0) {
       // Nhưng ta không thể gọi async trong useEffect [] nếu pendingBuffer chưa kịp update từ prop (nếu prop update trễ).
       // Tuy nhiên, App.jsx chỉ render Assistant khi `isDataLoaded` = true.
       // Nên `pendingBuffer` prop passed in sẽ là data từ DB.
       processPendingBuffer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy khi mount component Assistant

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
