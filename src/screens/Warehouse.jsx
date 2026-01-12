import React, { useMemo, useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import ConfirmModal from '../components/modals/ConfirmModal';
import InputModal from '../components/modals/InputModal';
import WarehouseAddView from '../components/warehouse/WarehouseAddView';
import WarehouseHeader from '../components/warehouse/WarehouseHeader';
import WarehouseList from '../components/warehouse/WarehouseList';
import { normalizeWarehouseStock } from '../utils/warehouseUtils';

const Warehouse = ({ products, setProducts, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeWarehouse, setActiveWarehouse] = useState('daLat');
  const [view, setView] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editError, setEditError] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [addActiveCategory, setAddActiveCategory] = useState('Tất cả');

  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm));
      const matchCategory = activeCategory === 'Tất cả' || product.category === activeCategory;
      const warehouseStock = normalizeWarehouseStock(product);
      const selectedStock = activeWarehouse === 'vinhPhuc'
        ? warehouseStock.vinhPhuc
        : warehouseStock.daLat;
      return matchSearch && matchCategory && selectedStock > 0;
    }),
    [products, searchTerm, activeCategory, activeWarehouse],
  );

  const addFilteredProducts = useMemo(() => {
    if (!addSearchTerm.trim()) return [];
    const matchTerm = addSearchTerm.toLowerCase();
    return products.filter((product) => {
      const matchSearch = product.name.toLowerCase().includes(matchTerm) ||
        (product.barcode && product.barcode.includes(addSearchTerm));
      const matchCategory = addActiveCategory === 'Tất cả' || product.category === addActiveCategory;
      return matchSearch && matchCategory;
    });
  }, [products, addSearchTerm, addActiveCategory]);

  const resetAddView = () => {
    setAddSearchTerm('');
    setAddActiveCategory('Tất cả');
  };

  const handleStartAdd = () => {
    setConfirmModal({
      title: 'Thêm sản phẩm vào kho?',
      message: 'Thao tác quan trọng: Bạn sắp cập nhật tồn kho. Hãy kiểm tra kỹ trước khi tiếp tục.',
      confirmLabel: 'Tiếp tục',
      tone: 'danger',
      onConfirm: () => {
        resetAddView();
        setView('add');
      },
    });
  };

  const handleExitAdd = () => {
    resetAddView();
    setView('list');
  };

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    if (view === 'add') {
      setAddSearchTerm(decodedText);
    } else {
      setSearchTerm(decodedText);
    }
  };

  const handleOpenEdit = (product) => {
    const warehouseStock = normalizeWarehouseStock(product);
    const selectedStock = activeWarehouse === 'vinhPhuc'
      ? warehouseStock.vinhPhuc
      : warehouseStock.daLat;
    // Chỉ cho sửa số lượng tồn kho tại kho đang chọn.
    setEditingProduct(product);
    setEditQuantity(String(selectedStock));
    setEditError('');
  };

  const handleConfirmEdit = () => {
    const nextValue = Number(editQuantity);
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      setEditError('Số lượng tồn kho phải là số >= 0.');
      return;
    }
    setProducts(prev => prev.map(product => {
      if (product.id !== editingProduct.id) return product;
      const current = normalizeWarehouseStock(product);
      const nextStockByWarehouse = {
        ...current,
        [activeWarehouse]: nextValue,
      };
      return {
        ...product,
        stockByWarehouse: nextStockByWarehouse,
        stock: nextStockByWarehouse.daLat + nextStockByWarehouse.vinhPhuc,
      };
    }));
    setEditingProduct(null);
    setEditQuantity('');
    setEditError('');
  };

  const handleOpenDelete = (product) => {
    // Cảnh báo người dùng vì thao tác xoá ảnh hưởng tồn kho.
    setConfirmModal({
      title: 'Xoá sản phẩm khỏi kho?',
      message: `Thao tác quan trọng: Xoá "${product.name}" sẽ loại bỏ dữ liệu tồn kho. Hãy kiểm tra kỹ trước khi tiếp tục.`,
      confirmLabel: 'Xoá sản phẩm',
      tone: 'danger',
      onConfirm: () => {
        setProducts(prev => prev.filter(item => item.id !== product.id));
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}

      {view === 'list' ? (
        <>
          <WarehouseHeader
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onClearSearch={() => setSearchTerm('')}
            onAdd={handleStartAdd}
            onShowScanner={() => setShowScanner(true)}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categories={settings.categories}
            activeWarehouse={activeWarehouse}
            onWarehouseChange={setActiveWarehouse}
          />
          <WarehouseList
            products={filteredProducts}
            activeWarehouse={activeWarehouse}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        </>
      ) : (
        <WarehouseAddView
          settings={settings}
          searchTerm={addSearchTerm}
          setSearchTerm={setAddSearchTerm}
          activeCategory={addActiveCategory}
          setActiveCategory={setAddActiveCategory}
          filteredProducts={addFilteredProducts}
          onSelectProduct={handleOpenEdit}
          handleExitCreate={handleExitAdd}
          hideBackButton={Boolean(confirmModal)}
        />
      )}

      <InputModal
        open={Boolean(editingProduct)}
        title="Chỉnh sửa tồn kho"
        message="Lưu ý: Đây là thao tác quan trọng, hãy kiểm tra kỹ số lượng trước khi cập nhật."
        value={editQuantity}
        error={editError}
        onChange={setEditQuantity}
        confirmLabel="Cập nhật tồn kho"
        onConfirm={handleConfirmEdit}
        onCancel={() => {
          setEditingProduct(null);
          setEditQuantity('');
          setEditError('');
        }}
        inputProps={{ inputMode: 'numeric', placeholder: 'Nhập số lượng...', min: 0 }}
      />

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        tone={confirmModal?.tone}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          confirmModal?.onConfirm?.();
          setConfirmModal(null);
        }}
      />
    </div>
  );
};

export default Warehouse;
