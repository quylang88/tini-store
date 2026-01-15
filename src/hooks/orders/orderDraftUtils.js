// Tách helper nhỏ để file hook chính không bị dài quá.
export const buildCartFromItems = (items) =>
  items.reduce((acc, item) => {
    acc[item.productId] = item.quantity;
    return acc;
  }, {});
