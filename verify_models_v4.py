
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
            time.sleep(3) # Wait for potential redirect or load

            # Check where we are
            print(f"Current URL: {page.url}")

            if "login" in page.url:
                print("On Login Page. Attempting login...")

                # Using more generic selectors based on placeholder
                # Wait for element to be visible
                page.wait_for_selector("input[placeholder='Nhập tài khoản...']", timeout=10000)

                page.get_by_placeholder("Nhập tài khoản...").fill("tiny-shop")
                page.get_by_placeholder("Nhập mật khẩu...").fill("Believe93")
                page.get_by_role("button", name="Đăng Nhập").click()

                # Wait for redirect to home
                print("Waiting for redirect to home...")
                page.wait_for_url("http://localhost:5173/", timeout=20000)

            print("On Home Page. Navigating to Assistant...")
            time.sleep(2) # Wait for TabBar to mount

            # Click "Trợ lý" tab (text is uppercase in span)
            # Find by text might be case sensitive or layout dependent
            # Let's try finding the button that contains "Trợ lý"

            # Use a more flexible selector
            assistant_tab = page.locator("button").filter(has_text="Trợ lý")
            assistant_tab.wait_for(state="visible", timeout=10000)
            assistant_tab.click()

            # Wait for Assistant screen
            print("Waiting for Assistant screen...")
            expect(page.get_by_text("Trợ lý Misa")).to_be_visible()

            # Open Model Selector
            print("Opening Model Selector...")
            # Button is in ChatInput form
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
            time.sleep(1)

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
