import React from "react";

const OrderCreateHeader = ({ orderBeingEdited }) => {
  return (
    <div className="bg-amber-50/90 shadow-sm backdrop-blur">
      {/* Hàng 1: Tiêu đề */}
      <div className="p-3 border-b border-amber-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-amber-800">
            {orderBeingEdited
              ? `Sửa đơn #${
                  orderBeingEdited.orderNumber ?? orderBeingEdited.id.slice(-4)
                }`
              : "Tạo đơn hàng"}
          </h2>
          {orderBeingEdited && (
            <div className="text-xs text-amber-500">
              Chỉnh sửa số lượng sản phẩm trong đơn hàng
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCreateHeader;
