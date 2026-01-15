import React from "react";
import { formatNumber } from "../../../utils/helpers";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";

const OrderCreateFooter = ({
  totalAmount,
  isFooterVisible,
  handleCancelDraft,
  handleOpenReview,
  orderBeingEdited,
}) => {
  return (
    <AnimatePresence>
      {totalAmount > 0 && isFooterVisible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 p-4 pb-[calc(env(safe-area-inset-bottom)+28px)] z-[60] shadow-[0_-4px_15px_rgba(0,0,0,0.1)] backdrop-blur"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 font-medium text-sm">
              Tổng đơn:
            </span>
            <span className="text-2xl font-bold text-rose-600">
              {formatNumber(totalAmount)}đ
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancelDraft}
              className="flex-1 bg-white text-amber-700 py-3.5 rounded-xl font-bold border border-amber-200 shadow-sm active:scale-95 transition"
            >
              {orderBeingEdited ? "Huỷ sửa" : "Huỷ đơn"}
            </button>
            <button
              onClick={handleOpenReview}
              className="flex-1 bg-rose-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingCart size={20} />{" "}
              {orderBeingEdited ? "Cập nhật đơn" : "Lên đơn"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderCreateFooter;
