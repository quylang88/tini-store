
import time
from playwright.sync_api import sync_playwright

def verify_restore_button(page):
    # Navigate to the Settings screen
    # Since the app might start on Login or another screen, we might need to navigate.
    # Assuming local dev server is on port 5173
    page.goto("http://localhost:5173")

    # Wait for the app to load
    page.wait_for_timeout(2000)

    # If login is required (based on memory, authentication might be needed),
    # we might need to bypass it or perform login.
    # Memory says: Inject `tini_auth` set to `"true"` into `sessionStorage`.

    page.evaluate("sessionStorage.setItem('tini_auth', 'true')")
    page.reload()
    page.wait_for_timeout(2000)

    # Navigate to Settings. Assuming there is a navigation bar or button.
    # Looking at AppHeader or TabBar might give a clue, but let's try to find a settings button.
    # Or navigate directly if possible? No, it's SPA.
    # Usually Settings is in the TabBar or a Menu.

    # Let's try to find a "Cài đặt" or "Settings" link/button.
    # Or maybe it's the last tab?
    # Let's dump the text content to see where we are.

    # Actually, the user mentioned Settings.jsx.
    # Let's try to click on a cog icon or "Cài đặt" text.

    # Find element with text "Cài đặt"
    settings_link = page.get_by_text("Cài đặt")
    if settings_link.is_visible():
        settings_link.click()
    else:
        # Maybe an icon?
        # Try to find an SVG with cog or similar?
        pass

    page.wait_for_timeout(1000)

    # Scroll down to "Khôi Phục Dữ Liệu"
    # It's inside a label with text "Khôi Phục Dữ Liệu"
    restore_btn = page.get_by_text("Khôi Phục Dữ Liệu")
    restore_btn.scroll_into_view_if_needed()

    # Simulate mouse down (active state)
    box = restore_btn.bounding_box()
    if box:
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        # Take screenshot while mouse is down
        page.screenshot(path="verification/restore_button_active.png")
        page.mouse.up()

    # Also take a normal screenshot for comparison
    page.mouse.move(0,0)
    page.screenshot(path="verification/restore_button_normal.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_restore_button(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
