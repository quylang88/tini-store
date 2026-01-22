/**
 * utils.js
 * Các hàm tiện ích hỗ trợ cho AI Service (lấy vị trí, format phản hồi).
 */

/**
 * Lấy vị trí hiện tại của người dùng thông qua Browser API.
 * Trả về chuỗi "latitude, longitude" hoặc null nếu thất bại/timeout.
 */
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
      () => resolve(null),
      { timeout: 10000 },
    );
  });
};

/**
 * Tạo object phản hồi chuẩn cho ứng dụng.
 * @param {string} type - Loại phản hồi (ví dụ: 'text')
 * @param {string} content - Nội dung phản hồi
 * @param {any} data - Dữ liệu kèm theo (tùy chọn)
 */
export const createResponse = (type, content, data = null) => {
  return {
    id: Date.now().toString(),
    sender: "assistant",
    type,
    content,
    data,
    timestamp: new Date(),
  };
};
