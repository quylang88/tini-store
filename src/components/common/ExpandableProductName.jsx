import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ExpandableProductName
 *
 * Component hiển thị tên sản phẩm có thể quá dài.
 * Mặc định sẽ hiển thị dạng cắt gọn (hoặc dùng line-clamp),
 * và mở rộng để hiện toàn bộ tên khi chạm vào.
 *
 * Sử dụng AnimatePresence để chuyển đổi mượt mà khi thay đổi kích thước nội dung.
 *
 * Props:
 * - name: string (Tên đầy đủ của sản phẩm)
 * - limit: number (Giới hạn ký tự để cắt gọn, mặc định: 25)
 * - className: string (Các class CSS bổ sung)
 * - children: ReactNode (Nội dung phụ cần ẩn khi mở rộng, ví dụ: giá/tồn kho)
 */
const ExpandableProductName = ({
  name,
  limit = 25,
  className = "",
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = name.length > limit;

  // Sử dụng logic cắt chuỗi nội bộ nếu cần,
  // nhưng đối với chức năng "chạm để mở rộng", ta thường chuyển đổi giữa text đầy đủ và text rút gọn.
  // Ta cũng có thể dùng CSS line-clamp để cắt gọn hiển thị, nhưng ở đây ta dùng logic cắt chuỗi
  // theo yêu cầu của user là "ẩn bớt rồi thay bằng '...'".

  const displayText =
    !isExpanded && isLong ? name.slice(0, limit) + "..." : name;

  const handleToggle = () => {
    if (isLong) {
      setIsExpanded(!isExpanded);
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
        className={!isExpanded ? "truncate" : "break-words"}
      >
        {displayText}
      </motion.div>

      {/* Khi mở rộng, ta có thể muốn ẩn các chi tiết phụ (được truyền qua children)
          để dành chỗ, hoặc giữ nguyên chúng. Memory có nhắc đến "tùy chọn ẩn chi tiết phụ".
          Ta sẽ triển khai hành vi đó: ẩn children khi expanded. */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
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
