
import time
from playwright.sync_api import sync_playwright

def verify_alignment(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Inject auth
    page.evaluate("sessionStorage.setItem('tini_auth', 'true')")
    page.reload()
    page.wait_for_timeout(2000)

    # Navigate to Settings
    settings_link = page.get_by_text("Cài đặt")
    if settings_link.is_visible():
        settings_link.click()

    page.wait_for_timeout(1000)

    # Locate the Currency Configuration section
    # Text "Cấu hình Tiền tệ"
    # Take screenshot of that area

    section = page.get_by_text("Cấu hình Tiền tệ").locator("..").locator("..")
    # We want to capture the input and button below it.
    # The section content seems to be siblings or children.
    # Let's just screenshot the upper part of the page.

    page.screenshot(path="verification/alignment_before.png", clip={"x": 0, "y": 0, "width": 600, "height": 400})

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 400, "height": 800})
        try:
            verify_alignment(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
