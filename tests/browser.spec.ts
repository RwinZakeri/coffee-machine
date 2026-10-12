import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function navigateToProgress(page: Page, progress: number): Promise<void> {
  await page.evaluate((value) => {
    const journey = document.getElementById("assembly-journey")!;
    window.scrollTo({
      top: journey.offsetTop + (journey.offsetHeight - window.innerHeight) * value,
      behavior: "instant",
    });
  }, progress);
  await expect.poll(async () => Number(await page.getByRole("slider", { name: "Assembly progress" }).inputValue()))
    .toBeCloseTo(progress * 1000, -1);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

function observeBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => { errors.push(error.message); console.warn(`[browser-error] ${error.message}`); });
  page.on("console", (message) => {
    if (message.type() === "error") { errors.push(message.text()); console.warn(`[browser-console] ${message.text()}`); }
  });
  return errors;
}

async function waitForMachine(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const qaWindow = window as unknown as { __qaDrawCount: number };
    qaWindow.__qaDrawCount = 0;
    const qaPrototype = WebGL2RenderingContext.prototype as unknown as Record<string, (...args: unknown[]) => unknown>;
    for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
      const original = qaPrototype[name];
      qaPrototype[name] = function (...args: unknown[]) {
        qaWindow.__qaDrawCount += 1;
        return Reflect.apply(original, this, args);
      };
    }
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "SCROLL TO ASSEMBLE" })).toBeEnabled({ timeout: 90_000 });
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(() => page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(gl && !gl.isContextLost() && canvas.width > 0 && canvas.height > 0);
  }).catch(() => false)).toBe(true);
}

async function measureSoftwareScroll(page: Page) {
  return page.evaluate(async () => {
    const qaWindow = window as unknown as { __qaDrawCount: number };
    const journey = document.getElementById("assembly-journey")!;
    const canvas = document.querySelector("canvas")!;
    const gl = canvas.getContext("webgl2")!;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    const intervalMs: number[] = [];
    let previousTime = 0;
    let firstTime = 0;
    let renderedIntervals = 0;
    let previousDraws = qaWindow.__qaDrawCount;
    const firstDraws = previousDraws;
    const durationMs = await new Promise<number>((resolve) => {
      function frame(time: number) {
        if (!firstTime) firstTime = time;
        if (previousTime) {
          intervalMs.push(time - previousTime);
          if (qaWindow.__qaDrawCount > previousDraws) renderedIntervals += 1;
        }
        previousDraws = qaWindow.__qaDrawCount;
        previousTime = time;
        const elapsed = time - firstTime;
        const progress = .12 + .83 * Math.min(1, elapsed /3000);
        window.scrollTo({ top: journey.offsetTop + (journey.offsetHeight - innerHeight) * progress, behavior: "instant" });
        if (elapsed >= 3000) resolve(elapsed);
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    const sorted = [...intervalMs].sort((a, b) => a - b);
    return {
      environment: "Headless local Chrome with ANGLE SwiftShader; software renderer, not a device benchmark",
      renderer,
      durationMs,
      rafIntervals: intervalMs.length,
      intervalsWithWebGLDraws: renderedIntervals,
      webGLDrawCalls: qaWindow.__qaDrawCount - firstDraws,
      medianIntervalMs: sorted[Math.floor(sorted.length /2)] ?? null,
      p95IntervalMs: sorted[Math.floor((sorted.length -1) * .95)] ?? null,
      maxIntervalMs: sorted.at(-1) ?? null,
      measuredRafHz: intervalMs.length *1000 /durationMs,
      measuredRenderedIntervalHz: renderedIntervals *1000 /durationMs,
      viewport: { width: innerWidth, height: innerHeight },
      drawingBuffer: { width: canvas.width, height: canvas.height },
      contextLost: gl.isContextLost(),
    };
  });
}

test("five checkpoints, native scroll reversibility and local asset loading", async ({ page }, testInfo) => {
  const errors = observeBrowserErrors(page);
  const assetRequests: string[] = [];
  page.on("request", (request) => {
    if (/\.(glb|gltf)(\?|$)/.test(request.url())) assetRequests.push(request.url());
  });
  await waitForMachine(page);
  await expect(page.getByRole("heading", { name: /The anatomy\s*of\s*espresso\./i })).toBeVisible();
  const screenshots = path.resolve("artifacts", "qa", testInfo.project.name);
  await mkdir(screenshots, { recursive: true });

  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    await navigateToProgress(page, progress);
    await expect(page.getByRole("alert")).toHaveCount(0);
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(horizontalOverflow).toBe(false);
    await page.screenshot({ path: path.join(screenshots, `${String(progress * 100).padStart(3, "0")}.png`) });
    if (progress === 1) await expect(page.getByRole("heading", { name: "LINEA PB", exact: true })).toBeVisible();
  }

  if (testInfo.project.name === "laptop-1440") {
    for (const progress of [.55, .58, .9, .915, .965]) {
      await navigateToProgress(page, progress);
      await expect(page.getByRole("alert")).toHaveCount(0);
      await page.screenshot({ path: path.join(screenshots, `detail-${Math.round(progress *1000)}.png`) });
    }
  }

  const finalRequestCount = assetRequests.length;
  for (const progress of [0.75, 0.5, 0.25, 0, 1, 0.5, 1]) await navigateToProgress(page, progress);
  const metrics = await measureSoftwareScroll(page);
  await writeFile(path.join(screenshots, "software-scroll-metrics.json"), JSON.stringify(metrics, null, 2));
  expect(metrics.contextLost).toBe(false);
  expect(metrics.webGLDrawCalls).toBeGreaterThan(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(assetRequests.length).toBe(finalRequestCount);
  expect(assetRequests.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("sources, chapter navigation and keyboard controls remain accessible", async ({ page }) => {
  const errors = observeBrowserErrors(page);
  await waitForMachine(page);
  const sources = page.getByRole("button", { name: "THE SOURCES" });
  await sources.click();
  const dialog = page.getByRole("dialog", { name: "Built on evidence." });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Official product specifications/ })).toHaveAttribute("href", /lamarzocco\.com/);
  await expect(dialog).toContainText("Missing internal systems");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(sources).toBeFocused();

  const nav = page.getByRole("navigation", { name: "Assembly chapters" });
  const toggle = nav.getByRole("button", { name: "CHAPTERS" });
  if (await toggle.isVisible()) await toggle.click();
  await nav.getByRole("button", { name: /Thermal heart/i }).click();
  await expect(page.locator(".chapter-copy")).toContainText("THERMAL HEART");
  await page.getByRole("slider", { name: "Assembly progress" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("heading", { name: "LINEA PB", exact: true })).toBeVisible();
  await navigateToProgress(page, .5);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "SCROLL TO ASSEMBLE", includeHidden: true })).toBeEnabled({ timeout: 90_000 });
  await expect.poll(async () => Number(await page.getByRole("slider", { name: "Assembly progress" }).inputValue())).toBeCloseTo(500, -1);
  await expect(page.locator(".chapter-copy")).toContainText("EXTRACTION CORE");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("reduced motion retains real 3D and completed chapter navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = observeBrowserErrors(page);
  await waitForMachine(page);
  await expect(page.locator("#assembly-journey")).toHaveClass(/reduced-motion/);
  await navigateToProgress(page, 0.5);
  await expect(page.locator(".chapter-copy")).toContainText("EXTRACTION CORE");
  await navigateToProgress(page, 1);
  await expect(page.getByRole("heading", { name: "LINEA PB", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Replay assembly" }).click();
  await expect(page.getByRole("slider", { name: "Assembly progress" })).toHaveValue("0");
  await expect(page.getByRole("heading", { name: /The anatomy\s*of\s*espresso\./i })).toBeVisible();
  expect(errors).toEqual([]);
});
