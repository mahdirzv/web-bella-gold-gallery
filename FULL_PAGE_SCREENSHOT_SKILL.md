# Full-Page High-Resolution Screenshot Generation Skill

This skill documents the automated, production-grade workflow for generating **clean, full-height, high-DPI Retina screenshots** of dynamic web applications.

It handles **lazy-loaded media**, **RTL/LTR internationalization layout bounds**, **theme matrices**, and **toolbar stripping** for client-ready presentation assets.

---

## 🎯 Key Features

1. **Auto-Scrolled Lazy-Load Triggering**:
   Programs Headless Chrome to incrementally scroll down the page (`window.scrollBy(0, 250)`), triggering all `IntersectionObserver` callbacks, lazy-loaded product photography, dynamic fonts, and web assets into the render tree before capturing.

2. **Height Unbinding**:
   Overrides locked container CSS (`height: 100%` on `#dc-root` or single-viewport containers) to allow `document.body.scrollHeight` to expand to the full continuous vertical height of the site (over **10,000px** on mobile).

3. **Strict Viewport & RTL Layout Cropping**:
   Enforces exact viewport container bounds (`width: 390px` for mobile, `1440px` for desktop) with `overflow-x: hidden !important` to eliminate horizontal scroll gaps and off-canvas white spaces in Persian (RTL) or English (LTR) layouts.

4. **Clean Canvas Stripping**:
   Programmatically strips all design review controls, top toolbars, and image assignment overlays prior to snapshotting.

---

## 🛠️ Architecture & Script (`capture_perfect_full_height.js`)

```javascript
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const showcaseDir = path.join(__dirname, 'showcase');

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 250;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 50);
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Matrix configuration: Direction x Device x Theme x Language
  const variants = [
    { name: 'vintage-desktop-light-en', dir: 'Archive Heirloom', dev: 'Desktop', width: 1440, th: 'Light', lang: 'EN', bg: '#F3EBDD' },
    { name: 'vintage-desktop-dark-en', dir: 'Archive Heirloom', dev: 'Desktop', width: 1440, th: 'Dark', lang: 'EN', bg: '#15100D' },
    { name: 'vintage-mobile-light-en', dir: 'Archive Heirloom', dev: 'Mobile', width: 390, th: 'Light', lang: 'EN', bg: '#F3EBDD' },
    { name: 'vintage-mobile-dark-en', dir: 'Archive Heirloom', dev: 'Mobile', width: 390, th: 'Dark', lang: 'EN', bg: '#15100D' },
    { name: 'modern-desktop-light-en', dir: 'Precision Atelier', dev: 'Desktop', width: 1440, th: 'Light', lang: 'EN', bg: '#F1F3EF' },
    { name: 'modern-desktop-dark-en', dir: 'Precision Atelier', dev: 'Desktop', width: 1440, th: 'Dark', lang: 'EN', bg: '#0B0E0C' },
    { name: 'modern-mobile-light-en', dir: 'Precision Atelier', dev: 'Mobile', width: 390, th: 'Light', lang: 'EN', bg: '#F1F3EF' },
    { name: 'modern-mobile-dark-en', dir: 'Precision Atelier', dev: 'Mobile', width: 390, th: 'Dark', lang: 'EN', bg: '#0B0E0C' },
    // Farsi / Persian RTL variants
    { name: 'vintage-desktop-light-fa', dir: 'Archive Heirloom', dev: 'Desktop', width: 1440, th: 'Light', lang: 'فا', bg: '#F3EBDD' },
    { name: 'vintage-desktop-dark-fa', dir: 'Archive Heirloom', dev: 'Desktop', width: 1440, th: 'Dark', lang: 'فا', bg: '#15100D' },
    { name: 'vintage-mobile-light-fa', dir: 'Archive Heirloom', dev: 'Mobile', width: 390, th: 'Light', lang: 'فا', bg: '#F3EBDD' },
    { name: 'vintage-mobile-dark-fa', dir: 'Archive Heirloom', dev: 'Mobile', width: 390, th: 'Dark', lang: 'فا', bg: '#15100D' },
    { name: 'modern-desktop-light-fa', dir: 'Precision Atelier', dev: 'Desktop', width: 1440, th: 'Light', lang: 'فا', bg: '#F1F3EF' },
    { name: 'modern-desktop-dark-fa', dir: 'Precision Atelier', dev: 'Desktop', width: 1440, th: 'Dark', lang: 'فا', bg: '#0B0E0C' },
    { name: 'modern-mobile-light-fa', dir: 'Precision Atelier', dev: 'Mobile', width: 390, th: 'Light', lang: 'فا', bg: '#F1F3EF' },
    { name: 'modern-mobile-dark-fa', dir: 'Precision Atelier', dev: 'Mobile', width: 390, th: 'Dark', lang: 'فا', bg: '#0B0E0C' }
  ];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    await page.setViewport({ width: v.width, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://127.0.0.1:8085/Jewellery%20Design%20Directions.dc.html', { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);

    // Trigger state changes
    await page.evaluate((v) => {
      const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === txt || b.textContent.includes(txt));
      findBtn(v.dir)?.click();
      findBtn(v.dev)?.click();
      findBtn(v.th)?.click();
      findBtn(v.lang)?.click();
      findBtn('Homepage')?.click();
    }, v);

    await new Promise(r => setTimeout(r, 400));

    // Strip review controls and unbind height constraints
    await page.evaluate((bgHex, w) => {
      document.querySelector('[aria-label="Design review controls"]')?.remove();
      document.querySelector('[aria-label="Image assignment"]')?.remove();

      const style = document.createElement('style');
      style.textContent = `
        html, body, #dc-root, #dc-root > .sc-host {
          height: auto !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          background: ${bgHex} !important;
          overflow-x: hidden !important;
          width: ${w}px !important;
          max-width: ${w}px !important;
        }
        article[aria-label="Jewellery homepage design direction"] {
          margin: 0 !important;
          width: 100% !important;
          max-width: ${w}px !important;
          box-sizing: border-box !important;
        }
      `;
      document.head.appendChild(style);
    }, v.bg, v.width);

    // Auto-scroll to load lazy media and return to top
    await autoScroll(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));

    const filePath = path.join(showcaseDir, `${v.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
  }

  await browser.close();
})();
```

---

## 🚀 Execution Instructions

1. **Start local HTTP server**:
   ```bash
   python3 -m http.server 8085
   ```

2. **Run screenshot matrix script**:
   ```bash
   node capture_perfect_full_height.js
   ```

3. **Output Artifacts**:
   All rendered images will be generated in `showcase/` with exact Retina dimensions:
   - **Desktop Retina**: $2880 \times 7800\text{px}$
   - **Mobile Retina**: $780 \times 10800\text{px}$
