import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, X, Image as ImageIcon } from "lucide-react"; // Added Icons
import ProductFilterHeader from "../components/common/ProductFilterHeader";
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
import { generateProductListImage } from "../utils/file/imageExportUtils"; // Added
import { shareOrDownloadFile } from "../utils/file/fileUtils"; // Added
import LoadingOverlay from "../components/common/LoadingOverlay"; // Added

const Inventory = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  setTabBarVisible,
  updateFab,
  isActive,
}) => {
  const [detailProduct, setDetailProduct] = useState(null);
  const [editingBasicInfoProduct, setEditingBasicInfoProduct] = useState(null);

  // State mới cho Chế độ chọn (Selection Mode)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const { isSearchVisible, isAddButtonVisible, isScrolled, handleScroll } =
    useScrollHandling({
      mode: "staged",
      setTabBarVisible,
      searchHideThreshold: 140,
      showTabBarOnlyAtTop: true,
      // Override scroll callback để ẩn tabBar khi đang ở chế độ chọn
      onScrollCallback: useCallback(
        () => {
          if (isSelectionMode) {
            setTabBarVisible(false);
          }
        },
        [isSelectionMode, setTabBarVisible],
      ),
    });

  const {
    isModalOpen,
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

  // --- Handlers cho Chế độ Chọn ---

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedProductIds(new Set()); // Xoá danh sách chọn khi thoát
      }
      return !prev;
    });
  }, []);

  const toggleProductSelection = useCallback((productId) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleExportImage = async () => {
    if (selectedProductIds.size === 0) return;
    setIsExporting(true);
    // Chờ UI cập nhật
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const selectedProducts = products.filter((p) =>
        selectedProductIds.has(p.id),
      );
      const blob = await generateProductListImage(selectedProducts, {
        showTotal: true,
        title: "BÁO GIÁ SẢN PHẨM",
      });
      await shareOrDownloadFile(
        blob,
        `Bao_gia_${new Date().toISOString().slice(0, 10)}.png`,
        "image/png",
      );
      // Giữ nguyên chế độ chọn để có thể thao tác tiếp nếu cần
    } catch (err) {
      console.error(err);
      setErrorModal({
        title: "Lỗi xuất file",
        message: "Không thể tạo ảnh báo giá. Vui lòng thử lại.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      if (isSelectionMode) {
        updateFab({ isVisible: false }); // Ẩn FAB
        setTabBarVisible(false); // Ẩn TabBar để nhường chỗ cho thanh action
      } else {
        updateFab({
          isVisible: isAddButtonVisible,
          onClick: () => openModal(),
          icon: Plus,
          label: "Thêm hàng mới",
          color: "rose",
        });

        // Khôi phục hiển thị TabBar nếu không ở chế độ chọn
        setTabBarVisible(true);
      }
    }
  }, [
    isActive,
    isAddButtonVisible,
    openModal,
    updateFab,
    isSelectionMode,
    setTabBarVisible,
  ]);

  // Bắt buộc ẩn tab bar bất cứ khi nào chế độ chọn đang bật (chống lại sự kiện cuộn)
  useEffect(() => {
    if (isActive && isSelectionMode) {
      setTabBarVisible(false);
    }
  }, [isActive, isSelectionMode, isScrolled, setTabBarVisible]);


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

  const handleSearchChange = useCallback(
    (e) => setSearchTerm(e.target.value),
    [setSearchTerm],
  );

  const handleClearSearch = useCallback(
    () => setSearchTerm(""),
    [setSearchTerm],
  );

  return (
    <div className="relative h-full bg-transparent flex flex-col">
      <AppHeader className="z-20" isScrolled={isScrolled} />

      <div className="flex flex-col h-full pt-[calc(72px+env(safe-area-inset-top))] relative">
        <motion.div
          className="absolute top-[calc(72px+env(safe-area-inset-top))] left-0 right-0 z-10 bg-amber-50"
          initial={{ y: 0 }}
          animate={{ y: isSearchVisible ? 0 : -80 }}
          transition={{ duration: 0.3 }}
        >
          <ProductFilterHeader
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            enableFilters={false}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            warehouseFilter={warehouseFilter}
            onWarehouseChange={setWarehouseFilter}
            categories={settings.categories}
            namespace="inventory"
            // Props mới
            onToggleSelect={toggleSelectionMode}
            isSelectionMode={isSelectionMode}
          />
        </motion.div>

        <div
          className="flex-1 overflow-y-auto min-h-0 pt-[56px] overscroll-y-contain pb-[80px]" // Thêm padding dưới
          onScroll={(e) => {
            // handleScroll vẫn quản lý shadow header
             handleScroll(e);
            if (isScrollNearBottom(e.target) && hasMore) {
              loadMore();
            }
          }}
        >
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
            // Props mới
            isSelectionMode={isSelectionMode}
            selectedProductIds={selectedProductIds}
            onToggleProduct={toggleProductSelection}
          />
        </div>
      </div>

      {/* Thanh tác vụ chọn */}
      {isSelectionMode && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-rose-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-rose-700">
                {selectedProductIds.size}
              </span>
              <span className="text-sm text-gray-500">đã chọn</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium active:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <X size={18} /> Huỷ
              </button>
              <button
                onClick={handleExportImage}
                disabled={selectedProductIds.size === 0}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  selectedProductIds.size === 0
                    ? "bg-rose-200 text-rose-400 cursor-not-allowed"
                    : "bg-rose-600 text-white shadow-lg shadow-rose-200 active:scale-95"
                }`}
              >
                <ImageIcon size={18} /> Xuất ảnh
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading Overlay */}
      {isExporting && <LoadingOverlay text="Đang tạo ảnh báo giá..." />}

      <ProductBasicInfoModal
        isOpen={Boolean(editingBasicInfoProduct)}
        product={editingBasicInfoProduct}
        categories={settings.categories}
        onClose={() => setEditingBasicInfoProduct(null)}
        onError={setErrorModal}
        onSave={(updatedProduct) => {
          const duplicateCode = products.find(
            (p) =>
              p.productCode === updatedProduct.productCode &&
              p.id !== updatedProduct.id,
          );

          if (duplicateCode) {
            setErrorModal({
              title: "Mã sản phẩm trùng",
              message: `Mã sản phẩm "${updatedProduct.productCode}" đã được sử dụng bởi "${duplicateCode.name}".`,
            });
            return;
          }

          const newProducts = products.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p,
          );
          setProducts(newProducts);
          setEditingBasicInfoProduct(null);
        }}
      />

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
        onImageSelect={handleImageSelect}
        onMoneyChange={handleMoneyChange}
        onDecimalChange={handleDecimalChange}
        onCurrencyChange={handleCurrencyChange}
        onShippingMethodChange={handleShippingMethodChange}
        highlightOps={highlightOps}
      />

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEditLot={(lot) => {
          openEditLot(detailProduct, lot);
        }}
      />

      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

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
