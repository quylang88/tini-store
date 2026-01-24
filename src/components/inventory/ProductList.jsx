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
        <div className="text-center text-gray-400 mt-10 text-sm">
          Không có sản phẩm nào
        </div>
      )}
    </div>
  );
};

export default ProductList;
