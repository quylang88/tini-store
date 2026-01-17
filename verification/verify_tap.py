import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Set viewport to mobile size
    page.set_viewport_size({"width": 375, "height": 812})

    # Prepare mock data
    mock_products = [
        {
            "id": "p1",
            "name": "Sản phẩm test active",
            "price": 100000,
            "category": "Áo",
            "image": "",
            "warehouseStock": {"vinhPhuc": 10, "daLat": 5},
            "importHistory": []
        }
    ]
    mock_orders = [
        {
            "id": "o1",
            "orderNumber": "1234",
            "date": "2023-10-27T10:00:00.000Z",
            "total": 500000,
            "status": "pending",
            "items": [],
            "customer": {"name": "Khách Test", "phone": "0909090909"},
            "orderType": "delivery"
        }
    ]

    # Inject storage before load
    page.add_init_script(f"""
        sessionStorage.setItem('tini_auth', 'true');
        localStorage.setItem('shop_products_v2', '{str(mock_products).replace(chr(39), chr(34))}');
        localStorage.setItem('shop_orders_v2', '{str(mock_orders).replace(chr(39), chr(34))}');
    """)

    # Go to app
    page.goto("http://localhost:5174")

    # Navigate to inventory tab if not already there
    try:
        page.get_by_text("Nhập kho").click()
    except:
        pass

    # Wait for inventory to load
    page.get_by_text("Sản phẩm test active").wait_for()

    # Test 1: Inventory Item Tap
    product_item = page.get_by_text("Sản phẩm test active").locator("..").locator("..").locator("..").locator("..") # finding the parent card
    # Actually finding the card by class content or just using the text element parent chain is risky.
    # The card contains the text "Sản phẩm test active".

    # Let's target the motion div. The card has class 'bg-amber-50'.
    card = page.locator(".bg-amber-50").first

    # Move mouse to center of card
    box = card.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)

    # Mouse down
    page.mouse.down()
    time.sleep(0.5) # Wait for animation
    page.screenshot(path="verification/inventory_tap.png")
    page.mouse.up()

    # Navigate to Orders (Assuming a tab bar or link exists)
    # Finding the "Đơn hàng" tab.
    # The tab bar usually has icons. Let's try to click by text if available or icon.
    # Usually bottom tab bar.
    # I'll look for text "Đơn hàng" or similar.
    # If not found, I might need to know the structure.
    # Let's list the text on page to find the tab.

    # Try clicking "Đơn hàng"
    try:
        page.get_by_text("Đơn hàng").click()
    except:
        # Maybe icon based.
        # Let's just screenshot inventory first and verify.
        pass

    # If we can switch to orders, test order item.
    # Assuming we successfully switched or I need to navigate manually.

    # Let's try to verify Order List by manually rendering it if needed, or assuming the tab works.
    # If I can't find the tab easily, I'll stop at inventory verification.
    # But I should try.

    # Let's assume the TabBar has "Đơn hàng".

    time.sleep(1)
    # Check if we are on orders page
    if page.get_by_text("Khách Test").is_visible():
        order_card = page.locator(".bg-amber-50").first
        box = order_card.bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        time.sleep(0.5)
        page.screenshot(path="verification/order_tap.png")
        page.mouse.up()
    else:
        print("Could not navigate to Orders or no orders found.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
