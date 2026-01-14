import React, { useState } from 'react';
import { ArrowUpRight, DollarSign, TrendingUp, Trophy } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import useDashboardLogic from '../hooks/useDashboardLogic';
import MetricCard from '../components/stats/MetricCard';
import OptionPills from '../components/stats/OptionPills';
import RankBadge from '../components/stats/RankBadge';
import TopListModal from '../components/stats/TopListModal';

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

  const [activeModal, setActiveModal] = useState(null);

  const openTopModal = (type) => setActiveModal(type);
  const closeTopModal = () => setActiveModal(null);

  const modalTitle = activeModal === 'quantity' ? 'Top số lượng' : 'Top lợi nhuận';
  const modalItems = activeModal === 'quantity' ? topByQuantity : topByProfit;

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
        {/* Căn bộ lọc thời gian gọn trong thẻ riêng để dành chỗ cho nút nổi phía dưới. */}
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
          <div className="flex items-center gap-2 text-amber-700">
            <Trophy size={18} />
            <h3 className="font-bold text-amber-800 text-sm uppercase">Top bán chạy</h3>
          </div>
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
          <button
            type="button"
            onClick={() => openTopModal('profit')}
            className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-left transition hover:bg-rose-50 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase text-rose-600">Top lợi nhuận</h4>
            </div>
            <div className="space-y-2 text-sm text-rose-800">
              {topByProfit.map((p, idx) => (
                <div key={p.id || p.name} className="flex items-center gap-2">
                  <RankBadge rank={idx + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{p.name}</div>
                  </div>
                </div>
              ))}
              {topByProfit.length === 0 && <div className="text-center text-rose-500 text-sm">Chưa có dữ liệu</div>}
            </div>
          </button>

          <button
            type="button"
            onClick={() => openTopModal('quantity')}
            className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-left transition hover:bg-emerald-50 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase text-emerald-600">Top số lượng</h4>
            </div>
            <div className="space-y-2 text-sm text-emerald-800">
              {topByQuantity.map((p, idx) => (
                <div key={p.id || p.name} className="flex items-center gap-2">
                  <RankBadge rank={idx + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{p.name}</div>
                  </div>
                </div>
              ))}
              {topByQuantity.length === 0 && <div className="text-center text-emerald-500 text-sm">Chưa có dữ liệu</div>}
            </div>
          </button>
        </div>
      </div>

      {/* Modal mở khi người dùng chạm vào từng nhóm top để xem chi tiết. */}
      <TopListModal
        open={Boolean(activeModal)}
        onClose={closeTopModal}
        title={modalTitle}
        items={modalItems}
        mode={activeModal === 'quantity' ? 'quantity' : 'profit'}
      />

      {/* Nút thống kê chi tiết dạng floating, đặt cạnh tabbar giống nút back nổi. */}
      <button
        type="button"
        onClick={onOpenDetail}
        aria-label="Mở thống kê chi tiết"
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-200 active:scale-95 transition"
      >
        <ArrowUpRight size={18} />
      </button>
    </div>
  );
};

export default Dashboard;
