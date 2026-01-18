export const exportDataToJSON = async (products, orders, settings) => {
  const data = JSON.stringify({
    products,
    orders,
    settings,
  });

  const fileName = `tiny_shop_${new Date().toISOString().slice(0, 10)}.json`;

  // 1. Ưu tiên sử dụng Web Share API (dành cho Mobile/Tablet/PWA)
  // Cách này giúp mở trực tiếp Share Sheet của OS (Save to Files, AirDrop, etc.)
  // Tránh việc mở file preview text trên iOS Safari
  try {
    const file = new File([data], fileName, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Backup Tiny Shop",
        text: "File sao lưu dữ liệu Tiny Shop",
      });
      return true; // Đã chia sẻ thành công
    }
  } catch (error) {
    // Nếu user huỷ share hoặc lỗi, log và fall back (nếu cần thiết, nhưng thường Cancel là do user)
    if (error.name !== "AbortError") {
      console.error("Lỗi chia sẻ file:", error);
    } else {
      // User huỷ chia sẻ -> coi như xong, không cần fallback download làm phiền
      return false;
    }
  }

  // 2. Fallback: Download truyền thống qua thẻ <a> (Desktop)
  // Sử dụng application/octet-stream để ép buộc trình duyệt
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
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
