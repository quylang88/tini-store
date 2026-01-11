import React from 'react';
import { ChevronRight, ScanBarcode, Image as ImageIcon, Plus, Minus, ShoppingCart, Search } from 'lucide-react';
import BarcodeScanner from '../../components/BarcodeScanner';
import { formatNumber } from '../../utils/helpers';

// Giao diện tạo/sửa đơn được tách riêng để Orders.jsx gọn hơn
const OrderCreateView = ({
  settings,
  cart,
  showScanner,
  setShowScanner,
  orderBeingEdited,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm,
  filteredProducts,
  totalAmount,
  reviewItems,
  isReviewOpen,
  orderComment,
  setOrderComment,
  handleExitCreate,
  handleCancelDraft,
  handleScanForSale,
  handleQuantityChange,
  adjustQuantity,
  handleOpenReview,
  handleCloseReview,
  handleConfirmOrder
}) => {
  const categories = settings?.categories || ['Chung'];

  // Khi đang sửa đơn, cộng lại số lượng cũ để hiển thị tồn kho chính xác
  const getAvailableStock = (productId, stock) => {
    if (!orderBeingEdited) return stock;
    const previousQty = orderBeingEdited.items.find(item => item.productId === productId)?.quantity || 0;
    return stock + previousQty;
  };

  return (
    <div className="flex flex-col h-full bg-transparent pb-safe-area relative">
      {showScanner && <BarcodeScanner onScanSuccess={handleScanForSale} onClose={() => setShowScanner(false)} />}

      {/* Header Cố định */}
      <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
        {/* Hàng 1: Tiêu đề & Nút chức năng */}
        <div className="p-3 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleExitCreate} className="p-2 hover:bg-amber-100 rounded-full transition">
              <ChevronRight className="rotate-180 text-amber-700" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-amber-900">
                {orderBeingEdited ? `Sửa đơn #${orderBeingEdited.orderNumber ?? orderBeingEdited.id.slice(-4)}` : 'Tạo Đơn'}
              </h2>
              {orderBeingEdited && (
                <div className="text-xs text-amber-500">Chỉnh sửa số lượng sản phẩm trong đơn</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowScanner(true)} className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg text-sm font-bold active:scale-95 transition">
              <ScanBarcode size={18} /> <span className="hidden sm:inline">Quét</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: Thanh Tìm kiếm */}
        <div className="px-3 py-2 border-b border-amber-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-amber-400" size={16} />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã sản phẩm..."
              className="w-full bg-amber-100/70 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Hàng 3: Thanh Tab Danh mục */}
        <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-amber-100">
          <button
            onClick={() => setActiveCategory('Tất cả')}
            className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === 'Tất cả' ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'}`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === cat ? 'border-rose-500 text-rose-600' : 'border-transparent text-amber-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List Sản Phẩm (Đã Lọc) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-40">
        {filteredProducts.map(p => {
          const qty = cart[p.id] || 0;
          const availableStock = getAvailableStock(p.id, p.stock);
          const isOutOfStock = availableStock <= 0;

          return (
            <div key={p.id} className={`bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-gray-300" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm text-amber-900 truncate pr-1">{p.name}</div>
                  {/* Badge danh mục */}
                  {activeCategory === 'Tất cả' && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className="font-semibold text-amber-700">{formatNumber(p.price)}đ</span>
                  <span className="mx-1">|</span>
                  <span>Kho: {availableStock}</span>
                </div>
              </div>

              {/* Bộ điều khiển số lượng */}
              {qty > 0 ? (
                <div className="flex items-center bg-rose-50 rounded-lg h-9 border border-rose-100 overflow-hidden shadow-sm">
                  <button onClick={() => adjustQuantity(p.id, -1, availableStock)} className="w-9 h-full flex items-center justify-center text-rose-600 hover:bg-rose-100 active:bg-rose-200">
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <input
                    type="number"
                    className="w-12 h-full text-center bg-transparent border-x border-rose-100 outline-none text-rose-900 font-bold text-sm m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={qty}
                    onChange={(e) => handleQuantityChange(p.id, e.target.value, availableStock)}
                    onFocus={(e) => e.target.select()}
                  />
                  <button onClick={() => adjustQuantity(p.id, 1, availableStock)} disabled={qty >= availableStock} className="w-9 h-full flex items-center justify-center text-rose-600 hover:bg-rose-100 active:bg-rose-200 disabled:opacity-30">
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button onClick={() => adjustQuantity(p.id, 1, availableStock)} disabled={isOutOfStock} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-200 active:scale-95 transition">
                  {isOutOfStock ? 'Hết' : 'Thêm'}
                </button>
              )}
            </div>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <div className="flex justify-center mb-2"><Search size={32} className="opacity-20" /></div>
            <p>Không tìm thấy sản phẩm</p>
          </div>
        )}
      </div>

      {/* Tạo Đơn */}
      {totalAmount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 p-4 pb-[calc(env(safe-area-inset-bottom)+28px)] z-[60] shadow-[0_-4px_15px_rgba(0,0,0,0.1)] animate-slide-up backdrop-blur">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 font-medium text-sm">Tổng đơn hàng:</span>
            <span className="text-2xl font-bold text-rose-600">{formatNumber(totalAmount)}đ</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancelDraft}
              className="flex-1 bg-white text-amber-700 py-3.5 rounded-xl font-bold border border-amber-200 shadow-sm hover:bg-amber-50 active:scale-95 transition"
            >
              {orderBeingEdited ? 'Huỷ sửa' : 'Huỷ đơn'}
            </button>
            <button
              onClick={handleOpenReview}
              className="flex-1 bg-rose-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingCart size={20} /> {orderBeingEdited ? 'Cập nhật đơn' : 'Lên đơn'}
            </button>
          </div>
        </div>
      )}

      {isReviewOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4" onClick={handleCloseReview}>
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-amber-100 bg-amber-50">
              <div className="text-lg font-bold text-amber-900">
                {orderBeingEdited ? 'Xác nhận cập nhật đơn' : 'Xác nhận tạo đơn'}
              </div>
              <div className="text-xs text-amber-600">Kiểm tra lại danh sách sản phẩm trước khi xác nhận.</div>
            </div>
            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
              {reviewItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <div className="min-w-0">
                    <div className="font-semibold text-amber-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">x{item.quantity}</div>
                  </div>
                  <div className="font-semibold text-amber-700">
                    {formatNumber(item.price * item.quantity)}đ
                  </div>
                </div>
              ))}
              {reviewItems.length === 0 && (
                <div className="text-sm text-gray-400 text-center">Chưa có sản phẩm nào.</div>
              )}
              {/* Ghi chú giúp user nhớ lại tình trạng đơn */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-amber-700">Ghi chú đơn hàng</label>
                <textarea
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value)}
                  placeholder="Ví dụ: khách hẹn lấy vào chiều nay..."
                  rows={3}
                  className="w-full border border-amber-200 rounded-xl p-3 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>
            <div className="p-4 border-t border-amber-100 bg-amber-50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tổng đơn hàng</span>
                <span className="text-lg font-bold text-rose-600">{formatNumber(totalAmount)}đ</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCloseReview}
                  className="flex-1 py-2.5 rounded-xl border border-amber-200 text-amber-700 font-semibold bg-white hover:bg-amber-50 transition"
                >
                  Xem lại
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold shadow-md shadow-rose-200 hover:bg-rose-600 transition"
                >
                  {orderBeingEdited ? 'Cập nhật' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCreateView;
