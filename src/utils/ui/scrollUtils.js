/**
 * Kiểm tra xem phần tử cuộn đã gần chạm đáy hay chưa.
 *
 * @param {HTMLElement} element - Phần tử DOM có thanh cuộn.
 * @param {number} threshold - Khoảng cách (pixel) tính từ đáy để kích hoạt (mặc định 50).
 * @returns {boolean}
 */
export const isScrollNearBottom = (element, threshold = 50) => {
  if (!element) return false;
  const { scrollTop, scrollHeight, clientHeight } = element;
  // Sử dụng >= để đảm bảo bắt được sự kiện ngay cả khi vượt qua một chút
  // Kiểm tra xem vị trí cuộn + chiều cao hiển thị có nằm trong khoảng ngưỡng của chiều cao tổng hay không
  return scrollTop + clientHeight >= scrollHeight - threshold;
};
