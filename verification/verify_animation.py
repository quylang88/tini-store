
from playwright.sync_api import sync_playwright
import time
import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173")
    except:
        browser.close()
        return

    page.evaluate("sessionStorage.setItem('tini_auth', 'true')")
    page.reload()

    try:
        page.wait_for_selector("text=Doanh thu", timeout=10000)
    except:
        browser.close()
        return

    # Click Previous
    page.locator("button:has-text('Tháng trước')").click()
    time.sleep(0.5) # Wait for animation mid-flight

    # Screenshot Transition
    page.screenshot(path="verification/dashboard_transition.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
