from playwright.sync_api import sync_playwright

def test_verify_no_settings_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Login Logic
        page.add_init_script("""
            sessionStorage.setItem('tini_auth', 'true');
        """)

        # 2. Go to app
        page.goto("http://localhost:5174")
        page.wait_for_timeout(2000)

        # 3. Navigate to Settings
        page.get_by_role("button", name="Cài đặt").click()
        page.wait_for_timeout(1000)

        # 4. Verify the Notification UI DOES NOT exist
        expect_text = page.get_by_text("Nhắc nhở thông báo")

        if expect_text.is_visible():
            raise Exception("UI 'Nhắc nhở thông báo' should be gone but is visible")

        print("UI 'Nhắc nhở thông báo' is correctly missing.")

        # 5. Take screenshot
        page.screenshot(path="verification/settings_no_notification_ui.png")

        browser.close()

if __name__ == "__main__":
    test_verify_no_settings_ui()
