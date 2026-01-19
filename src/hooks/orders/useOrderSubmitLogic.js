import { useState } from "react";
import { syncProductsStock } from "../../utils/orderStock";

const DEFAULT_STATUS = "shipping";
const DEFAULT_WAREHOUSE = "vinhPhuc";
const DEFAULT_ORDER_TYPE = "delivery";

const useOrderSubmitLogic = ({
  products,
  setProducts,
  orders,
  setOrders,
  cart,
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
  setConfirmModal,
  setErrorModal,
}) => {

  const getNextOrderNumber = () => {
    // Tạo số đơn 4 chữ số ngẫu nhiên để thay thế STT tuần tự.
    const usedNumbers = new Set(
      orders.map((order) => String(order.orderNumber)).filter(Boolean)
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

    // Cập nhật giá sản phẩm toàn cục nếu có thay đổi trong đơn hàng
    setProducts((prevProducts) => {
      const productsWithUpdatedPrices = prevProducts.map((p) => {
        const item = items.find((i) => i.productId === p.id);
        if (item && item.price !== p.price) {
          return { ...p, price: item.price };
        }
        return p;
      });

      // Lấy danh sách sản phẩm cũ nếu đang sửa đơn để sync stock
      const previousItems = isUpdate ? orderBeingEdited.items : [];
      const previousWarehouse = isUpdate
        ? orderBeingEdited.warehouse || DEFAULT_WAREHOUSE
        : null;

      return syncProductsStock(
        productsWithUpdatedPrices,
        items,
        previousItems,
        warehouse,
        previousWarehouse,
      );
    });

    if (isUpdate) {
      const updatedOrder = {
        ...orderBeingEdited,
        ...payload,
        comment: orderComment.trim(),
      };
      setOrders(
        orders.map((order) =>
          order.id === orderBeingEdited.id ? updatedOrder : order,
        )
      );
    } else {
      const newOrder = {
        id: Date.now().toString(),
        orderNumber: getNextOrderNumber(),
        status: DEFAULT_STATUS,
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
