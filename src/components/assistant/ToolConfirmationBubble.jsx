import React, { useState } from "react";
import {
  Check,
  X,
  Package,
  ShoppingCart,
  ArrowRight,
  Loader2,
  MapPin,
  DollarSign,
  Info,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatters/formatUtils";

const ToolConfirmationBubble = ({
  message,
  onConfirm,
  onCancel,
  theme = {},
}) => {
  const { data, status } = message;
  const { functionArgs } = data || {};
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse args safe
  const args = functionArgs || {};
  const isImport = args.action_type === "import";
  const title = isImport ? "Yêu cầu Nhập kho" : "Yêu cầu Tạo đơn";
  const icon = isImport ? (
    <Package className={`w-5 h-5 ${theme.inputIconColor || "text-gray-600"}`} />
  ) : (
    <ShoppingCart
      className={`w-5 h-5 ${theme.inputIconColor || "text-gray-600"}`}
    />
  );
  // Use theme colors if available, fallback to default
  const containerClass = `${theme.botStatsBg || "bg-gray-50"} border ${theme.botBubbleBorder || "border-gray-200"}`;
  const headerClass = theme.botStatsBg || "bg-gray-100/50";

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm(message);
    setIsProcessing(false);
  };

  // Nếu đã hoàn thành hoặc huỷ, hiển thị trạng thái tĩnh
  if (status === "completed") {
    return (
      <div className="flex flex-col space-y-2 max-w-[85%] self-start text-sm text-gray-500 italic">
        <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-2xl rounded-tl-none">
          <Check className="w-4 h-4 text-green-500" />
          <span>Đã thực hiện: {title}</span>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex flex-col space-y-2 max-w-[85%] self-start text-sm text-gray-500 italic">
        <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-2xl rounded-tl-none">
          <X className="w-4 h-4 text-red-500" />
          <span>Đã huỷ yêu cầu: {title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col max-w-[90%] md:max-w-[80%] self-start rounded-2xl rounded-tl-none overflow-hidden ${containerClass} shadow-sm my-2`}
    >
      {/* Header */}
      <div
        className={`flex items-center px-4 py-3 border-b ${theme.botBubbleBorder || "border-gray-200"} ${headerClass}`}
      >
        <div className="mr-3 p-2 bg-white rounded-full shadow-sm">{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500">Misa cần mẹ xác nhận nha!</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 bg-white/60">
        {/* Product Name */}
        <div className="flex justify-between items-start">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">
            Sản phẩm
          </span>
          <span className="text-gray-800 font-medium text-right">
            {args.product_name}
          </span>
        </div>

        {/* Quantity */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">
            Số lượng
          </span>
          <span className="text-gray-900 font-bold text-lg">
            x {args.quantity}
          </span>
        </div>

        {/* Customer Info (Export Only) */}
        {!isImport && (args.customer_name || args.customer_address) && (
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">
              Khách hàng
            </span>
            <div className="text-right">
              <div className="text-sm text-gray-900 font-medium">
                {args.customer_name || "Theo mặc định"}
              </div>
              <div className="text-xs text-gray-500">
                {args.customer_address || "Theo mặc định"}
              </div>
            </div>
          </div>
        )}

        {/* Price Info */}
        {(args.cost_price || args.selling_price) && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">
              Đơn giá
            </span>
            <div className="text-right">
              {args.cost_price && (
                <div className="text-sm text-gray-800">
                  Vốn: {formatCurrency(args.cost_price)}{" "}
                  {args.cost_currency === "JPY" ? "(JPY)" : ""}
                </div>
              )}
              {args.selling_price && (
                <div
                  className={`text-sm font-medium ${theme.botPriceText || "text-blue-600"}`}
                >
                  Bán: {formatCurrency(args.selling_price)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warehouse */}
        {args.warehouse_key && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">
              Kho
            </span>
            <div className="flex items-center text-gray-700 text-sm">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{args.warehouse_key}</span>
            </div>
          </div>
        )}

        {/* Note */}
        {args.note && (
          <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic">
            "{args.note}"
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex p-2 gap-2 bg-white border-t border-gray-100">
        <button
          onClick={() => onCancel(message)}
          disabled={isProcessing}
          className="flex-1 py-2 px-4 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors"
        >
          Huỷ bỏ
        </button>
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className={`flex-1 py-2 px-4 rounded-xl text-white font-medium text-sm shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95
            ${isProcessing ? "opacity-70 cursor-wait" : ""}
            ${theme.sendButtonBg || "bg-blue-500"}
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Xác nhận</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ToolConfirmationBubble;
