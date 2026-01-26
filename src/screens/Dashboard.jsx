import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArchiveX,
} from "lucide-react";
import { formatNumber } from "../utils/formatters/formatUtils";
import useDashboardLogic from "../hooks/dashboard/useDashboardLogic";
import MetricCard from "../components/stats/MetricCard";
import TopSellingSection from "../components/stats/TopSellingSection";
import StatListModal from "../components/dashboard/StatListModal";
import FloatingActionButton from "../components/button/FloatingActionButton";
import AppHeader from "../components/common/AppHeader";

const Dashboard = React.memo(({ products, orders, onOpenDetail }) => {
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
  } = useDashboardLogic({ products, orders, rangeMode: "dashboard" });

  const [activeModal, setActiveModal] = useState(null);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [showInventoryWarningModal, setShowInventoryWarningModal] =
    useState(false);

  const openTopModal = (type) => setActiveModal(type);
  const closeTopModal = () => setActiveModal(null);

  const modalItems = activeModal === "quantity" ? topByQuantity : topByProfit;

  // Tính số lượng đơn hàng
  const orderCount = filteredPaidOrders.length;

  // Tạo nhãn tháng hiện tại sử dụng ngày tập trung
  const currentMonthLabel = useMemo(() => {
    if (!currentDate) return "Đang tải...";
    return `Tháng ${String(currentDate.getMonth() + 1).padStart(
      2,
      "0",
    )}/${currentDate.getFullYear()}`;
  }, [currentDate]);

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
        className="h-full overflow-y-auto min-h-0 p-4 pt-[calc(80px+env(safe-area-inset-top))] space-y-4 pb-24 animate-fade-in overscroll-contain"
        onScroll={handleScroll}
      >
        {/* Nhãn tiêu đề */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-rose-700">
              {currentMonthLabel}
            </h2>
          </div>
        </div>

        {/* Lưới chỉ số (Metrics Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={DollarSign}
            label="Doanh thu"
            value={`${formatNumber(totalRevenue)}đ`}
            className="bg-rose-400 shadow-rose-200"
          />

          <MetricCard
            icon={TrendingUp}
            label="Lợi nhuận"
            value={`${formatNumber(totalProfit)}đ`}
            className="bg-emerald-400 shadow-emerald-100"
          />

          <MetricCard
            icon={ShoppingCart}
            label="Số đơn"
            value={orderCount}
            className="bg-amber-400 shadow-amber-200"
          />

          <MetricCard
            icon={Package}
            label="Vốn tồn kho"
            value={`${formatNumber(totalCapital)}đ`}
            className="bg-blue-400 shadow-blue-200"
          />

          {outOfStockProducts.length >= 1 && (
            <MetricCard
              icon={ArchiveX}
              label="Hết hàng"
              value={outOfStockProducts.length}
              className="bg-slate-400 shadow-slate-200"
              onClick={() => setShowOutOfStockModal(true)}
            />
          )}

          {slowMovingProducts.length >= 1 && (
            <MetricCard
              icon={AlertTriangle}
              label="Hàng tồn"
              value={slowMovingProducts.length}
              className="bg-violet-400 shadow-violet-200"
              onClick={() => setShowInventoryWarningModal(true)}
            />
          )}
        </div>

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

      {/* Nút thống kê chi tiết dạng floating */}
      <FloatingActionButton
        onClick={onOpenDetail}
        ariaLabel="Mở thống kê chi tiết"
        icon={ArrowUpRight}
        color="rose"
      />
    </div>
  );
});

export default Dashboard;
