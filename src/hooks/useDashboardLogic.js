import { useMemo, useState } from 'react';

const useDashboardLogic = ({ products, orders }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(null);

  // Map giá vốn theo sản phẩm để tính lợi nhuận ổn định
  const costMap = useMemo(
    () => new Map(products.map(product => [product.id, product.cost || 0])),
    [products],
  );

  // Chỉ lấy đơn đã thanh toán để tránh lệch doanh thu/lợi nhuận
  const paidOrders = useMemo(
    () => orders.filter(order => order.status === 'paid'),
    [orders],
  );

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, order) => sum + order.total, 0),
    [paidOrders],
  );

  const totalProfit = useMemo(
    () => paidOrders.reduce((sum, order) => {
      // Ưu tiên dùng giá vốn trong đơn để không bị lệch khi giá vốn thay đổi
      const orderProfit = order.items.reduce((itemSum, item) => {
        const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
        return itemSum + (item.price - cost) * item.quantity;
      }, 0);
      // Trừ phí gửi vì đây là chi phí phát sinh của đơn
      const shippingFee = order.shippingFee || 0;
      return sum + orderProfit - shippingFee;
    }, 0),
    [paidOrders, costMap],
  );

  const totalOrders = orders.length;

  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = (key) => {
    const [year, month] = key.split('-');
    return `Tháng ${month}/${year}`;
  };

  // Thống kê theo tháng để render bảng + biểu đồ
  const monthlyStats = useMemo(() => paidOrders.reduce((acc, order) => {
    const key = monthKey(new Date(order.date));
    if (!acc[key]) {
      acc[key] = { revenue: 0, profit: 0, orders: 0, items: {} };
    }
    const stats = acc[key];
    stats.revenue += order.total;
    stats.orders += 1;
    const orderProfit = order.items.reduce((sum, item) => {
      const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
      return sum + (item.price - cost) * item.quantity;
    }, 0);
    // Trừ phí gửi vì đây là chi phí phát sinh của đơn
    const shippingFee = order.shippingFee || 0;
    stats.profit += orderProfit - shippingFee;
    order.items.forEach((item) => {
      if (!stats.items[item.productId]) {
        stats.items[item.productId] = { name: item.name, quantity: 0, revenue: 0, profit: 0 };
      }
      stats.items[item.productId].quantity += item.quantity;
      stats.items[item.productId].revenue += item.price * item.quantity;
      const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
      stats.items[item.productId].profit += (item.price - cost) * item.quantity;
    });
    return acc;
  }, {}), [paidOrders, costMap]);

  const now = new Date();
  const currentKey = monthKey(now);
  const previousKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const olderMonths = useMemo(
    () => Object.keys(monthlyStats)
      .filter((key) => key !== currentKey && key !== previousKey)
      .sort((a, b) => new Date(`${b}-01`) - new Date(`${a}-01`)),
    [monthlyStats, currentKey, previousKey],
  );

  const getTopItems = (key) => {
    const stats = monthlyStats[key];
    if (!stats) return [];
    return Object.values(stats.items)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  };

  // Chuẩn bị dữ liệu biểu đồ thống kê theo tháng (tối đa 6 tháng gần nhất)
  const monthlyChartData = useMemo(
    () => Object.keys(monthlyStats)
      .sort((a, b) => new Date(`${a}-01`) - new Date(`${b}-01`))
      .slice(-6)
      .map((key) => ({
        key,
        label: monthLabel(key),
        revenue: monthlyStats[key].revenue,
        profit: monthlyStats[key].profit,
      })),
    [monthlyStats],
  );

  const chartMax = useMemo(
    () => Math.max(
      ...monthlyChartData.flatMap((item) => [item.revenue, item.profit]),
      1,
    ),
    [monthlyChartData],
  );

  // Logic tìm top 3 sản phẩm theo lợi nhuận
  const topProducts = useMemo(
    () => products.map(p => {
      // Chỉ tính lợi nhuận dựa trên đơn đã thanh toán
      const profit = paidOrders.reduce((acc, order) => {
        const item = order.items.find(i => i.productId === p.id);
        if (!item) return acc;
        const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
        return acc + (item.price - cost) * item.quantity;
      }, 0);
      return { ...p, profit };
    }).sort((a, b) => b.profit - a.profit).slice(0, 3),
    [products, paidOrders, costMap],
  );

  return {
    showHistory,
    setShowHistory,
    expandedMonth,
    setExpandedMonth,
    totalRevenue,
    totalProfit,
    totalOrders,
    monthLabel,
    monthlyStats,
    olderMonths,
    getTopItems,
    monthlyChartData,
    chartMax,
    topProducts,
  };
};

export default useDashboardLogic;
