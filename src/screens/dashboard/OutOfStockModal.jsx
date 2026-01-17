import React from "react";
import { ArchiveX } from "lucide-react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/common/Button";

// Custom theme for "Out of Stock" (Rose/Red alert tone)
const theme = {
  title: "text-rose-700",
  badge: "bg-rose-50 text-rose-600 border-rose-100",
  value: "text-rose-600",
};

// Modal hiển thị danh sách sản phẩm hết hàng
const OutOfStockModal = ({ open, onClose, products = [] }) => {
  // Simple caching logic to prevent content flicker on close (optional, but good practice if mirroring TopListModal)
  // Here we just use the props directly since it's a simple list.

  const footer = (
    <Button variant="sheetClose" size="sm" onClick={onClose}>
      Đóng
    </Button>
  );

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      footer={footer}
      showCloseIcon={false}
    >
      <div className="flex flex-col space-y-4 pt-3">
        {/* Header */}
        <div className="border-b border-rose-100 pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-bold uppercase ${theme.title}`}>
              Sản phẩm hết hàng
            </h3>
            <span
              className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${theme.badge}`}
            >
              {products.length} sản phẩm
            </span>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id || product.name}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-50 overflow-hidden flex-shrink-0 border border-rose-100 p-1">
                {product.image ? (
                  <img
                    src={product.image}
                    className="w-full h-full object-cover rounded-md"
                    alt={product.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-300">
                    <ArchiveX size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">
                  {product.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-rose-500 font-medium bg-rose-50 px-1.5 py-0.5 rounded">
                    Hết hàng
                  </span>
                  {product.category && (
                    <span className="text-[10px] text-gray-500">
                      {product.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-4">
              Không có sản phẩm nào hết hàng
            </div>
          )}
        </div>
      </div>
    </SheetModal>
  );
};

export default OutOfStockModal;
