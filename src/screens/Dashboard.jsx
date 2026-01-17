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
import { formatNumber } from "../utils/helpers";
import useDashboardLogic from "../hooks/useDashboardLogic";
import MetricCard from "../components/stats/MetricCard";
import TopSellingSection from "../components/stats/TopSellingSection";
import TopListModal from "./dashboard/TopListModal";
import OutOfStockModal from "./dashboard/OutOfStockModal";
import InventoryWarningModal from "./dashboard/InventoryWarningModal";
import FloatingActionButton from "../components/common/FloatingActionButton";
import AppHeader from "../components/common/AppHeader";
import StatBlock from "../components/dashboard/StatBlock";

const Dashboard = ({ products, orders, onOpenDetail }) => {
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

  const modalTitle =
    activeModal === "quantity" ? "Top số lượng" : "Top lợi nhuận";
  const modalItems = activeModal === "quantity" ? topByQuantity : topByProfit;

  // Tính số lượng đơn hàng
  const orderCount = filteredPaidOrders.length;

  // Tạo nhãn tháng hiện tại sử dụng ngày tập trung
  const currentMonthLabel = useMemo(() => {
    if (!currentDate) return "Đang tải...";
    return `Tháng ${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
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
        className="h-full overflow-y-auto min-h-0 p-4 pt-[80px] space-y-4 pb-24 animate-fade-in"
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

        {/* Lưới chỉ số chính (4 block cố định) */}
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
        </div>

        {/* Khu vực Cảnh báo (Hết hàng & Hàng tồn) */}
        {(outOfStockProducts.length > 0 || slowMovingProducts.length > 0) && (
          <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-100 p-4 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle size={18} />
              <h3 className="font-bold text-rose-700 text-sm uppercase">
                Cảnh báo
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {outOfStockProducts.length > 0 && (
                <StatBlock
                  title="Hết hàng"
                  icon={ArchiveX}
                  color="teal"
                  items={outOfStockProducts.slice(0, 3)}
                  showRank={false}
                  onClick={() => setShowOutOfStockModal(true)}
                  emptyText="Không có sản phẩm hết hàng"
                />
              )}

              {slowMovingProducts.length > 0 && (
                <StatBlock
                  title="Hàng tồn"
                  icon={AlertTriangle}
                  color="violet"
                  items={slowMovingProducts.slice(0, 3)}
                  showRank={false}
                  onClick={() => setShowInventoryWarningModal(true)}
                  emptyText="Không có hàng tồn lâu"
                />
              )}
            </div>
          </div>
        )}

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
        <TopListModal
          open={Boolean(activeModal)}
          onClose={closeTopModal}
          title={modalTitle}
          items={modalItems}
          mode={activeModal === "quantity" ? "quantity" : "profit"}
        />

        <OutOfStockModal
          open={showOutOfStockModal}
          onClose={() => setShowOutOfStockModal(false)}
          products={outOfStockProducts}
        />

        <InventoryWarningModal
          open={showInventoryWarningModal}
          onClose={() => setShowInventoryWarningModal(false)}
          products={slowMovingProducts}
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
};

export default Dashboard;
