const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:4173');
    await page.waitForTimeout(1000);

    // Login
    const loginBtn = page.locator('button:has-text("Đăng Nhập")');
    if (await loginBtn.isVisible()) {
        await page.fill('input[type="text"]', 'admin');
        await page.fill('input[type="password"]', 'admin');
        await page.click('button:has-text("Đăng Nhập")');
        await page.waitForTimeout(2000); // Wait for transition to Dashboard
    }

    // Now navigate to Orders directly
    await page.goto('http://localhost:4173/orders');
    await page.waitForTimeout(2000);

    // Look for the time filter to open calendar
    const timeBtn = page.locator('button:has-text("Thời gian")');
    if (await timeBtn.isVisible()) {
        await timeBtn.click();
        await page.waitForTimeout(1000);
        console.log("Clicked 'Thời gian' button to open calendar");
    } else {
        console.log("Could not find 'Thời gian' button");
        // Screenshot fallback
        await page.screenshot({ path: 'verification_orders.png', fullPage: true });
    }

    // Now find the month/year button inside the calendar
    const monthYearBtn = page.locator('button', { hasText: /Tháng/ }).first();
    if (await monthYearBtn.isVisible()) {
        await monthYearBtn.click();
        await page.waitForTimeout(1000);
        console.log("Opened month/year picker");
    } else {
        console.log("Could not find month/year picker button");
    }

    // Screenshot
    await page.screenshot({ path: 'verification.png', fullPage: true });
    console.log('Screenshot saved to verification.png');
  } catch (error) {
    console.error('Error during Playwright script execution:', error);
  } finally {
    await browser.close();
  }
})();
