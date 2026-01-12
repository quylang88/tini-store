import { useMemo } from 'react';
import useOrderActions from './useOrderActions';

const useOrdersLogic = ({ products, setProducts, orders, setOrders }) => {
  // Gom toàn bộ xử lý nghiệp vụ của màn hình đơn hàng
  const actions = useOrderActions({ products, setProducts, orders, setOrders });

  // Trạng thái hiển thị để UI dễ đọc hơn
  const isCreateView = actions.view === 'create';
  const shouldShowDetailModal = useMemo(
    () => Boolean(actions.selectedOrder),
    [actions.selectedOrder],
  );

  return {
    ...actions,
    isCreateView,
    shouldShowDetailModal,
  };
};

export default useOrdersLogic;
