import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const chrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = path.resolve("docs/screenshots");
const pages = [
  ["timing.png", "http://localhost:3000/", "dark"],
  ["timing-light.png", "http://localhost:3000/", "light"],
  ["standings.png", "http://localhost:3000/standings", "dark"],
  ["results.png", "http://localhost:3000/results", "dark"],
  ["calendar.png", "http://localhost:3000/calendar", "dark"],
  ["predict.png", "http://localhost:3000/predict", "dark"],
];

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--hide-scrollbars", "--disable-gpu"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  for (const [file, url, theme] of pages) {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
    await page.waitForSelector("h1", { timeout: 15_000 });
    await page.evaluate((next) => {
      const root = document.documentElement;
      root.setAttribute("data-theme", next);
      root.style.colorScheme = next;
      localStorage.setItem("gridwatch-theme", next);
      window.dispatchEvent(new Event("gridwatch-theme"));
    }, theme);
    await page.addStyleTag({
      content:
        "nextjs-portal, [data-next-badge-root], #nextjs__container { display: none !important; }",
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
    const dest = path.join(outDir, file);
    await page.screenshot({ path: dest, type: "png", fullPage: false });
    console.log("wrote", dest);
  }
} finally {
  await browser.close();
}
