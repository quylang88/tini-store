import { useRef, useEffect, useLayoutEffect } from "react";

export const useAutoScroll = (dependencies = []) => {
  const endRef = useRef(null);
  const isFirstRender = useRef(true);

  // Sử dụng useLayoutEffect để cuộn xuống ngay lập tức khi component được mount (trước khi vẽ lên màn hình)
  // Giúp tránh hiện tượng giật hoặc cuộn từ trên xuống khi chuyển tab
  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  useEffect(() => {
    // Bỏ qua lần chạy đầu tiên vì đã được xử lý bởi useLayoutEffect
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Cuộn mượt mà khi có thay đổi (tin nhắn mới, trạng thái typing...)
    // Thêm timeout nhỏ để đảm bảo DOM đã được cập nhật hoàn toàn (đặc biệt là layout)
    const timer = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return endRef;
};
