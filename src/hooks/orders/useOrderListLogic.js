import { useState, useCallback, useMemo } from "react";
import { syncProductsStock } from "../../utils/orders/orderStock";
import {
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import { getOrderStatusInfo } from "../../utils/orders/orderStatusUtils";
import { normalizeString } from "../../utils/formatters/formatUtils";

const DEFAULT_STATUS = "shipping";

const useOrderListLogic = ({
  orders,
  setOrders,
  setProducts,
  setConfirmModal,
}) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const existingOrderIds = useMemo(
    () => new Set(orders.map((order) => order.id)),
    [orders],
  );
  const activeSelectedOrderIds = useMemo(() => {
    const next = new Set();
    selectedOrderIds.forEach((id) => {
      if (existingOrderIds.has(id)) {
        next.add(id);
      }
    });
    return next;
  }, [existingOrderIds, selectedOrderIds]);

  const mergeAnchorId = useMemo(
    () => activeSelectedOrderIds.values().next().value || null,
    [activeSelectedOrderIds],
  );
  const mergeAnchorOrder = useMemo(
    () => orders.find((order) => order.id === mergeAnchorId) || null,
    [mergeAnchorId, orders],
  );

  const clearMergeSelection = useCallback(() => {
    setSelectedOrderIds(new Set());
  }, []);

  const getOrderMergeEligibility = useCallback(
    (order) => {
      if (!order) {
        return { canSelect: false, reason: "" };
      }

      if (order.status === "paid") {
        return { canSelect: false, reason: "Đã thanh toán" };
      }

      if (activeSelectedOrderIds.has(order.id) || !mergeAnchorOrder) {
        return { canSelect: true, reason: "" };
      }

      if ((order.orderType || "delivery") !== mergeAnchorOrder.orderType) {
        return { canSelect: false, reason: "Khác loại đơn" };
      }

      if (order.orderType === "warehouse") {
        const currentWarehouse =
          resolveWarehouseKey(order.warehouse) || getDefaultWarehouse().key;
        const anchorWarehouse =
          resolveWarehouseKey(mergeAnchorOrder.warehouse) ||
          getDefaultWarehouse().key;

        return currentWarehouse === anchorWarehouse
          ? { canSelect: true, reason: "" }
          : { canSelect: false, reason: "Khác kho" };
      }

      const currentCustomer = normalizeString(order.customerName);
      const anchorCustomer = normalizeString(mergeAnchorOrder.customerName);

      return currentCustomer === anchorCustomer
        ? { canSelect: true, reason: "" }
        : { canSelect: false, reason: "Khác khách" };
    },
    [activeSelectedOrderIds, mergeAnchorOrder],
  );

  const toggleMergeMode = useCallback(() => {
    setIsMergeMode((prev) => {
      const next = !prev;
      if (next) {
        setSelectedOrder(null);
      } else {
        setSelectedOrderIds(new Set());
      }
      return next;
    });
  }, []);

  const toggleOrderSelection = useCallback(
    (order) => {
      const eligibility = getOrderMergeEligibility(order);
      if (!eligibility.canSelect) {
        return false;
      }

      setSelectedOrderIds((prev) => {
        const next = new Set();
        for (const id of prev) {
          if (existingOrderIds.has(id)) {
            next.add(id);
          }
        }
        if (next.has(order.id)) {
          next.delete(order.id);
        } else {
          next.add(order.id);
        }
        return next;
      });

      return true;
    },
    [existingOrderIds, getOrderMergeEligibility],
  );

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
    isMergeMode,
    selectedOrderIds: activeSelectedOrderIds,
    mergeAnchorOrder,
    toggleMergeMode,
    toggleOrderSelection,
    getOrderMergeEligibility,
    clearMergeSelection,
    handleTogglePaid,
    handleCancelOrder,
    getOrderStatusInfo,
  };
};

export default useOrderListLogic;
