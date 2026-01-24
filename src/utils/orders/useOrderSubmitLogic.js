// Hook xử lý logic tạo/cập nhật đơn hàng
import { syncProductsStock } from "./orderStock";
import { syncHistoryWithStock } from "../inventory/historyUtils";

const DEFAULT_STATUS = "shipping";
const DEFAULT_WAREHOUSE = "vinhPhuc";
const DEFAULT_ORDER_TYPE = "delivery";

const useOrderSubmitLogic = ({
  products, // ADDED: Need current products to calculate stock & allocations
  setProducts,
  orders,
  setOrders,
  orderType,
  customerName,
  customerAddress,
  shippingFee,
  orderComment,
  selectedWarehouse,
  reviewItems,
  totalAmount,
  orderBeingEdited,
  clearDraft,
  setView,
  setErrorModal,
}) => {
  const getNextOrderNumber = () => {
    // Tạo số đơn 4 chữ số ngẫu nhiên để thay thế STT tuần tự.
    const usedNumbers = new Set(
      orders.map((order) => String(order.orderNumber)).filter(Boolean),
    );
    const generateNumber = () =>
      String(Math.floor(1000 + Math.random() * 9000));
    let nextNumber = generateNumber();
    let attempts = 0;
    while (usedNumbers.has(nextNumber) && attempts < 20) {
      nextNumber = generateNumber();
      attempts += 1;
    }
    // Nếu trùng quá nhiều thì fallback về 4 số cuối của timestamp.
    if (usedNumbers.has(nextNumber)) {
      nextNumber = String(Date.now()).slice(-4);
    }
    return nextNumber;
  };

  const normalizeShippingFee = () => {
    // Chỉ tính phí gửi khi đơn là gửi khách, còn bán tại kho thì 0.
    return orderType === "delivery" ? Number(shippingFee || 0) : 0;
  };

  // Kiểm tra điều kiện tối thiểu trước khi tạo/cập nhật đơn.
  const ensureOrderReady = (actionLabel) => {
    if (reviewItems.length === 0) {
      // Cảnh báo khi chưa chọn sản phẩm nào.
      setErrorModal({
        title: "Thiếu sản phẩm",
        message: "Vui lòng chọn ít nhất 1 sản phẩm trước khi thao tác.",
      });
      return false;
    }
    if (
      orderType === "delivery" &&
      (!customerName.trim() || !customerAddress.trim())
    ) {
      // Mở modal cảnh báo khi thiếu thông tin gửi khách.
      setErrorModal({
        title: "Thiếu thông tin khách hàng",
        message: `Vui lòng nhập tên và địa chỉ khách hàng trước khi ${actionLabel}.`,
      });
      return false;
    }
    return true;
  };

  const buildOrderPayload = (enrichedItems) => {
    return {
      items: enrichedItems,
      total: totalAmount,
      warehouse: selectedWarehouse,
      orderType,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      shippingFee: normalizeShippingFee(),
    };
  };

  // Hàm dùng chung để lưu đơn (tạo mới hoặc cập nhật)
  const saveOrder = ({ isUpdate }) => {
    if (!ensureOrderReady(isUpdate ? "cập nhật đơn" : "tạo đơn")) return false;

    // 1. Prepare Data
    const basicItems = reviewItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      cost: item.cost,
    }));

    // Logic tên khách mặc định
    let finalCustomerName = customerName.trim();
    if (orderType === "warehouse" && !finalCustomerName) {
      if (selectedWarehouse === "vinhPhuc") {
        finalCustomerName = "Mẹ Hương";
      } else if (selectedWarehouse === "daLat" || selectedWarehouse === "lamDong") {
        finalCustomerName = "Mẹ Nguyệt";
      }
    }

    // 2. Calculate Stock & Allocations
    const previousItems = isUpdate ? orderBeingEdited.items : [];
    const previousWarehouse = isUpdate
      ? orderBeingEdited.warehouse || DEFAULT_WAREHOUSE
      : null;

    // We must use 'products' from props to get synchronous result for setOrders
    const { nextProducts, orderAllocationsMap, historyEvents } = syncProductsStock(
      products,
      basicItems,
      previousItems,
      selectedWarehouse,
      previousWarehouse
    );

    // 3. Update Products State
    setProducts(nextProducts);

    // 4. Update Import History (Side Effect)
    if (historyEvents && historyEvents.length > 0) {
      historyEvents.forEach((evt) => {
        syncHistoryWithStock(evt.productId, evt.allocations, evt.mode);
      });
    }

    // 5. Build Enriched Items with Allocations
    const enrichedItems = basicItems.map(item => ({
      ...item,
      lotAllocations: orderAllocationsMap.get(item.productId) || []
    }));

    // 6. Update Orders State
    const payload = {
        items: enrichedItems,
        total: totalAmount,
        warehouse: selectedWarehouse,
        orderType,
        customerName: finalCustomerName,
        customerAddress: customerAddress.trim(),
        shippingFee: normalizeShippingFee(),
    }

    if (isUpdate) {
      const updatedOrder = {
        ...orderBeingEdited,
        ...payload,
        comment: orderComment.trim(),
      };
      setOrders(
        orders.map((order) =>
          order.id === orderBeingEdited.id ? updatedOrder : order,
        ),
      );
    } else {
      const initialStatus =
        payload.orderType === "warehouse" ? "pending" : DEFAULT_STATUS;

      const newOrder = {
        id: Date.now().toString(),
        orderNumber: getNextOrderNumber(),
        status: initialStatus,
        date: new Date().toISOString(),
        ...payload,
        comment: orderComment.trim(),
      };
      setOrders([...orders, newOrder]);
    }

    clearDraft();
    return true;
  };

  const handleCreateOrder = () => saveOrder({ isUpdate: false });
  const handleUpdateOrder = () => saveOrder({ isUpdate: true });

  const finishCreateOrder = () => {
    clearDraft();
    setView("list");
  };

  return {
    saveOrder,
    handleCreateOrder,
    handleUpdateOrder,
    finishCreateOrder,
  };
};

export default useOrderSubmitLogic;
