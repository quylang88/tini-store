import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import SheetModal from '../modals/SheetModal';
import { formatNumber } from '../../utils/helpers';
import RankBadge from './RankBadge';

const toneMap = {
  profit: {
    title: 'text-rose-700',
    badge: 'bg-rose-50 text-rose-600 border-rose-100',
    value: 'text-rose-600',
  },
  quantity: {
    title: 'text-emerald-800',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    value: 'text-emerald-700',
  },
};

// Modal hiển thị đầy đủ danh sách top kèm ảnh và số liệu chi tiết.
// View Only -> Không có X, có nút Đóng cuối.
const TopListModal = ({ open, onClose, title, items, mode }) => {
  const tone = toneMap[mode] || toneMap.profit;
  const valueLabel = mode === 'quantity' ? 'Số lượng' : 'Lợi nhuận';

  // Nút đóng ở dưới cùng
  const footer = (
    <button
      onClick={onClose}
      className="w-full border border-amber-200 text-amber-700 py-3 rounded-xl font-bold shadow-sm active:bg-amber-50 active:scale-95 transition"
    >
      Đóng
    </button>
  );

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      footer={footer}
      showCloseIcon={false} // Tắt nút X
    >
      <div className="flex flex-col">
        <div className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-bold uppercase ${tone.title}`}>{title}</h3>
            <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${tone.badge}`}>
              {items.length} sản phẩm
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id || item.name} className="flex items-center gap-3">
              <RankBadge rank={index + 1} />
              <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-100">
                {item.image ? (
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">{item.name}</div>
                <div className={`text-xs ${tone.value}`}>
                  {valueLabel}: {mode === 'quantity' ? item.quantity : `${formatNumber(item.profit)}đ`}
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-sm text-gray-400">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    </SheetModal>
  );
};

export default TopListModal;
