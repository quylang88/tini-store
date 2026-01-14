import { useEffect, useState } from 'react';

// Hook nhỏ để tạo key + class animation khi filter thay đổi.
const useFilterTransition = (dependencies = []) => {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // Mỗi lần filter đổi thì tăng key để list remount -> chạy lại animation.
    setAnimationKey((prev) => prev + 1);
  }, dependencies);

  return {
    animationKey,
    animationClass: 'filter-transition',
  };
};

export default useFilterTransition;
