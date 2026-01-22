
import time
from playwright.sync_api import sync_playwright, expect

def verify_model_names():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant geolocation permission so the location prompt doesn't block UI
        context = browser.new_context(permissions=['geolocation'])
        page = context.new_page()

        try:
            print("Navigating to login...")
            page.goto("http://localhost:5173/login")

            # Login
            print("Logging in...")
            page.get_by_placeholder("Tên đăng nhập").fill("tiny-shop")
            page.get_by_placeholder("Mật khẩu").fill("Believe93")
            page.get_by_role("button", name="Đăng nhập").click()

            # Wait for home page (TabBar should be visible)
            print("Waiting for home page...")
            page.wait_for_url("http://localhost:5173/", timeout=10000)

            # Click "Trợ lý" tab
            print("Navigating to Assistant tab...")
            # The tab likely has text "Trợ lý"
            assistant_tab = page.get_by_text("Trợ lý")
            assistant_tab.click()

            # Wait for Assistant screen
            print("Waiting for Assistant screen...")
            expect(page.get_by_text("Trợ lý Misa")).to_be_visible()

            # Find the settings button in ChatInput and click it
            # The button is likely an SVG icon button near the input
            # Let's target the button that opens the selector.
            # In ChatInput.jsx: <button onClick={onOpenModelSelector} ... > <Settings2 ... /> </button>
            # It's the first button in the bottom bar usually.
            print("Opening Model Selector...")

            # We can try to find the button by the 'Settings2' icon or just the first button in that area
            # Or use a selector based on the structure
            settings_btn = page.locator("form button").first
            settings_btn.click()

            # Wait for Modal to appear
            print("Waiting for Model Selector Modal...")
            expect(page.get_by_text("Chọn chế độ AI")).to_be_visible()

            # Verify Texts
            print("Verifying Model Names and Descriptions...")

            # Check for "Misa Pro"
            expect(page.get_by_text("Misa Pro")).to_be_visible()
            expect(page.get_by_text("Ổn định, limit cao, phù hợp đa số tác vụ.")).to_be_visible()

            # Check for "Misa Flash"
            expect(page.get_by_text("Misa Flash")).to_be_visible()
            expect(page.get_by_text("Tốc độ cao, thông minh, giới hạn lượt dùng.")).to_be_visible()

            # Check for "Misa Lite"
            expect(page.get_by_text("Misa Lite")).to_be_visible()
            expect(page.get_by_text("Siêu tốc, tiết kiệm, tác vụ đơn giản.")).to_be_visible()

            # Screenshot
            print("Taking screenshot...")
            # Wait a bit for animations
            time.sleep(1)
            page.screenshot(path="verification_models.png")
            print("Screenshot saved to verification_models.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error_screenshot.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_model_names()
