import React from "react";
import { Package } from "lucide-react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/common/Button";

// Custom theme for "Inventory Warning" (Violet tone)
const theme = {
  title: "text-violet-700",
  badge: "bg-violet-50 text-violet-600 border-violet-100",
  value: "text-violet-600",
};

// Modal displaying inventory warning products (slow moving, etc.)
const InventoryWarningModal = ({ open, onClose, products = [] }) => {
  const footer = (
    <Button
      variant="sheetClose"
      size="sm"
      onClick={onClose}
      className="!bg-violet-100 !border-violet-300 !text-violet-900 active:!bg-violet-200"
    >
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
        <div className="border-b border-violet-100 pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-bold uppercase ${theme.title}`}>
              Hàng tồn
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
              <div className="w-10 h-10 rounded-lg bg-violet-50 overflow-hidden flex-shrink-0 border border-violet-100 p-1">
                {product.image ? (
                  <img
                    src={product.image}
                    className="w-full h-full object-cover rounded-md"
                    alt={product.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-violet-300">
                    <Package size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">
                  {product.name}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-violet-500 font-medium bg-violet-50 px-1.5 py-0.5 rounded">
                        {product.daysNoSale} ngày không bán
                      </span>
                   </div>
                   <span className="text-[11px] font-medium text-gray-500">
                      Tồn: <b className="text-violet-600">{product.stock}</b>
                   </span>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-4">
              Không có sản phẩm cảnh báo
            </div>
          )}
        </div>
      </div>
    </SheetModal>
  );
};

export default InventoryWarningModal;
