import React from "react";
import SheetModal from "../../../components/modals/SheetModal";
import Button from "../../../components/common/Button";
import { formatNumber, formatInputNumber } from "../../../utils/helpers";

const OrderCreateReviewModal = ({
  isReviewOpen,
  handleCloseReview,
  orderBeingEdited,
  totalAmount,
  handleConfirmOrder,
  reviewItems,
  orderType,
  setOrderType,
  customerName,
  setCustomerName,
  customerAddress,
  setCustomerAddress,
  shippingFee,
  setShippingFee,
  orderComment,
  setOrderComment,
}) => {
  return (
    <SheetModal
      open={isReviewOpen}
      onClose={handleCloseReview}
      title={
        orderBeingEdited ? "Xác nhận cập nhật đơn" : "Xác nhận tạo đơn hàng"
      }
      showCloseIcon={true}
      footer={
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Tổng đơn</span>
            <span className="text-lg font-bold text-rose-600">
              {formatNumber(totalAmount)}đ
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCloseReview}>
              Xem lại
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmOrder}>
              {orderBeingEdited ? "Cập nhật" : "Xác nhận"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-xs text-amber-600 -mt-2 mb-2">
          Kiểm tra lại danh sách sản phẩm trước khi xác nhận.
        </div>

        <div className="space-y-3">
          {reviewItems.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm text-gray-600"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="font-semibold truncate">{item.name}</span>
                  <span className="text-xs text-gray-400">
                    x{item.quantity}
                  </span>
                </div>
              </div>
              <div className="font-semibold text-amber-700">
                {formatNumber(item.price * item.quantity)}đ
              </div>
            </div>
          ))}
          {reviewItems.length === 0 && (
            <div className="text-sm text-gray-400 text-center">
              Chưa có sản phẩm nào.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-amber-700">
            Loại đơn hàng
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOrderType("delivery")}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                orderType === "delivery"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              Gửi khách
            </button>
            <button
              type="button"
              onClick={() => setOrderType("warehouse")}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                orderType === "warehouse"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              Bán tại kho
            </button>
          </div>
        </div>

        {orderType === "delivery" ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-700">
              Thông tin khách hàng
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách hàng"
              className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Địa chỉ giao hàng"
              rows={2}
              className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <div>
              <label className="text-xs font-semibold text-amber-700">
                Phí gửi khách
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatInputNumber(shippingFee)}
                onChange={(e) => setShippingFee(e.target.value)}
                placeholder="Ví dụ: 25,000"
                className="mt-1 w-full border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {/* Bán tại kho không cần thông tin khách hàng và phí gửi */}
            Đơn bán tại kho - không cần nhập thông tin khách và phí gửi.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-amber-700">
            Ghi chú
          </label>
          <textarea
            value={orderComment}
            onChange={(e) => setOrderComment(e.target.value)}
            placeholder="Ví dụ: khách hẹn lấy vào chiều nay..."
            rows={3}
            className="w-full border border-amber-200 rounded-xl p-3 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
      </div>
    </SheetModal>
  );
};

export default OrderCreateReviewModal;
