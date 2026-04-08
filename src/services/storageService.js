const DB_NAME = "tiny_shop_db";
const DB_VERSION = 4; // Tăng version để trigger upgrade (added purchase lists support)

const STORES = {
  PRODUCTS: "products",
  ORDERS: "orders",
  SETTINGS: "settings",
  CUSTOMERS: "customers",
  CHAT_MEMORY: "chat_memory",
  PURCHASE_LISTS: "purchase_lists",
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
        if (!db.objectStoreNames.contains(STORES.PURCHASE_LISTS)) {
          db.createObjectStore(STORES.PURCHASE_LISTS, { keyPath: "id" });
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

    const [
      products,
      orders,
      settingsResult,
      customers,
      chatMemoryResult,
      purchaseLists,
    ] = await Promise.all([
      this.getAll(STORES.PRODUCTS),
      this.getAll(STORES.ORDERS),
      this.getAll(STORES.SETTINGS),
      this.getAll(STORES.CUSTOMERS),
      this.getAll(STORES.CHAT_MEMORY),
      this.getAll(STORES.PURCHASE_LISTS),
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
      purchaseLists: purchaseLists || [],
    };
  }

  async migrateFromLocalStorageIfNeeded() {
    try {
      // 1. Determine which stores actually need migration
      const [productCount, orderCount, customerCount] = await Promise.all([
        this.count(STORES.PRODUCTS),
        this.count(STORES.ORDERS),
        this.count(STORES.CUSTOMERS),
      ]);

      const needsProductMigration =
        productCount === 0 ||
        localStorage.getItem("migration_products_in_progress");
      const needsOrderMigration =
        orderCount === 0 ||
        localStorage.getItem("migration_orders_in_progress");
      const needsCustomerMigration =
        customerCount === 0 ||
        localStorage.getItem("migration_customers_in_progress");

      // 2. Fetch raw strings only for stores that need it
      const rawProducts = needsProductMigration
        ? localStorage.getItem("shop_products_v2")
        : null;
      const rawOrders = needsOrderMigration
        ? localStorage.getItem("shop_orders_v2")
        : null;
      const rawCustomers = needsCustomerMigration
        ? localStorage.getItem("shop_customers_v1")
        : null;

      // 3. Concurrently parse the JSON strings if they exist to avoid blocking
      const [parsedProducts, parsedOrders, parsedCustomers] = await Promise.all(
        [
          rawProducts
            ? this.parseJSON(rawProducts).catch((e) => {
                console.error("Product migration parsing failed", e);
                return null;
              })
            : Promise.resolve(null),
          rawOrders
            ? this.parseJSON(rawOrders).catch((e) => {
                console.error("Order migration parsing failed", e);
                return null;
              })
            : Promise.resolve(null),
          rawCustomers
            ? this.parseJSON(rawCustomers).catch((e) => {
                console.error("Customer migration parsing failed", e);
                return null;
              })
            : Promise.resolve(null),
        ],
      );

      // Parallelize migration tasks
      await Promise.all([
        this.migrateProducts(needsProductMigration, parsedProducts),
        this.migrateOrders(needsOrderMigration, parsedOrders),
        this.migrateSettings(),
        this.migrateCustomers(needsCustomerMigration, parsedCustomers),
        this.migrateChatSummary(),
        this.migratePendingBuffer(),
        this.migrateAuthCreds(),
      ]);
    } catch (e) {
      console.error("Lỗi khi chuyển đổi dữ liệu cũ:", e);
      // Tiếp tục chạy để không chặn ứng dụng
    }
  }

  async migrateProducts(needsMigration, parsedProducts) {
    const migrationKey = "migration_products_in_progress";

    if (needsMigration && parsedProducts) {
      console.log("Migrating Products...");
      localStorage.setItem(migrationKey, "true");
      try {
        if (Array.isArray(parsedProducts)) {
          await this.saveAllChunked(STORES.PRODUCTS, parsedProducts);
          localStorage.removeItem(migrationKey);
        }
      } catch (e) {
        console.error("Product migration failed", e);
      }
    }
  }

  async migrateOrders(needsMigration, parsedOrders) {
    const migrationKey = "migration_orders_in_progress";

    if (needsMigration && parsedOrders) {
      console.log("Migrating Orders...");
      localStorage.setItem(migrationKey, "true");
      try {
        if (Array.isArray(parsedOrders)) {
          await this.saveAllChunked(STORES.ORDERS, parsedOrders);
          localStorage.removeItem(migrationKey);
        }
      } catch (e) {
        console.error("Order migration failed", e);
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

  async migrateCustomers(needsMigration, parsedCustomers) {
    const migrationKey = "migration_customers_in_progress";

    if (needsMigration && parsedCustomers) {
      console.log("Migrating Customers...");
      localStorage.setItem(migrationKey, "true");
      try {
        if (Array.isArray(parsedCustomers)) {
          await this.saveAllChunked(STORES.CUSTOMERS, parsedCustomers);
          localStorage.removeItem(migrationKey);
        }
      } catch (e) {
        console.error("Customer migration failed", e);
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

  // --- Helper Methods for Performance ---

  /**
   * Parse JSON asynchronously if possible (using Response)
   * Fallback to JSON.parse
   */
  async parseJSON(jsonString) {
    try {
      if (typeof Response !== "undefined") {
        return await new Response(jsonString).json();
      }
      //eslint-disable-next-line
    } catch (e) {
      // Fallback if Response fails or is not supported
    }
    return JSON.parse(jsonString);
  }

  /**
   * Save items in chunks to avoid blocking the main thread
   */
  async saveAllChunked(storeName, items, chunkSize = 500) {
    if (!items || items.length === 0) return;

    // Use standard saveAll for small batches
    if (items.length <= chunkSize) {
      return this.saveAll(storeName, items);
    }

    // 1. Clear Store first (Transaction 1)
    await new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      store.clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // 2. Insert in chunks
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));

      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        chunk.forEach((item) => store.put(item));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
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

  async saveAllPurchaseLists(purchaseLists) {
    return this.saveAll(STORES.PURCHASE_LISTS, purchaseLists);
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

  async saveCustomersBatch(changes) {
    return this.saveBatch(STORES.CUSTOMERS, changes);
  }

  async savePurchaseListsBatch(changes) {
    return this.saveBatch(STORES.PURCHASE_LISTS, changes);
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
