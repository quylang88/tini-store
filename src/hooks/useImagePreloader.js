import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (!shouldLoad) return;

    const img = new Image();
    img.src = imageSrc;

    const onLoad = () => {
      setIsLoaded(true);
    };

    img.onload = onLoad;
    img.onerror = onLoad; // Tiếp tục ngay cả khi ảnh lỗi để không chặn người dùng

    // Fallback nếu ảnh đã có trong cache
    if (img.complete) onLoad();

    // Timeout hiển thị cảnh báo nếu mạng chậm (5 giây)
    const timeoutId = setTimeout(() => {
      setShowWarning(true);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [imageSrc, shouldLoad]);

  const handleForceContinue = () => {
    setIsLoaded(true);
  };

  return { isLoaded, showWarning, handleForceContinue };
};

export default useImagePreloader;
