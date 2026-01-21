
from playwright.sync_api import sync_playwright, expect
import time
import json

def verify_assistant_with_api(page):
    page.goto("http://localhost:5173")

    # Inject Auth and Mock Data AND API KEY
    page.evaluate("""() => {
        sessionStorage.setItem('tini_auth', 'true');
        sessionStorage.setItem('hasCheckedBackup', 'true'); // Prevent modal

        const products = [
            { id: 162123, name: "Áo thun Basic", price: 150000, stock: 10, purchaseLots: [] },
            { id: 162124, name: "Quần Jean", price: 300000, stock: 2, purchaseLots: [] }
        ];

        const todayStr = new Date().toLocaleDateString('en-CA');
        const orders = [
             { id: 17154321, date: todayStr + 'T10:00:00', total: 450000, items: [], status: 'completed' }
        ];

        // Mock Settings with API Key
        const settings = {
            exchangeRate: 170,
            categories: ["Chung"],
            aiApiKey: "fake_api_key_for_testing_ui_flow"
        };

        localStorage.setItem('shop_products_v2', JSON.stringify(products));
        localStorage.setItem('shop_orders_v2', JSON.stringify(orders));
        localStorage.setItem('shop_settings', JSON.stringify(settings));
    }""")

    page.reload()

    # Handle Splash
    try:
        if page.get_by_text("Tiếp tục").is_visible(timeout=3000):
            page.get_by_text("Tiếp tục").click()
    except:
        pass

    page.wait_for_selector("text=Tổng quan", timeout=15000)

    # Navigate to Settings to verify Key is loaded
    page.locator("text=Cài đặt").click()
    # Check password field has value (placeholder is hidden if value exists)
    # Value retrieval via JS
    key_val = page.locator("input[type='password']").input_value()
    assert key_val == "fake_api_key_for_testing_ui_flow", f"API Key not loaded in Settings. Got: {key_val}"

    # Navigate to Assistant using get_by_role to be specific (avoiding Settings text conflict)
    # page.locator("text=Trợ lý").click() might find "Cấu hình Trợ lý AI" in Settings page.
    # We want the TabBar button. The TabBar is fixed bottom.
    # We can assume the TabBar button has specific structure.
    # Or just use get_by_role('button', name='Trợ lý')

    page.get_by_role("button", name="Trợ lý").click()

    # Mock network request to Gemini to avoid real failure
    # We intercept https://generativelanguage.googleapis.com/...

    page.route("**/*generativelanguage.googleapis.com/**/*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": "Chào bạn, đây là câu trả lời từ Mock Gemini API!"
                    }]
                }
            }]
        })
    ))

    # Send a query
    page.get_by_placeholder("Hỏi trợ lý ảo...").fill("Chào AI")
    page.locator("button[type='submit']").click()

    # Expect the Mock API response
    expect(page.get_by_text("Chào bạn, đây là câu trả lời từ Mock Gemini API!")).to_be_visible()

    page.screenshot(path="verification/assistant_api_integration.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_assistant_with_api(page)
        finally:
            browser.close()
