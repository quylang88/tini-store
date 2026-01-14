// Hàm nén ảnh để giảm dung lượng trước khi lưu
// Chuyển sang xử lý async để tránh block main thread khi xử lý ảnh lớn
export const compressImage = async (file) => {
  // 1. Ưu tiên sử dụng Modern APIs (createImageBitmap + OffscreenCanvas)
  // Cách này giúp việc decode và encode ảnh diễn ra không đồng bộ, giảm giật lag giao diện.
  if (typeof window !== 'undefined' && window.createImageBitmap && window.OffscreenCanvas) {
    try {
      // Decode ảnh bất đồng bộ (nhanh hơn Image() thông thường)
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width;
      const height = bitmap.height;

      // Tính toán tỷ lệ scale để giới hạn kích thước (max 300px)
      // Lưu ý: Không phóng to (upscale) nếu ảnh gốc nhỏ hơn 300px
      const maxDimension = Math.max(width, height);
      const scale = maxDimension > 300 ? 300 / maxDimension : 1;
      const targetWidth = width * scale;
      const targetHeight = height * scale;

      // Vẽ lên OffscreenCanvas (không ảnh hưởng DOM chính)
      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      // Giải phóng bộ nhớ bitmap gốc ngay sau khi vẽ xong
      bitmap.close();

      // Encode sang JPEG bất đồng bộ
      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.7
      });

      // Convert Blob to DataURL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Image compression optimization failed, falling back to legacy method:', error);
      // Fall through to legacy method
    }
  }

  // 2. Fallback: Sử dụng phương pháp cũ (FileReader + Canvas DOM)
  // Dành cho trình duyệt cũ hoặc nếu cách trên bị lỗi.
  // Lưu ý: Cách này chạy trên main thread nên có thể gây khựng nhẹ với ảnh lớn.
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Logic scale tương tự: max 300px, no upscale
        const maxDimension = Math.max(img.width, img.height);
        const scale = maxDimension > 300 ? 300 / maxDimension : 1;
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

export const sanitizeDecimalInput = (value) => {
  const normalized = value.replace(/,/g, '.');
  const sanitized = normalized.replace(/[^\d.]/g, '');
  const [whole, ...rest] = sanitized.split('.');
  if (rest.length === 0) {
    return sanitized;
  }
  return `${whole}.${rest.join('')}`;
};
