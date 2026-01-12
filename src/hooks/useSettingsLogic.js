import { useState } from 'react';
import { formatNumber } from '../utils/helpers';

const useSettingsLogic = ({
  products,
  orders,
  inboundShipments,
  setProducts,
  setOrders,
  setInboundShipments,
  settings,
  setSettings,
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  // Modal xác nhận để thay thế popup mặc định
  const [confirmModal, setConfirmModal] = useState(null);

  // Hàm lưu cài đặt chung
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    // localStorage được xử lý ở App.jsx
  };

  // Thêm danh mục mới
  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !settings.categories.includes(trimmedCategory)) {
      saveSettings({
        ...settings,
        categories: [...settings.categories, trimmedCategory]
      });
      setNewCategory('');
    }
  };

  // Xóa danh mục
  const handleDeleteCategory = (cat) => {
    if (cat === 'Chung') {
      alert('Không thể xóa danh mục mặc định!');
      return;
    }
    setConfirmModal({
      title: 'Xoá danh mục?',
      message: `Bạn có chắc muốn xoá danh mục "${cat}" không?`,
      confirmLabel: 'Xoá danh mục',
      tone: 'danger',
      onConfirm: () => {
        saveSettings({
          ...settings,
          categories: settings.categories.filter(c => c !== cat)
        });
      }
    });
  };

  // Lấy tỷ giá từ API miễn phí (Tham khảo)
  const fetchOnlineRate = async () => {
    setIsFetchingRate(true);
    try {
      // API tỷ giá JPY -> VND
      const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json');
      const data = await res.json();
      const rate = data.jpy.vnd;

      if (rate) {
        const roundedRate = Math.round(rate);
        saveSettings({ ...settings, exchangeRate: roundedRate });
        setConfirmModal({
          title: 'Cập nhật tỷ giá thành công',
          message: `1 JPY = ${formatNumber(roundedRate)} VND`,
          confirmLabel: 'Đã hiểu',
          tone: 'rose',
          onConfirm: () => { }
        });
      } else {
        alert('Không tìm thấy dữ liệu tỷ giá.');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối khi lấy tỷ giá. Vui lòng kiểm tra mạng!');
    } finally {
      setIsFetchingRate(false);
    }
  };

  // Sao lưu dữ liệu (Backup)
  const exportData = () => {
    const data = JSON.stringify({
      products,
      orders,
      inboundShipments,
      settings,
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `backup_shop_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Khôi phục dữ liệu (Restore)
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products && data.orders) {
          setConfirmModal({
            title: 'Xác nhận khôi phục dữ liệu?',
            message: 'CẢNH BÁO: Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại.',
            confirmLabel: 'Khôi phục',
            tone: 'danger',
            onConfirm: () => {
              setProducts(data.products);
              setOrders(data.orders);
              setInboundShipments(data.inboundShipments || []);
              if (data.settings) {
                setSettings(data.settings);
              }
              alert('Khôi phục dữ liệu thành công!');
            }
          });
        } else {
          alert('File không hợp lệ hoặc thiếu dữ liệu.');
        }
      } catch (err) {
        alert('Lỗi đọc file backup!');
      }
    };
    reader.readAsText(file);
    // Reset input để có thể chọn lại cùng 1 file nếu cần
    e.target.value = null;
  };

  return {
    newCategory,
    setNewCategory,
    isFetchingRate,
    confirmModal,
    setConfirmModal,
    saveSettings,
    handleAddCategory,
    handleDeleteCategory,
    fetchOnlineRate,
    exportData,
    importData,
  };
};

export default useSettingsLogic;
