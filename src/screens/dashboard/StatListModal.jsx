import React, { useMemo } from "react";
import { Package, ArchiveX, Image as ImageIcon } from "lucide-react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/common/Button";
import { formatNumber } from "../../utils/helpers";
import RankBadge from "../../components/stats/RankBadge";
import useModalCache from "../../hooks/useModalCache";

const themeMap = {
  profit: {
    title: "text-rose-700",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
    value: "text-rose-600",
    border: "border-rose-100",
  },
  quantity: {
    title: "text-amber-800",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    value: "text-amber-700",
    border: "border-amber-100",
  },
  warning: {
    title: "text-violet-700",
    badge: "bg-violet-50 text-violet-600 border-violet-100",
    value: "text-violet-600",
    border: "border-violet-100",
  },
  out_of_stock: {
    title: "text-slate-700",
    badge: "bg-teal-50 text-slate-600 border-slate-100",
    value: "text-slate-600",
    border: "border-slate-100",
  },
};

const defaultTitles = {
  profit: "Top lợi nhuận",
  quantity: "Top số lượng",
  warning: "Hàng tồn",
  out_of_stock: "Sản phẩm hết hàng",
};

const StatListModal = ({
  open,
  onClose,
  title,
  items = [],
  type = "profit",
}) => {
  // Use useModalCache to prevent flicker when closing
  // Cache the data that affects rendering
  const dataToCache = useMemo(
    () => ({ title, items, type }),
    [title, items, type],
  );
  const cachedData = useModalCache(dataToCache, open);

  if (!cachedData) return null;

  const {
    title: cachedTitle,
    items: cachedItems,
    type: cachedType,
  } = cachedData;
  const theme = themeMap[cachedType] || themeMap.profit;
  const displayTitle = cachedTitle || defaultTitles[cachedType];

  // Determine footer button style
  let footerButtonClass = "";
  if (cachedType === "quantity") {
    footerButtonClass =
      "!bg-amber-100 !border-amber-300 !text-amber-900 active:!bg-amber-200";
  } else if (cachedType === "warning") {
    footerButtonClass =
      "!bg-violet-100 !border-violet-300 !text-violet-900 active:!bg-violet-200";
  } else if (cachedType === "out_of_stock") {
    footerButtonClass =
      "!bg-slate-100 !border-slate-300 !text-slate-900 active:!bg-slate-200";
  }

  const footer = (
    <Button
      variant="sheetClose"
      size="sm"
      onClick={onClose}
      className={footerButtonClass}
    >
      Đóng
    </Button>
  );

  const renderItemContent = (item, index) => {
    switch (cachedType) {
      case "profit":
      case "quantity":
        return (
          <>
            <RankBadge rank={index + 1} />
            <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-100">
              {item.image ? (
                <img
                  src={item.image}
                  className="w-full h-full object-cover"
                  alt={item.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon size={16} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">
                {item.name}
              </div>
              <div className={`text-xs ${theme.value}`}>
                {cachedType === "quantity"
                  ? `Số lượng: ${item.quantity}`
                  : `Lợi nhuận: ${formatNumber(item.profit)}đ`}
              </div>
            </div>
          </>
        );
      case "warning":
        return (
          <>
            <div className="w-10 h-10 rounded-lg bg-violet-50 overflow-hidden flex-shrink-0 border border-violet-100 p-1">
              {item.image ? (
                <img
                  src={item.image}
                  className="w-full h-full object-cover rounded-md"
                  alt={item.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-violet-300">
                  <Package size={16} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">
                {item.name}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-violet-500 font-medium bg-violet-50 px-1.5 py-0.5 rounded">
                    {item.daysNoSale} ngày không bán
                  </span>
                </div>
                <span className="text-[11px] font-medium text-gray-500">
                  Tồn: <b className="text-violet-600">{item.stock}</b>
                </span>
              </div>
            </div>
          </>
        );
      case "out_of_stock":
        return (
          <>
            <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-200 p-1">
              {item.image ? (
                <img
                  src={item.image}
                  className="w-full h-full object-cover rounded-md"
                  alt={item.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ArchiveX size={16} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">
                {item.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-rose-600 font-medium bg-rose-50 px-1.5 py-0.5 rounded">
                  Hết hàng
                </span>
                {item.category && (
                  <span className="text-[10px] text-gray-500">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const getEmptyMessage = () => {
    if (cachedType === "warning") return "Không có sản phẩm cảnh báo";
    if (cachedType === "out_of_stock") return "Không có sản phẩm nào hết hàng";
    return "Chưa có dữ liệu";
  };

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      footer={footer}
      showCloseIcon={false}
    >
      <div className="flex flex-col space-y-4 pt-3">
        <div className={`border-b ${theme.border} pb-4`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-bold uppercase ${theme.title}`}>
              {displayTitle}
            </h3>
            <span
              className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${theme.badge}`}
            >
              {cachedItems.length} sản phẩm
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {cachedItems.map((item, index) => (
            <div key={item.id || item.name} className="flex items-center gap-3">
              {renderItemContent(item, index)}
            </div>
          ))}

          {cachedItems.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-4">
              {getEmptyMessage()}
            </div>
          )}
        </div>
      </div>
    </SheetModal>
  );
};

export default StatListModal;
