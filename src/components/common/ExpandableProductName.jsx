import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ExpandableProductName
 *
 * Component hiển thị tên sản phẩm có thể quá dài.
 * Mặc định sẽ hiển thị dạng line-clamp (1 dòng),
 * và mở rộng để hiện toàn bộ tên khi chạm vào.
 *
 * Note: Sử dụng style line-clamp thay vì class 'truncate' để tránh hiện tượng khựng
 * do thay đổi thuộc tính white-space (nowrap -> normal).
 *
 * Props:
 * - name: string (Tên đầy đủ của sản phẩm)
 * - limit: number (Giới hạn ký tự - dùng để tính toán sơ bộ, logic chính dựa vào css)
 * - className: string (Các class CSS bổ sung)
 * - children: ReactNode (Nội dung phụ cần ẩn khi mở rộng, ví dụ: giá/tồn kho)
 * - onExpandChange: function (Callback khi trạng thái mở rộng thay đổi)
 * - isExpanded: boolean (Controlled state)
 */
const ExpandableProductName = ({
  name,
  limit = 25,
  className = "",
  children,
  onExpandChange,
  isExpanded: controlledIsExpanded,
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded =
    controlledIsExpanded !== undefined
      ? controlledIsExpanded
      : internalIsExpanded;

  const isLong = name.length > limit;

  const handleToggle = () => {
    if (isLong) {
      const newState = !isExpanded;
      if (controlledIsExpanded === undefined) {
        setInternalIsExpanded(newState);
      }
      if (onExpandChange) {
        onExpandChange(newState);
      }
    }
  };

  return (
    <div
      onClick={handleToggle}
      className={`relative cursor-pointer transition-colors ${className}`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="break-words" // Luôn cho phép xuống dòng để tránh layout thrashing
        style={
          !isExpanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : {
                display: "block",
              }
        }
      >
        {name}
      </motion.div>

      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            layout // Thêm layout prop để đồng bộ với cha
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpandableProductName;
