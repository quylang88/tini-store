import { useState, useCallback } from "react";
import { sanitizeNumberInput } from "../../utils/helpers";

const useCartLogic = () => {
  const [cart, setCart] = useState({});

  // Hàm kẹp số lượng trong khoảng hợp lệ để không vượt tồn kho.
  const clampQuantity = (value, availableStock) =>
    Math.max(0, Math.min(availableStock, value));

  // Cập nhật giỏ hàng theo công thức tính số lượng tiếp theo để tránh lặp code.
  // shouldRemoveIfZero: nếu true (mặc định cho +/-), số lượng về 0 sẽ xoá khỏi giỏ.
  // nếu false (nhập tay), số lượng về 0/rỗng vẫn giữ key trong giỏ để input không bị mất focus.
  const updateCartItem = useCallback(
    (productId, computeNextQuantity, shouldRemoveIfZero = true) => {
      setCart((prev) => {
        const current = prev[productId] || 0;
        const nextValue = computeNextQuantity(current);
        // Chỉ xoá item nếu cờ shouldRemoveIfZero = true VÀ giá trị mới là falsy (0 hoặc rỗng)
        if (shouldRemoveIfZero && !nextValue) {
          const { [productId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [productId]: nextValue };
      });
    },
    []
  );

  const handleQuantityChange = useCallback(
    (productId, value, availableStock) => {
      // Khi nhập trực tiếp, cho phép chuỗi rỗng để user xoá hết số (để gõ số mới).
      // Không xoá item khỏi giỏ ngay để tránh mất UI input.
      updateCartItem(
        productId,
        () => {
          if (value === "") return "";
          return clampQuantity(Number(value) || 0, availableStock);
        },
        false
      );
    },
    [updateCartItem]
  );

  const adjustQuantity = useCallback(
    (productId, delta, availableStock) => {
      // Khi bấm +/- thì cộng dồn rồi kẹp lại theo tồn kho.
      // Nếu về 0 thì xoá khỏi giỏ (chuyển về nút Thêm).
      updateCartItem(
        productId,
        (current) =>
          clampQuantity(Number(current || 0) + delta, availableStock),
        true
      );
    },
    [updateCartItem]
  );

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  return {
    cart,
    setCart,
    updateCartItem,
    handleQuantityChange,
    adjustQuantity,
    clearCart,
  };
};

export default useCartLogic;
