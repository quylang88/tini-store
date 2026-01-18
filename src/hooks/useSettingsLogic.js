import { useState } from "react";
import { formatNumber } from "../utils/helpers";
import { normalizePurchaseLots } from "../utils/purchaseUtils";
import { exportDataToJSON, parseBackupFile } from "../utils/backupUtils";
import { requestNotificationPermission } from "../utils/notificationUtils";

const useSettingsLogic = ({
  products,
  orders,
  setProducts,
  setOrders,
  settings,
  setSettings,
}) => {
  const [newCategory, setNewCategory] = useState("");
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  // Modal xác nhận để thay thế popup mặc định
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal cảnh báo/thông báo nhẹ cho các thao tác nhập liệu
  const [noticeModal, setNoticeModal] = useState(null);
  // Modal thông tin chỉ cần chạm ra ngoài để đóng
  const [infoModal, setInfoModal] = useState(null);

  // Hàm lưu cài đặt chung
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    // localStorage được xử lý ở App.jsx
  };

  // Thay đổi tần suất sao lưu tự động
  const handleAutoBackupChange = (value) => {
    if (value === 0) {
      // Khi tắt tự động, xin quyền thông báo để nhắc nhở
      requestNotificationPermission().then((permission) => {
        if (permission === "granted") {
          setInfoModal({
            title: "Đã tắt tự động sao lưu",
            message:
              "Hệ thống sẽ gửi thông báo nhắc bạn sao lưu mỗi 7 ngày.",
          });
        } else {
          // Nếu từ chối hoặc không hỗ trợ, vẫn hiện thông báo fallback
          setInfoModal({
            title: "Đã tắt tự động sao lưu",
            message:
              "Bạn sẽ nhận được nhắc nhở sao lưu thủ công mỗi 7 ngày để đảm bảo an toàn dữ liệu.",
          });
        }
      });
    }
    saveSettings({ ...settings, autoBackupInterval: value });
  };

  // Thêm danh mục mới
  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) {
      // Cảnh báo khi user chưa nhập tên danh mục mới.
      setNoticeModal({
        title: "Thiếu tên danh mục",
        message: "Vui lòng nhập tên danh mục trước khi thêm.",
      });
      return;
    }
    if (trimmedCategory && !settings.categories.includes(trimmedCategory)) {
      saveSettings({
        ...settings,
        categories: [...settings.categories, trimmedCategory],
      });
      setNewCategory("");
    } else if (settings.categories.includes(trimmedCategory)) {
      // Thông báo khi danh mục đã tồn tại để tránh thêm trùng.
      setNoticeModal({
        title: "Danh mục đã tồn tại",
        message: "Danh mục này đã có trong danh sách. Hãy chọn tên khác nhé.",
      });
    }
  };

  // Xóa danh mục
  const handleDeleteCategory = (cat) => {
    if (cat === "Chung") {
      // Cảnh báo khi cố xoá danh mục mặc định.
      setNoticeModal({
        title: "Không thể xoá",
        message: 'Danh mục "Chung" là mặc định nên không thể xoá.',
      });
      return;
    }
    setConfirmModal({
      title: "Xoá danh mục?",
      message: `Bạn có chắc muốn xoá danh mục "${cat}" không?`,
      confirmLabel: "Xoá danh mục",
      tone: "danger",
      onConfirm: () => {
        saveSettings({
          ...settings,
          categories: settings.categories.filter((c) => c !== cat),
        });
      },
    });
  };

  // Lấy tỷ giá từ API miễn phí (Tham khảo)
  const fetchOnlineRate = async () => {
    setIsFetchingRate(true);
    try {
      // API tỷ giá JPY -> VND
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json"
      );
      const data = await res.json();
      const rate = data.jpy.vnd;

      if (rate) {
        const roundedRate = Math.round(rate);
        saveSettings({ ...settings, exchangeRate: roundedRate });
        // Modal cập nhật tỷ giá chỉ cần chạm ra ngoài để đóng.
        setInfoModal({
          title: "Cập nhật tỷ giá thành công",
          message: `1 JPY = ${formatNumber(roundedRate)} VND`,
        });
      } else {
        // Cảnh báo khi API không trả về tỷ giá.
        setNoticeModal({
          title: "Không tìm thấy tỷ giá",
          message: "Không tìm thấy dữ liệu tỷ giá. Vui lòng thử lại sau.",
        });
      }
    } catch (error) {
      console.error(error);
      // Cảnh báo khi không thể kết nối API.
      setNoticeModal({
        title: "Lỗi kết nối",
        message: "Không thể lấy tỷ giá online. Vui lòng kiểm tra mạng!",
      });
    } finally {
      setIsFetchingRate(false);
    }
  };

  // Sao lưu dữ liệu (Backup)
  const exportData = () => {
    // Cập nhật thời gian backup cuối cùng
    const now = new Date().toISOString();
    const newSettings = { ...settings, lastBackupDate: now };
    setSettings(newSettings);

    // Xuất dữ liệu (dùng newSettings để file backup có thời gian cập nhật mới nhất)
    exportDataToJSON(products, orders, newSettings);
  };

  // Khôi phục dữ liệu (Restore)
  const importData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await parseBackupFile(file);
      setConfirmModal({
        title: "Xác nhận khôi phục dữ liệu?",
        message: "CẢNH BÁO: Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại.",
        confirmLabel: "Khôi phục",
        tone: "danger",
        onConfirm: () => {
          setProducts(
            data.products.map((product) => normalizePurchaseLots(product))
          );
          setOrders(data.orders);
          if (data.settings) {
            setSettings(data.settings);
          }
          // Thông báo sau khi khôi phục thành công.
          setNoticeModal({
            title: "Khôi phục thành công",
            message: "Dữ liệu đã được khôi phục từ file backup.",
          });
        },
      });
    } catch (err) {
      // Cảnh báo khi không đọc được file.
      setNoticeModal({
        title: "Lỗi đọc file",
        message: err.message || "Không thể đọc file backup. Vui lòng thử lại.",
      });
    }

    // Reset input để có thể chọn lại cùng 1 file nếu cần
    e.target.value = null;
  };

  return {
    newCategory,
    setNewCategory,
    isFetchingRate,
    confirmModal,
    setConfirmModal,
    noticeModal,
    setNoticeModal,
    infoModal,
    setInfoModal,
    saveSettings,
    handleAddCategory,
    handleDeleteCategory,
    fetchOnlineRate,
    exportData,
    importData,
    handleAutoBackupChange,
  };
};

export default useSettingsLogic;
