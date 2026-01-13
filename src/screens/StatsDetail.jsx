import React from 'react';
import { ArrowLeft, BarChart3, Layers3, TrendingUp, Wallet } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import useDashboardLogic from '../hooks/useDashboardLogic';

const StatsDetail = ({ products, orders, onBack }) => {
  const {
    rangeOptions,
    activeRange,
    setActiveRange,
    filteredPaidOrders,
    totalRevenue,
    totalProfit,
    topByProfit,
    topByQuantity,
  } = useDashboardLogic({ products, orders });

  const orderCount = filteredPaidOrders.length;
  const avgOrder = orderCount ? totalRevenue / orderCount : 0;
  const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-amber-100 bg-white text-amber-600 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="text-xs text-amber-500 uppercase font-semibold">Thống kê chi tiết</div>
          <div className="text-sm font-bold text-amber-900">Phân tích doanh thu & lợi nhuận</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        <div className="flex flex-wrap gap-2">
          {rangeOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setActiveRange(option.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${activeRange === option.id
                ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-400 text-white p-4 rounded-2xl shadow-lg shadow-rose-200">
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <Wallet size={18} />
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
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-amber-500 uppercase font-semibold">Số đơn</div>
              <div className="text-lg font-bold text-amber-900">{orderCount}</div>
            </div>
            <div>
              <div className="text-amber-500 uppercase font-semibold">Giá trị TB</div>
              <div className="text-lg font-bold text-amber-900">{formatNumber(avgOrder)}đ</div>
            </div>
            <div>
              <div className="text-amber-500 uppercase font-semibold">Biên lợi nhuận</div>
              <div className="text-lg font-bold text-amber-900">{profitMargin.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <BarChart3 size={18} />
          <h3 className="text-sm font-bold uppercase">Xu hướng doanh thu</h3>
        </div>
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-700">
          Gợi ý: biểu đồ đường theo ngày/tuần, hiển thị đỉnh doanh thu và ngày thấp nhất.
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <Layers3 size={18} />
          <h3 className="text-sm font-bold uppercase">Phân rã lợi nhuận</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
            <div className="text-xs font-semibold uppercase text-rose-600 mb-2">Top theo lợi nhuận</div>
            <div className="space-y-2 text-sm text-rose-800">
              {topByProfit.map(item => (
                <div key={item.id || item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-semibold">{formatNumber(item.profit)}đ</span>
                </div>
              ))}
              {topByProfit.length === 0 && <div className="text-xs text-rose-400">Chưa có dữ liệu</div>}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <div className="text-xs font-semibold uppercase text-emerald-600 mb-2">Top theo số lượng</div>
            <div className="space-y-2 text-sm text-emerald-800">
              {topByQuantity.map(item => (
                <div key={item.id || item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-semibold">x{item.quantity}</span>
                </div>
              ))}
              {topByQuantity.length === 0 && <div className="text-xs text-emerald-400">Chưa có dữ liệu</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-700">
          <TrendingUp size={18} />
          <h3 className="text-sm font-bold uppercase">Ý tưởng thêm</h3>
        </div>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Tỉ trọng doanh thu theo danh mục/sản phẩm và mức tăng trưởng theo kỳ.</li>
          <li>So sánh chi phí vận chuyển & chiết khấu theo từng kênh bán.</li>
          <li>Bản đồ nhiệt ngày/giờ có nhiều đơn để tối ưu lịch chạy ads.</li>
          <li>Danh sách đơn hoàn/hủy để theo dõi lý do thất thoát.</li>
        </ul>
      </div>
    </div>
  );
};

export default StatsDetail;
