// Hàm nén ảnh để giảm dung lượng trước khi lưu
export const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Giới hạn kích thước tối đa 300px để nhẹ
        const scale = 300 / Math.max(img.width, img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Xuất ra dạng base64 chất lượng thấp hơn (0.7)
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

export const formatNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '0';
  }
  return number.toLocaleString('en-US');
};

export const formatInputNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return '';
  }
  return number.toLocaleString('en-US');
};

export const sanitizeNumberInput = (value) => value.replace(/[^\d]/g, '');