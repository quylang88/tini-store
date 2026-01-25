// Hook xử lý logic tạo/cập nhật đơn hàng
import { syncProductsStock } from "./orderStock";
import {
  getDefaultWarehouse,
  getWarehouses,
  resolveWarehouseKey,
} from "../inventory/warehouseUtils";

const DEFAULT_STATUS = "shipping";

const useOrderSubmitLogic = ({
  products,
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
  processOrderForCustomer,
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

  const buildOrderPayload = () => {
    // Chuẩn hoá dữ liệu đơn để dùng chung cho tạo mới và cập nhật.
    const orderItems = reviewItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      cost: item.cost,
    }));

    return {
      items: orderItems,
      total: totalAmount,
      warehouse: resolveWarehouseKey(selectedWarehouse),
      orderType,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      shippingFee: normalizeShippingFee(),
    };
  };

  // Hàm dùng chung để lưu đơn (tạo mới hoặc cập nhật)
  const saveOrder = ({ isUpdate }) => {
    if (!ensureOrderReady(isUpdate ? "cập nhật đơn" : "tạo đơn")) return false;

    const payload = buildOrderPayload();
    const { items, warehouse } = payload;

    // Logic tên khách mặc định cho đơn bán tại kho nếu bỏ trống
    if (payload.orderType === "warehouse" && !payload.customerName) {
      const warehouseConfig = getWarehouses().find(
        (w) => w.key === payload.warehouse,
      );
      if (warehouseConfig && warehouseConfig.defaultCustomerName) {
        payload.customerName = warehouseConfig.defaultCustomerName;
      }
    }

    // Tính toán trạng thái sản phẩm mới đồng bộ để đảm bảo các item trong đơn được cập nhật với allocations
    // TRƯỚC KHI lưu đơn.
    // Lấy danh sách sản phẩm cũ nếu đang sửa đơn để sync stock
    const previousItems = isUpdate ? orderBeingEdited.items : [];
    const previousWarehouse = isUpdate
      ? resolveWarehouseKey(orderBeingEdited.warehouse) ||
        getDefaultWarehouse().key
      : null;

    // syncProductsStock sẽ thay đổi trực tiếp 'items' để thêm lotAllocations
    const nextProducts = syncProductsStock(
      products, // Sử dụng prop products (giả định là đủ mới)
      items,
      previousItems,
      warehouse,
      previousWarehouse,
    );

    setProducts(nextProducts);

    if (isUpdate) {
      // Khi update, giữ status cũ. Nếu muốn reset status theo loại đơn thì logic phức tạp hơn
      // nhưng thường update chỉ đổi nội dung.
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

      // Update customer stats
      if (processOrderForCustomer) {
        processOrderForCustomer(updatedOrder, true);
      }
    } else {
      // Xác định trạng thái ban đầu: Tại kho -> Chờ thanh toán, Gửi hàng -> Đang giao
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

      // Update customer stats
      if (processOrderForCustomer) {
        processOrderForCustomer(newOrder, false);
      }
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
