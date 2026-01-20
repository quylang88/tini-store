from playwright.sync_api import sync_playwright

def debug_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()
        try:
            page.goto("http://localhost:5173", timeout=30000)
            page.screenshot(path="verification/debug_screenshot.png")
            content = page.content()
            with open("verification/debug_source.html", "w") as f:
                f.write(content)
            print("Debug info saved.")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    debug_page()
