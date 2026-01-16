/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from "react";
import { BarChart3, DollarSign, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { formatNumber } from "../utils/helpers";
import useDashboardLogic from "../hooks/useDashboardLogic";
import { getLatestUnitCost } from "../utils/purchaseUtils";
import MetricCard from "../components/stats/MetricCard";
import TopSellingSection from "../components/stats/TopSellingSection";
import TopListModal from "../components/stats/TopListModal";
import DateRangeFilter from "../components/stats/DateRangeFilter";

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

  // Create cost map
  const costMap = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, getLatestUnitCost(product)])
      ),
    [products]
  );

  // Calculate Total Capital (Vốn tồn kho)
  const totalCapital = useMemo(() => {
    return products.reduce((sum, product) => {
      const stock = product.stock || 0;
      if (stock <= 0) return sum;
      const cost = costMap.get(product.id) || 0;
      return sum + (stock * cost);
    }, 0);
  }, [products, costMap]);

  // Calculate Slow Moving Inventory (Hàng tồn)
  const slowMovingProducts = useMemo(() => {
    // 1. Map last sold date
    const lastSoldMap = new Map();
    // Scan all orders (not just filtered) to find true last sold date
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      const date = new Date(order.date);
      order.items.forEach(item => {
        const current = lastSoldMap.get(item.productId);
        if (!current || date > current) {
          lastSoldMap.set(item.productId, date);
        }
      });
    });

    const now = new Date();
    const warningDays = 60; // Configurable threshold for "slow"

    return products
      .filter(p => (p.stock || 0) > 0)
      .map(p => {
        const lastSold = lastSoldMap.get(p.id);
        const dateToCheck = lastSold || new Date(p.createdAt || Date.now());
        const diffTime = Math.abs(now - dateToCheck);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...p,
          daysNoSale: diffDays,
          lastSoldDate: lastSold
        };
      })
      .filter(p => p.daysNoSale > warningDays)
      .sort((a, b) => b.daysNoSale - a.daysNoSale); // Oldest first
  }, [products, orders]);

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
        <div className="text-xs text-amber-500 uppercase font-semibold whitespace-nowrap">
          Thống kê chi tiết
        </div>
        <div className="text-sm font-bold text-amber-900 whitespace-nowrap">
          Phân tích doanh thu & lợi nhuận
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        {/* Bộ lọc thời gian chi tiết hơn để xem theo nhiều khoảng khác nhau. */}
        <DateRangeFilter
          customRange={customRange}
          setCustomRange={setCustomRange}
        />
      </div>

      {/* Summary Metrics Grid */}
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
          icon={Package}
          label="Vốn tồn kho"
          value={`${formatNumber(totalCapital)}đ`}
          className="bg-blue-400 shadow-blue-200 col-span-2"
        />

        <div className="bg-white text-amber-900 p-4 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-amber-500 uppercase font-semibold">
                Số đơn
              </div>
              <div className="text-lg font-bold text-amber-900">
                {orderCount}
              </div>
            </div>
            <div>
              <div className="text-amber-500 uppercase font-semibold">
                Giá trị TB
              </div>
              <div className="text-lg font-bold text-amber-900">
                {formatNumber(avgOrder)}đ
              </div>
            </div>
            <div>
              <div className="text-amber-500 uppercase font-semibold">
                Biên lợi nhuận
              </div>
              <div className="text-lg font-bold text-amber-900">
                {profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slow Moving Inventory Warning */}
      {slowMovingProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-bold uppercase">Cảnh báo hàng tồn</h3>
          </div>
          <div className="text-xs text-gray-500">
            Các sản phẩm tồn kho trên 60 ngày chưa bán được
          </div>

          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {slowMovingProducts.map(product => (
              <div key={product.id} className="flex items-center gap-3 p-2 bg-orange-50/50 rounded-xl border border-orange-100">
                <div className="w-10 h-10 rounded-lg bg-white p-1 border border-orange-100 flex-shrink-0">
                   {product.image ? (
                     <img src={product.image} alt="" className="w-full h-full object-contain" />
                   ) : (
                     <div className="w-full h-full bg-orange-100 rounded flex items-center justify-center text-orange-300">
                       <Package size={16} />
                     </div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">{product.name}</div>
                  <div className="text-xs text-orange-600 font-medium">
                    {product.daysNoSale} ngày chưa bán
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">SL: {product.stock}</div>
                  <div className="text-[10px] text-gray-500">
                    Vốn: {formatNumber((product.stock || 0) * (costMap.get(product.id) || 0))}đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reusable Top Selling Section */}
      <TopSellingSection
        topOptions={topOptions}
        activeTopOption={topLimit}
        onOptionChange={setTopLimit}
        topByProfit={topByProfit}
        topByQuantity={topByQuantity}
        onOpenModal={openTopModal}
        layoutIdPrefix="stats-detail-top-selling"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <BarChart3 size={18} />
          <h3 className="text-sm font-bold uppercase">So sánh kỳ hiện tại</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
            <div className="text-amber-600 font-semibold uppercase mb-2">
              Kỳ hiện tại
            </div>
            <div className="space-y-1 text-amber-900">
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
        <div className="text-[11px] text-amber-500">
          So sánh theo cùng số ngày của kỳ đang chọn để dễ theo dõi biến động.
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-700">
          <TrendingUp size={18} />
          <h3 className="text-sm font-bold uppercase">Ý tưởng thêm</h3>
        </div>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
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
