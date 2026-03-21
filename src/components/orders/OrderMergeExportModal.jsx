import React, { useMemo, useState } from "react";
import { FileDown, Image as ImageIcon, Printer } from "lucide-react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/button/Button";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import {
  exportOrdersToHTML,
  exportOrdersToImages,
} from "../../utils/file/fileUtils";
import { buildOrdersExportData } from "../../utils/file/orderExportUtils";

const OrderMergeExportModal = ({ open, orders, products, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useMemo(
    () => buildOrdersExportData(orders, products),
    [orders, products],
  );

  const handleExport = async (format) => {
    if (!exportData) return;

    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      if (format === "image") {
        await exportOrdersToImages(orders, products);
      } else {
        await exportOrdersToHTML(orders, products, format);
      }
      onClose?.();
    } catch (error) {
      console.error("Lỗi xuất đơn gộp:", error);
      alert("Có lỗi khi xuất đơn gộp");
    } finally {
      setIsExporting(false);
    }
  };

  const footer = (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="softDanger"
          size="sm"
          onClick={() => handleExport("receipt")}
          className="h-auto py-2 hover:bg-rose-100 text-rose-800 border-rose-300"
        >
          <div className="flex flex-col items-center gap-1">
            <Printer size={18} /> <span className="text-[10px]">K80</span>
          </div>
        </Button>
        <Button
          variant="softDanger"
          size="sm"
          onClick={() => handleExport("a4")}
          className="h-auto py-2 hover:bg-rose-100 text-rose-800 border-rose-300"
        >
          <div className="flex flex-col items-center gap-1">
            <FileDown size={18} /> <span className="text-[10px]">A4</span>
          </div>
        </Button>
        <Button
          variant="softDanger"
          size="sm"
          onClick={() => handleExport("image")}
          className="h-auto py-2 hover:bg-rose-100 text-rose-800 border-rose-300"
        >
          <div className="flex flex-col items-center gap-1">
            <ImageIcon size={18} /> <span className="text-[10px]">Ảnh</span>
          </div>
        </Button>
      </div>
      <Button variant="danger" size="sm" onClick={onClose} className="w-full">
        Đóng
      </Button>
    </div>
  );

  return (
    <SheetModal
      open={open}
      onClose={isExporting ? () => {} : onClose}
      title="Xuất đơn gộp"
      footer={footer}
      showCloseIcon={false}
    >
      <div className="relative space-y-3">
        {isExporting && <LoadingOverlay text="Đang tạo đơn gộp..." />}

        {exportData ? (
          <>
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
              <div className="text-sm font-semibold text-rose-800">
                {exportData.orderCount} đơn chưa thanh toán
              </div>
              <div className="mt-1 text-sm text-gray-700">
                {exportData.partyLabel}: {exportData.partyValue}
              </div>
              {exportData.orderType === "delivery" && (
                <div className="mt-1 text-xs text-gray-500">
                  Địa chỉ: {exportData.customerAddress || "-"}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Mã đơn đã chọn
              </div>
              <div className="mt-2 text-sm leading-6 text-gray-700">
                {exportData.orderReferencesText}
              </div>
            </div>

            {exportData.noteEntries.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Có nhiều ghi chú đơn
                </div>
                <div className="mt-2 text-sm leading-6 text-amber-900">
                  File xuất sẽ tự tách ghi chú theo từng mã đơn.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500">Chưa có đơn để xuất.</div>
        )}
      </div>
    </SheetModal>
  );
};

export default OrderMergeExportModal;
