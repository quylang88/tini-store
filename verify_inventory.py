from playwright.sync_api import sync_playwright
import time

def verify_inventory():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844}, # iPhone 12 Pro dimensions
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # Login
        page.goto("http://localhost:5173")
        page.fill("input[type='text']", "tiny-shop")
        page.fill("input[type='password']", "Believe93")
        page.click("button:has-text('Đăng nhập')")

        # Wait for navigation to Dashboard
        page.wait_for_selector("text=Tổng quan", timeout=10000)
        print("Logged in successfully.")

        # Navigate to Inventory (Nhập kho)
        page.get_by_text("Nhập kho").click()
        print("Clicked 'Nhập kho'.")

        # Wait for Inventory to load
        search_input = page.get_by_placeholder("Tìm tên hoặc quét mã...")
        search_input.wait_for(state="visible", timeout=10000)
        print("Inventory loaded.")

        # Snapshot of initial list
        page.screenshot(path="/home/jules/verification/inventory_list.png")
        print("Captured inventory_list.png")

        # Filter to empty state (Search for gibberish)
        search_input.fill("zzzzzzzzzz")

        # Wait for empty state text - CORRECTED TEXT
        empty_state = page.get_by_text("Không có sản phẩm nào")
        empty_state.wait_for(state="visible", timeout=5000)

        # Snapshot of empty state
        page.screenshot(path="/home/jules/verification/inventory_empty.png")
        print("Captured inventory_empty.png")

        browser.close()

if __name__ == "__main__":
    verify_inventory()
