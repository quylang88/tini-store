import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ArrowUpRight, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import useDashboardLogic from "../hooks/dashboard/useDashboardLogic";
import TopSellingSection from "../components/stats/TopSellingSection";
import StatListModal from "../components/dashboard/StatListModal";
import AppHeader from "../components/common/AppHeader";
import DashboardMetrics from "../components/dashboard/DashboardMetrics";
import { getTotalPendingPurchaseQuantity } from "../utils/inventory/purchaseListUtils";

const Dashboard = ({
  products,
  orders,
  purchaseLists,
  onOpenDetail,
  onOpenPurchaseLists,
  updateFab,
  isActive,
}) => {
  useEffect(() => {
    if (isActive) {
      updateFab({
        isVisible: true,
        onClick: onOpenDetail,
        icon: ArrowUpRight,
        label: "Mở thống kê chi tiết",
        color: "rose",
      });
    }
  }, [isActive, onOpenDetail, updateFab]);

  const {
    currentDate, // Sử dụng ngày từ hook
    topOptions,
    topLimit,
    setTopLimit,
    filteredPaidOrders,
    totalRevenue,
    totalProfit,
    totalCapital,
    slowMovingProducts,
    outOfStockProducts, // Danh sách hết hàng
    topByProfit,
    topByQuantity,
    viewDate,
    setViewDate,
    goToPreviousMonth,
    goToNextMonth,
    isCurrentMonth,
    totalDebt,
    unpaidOrders,
    rangeStart,
    isCalculating,
  } = useDashboardLogic({ products, orders, rangeMode: "dashboard" });

  const [activeModal, setActiveModal] = useState(null);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [showInventoryWarningModal, setShowInventoryWarningModal] =
    useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);

  // Memoize handlers to prevent unnecessary re-renders of DashboardMetrics
  const handleShowOutOfStock = useCallback(
    () => setShowOutOfStockModal(true),
    [],
  );
  const handleShowSlowMoving = useCallback(
    () => setShowInventoryWarningModal(true),
    [],
  );
  const handleShowDebt = useCallback(() => setShowDebtModal(true), []);
  const openTopModal = useCallback((type) => setActiveModal(type), []);
  const closeTopModal = useCallback(() => setActiveModal(null), []);

  const modalItems = activeModal === "quantity" ? topByQuantity : topByProfit;

  // Tính số lượng đơn hàng
  const orderCount = filteredPaidOrders.length;
  const pendingPurchaseQuantity = useMemo(
    () => getTotalPendingPurchaseQuantity(purchaseLists),
    [purchaseLists],
  );

  // Tạo nhãn tháng hiện tại sử dụng ngày tập trung hoặc viewDate
  const currentMonthLabel = useMemo(() => {
    const targetDate = viewDate || currentDate;
    if (!targetDate) return "Đang tải...";
    return `Tháng ${String(targetDate.getMonth() + 1).padStart(
      2,
      "0",
    )}/${targetDate.getFullYear()}`;
  }, [currentDate, viewDate]);

  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    setIsScrolled(currentScrollTop > 10);
  };

  return (
    <div className="relative h-full bg-inherit">
      <AppHeader isScrolled={isScrolled} />

      {/* Nội dung cuộn */}
      <div
        className="h-full overflow-y-auto min-h-0 p-4 pt-[calc(80px+env(safe-area-inset-top))] space-y-4 pb-24 overscroll-contain"
        onScroll={handleScroll}
      >
        {/* Nhãn tiêu đề & Điều hướng tháng */}
        <div className="flex items-center justify-between min-h-[44px] gap-2">
          <div className="flex items-center bg-white border border-rose-100 rounded-full px-1 py-1 shadow-sm">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 rounded-full text-rose-600 active:bg-rose-50 transition-colors"
              title="Tháng trước"
            >
              <ArrowLeft size={18} />
            </button>
            <h2
              key={currentMonthLabel}
              className="text-sm font-bold text-rose-700 px-2 min-w-[100px] text-center"
            >
              {currentMonthLabel}
            </h2>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className={`p-1.5 rounded-full transition-colors ${
                isCurrentMonth
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-rose-600 active:bg-rose-50"
              }`}
              title="Tháng sau"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              onClick={() => setViewDate(new Date())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold bg-rose-100 text-rose-700 active:bg-rose-200 transition-all shadow-sm"
            >
              <RotateCcw size={12} />
              Hiện tại
            </button>
          )}
        </div>

        {/* Lưới chỉ số (Metrics Grid) - Đã tách thành component memoized */}
        <DashboardMetrics
          totalRevenue={totalRevenue}
          totalProfit={totalProfit}
          orderCount={orderCount}
          totalCapital={totalCapital}
          totalDebt={totalDebt}
          outOfStockProducts={outOfStockProducts}
          slowMovingProducts={slowMovingProducts}
          pendingPurchaseQuantity={pendingPurchaseQuantity}
          isCalculating={isCalculating}
          onShowOutOfStock={handleShowOutOfStock}
          onShowSlowMoving={handleShowSlowMoving}
          onShowDebt={handleShowDebt}
          onOpenPurchaseLists={onOpenPurchaseLists}
        />

        {/* Phần Top Bán Chạy (Tái sử dụng) */}
        <TopSellingSection
          topOptions={topOptions}
          activeTopOption={topLimit}
          onOptionChange={setTopLimit}
          topByProfit={topByProfit}
          topByQuantity={topByQuantity}
          onOpenModal={openTopModal}
          layoutIdPrefix="dashboard-top-selling"
        />

        {/* Modal mở khi người dùng chạm vào từng nhóm top để xem chi tiết. */}
        <StatListModal
          open={Boolean(activeModal)}
          onClose={closeTopModal}
          items={modalItems}
          type={activeModal === "quantity" ? "quantity" : "profit"}
        />

        <StatListModal
          open={showOutOfStockModal}
          onClose={() => setShowOutOfStockModal(false)}
          items={outOfStockProducts}
          type="out_of_stock"
        />

        <StatListModal
          open={showInventoryWarningModal}
          onClose={() => setShowInventoryWarningModal(false)}
          items={slowMovingProducts}
          type="warning"
        />

        <StatListModal
          open={showDebtModal}
          onClose={() => setShowDebtModal(false)}
          items={unpaidOrders}
          type="debt"
        />
      </div>
    </div>
  );
};

export default Dashboard;
