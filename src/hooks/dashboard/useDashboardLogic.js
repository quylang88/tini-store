import { useMemo, useState } from "react";
import {
  getProductStats,
  getOldestActiveLot,
} from "../../utils/inventory/purchaseUtils";

// Tạo label thời gian động theo tháng/năm hiện tại và tách bộ lọc cho dashboard vs chi tiết.
const buildRangeOptions = (mode = "dashboard", now) => {
  if (!now) return [];

  const monthLabel = `Tháng ${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearLabel = `Năm ${now.getFullYear()}`;

  if (mode === "detail") {
    return [];
  }

  return [
    { id: "month", label: monthLabel, days: 30 },
    { id: "year", label: yearLabel, days: 365 },
    { id: "all", label: "Tất cả", days: null },
  ];
};
const TOP_OPTIONS = [
  { id: 3, label: "Top 3" },
  { id: 5, label: "Top 5" },
  { id: 10, label: "Top 10" },
];

const useDashboardLogic = ({ products, orders, rangeMode = "dashboard" }) => {
  // Trạng thái ngày tập trung. Sử dụng khởi tạo lười (lazy initialization) để đặt "now" khi mount.
  // Mặc dù new Date() về kỹ thuật là không tinh khiết (impure), nhưng nó ổn định sau lần render đầu tiên.
  const [currentDate] = useState(() => new Date());

  const [activeRange, setActiveRange] = useState(
    rangeMode === "detail" ? "custom" : "month",
  );
  const [topLimit, setTopLimit] = useState(3);
  const [customRange, setCustomRange] = useState({ start: null, end: null });

  const rangeOptions = useMemo(
    () => buildRangeOptions(rangeMode, currentDate),
    [rangeMode, currentDate],
  );

  // Cache for stats per product reference to avoid recalculation on re-renders.
  const [statsCache, setStatsCache] = useState(() => new WeakMap());
  const [lastDate, setLastDate] = useState(currentDate);

  if (currentDate !== lastDate) {
    setLastDate(currentDate);
    setStatsCache(new WeakMap());
  }

  // Unified Inventory Stats Calculation
  // Consolidates multiple iterations over `products` into a single pass (O(N)).
  const {
    costMap,
    productMeta,
    totalCapital,
    slowMovingProducts,
    outOfStockProducts,
  } = useMemo(() => {
    const cache = statsCache;

    const costMap = new Map();
    const productMeta = new Map();
    const slowMoving = [];
    const outOfStock = [];
    let capital = 0;

    const warningDays = 60;
    const nowTime = currentDate.getTime();

    for (const product of products) {
      let stats = cache.get(product);

      if (!stats) {
        const { unitCost } = getProductStats(product);
        const stock = product.stock || 0;
        let capitalContribution = 0;
        let isOutOfStock = false;
        let slowMovingEntry = null;

        if (stock <= 0) {
          isOutOfStock = true;
        } else {
          // Capital calculation
          if (product.purchaseLots && product.purchaseLots.length > 0) {
            let lotSum = 0;
            for (const lot of product.purchaseLots) {
              const qty = Number(lot.quantity) || 0;
              const cost = Number(lot.cost) || 0;
              lotSum += qty * cost;
            }
            capitalContribution = lotSum;
          } else {
            capitalContribution = stock * unitCost;
          }

          // Slow Moving calculation
          if (currentDate) {
            let dateToCheckTime = nowTime;
            if (product.createdAt) {
              dateToCheckTime = new Date(product.createdAt).getTime();
            }

            const oldestLot = getOldestActiveLot(product);
            if (oldestLot && oldestLot.createdAt) {
              dateToCheckTime = new Date(oldestLot.createdAt).getTime();
            }

            const diffTime = Math.abs(nowTime - dateToCheckTime);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > warningDays) {
              slowMovingEntry = { ...product, daysNoSale: diffDays };
            }
          }
        }

        stats = {
          unitCost,
          capitalContribution,
          isOutOfStock,
          slowMovingEntry,
        };
        cache.set(product, stats);
      }

      // Apply stats
      costMap.set(product.id, stats.unitCost);
      productMeta.set(product.id, product);

      if (stats.isOutOfStock) {
        outOfStock.push(product);
      } else {
        capital += stats.capitalContribution;
        if (stats.slowMovingEntry) {
          slowMoving.push(stats.slowMovingEntry);
        }
      }
    }

    // Sort slow moving products
    slowMoving.sort((a, b) => b.daysNoSale - a.daysNoSale);

    return {
      costMap,
      productMeta,
      totalCapital: capital,
      slowMovingProducts: slowMoving,
      outOfStockProducts: outOfStock,
    };
  }, [products, currentDate, statsCache]);

  // Chỉ lấy đơn đã thanh toán để tránh lệch doanh thu/lợi nhuận
  const paidOrders = useMemo(
    () => orders.filter((order) => order.status === "paid"),
    [orders],
  );

  const activeOption = useMemo(
    () =>
      rangeOptions.find((option) => option.id === activeRange) ||
      rangeOptions[0] || { days: null },
    [activeRange, rangeOptions],
  );

  const rangeStart = useMemo(() => {
    if (activeRange === "custom") {
      if (!customRange.start) return null;
      const start = new Date(customRange.start);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (!activeOption.days || !currentDate) return null;
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - activeOption.days + 1);
    return start;
  }, [activeOption, activeRange, customRange.start, currentDate]);

  const rangeEnd = useMemo(() => {
    if (activeRange === "custom") {
      if (!customRange.end) return null;
      const end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    if (!activeOption.days || !currentDate) return null;
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [activeOption, activeRange, customRange.end, currentDate]);

  const filteredPaidOrders = useMemo(() => {
    if (!rangeStart && !rangeEnd) return paidOrders;

    // Convert Date objects to ISO strings once (outside the loop) to enable fast string comparison.
    // This assumes order.date is always in ISO 8601 format (e.g. from new Date().toISOString()),
    // which allows direct lexicographical comparison.
    const startISO = rangeStart ? rangeStart.toISOString() : null;
    const endISO = rangeEnd ? rangeEnd.toISOString() : null;

    return paidOrders.filter((order) => {
      if (startISO && order.date < startISO) return false;
      if (endISO && order.date > endISO) return false;
      return true;
    });
  }, [paidOrders, rangeStart, rangeEnd]);

  // Unified Revenue & Profit & Stats Calculation
  // Consolidates multiple iterations over `orders` into a single pass (O(N)) for performance.
  const { totalRevenue, totalProfit, productStats } = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    const stats = new Map();

    for (const order of filteredPaidOrders) {
      revenue += order.total;

      let orderProfit = 0;
      const shippingFee = order.shippingFee || 0;

      for (const item of order.items) {
        // Calculate item profit
        const cost = Number.isFinite(item.cost)
          ? item.cost
          : costMap.get(item.productId) || 0;
        const itemProfit = (item.price - cost) * item.quantity;

        orderProfit += itemProfit;

        // Update product stats
        const key = item.productId || item.name;
        let entry = stats.get(key);

        if (!entry) {
          const product = productMeta.get(item.productId);
          entry = {
            id: item.productId,
            name: product?.name || item.name || "Sản phẩm khác",
            image: product?.image || "",
            quantity: 0,
            profit: 0,
          };
          stats.set(key, entry);
        }

        entry.quantity += item.quantity;
        entry.profit += itemProfit;
      }

      // Trừ phí gửi vì đây là chi phí phát sinh của đơn
      profit += orderProfit - shippingFee;
    }

    return {
      totalRevenue: revenue,
      totalProfit: profit,
      productStats: Array.from(stats.values()),
    };
  }, [filteredPaidOrders, costMap, productMeta]);

  const topByProfit = useMemo(
    () =>
      [...productStats]
        .filter((item) => item.profit > 0 || item.quantity > 0)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, topLimit),
    [productStats, topLimit],
  );

  const topByQuantity = useMemo(
    () =>
      [...productStats]
        .filter((item) => item.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, topLimit),
    [productStats, topLimit],
  );

  return {
    currentDate, // Trả về giá trị này để các component tiêu thụ có thể sử dụng cùng một tham chiếu
    rangeOptions,
    topOptions: TOP_OPTIONS,
    topLimit,
    setTopLimit,
    activeRange,
    setActiveRange,
    customRange,
    setCustomRange,
    rangeStart,
    rangeEnd,
    rangeDays:
      activeRange === "custom" && rangeStart && rangeEnd
        ? (() => {
            const startDay = new Date(rangeStart);
            const endDay = new Date(rangeEnd);
            startDay.setHours(0, 0, 0, 0);
            endDay.setHours(0, 0, 0, 0);
            return Math.max(1, Math.round((endDay - startDay) / 86400000) + 1);
          })()
        : (activeOption?.days ?? null),
    paidOrders,
    filteredPaidOrders,
    totalRevenue,
    totalProfit,
    totalCapital, // Đã export
    slowMovingProducts, // Đã export
    outOfStockProducts, // Đã export: Danh sách hết hàng
    topByProfit,
    topByQuantity,
  };
};

export default useDashboardLogic;
