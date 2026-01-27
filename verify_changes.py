from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 375, "height": 812})
    page = context.new_page()

    # 1. Load App
    print("Loading app...")
    page.goto("http://localhost:5173")

    # 2. Bypass Login
    page.evaluate("sessionStorage.setItem('tini_auth', 'true')")
    page.reload()
    page.wait_for_timeout(3000)

    # 3. Inject Data
    print("Injecting data...")
    inject_script = """
    new Promise((resolve, reject) => {
        const request = indexedDB.open('tiny_shop_db');

        request.onerror = (event) => reject('DB Open Error: ' + event.target.error);

        request.onsuccess = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('orders') || !db.objectStoreNames.contains('products')) {
                reject('Stores not found. App might not have initialized DB yet.');
                return;
            }

            const tx = db.transaction(['orders', 'products'], 'readwrite');

            // 1. Paid Order
            tx.objectStore('orders').put({
                id: 'ord_123',
                orderNumber: '1001',
                status: 'paid',
                total: 500000,
                date: new Date().toISOString(),
                items: [{ name: 'Test Product', quantity: 1, price: 500000, cost: 300000 }],
                customer: { name: 'Customer A' },
                orderType: 'delivery',
                warehouse: 'home'
            });

            // 2. Product with Sold Out Lot
            tx.objectStore('products').put({
                id: 'prod_123',
                name: 'Test Product',
                price: 500000,
                purchaseLots: [
                    {
                        id: 'lot_1',
                        quantity: 0,
                        originalQuantity: 10,
                        cost: 300000,
                        createdAt: new Date().toISOString(),
                        warehouse: 'home',
                        shipping: { method: 'jp', exchangeRate: 160 }
                    },
                     {
                        id: 'lot_2',
                        quantity: 5,
                        originalQuantity: 10,
                        cost: 300000,
                        createdAt: new Date().toISOString(),
                        warehouse: 'home',
                        shipping: { method: 'vn', feeVnd: 0 }
                    }
                ],
                category: 'Test'
            });

            tx.oncomplete = () => resolve('Data injected');
            tx.onerror = (e) => reject('Tx Error: ' + e.target.error);
        };
    });
    """
    try:
        page.evaluate(inject_script)
        print("Injection successful.")
    except Exception as e:
        print(f"Injection failed: {e}")

    page.reload()
    page.wait_for_timeout(2000)

    # Handle Backup Modal
    try:
        page.get_by_role("button", name="Để sau").click(timeout=3000)
        print("Dismissed Backup Modal")
    except:
        print("Backup Modal not found")

    # 4. Verify Note Scaling
    print("Verifying Note Scaling...")
    try:
        # Navigate to Inventory
        page.get_by_text("Nhập kho", exact=False).click()
        page.wait_for_timeout(1000)

        # Click FAB (last button on page, likely fixed position)
        # Using a coordinate click as fallback if selector fails is risky but works for visual test
        # Let's try the selector first: button that is fixed/absolute.
        # Or just click coordinates (Right Bottom)
        page.mouse.click(320, 700)
        page.wait_for_timeout(1000)

        # Check if modal opened
        if page.get_by_text("Thêm Mới").is_visible():
            print("Modal opened.")
            note_area = page.locator("textarea[placeholder='Ghi chú về sản phẩm...']")
            note_area.fill("Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10")
            page.wait_for_timeout(500)
            page.screenshot(path="/home/jules/verification/note_scaling.png")
            print("Screenshot taken: note_scaling.png")
        else:
            print("Modal did not open with coordinate click.")

    except Exception as e:
        print(f"Error checking note scaling: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
