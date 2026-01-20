import { useRef, useEffect, useCallback } from "react";

const useLongPress = (
  callback,
  {
    speed = 100, // Tốc độ cơ bản (ms giữa các lần gọi)
    delay = 500, // Độ trễ ban đầu trước khi bắt đầu lặp lại
    enabled = true,
    accelerate = false, // Bật chế độ tăng tốc
    maxSpeed = 30, // Tốc độ nhanh nhất (ms tối thiểu)
    accelerationStep = 0.8, // Nhân khoảng thời gian với hệ số này
  } = {},
) => {
  const timeoutRef = useRef(null);
  const isPressingRef = useRef(false);
  const currentSpeedRef = useRef(speed);
  const loopRef = useRef(null);

  // Hàm hỗ trợ chạy vòng lặp với tốc độ động
  const loop = useCallback(() => {
    if (!isPressingRef.current || !enabled) return;

    callback();

    if (accelerate) {
      currentSpeedRef.current = Math.max(
        currentSpeedRef.current * accelerationStep,
        maxSpeed,
      );
    }

    // Gọi loop qua ref để tránh lỗi "truy cập trước khi khai báo"
    timeoutRef.current = setTimeout(() => {
      if (loopRef.current) loopRef.current();
    }, currentSpeedRef.current);
  }, [callback, enabled, accelerate, maxSpeed, accelerationStep]);

  // Cập nhật loop ref mới nhất
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const start = useCallback(() => {
    // Lưu ý: Chúng ta không preventDefault ở đây để cho phép sự kiện click nếu cần,
    // nhưng người dùng hook này có thể muốn chặn nếu xung đột với cuộn trang.
    if (!enabled) return;
    if (isPressingRef.current) return;

    isPressingRef.current = true;
    currentSpeedRef.current = speed; // Đặt lại tốc độ

    timeoutRef.current = setTimeout(() => {
      // Bắt đầu vòng lặp
      loop();
    }, delay);
  }, [delay, enabled, speed, loop]);

  const stop = useCallback(() => {
    isPressingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stop; // Dọn dẹp
  }, [stop]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};

export default useLongPress;
