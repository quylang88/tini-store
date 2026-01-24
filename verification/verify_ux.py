from playwright.sync_api import sync_playwright, expect
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. Go to page
    page.goto("http://localhost:5173")

    # 2. Inject session and data
    # Bypass login
    page.evaluate("sessionStorage.setItem('tini_auth', 'true')")

    # Inject an out-of-stock product to trigger the card
    product_data = [
        {
            "id": "p1",
            "name": "Test OutOfStock Product",
            "quantity": 0,
            "importPrice": 5000,
            "retailPrice": 10000,
            "category": "Test",
            "purchaseLots": []
        }
    ]
    page.evaluate(f"localStorage.setItem('shop_products_v2', JSON.stringify({json.dumps(product_data)}))")

    # 3. Reload to apply storage changes
    page.reload()

    # 4. Wait for dashboard and the specific card
    # The card text is "Hết hàng" (Out of Stock)
    # It should be clickable now

    # Finding the card that contains "Hết hàng"
    # MetricCard structure: div > div > span(label)
    # We are looking for the parent div

    # Let's find by text "Hết hàng" and get the parent's parent (or the clickable container)
    # Better: get_by_role("button", name="Hết hàng") is what we EXPECT if our change works!
    # However, the button role is on the container, and the label is inside.
    # Accessible name calculation might include the label and the value.

    # Let's try to find it by text first, then check attributes.
    card_label = page.get_by_text("Hết hàng")
    expect(card_label).to_be_visible()

    # If the parent has role="button", playwright can find it.
    # The card content is "Hết hàng" and the value "1".
    # So accessible name might be "Hết hàng 1".

    button = page.get_by_role("button", name="Hết hàng") # This matches if the text inside is part of the name
    expect(button).to_be_visible()

    print("Found accessible button with name 'Hết hàng'")

    # 5. Take screenshot
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
