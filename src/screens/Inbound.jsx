import React from 'react';
import { Check, PackagePlus, Search, X } from 'lucide-react';
import useInboundLogic from '../hooks/useInboundLogic';
import { formatInputNumber, formatNumber } from '../utils/helpers';
import { getWarehouseLabel, WAREHOUSES } from '../utils/warehouseUtils';

const Inbound = ({ products, setProducts, settings }) => {
  const {
    draft,
    searchTerm,
    setSearchTerm,
    suggestions,
    feeJpy,
    feeVnd,
    handleSelectProduct,
    handleClearSelection,
    handleDraftChange,
    handleSavePurchase,
  } = useInboundLogic({ products, setProducts, settings });

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
        <div className="p-4 border-b border-amber-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-900">Nhập hàng</h2>
            <div className="text-xs text-amber-500">Thêm hàng mới hoặc cập nhật hàng đã có.</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border border-amber-200 flex items-center justify-center text-rose-500 shadow-sm">
            <PackagePlus size={18} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-amber-700 uppercase">Tên sản phẩm</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 text-amber-400" size={16} />
              <input
                className="w-full bg-amber-50/70 border border-amber-100 rounded-xl pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="Nhập tên để gợi ý..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  handleDraftChange('name')(event.target.value);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  aria-label="Xoá nội dung"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {suggestions.length > 0 && !draft.productId && (
              <div className="mt-2 border border-amber-100 rounded-xl overflow-hidden bg-amber-50/60">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectProduct(item)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm text-amber-900 hover:bg-rose-50 transition"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] text-amber-500">Chọn</span>
                  </button>
                ))}
              </div>
            )}
            {draft.productId && (
              <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1">
                <Check size={12} /> Đang chỉnh sản phẩm đã có, dữ liệu được điền sẵn.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-amber-700 uppercase">Giá nhập (VNĐ)</label>
              <input
                inputMode="numeric"
                className="w-full border-b border-amber-100 py-2 focus:border-rose-400 outline-none text-amber-900 font-bold"
                value={formatInputNumber(draft.cost)}
                onChange={(event) => handleDraftChange('cost')(event.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-amber-700 uppercase">Giá bán (VNĐ)</label>
              <input
                inputMode="numeric"
                className="w-full border-b border-amber-100 py-2 focus:border-rose-400 outline-none text-amber-900 font-bold"
                value={formatInputNumber(draft.price)}
                onChange={(event) => handleDraftChange('price')(event.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-amber-700 uppercase">Tồn kho</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                inputMode="numeric"
                className="flex-1 border-b border-amber-100 py-2 focus:border-rose-400 outline-none text-amber-900 font-bold"
                value={formatInputNumber(draft.quantity)}
                onChange={(event) => handleDraftChange('quantity')(event.target.value)}
                placeholder="0"
              />
              <div className="flex gap-2">
                {WAREHOUSES.map((warehouse) => (
                  <button
                    key={warehouse.key}
                    type="button"
                    onClick={() => handleDraftChange('warehouse')(warehouse.key)}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition ${
                      draft.warehouse === warehouse.key
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-white text-amber-700 border-amber-200 hover:border-rose-300'
                    }`}
                  >
                    {warehouse.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-amber-500 mt-1">
              Nhập số lượng nhận về tại kho {getWarehouseLabel(draft.warehouse)}.
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
            <div className="text-[10px] font-bold text-amber-800 uppercase">Phí gửi về kho</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDraftChange('method')('vn')}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  draft.method === 'vn'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                }`}
              >
                Mua tại VN
              </button>
              <button
                type="button"
                onClick={() => handleDraftChange('method')('jp')}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  draft.method === 'jp'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                }`}
              >
                Mua tại Nhật
              </button>
            </div>

            {draft.method === 'vn' ? (
              <div>
                <label className="text-[10px] font-bold text-amber-800 uppercase">Phí gửi (VNĐ)</label>
                <input
                  inputMode="numeric"
                  className="w-full bg-transparent border-b border-amber-100 py-2 focus:border-amber-400 outline-none text-amber-900 font-bold"
                  value={formatInputNumber(draft.feeVnd)}
                  onChange={(event) => handleDraftChange('feeVnd')(event.target.value)}
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-800 uppercase">Nhập cân (kg)</label>
                <input
                  inputMode="decimal"
                  className="w-full bg-transparent border-b border-amber-100 py-2 focus:border-amber-400 outline-none text-amber-900 font-bold"
                  value={draft.weightKg}
                  onChange={(event) => handleDraftChange('weightKg')(event.target.value)}
                  placeholder="0"
                />
                <div className="text-xs text-amber-700 font-semibold">
                  Phí gửi: {formatNumber(feeJpy)}¥ (~{formatNumber(feeVnd)}đ)
                </div>
                <div className="text-[10px] text-amber-500">Tự tính theo 900 yên / 1kg.</div>
              </div>
            )}
          </div>

          {draft.error && <div className="text-xs text-red-500">{draft.error}</div>}
          <button
            onClick={handleSavePurchase}
            className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition"
          >
            Lưu nhập hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inbound;
