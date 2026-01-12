import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Image as ImageIcon, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import useDashboardLogic from '../hooks/useDashboardLogic';

const Dashboard = ({ products, orders, onOpenSettings }) => {
  const {
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
  } = useDashboardLogic({ products, orders });

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between">
        <img
          src="/tiny-shop-transparent.png"
          alt="Tiny Shop"
          className="h-12 w-auto object-contain"
        />
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-white border border-amber-200 text-amber-700 flex items-center justify-center shadow-sm hover:bg-amber-50"
          aria-label="Mở cài đặt"
        >
          <Settings size={18} />
        </button>
      </div>
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

        <div className="bg-white text-amber-900 p-4 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <ShoppingCart size={18} />
            <span className="text-xs font-bold uppercase">Đơn hàng</span>
          </div>
          <div className="text-xl font-bold">{totalOrders}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-amber-800 text-sm uppercase">Thống kê theo tháng</h3>
          <span className="text-xs text-amber-500">6 tháng gần nhất</span>
        </div>

        {/* Biểu đồ cột đơn giản cho doanh thu và lợi nhuận */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          {monthlyChartData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs text-amber-700">
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
                    <div className="text-[10px] text-amber-700 text-center leading-tight">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-amber-500">Chưa có dữ liệu thống kê.</div>
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
                          <div className="text-sm font-semibold text-amber-900">{monthLabel(key)}</div>
                          <div className="text-xs text-amber-700">
                            Doanh thu: {formatNumber(stats.revenue)}đ • Lợi nhuận: {formatNumber(stats.profit)}đ
                          </div>
                          <div className="text-xs text-amber-500">Đơn: {stats.orders}</div>
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
                          <div className="text-[11px] font-semibold uppercase text-amber-500">Top sản phẩm</div>
                          {topItems.length > 0 ? (
                            topItems.map((item) => (
                              <div key={item.name} className="flex justify-between text-sm text-amber-800">
                                <span>{item.name} <span className="text-xs text-amber-500">x{item.quantity}</span></span>
                                <span className="font-medium">{formatNumber(item.revenue)}đ</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-amber-500">Không có dữ liệu chi tiết.</div>
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
        <h3 className="font-bold text-amber-800 mb-3 text-sm uppercase">Top bán chạy</h3>
        <div className="space-y-3">
          {topProducts.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="font-bold text-amber-300 w-4">#{idx + 1}</div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-amber-900">{p.name}</div>
                <div className="text-xs text-amber-700">Lợi nhuận: {formatNumber(p.profit)}đ</div>
              </div>
            </div>
          ))}
          {topProducts.length === 0 && <div className="text-center text-amber-500 text-sm">Chưa có dữ liệu bán hàng</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
