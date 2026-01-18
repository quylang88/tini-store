
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        iphone_12 = p.devices['iPhone 12 Pro']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**iphone_12)
        page = context.new_page()

        print("Navigating...")
        page.goto("http://localhost:5173")

        # Login
        try:
            page.wait_for_selector('input[placeholder="Nhập tài khoản..."]', timeout=5000)
            page.fill('input[placeholder="Nhập tài khoản..."]', "tiny-shop")
            page.fill('input[placeholder="Nhập mật khẩu..."]', "Believe93")
            page.click('button[type="submit"]')
            page.wait_for_selector('text=Tổng quan', timeout=10000)

            # Wait for transition
            time.sleep(2)

            # Inject CSS to simulate PWA Safe Area behavior
            print("Injecting Safe Area CSS...")
            page.add_style_tag(content="""
                .pb-safe-area { padding-bottom: 34px !important; }
            """)

            # Take screenshot
            tabbar = page.locator('div.fixed.bottom-0.left-0.right-0')
            if tabbar.count() > 0:
                page.screenshot(path="verification/tabbar_shifted.png")
                print("Screenshot saved: verification/tabbar_shifted.png")

                # Check height of inner div
                inner = tabbar.locator('div.flex')
                box = inner.bounding_box()
                print(f"Inner Height: {box['height']}px")

                classes = inner.get_attribute("class")
                if "h-[54px]" in classes and "pt-2" in classes:
                    print("SUCCESS: Classes verified.")
                else:
                    print(f"FAILURE: Classes: {classes}")

            else:
                print("TabBar not found")

        except Exception as e:
            print(f"Error: {e}")

        browser.close()

if __name__ == "__main__":
    run()
