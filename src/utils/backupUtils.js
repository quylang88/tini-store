export const exportDataToJSON = (products, orders, settings) => {
  const data = JSON.stringify({
    products,
    orders,
    settings,
  });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `backup_shop_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
      } catch (err) {
        reject(new Error("Không thể đọc file backup. File có thể bị lỗi."));
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsText(file);
  });
};
