from playwright.sync_api import sync_playwright, expect
import time
import json

def verify_assistant(page):
    page.goto("http://localhost:5173")

    # Inject Auth and Mock Data
    page.evaluate("""() => {
        sessionStorage.setItem('tini_auth', 'true');

        const products = [
            { id: 162123, name: "Áo thun Basic", price: 150000, stock: 10, purchaseLots: [] },
            { id: 162124, name: "Quần Jean", price: 300000, stock: 2, purchaseLots: [] }
        ];

        const todayStr = new Date().toLocaleDateString('en-CA');
        const orders = [
             { id: 17154321, date: todayStr + 'T10:00:00', total: 450000, items: [], status: 'completed' }
        ];

        localStorage.setItem('shop_products_v2', JSON.stringify(products));
        localStorage.setItem('shop_orders_v2', JSON.stringify(orders));

        // Prevent Backup Reminder (mark as checked)
        sessionStorage.setItem("hasCheckedBackup", "true");
    }""")

    page.reload()

    try:
        if page.get_by_text("Tiếp tục").is_visible(timeout=3000):
            page.get_by_text("Tiếp tục").click()
    except:
        pass

    page.wait_for_selector("text=Tổng quan", timeout=15000)

    # Check if modal is still there (Backup reminder might be persistent)
    try:
        if page.get_by_text("Sao lưu dữ liệu?").is_visible(timeout=2000):
            page.get_by_text("Để sau").click()
    except:
        pass

    # Navigate to Assistant
    page.locator("text=Trợ lý").click()

    expect(page.get_by_role("heading", name="Trợ lý ảo")).to_be_visible()

    # Test Chip
    page.get_by_text("Doanh thu hôm nay").click()
    expect(page.get_by_text("Doanh thu hôm nay là")).to_be_visible()

    # Test Search
    page.get_by_placeholder("Hỏi trợ lý ảo...").fill("Tìm quần jean")

    # Force click if needed or wait for overlay to be gone
    page.locator("button[type='submit']").click(force=True)

    expect(page.get_by_text("Quần Jean")).to_be_visible()

    page.screenshot(path="verification/assistant_complete.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_assistant(page)
        finally:
            browser.close()
