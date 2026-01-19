from playwright.sync_api import sync_playwright
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()

    print("Navigating to home...")
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Login
    if page.get_by_placeholder("Nhập tài khoản...").is_visible():
        print("Logging in...")
        page.get_by_placeholder("Nhập tài khoản...").fill("tiny-shop")
        page.get_by_placeholder("Nhập mật khẩu...").fill("Believe93")
        page.get_by_role("button", name="Đăng nhập").click()
        page.wait_for_timeout(3000)

    # Helper to close modal
    def close_modal():
        try:
            if page.get_by_text("Sao lưu dữ liệu?", timeout=1000).is_visible():
                print("Closing Backup Modal...")
                page.get_by_role("button", name="Để sau").click()
                page.wait_for_timeout(1000)
        except:
            pass

    close_modal()

    # Inject Data
    print("Injecting test data...")
    test_product = {
        "id": "test-product-1",
        "name": "Test Product With Very Long Name To Verify Expansion Behavior In The UI",
        "price": 150000,
        "stock": 100,
        "category": "Chung",
        "stockByWarehouse": {"daLat": 50, "vinhPhuc": 50},
        "image": ""
    }

    page.evaluate(f"""
        const products = {json.dumps([test_product])};
        localStorage.setItem('shop_products_v2', JSON.stringify(products));
    """)

    page.reload()
    page.wait_for_timeout(3000)

    close_modal()

    # Navigate to Inventory
    print("Navigating to Inventory...")
    page.get_by_text("Nhập kho", exact=False).click()
    page.wait_for_timeout(2000)
    page.screenshot(path="verification/inventory_screen.png")

    try:
        name_loc = page.locator(".font-bold.text-rose-800").first
        if name_loc.is_visible():
            print("Found product in Inventory.")
            name_loc.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/inventory_clicked.png")

            # Verify details are VISIBLE (Standard behavior)
            price = page.locator(".text-rose-700.font-bold").first
            if price.is_visible():
                print("Price is visible in Inventory (Correct).")
            else:
                print("Price is HIDDEN in Inventory (Incorrect).")
        else:
            print("Product not found in Inventory")
    except Exception as e:
        print(f"Inventory Error: {e}")

    # Navigate to Order Create
    print("Navigating to Order Create...")
    page.get_by_text("Xuất kho", exact=False).click()
    page.wait_for_timeout(2000)

    if page.get_by_role("button", name="Tạo đơn hàng").is_visible():
         page.get_by_role("button", name="Tạo đơn hàng").click()
         page.wait_for_timeout(2000)

    close_modal() # Just in case

    try:
        name_loc = page.locator(".font-bold.text-rose-800").first
        if name_loc.is_visible():
            print("Found product in Order Create.")

            # Expand
            name_loc.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/order_expanded.png")

            # Check Price Hidden
            # Note: We need to look for price associated with the item.
            # But checking if ANY price is hidden is tricky if others are visible.
            # We only have 1 product.
            price_loc = page.locator("span.font-bold.text-rose-700").first
            if not price_loc.is_visible():
                 print("Price is HIDDEN in Order Create (Correct).")
            else:
                 print("Price is VISIBLE in Order Create (Incorrect).")

            # Plus Check
            plus_btn = page.locator("button.bg-amber-100").first
            if plus_btn.is_visible():
                print("Clicking Plus...")
                plus_btn.click()
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/order_stepper.png")
        else:
            print("Product not found in Order Create")
    except Exception as e:
        print(f"Order Error: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
