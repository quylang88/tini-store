import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "shop_customers_v1";
const EXCLUDED_CUSTOMERS = ["Mẹ Hương", "Mẹ Nguyệt"];

const useCustomerLogic = () => {
  const [customers, setCustomers] = useState([]);

  // Tải danh sách khách hàng khi component được mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomers(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }, []);

  const processOrderForCustomer = useCallback((order, isUpdate = false) => {
    const { customerName, customerAddress, total, date } = order;

    if (!customerName || EXCLUDED_CUSTOMERS.includes(customerName)) {
      return;
    }

    setCustomers((currentCustomers) => {
      const index = currentCustomers.findIndex(
        (c) => c.name.toLowerCase() === customerName.toLowerCase(),
      );
      const now = new Date().toISOString();
      const orderTotal = Number(total) || 0;

      let nextCustomers;

      if (index >= 0) {
        // Cập nhật khách hàng hiện có
        const customer = currentCustomers[index];
        // Quản lý địa chỉ: Mới nhất lên đầu, không trùng lặp, tối đa 5 địa chỉ
        let newAddresses = customer.addresses || [];
        const cleanAddress = customerAddress ? customerAddress.trim() : "";

        if (cleanAddress) {
          newAddresses = [
            cleanAddress,
            ...newAddresses.filter((a) => a !== cleanAddress),
          ].slice(0, 5);
        }

        const updatedCustomer = {
          ...customer,
          addresses: newAddresses,
          // Chỉ tăng thống kê nếu là đơn hàng mới
          totalOrders: isUpdate
            ? customer.totalOrders
            : (customer.totalOrders || 0) + 1,
          totalSpent: isUpdate
            ? customer.totalSpent
            : (customer.totalSpent || 0) + orderTotal,
          lastOrderDate: date || now,
        };

        nextCustomers = [...currentCustomers];
        nextCustomers[index] = updatedCustomer;
      } else {
        // Tạo khách hàng mới
        const newCustomer = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: customerName.trim(),
          addresses:
            customerAddress && customerAddress.trim()
              ? [customerAddress.trim()]
              : [],
          totalOrders: 1,
          totalSpent: orderTotal,
          lastOrderDate: date || now,
        };
        nextCustomers = [...currentCustomers, newCustomer];
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustomers));
      } catch (e) {
        console.error("Failed to save customers", e);
      }
      return nextCustomers;
    });
  }, []);

  const isCustomerNameTaken = useCallback(
    (name) => {
      if (!name) return false;
      return customers.some(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase(),
      );
    },
    [customers],
  );

  return {
    customers,
    processOrderForCustomer,
    isCustomerNameTaken,
    EXCLUDED_CUSTOMERS,
  };
};

export default useCustomerLogic;
