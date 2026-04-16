// Tách helper nhỏ để file hook chính không bị dài quá.
// Tối ưu hóa: Thay thế items.reduce bằng vòng lặp for...of để tránh cấp phát hàm callback cho mỗi phần tử,
// đồng thời trực tiếp mutate object kết quả, giúp tăng tốc hiệu năng và giảm thu gom rác.
export const buildCartFromItems = (items) => {
  const acc = {};
  for (const item of items) {
    acc[item.productId] = item.quantity;
  }
  return acc;
};
