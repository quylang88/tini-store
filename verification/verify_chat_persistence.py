from playwright.sync_api import sync_playwright, expect
import time

def verify_chat_persistence(page):
    # 1. Login
    page.goto("http://localhost:5173")

    # Give React a moment to render
    time.sleep(2)

    # Check if we need to login
    if page.get_by_text("TÀI KHOẢN").is_visible():
        print("Logging in...")
        page.get_by_placeholder("Nhập tài khoản...").fill("tiny-shop")
        page.get_by_placeholder("Nhập mật khẩu...").fill("Believe93")
        page.get_by_role("button", name="Đăng Nhập").click()
    else:
        print("Already logged in or on dashboard.")

    # Wait for dashboard to load
    print("Waiting for dashboard...")
    expect(page.get_by_text("DOANH THU").first).to_be_visible(timeout=10000)

    # 2. Navigate to Assistant Tab
    print("Navigating to Assistant...")
    assistant_tab = page.locator("button").filter(has_text="TRỢ LÝ")
    assistant_tab.click()

    # Wait for Assistant screen header
    expect(page.get_by_role("heading", name="Trợ lý ảo Misa")).to_be_visible()

    # 3. Send a message
    # Wait for initial message (welcome message)
    # Using first to avoid strict mode if it appears in header too (though header is H1)
    # Actually, verify welcome message specifically if needed, or just proceed.

    chat_input = page.get_by_role("textbox")
    chat_input.fill("Hello persistence check")

    # Click send
    print("Sending message...")
    chat_input.press("Enter")

    # Verify user message appears
    expect(page.get_by_text("Hello persistence check", exact=True)).to_be_visible()

    # Take screenshot of chat before leaving
    page.screenshot(path="verification/chat_before_leave.png")

    # 4. Navigate away
    print("Navigating away...")
    inventory_tab = page.locator("button").filter(has_text="NHẬP KHO")
    inventory_tab.click()

    # Wait for Inventory screen
    time.sleep(2)

    # 5. Navigate back to Assistant
    print("Navigating back...")
    assistant_tab.click()

    # 6. Verify message is still there
    expect(page.get_by_text("Hello persistence check", exact=True)).to_be_visible()

    # Take screenshot of chat after returning
    page.screenshot(path="verification/chat_after_return.png")
    print("Verification successful: Chat history persisted.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            verify_chat_persistence(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
