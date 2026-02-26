import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArchiveX,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { formatNumber } from "../utils/formatters/formatUtils";
import useDashboardLogic from "../hooks/dashboard/useDashboardLogic";
import MetricCard from "../components/stats/MetricCard";
import TopSellingSection from "../components/stats/TopSellingSection";
import StatListModal from "../components/dashboard/StatListModal";
import AppHeader from "../components/common/AppHeader";
import { motion, AnimatePresence } from "framer-motion";

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

  const openTopModal = (type) => setActiveModal(type);
  const closeTopModal = () => setActiveModal(null);

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
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={currentMonthLabel}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-bold text-rose-700"
              >
                {currentMonthLabel}
              </motion.h2>
            </AnimatePresence>
          </div>

          <button
            onClick={() => setPreviousPeriod(!isPreviousPeriod)}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 min-w-[110px] ${
              isPreviousPeriod
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                : "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isPreviousPeriod ? (
                <motion.span
                  key="reset"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  Tháng này
                </motion.span>
              ) : (
                <motion.span
                  key="prev"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  Tháng trước
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Lưới chỉ số (Metrics Grid) */}
        <div
          className={`grid grid-cols-2 gap-3 transition-opacity duration-200 ${
            isCalculating ? "opacity-60 pointer-events-none" : "opacity-100"
          }`}
        >
          <MetricCard
            icon={DollarSign}
            label="Doanh thu"
            value={
              isCalculating ? "Đang tính..." : `${formatNumber(totalRevenue)}đ`
            }
            className="bg-rose-400 shadow-rose-200"
          />

          <MetricCard
            icon={TrendingUp}
            label="Lợi nhuận"
            value={
              isCalculating ? "Đang tính..." : `${formatNumber(totalProfit)}đ`
            }
            className="bg-emerald-400 shadow-emerald-100"
          />

          <MetricCard
            icon={ShoppingCart}
            label="Số đơn"
            value={isCalculating ? "..." : orderCount}
            className="bg-amber-400 shadow-amber-200"
          />

          <MetricCard
            icon={Package}
            label="Vốn tồn kho"
            value={
              isCalculating ? "Đang tính..." : `${formatNumber(totalCapital)}đ`
            }
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
    </div>
  );
};

export default Dashboard;
