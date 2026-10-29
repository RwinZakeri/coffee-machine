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
  await expect(page).toHaveTitle(/The Anatomy of Espresso$/);
  await expect(page.locator("#opening-title")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/Linea PB|La Marzocco/i);
  const screenshots = path.resolve("artifacts", "qa", testInfo.project.name);
  await mkdir(screenshots, { recursive: true });

  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    await navigateToProgress(page, progress);
    await expect(page.getByRole("alert")).toHaveCount(0);
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(horizontalOverflow).toBe(false);
    await page.screenshot({ path: path.join(screenshots, `${String(progress * 100).padStart(3, "0")}.png`) });
    if (progress === 1) {
      await expect(page.locator(".final-copy h2")).toBeVisible();
      await expect(page.locator(".final-copy")).toContainText("23 COMPONENTS · 56 SOLIDS");
      await expect(page.locator(".footer-label")).toContainText("251 W × 399 H × 650 D MM");
      await expect.poll(() => page.evaluate(() => {
        const canvas = document.querySelector("canvas")!;
        const bounds = JSON.parse(canvas.dataset.subjectBounds ?? "[]") as number[];
        const copy = document.querySelector(".final-copy")!.getBoundingClientRect();
        const footer = document.querySelector(".experience-footer")!.getBoundingClientRect();
        const portrait = innerWidth < 700 || innerHeight > innerWidth;
        return bounds.length === 4 && bounds.every(Number.isFinite)
          && bounds[0] >= 0 && bounds[2] <= innerWidth
          && bounds[1] >= (portrait ? copy.bottom + 4 : 0)
          && bounds[3] <= footer.top;
      }), { message: "The complete machine must fit between portrait copy and the footer" }).toBe(true);
      await page.screenshot({ path: path.join(screenshots, "100.png") });
    }
  }

  if (testInfo.project.name === "laptop-1440") {
    for (const progress of [.205, .375, .555, .675, .865, .985]) {
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
  expect(assetRequests.every((url) => new URL(url).pathname.startsWith("/models/custom-espresso/"))).toBe(true);
  expect(assetRequests.some((url) => url.includes("/models/linea-pb/"))).toBe(false);
  expect(errors).toEqual([]);
});

test("chapter navigation and keyboard controls remain accessible", async ({ page }) => {
  const errors = observeBrowserErrors(page);
  await waitForMachine(page);
  const nav = page.getByRole("navigation", { name: "Assembly chapters" });
  await expect(nav.locator("ol > li")).toHaveCount(6);
  const toggle = nav.getByRole("button", { name: "CHAPTERS" });
  if (await toggle.isVisible()) await toggle.click();
  await nav.getByRole("button", { name: /Headgroup & lever/i }).click();
  await expect(page.locator(".chapter-copy")).toContainText("HEADGROUP & LEVER");
  await page.getByRole("slider", { name: "Assembly progress" }).focus();
  await page.keyboard.press("End");
  await expect(page.locator(".final-copy h2")).toBeVisible();
  await navigateToProgress(page, .5);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "SCROLL TO ASSEMBLE", includeHidden: true })).toBeEnabled({ timeout: 90_000 });
  await expect.poll(async () => Number(await page.getByRole("slider", { name: "Assembly progress" }).inputValue())).toBeCloseTo(500, -1);
  await expect(page.locator(".chapter-copy")).toContainText("HEADGROUP & LEVER");
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
  await expect(page.locator(".chapter-copy")).toContainText("HEADGROUP & LEVER");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __qaDrawCount: number }).__qaDrawCount)).toBeGreaterThan(0);
  await navigateToProgress(page, 1);
  await expect(page.locator(".final-copy h2")).toBeVisible();
  await page.getByRole("button", { name: "Replay assembly" }).click();
  await expect(page.getByRole("slider", { name: "Assembly progress" })).toHaveValue("0");
  await expect(page.locator("#opening-title")).toBeVisible();
  expect(errors).toEqual([]);
});

test("camera framing stays continuous across 88–89 percent and the final reveal", async ({ page }, testInfo) => {
  await waitForMachine(page);
  const sample = async (progress: number) => {
    await navigateToProgress(page, progress);
    await expect.poll(async () => {
      const rendered = Number(await page.locator("canvas").getAttribute("data-rendered-progress"));
      const displayed = await page.locator(".experience").evaluate((element: HTMLElement) => Number(element.style.getPropertyValue("--progress")));
      return Math.abs(rendered - displayed);
    }).toBeLessThan(.000001);
    return JSON.parse((await page.locator("canvas").getAttribute("data-subject-bounds"))!) as number[];
  };
  const difference = (a: number[], b: number[]) => Math.max(...a.map((value, axis) => Math.abs(value - b[axis])));
  const points = [.8799, .8801, .8859, .8861, .9949, .9951];
  const frames: number[][] = [];
  for (const progress of points) frames.push(await sample(progress));
  for (const [before, after] of [[0, 1], [2, 3], [4, 5]]) {
    expect(difference(frames[before], frames[after]), `Camera jumped at ${points[after] * 100}%`).toBeLessThan(1.5);
  }
  const screenshots = path.resolve("artifacts", "qa", testInfo.project.name);
  await mkdir(screenshots, { recursive: true });
  const before = await sample(.88);
  await page.screenshot({ path: path.join(screenshots, "transition-088.png") });
  const after = await sample(.89);
  await page.screenshot({ path: path.join(screenshots, "transition-089.png") });
  expect(difference(before, after)).toBeLessThan(12);
  for (const index of [5, 2, 0, 4, 1, 3]) expect(difference(await sample(points[index]), frames[index])).toBeLessThan(.1);
});
