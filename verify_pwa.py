from playwright.sync_api import sync_playwright, expect
import json

def test_pwa_ux(page):
    print("Navigating to home...")
    page.goto("http://localhost:5173")

    # Check if we are at login
    try:
        if page.get_by_role("button", name="Đăng Nhập").is_visible(timeout=3000):
            print("Logging in...")
            page.get_by_placeholder("Nhập tài khoản...").fill("tinyshop")
            page.get_by_placeholder("Nhập mật khẩu...").fill("Misa@2024")
            page.get_by_role("button", name="Đăng Nhập").click()
    except:
        print("Login skipped")

    # Wait for Dashboard load
    page.wait_for_timeout(3000)

    # Seed data
    print("Seeding data...")
    product = {
        "id": "test-product-pwa",
        "name": "Test PWA Product",
        "price": 100000,
        "quantity": 10,
        "category": "Test",
        "purchaseLots": []
    }

    page.evaluate(f"""() => {{
        localStorage.setItem('shop_products_v2', JSON.stringify([{json.dumps(product)}]));
    }}""")

    page.reload()
    page.wait_for_timeout(3000)

    # Dismiss Backup Modal if present
    try:
        later_btn = page.get_by_role("button", name="Để sau")
        if later_btn.is_visible(timeout=3000):
             later_btn.click()
             page.wait_for_timeout(1000)
    except:
        pass

    print("Navigating to Inventory...")
    page.get_by_text("Nhập kho").click()
    page.wait_for_timeout(1000)

    # Verify overscroll class on list
    # The list container is the div with onScroll handler in Inventory.jsx
    # It doesn't have a unique ID, so we need to find it by structure or class.
    # In the code it has "flex-1 overflow-y-auto min-h-0 pt-[56px] overscroll-y-contain"

    # We can try to find the container that contains the product item
    product_item = page.get_by_text("Test PWA Product")
    expect(product_item).to_be_visible()

    # Open Detail Modal to verify Drag Handle
    print("Opening detail modal...")
    product_item.click()

    # Wait for modal
    page.wait_for_timeout(1000)

    # Verify Drag Handle exists
    # It's a div with class "w-12 h-1.5 bg-gray-200 rounded-full"
    # We can assume if it's visible at the top, it's good.
    # Let's take a screenshot.

    print("Taking screenshot of Detail Modal with Drag Handle...")
    page.screenshot(path="/home/jules/verification/pwa_verification.png")
    print("Done!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_pwa_ux(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise
        finally:
            browser.close()
