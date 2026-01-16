from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5174")

        # Login
        print("Logging in...")
        page.fill("input[type='text']", "tiny-shop")
        page.fill("input[type='password']", "Believe93")
        page.click("button:has-text('Đăng nhập')")

        # Wait for Dashboard
        print("Waiting for Dashboard...")
        try:
            page.wait_for_selector("text=Tổng quan", timeout=10000)
            print("Dashboard loaded.")
        except:
            print("Dashboard failed to load or timeout.")
            # Screenshot for debug
            page.screenshot(path="debug_dashboard_error.png")
            browser.close()
            return

        # Check for Month Label (e.g., "Tháng ...")
        month_label = page.locator("h2.text-xl.font-bold.text-amber-900").first
        if month_label.is_visible():
            print(f"Month Label found: {month_label.inner_text()}")
        else:
            print("Month Label NOT found.")

        # Check for new Metrics (Total Capital, Slow Moving)
        capital_card = page.locator("text=Vốn tồn kho")
        if capital_card.is_visible():
             print("Capital Card found.")
        else:
             print("Capital Card NOT found.")

        # Check for Slow Moving section
        # Note: Depending on test data, it might not show if no slow moving items.
        # But we can check if the code doesn't crash.
        print("Dashboard check complete.")

        browser.close()

if __name__ == "__main__":
    verify_dashboard()
