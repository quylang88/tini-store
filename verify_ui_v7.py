import os
import sys
import asyncio
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 375, 'height': 812},
            device_scale_factor=1,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        )

        # Inject auth and mock data
        await context.add_init_script("""
            sessionStorage.setItem('tini_auth', 'true');
            const mockProducts = [
                {id: '1', name: 'Sản phẩm A', price: 100000, quantity: 100, category: 'Chung', warehouse: 'Vĩnh Phúc', lots: [{id: 'l1', quantity: 50, warehouse: 'Vĩnh Phúc'}, {id: 'l2', quantity: 50, warehouse: 'Lâm Đồng'}]},
                {id: '2', name: 'Sản phẩm B', price: 200000, quantity: 50, category: 'Áo', warehouse: 'Lâm Đồng', lots: [{id: 'l3', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l4', quantity: 20, warehouse: 'Lâm Đồng'}]},
                {id: '3', name: 'Sản phẩm C', price: 300000, quantity: 50, category: 'Quần', warehouse: 'Vĩnh Phúc', lots: [{id: 'l5', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l6', quantity: 20, warehouse: 'Lâm Đồng'}]},
                {id: '4', name: 'Sản phẩm D', price: 400000, quantity: 50, category: 'Mũ', warehouse: 'Vĩnh Phúc', lots: [{id: 'l7', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l8', quantity: 20, warehouse: 'Lâm Đồng'}]},
                {id: '5', name: 'Sản phẩm E', price: 500000, quantity: 50, category: 'Giày', warehouse: 'Vĩnh Phúc', lots: [{id: 'l9', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l10', quantity: 20, warehouse: 'Lâm Đồng'}]},
                {id: '6', name: 'Sản phẩm F', price: 600000, quantity: 50, category: 'Chung', warehouse: 'Vĩnh Phúc', lots: [{id: 'l11', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l12', quantity: 20, warehouse: 'Lâm Đồng'}]},
                {id: '7', name: 'Sản phẩm G', price: 700000, quantity: 50, category: 'Chung', warehouse: 'Vĩnh Phúc', lots: [{id: 'l13', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l14', quantity: 20, warehouse: 'Lâm Đồng'}]},
                {id: '8', name: 'Sản phẩm H', price: 800000, quantity: 50, category: 'Chung', warehouse: 'Vĩnh Phúc', lots: [{id: 'l15', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l16', quantity: 20, warehouse: 'Lâm Đồng'}]},
                {id: '9', name: 'Sản phẩm I', price: 900000, quantity: 50, category: 'Chung', warehouse: 'Vĩnh Phúc', lots: [{id: 'l17', quantity: 30, warehouse: 'Vĩnh Phúc'}, {id: 'l18', quantity: 20, warehouse: 'Lâm Đồng'}]},
            ];
            localStorage.setItem('shop_products_v2', JSON.stringify(mockProducts));
            localStorage.setItem('shop_settings', JSON.stringify({
                autoBackupInterval: 7,
                categories: ['Chung', 'Áo', 'Quần', 'Mũ', 'Giày', 'Mỹ phẩm', 'Thực phẩm']
            }));
        """)

        page = await context.new_page()

        try:
            print("Navigating to Home...")
            await page.goto("http://localhost:5173/")

            # Dismiss 'Sao lưu dữ liệu' modal if it appears
            try:
                close_button = page.locator("button:has-text('Đóng'), button:has-text('Để sau')").first
                if await close_button.is_visible(timeout=2000):
                    await close_button.click()
                    print("Dismissed Backup Modal")
            except:
                pass

            print("Clicking 'NHẬP KHO'...")
            await page.click("text=NHẬP KHO")

            # Wait for Inventory Search Bar to confirm we are on Inventory screen
            # The search bar has placeholder "Nhập tên hoặc quét mã sản phẩm..."
            await page.wait_for_selector("input[placeholder*='Nhập tên']", timeout=5000)
            print("Inventory loaded")

            # Screenshot 1: Top of Inventory
            await page.screenshot(path="/home/jules/verification/09_inventory_top_v7.png")
            print("Captured 09_inventory_top_v7.png")

            # Scroll 150px
            await page.evaluate("""
                const container = document.querySelector('div.overflow-y-auto');
                if (container) container.scrollBy(0, 150);
            """)
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/10_inventory_scroll_150_v7.png")
            print("Captured 10_inventory_scroll_150_v7.png")

            # Scroll another 200px (Total 350px).
            await page.evaluate("""
                const container = document.querySelector('div.overflow-y-auto');
                if (container) container.scrollBy(0, 200);
            """)
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/11_inventory_scroll_350_v7.png")
            print("Captured 11_inventory_scroll_350_v7.png")

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="/home/jules/verification/error_v7.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
