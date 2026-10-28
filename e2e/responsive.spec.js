import { test, expect } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test("layout utilizável em " + width + "px", async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.goto("./");
    await expect(page.locator("main").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const measurements = await page.evaluate(() => {
      const fields = [...document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea')]
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
      return {
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        fields: fields.map(el => {
          const rect = el.getBoundingClientRect();
          return { name: el.id || el.name, left: rect.left, right: rect.right, font: parseFloat(getComputedStyle(el).fontSize) };
        })
      };
    });
    expect(measurements.scroll, "a página não deve exigir rolagem horizontal").toBeLessThanOrEqual(measurements.width + 1);
    for (const field of measurements.fields) {
      expect(field.left, field.name).toBeGreaterThanOrEqual(-1);
      expect(field.right, field.name).toBeLessThanOrEqual(width + 1);
      if (width <= 600) expect(field.font, field.name + " deve evitar zoom automático").toBeGreaterThanOrEqual(16);
    }
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    expect(await focused.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
  });
}
