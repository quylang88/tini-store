import React, { useState } from "react";

/**
 * ExpandableProductName
 *
 * Component hiển thị tên sản phẩm có thể quá dài.
 * Mặc định sẽ hiển thị dạng line-clamp (1 dòng),
 * và mở rộng để hiện toàn bộ tên khi chạm vào.
 *
 * FIX: Sử dụng style line-clamp thay vì class 'truncate' để tránh hiện tượng khựng
 * do thay đổi thuộc tính white-space (nowrap -> normal).
 *
 * OPTIMIZATION: Loại bỏ framer-motion để giảm overhead render trong danh sách dài.
 * Sử dụng CSS transition và line-clamp.
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
      <div
        className={`break-words ${
          !isExpanded ? "line-clamp-1" : ""
        }`}
      >
        {name}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out origin-top ${
          !isExpanded
            ? "opacity-100 max-h-20 scale-y-100 mt-0.5"
            : "opacity-0 max-h-0 scale-y-0 mt-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default ExpandableProductName;
