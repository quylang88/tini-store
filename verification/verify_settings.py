from playwright.sync_api import sync_playwright

def test_verify_notifications_settings():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a context with permissions cleared/default to test logic
        context = browser.new_context()
        page = context.new_page()

        # 1. Login Logic (based on App.jsx logic: sessionStorage 'tini_auth'='true' skips login)
        # However, since we start fresh, we might need to login or mock auth.
        # Let's try mocking sessionStorage before navigation

        page.add_init_script("""
            sessionStorage.setItem('tini_auth', 'true');
        """)

        # 2. Go to app
        page.goto("http://localhost:5173")
        page.wait_for_timeout(2000) # Wait for splash screen

        # 3. Navigate to Settings
        # Based on TabBar structure, settings is likely the 4th tab or has a specific icon
        # Looking at App.jsx, tabs are: dashboard, products, orders, settings
        # The TabBar likely has a 'Settings' or 'Cài đặt' label or icon

        # Let's find the settings tab button.
        # Inspecting read files for TabBar keys or labels is hard without reading TabBar.jsx,
        # but typically it's the last one.
        # Let's try to click by text "Cài đặt" if available, or use a selector for the tab bar.

        try:
            settings_tab = page.get_by_text("Cài đặt", exact=False).first
            if settings_tab.is_visible():
                settings_tab.click()
            else:
                # Fallback: maybe just click the 4th tab item?
                # Assuming tab bar is at bottom.
                pass
        except:
             # If "Cài đặt" text isn't found easily, let's try to find the icon or just brute force click the area
             # But better to check page content.
             pass

        # If we can't find "Cài đặt", maybe the icon is generic.
        # Let's look for the Settings component content to verify navigation.
        # Settings.jsx has "Cấu hình Tiền tệ", "Danh mục sản phẩm", "Sao lưu & Khôi phục"

        # Let's try to find text "Sao lưu & Khôi phục"
        # If not visible, we are not in settings.

        # Try to click the settings tab (usually bottom right)
        # We can simulate a click on the tab bar area if we knew the selector.
        # Or look for "settings" in aria-label or test-id if they existed.

        # Let's assume standard TabBar usage.
        # Let's try to locate by the 'Settings' text which usually appears under the icon in TabBars.
        page.get_by_role("button", name="Cài đặt").click()

        page.wait_for_timeout(1000)

        # 4. Verify the new Notification UI exists
        # We added "Nhắc nhở thông báo" and a button/text

        expect_text = page.get_by_text("Nhắc nhở thông báo")
        expect_text.wait_for(state="visible", timeout=5000)

        # 5. Take screenshot of the Settings page showing the new section
        page.screenshot(path="verification/settings_notification_ui.png")

        browser.close()

if __name__ == "__main__":
    test_verify_notifications_settings()
