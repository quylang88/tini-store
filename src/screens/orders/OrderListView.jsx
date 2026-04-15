import React, { useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, FileStack, X } from "lucide-react";
import AppHeader from "../../components/common/AppHeader";
import useScrollHandling from "../../hooks/ui/useScrollHandling";
import OrderListItem from "../../components/orders/OrderListItem";
import usePagination from "../../hooks/ui/usePagination";
import { isScrollNearBottom } from "../../utils/ui/scrollUtils";
import SelectionActionBar from "../../components/common/SelectionActionBar";
import SearchBar from "../../components/common/SearchBar";
import {
  orderMatchesSearchTerms,
  parseOrderSearchTerms,
} from "../../utils/orders/orderUtils";

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
  searchTerm,
  setSearchTerm,
  debouncedSearchTerm,
}) => {
  // Logic scroll ẩn/hiện UI sử dụng hook mới
  const { isSearchVisible, isAddButtonVisible, isScrolled, handleScroll } =
    useScrollHandling({
      mode: "staged",
      setTabBarVisible,
      searchHideThreshold: 140,
      showTabBarOnlyAtTop: true,
      lockTabBarHidden: isMergeMode,
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

  const orderSearchTerms = useMemo(
    () => parseOrderSearchTerms(debouncedSearchTerm),
    [debouncedSearchTerm],
  );

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

  const filteredOrders = useMemo(() => {
    const next = [];
    for (const order of sortedOrders) {
      if (orderMatchesSearchTerms(order, orderSearchTerms)) {
        next.push(order);
      }
    }
    return next;
  }, [orderSearchTerms, sortedOrders]);

  // Lọc các đơn hàng đủ điều kiện gộp khi ở chế độ chọn nhiều
  const displayOrders = useMemo(() => {
    if (!isMergeMode) return filteredOrders;
    const next = [];
    for (const order of filteredOrders) {
      const eligibility = getOrderMergeEligibility(order);
      if (eligibility.canSelect) {
        next.push(order);
      }
    }
    return next;
  }, [filteredOrders, isMergeMode, getOrderMergeEligibility]);

  const {
    visibleData: visibleOrders,
    loadMore,
    hasMore,
  } = usePagination(displayOrders, {
    pageSize: 20,
    // Danh sách đơn hàng giữ nguyên vị trí cuộn ngay cả khi cập nhật, trừ khi chúng ta quyết định khác
    resetDeps: [debouncedSearchTerm, isMergeMode],
  });

  const handleSearchChange = useCallback(
    (event) => setSearchTerm(event.target.value),
    [setSearchTerm],
  );

  const handleClearSearch = useCallback(
    () => setSearchTerm(""),
    [setSearchTerm],
  );

  return (
    <div className="relative h-full bg-transparent flex flex-col">
      <AppHeader className="z-20" isScrolled={isScrolled} />

      <div className="flex flex-col h-full pt-[calc(72px+env(safe-area-inset-top))] relative">
        <motion.div
          className="absolute top-[calc(72px+env(safe-area-inset-top))] left-0 right-0 z-10 bg-amber-50"
          initial={{ y: 0 }}
          animate={{ y: isSearchVisible ? 0 : -80 }}
          transition={{ duration: 0.3 }}
        >
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            placeholder="Tìm tên kh, sp... ngăn cách bằng dấu phẩy"
            onToggleSelect={handleToggleMergeMode}
            isSelectionMode={isMergeMode}
          />
        </motion.div>

        <div
          className={`flex-1 overflow-y-auto min-h-0 pt-20 overscroll-y-contain px-3 ${
            isMergeMode ? "pb-[11rem]" : "pb-24"
          }`}
          onScroll={(e) => {
            handleScroll(e);
            if (isScrollNearBottom(e.target) && hasMore) {
              loadMore();
            }
          }}
        >
          <div className="space-y-3 pb-3">
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

            {orders.length > 0 && filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
                <ShoppingCart size={48} className="mb-2 opacity-20" />
                <p>Không tìm thấy đơn phù hợp</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SelectionActionBar
        visible={isMergeMode}
        count={selectedOrderIds.size}
        title={
          selectedOrderIds.size >= 2
            ? "Sẵn sàng xuất đơn gộp"
            : "Chọn tối thiểu 2 đơn hợp lệ"
        }
        subtitle={
          selectedOrderIds.size >= 2
            ? "Xuất K80, A4 hoặc ảnh mà không tạo đơn mới."
            : "Chỉ chọn các đơn chưa thanh toán, cùng khách hoặc cùng kho."
        }
        secondaryAction={{
          label: "Thoát",
          icon: X,
          onClick: handleCancelMergeMode,
        }}
        primaryAction={{
          label: "Xuất file",
          icon: FileStack,
          onClick: onOpenMergeExport,
          disabled: selectedOrderIds.size < 2,
        }}
      />
    </div>
  );
};

export default OrderListView;
