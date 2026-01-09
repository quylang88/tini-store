import React, { useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { formatNumber } from '../utils/helpers';

const Dashboard = ({ products, orders }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState(null);

  const costMap = new Map(products.map(product => [product.id, product.cost || 0]));
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalProfit = orders.reduce((sum, order) => {
    const orderProfit = order.items.reduce((itemSum, item) => {
      const cost = costMap.get(item.productId) || 0;
      return itemSum + (item.price - cost) * item.quantity;
    }, 0);
    return sum + orderProfit;
  }, 0);
  const totalOrders = orders.length;

  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = (key) => {
    const [year, month] = key.split('-');
    return `Tháng ${month}/${year}`;
  };

  const monthlyStats = orders.reduce((acc, order) => {
    const key = monthKey(new Date(order.date));
    if (!acc[key]) {
      acc[key] = { revenue: 0, profit: 0, orders: 0, items: {} };
    }
    const stats = acc[key];
    stats.revenue += order.total;
    stats.orders += 1;
    const orderProfit = order.items.reduce((sum, item) => {
      const cost = costMap.get(item.productId) || 0;
      return sum + (item.price - cost) * item.quantity;
    }, 0);
    stats.profit += orderProfit;
    order.items.forEach((item) => {
      if (!stats.items[item.productId]) {
        stats.items[item.productId] = { name: item.name, quantity: 0, revenue: 0, profit: 0 };
      }
      stats.items[item.productId].quantity += item.quantity;
      stats.items[item.productId].revenue += item.price * item.quantity;
      const cost = costMap.get(item.productId) || 0;
      stats.items[item.productId].profit += (item.price - cost) * item.quantity;
    });
    return acc;
  }, {});

  const now = new Date();
  const currentKey = monthKey(now);
  const previousKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const currentStats = monthlyStats[currentKey] || { revenue: 0, profit: 0, orders: 0, items: {} };
  const previousStats = monthlyStats[previousKey] || { revenue: 0, profit: 0, orders: 0, items: {} };

  const revenueDelta = currentStats.revenue - previousStats.revenue;
  const profitDelta = currentStats.profit - previousStats.profit;
  const revenuePercent = previousStats.revenue ? (revenueDelta / previousStats.revenue) * 100 : null;
  const profitPercent = previousStats.profit ? (profitDelta / previousStats.profit) * 100 : null;

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

  // Logic tìm top 3 sản phẩm bán chạy
  const topProducts = products.map(p => {
    const sold = orders.reduce((acc, order) => {
      const item = order.items.find(i => i.productId === p.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    return { ...p, sold };
  }).sort((a, b) => b.sold - a.sold).slice(0, 3);

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Tổng Quan Shop</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <DollarSign size={18} />
            <span className="text-xs font-bold uppercase">Doanh thu</span>
          </div>
          <div className="text-xl font-bold">{formatNumber(totalRevenue)}đ</div>
        </div>

        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-100">
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
          <span className="text-xs text-gray-400">{monthLabel(currentKey)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <div className="text-[11px] text-gray-500 font-semibold uppercase">Tháng này</div>
            <div className="text-lg font-bold text-gray-800 mt-2">{formatNumber(currentStats.revenue)}đ</div>
            <div className="text-xs text-gray-500 mt-1">
              Lợi nhuận: <span className="font-semibold text-emerald-600">{formatNumber(currentStats.profit)}đ</span>
            </div>
            <div className="text-xs text-gray-400">Đơn: {currentStats.orders}</div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <div className="text-[11px] text-indigo-600 font-semibold uppercase">So với tháng trước</div>
            <div className="text-sm text-gray-700 mt-2">
              Doanh thu: <span className={`font-semibold ${revenueDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {revenueDelta >= 0 ? '+' : ''}{formatNumber(revenueDelta)}đ
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {revenuePercent === null ? 'Chưa có dữ liệu tháng trước' : `${revenuePercent >= 0 ? '+' : ''}${revenuePercent.toFixed(1)}%`}
            </div>
            <div className="text-sm text-gray-700 mt-2">
              Lợi nhuận: <span className={`font-semibold ${profitDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {profitDelta >= 0 ? '+' : ''}{formatNumber(profitDelta)}đ
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {profitPercent === null ? 'Chưa có dữ liệu tháng trước' : `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}%`}
            </div>
          </div>
        </div>

        {olderMonths.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className="w-full flex items-center justify-between text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2"
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
                          className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
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
                <div className="text-xs text-gray-500">Đã bán: {p.sold}</div>
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