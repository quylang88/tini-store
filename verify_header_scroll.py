from playwright.sync_api import sync_playwright

def verify_app_header_scroll(page):
    # Go to Inventory screen
    page.goto("http://localhost:5173/")

    # Check if we are at login screen
    if page.locator("input[type='password']").is_visible():
        print("Logging in...")
        page.fill("input[type='text']", "tiny-shop")
        page.fill("input[type='password']", "Believe93")
        page.click("button:has-text('Đăng nhập')")

    # Wait for dashboard/content
    page.wait_for_selector('div:has-text("Doanh thu")', state="visible")

    print("On Dashboard. Taking screenshot top.")
    page.screenshot(path="/home/jules/verification/dashboard_top.png")

    # Scroll Dashboard
    page.evaluate("""
        const list = document.querySelector('.overflow-y-auto');
        if (list) {
            list.scrollTo(0, 100);
        }
    """)
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/dashboard_scrolled.png")
    print("Captured dashboard_scrolled.png")

    # Navigate to Inventory using text label "Nhập kho"
    print("Navigating to Inventory...")
    page.click("text=Nhập kho")
    page.wait_for_timeout(1000)

    print("On Inventory. Taking screenshot top.")
    page.screenshot(path="/home/jules/verification/inventory_top.png")

    # Scroll Inventory
    page.evaluate("""
        const list = document.querySelector('.overflow-y-auto');
        if (list) {
            list.scrollTo(0, 100);
        }
    """)
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/inventory_scrolled.png")
    print("Captured inventory_scrolled.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        # Use mobile view (iPhone 12 Pro) to match context
        device = p.devices['iPhone 12 Pro']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**device)
        page = context.new_page()

        try:
            verify_app_header_scroll(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
