import React, { useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { formatNumber } from '../utils/helpers';

const Dashboard = ({ products, orders }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(null);

  const costMap = new Map(products.map(product => [product.id, product.cost || 0]));
  // Chỉ tính doanh thu/lợi nhuận với đơn đã thanh toán để tránh âm do đơn chưa chốt
  const paidOrders = orders.filter(order => order.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const totalProfit = paidOrders.reduce((sum, order) => {
    // Ưu tiên dùng giá vốn đã lưu trong đơn để lợi nhuận không bị lệch khi giá vốn thay đổi
    const orderProfit = order.items.reduce((itemSum, item) => {
      const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
      return itemSum + (item.price - cost) * item.quantity;
    }, 0);
    // Trừ phí gửi vì đây là chi phí phát sinh của đơn
    const shippingFee = order.shippingFee || 0;
    return sum + orderProfit - shippingFee;
  }, 0);
  const totalOrders = orders.length;

  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = (key) => {
    const [year, month] = key.split('-');
    return `Tháng ${month}/${year}`;
  };

  const monthlyStats = paidOrders.reduce((acc, order) => {
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
  }, {});

  const now = new Date();
  const currentKey = monthKey(now);
  const previousKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const olderMonths = Object.keys(monthlyStats)
    .filter((key) => key !== currentKey && key !== previousKey)
    .sort((a, b) => new Date(`${b}-01`) - new Date(`${a}-01`));

  const getTopItems = (key) => {
    const stats = monthlyStats[key];
    if (!stats) return [];
    return Object.values(stats.items)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
  };

  // Chuẩn bị dữ liệu biểu đồ thống kê theo tháng (tối đa 6 tháng gần nhất)
  const monthlyChartData = Object.keys(monthlyStats)
    .sort((a, b) => new Date(`${a}-01`) - new Date(`${b}-01`))
    .slice(-6)
    .map((key) => ({
      key,
      label: monthLabel(key),
      revenue: monthlyStats[key].revenue,
      profit: monthlyStats[key].profit,
    }));
  const chartMax = Math.max(
    ...monthlyChartData.flatMap((item) => [item.revenue, item.profit]),
    1,
  );

  // Logic tìm top 3 sản phẩm theo lợi nhuận
  const topProducts = products.map(p => {
    // Chỉ tính lợi nhuận dựa trên đơn đã thanh toán
    const profit = paidOrders.reduce((acc, order) => {
      const item = order.items.find(i => i.productId === p.id);
      if (!item) return acc;
      const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
      return acc + (item.price - cost) * item.quantity;
    }, 0);
    return { ...p, profit };
  }).sort((a, b) => b.profit - a.profit).slice(0, 3);

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <img
        src="/tiny-shop-transparent.png"
        alt="Tiny Shop"
        className="h-12 w-auto object-contain"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-400 text-white p-4 rounded-2xl shadow-lg shadow-rose-200">
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <DollarSign size={18} />
            <span className="text-xs font-bold uppercase">Doanh thu</span>
          </div>
          <div className="text-xl font-bold">{formatNumber(totalRevenue)}đ</div>
        </div>

        <div className="bg-emerald-400 text-white p-4 rounded-2xl shadow-lg shadow-emerald-100">
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase">Lợi nhuận</span>
          </div>
          <div className="text-xl font-bold">{formatNumber(totalProfit)}đ</div>
        </div>

        <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <ShoppingCart size={18} />
            <span className="text-xs font-bold uppercase">Đơn hàng</span>
          </div>
          <div className="text-xl font-bold">{totalOrders}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-700 text-sm uppercase">Thống kê theo tháng</h3>
          <span className="text-xs text-gray-400">6 tháng gần nhất</span>
        </div>

        {/* Biểu đồ cột đơn giản cho doanh thu và lợi nhuận */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          {monthlyChartData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-rose-300"></span>
                  <span>Doanh thu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-300"></span>
                  <span>Lợi nhuận</span>
                </div>
              </div>
              <div className="flex items-end gap-3 h-44">
                {monthlyChartData.map((item) => (
                  <div key={item.key} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end gap-1 h-36">
                      <div
                        className="flex-1 bg-rose-300 rounded-t-md"
                        style={{ height: `${(item.revenue / chartMax) * 100}%` }}
                        title={`Doanh thu: ${formatNumber(item.revenue)}đ`}
                      />
                      <div
                        className="flex-1 bg-emerald-300 rounded-t-md"
                        style={{ height: `${(item.profit / chartMax) * 100}%` }}
                        title={`Lợi nhuận: ${formatNumber(item.profit)}đ`}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 text-center leading-tight">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-gray-400">Chưa có dữ liệu thống kê.</div>
          )}
        </div>

        {olderMonths.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className="w-full flex items-center justify-between text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2"
            >
              <span>{showHistory ? 'Ẩn thống kê các tháng trước' : 'Xem thống kê các tháng trước'}</span>
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showHistory && (
              <div className="mt-3 space-y-3">
                {olderMonths.map((key) => {
                  const stats = monthlyStats[key];
                  const isExpanded = expandedMonth === key;
                  const topItems = getTopItems(key);
                  return (
                    <div key={key} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{monthLabel(key)}</div>
                          <div className="text-xs text-gray-500">
                            Doanh thu: {formatNumber(stats.revenue)}đ • Lợi nhuận: {formatNumber(stats.profit)}đ
                          </div>
                          <div className="text-xs text-gray-400">Đơn: {stats.orders}</div>
                        </div>
                        <button
                          onClick={() => setExpandedMonth(isExpanded ? null : key)}
                          className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg"
                        >
                          {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 border-t border-dashed border-gray-200 pt-3 space-y-2">
                          <div className="text-[11px] font-semibold uppercase text-gray-400">Top sản phẩm</div>
                          {topItems.length > 0 ? (
                            topItems.map((item) => (
                              <div key={item.name} className="flex justify-between text-sm text-gray-600">
                                <span>{item.name} <span className="text-xs text-gray-400">x{item.quantity}</span></span>
                                <span className="font-medium">{formatNumber(item.revenue)}đ</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400">Không có dữ liệu chi tiết.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Top bán chạy</h3>
        <div className="space-y-3">
          {topProducts.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="font-bold text-gray-300 w-4">#{idx + 1}</div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500">Lợi nhuận: {formatNumber(p.profit)}đ</div>
              </div>
            </div>
          ))}
          {topProducts.length === 0 && <div className="text-center text-gray-400 text-sm">Chưa có dữ liệu bán hàng</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;