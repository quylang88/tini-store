import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  CheckSquare,
  ListChecks,
  FileStack,
  X,
} from "lucide-react";
import AppHeader from "../../components/common/AppHeader";
import useScrollHandling from "../../hooks/ui/useScrollHandling";
import OrderListItem from "../../components/orders/OrderListItem";
import usePagination from "../../hooks/ui/usePagination";
import { isScrollNearBottom } from "../../utils/ui/scrollUtils";
import ToggleButton from "../../components/button/ToggleButton";

// Giao diện danh sách đơn tách riêng để dễ quản lý và thêm nút huỷ đơn
const OrderListView = ({
  orders,
  onCreateOrder,
  getOrderStatusInfo,
  handleTogglePaid,
  handleEditOrder,
  handleCancelOrder,
  onSelectOrder,
  setTabBarVisible,
  updateFab,
  isActive,
  isMergeMode,
  selectedOrderIds,
  toggleMergeMode,
  toggleOrderSelection,
  getOrderMergeEligibility,
  clearMergeSelection,
  onOpenMergeExport,
}) => {
  // Logic scroll ẩn/hiện UI sử dụng hook mới
  const { isAddButtonVisible, isScrolled, handleScroll } = useScrollHandling({
    mode: "simple",
    setTabBarVisible,
  });

  const handleToggleMergeMode = () => {
    const nextIsMergeMode = !isMergeMode;
    toggleMergeMode();

    if (!nextIsMergeMode) {
      setTabBarVisible(true);
    }
  };

  const handleCancelMergeMode = () => {
    clearMergeSelection();
    toggleMergeMode();
    setTabBarVisible(true);
  };

  useEffect(() => {
    if (isActive) {
      if (isMergeMode) {
        updateFab({ isVisible: false });
        setTabBarVisible(false);
        return;
      }

      updateFab({
        isVisible: isAddButtonVisible,
        onClick: onCreateOrder,
        icon: Plus,
        label: "Tạo đơn mới",
        color: "rose",
      });
    }
  }, [
    isActive,
    isAddButtonVisible,
    isMergeMode,
    onCreateOrder,
    setTabBarVisible,
    updateFab,
  ]);

  useEffect(() => {
    if (isActive && isMergeMode) {
      setTabBarVisible(false);
    }
  }, [isActive, isMergeMode, setTabBarVisible]);

  // Memoize danh sách đơn hàng đã sắp xếp để tránh sắp xếp lại mỗi lần render
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";

      // Tối ưu hoá cho chuỗi ISO (trường hợp phổ biến)
      if (typeof dateA === "string" && typeof dateB === "string") {
        if (dateB === dateA) return 0;
        return dateB > dateA ? 1 : -1;
      }

      // Dự phòng cho timestamp số/cũ
      return new Date(dateB || 0) - new Date(dateA || 0);
    });
  }, [orders]);

  const {
    visibleData: visibleOrders,
    loadMore,
    hasMore,
  } = usePagination(sortedOrders, {
    pageSize: 20,
    // Danh sách đơn hàng giữ nguyên vị trí cuộn ngay cả khi cập nhật, trừ khi chúng ta quyết định khác
    resetDeps: [],
  });

  return (
    <div className="relative h-full bg-transparent">
      <AppHeader
        isScrolled={isScrolled}
        rightSlot={
          <ToggleButton
            isActive={isMergeMode}
            onClick={handleToggleMergeMode}
            activeIcon={CheckSquare}
            inactiveIcon={ListChecks}
            label={
              isMergeMode ? "Thoát chế độ gộp đơn" : "Bật chế độ gộp đơn"
            }
          />
        }
      />

      <div
        className={`h-full overflow-y-auto p-3 pt-[calc(80px+env(safe-area-inset-top))] ${
          isMergeMode ? "pb-36" : "pb-24"
        } space-y-3 min-h-0 overscroll-y-contain`}
        onScroll={(e) => {
          handleScroll(e);
          if (isScrollNearBottom(e.target) && hasMore) {
            loadMore();
          }
        }}
      >
        {visibleOrders.map((order) => (
          <OrderListItem
            key={order.id}
            order={order}
            getOrderStatusInfo={getOrderStatusInfo}
            handleTogglePaid={handleTogglePaid}
            handleEditOrder={handleEditOrder}
            handleCancelOrder={handleCancelOrder}
            onSelectOrder={onSelectOrder}
            isMergeMode={isMergeMode}
            isSelected={selectedOrderIds.has(order.id)}
            mergeEligibility={getOrderMergeEligibility(order)}
            onToggleOrderSelection={toggleOrderSelection}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
            <ShoppingCart size={48} className="mb-2 opacity-20" />
            <p>Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>

      {isMergeMode && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-rose-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-rose-700">
                {selectedOrderIds.size}
              </span>
              <span className="text-sm text-gray-500">đơn đã chọn</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelMergeMode}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium active:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <X size={18} /> Huỷ
              </button>
              <button
                onClick={onOpenMergeExport}
                disabled={selectedOrderIds.size < 2}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  selectedOrderIds.size < 2
                    ? "bg-rose-200 text-rose-400 cursor-not-allowed"
                    : "bg-rose-600 text-white shadow-lg shadow-rose-200 active:scale-95"
                }`}
              >
                <FileStack size={18} /> Xuất
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OrderListView;
