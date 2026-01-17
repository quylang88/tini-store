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
import TopListModal from "../components/stats/TopListModal";
import FloatingActionButton from "../components/common/FloatingActionButton";
import AppHeader from "../components/common/AppHeader";

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

        {/* Lưới chỉ số (Metrics Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={DollarSign}
            label="Doanh thu"
            value={`${formatNumber(totalRevenue)}đ`}
            className="bg-amber-100 border border-amber-200 shadow-sm text-rose-700"
          />

          <MetricCard
            icon={TrendingUp}
            label="Lợi nhuận"
            value={`${formatNumber(totalProfit)}đ`}
            className="bg-amber-100 border border-amber-200 shadow-sm text-rose-700"
          />

          <MetricCard
            icon={ShoppingCart}
            label="Số đơn"
            value={orderCount}
            className="bg-amber-100 border border-amber-200 shadow-sm text-rose-700"
          />

          <MetricCard
            icon={Package}
            label="Vốn tồn kho"
            value={`${formatNumber(totalCapital)}đ`}
            className="bg-amber-100 border border-amber-200 shadow-sm text-rose-700"
          />
        </div>

        {/* Phần Hết Hàng (Out of Stock) - Horizontal Scroll */}
        {outOfStockProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <ArchiveX size={16} className="text-rose-500" />
              <h3 className="text-xs font-bold uppercase text-rose-700">
                Hết hàng ({outOfStockProducts.length})
              </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
              {outOfStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-64 bg-amber-100 rounded-xl shadow-sm border border-red-100 p-3 flex gap-3 opacity-90"
                >
                  <div className="w-12 h-12 rounded-lg bg-red-50 p-1 border border-red-100 flex-shrink-0 grayscale">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-red-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div className="text-sm font-semibold text-rose-700 truncate">
                      {product.name}
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-full">
                        Hết hàng
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phần Hàng tồn kho lâu (Cuộn ngang) */}
        {slowMovingProducts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle size={16} className="text-rose-500" />
              <h3 className="text-xs font-bold uppercase text-rose-700">
                Cảnh báo hàng tồn ({slowMovingProducts.length})
              </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
              {slowMovingProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-64 bg-amber-100 rounded-xl shadow-sm border border-orange-100 p-3 flex gap-3"
                >
                  <div className="w-12 h-12 rounded-lg bg-orange-50 p-1 border border-orange-100 flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-orange-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div className="text-sm font-semibold text-rose-700 truncate">
                      {product.name}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-600 font-medium">
                        {product.daysNoSale} ngày
                      </span>
                      <span className="text-gray-500">
                        Tồn: <b>{product.stock}</b>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
