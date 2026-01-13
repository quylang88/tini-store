import { useMemo, useState } from 'react';
import { getLatestUnitCost } from '../utils/purchaseUtils';

const RANGE_OPTIONS = [
  { id: 'month', label: '1 tháng', days: 30 },
  { id: 'quarter', label: '1 quý', days: 90 },
  { id: 'year', label: '1 năm', days: 365 },
  { id: 'all', label: 'Tất cả', days: null },
];

const useDashboardLogic = ({ products, orders }) => {
  const [activeRange, setActiveRange] = useState('month');

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
    () => RANGE_OPTIONS.find(option => option.id === activeRange) || RANGE_OPTIONS[0],
    [activeRange],
  );

  const rangeStart = useMemo(() => {
    if (!activeOption.days) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - activeOption.days + 1);
    return start;
  }, [activeOption]);

  const filteredPaidOrders = useMemo(() => {
    if (!rangeStart) return paidOrders;
    return paidOrders.filter(order => new Date(order.date) >= rangeStart);
  }, [paidOrders, rangeStart]);

  const totalRevenue = useMemo(
    () => filteredPaidOrders.reduce((sum, order) => sum + order.total, 0),
    [filteredPaidOrders],
  );

  const totalProfit = useMemo(
    () => filteredPaidOrders.reduce((sum, order) => {
      // Ưu tiên dùng giá vốn trong đơn để không bị lệch khi giá vốn thay đổi
      const orderProfit = order.items.reduce((itemSum, item) => {
        const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
        return itemSum + (item.price - cost) * item.quantity;
      }, 0);
      // Trừ phí gửi vì đây là chi phí phát sinh của đơn
      const shippingFee = order.shippingFee || 0;
      return sum + orderProfit - shippingFee;
    }, 0),
    [filteredPaidOrders, costMap],
  );

  const productMeta = useMemo(
    () => new Map(products.map(product => [product.id, product])),
    [products],
  );

  const productStats = useMemo(() => {
    const stats = new Map();
    filteredPaidOrders.forEach(order => {
      order.items.forEach(item => {
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
        const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
        entry.quantity += item.quantity;
        entry.profit += (item.price - cost) * item.quantity;
      });
    });
    return Array.from(stats.values());
  }, [filteredPaidOrders, productMeta, costMap]);

  const topByProfit = useMemo(
    () => [...productStats]
      .filter(item => item.profit > 0 || item.quantity > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3),
    [productStats],
  );

  const topByQuantity = useMemo(
    () => [...productStats]
      .filter(item => item.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3),
    [productStats],
  );

  return {
    rangeOptions: RANGE_OPTIONS,
    activeRange,
    setActiveRange,
    filteredPaidOrders,
    totalRevenue,
    totalProfit,
    topByProfit,
    topByQuantity,
  };
};

export default useDashboardLogic;
