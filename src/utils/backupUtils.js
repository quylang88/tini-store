export const exportDataToJSON = async (products, orders, settings) => {
  const data = JSON.stringify({
    products,
    orders,
    settings,
  });

  const fileName = `tiny_shop_${new Date().toISOString().slice(0, 10)}.json`;

  // 1. Sử dụng Download truyền thống qua thẻ <a>
  // Thay đổi: Bỏ qua Web Share API để tránh popup Share Sheet,
  // giúp iOS tải trực tiếp về file (hoặc hiện prompt download nhỏ gọn)
  // Sử dụng application/octet-stream để ép buộc trình duyệt
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  // Fix: iOS PWA mở preview thay vì tải về nếu không có target="_blank"
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
  return true;
};

export const parseBackupFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        // Basic validation
        if (Array.isArray(data.products) && Array.isArray(data.orders)) {
          resolve(data);
        } else {
          reject(new Error("File backup thiếu dữ liệu products hoặc orders."));
        }
      } catch (error) {
        reject(
          new Error(
            "Không thể đọc file backup. File có thể bị lỗi: " + error.message,
          ),
        );
      }
    };
    reader.onerror = () =>
      reject(
        new Error("Lỗi đọc file: " + (reader.error?.message || "Unknown")),
      );
    reader.readAsText(file);
  });
};
