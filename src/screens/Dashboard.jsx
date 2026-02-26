import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ArrowUpRight, ArrowLeft, RotateCcw } from "lucide-react";
import useDashboardLogic from "../hooks/dashboard/useDashboardLogic";
import TopSellingSection from "../components/stats/TopSellingSection";
import StatListModal from "../components/dashboard/StatListModal";
import AppHeader from "../components/common/AppHeader";
import DashboardMetrics from "../components/dashboard/DashboardMetrics";

const Dashboard = ({ products, orders, onOpenDetail, updateFab, isActive }) => {
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
    isPreviousPeriod,
    setPreviousPeriod,
    rangeStart,
    isCalculating,
  } = useDashboardLogic({ products, orders, rangeMode: "dashboard" });

  const [activeModal, setActiveModal] = useState(null);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [showInventoryWarningModal, setShowInventoryWarningModal] =
    useState(false);

  // Memoize handlers to prevent unnecessary re-renders of DashboardMetrics
  const handleShowOutOfStock = useCallback(() => setShowOutOfStockModal(true), []);
  const handleShowSlowMoving = useCallback(() => setShowInventoryWarningModal(true), []);
  const openTopModal = useCallback((type) => setActiveModal(type), []);
  const closeTopModal = useCallback(() => setActiveModal(null), []);

  const modalItems = activeModal === "quantity" ? topByQuantity : topByProfit;

  // Tính số lượng đơn hàng
  const orderCount = filteredPaidOrders.length;

  // Tạo nhãn tháng hiện tại sử dụng ngày tập trung hoặc rangeStart (ngày bắt đầu thực tế của view)
  const currentMonthLabel = useMemo(() => {
    // Ưu tiên rangeStart nếu có (đã tính toán theo tháng trước/hiện tại)
    const targetDate = rangeStart || currentDate;
    if (!targetDate) return "Đang tải...";
    return `Tháng ${String(targetDate.getMonth() + 1).padStart(
      2,
      "0",
    )}/${targetDate.getFullYear()}`;
  }, [currentDate, rangeStart]);

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
        {/* Nhãn tiêu đề */}
        <div className="flex items-center justify-between min-h-[40px]">
          <div className="overflow-hidden">
            <h2
              key={currentMonthLabel}
              className="text-xl font-bold text-rose-700 filter-transition"
            >
              {currentMonthLabel}
            </h2>
          </div>

          <button
            onClick={() => setPreviousPeriod(!isPreviousPeriod)}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 min-w-[110px] ${
              isPreviousPeriod
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                : "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
            }`}
          >
            {isPreviousPeriod ? (
              <span
                key="this"
                className="flex items-center gap-1.5 filter-transition"
              >
                <RotateCcw size={14} />
                Tháng này
              </span>
            ) : (
              <span
                key="prev"
                className="flex items-center gap-1.5 filter-transition"
              >
                <ArrowLeft size={14} />
                Tháng trước
              </span>
            )}
          </button>
        </div>

        {/* Lưới chỉ số (Metrics Grid) - Đã tách thành component memoized */}
        <DashboardMetrics
          totalRevenue={totalRevenue}
          totalProfit={totalProfit}
          orderCount={orderCount}
          totalCapital={totalCapital}
          outOfStockProducts={outOfStockProducts}
          slowMovingProducts={slowMovingProducts}
          isCalculating={isCalculating}
          onShowOutOfStock={handleShowOutOfStock}
          onShowSlowMoving={handleShowSlowMoving}
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
      </div>
    </div>
  );
};

export default Dashboard;
