import { test, expect } from '@playwright/test';

test('Benchmark Storage Performance', async ({ page }) => {
  // Navigate to app to ensure DB and code are loaded
  // Using localhost:5173 where Vite runs
  await page.goto('http://localhost:5173/');

  // We will run the benchmark inside the browser context
  const results = await page.evaluate(async () => {
    const DB_NAME = 'tiny_shop_db';
    const STORE_NAME = 'products';

    // Helper to open DB
    const openDB = () => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    };

    // Helper to save all (Current approach)
    const saveAll = (db, items) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        items.forEach(item => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    };

    // Helper to save batch (New approach simulation)
    const saveBatch = (db, { added, updated, deleted }) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        added.forEach(item => store.put(item));
        updated.forEach(item => store.put(item));
        deleted.forEach(id => store.delete(id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    };

    // Generate Mock Data
    const generateItems = (count) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `item_${i}`,
        name: `Product ${i}`,
        price: i * 100,
        stock: 10
      }));
    };

    const db = await openDB();
    const itemCount = 1000;
    const initialItems = generateItems(itemCount);

    // --- BASELINE: Save All (Initial Load) ---
    const startLoad = performance.now();
    await saveAll(db, initialItems);
    const endLoad = performance.now();
    const loadTime = endLoad - startLoad;

    // --- SCENARIO: Update 1 Item ---
    const updatedItems = [...initialItems];
    updatedItems[0] = { ...updatedItems[0], price: 99999 };

    // Method A: Save All (Current)
    const startSaveAll = performance.now();
    await saveAll(db, updatedItems);
    const endSaveAll = performance.now();
    const saveAllTime = endSaveAll - startSaveAll;

    // Method B: Save Batch (Optimized)
    const changes = {
      added: [],
      updated: [updatedItems[0]],
      deleted: []
    };

    const startBatch = performance.now();
    await saveBatch(db, changes);
    const endBatch = performance.now();
    const batchTime = endBatch - startBatch;

    return {
      itemCount,
      loadTime,
      saveAllTime,
      batchTime,
      improvementX: saveAllTime / batchTime
    };
  });

  console.log('Benchmark Results:', results);

  expect(results.batchTime).toBeLessThan(results.saveAllTime);
});
