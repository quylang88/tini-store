import React, { useMemo, useEffect } from "react";
import { ShoppingCart, Plus } from "lucide-react";
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
  updateFab,
  isActive,
}) => {
  // Logic scroll ẩn/hiện UI sử dụng hook mới
  const { isAddButtonVisible, isScrolled, handleScroll } = useScrollHandling({
    mode: "simple",
    setTabBarVisible,
  });

  useEffect(() => {
    if (isActive) {
      updateFab({
        isVisible: isAddButtonVisible,
        onClick: onCreateOrder,
        icon: Plus,
        label: "Tạo đơn mới",
        color: "rose",
      });
    }
  }, [isActive, isAddButtonVisible, onCreateOrder, updateFab]);

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
      <AppHeader isScrolled={isScrolled} />

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
