from playwright.sync_api import sync_playwright, expect
import json

def test_modal_accessibility(page):
    print("Navigating to home...")
    page.goto("http://localhost:5173")

    # Check if we are at login
    try:
        if page.get_by_role("button", name="Đăng Nhập").is_visible(timeout=3000):
            print("Logging in...")
            page.get_by_placeholder("Nhập tài khoản...").fill("tinyshop")
            page.get_by_placeholder("Nhập mật khẩu...").fill("Misa@2024")
            page.get_by_role("button", name="Đăng Nhập").click()
    except:
        print("Login skipped")

    # Wait for Dashboard load
    page.wait_for_timeout(3000)

    # Seed data via localStorage
    print("Seeding data...")
    product = {
        "id": "test-product-1",
        "name": "Test Product A11y",
        "price": 100000,
        "quantity": 10,
        "category": "Test",
        "purchaseLots": []
    }

    page.evaluate(f"""() => {{
        localStorage.setItem('shop_products_v2', JSON.stringify([{json.dumps(product)}]));
    }}""")

    print("Reloading to apply data...")
    page.reload()
    page.wait_for_timeout(3000)

    # Handle Backup Modal if present
    print("Checking for blocking modals...")
    try:
        later_btn = page.get_by_role("button", name="Để sau")
        if later_btn.is_visible(timeout=3000):
             print("Dismissing Backup Reminder...")
             later_btn.click()
             page.wait_for_timeout(1000)
        else:
             print("No backup button visible")
    except Exception as e:
        print(f"Backup modal check warning: {e}")

    print("Navigating to Inventory (Nhập kho)...")
    # Using specific text selector for the tab
    page.get_by_text("Nhập kho").click()

    # Wait for product list
    page.wait_for_timeout(1000)

    print("Looking for delete button...")
    # The delete button has aria-label="Xoá [Name]"
    delete_btn = page.get_by_label("Xoá Test Product A11y")
    expect(delete_btn).to_be_visible()
    delete_btn.click()

    print("Checking modal accessibility...")
    dialog = page.get_by_role("dialog")
    expect(dialog).to_be_visible()
    expect(dialog).to_have_attribute("aria-modal", "true")

    # Verify aria-labelledby
    title_id = dialog.get_attribute("aria-labelledby")
    assert title_id, "Dialog missing aria-labelledby"

    title_el = page.locator(f"#{title_id}")
    expect(title_el).to_be_visible()
    # Confirm title text contains "Xoá"
    expect(title_el).to_contain_text("Xoá")

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/verification.png")
    print("Done!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_modal_accessibility(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise
        finally:
            browser.close()
