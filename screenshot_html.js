import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///home/jules/verification/screenshots/test_hdsd.html');
  await page.screenshot({ path: '/home/jules/verification/screenshots/hdsd_preview.png', fullPage: true });
  await browser.close();
})();
