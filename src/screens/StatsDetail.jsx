import React, { useMemo, useState } from 'react';
import { BarChart3, ChevronRight, Layers3, TrendingUp, Wallet } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import useDashboardLogic from '../hooks/useDashboardLogic';
import { getLatestUnitCost } from '../utils/purchaseUtils';
import MetricCard from '../components/stats/MetricCard';
import OptionPills from '../components/stats/OptionPills';
import RankBadge from '../components/stats/RankBadge';
import TopListModal from '../components/stats/TopListModal';

const StatsDetail = ({ products, orders, onBack }) => {
  const {
    topOptions,
    topLimit,
    setTopLimit,
    rangeStart,
    rangeEnd,
    customRange,
    setCustomRange,
    rangeDays,
    paidOrders,
    filteredPaidOrders,
    totalRevenue,
    totalProfit,
    topByProfit,
    topByQuantity,
  } = useDashboardLogic({ products, orders, rangeMode: 'detail' });

  const orderCount = filteredPaidOrders.length;
  const avgOrder = orderCount ? totalRevenue / orderCount : 0;
  const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;
  const costMap = useMemo(
    () => new Map(products.map(product => [product.id, getLatestUnitCost(product)])),
    [products],
  );

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    paidOrders.forEach(order => years.add(new Date(order.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [paidOrders]);

  const [quickMonth, setQuickMonth] = useState('');
  const [quickYear, setQuickYear] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const updateCustomRange = (nextRange) => {
    setQuickMonth('');
    setQuickYear('');
    setCustomRange(prev => ({ ...prev, ...nextRange }));
  };

  const parseDateValue = (value) => (value ? new Date(`${value}T00:00:00`) : null);

  const startDate = useMemo(() => parseDateValue(customRange.start), [customRange.start]);
  const endDate = useMemo(() => parseDateValue(customRange.end), [customRange.end]);

  const formatDateDisplay = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateSelect = (date) => {
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (!startDate || (startDate && endDate)) {
      updateCustomRange({ start: formatDateInput(selected), end: '' });
      return;
    }
    if (selected < startDate) {
      updateCustomRange({ start: formatDateInput(selected), end: formatDateInput(startDate) });
      return;
    }
    updateCustomRange({ start: formatDateInput(startDate), end: formatDateInput(selected) });
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startOffset; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [calendarMonth]);

  const handleQuickMonthChange = (event) => {
    const value = event.target.value;
    setQuickMonth(value);
    if (!value) return;
    setQuickYear('');
    setCustomRange({ start: null, end: null });
    const year = new Date().getFullYear();
    const month = Number(value);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    setCustomRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  const handleQuickYearChange = (event) => {
    const value = event.target.value;
    setQuickYear(value);
    if (!value) return;
    const year = Number(value);
    setQuickMonth('');
    setCustomRange({ start: null, end: null });
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    setCustomRange({
      start: formatDateInput(start),
      end: formatDateInput(end),
    });
  };

  const comparisonStats = useMemo(() => {
    // So sánh kỳ hiện tại với kỳ trước theo số ngày đang chọn (mặc định 30 ngày nếu "Tất cả").
    const compareDays = rangeDays ?? 30;
    const now = new Date();
    const currentEnd = rangeEnd ? new Date(rangeEnd) : new Date(now);
    currentEnd.setHours(23, 59, 59, 999);

    const currentStart = rangeStart ? new Date(rangeStart) : (() => {
      const start = new Date(currentEnd);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - compareDays + 1);
      return start;
    })();

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - compareDays);
    previousStart.setHours(0, 0, 0, 0);

    const calcStats = (rangeStartDate, rangeEndDate) => {
      const rangeOrders = paidOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= rangeStartDate && orderDate <= rangeEndDate;
      });

      const revenue = rangeOrders.reduce((sum, order) => sum + order.total, 0);
      const profit = rangeOrders.reduce((sum, order) => {
        const orderProfit = order.items.reduce((itemSum, item) => {
          const cost = Number.isFinite(item.cost) ? item.cost : (costMap.get(item.productId) || 0);
          return itemSum + (item.price - cost) * item.quantity;
        }, 0);
        const shippingFee = order.shippingFee || 0;
        return sum + orderProfit - shippingFee;
      }, 0);

      return { revenue, profit, count: rangeOrders.length };
    };

    return {
      current: calcStats(currentStart, currentEnd),
      previous: calcStats(previousStart, previousEnd),
    };
  }, [paidOrders, rangeDays, rangeStart, rangeEnd, costMap]);

  const [activeModal, setActiveModal] = useState(null);

  const openTopModal = (type) => setActiveModal(type);
  const closeTopModal = () => setActiveModal(null);

  const modalTitle = activeModal === 'quantity' ? 'Top số lượng' : 'Top lợi nhuận';
  const modalItems = activeModal === 'quantity' ? topByQuantity : topByProfit;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 pb-24 animate-fade-in">
      <div>
        <div className="text-xs text-amber-500 uppercase font-semibold whitespace-nowrap">Thống kê chi tiết</div>
        <div className="text-sm font-bold text-amber-900 whitespace-nowrap">Phân tích doanh thu & lợi nhuận</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        {/* Bộ lọc thời gian chi tiết hơn để xem theo nhiều khoảng khác nhau. */}
        <div className="grid gap-2 text-xs text-amber-700">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase text-amber-500">Khoảng thời gian</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCalendarOpen(open => !open)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-900"
              >
                <span>
                  {startDate ? formatDateDisplay(startDate) : 'Chọn ngày bắt đầu'}
                </span>
                <span className="text-amber-400">→</span>
                <span>
                  {endDate ? formatDateDisplay(endDate) : 'Chọn ngày kết thúc'}
                </span>
              </button>
              {calendarOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-amber-100 bg-white p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-amber-700">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                      className="rounded-full px-2 py-1 text-amber-500 hover:bg-amber-50"
                    >
                      ‹
                    </button>
                    <div>
                      Tháng {String(calendarMonth.getMonth() + 1).padStart(2, '0')} {calendarMonth.getFullYear()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                      className="rounded-full px-2 py-1 text-amber-500 hover:bg-amber-50"
                    >
                      ›
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-amber-400">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                      <div key={day} className="text-center">{day}</div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1 text-xs">
                    {calendarDays.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} />;
                      }
                      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      const isStart = startDate && dateOnly.getTime() === startDate.getTime();
                      const isEnd = endDate && dateOnly.getTime() === endDate.getTime();
                      const inRange = startDate && endDate
                        ? dateOnly >= startDate && dateOnly <= endDate
                        : false;
                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          className={[
                            'rounded-lg px-2 py-1 text-center transition',
                            inRange ? 'bg-amber-50 text-amber-800' : 'text-amber-700 hover:bg-amber-50',
                            isStart || isEnd ? 'bg-amber-400 text-white hover:bg-amber-400' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase text-amber-500">Theo tháng</span>
              <select
                value={quickMonth}
                onChange={handleQuickMonthChange}
                className="rounded-lg border border-amber-100 bg-white px-2 py-1.5 text-xs text-amber-900"
              >
                <option value="">Chọn tháng</option>
                {Array.from({ length: 12 }, (_, index) => {
                  const monthValue = String(index + 1).padStart(2, '0');
                  return (
                    <option key={monthValue} value={monthValue}>
                      Tháng {monthValue}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase text-amber-500">Theo năm</span>
              <input
                type="number"
                min={Math.min(...availableYears)}
                max={Math.max(...availableYears)}
                value={quickYear}
                onChange={handleQuickYearChange}
                placeholder={`Năm ${availableYears[0]}`}
                className="rounded-lg border border-amber-100 bg-white px-2 py-1.5 text-xs text-amber-900"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Wallet}
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
        <div className="flex items-center justify-between gap-2 text-amber-700">
          <div className="flex items-center gap-2">
            <Layers3 size={18} />
            <h3 className="text-sm font-bold uppercase">Top bán chạy</h3>
          </div>
          <OptionPills
            options={topOptions}
            activeId={topLimit}
            onChange={setTopLimit}
            containerClassName="flex items-center gap-1 flex-nowrap overflow-x-auto no-scrollbar"
            buttonClassName="px-2 py-1 rounded-full text-[11px] font-semibold border transition whitespace-nowrap"
            activeClassName="bg-rose-500 text-white border-rose-400 shadow-sm"
            inactiveClassName="bg-rose-50 text-rose-600 border-rose-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => openTopModal('profit')}
            className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-left transition hover:bg-rose-50 focus:outline-none"
          >
            <div className="text-xs font-semibold uppercase text-rose-600 mb-2">Top lợi nhuận</div>
            <div className="space-y-2 text-sm text-rose-800">
              {topByProfit.map((item, index) => (
                <div key={item.id || item.name} className="flex items-center gap-2">
                  <RankBadge rank={index + 1} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                </div>
              ))}
              {topByProfit.length === 0 && <div className="text-xs text-rose-400">Chưa có dữ liệu</div>}
            </div>
          </button>
          <button
            type="button"
            onClick={() => openTopModal('quantity')}
            className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-left transition hover:bg-emerald-50 focus:outline-none"
          >
            <div className="text-xs font-semibold uppercase text-emerald-600 mb-2">Top số lượng</div>
            <div className="space-y-2 text-sm text-emerald-800">
              {topByQuantity.map((item, index) => (
                <div key={item.id || item.name} className="flex items-center gap-2">
                  <RankBadge rank={index + 1} />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                </div>
              ))}
              {topByQuantity.length === 0 && <div className="text-xs text-emerald-400">Chưa có dữ liệu</div>}
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <BarChart3 size={18} />
          <h3 className="text-sm font-bold uppercase">So sánh kỳ hiện tại</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
            <div className="text-amber-600 font-semibold uppercase mb-2">Kỳ hiện tại</div>
            <div className="space-y-1 text-amber-900">
              <div>Doanh thu: <span className="font-semibold">{formatNumber(comparisonStats.current.revenue)}đ</span></div>
              <div>Lợi nhuận: <span className="font-semibold">{formatNumber(comparisonStats.current.profit)}đ</span></div>
              <div>Số đơn: <span className="font-semibold">{comparisonStats.current.count}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3">
            <div className="text-gray-500 font-semibold uppercase mb-2">Kỳ trước</div>
            <div className="space-y-1 text-gray-700">
              <div>Doanh thu: <span className="font-semibold">{formatNumber(comparisonStats.previous.revenue)}đ</span></div>
              <div>Lợi nhuận: <span className="font-semibold">{formatNumber(comparisonStats.previous.profit)}đ</span></div>
              <div>Số đơn: <span className="font-semibold">{comparisonStats.previous.count}</span></div>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-amber-500">
          So sánh theo cùng số ngày của kỳ đang chọn để dễ theo dõi biến động.
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

      <button
        onClick={onBack}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-700 shadow-lg border border-amber-200 hover:bg-amber-50 active:scale-95 transition"
        aria-label="Quay lại"
      >
        <ChevronRight className="rotate-180" />
      </button>

      {/* Dùng modal chung để xem chi tiết top khi chạm vào từng bảng. */}
      <TopListModal
        open={Boolean(activeModal)}
        onClose={closeTopModal}
        title={modalTitle}
        items={modalItems}
        mode={activeModal === 'quantity' ? 'quantity' : 'profit'}
      />
    </div>
  );
};

export default StatsDetail;
