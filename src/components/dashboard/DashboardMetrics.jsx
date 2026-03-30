import React, { memo } from "react";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArchiveX,
} from "lucide-react";
import { formatNumber } from "../../utils/formatters/formatUtils";
import MetricCard from "../stats/MetricCard";

const DashboardMetrics = ({
  totalRevenue,
  totalProfit,
  orderCount,
  totalCapital,
  outOfStockProducts,
  slowMovingProducts,
  isCalculating,
  onShowOutOfStock,
  onShowSlowMoving,
}) => {
  return (
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
        value={isCalculating ? "Đang tính..." : `${formatNumber(totalProfit)}đ`}
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
          onClick={onShowOutOfStock}
        />
      )}

      {slowMovingProducts.length >= 1 && (
        <MetricCard
          icon={AlertTriangle}
          label="Hàng tồn"
          value={slowMovingProducts.length}
          className="bg-violet-400 shadow-violet-200"
          onClick={onShowSlowMoving}
        />
      )}
    </div>
  );
};

export default memo(DashboardMetrics);
