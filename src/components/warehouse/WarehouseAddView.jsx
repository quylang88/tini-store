import React from 'react';
import { ChevronRight, Image as ImageIcon, Plus, Search, X } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';

// Màn hình thêm sản phẩm vào kho: chỉ hiển thị danh sách khi có tìm kiếm.
const WarehouseAddView = ({
  settings,
  searchTerm,
  setSearchTerm,
  activeCategory,
  setActiveCategory,
  filteredProducts,
  onSelectProduct,
  handleExitCreate,
  hideBackButton,
}) => {
  const categories = settings?.categories || ['Chung'];
  const hasSearch = Boolean(searchTerm?.trim());

  return (
    <div className="flex flex-col h-full bg-transparent pb-safe-area relative">
      <div className="bg-amber-50/90 sticky top-0 z-10 shadow-sm backdrop-blur">
        <div className="p-3 border-b border-amber-100">
          <div>
            <h2 className="text-xl font-bold text-amber-900">Thêm sản phẩm vào kho</h2>
            <div className="text-xs text-amber-500">Nhập từ khoá để bắt đầu tìm kiếm sản phẩm.</div>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-amber-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-amber-400" size={16} />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã sản phẩm..."
              className="w-full bg-amber-100/70 pl-9 pr-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
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

      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-40">
        {!hasSearch && (
          <div className="text-center text-gray-400 mt-10">
            <div className="flex justify-center mb-2">
              <Search size={32} className="opacity-20" />
            </div>
            <p>Nhập từ khoá để hiển thị sản phẩm</p>
          </div>
        )}

        {hasSearch && filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
              {product.image ? (
                <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={16} className="text-gray-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm text-amber-900 truncate pr-1">{product.name}</div>
                {activeCategory === 'Tất cả' && (
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                    {product.category}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                <span className="font-semibold text-amber-700">{formatNumber(product.price)}đ</span>
                <span className="mx-1">|</span>
                <span className="font-mono">{product.barcode || '---'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-200 active:scale-95 transition flex items-center gap-1"
            >
              <Plus size={14} /> Thêm
            </button>
          </div>
        ))}

        {hasSearch && filteredProducts.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <div className="flex justify-center mb-2">
              <Search size={32} className="opacity-20" />
            </div>
            <p>Không tìm thấy sản phẩm</p>
          </div>
        )}
      </div>

      {!hideBackButton && (
        <button
          onClick={handleExitCreate}
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-700 shadow-lg border border-amber-200 hover:bg-amber-50 active:scale-95 transition"
          aria-label="Quay lại"
        >
          <ChevronRight className="rotate-180" />
        </button>
      )}
    </div>
  );
};

export default WarehouseAddView;
