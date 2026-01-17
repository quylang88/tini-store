import React, { useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";
import SheetModal from "../modals/SheetModal";
import { formatNumber } from "../../utils/helpers";
import RankBadge from "./RankBadge";
import useModalCache from "../../hooks/useModalCache";
import Button from "../common/Button";

const toneMap = {
  profit: {
    title: "text-rose-700",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
    value: "text-rose-600",
  },
  quantity: {
    title: "text-amber-800",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    value: "text-amber-700",
  },
};

// Modal hiển thị đầy đủ danh sách top kèm ảnh và số liệu chi tiết.
// View Only -> Không có X, có nút Đóng cuối.
const TopListModal = ({ open, onClose, title, items, mode }) => {
  // Gom nhóm dữ liệu cần cache
  const dataToCache = useMemo(
    () => ({ title, items, mode }),
    [title, items, mode]
  );

  // Cache data để giữ nội dung cũ khi modal đang đóng (open=false nhưng chưa unmount xong)
  const cachedData = useModalCache(dataToCache, open);

  // Nếu chưa có dữ liệu thì return null
  if (!cachedData) return null;

  const tone = toneMap[cachedData.mode] || toneMap.profit;
  const valueLabel = cachedData.mode === "quantity" ? "Số lượng" : "Lợi nhuận";

  // Nút đóng ở dưới cùng. Nếu là profit (Rose) thì override style của sheetClose (Amber)
  const isProfit = cachedData.mode === "profit";
  const footer = (
    <Button
      variant="sheetClose"
      size="sm"
      onClick={onClose}
      className={
        isProfit
          ? "border-rose-300 bg-rose-100 text-rose-900 active:border-rose-400 active:bg-rose-200"
          : ""
      }
    >
      Đóng
    </Button>
  );

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      footer={footer}
      showCloseIcon={false} // Tắt nút X
    >
      <div className="flex flex-col space-y-4 pt-3">
        <div
          className={`border-b ${
            isProfit ? "border-rose-100" : "border-amber-100"
          } pb-4`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-bold uppercase ${tone.title}`}>
              {cachedData.title}
            </h3>
            <span
              className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${tone.badge}`}
            >
              {cachedData.items.length} sản phẩm
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {cachedData.items.map((item, index) => (
            <div key={item.id || item.name} className="flex items-center gap-3">
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
                <div className={`text-xs ${tone.value}`}>
                  {valueLabel}:{" "}
                  {cachedData.mode === "quantity"
                    ? item.quantity
                    : `${formatNumber(item.profit)}đ`}
                </div>
              </div>
            </div>
          ))}
          {cachedData.items.length === 0 && (
            <div className="text-center text-sm text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    </SheetModal>
  );
};

export default TopListModal;
