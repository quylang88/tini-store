import { useState, useEffect, useCallback } from "react";
import storageService from "../../services/storageService";
import { normalizePurchaseLots } from "../../utils/inventory/purchaseUtils";
import useDataPersistence from "../core/useDataPersistence";

const useAppData = (isAuthenticated) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({
    exchangeRate: 170,
    categories: ["Chung", "Mỹ phẩm", "Thực phẩm", "Quần áo"],
    themeId: "rose", // Theme mặc định
    lastGreetingDate: null,
  });
  const [customers, setCustomers] = useState([]);
  const [chatSummary, setChatSummary] = useState("");
  const [pendingBuffer, setPendingBuffer] = useState([]);

  // --- Tải dữ liệu ---
  useEffect(() => {
    if (isAuthenticated) {
      storageService.loadAllData().then((data) => {
        setProducts(
          data.products.map((product) => normalizePurchaseLots(product)),
        );
        setOrders(data.orders);
        if (data.settings) {
          // Merge với settings mặc định để đảm bảo các trường mới như themeId luôn tồn tại
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        setCustomers(data.customers);
        setChatSummary(data.chatSummary);
        setPendingBuffer(data.pendingBuffer);
        setIsDataLoaded(true);
      });
    }
  }, [isAuthenticated]);

  // --- Logic Tự động Lưu ---

  // Các hàm xử lý (Handlers)
  const handleSaveProducts = useCallback(
    (changes) => storageService.saveProductsBatch(changes),
    [],
  );
  const handleSaveOrders = useCallback(
    (changes) => storageService.saveOrdersBatch(changes),
    [],
  );

  // Hooks Persistance (Lưu trữ)
  useDataPersistence(products, handleSaveProducts, isDataLoaded);
  useDataPersistence(orders, handleSaveOrders, isDataLoaded);

  // Các Effect đơn giản
  useEffect(() => {
    if (isDataLoaded) {
      storageService.saveSettings(settings);
    }
  }, [settings, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      storageService.saveAllCustomers(customers);
    }
  }, [customers, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      storageService.saveChatSummary(chatSummary);
    }
  }, [chatSummary, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      storageService.savePendingBuffer(pendingBuffer);
    }
  }, [pendingBuffer, isDataLoaded]);

  // Hàm hỗ trợ reset dữ liệu
  const resetData = useCallback(() => {
    setProducts([]);
    setOrders([]);
    setCustomers([]);
    setChatSummary("");
    setPendingBuffer([]);
    setIsDataLoaded(false);
    // Lưu ý: Logic cũ không reset settings khi logout, nên ở đây cũng giữ nguyên hành vi đó.
  }, []);

  return {
    isDataLoaded,
    setIsDataLoaded,
    products,
    setProducts,
    orders,
    setOrders,
    settings,
    setSettings,
    customers,
    setCustomers,
    chatSummary,
    setChatSummary,
    pendingBuffer,
    setPendingBuffer,
    resetData
  };
};

export default useAppData;
