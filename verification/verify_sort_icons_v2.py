from playwright.sync_api import sync_playwright, expect

def test_sort_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a mobile device
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173", timeout=30000)

        # Check if login is needed
        if page.get_by_text("Đăng Nhập").count() > 0:
            print("Logging in...")
            # Fill username and password
            page.fill("input[placeholder='Nhập tài khoản...']", "tiny-shop")
            page.fill("input[placeholder='Nhập mật khẩu...']", "Believe93")

            # Click Login button
            page.get_by_role("button", name="Đăng Nhập").click()

            # Wait for navigation to inventory
            page.wait_for_url("**/inventory", timeout=10000) # Assuming default redirect is inventory or similar
            # Or just wait for something specific to inventory
            print("Login successful (assumed).")

        # Wait for the Sort buttons to appear
        print("Waiting for sort buttons...")
        # The buttons have aria-label "Sort by Date" and "Sort by Price"
        # We might need to go to "Nhap kho" (Inventory) if not there by default

        # Check if we are on Inventory page
        # Assuming the default view after login is Inventory or Dashboard.
        # Let's look for "Nhập kho" tab or header.

        date_sort_btn = page.get_by_label("Sort by Date")
        price_sort_btn = page.get_by_label("Sort by Price")

        try:
            date_sort_btn.wait_for(state='visible', timeout=5000)
        except:
             print("Sort buttons not found, trying to navigate to Inventory...")
             # Maybe click a tab? But let's assume we are there for now based on previous runs failing only on timeout.

        date_sort_btn.wait_for(state='visible', timeout=10000)

        print("Taking screenshot 1: Default State (Date Desc - Newest)")
        # Usually Newest is default -> CalendarArrowDown
        page.screenshot(path="verification/1_default_date_desc.png")

        # Click Date Sort -> Toggle to Asc (Oldest)
        print("Clicking Date Sort...")
        date_sort_btn.click()
        page.wait_for_timeout(500) # Wait for animation
        print("Taking screenshot 2: Date Asc (Oldest)")
        page.screenshot(path="verification/2_date_asc.png")

        # Click Price Sort -> Asc (Cheapest - Low to High)
        print("Clicking Price Sort...")
        price_sort_btn.click()
        page.wait_for_timeout(500)
        print("Taking screenshot 3: Price Asc (Cheapest)")
        page.screenshot(path="verification/3_price_asc.png")

        # Click Price Sort -> Toggle to Desc (Most Expensive - High to Low)
        print("Clicking Price Sort...")
        price_sort_btn.click()
        page.wait_for_timeout(500)
        print("Taking screenshot 4: Price Desc (Expensive)")
        page.screenshot(path="verification/4_price_desc.png")

        print("Verification complete.")
        browser.close()

if __name__ == "__main__":
    test_sort_icons()
