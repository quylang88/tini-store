import React from 'react';
import { ChevronRight, ScanBarcode, Image as ImageIcon, Plus, Minus, Trash2, ShoppingCart, Search } from 'lucide-react';
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
  handleExitCreate,
  handleClearCart,
  handleScanForSale,
  handleQuantityChange,
  adjustQuantity,
  handleSubmitOrder
}) => {
  const hasItems = Object.keys(cart).length > 0;
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
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        {/* Hàng 1: Tiêu đề & Nút chức năng */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleExitCreate} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ChevronRight className="rotate-180 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {orderBeingEdited ? `Sửa đơn #${orderBeingEdited.id.slice(-4)}` : 'Tạo Đơn'}
              </h2>
              {orderBeingEdited && (
                <div className="text-xs text-gray-400">Chỉnh sửa số lượng sản phẩm trong đơn</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasItems && (
              <button onClick={handleClearCart} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 active:scale-95 transition">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={() => setShowScanner(true)} className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg text-sm font-bold active:scale-95 transition">
              <ScanBarcode size={18} /> <span className="hidden sm:inline">Quét</span>
            </button>
          </div>
        </div>

        {/* Hàng 2: Thanh Tìm kiếm */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã sản phẩm..."
              className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
        <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-gray-100">
          <button
            onClick={() => setActiveCategory('Tất cả')}
            className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === 'Tất cả' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === cat ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
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
            <div key={p.id} className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-gray-300" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm text-gray-800 truncate pr-1">{p.name}</div>
                  {/* Badge danh mục */}
                  {activeCategory === 'Tất cả' && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className="font-semibold text-indigo-600">{formatNumber(p.price)}đ</span>
                  <span className="mx-1">|</span>
                  <span>Kho: {availableStock}</span>
                </div>
              </div>

              {/* Bộ điều khiển số lượng */}
              {qty > 0 ? (
                <div className="flex items-center bg-indigo-50 rounded-lg h-9 border border-indigo-100 overflow-hidden shadow-sm">
                  <button onClick={() => adjustQuantity(p.id, -1, availableStock)} className="w-9 h-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200">
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <input
                    type="number"
                    className="w-12 h-full text-center bg-transparent border-x border-indigo-100 outline-none text-indigo-900 font-bold text-sm m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={qty}
                    onChange={(e) => handleQuantityChange(p.id, e.target.value, availableStock)}
                    onFocus={(e) => e.target.select()}
                  />
                  <button onClick={() => adjustQuantity(p.id, 1, availableStock)} disabled={qty >= availableStock} className="w-9 h-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200 disabled:opacity-30">
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button onClick={() => adjustQuantity(p.id, 1, availableStock)} disabled={isOutOfStock} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 active:scale-95 transition">
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe-area z-[60] shadow-[0_-4px_15px_rgba(0,0,0,0.1)] animate-slide-up">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 font-medium text-sm">Tổng đơn hàng:</span>
            <span className="text-2xl font-bold text-indigo-600">{formatNumber(totalAmount)}đ</span>
          </div>
          <button
            onClick={handleSubmitOrder}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition flex items-center justify-center gap-2 text-lg"
          >
            <ShoppingCart size={20} /> {orderBeingEdited ? 'Cập nhật đơn' : 'Lên đơn'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderCreateView;
