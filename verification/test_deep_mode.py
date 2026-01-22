
from playwright.sync_api import sync_playwright
import time

def verify_deep_mode():
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
        page.wait_for_timeout(2000) # Wait for animation
        page.get_by_text("Trợ lý").click()

        # Wait for Assistant screen
        page.wait_for_selector("text=Trợ lý ảo Misa")

        # Open Model Selector. It's the button inside the form.
        # It's the first button in the form
        page.locator("form button").first.click()

        # Wait for Model Selector modal
        page.wait_for_selector("text=Chọn chế độ AI")

        # Click on "Misa Deep"
        page.click("text=Misa Deep")

        # Wait for modal to close
        time.sleep(1)

        # Take screenshot of the Chat Input with Deep Icon active
        # The input should now show the DeepIcon (Purple)
        page.screenshot(path="verification/deep_mode.png")

        print("Screenshot taken: verification/deep_mode.png")
        browser.close()

if __name__ == "__main__":
    verify_deep_mode()
