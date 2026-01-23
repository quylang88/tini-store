from playwright.sync_api import sync_playwright, expect

def run(playwright):
    iphone_12 = playwright.devices['iPhone 12']
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(**iphone_12)
    page = context.new_page()

    # Go to app
    page.goto("http://localhost:5173")

    # Login
    page.fill('input[type="text"]', 'tiny-shop')
    page.fill('input[type="password"]', 'Believe93')
    page.click('button:has-text("Đăng nhập")')

    # Wait for dashboard (assuming "Tổng quan" or "Doanh thu" text appears)
    page.wait_for_selector('text=Tổng quan', timeout=10000)

    # Wait for TabBar to appear
    # The TabBar has specific icons like "Tổng quan", "Nhập kho", etc.
    # It has class "fixed bottom-0" now.

    # We will screenshot the bottom part
    # Or just the whole page
    page.wait_for_timeout(2000) # Wait for transitions

    page.screenshot(path="verification/tabbar_check.png")

    # Also specifically verify the computed style of the TabBar wrapper if possible,
    # but visual inspection is better.

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
