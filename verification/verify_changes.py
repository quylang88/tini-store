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

    # Inject Data for both Products and Orders
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

    test_order = {
        "id": "test-order-1",
        "date": 1704067200000, # Example timestamp
        "items": [
             {
                 "productId": "test-product-1",
                 "name": "Test Product With Very Long Name To Verify Expansion In Order Detail",
                 "price": 150000,
                 "quantity": 2,
                 "cost": 100000
             }
        ],
        "total": 300000,
        "customerName": "Test Customer",
        "orderType": "delivery",
        "warehouse": "daLat"
    }

    page.evaluate(f"""
        const products = {json.dumps([test_product])};
        localStorage.setItem('shop_products_v2', JSON.stringify(products));
        const orders = {json.dumps([test_order])};
        localStorage.setItem('shop_orders_v2', JSON.stringify(orders));
    """)

    page.reload()
    page.wait_for_timeout(3000)

    close_modal()

    # 1. Verify Order Create Screen (Expansion behavior)
    print("Navigating to Order Create...")
    page.get_by_text("Xuất kho", exact=False).click()
    page.wait_for_timeout(2000)

    if page.get_by_role("button", name="Tạo đơn hàng").is_visible():
         page.get_by_role("button", name="Tạo đơn hàng").click()
         page.wait_for_timeout(2000)

    try:
        name_loc = page.locator(".font-bold.text-rose-800").first
        if name_loc.is_visible():
            print("Found product in Order Create.")

            # Initial screenshot (should be truncated)
            page.screenshot(path="verification/order_create_initial.png")

            # Expand
            name_loc.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/order_create_expanded.png")

            # Check logic: price hidden?
            price_loc = page.locator("span.font-bold.text-rose-700").first
            if not price_loc.is_visible():
                 print("Price is HIDDEN in Order Create (Correct).")
            else:
                 print("Price is VISIBLE in Order Create (Incorrect).")
        else:
            print("Product not found in Order Create")
    except Exception as e:
        print(f"Order Create Error: {e}")

    # 2. Verify Order Detail Modal (Expansion behavior without hiding)
    print("Navigating to Order List...")
    # Go back or click tab again
    page.get_by_text("Xuất kho", exact=False).click()
    page.wait_for_timeout(2000)

    # We injected an order. It should be visible.
    try:
        # Look for order item. Usually a card.
        # Click on the order to open modal.
        # The list items usually have text like "#..." or total price.
        order_item = page.locator("text=300.000").first
        if order_item.is_visible():
            print("Found Order in List. Opening Modal...")
            order_item.click()
            page.wait_for_timeout(1000)

            page.screenshot(path="verification/order_detail_modal.png")

            # Find the name in modal.
            # It should be font-semibold text-rose-900.
            modal_name_loc = page.locator(".font-semibold.text-rose-900").first
            if modal_name_loc.is_visible():
                print("Found product name in Modal.")
                # Expand
                modal_name_loc.click()
                page.wait_for_timeout(500)
                page.screenshot(path="verification/order_detail_expanded.png")

                # Verify price is still visible (it is in a sibling div)
                modal_price = page.locator(".font-semibold.text-rose-700.whitespace-nowrap").first
                if modal_price.is_visible():
                    print("Price is VISIBLE in Modal (Correct).")
                else:
                    print("Price is HIDDEN in Modal (Incorrect).")
            else:
                print("Product name not found in Modal")

        else:
            print("Order not found in list")
            page.screenshot(path="verification/order_list_empty.png")

    except Exception as e:
        print(f"Order Detail Error: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
