import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList,
  Image as ImageIcon,
  Plus,
  X,
} from "lucide-react";
import ProductFilterHeader from "../components/common/ProductFilterHeader";
import ProductFilterSection from "../components/common/ProductFilterSection";
import ScreenTransition from "../components/common/ScreenTransition";
import AppHeader from "../components/common/AppHeader";
import ProductList from "../components/inventory/ProductList";
import ProductDetailModal from "../components/inventory/ProductDetailModal";
import ProductModal from "../components/inventory/ProductModal";
import ProductBasicInfoModal from "../components/inventory/ProductBasicInfoModal";
import PurchaseListCompleteModal from "../components/inventory/PurchaseListCompleteModal";
import PurchaseListFormModal from "../components/inventory/PurchaseListFormModal";
import PurchaseListItemFormModal from "../components/inventory/PurchaseListItemFormModal";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import LoadingOverlay from "../components/common/LoadingOverlay";
import SelectionActionBar from "../components/common/SelectionActionBar";
import useInventoryLogic from "../hooks/inventory/useInventoryLogic";
import usePurchaseListLogic from "../hooks/inventory/usePurchaseListLogic";
import useScrollHandling from "../hooks/ui/useScrollHandling";
import usePagination from "../hooks/ui/usePagination";
import { isScrollNearBottom } from "../utils/ui/scrollUtils";
import { generateProductListImage } from "../utils/file/imageExportUtils";
import { shareOrDownloadFile } from "../utils/file/fileUtils";
import PurchaseListsView from "./inventory/PurchaseListsView";
import PurchaseListDetailView from "./inventory/PurchaseListDetailView";

const Inventory = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  purchaseLists,
  setPurchaseLists,
  setTabBarVisible,
  updateFab,
  isActive,
}) => {
  const [detailProduct, setDetailProduct] = useState(null);
  const [editingBasicInfoProduct, setEditingBasicInfoProduct] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [inventoryView, setInventoryView] = useState("inventory");
  const [viewDirection, setViewDirection] = useState(0);

  const { isSearchVisible, isAddButtonVisible, isScrolled, handleScroll } =
    useScrollHandling({
      mode: "staged",
      setTabBarVisible,
      searchHideThreshold: 140,
      showTabBarOnlyAtTop: true,
      lockTabBarHidden: isSelectionMode || inventoryView !== "inventory",
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

  const {
    sortedPurchaseLists,
    selectedListId,
    setSelectedListId,
    selectedList,
    listFormState,
    openCreateListForm,
    openEditListForm,
    closeListForm,
    saveList,
    deleteList,
    itemFormState,
    openCreateItemForm,
    openEditItemForm,
    closeItemForm,
    saveItem,
    deleteItem,
    completionState,
    closeCompletionModal,
    finalizeItemCompletion,
    requestCompleteItem,
    confirmModal: purchaseListConfirmModal,
    setConfirmModal: setPurchaseListConfirmModal,
    errorModal: purchaseListErrorModal,
    setErrorModal: setPurchaseListErrorModal,
    completingItemId,
  } = usePurchaseListLogic({
    purchaseLists,
    setPurchaseLists,
    products,
    setProducts,
  });

  const itemFormList = useMemo(
    () =>
      purchaseLists.find((list) => list.id === itemFormState.listId) || null,
    [itemFormState.listId, purchaseLists],
  );

  const completionList = useMemo(
    () =>
      purchaseLists.find((list) => list.id === completionState.listId) || null,
    [completionState.listId, purchaseLists],
  );

  const completionItem = useMemo(
    () =>
      completionList?.items?.find((item) => item.id === completionState.itemId) ||
      null,
    [completionList, completionState.itemId],
  );

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedProductIds(new Set());
      }
      return !prev;
    });
  }, []);

  const toggleProductSelection = useCallback((productId) => {
    setSelectedProductIds((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(productId)) {
        nextSet.delete(productId);
      } else {
        nextSet.add(productId);
      }
      return nextSet;
    });
  }, []);

  const handleExportImage = async () => {
    if (selectedProductIds.size === 0) return;
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      const selectedProducts = products.filter((product) =>
        selectedProductIds.has(product.id),
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
    (event) => setSearchTerm(event.target.value),
    [setSearchTerm],
  );

  const handleClearSearch = useCallback(() => setSearchTerm(""), [setSearchTerm]);

  const openPurchaseLists = useCallback(() => {
    setViewDirection(1);
    setInventoryView("purchase-lists");
  }, []);

  const closePurchaseLists = useCallback(() => {
    setViewDirection(-1);
    setInventoryView("inventory");
    setSelectedListId(null);
  }, [setSelectedListId]);

  const openPurchaseListDetail = useCallback(
    (listId) => {
      setSelectedListId(listId);
      setViewDirection(1);
      setInventoryView("purchase-list-detail");
    },
    [setSelectedListId],
  );

  const closePurchaseListDetail = useCallback(() => {
    setViewDirection(-1);
    setInventoryView("purchase-lists");
  }, []);

  useEffect(() => {
    if (
      inventoryView === "purchase-list-detail" &&
      selectedListId &&
      !selectedList
    ) {
      setViewDirection(-1);
      setInventoryView("purchase-lists");
    }
  }, [inventoryView, selectedList, selectedListId]);

  useEffect(() => {
    if (!isActive) return;

    if (inventoryView === "purchase-lists") {
      updateFab({
        isVisible: true,
        onClick: openCreateListForm,
        icon: Plus,
        label: "Tạo danh sách mua",
        color: "rose",
      });
      setTabBarVisible(false);
      return;
    }

    if (inventoryView === "purchase-list-detail") {
      updateFab({
        isVisible: Boolean(selectedList),
        onClick: () => {
          if (selectedList) {
            openCreateItemForm(selectedList.id);
          }
        },
        icon: Plus,
        label: "Thêm mặt hàng cần mua",
        color: "rose",
      });
      setTabBarVisible(false);
      return;
    }

    if (isSelectionMode) {
      updateFab({ isVisible: false });
      setTabBarVisible(false);
      return;
    }

    updateFab({
      isVisible: isAddButtonVisible,
      onClick: () => openModal(),
      icon: Plus,
      label: "Thêm hàng mới",
      color: "rose",
    });
    setTabBarVisible(true);
  }, [
    inventoryView,
    isActive,
    isAddButtonVisible,
    isSelectionMode,
    openCreateItemForm,
    openCreateListForm,
    openModal,
    selectedList,
    setTabBarVisible,
    updateFab,
  ]);

  const renderInventoryHome = () => (
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
            actionButton={
              isSelectionMode
                ? null
                : {
                    label: "Danh sách mua",
                    icon: ClipboardList,
                    onClick: openPurchaseLists,
                  }
            }
            onToggleSelect={toggleSelectionMode}
            isSelectionMode={isSelectionMode}
          />
        </motion.div>

        <div
          className={`flex-1 overflow-y-auto min-h-0 pt-[56px] overscroll-y-contain ${
            isSelectionMode ? "pb-[11rem]" : "pb-[80px]"
          }`}
          onScroll={(event) => {
            handleScroll(event);
            if (isScrollNearBottom(event.target) && hasMore) {
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
            isSelectionMode={isSelectionMode}
            selectedProductIds={selectedProductIds}
            onToggleProduct={toggleProductSelection}
          />
        </div>
      </div>

      <SelectionActionBar
        visible={isSelectionMode}
        count={selectedProductIds.size}
        title={
          selectedProductIds.size > 0
            ? "Sẵn sàng tạo ảnh báo giá"
            : "Chọn sản phẩm để xuất ảnh"
        }
        subtitle={
          selectedProductIds.size > 0
            ? "Giữ nguyên lựa chọn sau khi xuất để thao tác tiếp."
            : "Bạn có thể chọn một hoặc nhiều sản phẩm trong cùng danh sách."
        }
        secondaryAction={{
          label: "Thoát",
          icon: X,
          onClick: toggleSelectionMode,
        }}
        primaryAction={{
          label: "Xuất ảnh",
          icon: ImageIcon,
          onClick: handleExportImage,
          disabled: selectedProductIds.size === 0,
        }}
      />
    </div>
  );

  return (
    <div className="relative h-full bg-transparent flex flex-col">
      <AnimatePresence mode="popLayout" initial={false} custom={viewDirection}>
        {inventoryView === "inventory" && (
          <ScreenTransition
            key="inventory-home"
            custom={viewDirection}
            className="h-full"
          >
            {renderInventoryHome()}
          </ScreenTransition>
        )}

        {inventoryView === "purchase-lists" && (
          <ScreenTransition
            key="purchase-lists"
            custom={viewDirection}
            className="h-full"
            onSwipeBack={closePurchaseLists}
          >
            <PurchaseListsView
              purchaseLists={sortedPurchaseLists}
              onBack={closePurchaseLists}
              onOpenList={openPurchaseListDetail}
              onCreateList={openCreateListForm}
              onEditList={openEditListForm}
              onDeleteList={(list) => deleteList(list)}
            />
          </ScreenTransition>
        )}

        {inventoryView === "purchase-list-detail" && selectedList && (
          <ScreenTransition
            key={`purchase-list-detail-${selectedList.id}`}
            custom={viewDirection}
            className="h-full"
            onSwipeBack={closePurchaseListDetail}
          >
            <PurchaseListDetailView
              list={selectedList}
              products={products}
              onBack={closePurchaseListDetail}
              onEditList={openEditListForm}
              onDeleteList={(list) =>
                deleteList(list, { onDeleted: closePurchaseListDetail })
              }
              onEditItem={openEditItemForm}
              onDeleteItem={deleteItem}
              onCompleteItem={(listId, item) =>
                requestCompleteItem({ listId, item })
              }
              completingItemId={completingItemId}
            />
          </ScreenTransition>
        )}
      </AnimatePresence>

      {isExporting && <LoadingOverlay text="Đang tạo ảnh báo giá..." />}

      <ProductBasicInfoModal
        isOpen={Boolean(editingBasicInfoProduct)}
        product={editingBasicInfoProduct}
        categories={settings.categories}
        onClose={() => setEditingBasicInfoProduct(null)}
        onError={setErrorModal}
        onSave={(updatedProduct) => {
          const duplicateCode = products.find(
            (product) =>
              product.productCode === updatedProduct.productCode &&
              product.id !== updatedProduct.id,
          );

          if (duplicateCode) {
            setErrorModal({
              title: "Mã sản phẩm trùng",
              message: `Mã sản phẩm "${updatedProduct.productCode}" đã được sử dụng bởi "${duplicateCode.name}".`,
            });
            return;
          }

          const nextProducts = products.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product,
          );
          setProducts(nextProducts);
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

      <PurchaseListFormModal
        open={listFormState.open}
        list={listFormState.list}
        onClose={closeListForm}
        onSave={saveList}
      />

      <PurchaseListItemFormModal
        open={itemFormState.open}
        list={itemFormList}
        item={itemFormState.item}
        products={products}
        onClose={closeItemForm}
        onSave={saveItem}
      />

      <PurchaseListCompleteModal
        open={completionState.open}
        mode={completionState.mode}
        list={completionList}
        item={completionItem}
        categories={settings.categories}
        initialValues={completionState.initialValues}
        onClose={closeCompletionModal}
        onSubmit={(completionData) =>
          finalizeItemCompletion({
            listId: completionState.listId,
            itemId: completionState.itemId,
            completionData,
          })
        }
      />

      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
      />
      <ConfirmModalHost
        modal={purchaseListConfirmModal}
        onClose={() => setPurchaseListConfirmModal(null)}
      />

      <ErrorModal
        open={Boolean(errorModal)}
        title={errorModal?.title}
        message={errorModal?.message}
        onClose={() => setErrorModal(null)}
      />
      <ErrorModal
        open={Boolean(purchaseListErrorModal)}
        title={purchaseListErrorModal?.title}
        message={purchaseListErrorModal?.message}
        onClose={() => setPurchaseListErrorModal(null)}
      />
    </div>
  );
};

export default Inventory;
