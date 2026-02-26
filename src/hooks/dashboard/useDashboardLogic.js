import { useMemo, useState, useEffect } from "react";
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

  // Unified Inventory Stats Calculation
  // Consolidates multiple iterations over `products` into a single pass (O(N)).
  const {
    costMap,
    productMeta,
    totalCapital,
    slowMovingProducts,
    outOfStockProducts,
  } = useMemo(() => {
    const costMap = new Map();
    const productMeta = new Map();
    const slowMoving = [];
    const outOfStock = [];
    let capital = 0;

    const warningDays = 60;
    const nowTime = currentDate.getTime();

    for (const product of products) {
      // 1. Cost Map
      const { unitCost } = getProductStats(product);
      costMap.set(product.id, unitCost);

      // 2. Product Meta
      productMeta.set(product.id, product);

      const stock = product.stock || 0;

      // 3. Out of Stock
      if (stock <= 0) {
        outOfStock.push(product);
        // Continue is removed because we still want to process costMap and productMeta
        // But capital and slow moving require stock > 0
      } else {
        // 4. Total Capital
        if (product.purchaseLots && product.purchaseLots.length > 0) {
          // Use for...of loop for slightly better performance than reduce
          let lotSum = 0;
          for (const lot of product.purchaseLots) {
            const qty = Number(lot.quantity) || 0;
            const cost = Number(lot.cost) || 0;
            lotSum += qty * cost;
          }
          capital += lotSum;
        } else {
          // Fallback to latest unit cost
          capital += stock * unitCost;
        }

        // 5. Slow Moving Products
        if (currentDate) {
          let dateToCheckTime = nowTime;
          // If createdAt exists, start with it
          if (product.createdAt) {
            dateToCheckTime = new Date(product.createdAt).getTime();
          }

          // Optimization: Use memoized O(1) lookup instead of O(N) loop
          const oldestLot = getOldestActiveLot(product);
          if (oldestLot && oldestLot.createdAt) {
            dateToCheckTime = new Date(oldestLot.createdAt).getTime();
          }

          const diffTime = Math.abs(nowTime - dateToCheckTime);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > warningDays) {
            slowMoving.push({ ...product, daysNoSale: diffDays });
          }
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
  }, [products, currentDate]);

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
  // Updated to use Async Chunked Processing to prevent blocking the main thread.
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    productStats: [],
  });
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const CHUNK_SIZE = 2000;
    const SYNC_THRESHOLD = 1000;

    const processChunk = (orders, currentStats) => {
      let { revenue, profit, statsObj } = currentStats;

      for (const order of orders) {
        revenue += order.total;
        let orderProfit = 0;
        const shippingFee = order.shippingFee || 0;

        for (const item of order.items) {
          const cost = Number.isFinite(item.cost)
            ? item.cost
            : costMap.get(item.productId) || 0;
          const itemProfit = (item.price - cost) * item.quantity;
          orderProfit += itemProfit;

          const key = item.productId || item.name;
          if (!statsObj[key]) {
            const product = productMeta.get(item.productId);
            statsObj[key] = {
              id: item.productId,
              name: product?.name || item.name || "Sản phẩm khác",
              image: product?.image || "",
              quantity: 0,
              profit: 0,
            };
          }
          statsObj[key].quantity += item.quantity;
          statsObj[key].profit += itemProfit;
        }
        profit += orderProfit - shippingFee;
      }
      return { revenue, profit, statsObj };
    };

    const calculate = async () => {
      // Small dataset: Synchronous execution to avoid flicker
      if (filteredPaidOrders.length <= SYNC_THRESHOLD) {
        const result = processChunk(filteredPaidOrders, {
          revenue: 0,
          profit: 0,
          statsObj: {},
        });
        if (!isCancelled) {
          setStats({
            totalRevenue: result.revenue,
            totalProfit: result.profit,
            productStats: Object.values(result.statsObj),
          });
          setIsCalculating(false);
        }
        return;
      }

      // Large dataset: Async execution with yielding
      setIsCalculating(true);
      await new Promise((r) => setTimeout(r, 0)); // Yield before starting
      if (isCancelled) return;

      let currentStats = { revenue: 0, profit: 0, statsObj: {} };

      for (let i = 0; i < filteredPaidOrders.length; i += CHUNK_SIZE) {
        if (isCancelled) return;
        const chunk = filteredPaidOrders.slice(i, i + CHUNK_SIZE);
        currentStats = processChunk(chunk, currentStats);

        // Yield to main thread
        await new Promise((r) => setTimeout(r, 0));
      }

      if (!isCancelled) {
        setStats({
          totalRevenue: currentStats.revenue,
          totalProfit: currentStats.profit,
          productStats: Object.values(currentStats.statsObj),
        });
        setIsCalculating(false);
      }
    };

    calculate();

    return () => {
      isCancelled = true;
    };
  }, [filteredPaidOrders, costMap, productMeta]);

  const { totalRevenue, totalProfit, productStats } = stats;

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
    isCalculating, // Expose loading state
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
