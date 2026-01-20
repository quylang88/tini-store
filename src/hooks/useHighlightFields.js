import { useState, useCallback } from 'react';

const useHighlightFields = () => {
  const [highlightedFields, setHighlightedFields] = useState(new Set());

  const triggerHighlights = useCallback((fields) => {
    if (Array.isArray(fields) && fields.length > 0) {
      setHighlightedFields(new Set(fields));
    }
  }, []);

  const clearHighlight = useCallback((field) => {
    setHighlightedFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const isHighlighted = useCallback((field) => {
    return highlightedFields.has(field);
  }, [highlightedFields]);

  // Hàm hỗ trợ lấy prop onBlur cho input
  // Cách dùng: {...getHighlightProps('tên_trường', giá_trị_hiện_tại)}
  const getHighlightProps = useCallback((field, value) => {
    return {
      onBlur: () => {
        // Chỉ bỏ highlight nếu đã có giá trị (hợp lệ)
        if (value && String(value).trim() !== '') {
          clearHighlight(field);
        }
      },
    };
  }, [clearHighlight]);

  // Updated style: Red border + Light pink background.
  // Removed ring to avoid "square" look and potential layout shifts/clipping.
  return {
    highlightedFields,
    triggerHighlights,
    clearHighlight,
    isHighlighted,
    getHighlightProps,
    highlightClass: " !border-rose-600 !bg-rose-50 transition-colors duration-200 "
  };
};

export default useHighlightFields;
