/* eslint-disable no-undef */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Benchmark image compression fallback with real file', async ({ page }) => {
  // Read the source file
  const imageUtilsPath = path.join(process.cwd(), 'src/utils/file/imageUtils.js');
  let imageUtilsContent = fs.readFileSync(imageUtilsPath, 'utf-8');

  // Replace export with window assignment
  imageUtilsContent = imageUtilsContent.replace('export const compressImage', 'window.compressImage');

  // Inject the code
  await page.addScriptTag({ content: imageUtilsContent });

  // Create a dummy large image file on disk
  const tempFilePath = path.join(process.cwd(), 'temp_large_image.jpg');
  // We can't easily create a valid JPEG without a library, but we can create a large text file
  // and rename it. However, the Image object might fail to decode it.
  // We need a valid image.
  // Let's generate one using the browser first, save it, then use it for the test.

  // 1. Generate valid JPEG in browser
  const base64Data = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 4000;
    canvas.height = 4000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 4000, 4000);
    ctx.fillStyle = 'red';
    for(let i=0; i<4000; i+=10) {
        ctx.fillRect(i, 0, 5, 4000);
    }
    return canvas.toDataURL('image/jpeg', 0.9);
  });

  // 2. Save to disk
  const base64Image = base64Data.split(';base64,').pop();
  fs.writeFileSync(tempFilePath, base64Image, {encoding: 'base64'});

  // 3. Setup input element in page
  await page.setContent('<input type="file" id="fileInput" />');

  // 4. Upload the file
  await page.setInputFiles('#fileInput', tempFilePath);

  // 5. Run benchmark
  const result = await page.evaluate(async () => {
    // Force fallback
    const originalCreateImageBitmap = window.createImageBitmap;
    const originalOffscreenCanvas = window.OffscreenCanvas;
    window.createImageBitmap = undefined;
    window.OffscreenCanvas = undefined;

    try {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        // Warmup
        await window.compressImage(file);

        // Benchmark
        const iterations = 5;
        const times = [];

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            const res = await window.compressImage(file);
            const end = performance.now();
            times.push(end - start);

            if (!res || !res.startsWith('data:image/jpeg;base64')) {
                throw new Error('Invalid output format');
            }
        }

        const average = times.reduce((a, b) => a + b, 0) / times.length;
        return { average, times, fileSize: file.size };

    } finally {
        window.createImageBitmap = originalCreateImageBitmap;
        window.OffscreenCanvas = originalOffscreenCanvas;
    }
  });

  console.log('Benchmark Result (Disk File):', result);

  // Cleanup
  fs.unlinkSync(tempFilePath);

  expect(result.average).toBeGreaterThan(0);
});
