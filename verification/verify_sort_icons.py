from playwright.sync_api import sync_playwright, expect

def test_sort_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a mobile device to match the app layout
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        print("Navigating to app...")
        try:
            page.goto("http://localhost:5173", timeout=10000)

            # Wait for the Sort buttons to appear
            print("Waiting for sort buttons...")
            # The buttons have aria-label "Sort by Date" and "Sort by Price"
            date_sort_btn = page.get_by_label("Sort by Date")
            price_sort_btn = page.get_by_label("Sort by Price")

            # Use 'visible' instead of 'attached' to be sure
            date_sort_btn.wait_for(state='visible', timeout=10000)

            print("Taking screenshot 1: Default State (Date Desc)")
            page.screenshot(path="verification/1_default_date_desc.png")

            # Click Date Sort -> Toggle to Asc
            print("Clicking Date Sort...")
            date_sort_btn.click()
            # Wait for animation (roughly)
            page.wait_for_timeout(500)
            print("Taking screenshot 2: Date Asc")
            page.screenshot(path="verification/2_date_asc.png")

            # Click Price Sort -> Asc (Default for Price)
            print("Clicking Price Sort...")
            price_sort_btn.click()
            page.wait_for_timeout(500)
            print("Taking screenshot 3: Price Asc")
            page.screenshot(path="verification/3_price_asc.png")

            # Click Price Sort -> Toggle to Desc
            print("Clicking Price Sort...")
            price_sort_btn.click()
            page.wait_for_timeout(500)
            print("Taking screenshot 4: Price Desc")
            page.screenshot(path="verification/4_price_desc.png")

            print("Verification complete.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    test_sort_icons()
