
from playwright.sync_api import sync_playwright
import time

def verify_splash_screen():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Route requests to images to be slow
        def handle_route(route):
            if "tiny-shop" in route.request.url and ".png" in route.request.url:
                print(f"Delaying {route.request.url}")
                time.sleep(2)
            route.continue_()

        page.route("**/*.png", handle_route)

        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # Verify Splash Screen on Login
        print("Checking for splash screen on Login...")
        try:
            page.wait_for_selector("text=Đang tải...", state="visible", timeout=3000)
            print("SUCCESS: Splash screen detected on Login load.")
        except:
            print("FAILURE: Splash screen NOT detected on Login load.")
            raise

        # Wait for actual login screen (after image loads)
        print("Waiting for Login screen...")
        page.wait_for_selector("text=Đăng Nhập", timeout=10000)

        # Login
        print("Logging in...")
        page.fill("input[type='text']", "tiny-shop")  # Correct username
        page.fill("input[type='password']", "Believe93") # Correct password
        page.click("button:has-text('Đăng Nhập')")

        # Verify Splash Screen on Dashboard
        print("Checking for splash screen on Dashboard...")
        try:
            # We expect splash screen again because dashboard image (tiny-shop-transparent.png) is delayed
            page.wait_for_selector("text=Đang tải...", state="visible", timeout=5000)
            print("SUCCESS: Splash screen detected on Dashboard load.")
            page.screenshot(path="verification/splash_dashboard_visible.png")
        except:
            print("FAILURE: Splash screen NOT detected on Dashboard load.")
            page.screenshot(path="verification/failure_dashboard_splash.png")
            # If this fails, it might be because the image delay wasn't hit or it was too fast.
            # But with 2s delay, it should be caught.
            raise

        # Wait for dashboard
        try:
            page.wait_for_selector("text=Doanh thu", timeout=10000)
            print("Dashboard loaded.")
            page.screenshot(path="verification/dashboard_loaded.png")
        except:
             print("FAILURE: Dashboard did not load.")
             page.screenshot(path="verification/failure_dashboard_load.png")
             raise

        browser.close()

if __name__ == "__main__":
    verify_splash_screen()
