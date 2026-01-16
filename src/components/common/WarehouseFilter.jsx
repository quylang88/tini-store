import React from 'react';
import AnimatedFilterTabs from './AnimatedFilterTabs';

const WarehouseFilter = ({
  activeTab,
  onChange,
  className = '',
  layoutIdPrefix = 'warehouse-filter'
}) => {
  const warehouseTabs = [
    { key: "all", label: "Tất cả" },
    { key: "vinhPhuc", label: "Vĩnh Phúc" },
    { key: "daLat", label: "Lâm Đồng" },
  ];

  return (
    <AnimatedFilterTabs
      tabs={warehouseTabs}
      activeTab={activeTab}
      onChange={onChange}
      layoutIdPrefix={layoutIdPrefix}
      className={className}
    />
  );
};

export default WarehouseFilter;
