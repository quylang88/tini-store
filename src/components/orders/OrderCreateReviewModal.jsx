import React, { useState } from "react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/button/Button";
import {
  formatNumber,
  formatInputNumber,
} from "../../utils/formatters/formatUtils";
import { motion, AnimatePresence } from "framer-motion";
import useHighlightFields from "../../hooks/ui/useHighlightFields";
import ErrorModal from "../../components/modals/ErrorModal";
import CustomerAutocomplete from "./CustomerAutocomplete";
import EditPriceModal from "./EditPriceModal";

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
  customers,
  isCustomerNameTaken,
  setPriceOverrides,
}) => {
  const highlightOps = useHighlightFields();
  const [validationError, setValidationError] = useState(null);

  // Theo dõi xem người dùng có chọn khách hàng từ danh sách gợi ý không
  const [hasSelectedCustomer, setHasSelectedCustomer] = useState(false);

  // State cho modal chỉnh sửa giá
  const [editingItem, setEditingItem] = useState(null);

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name);
    // Use the latest address
    if (customer.addresses && customer.addresses.length > 0) {
      setCustomerAddress(customer.addresses[0]);
    }
    setHasSelectedCustomer(true);
  };

  const handleConfirm = () => {
    // Kiểm tra hợp lệ nếu là đơn giao hàng
    if (orderType === "delivery") {
      const missing = [];
      if (!customerName || customerName.trim() === "")
        missing.push("customerName");
      if (!customerAddress || customerAddress.trim() === "")
        missing.push("customerAddress");

      if (missing.length > 0) {
        setValidationError({
          title: "Thiếu thông tin giao hàng",
          message:
            "Vui lòng nhập đầy đủ Tên khách hàng và Địa chỉ để tiếp tục.",
        });
        highlightOps.triggerHighlights(missing);
        return;
      }
    }

    // Kiểm tra trùng tên khách hàng
    const isOriginalCustomer =
      orderBeingEdited && orderBeingEdited.customerName === customerName.trim();

    if (
      isCustomerNameTaken &&
      isCustomerNameTaken(customerName) &&
      !hasSelectedCustomer &&
      !isOriginalCustomer
    ) {
      setValidationError({
        title: "Khách hàng đã tồn tại",
        message: `Khách hàng "${customerName}" đã có trong hệ thống. Vui lòng chọn từ danh sách gợi ý để cập nhật thông tin, hoặc đổi tên khác nếu là khách mới.`,
      });
      return;
    }

    handleConfirmOrder();
  };

  const handleSavePrice = (productId, newPrice) => {
    setPriceOverrides((prev) => ({
      ...prev,
      [productId]: newPrice,
    }));
  };

  return (
    <>
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
              <Button variant="primary" size="sm" onClick={handleConfirm}>
                {orderBeingEdited ? "Cập nhật" : "Xác nhận"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-xs text-rose-600 -mt-2 mb-2">
            Kiểm tra lại danh sách sản phẩm trước khi xác nhận. Nhấn vào sản
            phẩm để điều chỉnh giá.
          </div>

          <div className="space-y-3">
            {reviewItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm text-gray-600 active:bg-gray-50 rounded-lg -mx-2 px-2 py-1 transition-colors cursor-pointer select-none"
                onClick={() => setEditingItem(item)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-rose-900">
                    <span className="font-semibold truncate">{item.name}</span>
                    <span className="text-xs text-gray-400">
                      x{item.quantity}
                    </span>
                    {item.originalPrice > item.price && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">
                        -
                        {Math.round(
                          ((item.originalPrice - item.price) /
                            item.originalPrice) *
                            100,
                        )}
                        %
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {item.originalPrice > item.price && (
                    <div className="text-xs text-gray-400 line-through">
                      {formatNumber(item.originalPrice * item.quantity)}đ
                    </div>
                  )}
                  <div className="font-semibold text-amber-600">
                    {formatNumber(item.price * item.quantity)}đ
                  </div>
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
            <label className="text-xs font-semibold text-rose-700">
              Loại đơn hàng
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  orderType === "delivery"
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                Gửi khách
              </button>
              <button
                type="button"
                onClick={() => setOrderType("warehouse")}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  orderType === "warehouse"
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                Bán tại kho
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {orderType === "delivery" ? (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs font-semibold text-rose-700">
                  Thông tin khách hàng
                </label>
                <CustomerAutocomplete
                  value={customerName}
                  onChange={(val) => {
                    setCustomerName(val);
                    setHasSelectedCustomer(false);
                  }}
                  onSelect={handleCustomerSelect}
                  customers={customers}
                  highlightProps={highlightOps.getHighlightProps(
                    "customerName",
                    customerName,
                  )}
                  error={highlightOps.isHighlighted("customerName")}
                />
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Địa chỉ giao hàng"
                  rows={2}
                  className={`w-full border border-rose-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-200 ${
                    highlightOps.isHighlighted("customerAddress")
                      ? highlightOps.highlightClass
                      : ""
                  }`}
                  {...highlightOps.getHighlightProps(
                    "customerAddress",
                    customerAddress,
                  )}
                />
                <div>
                  <label className="text-xs font-semibold text-rose-700">
                    Phí gửi khách
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputNumber(shippingFee)}
                    onChange={(e) => setShippingFee(e.target.value)}
                    placeholder="Ví dụ: 25,000"
                    className="mt-1 w-full border border-rose-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="warehouse"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs font-semibold text-rose-700">
                  Thông tin khách hàng (Tuỳ chọn)
                </label>
                <CustomerAutocomplete
                  value={customerName}
                  onChange={(val) => {
                    setCustomerName(val);
                    setHasSelectedCustomer(false);
                  }}
                  onSelect={handleCustomerSelect}
                  customers={customers}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-rose-700">
              Ghi chú
            </label>
            <textarea
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
              placeholder="Ví dụ: khách hẹn lấy vào chiều nay..."
              rows={3}
              className="w-full border border-rose-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
        </div>
      </SheetModal>

      <ErrorModal
        open={!!validationError}
        title={validationError?.title}
        message={validationError?.message}
        onClose={() => setValidationError(null)}
      />

      {editingItem && (
        <EditPriceModal
          key={editingItem.id}
          isOpen={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSavePrice}
        />
      )}
    </>
  );
};

export default OrderCreateReviewModal;
