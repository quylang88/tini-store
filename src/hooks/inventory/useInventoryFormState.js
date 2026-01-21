import { useState } from "react";
import { compressImage } from "../../utils/file/imageUtils";
import {
  formatInputNumber,
  sanitizeDecimalInput,
  sanitizeNumberInput,
} from "../../utils/formatters/formatters";
import { createFormDataForNewProduct } from "../../utils/inventory/inventoryForm";

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

  // Hàm helper tính toán các trường dẫn xuất (cost, shippingFeeVnd)
  // để gọi synchronous bên trong setFormData.
  const calculateDerivedFields = (nextState) => {
    const updated = { ...nextState };

    // 1. Tính giá nhập (cost)
    if (updated.costCurrency === "JPY") {
      const costJPYValue = Number(updated.costJPY || 0);
      const exchangeRateValue = Number(updated.exchangeRate || 0);
      const calculatedCost =
        costJPYValue > 0 && exchangeRateValue > 0
          ? Math.round(costJPYValue * exchangeRateValue)
          : "";
      updated.cost = calculatedCost;
    } else {
      // costCurrency === "VND"
      updated.cost = updated.costVNDInput;
    }

    // 2. Tính phí vận chuyển (shippingFeeVnd)
    // Lưu ý: Nếu shippingMethod là 'jp', ta chưa có logic tính tự động ra VNĐ ở đây
    // nên giữ nguyên giá trị cũ hoặc logic cũ (đã có input shippingFeeVndInput cho VN).
    // Ở logic cũ: if (formData.shippingMethod === "vn") shippingFeeVnd = shippingFeeVndInput.
    if (updated.shippingMethod === "vn") {
      updated.shippingFeeVnd = updated.shippingFeeVndInput;
    }
    return updated;
  };

  const handleMoneyChange = (field) => (event) => {
    const input = event.target;
    const rawValue = input.value;
    const caretIndex = input.selectionStart ?? rawValue.length;
    const digitsBeforeCaret = rawValue
      .slice(0, caretIndex)
      .replace(/[^\d]/g, "").length;
    const sanitizedValue = sanitizeNumberInput(rawValue);

    setFormData((prev) =>
      calculateDerivedFields({ ...prev, [field]: sanitizedValue }),
    );

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
    setFormData((prev) =>
      calculateDerivedFields({
        ...prev,
        costCurrency: nextCurrency,
        // KHÔNG xoá giá trị cũ (costJPY, costVNDInput) khi chuyển tab để giữ lại dữ liệu user nhập dở
        exchangeRate: String(settings.exchangeRate),
        // Đồng bộ phí gửi theo loại tiền nhập.
        shippingMethod: nextCurrency === "JPY" ? "jp" : "vn",
        // KHÔNG xoá shippingWeightKg / shippingFeeVndInput
      }),
    );
  };

  const handleShippingMethodChange = (nextMethod) => {
    setFormData((prev) =>
      calculateDerivedFields({
        ...prev,
        // Đồng bộ loại tiền nhập theo phương thức gửi.
        shippingMethod: nextMethod,
        costCurrency: nextMethod === "jp" ? "JPY" : "VND",
      }),
    );
  };

  const handleDecimalChange = (field) => (event) => {
    const rawValue = sanitizeDecimalInput(event.target.value);
    setFormData((prev) =>
      calculateDerivedFields({ ...prev, [field]: rawValue }),
    );
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
