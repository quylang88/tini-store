import React, { useMemo, useState } from 'react';
import WarehouseHeader from '../components/warehouse/WarehouseHeader';
import WarehouseList from '../components/warehouse/WarehouseList';
import { normalizeWarehouseStock } from '../utils/warehouseUtils';

const Warehouse = ({ products, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeWarehouse, setActiveWarehouse] = useState('daLat');

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
      <WarehouseList products={filteredProducts} activeWarehouse={activeWarehouse} />
    </div>
  );
};

export default Warehouse;
