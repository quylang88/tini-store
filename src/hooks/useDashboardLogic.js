import { useMemo, useState } from 'react';
import { getLatestUnitCost } from '../utils/purchaseUtils';

// Tạo label thời gian động theo tháng/năm hiện tại và tách bộ lọc cho dashboard vs chi tiết.
const buildRangeOptions = (mode = 'dashboard') => {
  const now = new Date();
  const monthLabel = `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearLabel = `Năm ${now.getFullYear()}`;

  if (mode === 'detail') {
    return [];
  }

  return [
    { id: 'month', label: monthLabel, days: 30 },
    { id: 'year', label: yearLabel, days: 365 },
    { id: 'all', label: 'Tất cả', days: null },
  ];
};
const TOP_OPTIONS = [
  { id: 3, label: 'Top 3' },
  { id: 5, label: 'Top 5' },
  { id: 10, label: 'Top 10' },
];

const useDashboardLogic = ({ products, orders, rangeMode = 'dashboard' }) => {
  const [activeRange, setActiveRange] = useState(rangeMode === 'detail' ? 'custom' : 'month');
  const [topLimit, setTopLimit] = useState(3);
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const rangeOptions = useMemo(() => buildRangeOptions(rangeMode), [rangeMode]);

  // Map giá vốn theo sản phẩm để tính lợi nhuận ổn định
  const costMap = useMemo(
    () => new Map(products.map(product => [product.id, getLatestUnitCost(product)])),
    [products],
  );

  // Chỉ lấy đơn đã thanh toán để tránh lệch doanh thu/lợi nhuận
  const paidOrders = useMemo(
    () => orders.filter(order => order.status === 'paid'),
    [orders],
  );

  const activeOption = useMemo(
    () => rangeOptions.find(option => option.id === activeRange) || rangeOptions[0],
    [activeRange, rangeOptions],
  );

  const rangeStart = useMemo(() => {
    if (activeRange === 'custom') {
      if (!customRange.start) return null;
      const start = new Date(customRange.start);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    if (!activeOption.days) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - activeOption.days + 1);
    return start;
  }, [activeOption, activeRange, customRange.start]);

  const rangeEnd = useMemo(() => {
    if (activeRange === 'custom') {
      if (!customRange.end) return null;
      const end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    if (!activeOption.days) return null;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }, [activeOption, activeRange, customRange.end]);

  const filteredPaidOrders = useMemo(() => {
    if (!rangeStart && !rangeEnd) return paidOrders;
    return paidOrders.filter(order => {
      const orderDate = new Date(order.date);
      if (rangeStart && orderDate < rangeStart) return false;
      if (rangeEnd && orderDate > rangeEnd) return false;
      return true;
    });
  }, [paidOrders, rangeStart, rangeEnd]);

  const productMeta = useMemo(
    () => new Map(products.map(product => [product.id, product])),
    [products],
  );

  const { totalRevenue, totalProfit, productStats } = useMemo(() => {
    const stats = new Map();
    let revenue = 0;
    let profit = 0;

    filteredPaidOrders.forEach(order => {
      revenue += order.total;
      const orderProfit = order.items.reduce((itemSum, item) => {
        const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
        const itemProfit = (item.price - cost) * item.quantity;

        const product = productMeta.get(item.productId);
        const key = item.productId || item.name;
        if (!stats.has(key)) {
          stats.set(key, {
            id: item.productId,
            name: item.name || product?.name || 'Sản phẩm khác',
            image: product?.image || '',
            quantity: 0,
            profit: 0,
          });
        }
        const entry = stats.get(key);
        entry.quantity += item.quantity;
        entry.profit += itemProfit;
        return itemSum + itemProfit;
      }, 0);
      const shippingFee = order.shippingFee || 0;
      profit += orderProfit - shippingFee;
    });
    return {
      totalRevenue: revenue,
      totalProfit: profit,
      productStats: Array.from(stats.values()),
    };
  }, [filteredPaidOrders, productMeta, costMap]);

  const topByProfit = useMemo(
    () => [...productStats]
      .filter(item => item.profit > 0 || item.quantity > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, topLimit),
    [productStats, topLimit],
  );

  const topByQuantity = useMemo(
    () => [...productStats]
      .filter(item => item.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, topLimit),
    [productStats, topLimit],
  );

  return {
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
    rangeDays: activeRange === 'custom' && rangeStart && rangeEnd
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
    topByProfit,
    topByQuantity,
  };
};

export default useDashboardLogic;
