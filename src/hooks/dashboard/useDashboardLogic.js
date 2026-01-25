import { useMemo, useState } from "react";
import { getLatestUnitCost } from "../../utils/inventory/purchaseUtils";

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
      const unitCost = getLatestUnitCost(product);
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

          if (product.purchaseLots && product.purchaseLots.length > 0) {
            let oldestLot = null;
            for (const lot of product.purchaseLots) {
              const qty = Number(lot.quantity) || 0;
              if (qty > 0) {
                if (!oldestLot) {
                  oldestLot = lot;
                } else if (lot.createdAt < oldestLot.createdAt) {
                  // Direct string comparison is efficient for ISO dates
                  oldestLot = lot;
                }
              }
            }

            if (oldestLot && oldestLot.createdAt) {
              dateToCheckTime = new Date(oldestLot.createdAt).getTime();
            }
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
    return paidOrders.filter((order) => {
      const orderDate = new Date(order.date);
      if (rangeStart && orderDate < rangeStart) return false;
      if (rangeEnd && orderDate > rangeEnd) return false;
      return true;
    });
  }, [paidOrders, rangeStart, rangeEnd]);

  const totalRevenue = useMemo(
    () => filteredPaidOrders.reduce((sum, order) => sum + order.total, 0),
    [filteredPaidOrders],
  );

  const totalProfit = useMemo(
    () =>
      filteredPaidOrders.reduce((sum, order) => {
        // Ưu tiên dùng giá vốn trong đơn để không bị lệch khi giá vốn thay đổi
        const orderProfit = order.items.reduce((itemSum, item) => {
          const cost = Number.isFinite(item.cost)
            ? item.cost
            : costMap.get(item.productId) || 0;
          return itemSum + (item.price - cost) * item.quantity;
        }, 0);
        // Trừ phí gửi vì đây là chi phí phát sinh của đơn
        const shippingFee = order.shippingFee || 0;
        return sum + orderProfit - shippingFee;
      }, 0),
    [filteredPaidOrders, costMap],
  );

  const productStats = useMemo(() => {
    const stats = new Map();
    filteredPaidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = productMeta.get(item.productId);
        const key = item.productId || item.name;
        if (!stats.has(key)) {
          stats.set(key, {
            id: item.productId,
            name: product?.name || item.name || "Sản phẩm khác",
            image: product?.image || "",
            quantity: 0,
            profit: 0,
          });
        }
        const entry = stats.get(key);
        const cost = Number.isFinite(item.cost)
          ? item.cost
          : costMap.get(item.productId) || 0;
        entry.quantity += item.quantity;
        entry.profit += (item.price - cost) * item.quantity;
      });
    });
    return Array.from(stats.values());
  }, [filteredPaidOrders, productMeta, costMap]);

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
