import { useState, useCallback } from "react";
import { syncProductsStock } from "../../utils/orders/orderStock";
import {
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import { getOrderStatusInfo } from "../../utils/orders/orderStatusUtils";

const DEFAULT_STATUS = "shipping";

const useOrderListLogic = ({
  setOrders,
  setProducts,
  setConfirmModal,
}) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleTogglePaid = useCallback(
    (order) => {
      // LƯU Ý: order được truyền trực tiếp, không cần tìm lại trong mảng orders
      const isPaid = order.status === "paid";

      // Hiển thị popup xác nhận trước khi đổi trạng thái thanh toán.
      setConfirmModal({
        title: isPaid ? "Huỷ thanh toán?" : "Xác nhận thanh toán?",
        message: isPaid
          ? "Bạn có chắc muốn huỷ trạng thái đã thanh toán cho đơn hàng này không?"
          : "Bạn có chắc đơn hàng này đã được thanh toán đầy đủ chưa?",
        confirmLabel: isPaid ? "Huỷ thanh toán" : "Đã thanh toán",
        tone: isPaid ? "danger" : "rose",
        onConfirm: () => {
          setOrders((prev) =>
            prev.map((item) => {
              if (item.id !== order.id) return item;
              let nextStatus = "paid";
              if (item.status === "paid") {
                // Khi huỷ thanh toán, trả về trạng thái ban đầu dựa trên loại đơn
                nextStatus =
                  item.orderType === "warehouse" ? "pending" : DEFAULT_STATUS;
              }
              return { ...item, status: nextStatus };
            }),
          );
        },
      });
    },
    [setConfirmModal, setOrders],
  );

  const handleCancelOrder = useCallback(
    (order) => {
      setConfirmModal({
        title: "Huỷ đơn?",
        message: `Bạn có chắc muốn huỷ đơn ${
          order.orderNumber ? `#${order.orderNumber}` : ""
        }?`,
        confirmLabel: "Huỷ đơn",
        tone: "danger",
        onConfirm: () => {
          setProducts((prevProducts) =>
            syncProductsStock(
              prevProducts,
              [],
              order.items,
              getDefaultWarehouse().key,
              resolveWarehouseKey(order.warehouse) || getDefaultWarehouse().key,
            ),
          );
          setOrders((prev) => prev.filter((item) => item.id !== order.id));
        },
      });
    },
    [setConfirmModal, setProducts, setOrders],
  );

  return {
    selectedOrder,
    setSelectedOrder,
    handleTogglePaid,
    handleCancelOrder,
    getOrderStatusInfo,
  };
};

export default useOrderListLogic;
