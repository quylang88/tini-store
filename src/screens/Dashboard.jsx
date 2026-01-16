import React, { useState } from "react";
import { ArrowUpRight, DollarSign, TrendingUp } from "lucide-react";
import { formatNumber } from "../utils/helpers";
import useDashboardLogic from "../hooks/useDashboardLogic";
import MetricCard from "../components/stats/MetricCard";
import AnimatedFilterTabs from "../components/common/AnimatedFilterTabs";
import TopSellingSection from "../components/stats/TopSellingSection";
import TopListModal from "../components/stats/TopListModal";
import FloatingActionButton from "../components/common/FloatingActionButton";
import AppHeader from "../components/common/AppHeader";

const Dashboard = ({ products, orders, onOpenDetail }) => {
  const {
    rangeOptions,
    topOptions,
    topLimit,
    setTopLimit,
    activeRange,
    setActiveRange,
    totalRevenue,
    totalProfit,
    topByProfit,
    topByQuantity,
  } = useDashboardLogic({ products, orders, rangeMode: "dashboard" });

  const [activeModal, setActiveModal] = useState(null);

  const openTopModal = (type) => setActiveModal(type);
  const closeTopModal = () => setActiveModal(null);

  const modalTitle =
    activeModal === "quantity" ? "Top số lượng" : "Top lợi nhuận";
  const modalItems = activeModal === "quantity" ? topByQuantity : topByProfit;

  // Transform rangeOptions for AnimatedFilterTabs
  const rangeTabs = rangeOptions.map((opt) => ({
    key: opt.id,
    label: opt.label,
  }));

  return (
    <div className="relative h-full bg-inherit">
      <AppHeader />

      {/* Scrollable Content */}
      <div className="h-full overflow-y-auto min-h-0 p-4 pt-[80px] space-y-4 pb-24 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          {/* Căn bộ lọc thời gian gọn trong thẻ riêng để dành chỗ cho nút nổi phía dưới. */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <AnimatedFilterTabs
              tabs={rangeTabs}
              activeTab={activeRange}
              onChange={setActiveRange}
              layoutIdPrefix="dashboard-range"
            />
          </div>
        </div>

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
        </div>

        {/* Reusable Top Selling Section */}
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
