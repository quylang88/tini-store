import { useMemo } from "react";

/**
 * Hook to calculate shipping fees, exchange rates, and profit margins for the product form.
 * @param {Object} formData - The current form data.
 * @param {Object} settings - The application settings (containing exchange rate).
 * @returns {Object} Calculated values: shippingFeeJpy, shippingFeeVnd, finalProfit, hasProfitData.
 */
export const useProductFormMath = (formData, settings) => {
  return useMemo(() => {
    const shippingWeight = Number(formData.shippingWeightKg) || 0;
    const exchangeRateValue = Number(settings?.exchangeRate) || 0;

    // Calculate Shipping Fee in JPY (if method is JP)
    // Rule: 900 JPY per kg
    const shippingFeeJpy =
      formData.shippingMethod === "jp" ? Math.round(shippingWeight * 900) : 0;

    // Calculate Shipping Fee in VND
    // If JP: Convert JPY fee to VND using exchange rate
    // If VN: Use the manually entered VND fee
    const shippingFeeVnd =
      formData.shippingMethod === "jp"
        ? Math.round(shippingFeeJpy * exchangeRateValue)
        : Number(formData.shippingFeeVnd) || 0;

    // Calculate Profit
    // Profit = Price - Cost - ShippingFeeVND
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
