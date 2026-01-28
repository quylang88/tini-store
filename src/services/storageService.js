const DB_NAME = "tiny_shop_db";
const DB_VERSION = 3; // Tăng version để trigger upgrade (added auth_creds support)

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
          // Chat memory lưu chuỗi tóm tắt và buffer
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
    let pendingBuffer = [];
    if (chatMemoryResult && chatMemoryResult.length > 0) {
      const summaryFound = chatMemoryResult.find((s) => s.key === "summary");
      if (summaryFound) chatSummary = summaryFound.value;

      const bufferFound = chatMemoryResult.find(
        (s) => s.key === "pending_buffer",
      );
      if (bufferFound) pendingBuffer = bufferFound.value;
    }

    return {
      products: products || [],
      orders: orders || [],
      settings: settings || null,
      customers: customers || [],
      chatSummary: chatSummary || "",
      pendingBuffer: pendingBuffer || [],
    };
  }

  async migrateFromLocalStorageIfNeeded() {
    try {
      // Parallelize migration tasks
      await Promise.all([
        this.migrateProducts(),
        this.migrateOrders(),
        this.migrateSettings(),
        this.migrateCustomers(),
        this.migrateChatSummary(),
        this.migratePendingBuffer(),
        this.migrateAuthCreds(),
      ]);
    } catch (e) {
      console.error("Lỗi khi chuyển đổi dữ liệu cũ:", e);
      // Tiếp tục chạy để không chặn ứng dụng
    }
  }

  async migrateProducts() {
    const productCount = await this.count(STORES.PRODUCTS);
    if (productCount === 0) {
      const rawProducts = localStorage.getItem("shop_products_v2");
      if (rawProducts) {
        console.log("Migrating Products...");
        const products = JSON.parse(rawProducts);
        if (Array.isArray(products)) {
          await this.saveAll(STORES.PRODUCTS, products);
        }
      }
    }
  }

  async migrateOrders() {
    const orderCount = await this.count(STORES.ORDERS);
    if (orderCount === 0) {
      const rawOrders = localStorage.getItem("shop_orders_v2");
      if (rawOrders) {
        console.log("Migrating Orders...");
        const orders = JSON.parse(rawOrders);
        if (Array.isArray(orders)) {
          await this.saveAll(STORES.ORDERS, orders);
        }
      }
    }
  }

  async migrateSettings() {
    // 3. Settings (Main) + Theme + Greeting Date
    // Chúng ta sẽ load settings hiện tại từ DB (nếu có) để merge
    let currentSettings = await this.getSettings();
    let settingsChanged = false;

    if (!currentSettings) {
      const rawSettings = localStorage.getItem("shop_settings");
      if (rawSettings) {
        console.log("Migrating Settings...");
        currentSettings = JSON.parse(rawSettings);
        settingsChanged = true;
      } else {
        currentSettings = {};
      }
    }

    // Migrate Theme ID
    if (!currentSettings.themeId) {
      const localTheme = localStorage.getItem("ai_theme_id");
      if (localTheme) {
        console.log("Migrating Theme ID...");
        currentSettings.themeId = localTheme;
        settingsChanged = true;
      }
    }

    // Migrate Greeting Date
    if (!currentSettings.lastGreetingDate) {
      const localGreeting = localStorage.getItem("last_daily_greeting_date");
      if (localGreeting) {
        console.log("Migrating Greeting Date...");
        currentSettings.lastGreetingDate = localGreeting;
        settingsChanged = true;
      }
    }

    if (settingsChanged) {
      await this.saveSettings(currentSettings);
    }
  }

  async migrateCustomers() {
    const customerCount = await this.count(STORES.CUSTOMERS);
    if (customerCount === 0) {
      const rawCustomers = localStorage.getItem("shop_customers_v1");
      if (rawCustomers) {
        console.log("Migrating Customers...");
        const customers = JSON.parse(rawCustomers);
        if (Array.isArray(customers)) {
          await this.saveAll(STORES.CUSTOMERS, customers);
        }
      }
    }
  }

  async migrateChatSummary() {
    const chatSummary = await this.getChatSummary();
    if (!chatSummary) {
      const rawChatSummary = localStorage.getItem("ai_chat_summary");
      if (rawChatSummary) {
        console.log("Migrating Chat Summary...");
        await this.saveChatSummary(rawChatSummary);
      }
    }
  }

  async migratePendingBuffer() {
    const pendingBuffer = await this.getPendingBuffer();
    if (!pendingBuffer || pendingBuffer.length === 0) {
      const rawBuffer = localStorage.getItem("ai_pending_buffer");
      if (rawBuffer) {
        console.log("Migrating Pending Buffer...");
        try {
          const buffer = JSON.parse(rawBuffer);
          if (Array.isArray(buffer)) {
            await this.savePendingBuffer(buffer);
          }
        } catch (e) {
          console.warn("Invalid pending buffer in localStorage", e);
        }
      }
    }
  }

  async migrateAuthCreds() {
    const authCreds = await this.getAuthCreds();
    if (!authCreds) {
      const rawCreds = localStorage.getItem("tini_saved_creds");
      if (rawCreds) {
        console.log("Migrating Auth Credentials...");
        try {
          const creds = JSON.parse(rawCreds);
          await this.saveAuthCreds(creds);
        } catch (e) {
          console.warn("Invalid auth creds in localStorage", e);
        }
      }
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

  // --- Specific Savers/Getters ---

  async saveAllProducts(products) {
    return this.saveAll(STORES.PRODUCTS, products);
  }

  async saveAllOrders(orders) {
    return this.saveAll(STORES.ORDERS, orders);
  }

  async saveAllCustomers(customers) {
    return this.saveAll(STORES.CUSTOMERS, customers);
  }

  async getSettings() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], "readonly");
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get("main");
      request.onsuccess = () =>
        resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
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

  async getChatSummary() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.CHAT_MEMORY], "readonly");
      const store = transaction.objectStore(STORES.CHAT_MEMORY);
      const request = store.get("summary");
      request.onsuccess = () =>
        resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveChatSummary(summaryString) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [STORES.CHAT_MEMORY],
        "readwrite",
      );
      const store = transaction.objectStore(STORES.CHAT_MEMORY);
      store.put({ key: "summary", value: summaryString });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPendingBuffer() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.CHAT_MEMORY], "readonly");
      const store = transaction.objectStore(STORES.CHAT_MEMORY);
      const request = store.get("pending_buffer");
      request.onsuccess = () =>
        resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  async savePendingBuffer(bufferArray) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [STORES.CHAT_MEMORY],
        "readwrite",
      );
      const store = transaction.objectStore(STORES.CHAT_MEMORY);
      store.put({ key: "pending_buffer", value: bufferArray });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAuthCreds() {
    await this.init(); // Ensure DB is initialized before calling this from Login
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], "readonly");
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get("auth_creds");
      request.onsuccess = () =>
        resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAuthCreds(creds) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], "readwrite");
      const store = transaction.objectStore(STORES.SETTINGS);
      store.put({ key: "auth_creds", value: creds });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAuthCreds() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.SETTINGS], "readwrite");
      const store = transaction.objectStore(STORES.SETTINGS);
      store.delete("auth_creds");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // --- Batch Savers (Lưu hàng loạt) ---

  async saveBatch(storeName, { added, updated, deleted }) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      // Thêm mới và cập nhật dùng chung .put()
      added.forEach((item) => store.put(item));
      updated.forEach((item) => store.put(item));

      // Xóa items
      deleted.forEach((id) => store.delete(id));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveProductsBatch(changes) {
    return this.saveBatch(STORES.PRODUCTS, changes);
  }

  async saveOrdersBatch(changes) {
    return this.saveBatch(STORES.ORDERS, changes);
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
