
import os
from playwright.sync_api import sync_playwright

def verify_modals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a context with storage state to simulate login or setup
        context = browser.new_context()

        # Add a script to run on page load to mock data in localStorage
        # This simulates the product data needed for the dashboard
        context.add_init_script("""
            const mockProducts = [
                { id: '1', name: 'Product A', price: 100000, cost: 80000, quantity: 10, category: 'Cat 1', image: '' },
                { id: '2', name: 'Product B', price: 200000, cost: 150000, quantity: 0, category: 'Cat 2', image: '' }, // Out of stock
                { id: '3', name: 'Product C', price: 300000, cost: 200000, quantity: 5, category: 'Cat 3', image: '' }
            ];

            // Mock authentication
            sessionStorage.setItem('tini_auth', 'true');

            // Mock offline dismissed to avoid alerts
            sessionStorage.setItem('offline_dismissed', 'true');

            // Note: In a real app, data might come from an API or other storage.
            // We assume the app handles data loading or we might need to intercept network requests.
            // For now, we'll try to rely on the app's default behavior or mock network if needed.
        """)

        page = context.new_page()

        try:
            # Navigate to the dashboard
            page.goto("http://localhost:8080/")

            # Wait for the dashboard to load (look for a key element)
            # Adjust selector based on actual content
            page.wait_for_timeout(5000) # Simple wait for initial load since we don't know exact selectors yet

            # Take a screenshot of the dashboard
            page.screenshot(path="verification/dashboard.png")
            print("Dashboard screenshot taken.")

            # Try to find and click buttons to open modals
            # Since we merged modals, we want to check if they still open correctly

            # 1. Out of Stock Modal
            # Look for "Hết hàng" metric card or similar.
            # Based on Dashboard.jsx: MetricCard label="Hết hàng"
            # We might need to mock data to ensure "Hết hàng" card appears.

            # If the "Hết hàng" card is visible, click it
            try:
                out_of_stock_card = page.locator("text=Hết hàng").first
                if out_of_stock_card.is_visible():
                    out_of_stock_card.click()
                    page.wait_for_timeout(1000)
                    page.screenshot(path="verification/out_of_stock_modal.png")
                    print("Out of Stock modal screenshot taken.")

                    # Close modal
                    page.locator("text=Đóng").click()
                    page.wait_for_timeout(500)
            except Exception as e:
                print(f"Could not verify Out of Stock modal: {e}")

            # 2. Inventory Warning Modal (Hàng tồn)
            try:
                inventory_warning_card = page.locator("text=Hàng tồn").first
                if inventory_warning_card.is_visible():
                    inventory_warning_card.click()
                    page.wait_for_timeout(1000)
                    page.screenshot(path="verification/inventory_warning_modal.png")
                    print("Inventory Warning modal screenshot taken.")

                    # Close modal
                    page.locator("text=Đóng").click()
                    page.wait_for_timeout(500)
            except Exception as e:
                print(f"Could not verify Inventory Warning modal: {e}")

             # 3. Top Profit/Quantity Modal
            try:
                # Assuming TopSellingSection has clickable tabs or similar to open modal
                # The code says "Modal mở khi người dùng chạm vào từng nhóm top để xem chi tiết."
                # We need to find the TopSellingSection area.
                # Let's try to click on a list item in the top selling section if available.

                # Try to find "Top lợi nhuận" header or similar
                top_profit_header = page.locator("text=Top lợi nhuận").first
                if top_profit_header.is_visible():
                    top_profit_header.click()
                    page.wait_for_timeout(1000)
                    page.screenshot(path="verification/top_profit_modal.png")
                    print("Top Profit modal screenshot taken.")

                     # Close modal
                    page.locator("text=Đóng").click()
                    page.wait_for_timeout(500)

            except Exception as e:
                print(f"Could not verify Top Profit modal: {e}")


        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_modals()
