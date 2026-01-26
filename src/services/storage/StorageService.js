const DB_NAME = "tini_store_db";
const DB_VERSION = 1;

const STORES = {
  PRODUCTS: "products",
  ORDERS: "orders",
  SETTINGS: "settings",
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
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("IndexedDB initialization failed:", event.target.error);
        reject(event.target.error);
      };
    });

    return this.initPromise;
  }

  async loadAllData() {
    await this.init();

    // Thử di chuyển dữ liệu cũ nếu DB đang trống
    await this.migrateFromLocalStorageIfNeeded();

    const [products, orders, settingsResult] = await Promise.all([
      this.getAll(STORES.PRODUCTS),
      this.getAll(STORES.ORDERS),
      this.getAll(STORES.SETTINGS),
    ]);

    // Chuẩn hóa cài đặt (do lưu dạng key-value object)
    // Cấu trúc lưu trữ: { key: "main", value: { ... } }
    let settings = null;
    if (settingsResult && settingsResult.length > 0) {
      const found = settingsResult.find((s) => s.key === "main");
      if (found) settings = found.value;
    }

    return {
      products: products || [],
      orders: orders || [],
      settings: settings || null, // Để App quyết định giá trị mặc định nếu null
    };
  }

  async migrateFromLocalStorageIfNeeded() {
    try {
      const productCount = await this.count(STORES.PRODUCTS);
      // Nếu DB trống, kiểm tra LocalStorage để di chuyển dữ liệu cũ sang
      if (productCount === 0) {
        const rawProducts = localStorage.getItem("shop_products_v2");
        if (rawProducts) {
          console.log("Migrating products from LocalStorage to IndexedDB...");
          const products = JSON.parse(rawProducts);
          if (Array.isArray(products)) {
            await this.saveAll(STORES.PRODUCTS, products);
          }
        }

        // Kiểm tra đơn hàng
        const rawOrders = localStorage.getItem("shop_orders_v2");
        if (rawOrders) {
          console.log("Migrating orders from LocalStorage to IndexedDB...");
          const orders = JSON.parse(rawOrders);
          if (Array.isArray(orders)) {
            await this.saveAll(STORES.ORDERS, orders);
          }
        }

        // Kiểm tra cài đặt
        const rawSettings = localStorage.getItem("shop_settings");
        if (rawSettings) {
          console.log("Migrating settings from LocalStorage to IndexedDB...");
          const settings = JSON.parse(rawSettings);
          await this.saveSettings(settings);
        }
      }
    } catch (e) {
      console.error("Migration failed:", e);
      // Tiếp tục chạy kể cả khi lỗi để không chặn app
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

  // Hàm lưu "Ghi đè tất cả" để đồng bộ state từ React xuống DB
  async saveAllProducts(products) {
    return this.saveAll(STORES.PRODUCTS, products);
  }

  async saveAllOrders(orders) {
    return this.saveAll(STORES.ORDERS, orders);
  }

  async saveSettings(settingsObj) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], "readwrite");
      const store = transaction.objectStore(STORES.SETTINGS);
      // Bọc settings trong một key cố định
      store.put({ key: "main", value: settingsObj });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  saveAll(storeName, items) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      // Xóa dữ liệu cũ để đảm bảo các item đã bị xóa trên UI cũng biến mất trong DB
      store.clear();

      items.forEach((item) => {
        store.put(item);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const storageService = new StorageService();
export default storageService;
