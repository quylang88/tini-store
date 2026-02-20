import React, { useState } from "react";
import SheetModal from "../../components/modals/SheetModal";
import PaidStamp from "../common/PaidStamp";
import { formatNumber } from "../../utils/formatters/formatUtils";
import {
  getWarehouseLabel,
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import { getOrderDisplayName } from "../../utils/orders/orderUtils";
import useModalCache from "../../hooks/ui/useModalCache";
import Button from "../../components/button/Button";
import {
  exportOrderToHTML,
  shareOrDownloadFile,
} from "../../utils/file/fileUtils";
import { generateProductListImage } from "../../utils/file/imageExportUtils";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import { FileDown, Image as ImageIcon, Printer } from "lucide-react";

// OrderDetailModal: Xem chi tiết đơn hàng (Chỉ xem) -> showCloseIcon={false}
const OrderDetailModal = ({ order, products, onClose, getOrderStatusInfo }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Giữ lại dữ liệu cũ để animation đóng vẫn hiển thị nội dung
  const cachedOrder = useModalCache(order, Boolean(order));

  if (!cachedOrder) return null;

  const orderLabel = cachedOrder.orderNumber
    ? `#${cachedOrder.orderNumber}`
    : `#${cachedOrder.id.slice(-4)}`;
  const orderName = getOrderDisplayName(cachedOrder);
  const statusInfo = getOrderStatusInfo?.(cachedOrder);
  const isPaid = cachedOrder.status === "paid";
  const warehouseLabel = getWarehouseLabel(
    resolveWarehouseKey(cachedOrder.warehouse) || getDefaultWarehouse().key,
  );

  // Tính lợi nhuận ước tính (giống logic ở OrderListView)
  const estimatedProfit =
    cachedOrder.items.reduce((sum, item) => {
      const cost = item.cost || 0;
      return sum + (item.price - cost) * item.quantity;
    }, 0) - (cachedOrder.shippingFee || 0);

  // Tính tổng số lượng
  const totalQuantity = cachedOrder.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const handleExport = async (format = "receipt") => {
    setIsExporting(true);
    // Timeout nhỏ để đảm bảo UI loading kịp render trước khi hàm export nặng chạy
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      await exportOrderToHTML(cachedOrder, products, format);
    } catch (error) {
      console.error("Export error:", error);
      alert("Có lỗi khi xuất file");
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleExportImage = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      // Prepare items for export
      const exportItems = cachedOrder.items.map((item) => {
        const product = products?.find(
          (p) => p.id === item.productId || p.id === item.id,
        );
        return {
          name: product ? product.name : item.name,
          image: product ? product.image : null,
          price: item.price !== undefined ? item.price : item.sellingPrice || 0,
          quantity: item.quantity,
        };
      });

      const blob = await generateProductListImage(exportItems, {
        showTotal: true,
        title: `ĐƠN HÀNG ${orderLabel}`,
      });

      await shareOrDownloadFile(
        blob,
        `Don_hang_${cachedOrder.orderNumber || cachedOrder.id.slice(-4)}.png`,
        "image/png",
      );
    } catch (error) {
      console.error("Export error:", error);
      alert("Có lỗi khi xuất ảnh");
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const footer = showExportMenu ? (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleExport("receipt")}
          className="h-auto py-2"
        >
          <div className="flex flex-col items-center gap-1">
            <Printer size={18} /> <span className="text-[10px]">K80</span>
          </div>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleExport("a4")}
          className="h-auto py-2"
        >
          <div className="flex flex-col items-center gap-1">
            <FileDown size={18} /> <span className="text-[10px]">A4</span>
          </div>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleExportImage}
          className="h-auto py-2"
        >
          <div className="flex flex-col items-center gap-1">
            <ImageIcon size={18} /> <span className="text-[10px]">Ảnh</span>
          </div>
        </Button>
      </div>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowExportMenu(false)}
        className="w-full"
      >
        Huỷ
      </Button>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onClose}
        className="w-full"
      >
        Đóng
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowExportMenu(true)}
        className="w-full"
      >
        Xuất / Chia sẻ
      </Button>
    </div>
  );

  return (
    <SheetModal
      open={Boolean(order)} // Điều khiển đóng mở bằng prop order
      onClose={onClose}
      title={`Chi tiết đơn hàng ${orderLabel}`}
      footer={footer}
      showCloseIcon={false} // Chỉ xem
    >
      <div className="space-y-4 relative">
        <PaidStamp isPaid={isPaid} variant="detail" />

        {/* Thông tin Header */}
        <div className="border-b border-rose-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-rose-600">
              {orderName}
            </div>
            {statusInfo && !isPaid && (
              <span
                className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-semibold ${statusInfo.badgeClass}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`}
                />
                {statusInfo.label}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(cachedOrder.date).toLocaleString()}
          </div>
          {cachedOrder.comment && (
            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {cachedOrder.comment}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isExporting && <LoadingOverlay text="Đang tạo hoá đơn..." />}

        {/* Danh sách sản phẩm */}
        <div className="space-y-3">
          {cachedOrder.items.map((item, index) => {
            const product = products?.find(
              (p) => p.id === item.productId || p.id === item.id,
            );
            const displayName = product ? product.name : item.name;

            return (
              <div
                key={`${item.productId}-${index}`}
                className="flex justify-between text-sm text-gray-600"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-rose-900">
                    <span className="font-semibold truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-gray-400">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-amber-600 pl-4">
                  {formatNumber(item.price * item.quantity)}đ
                </div>
              </div>
            );
          })}
        </div>

        {/* Tổng kết */}
        <div className="border-t border-rose-100 pt-3 bg-rose-50 -mx-5 px-5 -mb-2 pb-2 mt-2 space-y-2">
          {cachedOrder.orderType !== "warehouse" && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tại kho</span>
              <span className="font-semibold text-rose-700">
                {warehouseLabel}
              </span>
            </div>
          )}
          {/* Hiển thị Tên Khách Hàng nếu có, bất kể loại đơn */}
          {cachedOrder.customerName && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Khách hàng</span>
              <span className="font-semibold text-rose-700">
                {cachedOrder.customerName}
              </span>
            </div>
          )}
          {cachedOrder.orderType === "delivery" && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Địa chỉ</span>
                <span className="font-semibold text-rose-700 text-right">
                  {cachedOrder.customerAddress || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Phí gửi khách</span>
                <span className="font-semibold text-rose-700">
                  {formatNumber(cachedOrder.shippingFee || 0)}đ
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm text-gray-500 mt-2 pt-2 border-t border-rose-200/50">
            <span className="font-medium text-rose-900">Tổng số lượng</span>
            <span className="text-lg font-bold text-rose-600">
              {totalQuantity} sp
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span className="font-medium text-rose-900">Tổng đơn</span>
            <span className="text-lg font-bold text-rose-600">
              {formatNumber(cachedOrder.total)}đ
            </span>
          </div>
          <div className="flex justify-between text-sm text-emerald-600 pt-1">
            <span className="font-medium">Lợi nhuận</span>
            <span className="font-bold">{formatNumber(estimatedProfit)}đ</span>
          </div>
        </div>
      </div>
    </SheetModal>
  );
};

export default OrderDetailModal;
