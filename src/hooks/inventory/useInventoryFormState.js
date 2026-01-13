import { useEffect, useState } from 'react';
import { compressImage, sanitizeDecimalInput, sanitizeNumberInput } from '../../utils/helpers';
import { createFormDataForNewProduct } from '../../utils/inventoryForm';

// Tách riêng state + handler của form để hook chính gọn hơn, dễ review.
const useInventoryFormState = ({ settings, activeCategories }) => {
  const [formData, setFormData] = useState(() => createFormDataForNewProduct({
    settings,
    activeCategories,
  }));

  // Tự động tính giá nhập VNĐ khi chọn nhập theo Yên.
  useEffect(() => {
    if (formData.costCurrency !== 'JPY') {
      return;
    }
    const costJPYValue = Number(formData.costJPY || 0);
    const exchangeRateValue = Number(formData.exchangeRate || 0);
    const calculatedCost = costJPYValue > 0 && exchangeRateValue > 0
      ? Math.round(costJPYValue * exchangeRateValue)
      : '';
    // Khi chưa có dữ liệu hợp lệ, để trống để tránh hiển thị "0" khi đổi qua lại giữa VNĐ/Yên.
    setFormData(prev => ({ ...prev, cost: calculatedCost }));
  }, [formData.costCurrency, formData.costJPY, formData.exchangeRate]);

  const handleMoneyChange = (field) => (event) => {
    const rawValue = sanitizeNumberInput(event.target.value);
    setFormData(prev => ({ ...prev, [field]: rawValue }));
  };

  const handleCurrencyChange = (nextCurrency) => {
    setFormData(prev => ({
      ...prev,
      costCurrency: nextCurrency,
      costJPY: nextCurrency === 'VND' ? '' : prev.costJPY,
      exchangeRate: String(settings.exchangeRate),
      // Đồng bộ phí gửi theo loại tiền nhập.
      shippingMethod: nextCurrency === 'JPY' ? 'jp' : 'vn',
      shippingWeightKg: nextCurrency === 'JPY' ? prev.shippingWeightKg : '',
      shippingFeeVnd: nextCurrency === 'VND' ? prev.shippingFeeVnd : '',
    }));
  };

  const handleShippingMethodChange = (nextMethod) => {
    setFormData(prev => ({
      ...prev,
      // Đồng bộ loại tiền nhập theo phương thức gửi.
      shippingMethod: nextMethod,
      costCurrency: nextMethod === 'jp' ? 'JPY' : 'VND',
      shippingWeightKg: nextMethod === 'jp' ? prev.shippingWeightKg : '',
      shippingFeeVnd: nextMethod === 'vn' ? prev.shippingFeeVnd : '',
    }));
  };

  const handleDecimalChange = (field) => (event) => {
    const rawValue = sanitizeDecimalInput(event.target.value);
    setFormData(prev => ({ ...prev, [field]: rawValue }));
  };

  const handleImageSelect = async (file) => {
    if (!file) {
      return;
    }
    // Cho phép dùng chung xử lý nén ảnh cho cả tải file và chụp camera.
    const compressed = await compressImage(file);
    setFormData(prev => ({ ...prev, image: compressed }));
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
