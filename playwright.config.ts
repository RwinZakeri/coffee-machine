import { defineConfig } from "@playwright/test";

const viewports = [
  { name: "desktop-1920", viewport: { width: 1920, height: 1080 } },
  { name: "laptop-1440", viewport: { width: 1440, height: 900 } },
  { name: "tablet-768", viewport: { width: 768, height: 1024 } },
  { name: "mobile-390", viewport: { width: 390, height: 844 } },
  { name: "mobile-360", viewport: { width: 360, height: 740 } },
];

export default defineConfig({
  testDir: "./tests",
  testMatch: "browser.spec.ts",
  timeout: 150_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "artifacts/qa/browser-results.json" }]],
  outputDir: "artifacts/qa/playwright",
  use: {
    baseURL: process.env.QA_BASE_URL ?? "http://127.0.0.1:5173",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--enable-unsafe-swiftshader", "--disable-gpu-watchdog"],
    },
  },
  projects: viewports.map((project) => ({ name: project.name, use: { viewport: project.viewport } })),
});
