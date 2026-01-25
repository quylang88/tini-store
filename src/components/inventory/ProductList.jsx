import React, { memo } from "react";
import { AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import ProductListItem from "./ProductListItem";

// ⚡ Bolt Optimization: Sử dụng React.memo để ngăn chặn việc render lại không cần thiết
// khi component cha (Inventory) cập nhật state không liên quan (như formData hoặc vị trí cuộn).
// Vì filteredProducts là ổn định (thông qua useProductFilterSort), việc này giúp tránh chạy lại map()
// và so sánh lại danh sách mỗi khi gõ phím trong modal hoặc cuộn trang.
const ProductList = memo(
  ({
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
         Tối ưu hóa danh sách: Sử dụng ProductListItem đã được memoized.
         Điều này đảm bảo rằng chỉ những item thực sự thay đổi mới bị render lại,
         giúp scroll mượt mà hơn trên các thiết bị yếu.
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
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
            <Package size={48} strokeWidth={1.5} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">Không có sản phẩm nào</p>
          </div>
        )}
      </div>
    );
  },
);

ProductList.displayName = "ProductList";

export default ProductList;
