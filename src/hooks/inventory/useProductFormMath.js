import { useMemo } from "react";

/**
 * Hook tính toán phí vận chuyển, tỷ giá và lợi nhuận cho form sản phẩm.
 * @param {Object} formData - Dữ liệu form hiện tại.
 * @param {Object} settings - Cài đặt ứng dụng (chứa tỷ giá).
 * @returns {Object} Các giá trị đã tính: shippingFeeJpy, shippingFeeVnd, finalProfit, hasProfitData.
 */
export const useProductFormMath = (formData, settings) => {
  return useMemo(() => {
    const shippingWeight = Number(formData.shippingWeightKg) || 0;
    const exchangeRateValue = Number(settings?.exchangeRate) || 0;

    // Tính phí vận chuyển bằng Yên (nếu chọn phương thức JP)
    // Quy tắc: 900 Yên mỗi kg
    const shippingFeeJpy =
      formData.shippingMethod === "jp" ? Math.round(shippingWeight * 900) : 0;

    // Tính phí vận chuyển bằng VNĐ
    // Nếu là JP: Đổi phí Yên sang VNĐ theo tỷ giá
    // Nếu là VN: Sử dụng phí VNĐ nhập tay
    const shippingFeeVnd =
      formData.shippingMethod === "jp"
        ? Math.round(shippingFeeJpy * exchangeRateValue)
        : Number(formData.shippingFeeVnd) || 0;

    // Tính lợi nhuận
    // Lợi nhuận = Giá bán - Giá vốn - Phí vận chuyển VNĐ
    const cost = Number(formData.cost) || 0;
    const price = Number(formData.price) || 0;

    const hasProfitData = price > 0 && cost + shippingFeeVnd > 0;

    const finalProfit = price - cost - shippingFeeVnd;

    return {
      shippingFeeJpy,
      shippingFeeVnd,
      hasProfitData,
      finalProfit,
    };
  }, [
    formData.shippingWeightKg,
    formData.shippingMethod,
    formData.shippingFeeVnd,
    formData.cost,
    formData.price,
    settings?.exchangeRate,
  ]);
};
