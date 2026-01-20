import { useMemo, useState } from "react";
import { getLatestUnitCost } from "../utils/purchaseUtils";

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

  // Map giá vốn theo sản phẩm để tính lợi nhuận ổn định
  const costMap = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, getLatestUnitCost(product)]),
      ),
    [products],
  );

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

  // --- Logic mới cho Vốn & Hàng tồn lâu ---

  // Tính Tổng Vốn Tồn Kho
  // Logic CŨ: Tổng của (tồn kho * giá nhập mới nhất) cho tất cả sản phẩm
  // Logic MỚI: Tính theo từng lô (purchaseLots)
  const totalCapital = useMemo(() => {
    return products.reduce((sum, product) => {
      const stock = product.stock || 0;
      if (stock <= 0) return sum;

      // Nếu có purchaseLots, tính chính xác từng lô
      if (product.purchaseLots && product.purchaseLots.length > 0) {
        const lotSum = product.purchaseLots.reduce((lSum, lot) => {
          const qty = Number(lot.quantity) || 0;
          const cost = Number(lot.cost) || 0;
          return lSum + qty * cost;
        }, 0);
        return sum + lotSum;
      }

      // Fallback nếu chưa có lots: dùng giá nhập mới nhất (costMap)
      const cost = costMap.get(product.id) || 0;
      return sum + stock * cost;
    }, 0);
  }, [products, costMap]);

  // Tính Hàng Tồn Kho Lâu (Slow Moving)
  // Logic MỚI: "tính từ ngày nhập hàng xa nhất mà hàng đó còn tồn + 60 ngày"
  const slowMovingProducts = useMemo(() => {
    if (!currentDate) return [];
    const warningDays = 60;

    return products
      .filter((p) => (p.stock || 0) > 0)
      .map((p) => {
        let dateToCheck = new Date(p.createdAt || currentDate.getTime());

        // Tìm lô cũ nhất còn hàng (quantity > 0)
        if (p.purchaseLots && p.purchaseLots.length > 0) {
          // Lọc các lô còn hàng
          const activeLots = p.purchaseLots.filter(
            (l) => (Number(l.quantity) || 0) > 0,
          );
          if (activeLots.length > 0) {
            // Sắp xếp theo ngày tạo (cũ nhất đầu tiên)
            activeLots.sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            );
            const oldestLot = activeLots[0];
            if (oldestLot.createdAt) {
              dateToCheck = new Date(oldestLot.createdAt);
            }
          }
        }

        const diffTime = Math.abs(currentDate - dateToCheck);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...p,
          daysNoSale: diffDays,
          lastImportDate: dateToCheck, // Dùng để debug hoặc hiển thị
        };
      })
      .filter((p) => p.daysNoSale > warningDays)
      .sort((a, b) => b.daysNoSale - a.daysNoSale);
  }, [products, currentDate]);

  // Tính Hàng Hết Hàng (Out of Stock)
  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => (p.stock || 0) <= 0);
  }, [products]);

  // --- Kết thúc Logic mới ---

  const productMeta = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
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
