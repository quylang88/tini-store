
from playwright.sync_api import sync_playwright
import time

def verify_icons():
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

        # Open Model Selector. It's the button inside the form.
        page.locator("form button").first.click()

        # Wait for Model Selector modal
        page.wait_for_selector("text=Chọn chế độ AI")

        # Take screenshot of the Model Selector (Shows Flash and Deep icons inactive)
        page.screenshot(path="verification/model_selector.png")
        print("Screenshot taken: verification/model_selector.png")

        # Click on "Misa Deep"
        page.click("text=Misa Deep")
        time.sleep(1)
        # Take screenshot of the Chat Input with Deep Icon active
        page.screenshot(path="verification/deep_active.png")
        print("Screenshot taken: verification/deep_active.png")

        # Open Selector again
        page.locator("form button").first.click()
        page.wait_for_selector("text=Chọn chế độ AI")

        # Click on "Misa Flash"
        page.click("text=Misa Flash")
        time.sleep(1)
        # Take screenshot of the Chat Input with Flash Icon active
        page.screenshot(path="verification/flash_active.png")
        print("Screenshot taken: verification/flash_active.png")

        browser.close()

if __name__ == "__main__":
    verify_icons()
