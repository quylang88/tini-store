// Hook xử lý logic tạo/cập nhật đơn hàng
import { syncProductsStock } from "./orderStock";

const DEFAULT_STATUS = "shipping";
const DEFAULT_WAREHOUSE = "vinhPhuc";
const DEFAULT_ORDER_TYPE = "delivery";

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

    const payload = buildOrderPayload();
    const { items, warehouse } = payload;

    // Logic tên khách mặc định cho đơn bán tại kho nếu bỏ trống
    if (payload.orderType === "warehouse" && !payload.customerName) {
      if (payload.warehouse === "vinhPhuc") {
        payload.customerName = "Mẹ Hương";
      } else if (payload.warehouse === "lamDong") {
        payload.customerName = "Mẹ Nguyệt";
      }
    }

    // Calculate new products state synchronously to ensure order items are updated with allocations
    // BEFORE we save the order.
    // Lấy danh sách sản phẩm cũ nếu đang sửa đơn để sync stock
    const previousItems = isUpdate ? orderBeingEdited.items : [];
    const previousWarehouse = isUpdate
      ? orderBeingEdited.warehouse || DEFAULT_WAREHOUSE
      : null;

    // syncProductsStock will mutate 'items' to add lotAllocations
    const nextProducts = syncProductsStock(
      products, // Using prop products (assumed fresh enough)
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
