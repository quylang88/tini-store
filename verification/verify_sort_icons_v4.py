from playwright.sync_api import sync_playwright, expect

def test_sort_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173", timeout=30000)

        # Check if login is needed
        if page.get_by_text("Đăng Nhập").count() > 0:
            print("Logging in...")
            page.fill("input[placeholder='Nhập tài khoản...']", "tiny-shop")
            page.fill("input[placeholder='Nhập mật khẩu...']", "Believe93")
            page.get_by_role("button", name="Đăng Nhập").click()
            print("Login submitted...")
            page.wait_for_timeout(2000)

        # Navigate to Inventory (Nhập kho)
        print("Navigating to Inventory...")
        # Try to find the tab bar item
        # Based on screenshot, it says "NHẬP KHO"
        try:
             page.get_by_text("NHẬP KHO").click()
        except:
             # Fallback: maybe it's just "Nhập kho" or different case?
             # Or use an icon?
             # Let's try exact text matching first, usually it works if visible.
             # Screenshot shows "NHẬP KHO" in uppercase.
             pass

        print("Waiting for sort buttons...")
        date_sort_btn = page.get_by_label("Sort by Date")
        price_sort_btn = page.get_by_label("Sort by Price")

        try:
            date_sort_btn.wait_for(state='visible', timeout=10000)
        except Exception as e:
            print("Failed to find sort button. Saving screenshot...")
            page.screenshot(path="verification/error_inventory.png")
            raise e

        print("Taking screenshot 1: Default State (Date Desc - Newest)")
        # Usually Newest is default -> CalendarArrowDown
        page.screenshot(path="verification/1_default_date_desc.png")

        # Click Date Sort -> Toggle to Asc (Oldest)
        print("Clicking Date Sort...")
        date_sort_btn.click()
        page.wait_for_timeout(1000) # Wait for animation
        print("Taking screenshot 2: Date Asc (Oldest)")
        page.screenshot(path="verification/2_date_asc.png")

        # Click Price Sort -> Asc (Cheapest - Low to High)
        print("Clicking Price Sort...")
        price_sort_btn.click()
        page.wait_for_timeout(1000)
        print("Taking screenshot 3: Price Asc (Cheapest)")
        page.screenshot(path="verification/3_price_asc.png")

        # Click Price Sort -> Toggle to Desc (Most Expensive - High to Low)
        print("Clicking Price Sort...")
        price_sort_btn.click()
        page.wait_for_timeout(1000)
        print("Taking screenshot 4: Price Desc (Expensive)")
        page.screenshot(path="verification/4_price_desc.png")

        print("Verification complete.")
        browser.close()

if __name__ == "__main__":
    test_sort_icons()
