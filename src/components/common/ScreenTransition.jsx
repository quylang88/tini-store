import React from 'react';

// Wrapper nhỏ để áp hiệu ứng chuyển cảnh khi mount màn hình, tránh lặp class ở nhiều nơi.
const ScreenTransition = ({ children, className = '' }) => (
  <div className={`screen-transition ${className}`}>
    {children}
  </div>
);

export default ScreenTransition;
