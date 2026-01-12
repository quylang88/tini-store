import React from 'react';
import { ChevronRight, Image as ImageIcon, Minus, Plus, Search, X } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';

// Giao diện tạo kiện hàng được làm giống màn hình tạo đơn hàng để dễ thao tác.
const InboundCreateView = ({
  settings,
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  filteredProducts,
  pendingCount,
  shipmentDraft,
  handleExitCreate,
  handleQuantityChange,
  adjustQuantity,
  handleOpenShipmentModal,
}) => {
  const categories = settings?.categories || ['Chung'];
  const totalSelected = Object.values(shipmentDraft.items || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return (
    <div className="flex flex-col h-full bg-transparent pb-safe-area relative">
      {/* Header cố định với cấu trúc giống màn hình tạo đơn */}
      <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
        <div className="p-3 border-b border-amber-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-900">Tạo kiện hàng</h2>
            <div className="text-xs text-amber-500">Chỉ hiện sản phẩm còn số lượng đã mua.</div>
          </div>
          <button
            onClick={handleExitCreate}
            className="w-10 h-10 rounded-full bg-white text-amber-700 border border-amber-200 shadow-sm hover:bg-amber-50 flex items-center justify-center"
            aria-label="Quay lại"
          >
            <ChevronRight className="rotate-180" size={18} />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-amber-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-amber-400" size={16} />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã sản phẩm..."
              className="w-full bg-amber-100/70 pl-9 pr-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                aria-label="Xoá nội dung tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-amber-100">
          <button
            onClick={() => setActiveCategory('Tất cả')}
            className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
              activeCategory === 'Tất cả' ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
                activeCategory === cat ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách sản phẩm giống layout tạo đơn */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-40">
        {filteredProducts.map((item) => {
          const qty = shipmentDraft.items[item.productId] || 0;
          const availableStock = item.quantity || 0;
          const isOutOfStock = availableStock <= 0;

          return (
            <div key={item.productId} className={`bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                {item.image ? (
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={16} className="text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm text-amber-900 truncate pr-1">{item.name}</div>
                  {activeCategory === 'Tất cả' && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className="font-semibold text-amber-700">{formatNumber(item.price)}đ</span>
                  <span className="mx-1">|</span>
                  <span>Còn mua: {availableStock}</span>
                </div>
              </div>

              {qty > 0 ? (
                <div className="flex items-center bg-rose-50 rounded-lg h-9 border border-rose-100 overflow-hidden shadow-sm">
                  <button
                    onClick={() => adjustQuantity(item.productId, -1, availableStock)}
                    className="w-9 h-full flex items-center justify-center text-rose-600 hover:bg-rose-100 active:bg-rose-200"
                  >
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <input
                    type="number"
                    className="w-12 h-full text-center bg-transparent border-x border-rose-100 outline-none text-rose-900 font-bold text-sm m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={qty}
                    onChange={(e) => handleQuantityChange(item.productId, e.target.value, availableStock)}
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => adjustQuantity(item.productId, 1, availableStock)}
                    disabled={qty >= availableStock}
                    className="w-9 h-full flex items-center justify-center text-rose-600 hover:bg-rose-100 active:bg-rose-200 disabled:opacity-30"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => adjustQuantity(item.productId, 1, availableStock)}
                  disabled={isOutOfStock}
                  className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-200 active:scale-95 transition"
                >
                  {isOutOfStock ? 'Hết' : 'Thêm'}
                </button>
              )}
            </div>
          );
        })}

        {pendingCount === 0 && (
          <div className="text-xs text-gray-400 text-center py-10">Chưa có hàng mua để gom kiện.</div>
        )}

        {pendingCount > 0 && filteredProducts.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <div className="flex justify-center mb-2">
              <Search size={32} className="opacity-20" />
            </div>
            <p>Không tìm thấy sản phẩm</p>
          </div>
        )}

        {shipmentDraft.error && (
          <div className="text-xs text-red-500">{shipmentDraft.error}</div>
        )}
      </div>

      {totalSelected > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 p-4 pb-[calc(env(safe-area-inset-bottom)+28px)] z-[60] shadow-[0_-4px_15px_rgba(0,0,0,0.1)] animate-slide-up backdrop-blur">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 font-medium text-sm">Đã chọn:</span>
            <span className="text-2xl font-bold text-rose-600">{formatNumber(totalSelected)} sp</span>
          </div>
          <button
            onClick={handleOpenShipmentModal}
            className="w-full bg-rose-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition"
          >
            Lên kiện
          </button>
        </div>
      )}
    </div>
  );
};

export default InboundCreateView;
