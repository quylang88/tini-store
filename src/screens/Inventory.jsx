import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import ProductFilterHeader from "../components/common/ProductFilterHeader";

// Tối ưu hóa: Lazy load BarcodeScanner để giảm kích thước bundle ban đầu.
// Thư viện html5-qrcode rất nặng (~300KB), chỉ nên tải khi người dùng cần quét mã.
const BarcodeScanner = React.lazy(() => import("../components/BarcodeScanner"));
import ProductFilterSection from "../components/common/ProductFilterSection";
import ProductList from "../components/inventory/ProductList";
import ProductDetailModal from "../components/inventory/ProductDetailModal";
import ProductModal from "../components/inventory/ProductModal";
import ProductBasicInfoModal from "../components/inventory/ProductBasicInfoModal";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import useInventoryLogic from "../hooks/inventory/useInventoryLogic";
import useScrollHandling from "../hooks/ui/useScrollHandling";
import AppHeader from "../components/common/AppHeader";
import usePagination from "../hooks/ui/usePagination";
import { isScrollNearBottom } from "../utils/ui/scrollUtils";

const Inventory = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  setTabBarVisible,
  updateFab,
}) => {
  const [detailProduct, setDetailProduct] = useState(null);
  const [editingBasicInfoProduct, setEditingBasicInfoProduct] = useState(null);

  const { isSearchVisible, isAddButtonVisible, isScrolled, handleScroll } =
    useScrollHandling({
      mode: "staged",
      setTabBarVisible,
      searchHideThreshold: 140,
      showTabBarOnlyAtTop: true,
    });

  const {
    isModalOpen,
    showScanner,
    setShowScanner,
    editingProduct,
    editingLotId,
    searchTerm,
    setSearchTerm,
    confirmModal,
    setConfirmModal,
    errorModal,
    setErrorModal,
    activeCategory,
    setActiveCategory,
    warehouseFilter,
    formData,
    setFormData,
    handleMoneyChange,
    handleDecimalChange,
    handleCurrencyChange,
    handleShippingMethodChange,
    handleScanSuccess,
    handleImageSelect,
    handleSave,
    openModal,
    openEditLot,
    handleCancelModal,
    handleDelete,
    filteredProducts,
    nameSuggestions,
    handleSelectExistingProduct,
    setWarehouseFilter,
    sortConfig,
    setSortConfig,
    highlightOps,
    debouncedSearchTerm,
  } = useInventoryLogic({ products, setProducts, orders, setOrders, settings });

  useEffect(() => {
    updateFab({
      isVisible: isAddButtonVisible,
      onClick: () => openModal(),
      icon: Plus,
      label: "Thêm hàng mới",
      color: "rose",
    });
  }, [isAddButtonVisible, openModal, updateFab]);

  const {
    visibleData: visibleProducts,
    loadMore,
    hasMore,
  } = usePagination(filteredProducts, {
    pageSize: 20,
    resetDeps: [
      debouncedSearchTerm,
      activeCategory,
      warehouseFilter,
      sortConfig,
    ],
  });

  return (
    <div className="relative h-full bg-transparent flex flex-col">
      <AppHeader className="z-20" isScrolled={isScrolled} />

      {showScanner && (
        <React.Suspense
          fallback={
            <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-white font-medium">Đang tải máy quét...</div>
            </div>
          }
        >
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
          />
        </React.Suspense>
      )}

      {/* Container cho nội dung chính, bắt đầu từ dưới AppHeader */}
      <div className="flex flex-col h-full pt-[calc(72px+env(safe-area-inset-top))] relative">
        {/* InventoryHeader cố định phía trên danh sách (Chỉ Search) */}
        <motion.div
          className="absolute top-[calc(72px+env(safe-area-inset-top))] left-0 right-0 z-10 bg-amber-50"
          initial={{ y: 0 }}
          animate={{ y: isSearchVisible ? 0 : -80 }}
          transition={{ duration: 0.3 }}
        >
          <ProductFilterHeader
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onClearSearch={() => setSearchTerm("")}
            onShowScanner={() => setShowScanner(true)}
            enableFilters={false} // Tắt filter trong header cố định
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            warehouseFilter={warehouseFilter}
            onWarehouseChange={setWarehouseFilter}
            categories={settings.categories}
            namespace="inventory"
          />
        </motion.div>

        {/* Product List cuộn bên dưới InventoryHeader */}
        <div
          className="flex-1 overflow-y-auto min-h-0 pt-[56px] overscroll-y-contain"
          onScroll={(e) => {
            handleScroll(e);
            if (isScrollNearBottom(e.target) && hasMore) {
              loadMore();
            }
          }}
        >
          {/* Filter Section nằm trong luồng scroll */}
          <ProductFilterSection
            warehouseFilter={warehouseFilter}
            onWarehouseChange={setWarehouseFilter}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categories={settings.categories}
            namespace="inventory"
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
          />
          <ProductList
            products={visibleProducts}
            onDelete={handleDelete}
            onOpenDetail={setDetailProduct}
            activeCategory={activeCategory}
            activeWarehouse={warehouseFilter}
            onEditBasicInfo={setEditingBasicInfoProduct}
          />
        </div>
      </div>

      {/* Tách form modal và bổ sung nút chụp ảnh từ camera */}
      {/* Modal sửa thông tin cơ bản */}
      <ProductBasicInfoModal
        isOpen={Boolean(editingBasicInfoProduct)}
        product={editingBasicInfoProduct}
        categories={settings.categories}
        onClose={() => setEditingBasicInfoProduct(null)}
        onShowScanner={() => setShowScanner(true)}
        onError={setErrorModal}
        onSave={(updatedProduct) => {
          const newProducts = products.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p,
          );
          setProducts(newProducts);
          // Cập nhật lại list đã filter nếu cần thiết (handle bởi useInventoryLogic qua prop products)
          setEditingBasicInfoProduct(null);
        }}
      />

      {/* Tách form modal và bổ sung nút chụp ảnh từ camera */}
      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        editingLotId={editingLotId}
        formData={formData}
        setFormData={setFormData}
        settings={settings}
        nameSuggestions={nameSuggestions}
        onSelectExistingProduct={handleSelectExistingProduct}
        categories={settings.categories}
        onClose={handleCancelModal}
        onSave={() => {
          if (handleSave()) {
            setDetailProduct(null);
          }
        }}
        onShowScanner={() => setShowScanner(true)}
        onImageSelect={handleImageSelect}
        onMoneyChange={handleMoneyChange}
        onDecimalChange={handleDecimalChange}
        onCurrencyChange={handleCurrencyChange}
        onShippingMethodChange={handleShippingMethodChange}
        highlightOps={highlightOps}
      />

      {/* Modal chi tiết sản phẩm khi chạm vào item */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEditLot={(lot) => {
          openEditLot(detailProduct, lot);
        }}
      />

      {/* Modal xác nhận xoá để thay thế popup mặc định */}
      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

      {/* Modal báo lỗi riêng cho form tạo/sửa sản phẩm */}
      <ErrorModal
        open={Boolean(errorModal)}
        title={errorModal?.title}
        message={errorModal?.message}
        onClose={() => setErrorModal(null)}
      />
    </div>
  );
};

export default Inventory;
