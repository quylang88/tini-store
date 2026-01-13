import React from 'react';
import { DollarSign, TrendingUp, Image as ImageIcon, ArrowUpRight } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import useDashboardLogic from '../hooks/useDashboardLogic';
import MetricCard from '../components/stats/MetricCard';
import OptionPills from '../components/stats/OptionPills';

const Dashboard = ({ products, orders, onOpenDetail }) => {
  const {
    rangeOptions,
    topOptions,
    topLimit,
    setTopLimit,
    activeRange,
    setActiveRange,
    totalRevenue,
    totalProfit,
    topByProfit,
    topByQuantity,
  } = useDashboardLogic({ products, orders, rangeMode: 'dashboard' });

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <img
          src="/tiny-shop-transparent.png"
          alt="Tiny Shop"
          className="h-12 w-auto object-contain"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        {/* Căn nút thống kê chi tiết cùng hàng với filter thời gian để tránh xuống dòng. */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <OptionPills
            options={rangeOptions}
            activeId={activeRange}
            onChange={setActiveRange}
            containerClassName="flex flex-wrap gap-2"
            buttonClassName="px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap"
            activeClassName="bg-amber-500 text-white border-amber-400 shadow-sm"
            inactiveClassName="bg-amber-50 text-amber-700 border-amber-100"
          />
          <button
            onClick={onOpenDetail}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full whitespace-nowrap"
          >
            Thống kê chi tiết
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={DollarSign}
          label="Doanh thu"
          value={`${formatNumber(totalRevenue)}đ`}
          className="bg-rose-400 shadow-rose-200"
        />

        <MetricCard
          icon={TrendingUp}
          label="Lợi nhuận"
          value={`${formatNumber(totalProfit)}đ`}
          className="bg-emerald-400 shadow-emerald-100"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-amber-800 text-sm uppercase">Top bán chạy</h3>
          <OptionPills
            options={topOptions}
            activeId={topLimit}
            onChange={setTopLimit}
            containerClassName="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar"
            buttonClassName="px-2 py-1 rounded-full text-[11px] font-semibold border transition"
            activeClassName="bg-rose-500 text-white border-rose-400 shadow-sm"
            inactiveClassName="bg-rose-50 text-rose-600 border-rose-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase text-amber-700">Theo lợi nhuận</h4>
            </div>
            <div className="space-y-3">
              {topByProfit.map((p, idx) => (
                <div key={p.id || p.name} className="flex items-center gap-3">
                  <div className="font-bold text-amber-400 w-4">#{idx + 1}</div>
                  <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-amber-100">
                    {p.image ? (
                      <img src={p.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-200"><ImageIcon size={16} /></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-amber-900">{p.name}</div>
                    <div className="text-xs text-amber-700">Lợi nhuận: {formatNumber(p.profit)}đ</div>
                  </div>
                </div>
              ))}
              {topByProfit.length === 0 && <div className="text-center text-amber-500 text-sm">Chưa có dữ liệu</div>}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase text-emerald-700">Theo số lượng</h4>
            </div>
            <div className="space-y-3">
              {topByQuantity.map((p, idx) => (
                <div key={p.id || p.name} className="flex items-center gap-3">
                  <div className="font-bold text-emerald-400 w-4">#{idx + 1}</div>
                  <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-emerald-100">
                    {p.image ? (
                      <img src={p.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-200"><ImageIcon size={16} /></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-emerald-900">{p.name}</div>
                    <div className="text-xs text-emerald-700">Số lượng: {p.quantity}</div>
                  </div>
                </div>
              ))}
              {topByQuantity.length === 0 && <div className="text-center text-emerald-500 text-sm">Chưa có dữ liệu</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
