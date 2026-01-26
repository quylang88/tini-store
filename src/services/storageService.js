const DB_NAME = "tiny_shop_db";
const DB_VERSION = 2; // Tăng version để trigger upgrade

const STORES = {
  PRODUCTS: "products",
  ORDERS: "orders",
  SETTINGS: "settings",
  CUSTOMERS: "customers",
  CHAT_MEMORY: "chat_memory",
};

class StorageService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Tạo các object store nếu chưa tồn tại
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          db.createObjectStore(STORES.PRODUCTS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          db.createObjectStore(STORES.ORDERS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          // Settings là singleton, nhưng dùng store để linh hoạt mở rộng sau này
          db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          db.createObjectStore(STORES.CUSTOMERS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.CHAT_MEMORY)) {
          // Chat memory lưu chuỗi tóm tắt
          db.createObjectStore(STORES.CHAT_MEMORY, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("Khởi tạo IndexedDB thất bại:", event.target.error);
        reject(event.target.error);
      };
    });

    return this.initPromise;
  }

  async loadAllData() {
    await this.init();

    // Thử di chuyển dữ liệu cũ nếu DB đang trống (hoặc migration mới)
    await this.migrateFromLocalStorageIfNeeded();

    const [products, orders, settingsResult, customers, chatMemoryResult] =
      await Promise.all([
        this.getAll(STORES.PRODUCTS),
        this.getAll(STORES.ORDERS),
        this.getAll(STORES.SETTINGS),
        this.getAll(STORES.CUSTOMERS),
        this.getAll(STORES.CHAT_MEMORY),
      ]);

    // Chuẩn hóa cài đặt (do lưu dạng key-value object)
    let settings = null;
    if (settingsResult && settingsResult.length > 0) {
      const found = settingsResult.find((s) => s.key === "main");
      if (found) settings = found.value;
    }

    // Chuẩn hóa bộ nhớ chat
    let chatSummary = "";
    if (chatMemoryResult && chatMemoryResult.length > 0) {
      const found = chatMemoryResult.find((s) => s.key === "summary");
      if (found) chatSummary = found.value;
    }

    return {
      products: products || [],
      orders: orders || [],
      settings: settings || null,
      customers: customers || [],
      chatSummary: chatSummary || "",
    };
  }

  async migrateFromLocalStorageIfNeeded() {
    try {
      const productCount = await this.count(STORES.PRODUCTS);
      // Logic migration cơ bản: Nếu store chính trống, thử kéo từ LocalStorage
      // Lưu ý: Có thể cần logic phức tạp hơn nếu muốn merge, nhưng hiện tại ưu tiên case "Lần đầu chạy bản mới"

      if (productCount === 0) {
        // 1. Products
        const rawProducts = localStorage.getItem("shop_products_v2");
        if (rawProducts) {
          console.log("Đang chuyển đổi Products từ LocalStorage sang IndexedDB...");
          const products = JSON.parse(rawProducts);
          if (Array.isArray(products)) {
            await this.saveAll(STORES.PRODUCTS, products);
          }
        }

        // 2. Orders
        const rawOrders = localStorage.getItem("shop_orders_v2");
        if (rawOrders) {
          console.log("Đang chuyển đổi Orders từ LocalStorage sang IndexedDB...");
          const orders = JSON.parse(rawOrders);
          if (Array.isArray(orders)) {
            await this.saveAll(STORES.ORDERS, orders);
          }
        }

        // 3. Settings
        const rawSettings = localStorage.getItem("shop_settings");
        if (rawSettings) {
          console.log("Đang chuyển đổi Settings từ LocalStorage sang IndexedDB...");
          const settings = JSON.parse(rawSettings);
          await this.saveSettings(settings);
        }

        // 4. Customers
        const rawCustomers = localStorage.getItem("shop_customers_v1");
        if (rawCustomers) {
          console.log("Đang chuyển đổi Customers từ LocalStorage sang IndexedDB...");
          const customers = JSON.parse(rawCustomers);
          if (Array.isArray(customers)) {
            await this.saveAll(STORES.CUSTOMERS, customers);
          }
        }

        // 5. Chat Summary
        const rawChatSummary = localStorage.getItem("ai_chat_summary");
        if (rawChatSummary) {
          console.log("Đang chuyển đổi Chat Summary từ LocalStorage sang IndexedDB...");
          await this.saveChatSummary(rawChatSummary);
        }
      }
    } catch (e) {
      console.error("Lỗi khi chuyển đổi dữ liệu cũ:", e);
      // Tiếp tục chạy để không chặn ứng dụng
    }
  }

  // --- Generic CRUD ---

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  count(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Specific Savers ---

  async saveAllProducts(products) {
    return this.saveAll(STORES.PRODUCTS, products);
  }

  async saveAllOrders(orders) {
    return this.saveAll(STORES.ORDERS, orders);
  }

  async saveAllCustomers(customers) {
    return this.saveAll(STORES.CUSTOMERS, customers);
  }

  async saveSettings(settingsObj) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], "readwrite");
      const store = transaction.objectStore(STORES.SETTINGS);
      store.put({ key: "main", value: settingsObj });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveChatSummary(summaryString) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.CHAT_MEMORY], "readwrite");
      const store = transaction.objectStore(STORES.CHAT_MEMORY);
      store.put({ key: "summary", value: summaryString });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  saveAll(storeName, items) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      store.clear(); // Xóa cũ
      items.forEach((item) => {
        store.put(item); // Thêm mới
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const storageService = new StorageService();
export default storageService;
