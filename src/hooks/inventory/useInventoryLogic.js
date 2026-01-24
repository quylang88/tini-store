import { useRef, useState, useCallback } from "react";
import {
  createFormDataForLot,
  createFormDataForNewProduct,
  createFormDataForProduct,
} from "../../utils/inventory/inventoryForm";
import useInventoryFormState from "./useInventoryFormState";
import useInventoryFilters from "./useInventoryFilters";
import {
  buildNextProductFromForm,
  getInventoryValidationError,
} from "../../utils/inventory/inventorySaveUtils";
import useHighlightFields from "../ui/useHighlightFields";
import { logImportTransaction, updateImportHistoryRecord } from "../../utils/inventory/historyUtils";
import { normalizeWarehouseStock } from "../../utils/inventory/warehouseUtils";

const useInventoryLogic = ({ products, setProducts, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingLotId, setEditingLotId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Modal xác nhận xoá sản phẩm để giao diện đồng bộ
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal báo lỗi riêng cho form tạo/sửa sản phẩm
  const [errorModal, setErrorModal] = useState(null);
  // Lưu lại snapshot form khi mở modal để so sánh thay đổi khi bấm huỷ.
  const initialFormDataRef = useRef(null);

  // History Modals State
  const [historyProduct, setHistoryProduct] = useState(null);
  const [editingHistoryRecord, setEditingHistoryRecord] = useState(null);

  // State quản lý danh mục đang xem (cho phép chọn nhiều danh mục).
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [warehouseFilter, setWarehouseFilter] = useState("all");

  // State quản lý sắp xếp (Mặc định: nhập mới nhất trước)
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Form data phục vụ nhập kho: nhập giá, tồn kho, phí gửi theo từng kho.
  const {
    formData,
    setFormData,
    handleMoneyChange,
    handleCurrencyChange,
    handleShippingMethodChange,
    handleDecimalChange,
    handleImageSelect,
  } = useInventoryFormState({ settings, activeCategory });

  const highlightOps = useHighlightFields();

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    const existingProduct = products.find((p) => p.barcode === decodedText);

    if (existingProduct) {
      // Cảnh báo khi mã vạch đã tồn tại để user biết dùng sản phẩm cũ.
      setErrorModal({
        title: "Sản phẩm đã tồn tại",
        message: `Sản phẩm này đã có: ${existingProduct.name}.`,
      });
      openModal(existingProduct);
    } else {
      if (isModalOpen) {
        setFormData((prev) => ({ ...prev, barcode: decodedText }));
      } else {
        openModal();
        setTimeout(
          () => setFormData((prev) => ({ ...prev, barcode: decodedText })),
          100,
        );
      }
    }
  };

  const handleSave = () => {
    const validationError = getInventoryValidationError({
      formData,
      products,
      editingProduct,
      editingLotId,
    });
    if (validationError) {
      setErrorModal(validationError);
      if (validationError.missingFields) {
        highlightOps.triggerHighlights(validationError.missingFields);
      }
      return false;
    }

    const nextProduct = buildNextProductFromForm({
      formData,
      editingProduct,
      editingLotId,
      settings,
    });

    // History Logging Logic
    const quantityValue = Number(formData.quantity) || 0;
    if (quantityValue > 0) {
      if (editingLotId) {
        // Edit existing lot
        const updatedLot = nextProduct.purchaseLots.find(l => l.id === editingLotId);
        if (updatedLot) {
          updateImportHistoryRecord({
            id: updatedLot.id,
            productId: nextProduct.id,
            productName: nextProduct.name, // In case name changed
            cost: Number(updatedLot.cost) || 0,
            costJpy: updatedLot.costJpy ? Number(updatedLot.costJpy) : undefined, // NEW
            priceAtPurchase: Number(updatedLot.priceAtPurchase) || 0,
            remainingQuantity: Number(updatedLot.quantity) || 0,
            warehouse: updatedLot.warehouse,
            shipping: updatedLot.shipping
          });
        }
      } else {
        // New Lot
        const newLot = nextProduct.purchaseLots[nextProduct.purchaseLots.length - 1];
        if (newLot) {
           logImportTransaction(nextProduct, newLot);
        }
      }
    }

    if (editingProduct) {
      setProducts(
        products.map((p) => (p.id === editingProduct.id ? nextProduct : p)),
      );
    } else {
      setProducts([...products, nextProduct]);
    }
    closeModal();
    return true;
  };

  // History Handling
  const handleSaveHistory = (updatedRecord) => {
      // 1. Update History in LocalStorage
      updateImportHistoryRecord(updatedRecord);

      // 2. Sync Product State (Remaining Quantity & Metadata)
      const targetProduct = products.find(p => p.id === updatedRecord.productId);
      if (targetProduct) {
          const nextLots = (targetProduct.purchaseLots || []).map(lot => {
              if (lot.id === updatedRecord.id) {
                  return {
                      ...lot,
                      quantity: Number(updatedRecord.remainingQuantity) || 0,
                      cost: Number(updatedRecord.cost) || 0,
                      warehouse: updatedRecord.warehouse, // Sync Warehouse
                      shipping: updatedRecord.shipping,   // Sync Shipping
                      // Sync CostJpy if exists in record
                      costJpy: updatedRecord.costJpy ? Number(updatedRecord.costJpy) : lot.costJpy,
                  };
              }
              return lot;
          });

          // Re-calculate warehouse totals
          const nextStockByWarehouse = nextLots.reduce((acc, lot) => {
              const w = lot.warehouse === 'daLat' ? 'lamDong' : (lot.warehouse || 'lamDong');
              acc[w] = (acc[w] || 0) + (Number(lot.quantity) || 0);
              return acc;
          }, { lamDong: 0, vinhPhuc: 0 });

          const nextProduct = {
              ...targetProduct,
              purchaseLots: nextLots,
              stockByWarehouse: nextStockByWarehouse,
              stock: nextStockByWarehouse.lamDong + nextStockByWarehouse.vinhPhuc
          };

          setProducts(prev => prev.map(p => p.id === targetProduct.id ? nextProduct : p));

          // Update local historyProduct state to reflect changes in modal immediately if needed
          if (historyProduct && historyProduct.id === targetProduct.id) {
              setHistoryProduct(nextProduct);
          }
      }

      setEditingHistoryRecord(null);
  };

  const buildComparableFormData = (data) => {
    if (!data) return data;
    // Khi nhập theo Yên, cost được tự tính nên cần chuẩn hoá trước khi so sánh.
    if (data.costCurrency === "JPY") {
      const jpyValue = Number(data.costJPY || 0);
      const exchangeValue = Number(data.exchangeRate || 0);
      return {
        ...data,
        cost:
          jpyValue > 0 && exchangeValue > 0
            ? Math.round(jpyValue * exchangeValue)
            : "",
      };
    }
    return data;
  };

  const hasFormChanges = () => {
    if (!initialFormDataRef.current) return false;
    const initialSnapshot = JSON.stringify(
      buildComparableFormData(initialFormDataRef.current),
    );
    const currentSnapshot = JSON.stringify(buildComparableFormData(formData));
    return initialSnapshot !== currentSnapshot;
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setEditingLotId(null);
      const nextFormData = createFormDataForProduct({ product, settings });
      setFormData(nextFormData);
      initialFormDataRef.current = nextFormData;
    } else {
      setEditingProduct(null);
      setEditingLotId(null);
      const nextFormData = createFormDataForNewProduct({
        settings,
        activeCategory,
      });
      setFormData(nextFormData);
      initialFormDataRef.current = nextFormData;
    }
    setIsModalOpen(true);
  };

  const openEditLot = (product, lot) => {
    if (!product || !lot) return;
    setEditingProduct(product);
    setEditingLotId(lot.id);
    const nextFormData = createFormDataForLot({ product, lot, settings });
    setFormData(nextFormData);
    initialFormDataRef.current = nextFormData;
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setEditingLotId(null);
    initialFormDataRef.current = null;
  };

  const handleCancelModal = () => {
    // Nếu không có thay đổi thì đóng luôn, tránh hỏi user.
    if (!hasFormChanges()) {
      closeModal();
      return;
    }
    // Có chỉnh sửa thì hiện cảnh báo để tránh mất dữ liệu.
    setConfirmModal({
      title: "Huỷ chỉnh sửa?",
      message: "Bạn đang có thay đổi chưa lưu. Bạn có chắc muốn huỷ không?",
      confirmLabel: "Huỷ thay đổi",
      cancelLabel: "Tiếp tục sửa",
      tone: "danger",
      onConfirm: () => closeModal(),
    });
  };

  // Sử dụng useCallback để giữ reference của hàm handleDelete ổn định giữa các lần render.
  // Điều này rất quan trọng để React.memo trong ProductListItem hoạt động hiệu quả,
  // tránh việc các item trong danh sách bị render lại khi cha render (ví dụ khi scroll).
  const handleDelete = useCallback(
    (product) => {
      setConfirmModal({
        title: "Xoá sản phẩm?",
        message: product
          ? `Bạn có chắc muốn xoá "${product.name}" khỏi kho?`
          : "Bạn có chắc muốn xoá sản phẩm này?",
        confirmLabel: "Xoá sản phẩm",
        tone: "danger",
        onConfirm: () =>
          setProducts((prev) => prev.filter((p) => p.id !== product.id)),
      });
    },
    [setProducts],
  );

  const { filteredProducts, nameSuggestions } = useInventoryFilters({
    products,
    searchTerm,
    activeCategory,
    warehouseFilter,
    editingProduct,
    formDataName: formData.name,
    sortConfig,
  });

  const handleSelectExistingProduct = (product) => {
    setEditingProduct(product);
    setEditingLotId(null);
    setFormData(createFormDataForProduct({ product, settings }));
  };

  return {
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
    setWarehouseFilter,
    handleCurrencyChange,
    handleShippingMethodChange,
    formData,
    setFormData,
    handleMoneyChange,
    handleDecimalChange,
    handleScanSuccess,
    handleImageSelect,
    handleSave,
    openModal,
    openEditLot,
    closeModal,
    handleCancelModal,
    handleDelete,
    filteredProducts,
    nameSuggestions,
    handleSelectExistingProduct,
    sortConfig,
    setSortConfig,
    highlightOps,
    // History Exports
    historyProduct,
    setHistoryProduct,
    editingHistoryRecord,
    setEditingHistoryRecord,
    handleSaveHistory
  };
};

export default useInventoryLogic;
