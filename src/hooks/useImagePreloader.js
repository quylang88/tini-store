import { useState, useEffect, useRef } from "react";

/**
 * Hook để preload hình ảnh và xử lý trạng thái chờ/cảnh báo mạng chậm.
 *
 * @param {string} imageSrc - Đường dẫn ảnh cần preload.
 * @param {boolean} [shouldLoad=true] - Có thực hiện load hay không (dùng cho trường hợp có điều kiện phụ).
 * @returns {Object} { isLoaded, showWarning, handleForceContinue }
 */
const useImagePreloader = (imageSrc, shouldLoad = true) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const warningTriggeredRef = useRef(false);

  useEffect(() => {
    if (!shouldLoad) return;

    // Kiểm tra mạng ngay lập tức
    if (!navigator.onLine) {
      setShowWarning(true);
      warningTriggeredRef.current = true;
    }

    const img = new Image();
    img.src = imageSrc;

    const onLoad = () => {
      // Nếu đã hiện cảnh báo thì không tự động vào nữa, bắt buộc user ấn nút
      if (!warningTriggeredRef.current) {
        setIsLoaded(true);
      }
    };

    img.onload = onLoad;
    img.onerror = onLoad; // Tiếp tục xử lý (có thể sẽ hiện warning nếu timeout, hoặc vào luôn nếu nhanh)

    // Fallback nếu ảnh đã có trong cache
    if (img.complete) onLoad();

    // Timeout hiển thị cảnh báo nếu mạng chậm (7 giây)
    const timeoutId = setTimeout(() => {
      // Chỉ hiện warning nếu chưa load xong
      setIsLoaded((currentLoaded) => {
        if (!currentLoaded) {
          setShowWarning(true);
          warningTriggeredRef.current = true;
        }
        return currentLoaded;
      });
    }, 7000);

    return () => clearTimeout(timeoutId);
  }, [imageSrc, shouldLoad]);

  const handleForceContinue = () => {
    setIsLoaded(true);
  };

  return { isLoaded, showWarning, handleForceContinue };
};

export default useImagePreloader;
