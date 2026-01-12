import React, { useMemo, useState } from 'react';
import ConfirmModal from '../components/modals/ConfirmModal';
import InputModal from '../components/modals/InputModal';
import WarehouseHeader from '../components/warehouse/WarehouseHeader';
import WarehouseList from '../components/warehouse/WarehouseList';
import { normalizeWarehouseStock } from '../utils/warehouseUtils';

const Warehouse = ({ products, setProducts, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeWarehouse, setActiveWarehouse] = useState('daLat');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

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
    setDeleteModal({
      product,
      title: 'Xoá sản phẩm khỏi kho?',
      message: `Thao tác quan trọng: Xoá "${product.name}" sẽ loại bỏ dữ liệu tồn kho. Hãy kiểm tra kỹ trước khi tiếp tục.`,
      confirmLabel: 'Xoá sản phẩm',
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <WarehouseHeader
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onClearSearch={() => setSearchTerm('')}
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
        open={Boolean(deleteModal)}
        title={deleteModal?.title}
        message={deleteModal?.message}
        confirmLabel={deleteModal?.confirmLabel}
        tone="danger"
        onCancel={() => setDeleteModal(null)}
        onConfirm={() => {
          if (deleteModal?.product) {
            setProducts(prev => prev.filter(product => product.id !== deleteModal.product.id));
          }
          setDeleteModal(null);
        }}
      />
    </div>
  );
};

export default Warehouse;
