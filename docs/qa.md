# Quality assurance

## Automated checks

The assembly test suite validates exact initial and final transforms, forward/backward and random seeking, quaternion normalization, constant physical scale, dependency integrity, camera boundaries and clearance from the nominal machine envelope. It checks all 142 extracted CAD nodes against the source asset index and the merged 154-part runtime manifest against chapter timings. Catalog-constrained dimensions are checked for the reconstructed lower brew-group stacks. A shared-pivot test verifies that independently addressable accessory leaves retain constant separation during rigid translation and rotation.

Run `npm test` or `node --import tsx --test tests/assembly.test.ts`. These checks validate deterministic animation, not the engineering accuracy of missing or reconstructed geometry.

The Playwright suite targets local Google Chrome with ANGLE's software WebGL renderer. It checks native scroll progress, forward/reverse jumps, model loading, horizontal overflow, chapter navigation, keyboard controls, the evidence dialog, intermediate-scroll refresh restoration and reduced-motion presentation. A loaded WebGL context is required; a screenshot alone does not count as a successful 3D test. Alerts and graphics-context losses fail checkpoint checks.

Start the application with `npm run dev -- --host 127.0.0.1`, then run `npx playwright test`. Set `QA_BASE_URL` if the server uses a different address. The browser suite deliberately does not start a server on its own.

## Capture matrix

Screenshots are saved at progress 0%, 25%, 50%, 75% and 100% for the following viewports:

| Viewport | Project | Purpose |
| --- | --- | --- |
| 1920 × 1080 | desktop-1920 | Wide product composition |
| 1440 × 900 | laptop-1440 | Standard desktop framing |
| 768 × 1024 | tablet-768 | Portrait tablet composition |
| 390 × 844 | mobile-390 | Contemporary mobile viewport |
| 360 × 740 | mobile-360 | Constrained mobile layout |

Outputs are written below `artifacts/qa/`, with browser results in `browser-results.json`. Failure screenshots and traces are retained in `artifacts/qa/playwright/`.

The laptop project also captures detail progress 0.55, 0.58, 0.90, 0.915 and 0.965 in `detail-550.png`, `detail-580.png`, `detail-900.png`, `detail-915.png` and `detail-965.png`. These inspect steam/hot-water staging, rear-panel closure, accessory locking and views beyond the final camera angle.

## Results and limitations

The stable production baseline at `http://127.0.0.1:4173` passed **15 of 15 browser checks** across all five viewports. All 25 required checkpoint screenshots were produced. No browser console errors, repeated chapter-transition model fetches or graphics-context losses occurred. Evidence-dialog escape/focus behavior, chapter controls, keyboard range navigation, intermediate-scroll refresh restoration and reduced-motion presentation passed.

Visual review confirmed the dark opening, readable mobile copy and complete available exterior in the desktop/laptop/mobile final views. It found a portrait-tablet defect at 768 × 1024: desktop camera framing cropped the machine and overlapped the final copy. That defect requires a targeted portrait-camera/layout recheck after the responsive fix; the baseline assertion pass alone does not establish visual acceptance.

The engine/catalog suite currently passes **16 of 16 checks**. Passing tests do not establish full component availability, OEM internal placement, complete mechanical clearance or redistribution rights. The source audit and asset gap documentation govern those claims.

## Software-rendering sample

Each checkpoint project instruments WebGL draw calls and records animation-frame intervals during one continuous nominal 3-second scroll. Results are saved as `software-scroll-metrics.json` within each viewport's output directory. The renderer reported `ANGLE / Vulkan / SwiftShader Device`, a CPU-based software renderer.

| Viewport | Intervals with WebGL draws per second | Median animation-frame interval | Largest interval | Context lost |
| --- | ---: | ---: | ---: | --- |
| 1920 × 1080 | 1.28 | 183 ms | 2450 ms | No |
| 1440 × 900 | 1.21 | 83 ms | 2283 ms | No |
| 768 × 1024 | 1.42 | 50 ms | 1717 ms | No |
| 390 × 844 | 1.94 | 267 ms | 1200 ms | No |
| 360 × 740 | 2.28 | 250 ms | 1250 ms | No |

These short samples show high software-rendering cost and do not demonstrate the requested desktop/mobile frame-rate targets. Animation-frame timing includes CPU, browser scheduling and rendering; counting intervals containing draw calls is an approximation of rendered cadence. It is not a GPU timing measurement or an average FPS claim for users' devices. Real GPU desktop/mobile measurements, longer scroll profiling and memory tracing remain unverified.

Software WebGL helps verify rendering and layout in automation; it is not a representative GPU performance benchmark. The automatic suite explicitly enables SwiftShader and disables its GPU watchdog for this slow test environment. Real mobile browser and hardware measurements remain separate work.
