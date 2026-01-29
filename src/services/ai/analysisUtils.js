/**
 * analysisUtils.js
 * Các hàm phân tích dữ liệu kinh doanh cho AI.
 */

export const analyzeBusinessStats = (products = [], orders = []) => {
  // 1. TỔNG VỐN NHẬP (Lũy kế từ trước đến nay)
  // Tổng tiền đã bỏ ra để nhập hàng = Sum( (Giá vốn + Ship/unit) * Số lượng nhập ban đầu )
  // Duyệt qua tất cả các lot nhập hàng của tất cả sản phẩm.
  const totalImportCapital = products.reduce((total, product) => {
    if (!product.purchaseLots || !Array.isArray(product.purchaseLots)) return total;

    const productImportCost = product.purchaseLots.reduce((lotTotal, lot) => {
      const quantity = Number(lot.originalQuantity) || Number(lot.quantity) || 0;
      const cost = Number(lot.cost) || 0;
      const shippingPerUnit = Number(lot.shipping?.perUnitVnd) || 0;
      const unitCost = cost + shippingPerUnit;

      return lotTotal + (unitCost * quantity);
    }, 0);

    return total + productImportCost;
  }, 0);

  // 2. VỐN TỒN KHO (Hiện tại)
  // Giá trị hàng đang nằm trong kho = Sum( (Giá vốn + Ship/unit) * Số lượng tồn hiện tại )
  const totalInventoryCapital = products.reduce((total, product) => {
    if (!product.purchaseLots || !Array.isArray(product.purchaseLots)) return total;

    const productStockValue = product.purchaseLots.reduce((lotTotal, lot) => {
      const quantity = Number(lot.quantity) || 0; // Số lượng tồn thực tế
      const cost = Number(lot.cost) || 0;
      const shippingPerUnit = Number(lot.shipping?.perUnitVnd) || 0;
      const unitCost = cost + shippingPerUnit;

      return lotTotal + (unitCost * quantity);
    }, 0);

    return total + productStockValue;
  }, 0);

  // 3. PHÂN TÍCH ĐƠN HÀNG CHƯA THANH TOÁN (Unpaid / Debt)
  const unpaidOrders = orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
  const unpaidOrderCount = unpaidOrders.length;

  let totalUnpaidRevenue = 0; // Tổng tiền khách nợ (Doanh thu chưa thu)
  let totalUnpaidCapital = 0; // Vốn đang kẹt trong đơn nợ
  let totalUnpaidProfit = 0;  // Lợi nhuận dự kiến từ đơn nợ

  unpaidOrders.forEach(order => {
    totalUnpaidRevenue += (Number(order.total) || 0);

    // Tính vốn & lợi nhuận cho từng đơn
    let orderCost = 0;
    let orderProfit = 0;

    if (Array.isArray(order.items)) {
      const itemsProfit = order.items.reduce((sum, item) => {
        const itemQty = Number(item.quantity) || 0;
        const itemPrice = Number(item.price) || 0;
        const itemCost = Number(item.cost) || 0; // Giá vốn tại thời điểm bán

        orderCost += (itemCost * itemQty);
        return sum + ((itemPrice - itemCost) * itemQty);
      }, 0);

      // Lợi nhuận đơn = Tổng lãi gộp các món - Phí ship của đơn (nếu có)
      // Lưu ý: order.shippingFee là phí shop trả cho bên vận chuyển (hoặc thu của khách nhưng tính vào chi phí)
      // Thông thường: Profit = (Revenue - COGS) - Expenses
      // Ở đây: order.shippingFee được xem là chi phí vận chuyển.
      orderProfit = itemsProfit - (Number(order.shippingFee) || 0);
    }

    totalUnpaidCapital += orderCost;
    totalUnpaidProfit += orderProfit;
  });

  return {
    totalImportCapital,
    totalInventoryCapital,
    unpaidOrderCount,
    totalUnpaidRevenue,
    totalUnpaidCapital,
    totalUnpaidProfit,
    unpaidOrders // Trả về danh sách nếu cần liệt kê
  };
};
