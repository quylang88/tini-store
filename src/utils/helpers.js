// Hàm nén ảnh để giảm dung lượng trước khi lưu
export const compressImage = async (file) => {
  // Optimization: Use createImageBitmap and OffscreenCanvas if available to avoid blocking main thread
  if (typeof window !== 'undefined' && window.createImageBitmap && window.OffscreenCanvas) {
    try {
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width;
      const height = bitmap.height;

      // Giới hạn kích thước tối đa 300px để nhẹ, nhưng không upscale ảnh nhỏ
      const maxDimension = Math.max(width, height);
      const scale = maxDimension > 300 ? 300 / maxDimension : 1;
      const targetWidth = width * scale;
      const targetHeight = height * scale;

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      // Close the bitmap to release memory
      bitmap.close();

      // Convert to blob asynchronously
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

  // Legacy method (Main thread blocking)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Giới hạn kích thước tối đa 300px để nhẹ, nhưng không upscale ảnh nhỏ
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
