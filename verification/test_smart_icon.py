
from playwright.sync_api import sync_playwright
import time

def verify_all_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use iPhone 13 viewport to match the mobile-first design
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        # Navigate to app
        page.goto("http://localhost:5173")

        # Login
        page.fill("input[type='text']", "tiny-shop")
        page.fill("input[type='password']", "Believe93")
        page.click("button[type='submit']")

        # Wait for TabBar and click Assistant tab (Trợ lý)
        # Assuming the tab has text "Trợ lý" or is the 3rd tab
        page.wait_for_timeout(2000)
        page.get_by_text("Trợ lý").click()

        # Wait for Assistant screen
        page.wait_for_selector("text=Trợ lý ảo Misa")

        # Default mode is Smart (AssistantIcon)
        # Take screenshot of the Chat Input with Assistant Icon active
        time.sleep(1) # Wait for animation to start
        page.screenshot(path="verification/smart_active.png")
        print("Screenshot taken: verification/smart_active.png")

        browser.close()

if __name__ == "__main__":
    verify_all_icons()
