import React from "react";
import { AnimatePresence } from "framer-motion";
import ProductListItem from "./ProductListItem";

const ProductList = ({
  products,
  onDelete,
  onOpenDetail,
  activeCategory,
  activeWarehouse,
  onEditBasicInfo,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-24">
      {/* 
        Các sửa đổi:
        1. Sử dụng 'flex flex-col gap-3' thay vì 'space-y-3' để tránh lỗi nhảy layout do
           selector margin của 'space-y' tương tác với các phần tử position absolute (đang exit).
        2. mode="popLayout": Đảm bảo các item đang exit được loại bỏ khỏi luồng layout ngay lập tức (position: absolute).
        3. Empty State được render BÊN NGOÀI AnimatePresence như một thẻ div tĩnh.
           Kết hợp với 'popLayout', điều này đảm bảo text xuất hiện ngay lập tức ở đúng vị trí
           mà không bị đẩy bởi các item đang exit hoặc tự animate.
      */}
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            onDelete={onDelete}
            onOpenDetail={onOpenDetail}
            activeCategory={activeCategory}
            activeWarehouse={activeWarehouse}
            onEditBasicInfo={onEditBasicInfo}
          />
        ))}
      </AnimatePresence>

      {/* 
        Trạng thái rỗng hoàn toàn tĩnh BÊN NGOÀI AnimatePresence.
        Không cần props animation hay key.
      */}
      {products.length === 0 && (
        <div className="text-center text-gray-400 mt-10 text-sm">
          Không có sản phẩm nào
        </div>
      )}
    </div>
  );
};

export default ProductList;
