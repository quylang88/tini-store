from playwright.sync_api import sync_playwright

def verify_assistant_chat_input():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a mobile viewport to match the app style
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        print("Navigating to login...")
        page.goto("http://localhost:5174/")
        page.wait_for_timeout(3000)

        if page.get_by_placeholder("Nhập tài khoản...").is_visible():
            print("Logging in...")
            page.get_by_placeholder("Nhập tài khoản...").fill("tiny-shop")
            page.get_by_placeholder("Nhập mật khẩu...").fill("Believe93")
            page.get_by_role("button", name="Đăng Nhập").click()
            print("Clicked login, waiting for navigation...")
            page.wait_for_timeout(5000)
        else:
            print("Login fields not found.")

        print("Navigating to Assistant tab...")
        try:
            # Using specific locator for TabBar item to avoid header conflict
            # TabBar items are buttons with text
            assistant_tab = page.locator("button").filter(has_text="Trợ lý")
            if assistant_tab.count() > 0:
                 assistant_tab.last.click()
            else:
                 # Fallback
                 page.get_by_text("Trợ lý", exact=True).click()

            page.wait_for_timeout(2000)

            print("Taking screenshot of static state...")
            page.screenshot(path="verification/assistant_static.png")

            print("Focusing input to trigger animation...")
            page.get_by_placeholder("Hỏi trợ lý ảo...").click()
            page.wait_for_timeout(500)

            print("Taking screenshot of active state...")
            page.screenshot(path="verification/assistant_active.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")

        browser.close()

if __name__ == "__main__":
    verify_assistant_chat_input()
