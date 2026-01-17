/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from "react";
import { BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { formatNumber } from "../../utils/helpers";
import useDashboardLogic from "../../hooks/useDashboardLogic";
import { getLatestUnitCost } from "../../utils/purchaseUtils";
import MetricCard from "../../components/stats/MetricCard";
import TopSellingSection from "../../components/stats/TopSellingSection";
import TopListModal from "../../components/stats/TopListModal";
import DateRangeFilter from "../../components/stats/DateRangeFilter";

const StatsDetail = ({ products, orders, onBack }) => {
  const {
    topOptions,
    topLimit,
    setTopLimit,
    rangeStart,
    rangeEnd,
    customRange,
    setCustomRange,
    rangeDays,
    paidOrders,
    filteredPaidOrders,
    totalRevenue,
    totalProfit,
    topByProfit,
    topByQuantity,
  } = useDashboardLogic({ products, orders, rangeMode: "detail" });

  const orderCount = filteredPaidOrders.length;
  const avgOrder = orderCount ? totalRevenue / orderCount : 0;
  const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;
  const costMap = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, getLatestUnitCost(product)])
      ),
    [products]
  );

  const comparisonStats = useMemo(() => {
    // So sánh kỳ hiện tại với kỳ trước theo số ngày đang chọn (mặc định 30 ngày nếu "Tất cả").
    const compareDays = rangeDays ?? 30;
    const now = new Date();
    const currentEnd = rangeEnd ? new Date(rangeEnd) : new Date(now);
    currentEnd.setHours(23, 59, 59, 999);

    const currentStart = rangeStart
      ? new Date(rangeStart)
      : (() => {
          const start = new Date(currentEnd);
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() - compareDays + 1);
          return start;
        })();

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - compareDays);
    previousStart.setHours(0, 0, 0, 0);

    const calcStats = (rangeStartDate, rangeEndDate) => {
      const rangeOrders = paidOrders.filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= rangeStartDate && orderDate <= rangeEndDate;
      });

      const revenue = rangeOrders.reduce((sum, order) => sum + order.total, 0);
      const profit = rangeOrders.reduce((sum, order) => {
        const orderProfit = order.items.reduce((itemSum, item) => {
          const cost = Number.isFinite(item.cost)
            ? item.cost
            : costMap.get(item.productId) || 0;
          return itemSum + (item.price - cost) * item.quantity;
        }, 0);
        const shippingFee = order.shippingFee || 0;
        return sum + orderProfit - shippingFee;
      }, 0);

      return { revenue, profit, count: rangeOrders.length };
    };

    return {
      current: calcStats(currentStart, currentEnd),
      previous: calcStats(previousStart, previousEnd),
    };
  }, [paidOrders, rangeDays, rangeStart, rangeEnd, costMap]);

  const [activeModal, setActiveModal] = useState(null);

  const openTopModal = (type) => setActiveModal(type);
  const closeTopModal = () => setActiveModal(null);

  const modalTitle =
    activeModal === "quantity" ? "Top số lượng" : "Top lợi nhuận";
  const modalItems = activeModal === "quantity" ? topByQuantity : topByProfit;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 pb-24 animate-fade-in">
      <div>
        <div className="text-xl text-rose-700 font-bold whitespace-nowrap">
          Thống kê chi tiết
        </div>
        <div className="text-sm font-medium text-rose-900 whitespace-nowrap">
          Phân tích doanh thu & lợi nhuận
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-100 p-3">
        {/* Bộ lọc thời gian chi tiết hơn để xem theo nhiều khoảng khác nhau. */}
        <DateRangeFilter
          customRange={customRange}
          setCustomRange={setCustomRange}
        />
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
        <div className="bg-amber-50 text-rose-900 p-4 rounded-2xl shadow-sm border border-amber-100 col-span-2">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-rose-500 uppercase font-semibold">
                Số đơn
              </div>
              <div className="text-lg font-bold text-rose-700">
                {orderCount}
              </div>
            </div>
            <div>
              <div className="text-rose-500 uppercase font-semibold">
                Giá trị TB
              </div>
              <div className="text-lg font-bold text-rose-700">
                {formatNumber(avgOrder)}đ
              </div>
            </div>
            <div>
              <div className="text-rose-500 uppercase font-semibold">
                Biên lợi nhuận
              </div>
              <div className="text-lg font-bold text-rose-700">
                {profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phần Top Bán Chạy (Tái sử dụng) */}
      <TopSellingSection
        topOptions={topOptions}
        activeTopOption={topLimit}
        onOptionChange={setTopLimit}
        topByProfit={topByProfit}
        topByQuantity={topByQuantity}
        onOpenModal={openTopModal}
        layoutIdPrefix="stats-detail-top-selling"
      />

      <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-rose-700">
          <BarChart3 size={18} />
          <h3 className="text-sm font-bold uppercase">So sánh kỳ hiện tại</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-amber-100 bg-amber-100 p-3">
            <div className="text-rose-600 font-semibold uppercase mb-2">
              Kỳ hiện tại
            </div>
            <div className="space-y-1 text-rose-900">
              <div>
                Doanh thu:{" "}
                <span className="font-semibold">
                  {formatNumber(comparisonStats.current.revenue)}đ
                </span>
              </div>
              <div>
                Lợi nhuận:{" "}
                <span className="font-semibold">
                  {formatNumber(comparisonStats.current.profit)}đ
                </span>
              </div>
              <div>
                Số đơn:{" "}
                <span className="font-semibold">
                  {comparisonStats.current.count}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3">
            <div className="text-gray-500 font-semibold uppercase mb-2">
              Kỳ trước
            </div>
            <div className="space-y-1 text-gray-700">
              <div>
                Doanh thu:{" "}
                <span className="font-semibold">
                  {formatNumber(comparisonStats.previous.revenue)}đ
                </span>
              </div>
              <div>
                Lợi nhuận:{" "}
                <span className="font-semibold">
                  {formatNumber(comparisonStats.previous.profit)}đ
                </span>
              </div>
              <div>
                Số đơn:{" "}
                <span className="font-semibold">
                  {comparisonStats.previous.count}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-rose-500">
          So sánh theo cùng số ngày của kỳ đang chọn để dễ theo dõi biến động.
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-100 p-4 space-y-2">
        <div className="flex items-center gap-2 text-rose-700">
          <TrendingUp size={18} />
          <h3 className="text-sm font-bold uppercase">Ý tưởng thêm</h3>
        </div>
        <ul className="text-xs text-rose-700 space-y-1 list-disc list-inside">
          <li>
            Tỉ trọng doanh thu theo danh mục/sản phẩm và mức tăng trưởng theo
            kỳ.
          </li>
          <li>So sánh chi phí vận chuyển & chiết khấu theo từng kênh bán.</li>
          <li>Bản đồ nhiệt ngày/giờ có nhiều đơn để tối ưu lịch chạy ads.</li>
          <li>Danh sách đơn hoàn/hủy để theo dõi lý do thất thoát.</li>
        </ul>
      </div>

      {/* Dùng modal chung để xem chi tiết top khi chạm vào từng bảng. */}
      <TopListModal
        open={Boolean(activeModal)}
        onClose={closeTopModal}
        title={modalTitle}
        items={modalItems}
        mode={activeModal === "quantity" ? "quantity" : "profit"}
      />
    </div>
  );
};

export default StatsDetail;
