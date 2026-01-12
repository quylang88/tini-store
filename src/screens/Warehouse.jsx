import React, { useMemo, useState } from 'react';
import WarehouseHeader from '../components/warehouse/WarehouseHeader';
import WarehouseList from '../components/warehouse/WarehouseList';

const Warehouse = ({ products, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm));
      const matchCategory = activeCategory === 'Tất cả' || product.category === activeCategory;
      return matchSearch && matchCategory;
    }),
    [products, searchTerm, activeCategory],
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
      />
      <WarehouseList products={filteredProducts} />
    </div>
  );
};

export default Warehouse;
