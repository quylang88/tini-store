import React from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';
import ModalShell from './ModalShell';

// Modal hiển thị chi tiết top sản phẩm theo lợi nhuận hoặc số lượng.
const TopProductsModal = ({ open, title, items, variant, onClose }) => {
  const valueLabel = variant === 'profit' ? 'Lợi nhuận' : 'Số lượng';

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[92vw] max-w-md p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-amber-500 font-semibold">Top bán chạy</div>
            <h3 className="text-base font-bold text-amber-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-amber-500 bg-amber-50 hover:bg-amber-100"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div key={item.id || `${item.name}-${index}`} className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-amber-200">
                    <ImageIcon size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-amber-900">{item.name}</div>
                <div className="text-xs text-amber-600">
                  {valueLabel}: {variant === 'profit' ? `${formatNumber(item.profit)}đ` : item.quantity}
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-sm text-amber-500">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

export default TopProductsModal;
