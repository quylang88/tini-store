
import time
from playwright.sync_api import sync_playwright, expect

def verify_model_names_and_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(permissions=['geolocation'])
        page = context.new_page()

        try:
            print("Navigating to home...")
            page.goto("http://localhost:5173/")

            # Check login state
            print("Checking login state...")
            try:
                page.wait_for_selector("button:has-text('Đăng Nhập')", timeout=3000)
                is_login_page = True
            except:
                is_login_page = False

            if is_login_page:
                print("On Login Page. Logging in...")
                page.get_by_placeholder("Nhập tài khoản...").fill("tiny-shop")
                page.get_by_placeholder("Nhập mật khẩu...").fill("Believe93")
                page.get_by_role("button", name="Đăng Nhập").click()
                print("Logged in. Waiting for Home...")
                # Wait for Home specific element
                page.wait_for_selector("button:has-text('Trợ lý')", timeout=15000)
            else:
                print("Assuming Home Page.")

            # Now we should be on Home
            # Click "Trợ lý" tab
            print("Navigating to Assistant tab...")
            page.locator("button").filter(has_text="Trợ lý").click()

            # Wait for Assistant screen - Use specific text from screenshot
            print("Waiting for Assistant screen...")
            # Screenshot showed "Trợ lý ảo Misa"
            expect(page.get_by_text("Trợ lý ảo Misa")).to_be_visible()

            # Verify Header shows "Misa Smart" (default)
            print("Verifying Header shows Misa Smart...")
            expect(page.get_by_text("Misa Smart")).to_be_visible()

            # Open Model Selector
            print("Opening Model Selector...")
            page.locator("form button").first.click()

            # Wait for Modal
            expect(page.get_by_text("Chọn chế độ AI")).to_be_visible()

            # Verify "Misa Smart" description
            print("Verifying Misa Smart description...")
            expect(page.get_by_text("Ổn định, limit cao, phù hợp đa số tác vụ.")).to_be_visible()

            # Verify "Misa Lite"
            print("Verifying Misa Lite...")
            lite_model = page.get_by_text("Misa Lite")
            expect(lite_model).to_be_visible()
            expect(page.get_by_text("Siêu tốc, tiết kiệm, tác vụ đơn giản.")).to_be_visible()

            # Select "Misa Lite"
            print("Selecting Misa Lite...")
            lite_model.click()

            # Verify Header now shows "Misa Lite"
            print("Verifying Header shows Misa Lite...")
            # Wait a bit for state update
            time.sleep(0.5)
            expect(page.get_by_text("Misa Lite")).to_be_visible()

            print("Taking final screenshot...")
            page.screenshot(path="verification_complete.png")
            print("Screenshot saved: verification_complete.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error_verification_v6.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_model_names_and_icons()
