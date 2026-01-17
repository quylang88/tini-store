import React, { useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";
import SheetModal from "../modals/SheetModal";
import Button from "../common/Button";
import RankBadge from "../stats/RankBadge";
import useModalCache from "../../hooks/useModalCache";

const THEMES = {
  rose: {
    title: "text-rose-700",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
    border: "border-rose-100",
    closeBtn: "", // default rose
  },
  amber: {
    title: "text-amber-800",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    border: "border-amber-100",
    closeBtn:
      "!border-amber-300 !bg-amber-100 !text-amber-900 active:!border-amber-400 active:!bg-amber-200",
  },
  teal: {
    title: "text-teal-700",
    badge: "bg-teal-50 text-teal-600 border-teal-100",
    border: "border-teal-100",
    closeBtn:
      "!bg-teal-100 !border-teal-300 !text-teal-900 active:!bg-teal-200",
  },
  violet: {
    title: "text-violet-700",
    badge: "bg-violet-50 text-violet-600 border-violet-100",
    border: "border-violet-100",
    closeBtn:
      "!bg-violet-100 !border-violet-300 !text-violet-900 active:!bg-violet-200",
  },
};

const StatListModal = ({
  open,
  onClose,
  title,
  items,
  color = "rose",
  renderItemContent,
  showRank = false,
  emptyText = "Chưa có dữ liệu",
}) => {
  // Cache ALL dynamic props to ensure consistency during exit animation
  const dataToCache = useMemo(
    () => ({
      title,
      items,
      color,
      renderItemContent,
      showRank,
      emptyText,
    }),
    [title, items, color, renderItemContent, showRank, emptyText]
  );

  const cachedData = useModalCache(dataToCache, open);

  if (!cachedData) return null;

  const {
    title: cachedTitle,
    items: cachedItems,
    color: cachedColor,
    renderItemContent: cachedRenderItemContent,
    showRank: cachedShowRank,
    emptyText: cachedEmptyText,
  } = cachedData;

  const theme = THEMES[cachedColor] || THEMES.rose;

  const footer = (
    <Button
      variant="sheetClose"
      size="sm"
      onClick={onClose}
      className={theme.closeBtn}
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
        <div className={`border-b ${theme.border} pb-4`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-bold uppercase ${theme.title}`}>
              {cachedTitle}
            </h3>
            <span
              className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${theme.badge}`}
            >
              {cachedItems.length} sản phẩm
            </span>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {cachedItems.map((item, index) => (
            <div key={item.id || item.name} className="flex items-center gap-3">
              {cachedShowRank && <RankBadge rank={index + 1} />}

              <div
                className={`w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0 border ${theme.border} p-0.5`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    className="w-full h-full object-cover rounded-md"
                    alt={item.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={16} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {item.name}
                </div>
                {cachedRenderItemContent ? (
                  cachedRenderItemContent(item, index, theme)
                ) : (
                  <div className="text-xs text-gray-500">
                    {/* Default fallback content if needed */}
                  </div>
                )}
              </div>
            </div>
          ))}

          {cachedItems.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-4">
              {cachedEmptyText}
            </div>
          )}
        </div>
      </div>
    </SheetModal>
  );
};

export default StatListModal;
