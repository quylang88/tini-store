import { useEffect, useState } from "react";
import {
  compressImage,
  formatInputNumber,
  sanitizeDecimalInput,
  sanitizeNumberInput,
} from "../../utils/helpers";
import { createFormDataForNewProduct } from "../../utils/inventoryForm";

// Tách riêng state + handler của form để hook chính gọn hơn, dễ review.
const useInventoryFormState = ({ settings, activeCategory }) => {
  const [formData, setFormData] = useState(() => {
    const initial = createFormDataForNewProduct({
      settings,
      activeCategory,
    });
    // Bổ sung các trường input riêng biệt để giữ giá trị khi chuyển tab
    return {
      ...initial,
      costVNDInput: "",
      shippingFeeVndInput: "",
    };
  });

  // Tự động tính giá nhập VNĐ khi chọn nhập theo Yên.
  useEffect(() => {
    if (formData.costCurrency !== "JPY") {
      return;
    }
    const costJPYValue = Number(formData.costJPY || 0);
    const exchangeRateValue = Number(formData.exchangeRate || 0);
    const calculatedCost =
      costJPYValue > 0 && exchangeRateValue > 0
        ? Math.round(costJPYValue * exchangeRateValue)
        : "";
    // Khi chưa có dữ liệu hợp lệ, để trống để tránh hiển thị "0" khi đổi qua lại giữa VNĐ/Yên.
    setFormData((prev) => ({ ...prev, cost: calculatedCost }));
  }, [formData.costCurrency, formData.costJPY, formData.exchangeRate]);

  // Tự động cập nhật giá nhập chính thức khi nhập trực tiếp VNĐ
  useEffect(() => {
    if (formData.costCurrency === "VND") {
      setFormData((prev) => ({ ...prev, cost: prev.costVNDInput }));
    }
  }, [formData.costCurrency, formData.costVNDInput]);

  // Tự động cập nhật phí vận chuyển khi nhập trực tiếp VNĐ
  useEffect(() => {
    if (formData.shippingMethod === "vn") {
      setFormData((prev) => ({
        ...prev,
        shippingFeeVnd: prev.shippingFeeVndInput,
      }));
    }
  }, [formData.shippingMethod, formData.shippingFeeVndInput]);

  const handleMoneyChange = (field) => (event) => {
    const input = event.target;
    const rawValue = input.value;
    const caretIndex = input.selectionStart ?? rawValue.length;
    const digitsBeforeCaret = rawValue
      .slice(0, caretIndex)
      .replace(/[^\d]/g, "").length;
    const sanitizedValue = sanitizeNumberInput(rawValue);

    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));

    // Giữ con trỏ ở đúng vị trí sau khi format lại số tiền có dấu phẩy.
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        const formattedValue = formatInputNumber(sanitizedValue);
        if (!input.setSelectionRange) return;
        if (!formattedValue) {
          input.setSelectionRange(0, 0);
          return;
        }
        if (digitsBeforeCaret === 0) {
          input.setSelectionRange(0, 0);
          return;
        }
        let nextCaretIndex = formattedValue.length;
        let digitCount = 0;
        for (let i = 0; i < formattedValue.length; i += 1) {
          if (/\d/.test(formattedValue[i])) {
            digitCount += 1;
          }
          if (digitCount >= digitsBeforeCaret) {
            nextCaretIndex = i + 1;
            break;
          }
        }
        input.setSelectionRange(nextCaretIndex, nextCaretIndex);
      });
    }
  };

  const handleCurrencyChange = (nextCurrency) => {
    setFormData((prev) => ({
      ...prev,
      costCurrency: nextCurrency,
      // KHÔNG xoá giá trị cũ (costJPY, costVNDInput) khi chuyển tab để giữ lại dữ liệu user nhập dở
      exchangeRate: String(settings.exchangeRate),
      // Đồng bộ phí gửi theo loại tiền nhập.
      shippingMethod: nextCurrency === "JPY" ? "jp" : "vn",
      // KHÔNG xoá shippingWeightKg / shippingFeeVndInput
    }));
  };

  const handleShippingMethodChange = (nextMethod) => {
    setFormData((prev) => ({
      ...prev,
      // Đồng bộ loại tiền nhập theo phương thức gửi.
      shippingMethod: nextMethod,
      costCurrency: nextMethod === "jp" ? "JPY" : "VND",
    }));
  };

  const handleDecimalChange = (field) => (event) => {
    const rawValue = sanitizeDecimalInput(event.target.value);
    setFormData((prev) => ({ ...prev, [field]: rawValue }));
  };

  const handleImageSelect = async (file) => {
    if (!file) {
      return;
    }
    // Cho phép dùng chung xử lý nén ảnh cho cả tải file và chụp camera.
    const compressed = await compressImage(file);
    setFormData((prev) => ({ ...prev, image: compressed }));
  };

  return {
    formData,
    setFormData,
    handleMoneyChange,
    handleCurrencyChange,
    handleShippingMethodChange,
    handleDecimalChange,
    handleImageSelect,
  };
};

export default useInventoryFormState;
