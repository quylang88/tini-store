import { useEffect, useState } from 'react';

// Hook giữ modal ở lại trong DOM một chút để chạy animation đóng trước khi unmount.
const useModalPresence = (open, duration = 280) => {
  const [isMounted, setIsMounted] = useState(open);
  const [animationState, setAnimationState] = useState(open ? 'enter' : 'exit');

  useEffect(() => {
    if (open) {
      // Khi mở modal, mount ngay và bật trạng thái enter để animation xuất hiện mượt.
      setIsMounted(true);
      requestAnimationFrame(() => setAnimationState('enter'));
      return undefined;
    }

    if (isMounted) {
      // Khi đóng modal, đổi trạng thái exit và chờ animation xong mới unmount.
      setAnimationState('exit');
      const timeoutId = setTimeout(() => setIsMounted(false), duration);
      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [open, duration, isMounted]);

  return { isMounted, animationState };
};

export default useModalPresence;
