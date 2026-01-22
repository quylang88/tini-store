
import time
from playwright.sync_api import sync_playwright, expect

def verify_model_names_and_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
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

            # Wait for home page
            print("Waiting for home page...")
            page.wait_for_url("http://localhost:5173/", timeout=10000)

            # Click "Trợ lý" tab
            print("Navigating to Assistant tab...")
            page.get_by_text("Trợ lý").click()

            # Wait for Assistant screen
            print("Waiting for Assistant screen...")
            expect(page.get_by_text("Trợ lý Misa")).to_be_visible()

            # Open Model Selector
            print("Opening Model Selector...")
            page.locator("form button").first.click()

            # Wait for Modal
            expect(page.get_by_text("Chọn chế độ AI")).to_be_visible()

            # Verify "Misa Smart" (was Pro)
            print("Verifying Misa Smart...")
            expect(page.get_by_text("Misa Smart")).to_be_visible()
            expect(page.get_by_text("Ổn định, limit cao, phù hợp đa số tác vụ.")).to_be_visible()

            # Verify "Misa Lite" and Icon
            print("Verifying Misa Lite...")
            lite_model = page.get_by_text("Misa Lite")
            expect(lite_model).to_be_visible()

            # Screenshot of the Selector
            print("Taking screenshot of Selector...")
            time.sleep(1)
            page.screenshot(path="verification_selector.png")
            print("Screenshot saved: verification_selector.png")

            # Select "Misa Lite"
            print("Selecting Misa Lite...")
            lite_model.click()

            # Verify Selector closed and we are back
            print("Verifying Lite Selection...")
            time.sleep(0.5)
            # The icon in the input should now be the feather (LiteIcon)
            # We can't easily assert the SVG path, but we can screenshot the input

            print("Taking screenshot of Input with Lite Icon...")
            page.screenshot(path="verification_input_lite.png")
            print("Screenshot saved: verification_input_lite.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error_verification.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_model_names_and_icons()
