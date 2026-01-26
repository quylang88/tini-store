import React, { useMemo } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import FloatingActionButton from "../../components/button/FloatingActionButton";
import AppHeader from "../../components/common/AppHeader";
import useScrollHandling from "../../hooks/ui/useScrollHandling";
import OrderListItem from "../../components/orders/OrderListItem";
import usePagination from "../../hooks/ui/usePagination";
import { isScrollNearBottom } from "../../utils/ui/scrollUtils";

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
}) => {
  // Logic scroll ẩn/hiện UI sử dụng hook mới
  const { isAddButtonVisible, isScrolled, handleScroll } = useScrollHandling({
    mode: "simple",
    setTabBarVisible,
  });

  // Memoize sorted orders to avoid re-sorting on every render
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = a.date || "";
      const dateB = b.date || "";

      // Optimize for ISO strings (common case)
      if (typeof dateA === "string" && typeof dateB === "string") {
        if (dateB === dateA) return 0;
        return dateB > dateA ? 1 : -1;
      }

      // Fallback for legacy/numeric timestamps
      return new Date(dateB || 0) - new Date(dateA || 0);
    });
  }, [orders]);

  const {
    visibleData: visibleOrders,
    loadMore,
    hasMore,
  } = usePagination(sortedOrders, {
    pageSize: 20,
    resetDeps: [], // Orders list preserves scroll position even if updated, unless we decide otherwise
  });

  return (
    <div className="relative h-full bg-transparent">
      <AppHeader isScrolled={isScrolled} />

      {/* Nút tạo đơn mới nổi để tái sử dụng layout và tránh lặp code. */}
      <AnimatePresence>
        {isAddButtonVisible && (
          <motion.div
            layout
            layoutId="floating-action-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+90px)] z-30"
          >
            <FloatingActionButton
              onClick={onCreateOrder}
              ariaLabel="Tạo đơn mới"
              icon={Plus}
              color="rose"
              className="!static"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="h-full overflow-y-auto p-3 pt-[calc(80px+env(safe-area-inset-top))] pb-24 space-y-3 min-h-0 overscroll-y-contain"
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
          />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
            <ShoppingCart size={48} className="mb-2 opacity-20" />
            <p>Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderListView;
