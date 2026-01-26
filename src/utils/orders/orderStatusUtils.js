export const getOrderStatusInfo = (order) => {
  if (order.status === "paid") {
    return {
      label: "Đã thanh toán",
      badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-600",
      dotClass: "bg-emerald-500",
    };
  }
  if (order.status === "pending") {
    return {
      label: "Đang chờ thanh toán",
      badgeClass: "border-orange-300 bg-orange-50 text-orange-600",
      dotClass: "bg-orange-500",
    };
  }
  return {
    // Trạng thái mặc định là đang giao hàng theo yêu cầu mới.
    label: "Đang giao hàng",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-600",
    dotClass: "bg-sky-500",
  };
};
